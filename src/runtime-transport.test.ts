import { describe, expect, test } from 'bun:test'
import { parseAgentFile } from './agent-contract.ts'
import { TaskContractSchema } from './runtime-contract.ts'
import { createOpenCodeTransport } from './runtime-transport.ts'

const CREATED_AT = 1
const COMPLETED_AT = 2
const task = TaskContractSchema.parse({
    version: 1,
    taskId: 'contract-test',
    agent: 'explore-pen',
    model: 'provider/vendor/model#high',
    goal: '조사',
    acceptanceCriteria: ['확인'],
    context: ['확인할 파일이 있습니다.'],
    ownedFiles: [],
    readFiles: [],
    nonGoals: ['변경'],
    instructions: ['읽기만 합니다.'],
    steps: ['조사합니다.'],
    checks: [],
})
const result = {
    taskId: 'contract-test',
    status: 'DONE',
    summary: '확인',
    completedCriteria: ['확인'],
    changedFiles: [],
    evidence: ['source'],
    verification: [],
    risks: [],
    decisionRequests: [],
}
const message = () => ({
    type: 'assistant',
    agent: task.agent,
    model: { providerID: 'provider', id: 'vendor/model', variant: 'high' },
    time: { created: CREATED_AT, completed: COMPLETED_AT },
    content: [{ type: 'text', text: JSON.stringify(result) }],
    finish: 'stop',
})

describe('OpenCode V2 실행 경계', () => {
    test('실제 V2 메시지 형태에서 결과를 추출하고 누락 사용량은 null로 둔다', async () => {
        const transport = createOpenCodeTransport('/tmp', async () => ({ stdout: JSON.stringify({ data: [message()], cursor: {} }), outputBytes: 1 }))
        const output = await transport.readResult(task, 'ses_test', CREATED_AT)
        expect(output.result).toEqual(result)
        expect(output.tokens).toBeNull()
        expect(output.cost).toBeNull()
    })
    test('이전 시도의 메시지나 다른 모델은 완료 근거로 사용하지 않는다', async () => {
        const transport = createOpenCodeTransport('/tmp', async () => ({ stdout: JSON.stringify({ data: [message()] }), outputBytes: 1 }))
        await expect(transport.readResult(task, 'ses_test', COMPLETED_AT)).rejects.toThrow('결과가 없습니다')
        const other = createOpenCodeTransport('/tmp', async () => ({
            stdout: JSON.stringify({ data: [{ ...message(), model: { providerID: 'other', id: 'model' } }] }),
            outputBytes: 1,
        }))
        await expect(other.readResult(task, 'ses_test', CREATED_AT)).rejects.toThrow('모델이 계약과 다릅니다')
    })
    test('설치되지 않은 역할과 변경된 권한을 실행 전에 거부한다', async () => {
        const transport = createOpenCodeTransport('/tmp', async () => ({ stdout: '[]', outputBytes: 1 }))
        await expect(transport.validateAgent(task)).rejects.toThrow('설치된 역할')
        const definition = parseAgentFile(await Bun.file('assets/agents/explore-pen.md').text())
        const altered = { ...definition, id: 'explore-pen', permissions: [{ action: '*', resource: '*', effect: 'allow' }] }
        const changed = createOpenCodeTransport('/tmp', async () => ({ stdout: JSON.stringify([altered]), outputBytes: 1 }))
        await expect(changed.validateAgent(task)).rejects.toThrow('권한 계약')
    })
    test('사용자 문맥을 셸 코드가 아닌 독립 인자로 전달하며 auto 승인을 붙이지 않는다', async () => {
        let received: string[] = []
        const transport = createOpenCodeTransport('/tmp', async (args) => {
            received = args
            return { stdout: '', outputBytes: 0 }
        })
        const prompt = '문맥: $(not-a-command); `literal`'
        await transport.runSession(task, 'ses_test', prompt, new AbortController().signal)
        expect(received.at(-1)).toBe(prompt)
        expect(received).toContain('provider/vendor/model#high')
        expect(received).toContain('--session')
        expect(received).not.toContain('--auto')
    })
})
