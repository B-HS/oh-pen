import { z } from 'zod'
import { parseModelRef } from './models.ts'
import type { TaskContract } from './runtime-contract.ts'

const AssistantSchema = z.object({
    type: z.literal('assistant'),
    agent: z.string(),
    model: z.object({ providerID: z.string(), id: z.string(), variant: z.string().optional() }),
    time: z.object({ created: z.number(), completed: z.number().optional() }),
    content: z.array(z.object({ type: z.string(), text: z.string().optional() })),
    finish: z.string().optional(),
    cost: z.number().optional(),
    tokens: z.object({ input: z.number(), output: z.number() }).passthrough().optional(),
})

export const readSessionResult = (input: unknown, task: TaskContract, startedAt: number) => {
    const messages = z
        .array(z.object({ type: z.string() }).passthrough())
        .parse(input)
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
}
