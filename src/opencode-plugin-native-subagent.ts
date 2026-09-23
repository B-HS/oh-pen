import { z } from 'zod'
import { SessionIdSchema } from './runtime-contract.ts'
import type { TaskContract } from './runtime-contract.ts'

export const NativeSubagentInputSchema = z.strictObject({
    description: z.string().min(1),
    prompt: z.string().min(1),
    agent: z.string().min(1),
    sessionID: SessionIdSchema.optional(),
    background: z.boolean().optional(),
})

export const NativeSubagentMetadataSchema = z
    .object({
        sessionID: SessionIdSchema.optional(),
        sessionId: SessionIdSchema.optional(),
    })
    .passthrough()
    .refine((metadata) => metadata.sessionID !== undefined || metadata.sessionId !== undefined, 'native child session ID가 없습니다.')

export type NativeSubagentInput = z.infer<typeof NativeSubagentInputSchema>

export const createNativeSubagentInput = (task: TaskContract, prompt: string, childSessionId?: string): NativeSubagentInput => ({
    description: `pen ${task.taskId}`,
    prompt,
    agent: task.agent,
    ...(childSessionId ? { sessionID: SessionIdSchema.parse(childSessionId) } : {}),
})

export const nativeSubagentInputKey = (input: unknown) => {
    const actual = NativeSubagentInputSchema.parse(input)
    return JSON.stringify({ ...actual, background: undefined })
}

export const createNativeSubagentAttemptGuard = () => {
    const requiresRestage = new Set<string>()
    const consumedInputs = new Map<string, Set<string>>()
    return {
        stage: (parentSessionId: string) => requiresRestage.delete(parentSessionId),
        complete: (parentSessionId: string, input: unknown, outcome: 'success' | 'failure') => {
            const consumed = consumedInputs.get(parentSessionId) ?? new Set<string>()
            consumed.add(nativeSubagentInputKey(input))
            consumedInputs.set(parentSessionId, consumed)
            if (outcome === 'failure') requiresRestage.add(parentSessionId)
        },
        assertUnstagedCallAllowed: (parentSessionId: string, input: unknown) => {
            if (requiresRestage.has(parentSessionId))
                throw new Error('이 parent session의 이전 pen_subagent 호출이 실패했습니다. native 재시도 전에 pen_subagent를 다시 호출하세요.')
            if (consumedInputs.get(parentSessionId)?.has(nativeSubagentInputKey(input)))
                throw new Error('이미 사용한 pen_subagent 입력입니다. 새 작업은 새 계약으로 준비하세요.')
        },
    }
}

export const validateNativeSubagentInput = (input: unknown, expected: NativeSubagentInput) => {
    const actual = NativeSubagentInputSchema.parse(input)
    if (actual.background === true) throw new Error('pen_subagent 작업은 foreground native subagent로 실행해야 합니다.')
    if (nativeSubagentInputKey(actual) !== nativeSubagentInputKey(expected))
        throw new Error('native subagent 입력이 준비된 pen_subagent 계약과 다릅니다. 준비 결과의 nextInput을 그대로 사용하세요.')
    return actual
}

export const readNativeSubagentSessionId = (input: unknown) => {
    const metadata = NativeSubagentMetadataSchema.parse(input)
    return SessionIdSchema.parse(metadata.sessionID ?? metadata.sessionId)
}
