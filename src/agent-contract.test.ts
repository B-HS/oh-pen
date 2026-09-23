import { describe, expect, test } from 'bun:test'
import { AGENT_IDS, parseAgentFile, permissionProbes, resolvePermission } from './agent-contract.ts'
import { parseModelRef } from './models.ts'

describe('에이전트 권한 계약', () => {
    for (const id of AGENT_IDS) {
        test(`${id}의 실제 정의에서 금지 경계를 유지한다`, async () => {
            const definition = parseAgentFile(await Bun.file(`assets/agents/${id}.md`).text())
            for (const probe of permissionProbes(id))
                expect(resolvePermission(definition.permissions, probe.action, probe.resource)).toBe(probe.expected)
            if (id !== 'pen') expect(definition.steps).toBe(48)
        })
    }
    test('검증은 허용된 검사만 실행하고 자동 수정·임의 셸을 차단한다', async () => {
        const { permissions } = parseAgentFile(await Bun.file('assets/agents/verify-pen.md').text())
        for (const command of ['bun test', 'npm run typecheck', 'git diff --stat'])
            expect(resolvePermission(permissions, 'shell', command)).toBe('allow')
        for (const command of [
            'bun run lint --fix',
            'bun test -u',
            'bun -e code',
            'git merge main',
            'git tag tag',
            'curl example.org',
            'npm install',
        ])
            expect(resolvePermission(permissions, 'shell', command)).toBe('deny')
    })
    test('감사 도구는 자동 수정 옵션을 허용하지 않는다', async () => {
        const { permissions } = parseAgentFile(await Bun.file('assets/agents/security-pen.md').text())
        expect(resolvePermission(permissions, 'shell', 'npm audit --json')).toBe('allow')
        expect(resolvePermission(permissions, 'shell', 'npm audit fix --force')).toBe('deny')
    })
    test('제한 역할은 조회 shell만 허용한다', async () => {
        const agentIds = ['research-pen', 'explore-pen', 'doc-pen', 'verify-pen', 'security-pen', 'review-pen'] as const
        const allowedCommands = ['pwd', 'ls src', 'rg --files', 'cat README.md', 'head README.md', 'tail README.md', 'wc -l README.md', 'git diff --stat']
        const deniedCommands = [
            'python -c print(1)',
            'touch generated.txt',
            'git add README.md',
            'rg --pre "rm -rf dist" pattern',
            'git diff --ext-diff',
            'git diff --output=result.patch',
            'cat README.md > copied.md',
        ]
        for (const id of agentIds) {
            const { permissions } = parseAgentFile(await Bun.file(`assets/agents/${id}.md`).text())
            for (const command of allowedCommands) expect(resolvePermission(permissions, 'shell', command)).toBe('allow')
            for (const command of deniedCommands) expect(resolvePermission(permissions, 'shell', command)).toBe('deny')
        }
    })
    test('중첩 모델 ID와 variant를 보존한다', () => {
        expect(parseModelRef('openrouter/vendor/model#high')).toEqual({ providerID: 'openrouter', id: 'vendor/model', variant: 'high' })
        expect(() => parseModelRef('provider/model\npermissions: allow')).toThrow()
    })
})
