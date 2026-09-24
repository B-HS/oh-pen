import { afterEach, describe, expect, test } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { installClaudeCompatibility } from './claude-compat.ts'

const roots = new Set<string>()

afterEach(async () => {
    await Promise.all([...roots].map((root) => rm(root, { recursive: true, force: true })))
    roots.clear()
})

describe('Claude Code 호환 설정', () => {
    test('Claude rule이 없으면 project rule 비활성화를 적용하지 않는다', async () => {
        const root = await mkdtemp(join(tmpdir(), 'pen-claude-compat-test-'))
        roots.add(root)
        const shellProfile = join(root, '.zshenv')

        const result = await installClaudeCompatibility({
            configRoot: join(root, 'config'),
            claudeRoot: join(root, 'claude'),
            shellProfile,
            dryRun: false,
        })

        expect(result.links).toEqual([])
        expect(result.wroteShellProfile).toBe(false)
        expect(await Bun.file(shellProfile).exists()).toBe(false)
    })
})
