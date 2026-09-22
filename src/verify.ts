import { z } from 'zod'
import { AGENT_IDS, AgentSchema, permissionProbes, resolvePermission, RUNTIME_ASSET } from './agent-contract.ts'
import { readConfig, readDefaultAgent, readRootModel } from './config.ts'
import { exists, readManifest, sha256 } from './fs.ts'
import type { Manifest } from './fs.ts'
import { parseModelRef } from './models.ts'
import { configFile, configRoot, manifestFile } from './paths.ts'
import { executeBounded } from './runtime-transport.ts'
import { RUNTIME_LIMITS } from './runtime-contract.ts'
import { safeFile } from './runtime-state.ts'

type VerifyCheck = { name: string; ok: boolean; detail: string }

export const verifyInstallation = async (input: {
    root: string
    agents: z.infer<typeof AgentSchema>[]
    manifest: Manifest
    defaultAgent?: string
    rootModel?: string
}) => {
    const checks: VerifyCheck[] = []
    const byId = new Map(input.agents.map((agent) => [agent.id, agent]))
    for (const id of AGENT_IDS) {
        const agent = byId.get(id)
        checks.push({ name: `${id} 등록`, ok: agent !== undefined, detail: agent ? 'runtime 등록됨' : 'runtime 등록 누락' })
        const mode = id === 'pen' ? 'primary' : 'subagent'
        checks.push({ name: `${id} mode`, ok: agent?.mode === mode, detail: `기대: ${mode}, 실제: ${agent?.mode ?? '없음'}` })
        if (id !== 'pen') checks.push({ name: `${id} steps`, ok: agent?.steps === RUNTIME_LIMITS.maxSteps, detail: '역할 단계 상한' })
        if (id === 'pen') checks.push({ name: 'pen visible', ok: agent !== undefined && agent.hidden !== true, detail: '메인 에이전트 가시성' })
        const expected = input.manifest.models[id]
        if (expected) {
            const model = parseModelRef(expected)
            checks.push({
                name: `${id} model`,
                ok:
                    agent?.model?.providerID === model.providerID &&
                    agent?.model?.id === model.id &&
                    (model.variant === undefined || agent?.model?.variant === model.variant),
                detail: `기대: ${expected}`,
            })
        } else if (id !== 'pen') {
            checks.push({ name: `${id} inherit`, ok: agent !== undefined && agent.model == null, detail: '명시 모델 없는 상속 설정' })
        }
        for (const probe of permissionProbes(id)) {
            checks.push({
                name: `${id} ${probe.action} ${probe.resource}`,
                ok: agent !== undefined && resolvePermission(agent.permissions, probe.action, probe.resource) === probe.expected,
                detail: `기대: ${probe.expected}`,
            })
        }
        checks.push({ name: `${id} manifest`, ok: input.manifest.files.some((file) => file.path === `agents/${id}.md`), detail: '설치 자산 기록' })
    }
    for (const id of ['build', 'plan']) {
        if (!input.manifest.files.some((file) => file.path === `agents/${id}.md`)) continue
        checks.push({ name: `${id} hidden`, ok: byId.get(id)?.hidden === true, detail: 'runtime hidden=true 확인' })
    }
    for (const file of input.manifest.files) {
        const isSafe = /^(?:agents\/[a-z0-9-]+\.md|oh-pencode\/(?:runtime\.js|task\.schema\.json|result\.schema\.json))$/.test(file.path)
        let isMatch = false
        if (isSafe) {
            try {
                const target = await safeFile(input.root, file.path)
                isMatch = (await exists(target)) && sha256(await Bun.file(target).text()) === file.sha256
            } catch {
                isMatch = false
            }
        }
        checks.push({ name: `${file.path} sha256`, ok: isMatch, detail: isMatch ? '설치 시점과 일치' : '누락·변경·허용되지 않는 경로' })
    }
    checks.push({ name: 'runtime bundle', ok: input.manifest.files.some((file) => file.path === RUNTIME_ASSET), detail: '실행 도구 설치 기록' })
    if (input.manifest.config.defaultAgent !== undefined)
        checks.push({ name: 'default_agent', ok: input.defaultAgent === input.manifest.config.defaultAgent, detail: '설치 시 선택과 비교' })
    if (input.manifest.config.rootModel !== undefined)
        checks.push({ name: 'root model', ok: input.rootModel === input.manifest.config.rootModel, detail: '설치 시 선택과 비교' })
    return { checks, ok: checks.every((check) => check.ok) }
}

export const runVerify = async (options: { directory: string }) => {
    const manifest = await readManifest(manifestFile())
    if (!manifest) return { checks: [{ name: 'manifest', ok: false, detail: '설치 manifest가 없거나 올바르지 않습니다.' }], ok: false }
    try {
        const debug = await executeBounded(['opencode', 'debug', 'agents'], {
            directory: options.directory,
            timeoutMs: RUNTIME_LIMITS.stopTimeoutMs,
            maxOutputBytes: RUNTIME_LIMITS.maxOutputBytes,
        })
        const agents = z.array(AgentSchema).parse(JSON.parse(debug.stdout))
        const { value: config } = await readConfig(configFile())
        return verifyInstallation({ root: configRoot(), agents, manifest, defaultAgent: readDefaultAgent(config), rootModel: readRootModel(config) })
    } catch (error) {
        return { checks: [{ name: 'runtime', ok: false, detail: error instanceof Error ? error.message : '등록 정보 확인 실패' }], ok: false }
    }
}
