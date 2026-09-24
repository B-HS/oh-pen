import { afterEach, describe, expect, test } from 'bun:test'
import { mkdtemp, readlink, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { install } from './install.ts'
import { localAssets } from './assets.ts'
import { readManifest } from './fs.ts'
import { GOAL_COMMAND_ASSET, PLUGIN_ASSET, RUNTIME_ASSET, TUI_PLUGIN_ASSET } from './agent-contract.ts'
import { writeModelLine } from './models.ts'

const roots = new Set<string>()
const fixture = async () => {
    const root = await mkdtemp(join(tmpdir(), 'pen-install-test-'))
    roots.add(root)
    const assetsRoot = join(root, 'assets')
    const claudeRoot = join(root, 'claude')
    const shellProfile = join(root, '.zshenv')
    await Bun.write(join(assetsRoot, 'agents/review-pen.md'), await Bun.file('assets/agents/review-pen.md').text())
    await Bun.write(join(assetsRoot, PLUGIN_ASSET), 'export default { id: "test", setup: async () => {} }')
    await Bun.write(join(assetsRoot, TUI_PLUGIN_ASSET), 'export default { id: "test-tui", setup: () => {} }')
    await Bun.write(join(assetsRoot, GOAL_COMMAND_ASSET), 'Set goal')
    await Bun.write(join(assetsRoot, RUNTIME_ASSET), 'export const version = 1')
    await Bun.write(join(claudeRoot, 'CLAUDE.md'), 'Claude rules')
    await Bun.write(join(claudeRoot, 'commands/review.md'), 'Review')
    await Bun.write(join(claudeRoot, 'commands/llm-rules/verify.md'), 'Verify')
    return {
        root: join(root, 'config'),
        claudeRoot,
        shellProfile,
        assets: localAssets(assetsRoot),
        version: 'test',
        dryRun: false,
        force: false,
        skipBackup: false,
        answers: {
            modelMode: 'codex' as const,
            models: { 'review-pen': 'provider/model' },
            rootModel: undefined,
            hideBuiltins: true,
            adoptDefaultAgent: false,
            currentDefaultAgent: undefined,
            currentRootModel: undefined,
            preserveCurrentRootModel: false,
        },
    }
}
afterEach(async () => {
    await Promise.all([...roots].map((root) => rm(root, { recursive: true, force: true })))
    roots.clear()
})

describe('실행 도구 설치', () => {
    test('runtime을 에이전트와 함께 설치하고 manifest에 기록한다', async () => {
        const options = await fixture()
        await install(options)
        expect(await Bun.file(join(options.root, RUNTIME_ASSET)).exists()).toBe(true)
        expect(await Bun.file(join(options.root, PLUGIN_ASSET)).exists()).toBe(true)
        expect(await Bun.file(join(options.root, TUI_PLUGIN_ASSET)).exists()).toBe(true)
        expect(await Bun.file(join(options.root, GOAL_COMMAND_ASSET)).exists()).toBe(true)
        expect(await readlink(join(options.root, 'AGENTS.md'))).toBe(join(options.claudeRoot, 'CLAUDE.md'))
        expect(await readlink(join(options.root, 'commands/review.md'))).toBe(join(options.claudeRoot, 'commands/review.md'))
        expect(await readlink(join(options.root, 'commands/llm-rules/verify.md'))).toBe(join(options.claudeRoot, 'commands/llm-rules/verify.md'))
        expect(await Bun.file(options.shellProfile).text()).toContain('export OPENCODE_DISABLE_PROJECT_CONFIG=1')
        const manifest = await readManifest(join(options.root, 'oh-pencode/manifest.json'))
        expect(manifest?.files.map((file) => file.path)).toContain(RUNTIME_ASSET)
        expect(manifest?.files.map((file) => file.path)).toContain(PLUGIN_ASSET)
        expect(manifest?.models).toEqual({ 'review-pen': 'provider/model' })
    })
    test('업그레이드 시 사용자 모델과 수정한 runtime을 보존한다', async () => {
        const options = await fixture()
        await install(options)
        const agent = join(options.root, 'agents/review-pen.md')
        await Bun.write(agent, writeModelLine(await Bun.file(agent).text(), 'provider/custom#high'))
        await Bun.write(join(options.root, RUNTIME_ASSET), 'user change')
        const result = await install(options)
        expect(result.preserved).toContain(`${agent} model`)
        expect(await Bun.file(join(options.root, RUNTIME_ASSET)).text()).toBe('user change')
        expect((await readManifest(join(options.root, 'oh-pencode/manifest.json')))?.models['review-pen']).toBe('provider/custom#high')
    })
    test('dry-run은 실행 도구를 쓰지 않는다', async () => {
        const options = await fixture()
        await install({ ...options, dryRun: true })
        expect(await Bun.file(join(options.root, RUNTIME_ASSET)).exists()).toBe(false)
        expect(await Bun.file(join(options.root, PLUGIN_ASSET)).exists()).toBe(false)
        expect(await Bun.file(options.shellProfile).exists()).toBe(false)
    })

    test('관리 중인 이전 root model은 새 프로필로 올리고 사용자 변경은 보존한다', async () => {
        const options = await fixture()
        const configurationPath = join(options.root, 'opencode.jsonc')
        const first = {
            ...options,
            answers: { ...options.answers, rootModel: 'openai/old#high' },
        }
        await install(first)
        await install({
            ...options,
            answers: {
                ...options.answers,
                rootModel: 'openai/gpt-6-sol#xhigh',
                currentRootModel: 'openai/old#high',
                preserveCurrentRootModel: true,
            },
        })
        expect((await Bun.file(configurationPath).json()).model).toBe('openai/gpt-6-sol#xhigh')

        await Bun.write(configurationPath, JSON.stringify({ model: 'provider/custom#max' }))
        const preserved = await install({
            ...options,
            answers: {
                ...options.answers,
                rootModel: 'openai/gpt-6-sol#xhigh',
                currentRootModel: 'provider/custom#max',
                preserveCurrentRootModel: true,
            },
        })
        expect((await Bun.file(configurationPath).json()).model).toBe('provider/custom#max')
        expect(preserved.preserved).toContain(`${configurationPath} model`)
    })
})
