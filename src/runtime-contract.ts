import { z } from 'zod'
import { ModelRefSchema, SPECIALIST_IDS } from './agent-contract.ts'

export const RUNTIME_LIMITS = {
    timeoutMs: 600_000,
    maxTimeoutMs: 3_600_000,
    maxAttempts: 2,
    maxConcurrent: 2,
    maxSteps: 48,
    maxOutputBytes: 1_048_576,
    maxFileBytes: 10_485_760,
    maxFiles: 10_000,
    pollMs: 250,
    stopTimeoutMs: 5_000,
} as const

export const TaskIdSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{0,79}$/)
export const isSensitivePath = (path: string) =>
    path.split('/').some((segment) => /^(?:\.env(?:\..*)?|secrets|id_rsa.*|id_ed25519.*)$|\.(?:pem|key)$/i.test(segment))
export const RelativeFileSchema = z
    .string()
    .min(1)
    .refine(
        (path) =>
            !path.startsWith('/') &&
            !path.includes('\\') &&
            !/[\x00-\x1f*?]/.test(path) &&
            !path.split('/').some((segment) => ['', '.', '..', '.git'].includes(segment)) &&
            !path.startsWith('.opencode/') &&
            !isSensitivePath(path),
        '프로젝트 내부의 비밀이 아닌 명시적 파일 경로만 허용합니다.',
    )
const TextSchema = z.string().trim().min(1)
const StringsSchema = z.array(TextSchema).min(1)
export const TaskContractSchema = z
    .strictObject({
        version: z.literal(1),
        taskId: TaskIdSchema,
        agent: z.enum(SPECIALIST_IDS),
        model: ModelRefSchema,
        goal: TextSchema,
        acceptanceCriteria: StringsSchema,
        context: StringsSchema,
        ownedFiles: z.array(RelativeFileSchema),
        readFiles: z.array(RelativeFileSchema),
        nonGoals: StringsSchema,
        instructions: StringsSchema,
        steps: StringsSchema,
        checks: z.array(z.strictObject({ command: z.array(TextSchema).min(1), expectation: TextSchema })),
        dependsOn: z.array(TaskIdSchema).default([]),
        evidenceKeys: z.array(TaskIdSchema).default([]),
        limits: z
            .strictObject({
                timeoutMs: z.number().int().positive().max(RUNTIME_LIMITS.maxTimeoutMs).default(RUNTIME_LIMITS.timeoutMs),
                maxAttempts: z.number().int().positive().max(RUNTIME_LIMITS.maxAttempts).default(RUNTIME_LIMITS.maxAttempts),
                maxConcurrent: z.number().int().positive().max(RUNTIME_LIMITS.maxConcurrent).default(RUNTIME_LIMITS.maxConcurrent),
                maxSteps: z.literal(RUNTIME_LIMITS.maxSteps).default(RUNTIME_LIMITS.maxSteps),
                maxOutputBytes: z.number().int().positive().max(RUNTIME_LIMITS.maxOutputBytes).default(RUNTIME_LIMITS.maxOutputBytes),
            })
            .prefault({}),
    })
    .superRefine((task, ctx) => {
        if (!['sub-pen', 'doc-pen'].includes(task.agent) && task.ownedFiles.length > 0)
            ctx.addIssue({ code: 'custom', message: '읽기 전용 역할은 소유 파일을 가질 수 없습니다.' })
        if (
            task.agent === 'doc-pen' &&
            task.ownedFiles.some((path) => !path.startsWith('docs/') || /^docs\/(PROCESS\.md|acknowledge\/|history\/)/.test(path))
        )
            ctx.addIssue({ code: 'custom', message: 'doc-pen은 상태·합의·이력 이외의 docs 파일만 수정합니다.' })
        if (task.dependsOn.includes(task.taskId)) ctx.addIssue({ code: 'custom', message: '자기 자신에게 의존할 수 없습니다.' })
    })

export const TaskResultSchema = z.strictObject({
    taskId: TaskIdSchema,
    status: z.enum(['DONE', 'PARTIAL', 'BLOCKED']),
    summary: TextSchema,
    completedCriteria: z.array(TextSchema),
    changedFiles: z.array(RelativeFileSchema),
    evidence: z.array(TextSchema),
    verification: z.array(z.strictObject({ command: z.array(TextSchema).min(1), exitCode: z.number().int(), summary: TextSchema })),
    risks: z.array(TextSchema),
    decisionRequests: z.array(TextSchema),
})

export const EvidenceInputSchema = z
    .strictObject({
        key: TaskIdSchema,
        kind: z.enum(['code', 'external']),
        topic: TextSchema,
        summary: TextSchema,
        files: z.array(RelativeFileSchema),
        sources: z.array(
            z.strictObject({ url: z.url().refine((url) => url.startsWith('https://')), version: TextSchema, checkedAt: z.iso.datetime() }),
        ),
        expiresAt: z.iso.datetime(),
    })
    .superRefine((item, ctx) => {
        if (item.kind === 'code' && item.files.length === 0) ctx.addIssue({ code: 'custom', message: '코드 근거에는 파일이 필요합니다.' })
        if (item.kind === 'external' && item.sources.length === 0)
            ctx.addIssue({ code: 'custom', message: '외부 근거에는 버전과 공식 출처가 필요합니다.' })
    })

export const SnapshotSchema = z.strictObject({
    head: z.string(),
    fingerprint: z.string(),
    files: z.record(z.string(), z.string()),
})
export const CheckpointSchema = z.strictObject({
    taskId: TaskIdSchema,
    contractHash: z.string(),
    contract: TaskContractSchema,
    status: z.enum(['RUNNING', 'DONE', 'PARTIAL', 'BLOCKED', 'FAILED', 'CANCELLED', 'TIMED_OUT', 'INTERRUPTED']),
    attempt: z.number().int().nonnegative(),
    runnerPid: z.number().int().positive(),
    sessionId: z
        .string()
        .regex(/^ses[a-zA-Z0-9_-]+$/)
        .optional(),
    snapshot: SnapshotSchema,
    startedAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    elapsedMs: z.number().nonnegative(),
    outputBytes: z.number().nonnegative(),
    steps: z.number().int().nonnegative(),
    tokens: z.number().nonnegative().nullable(),
    cost: z.number().nonnegative().nullable(),
    result: TaskResultSchema.optional(),
    reason: z.string().optional(),
})
export type TaskContract = z.infer<typeof TaskContractSchema>
export type TaskResult = z.infer<typeof TaskResultSchema>
export type Checkpoint = z.infer<typeof CheckpointSchema>

export const validateResult = (input: unknown, contract: TaskContract) => {
    const result = TaskResultSchema.parse(input)
    if (result.taskId !== contract.taskId) throw new Error('다른 작업의 결과입니다.')
    if (result.changedFiles.some((path) => !contract.ownedFiles.includes(path))) throw new Error('소유 범위 밖 변경을 보고했습니다.')
    if (result.status === 'DONE') {
        if (contract.acceptanceCriteria.some((criterion) => !result.completedCriteria.includes(criterion)))
            throw new Error('완료 조건이 누락되었습니다.')
        if (result.evidence.length === 0 || result.decisionRequests.length > 0) throw new Error('완료 근거가 없거나 필요한 결정이 남아 있습니다.')
        if (
            contract.checks.some(
                (check) => !result.verification.some((item) => JSON.stringify(item.command) === JSON.stringify(check.command) && item.exitCode === 0),
            )
        )
            throw new Error('지정된 검증의 성공 근거가 없습니다.')
        if (result.verification.some((item) => item.exitCode !== 0)) throw new Error('실패한 검증이 있습니다.')
    }
    return result
}
