import { z } from 'zod'

export const PenTodoStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'cancelled'])

export const PenStatusInputSchema = z
    .strictObject({
        goal: z.string().trim().min(1).max(240),
        todos: z
            .array(
                z.strictObject({
                    content: z.string().trim().min(1).max(160),
                    status: PenTodoStatusSchema,
                }),
            )
            .min(1)
            .max(20),
    })
    .refine((value) => value.todos.filter((todo) => todo.status === 'in_progress').length <= 1, {
        message: 'in_progress Todo는 하나만 허용됩니다.',
    })

export type PenStatusInput = z.infer<typeof PenStatusInputSchema>

const PenStatusToolPartSchema = z.object({
    type: z.literal('tool'),
    name: z.literal('pen_status'),
    state: z.union([
        z.object({ status: z.literal('running'), input: z.unknown() }),
        z.object({ status: z.literal('completed'), input: z.unknown() }),
        z.object({ status: z.literal('error'), input: z.unknown() }),
    ]),
})

const AssistantMessageSchema = z.object({
    type: z.literal('assistant'),
    content: z.array(z.unknown()),
})

export const readLatestPenStatus = (messages: readonly unknown[]) => {
    for (const message of messages.toReversed()) {
        const parsedMessage = AssistantMessageSchema.safeParse(message)
        if (!parsedMessage.success) continue
        for (const content of parsedMessage.data.content.toReversed()) {
            const parsedPart = PenStatusToolPartSchema.safeParse(content)
            if (!parsedPart.success) continue
            const status = PenStatusInputSchema.safeParse(parsedPart.data.state.input)
            if (status.success) return status.data
        }
    }
    return undefined
}
