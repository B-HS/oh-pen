import { afterEach, describe, expect, test } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { AGENT_IDS, RUNTIME_ASSET, parseAgentFile } from './agent-contract.ts'
import { sha256 } from './fs.ts'
import { verifyInstallation } from './verify.ts'

const roots = new Set<string>()
const fixture = async () => {
    const root = await mkdtemp(join(tmpdir(), 'pen-verify-test-'))
    roots.add(root)
    const definitions = await Promise.all(
        AGENT_IDS.map(async (id) => {
            const content = await Bun.file(`assets/agents/${id}.md`).text()
            await Bun.write(join(root, `agents/${id}.md`), content)
            return { id, content, ...parseAgentFile(content) }
        }),
    )
    const runtime = 'runtime fixture'
    await Bun.write(join(root, RUNTIME_ASSET), runtime)
    const agents = [
        ...definitions.map(({ id, mode, permissions, steps }) => ({ id, mode, permissions, steps })),
        { id: 'build', hidden: true, permissions: [] },
        { id: 'plan', hidden: true, permissions: [] },
    ]
    for (const id of ['build', 'plan']) await Bun.write(join(root, `agents/${id}.md`), 'hidden')
    const files = [
        ...definitions.map(({ id, content }) => ({ path: `agents/${id}.md`, sha256: sha256(content), originSha256: sha256(content) })),
        ...['build', 'plan'].map((id) => ({ path: `agents/${id}.md`, sha256: sha256('hidden'), originSha256: sha256('hidden') })),
        { path: RUNTIME_ASSET, sha256: sha256(runtime), originSha256: sha256(runtime) },
    ]
    return { root, agents, manifest: { version: 'test', installedAt: new Date().toISOString(), files, models: {}, config: {} } }
}
afterEach(async () => {
    await Promise.all([...roots].map((root) => rm(root, { recursive: true, force: true })))
    roots.clear()
})

describe('설치 상태 검증', () => {
    test('실제 등록·권한·설치 파일이 일치하면 통과한다', async () => {
        expect((await verifyInstallation(await fixture())).ok).toBe(true)
    })
    test('파일만 있고 런타임 agent가 없으면 실패한다', async () => {
        const input = await fixture()
        const result = await verifyInstallation({ ...input, agents: input.agents.filter((agent) => agent.id !== 'sub-pen') })
        expect(result.ok).toBe(false)
        expect(result.checks.find((check) => check.name === 'sub-pen 등록')?.ok).toBe(false)
    })
    test('hidden 파일이 있어도 런타임에서 표시되면 실패한다', async () => {
        const input = await fixture()
        expect(
            (
                await verifyInstallation({
                    ...input,
                    agents: input.agents.map((agent) => (agent.id === 'build' ? { ...agent, hidden: false } : agent)),
                })
            ).ok,
        ).toBe(false)
    })
    test('설치 파일 변경을 해시로 감지한다', async () => {
        const input = await fixture()
        await Bun.write(join(input.root, 'agents/pen.md'), 'changed')
        expect((await verifyInstallation(input)).checks.find((check) => check.name === 'agents/pen.md sha256')?.ok).toBe(false)
    })
    test('중첩된 모델 ID를 정확히 비교하고 권한 override를 감지한다', async () => {
        const input = await fixture()
        const models = { 'review-pen': 'provider/vendor/model#high' }
        const agents = input.agents.map((agent) =>
            agent.id === 'review-pen' ? { ...agent, model: { providerID: 'provider', id: 'vendor/model', variant: 'high' } } : agent,
        )
        expect((await verifyInstallation({ ...input, agents, manifest: { ...input.manifest, models } })).ok).toBe(true)
        const modified = agents.map((agent) =>
            agent.id === 'review-pen'
                ? { ...agent, permissions: [...agent.permissions, { action: 'edit', resource: '*', effect: 'allow' as const }] }
                : agent,
        )
        expect((await verifyInstallation({ ...input, agents: modified, manifest: { ...input.manifest, models } })).ok).toBe(false)
    })
})
