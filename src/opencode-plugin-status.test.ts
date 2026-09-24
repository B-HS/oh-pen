import { describe, expect, test } from 'bun:test'
import { PenStatusInputSchema, readLatestPenStatus } from './opencode-plugin-status.ts'

const statusPart = (input: unknown) => ({
    type: 'assistant',
    content: [{ type: 'tool', name: 'pen_status', state: { status: 'completed', input } }],
})

describe('pen goal과 Todo 상태', () => {
    test('최신 pen_status 호출을 사이드바 상태로 선택한다', () => {
        const first = PenStatusInputSchema.parse({ goal: '첫 목표', todos: [{ content: '조사', status: 'in_progress' }] })
        const latest = PenStatusInputSchema.parse({ goal: '첫 목표', todos: [{ content: '조사', status: 'completed' }] })
        expect(readLatestPenStatus([statusPart(first), statusPart(latest)])).toEqual(latest)
    })

    test('동시에 진행 중인 Todo가 둘 이상이면 거부한다', () => {
        expect(
            PenStatusInputSchema.safeParse({
                goal: '목표',
                todos: [
                    { content: '첫 작업', status: 'in_progress' },
                    { content: '둘째 작업', status: 'in_progress' },
                ],
            }).success,
        ).toBe(false)
    })

    test('관련 없는 tool과 잘못된 입력은 건너뛴다', () => {
        expect(
            readLatestPenStatus([
                { type: 'assistant', content: [{ type: 'tool', name: 'other', state: { status: 'completed', input: {} } }] },
                statusPart({ goal: '', todos: [] }),
            ]),
        ).toBeUndefined()
    })
})
