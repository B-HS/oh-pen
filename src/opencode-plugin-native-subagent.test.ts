import { describe, expect, test } from 'bun:test'
import {
    createNativeSubagentInput,
    createNativeSubagentAttemptGuard,
    nativeSubagentInputKey,
    readNativeSubagentSessionId,
    validateNativeSubagentInput,
} from './opencode-plugin-native-subagent.ts'
import { TaskContractSchema } from './runtime-contract.ts'

const contract = TaskContractSchema.parse({
    version: 1,
    taskId: 'plugin-native-task-test',
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

describe('OpenCode V2 plugin native subagent 경계', () => {
    test('준비된 계약을 native subagent 입력으로 변환한다', () => {
        expect(createNativeSubagentInput(contract, 'prompt')).toEqual({
            description: 'pen plugin-native-task-test',
            prompt: 'prompt',
            agent: 'explore-pen',
        })
        expect(createNativeSubagentInput(contract, 'prompt', 'ses_child')).toEqual({
            description: 'pen plugin-native-task-test',
            prompt: 'prompt',
            agent: 'explore-pen',
            sessionID: 'ses_child',
        })
    })

    test('계약과 다른 native subagent 입력 및 background 실행을 거부한다', () => {
        const expected = createNativeSubagentInput(contract, 'prompt')
        expect(() => validateNativeSubagentInput({ ...expected, prompt: 'changed' }, expected)).toThrow('계약과 다릅니다')
        expect(() => validateNativeSubagentInput({ ...expected, background: true }, expected)).toThrow('foreground')
        expect(validateNativeSubagentInput({ ...expected, background: false }, expected)).toMatchObject(expected)
        expect(nativeSubagentInputKey({ ...expected, background: false })).toBe(nativeSubagentInputKey(expected))
    })

    test('설치 버전별 metadata 키에서 native child session ID를 읽는다', () => {
        expect(readNativeSubagentSessionId({ sessionID: 'ses_current' })).toBe('ses_current')
        expect(readNativeSubagentSessionId({ sessionId: 'ses_legacy' })).toBe('ses_legacy')
        expect(() => readNativeSubagentSessionId({})).toThrow('native child session ID')
    })

    test('실패한 준비 호출의 무준비 재시도와 성공 입력의 중복 사용을 차단한다', () => {
        const guard = createNativeSubagentAttemptGuard()
        const first = createNativeSubagentInput(contract, 'first')
        const second = createNativeSubagentInput(contract, 'second')
        guard.stage('ses_parent')
        guard.complete('ses_parent', first, 'failure')
        expect(() => guard.assertUnstagedCallAllowed('ses_parent', second)).toThrow('pen_subagent를 다시 호출')
        guard.stage('ses_parent')
        expect(() => guard.assertUnstagedCallAllowed('ses_parent', first)).toThrow('이미 사용한')
        expect(guard.assertUnstagedCallAllowed('ses_parent', second)).toBeUndefined()
        guard.complete('ses_parent', second, 'success')
        expect(() => guard.assertUnstagedCallAllowed('ses_parent', second)).toThrow('이미 사용한')
    })
})
