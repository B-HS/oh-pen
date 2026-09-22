import { readdir, readFile } from 'node:fs/promises'
import { z } from 'zod'
import { CheckpointSchema } from './runtime-contract.ts'
import { safeFile } from './runtime-state.ts'

const RoutingSchema = z.strictObject({
    workflow: z.boolean(),
    kind: z.enum(['implement', 'bug', 'review', 'research', 'docs', 'explore']),
    risk: z.enum(['low', 'medium', 'high']),
    securityBoundary: z.boolean().default(false),
})
export const routeTask = (input: unknown) => {
    const request = RoutingSchema.parse(input)
    if (!request.workflow) return { agents: [], reason: '메인 직접 수행' }
    const routes = {
        implement: ['sub-pen'],
        bug: ['explore-pen', 'sub-pen'],
        review: ['review-pen'],
        research: ['research-pen'],
        docs: ['doc-pen'],
        explore: ['explore-pen'],
    }
    const isChange = request.kind === 'implement' || request.kind === 'bug'
    return {
        agents: [
            ...new Set([
                ...routes[request.kind],
                ...(isChange && request.risk !== 'low' ? ['verify-pen'] : []),
                ...(isChange && request.risk === 'high' ? ['review-pen'] : []),
                ...(request.securityBoundary ? ['security-pen'] : []),
            ]),
        ],
        reason: '작업 종류와 독립된 위험에 필요한 역할만 선택하며 모델은 바꾸지 않습니다.',
    }
}

export const readMetrics = async (directory: string) => {
    const path = await safeFile(directory, '.opencode/pen-state/history')
    let entries: string[]
    try {
        entries = await readdir(path)
    } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return { attempts: 0, roles: [] }
        throw error
    }
    const records = await Promise.all(
        entries
            .filter((entry) => /^[a-z0-9-]+-\d+\.json$/.test(entry))
            .map(async (entry) =>
                CheckpointSchema.parse(JSON.parse(await readFile(await safeFile(directory, `.opencode/pen-state/history/${entry}`), 'utf8'))),
            ),
    )
    const roles = [...new Set(records.map((record) => `${record.contract.agent}:${record.contract.model}`))].map((key) => {
        const matching = records.filter((record) => `${record.contract.agent}:${record.contract.model}` === key)
        return {
            key,
            attempts: matching.length,
            done: matching.filter((record) => record.status === 'DONE').length,
            elapsedMs: matching.reduce((total, record) => total + record.elapsedMs, 0),
            tokens: matching.every((record) => record.tokens !== null) ? matching.reduce((total, record) => total + (record.tokens ?? 0), 0) : null,
            cost: matching.every((record) => record.cost !== null) ? matching.reduce((total, record) => total + (record.cost ?? 0), 0) : null,
        }
    })
    return { attempts: records.length, roles }
}
