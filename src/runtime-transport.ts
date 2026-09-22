import { z } from 'zod'
import { AgentSchema, permissionProbes, resolvePermission } from './agent-contract.ts'
import { parseModelRef } from './models.ts'
import { RUNTIME_LIMITS } from './runtime-contract.ts'
import type { TaskContract } from './runtime-contract.ts'

const SESSION_PAGE_LIMIT = 200
const SessionIdSchema = z.string().regex(/^ses[a-zA-Z0-9_-]+$/)
const AssistantSchema = z.object({
    type: z.literal('assistant'),
    agent: z.string(),
    model: z.object({ providerID: z.string(), id: z.string(), variant: z.string().optional() }),
    time: z.object({ created: z.number(), completed: z.number().optional() }),
    content: z.array(z.object({ type: z.string(), text: z.string().optional() })),
    finish: z.string().optional(),
    cost: z.number().optional(),
    tokens: z.object({ input: z.number(), output: z.number() }).optional(),
})

export const executeBounded = async (
    args: string[],
    options: { directory: string; signal?: AbortSignal; timeoutMs: number; maxOutputBytes: number },
) => {
    const controller = new AbortController()
    const abort = () => controller.abort()
    if (options.signal?.aborted) abort()
    options.signal?.addEventListener('abort', abort, { once: true })
    const timer = setTimeout(abort, options.timeoutMs)
    let outputBytes = 0
    let exceeded = false
    try {
        const child = Bun.spawn(args, {
            cwd: options.directory,
            stdout: 'pipe',
            stderr: 'pipe',
            stdin: 'ignore',
            signal: controller.signal,
            killSignal: 'SIGKILL',
        })
        const collect = async (stream: ReadableStream<Uint8Array>) => {
            const reader = stream.getReader()
            const decoder = new TextDecoder()
            let value = ''
            try {
                while (true) {
                    const chunk = await reader.read()
                    if (chunk.done) break
                    outputBytes += chunk.value.byteLength
                    if (outputBytes > options.maxOutputBytes) {
                        exceeded = true
                        abort()
                        break
                    }
                    value += decoder.decode(chunk.value, { stream: true })
                }
                return value + decoder.decode()
            } finally {
                reader.releaseLock()
            }
        }
        const [stdout, , exitCode] = await Promise.all([collect(child.stdout), collect(child.stderr), child.exited])
        if (exceeded) throw new Error('출력 크기 한도를 넘었습니다.')
        if (controller.signal.aborted) throw new Error('프로세스가 취소되거나 시간 한도를 넘었습니다.')
        if (exitCode !== 0) throw new Error(`OpenCode 프로세스 실패: exit ${exitCode}. 민감정보 보호를 위해 원본 stderr는 저장하지 않습니다.`)
        return { stdout, outputBytes }
    } finally {
        clearTimeout(timer)
        options.signal?.removeEventListener('abort', abort)
    }
}

export const createOpenCodeTransport = (directory: string, execute = executeBounded) => {
    const api = async (args: string[]) => {
        const result = await execute(['opencode', 'api', ...args], {
            directory,
            timeoutMs: RUNTIME_LIMITS.stopTimeoutMs,
            maxOutputBytes: RUNTIME_LIMITS.maxOutputBytes,
        })
        const parsed: unknown = JSON.parse(result.stdout)
        return parsed
    }
    return {
        validateAgent: async (task: TaskContract) => {
            const debug = await execute(['opencode', 'debug', 'agents'], {
                directory,
                timeoutMs: RUNTIME_LIMITS.stopTimeoutMs,
                maxOutputBytes: RUNTIME_LIMITS.maxOutputBytes,
            })
            const agent = z
                .array(AgentSchema)
                .parse(JSON.parse(debug.stdout))
                .find((entry) => entry.id === task.agent)
            if (!agent || agent.mode !== 'subagent' || agent.steps !== task.limits.maxSteps)
                throw new Error('설치된 역할 또는 단계 상한이 맞지 않습니다. installer verify 결과를 확인하세요.')
            if (permissionProbes(task.agent).some((probe) => resolvePermission(agent.permissions, probe.action, probe.resource) !== probe.expected))
                throw new Error('설치된 역할의 권한 계약이 맞지 않습니다.')
        },
        createSession: async (task: TaskContract) => {
            const value = await api([
                'POST',
                '/api/session',
                '--data',
                JSON.stringify({
                    title: `pen:${task.taskId}`,
                    agent: task.agent,
                    model: parseModelRef(task.model),
                    location: { directory },
                }),
            ])
            return z.object({ data: z.object({ id: SessionIdSchema }) }).parse(value).data.id
        },
        runSession: async (task: TaskContract, sessionId: string, prompt: string, signal: AbortSignal) => {
            const result = await execute(
                [
                    'opencode',
                    'run',
                    '--session',
                    SessionIdSchema.parse(sessionId),
                    '--agent',
                    task.agent,
                    '--model',
                    task.model,
                    '--format',
                    'json',
                    '--',
                    prompt,
                ],
                { directory, signal, ...task.limits },
            )
            return { outputBytes: result.outputBytes }
        },
        interruptSession: async (sessionId: string) => {
            await api(['POST', `/api/session/${SessionIdSchema.parse(sessionId)}/interrupt`])
        },
        readResult: async (task: TaskContract, sessionId: string, startedAt: number) => {
            const value = await api([
                'GET',
                `/api/session/${SessionIdSchema.parse(sessionId)}/message`,
                '--param',
                `limit=${SESSION_PAGE_LIMIT}`,
                '--param',
                'order=desc',
                '--param',
                'type=assistant',
            ])
            const page = z.object({ data: z.array(z.object({ type: z.string() }).passthrough()) }).parse(value)
            const messages = page.data
                .filter((message) => message.type === 'assistant')
                .map((message) => AssistantSchema.parse(message))
                .filter((message) => message.time.created >= startedAt)
                .toSorted((left, right) => left.time.created - right.time.created)
            const last = messages.at(-1)
            if (!last || !last.time.completed || last.finish !== 'stop') throw new Error('정상적으로 끝난 assistant 결과가 없습니다.')
            const selected = parseModelRef(task.model)
            if (
                messages.some(
                    (message) =>
                        message.agent !== task.agent ||
                        message.model.id !== selected.id ||
                        message.model.providerID !== selected.providerID ||
                        (selected.variant !== undefined && message.model.variant !== selected.variant),
                )
            )
                throw new Error('실제 실행 역할 또는 모델이 계약과 다릅니다.')
            const text = last.content
                .filter((part) => part.type === 'text')
                .map((part) => part.text ?? '')
                .join('\n')
                .trim()
            const unwrapped = text.replace(/^```(?:json)?\s*\n/, '').replace(/\n```$/, '')
            const result: unknown = JSON.parse(unwrapped)
            return {
                result,
                steps: messages.length,
                tokens: messages.every((message) => message.tokens !== undefined)
                    ? messages.reduce((total, message) => total + (message.tokens?.input ?? 0) + (message.tokens?.output ?? 0), 0)
                    : null,
                cost: messages.every((message) => message.cost !== undefined)
                    ? messages.reduce((total, message) => total + (message.cost ?? 0), 0)
                    : null,
            }
        },
    }
}
export type OpenCodeTransport = ReturnType<typeof createOpenCodeTransport>
