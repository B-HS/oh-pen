import { z } from 'zod'

export const SPECIALIST_IDS = ['sub-pen', 'research-pen', 'explore-pen', 'doc-pen', 'verify-pen', 'security-pen', 'review-pen'] as const
export const AGENT_IDS = ['pen', ...SPECIALIST_IDS] as const
export const PLUGIN_ASSET = 'plugins/oh-pencode.js'
export const RUNTIME_ASSET = 'oh-pencode/runtime.js'
export const CONTRACT_ASSET = 'oh-pencode/task.schema.json'
export const RESULT_ASSET = 'oh-pencode/result.schema.json'
export const MODEL_REF_PATTERN = /^[A-Za-z0-9_.:-]+\/[A-Za-z0-9_.:/-]+(?:#[A-Za-z0-9_.:-]+)?$/
export const ModelRefSchema = z.string().regex(MODEL_REF_PATTERN)
export const PermissionSchema = z.object({ action: z.string(), resource: z.string(), effect: z.enum(['allow', 'ask', 'deny']) })
export const AgentSchema = z.object({
    id: z.string(),
    mode: z.string().optional(),
    hidden: z.boolean().optional(),
    steps: z.number().int().positive().optional(),
    model: z.object({ providerID: z.string(), id: z.string(), variant: z.string().optional() }).nullish(),
    permissions: z.array(PermissionSchema).default([]),
})
export const AgentFileSchema = z.object({
    description: z.string().min(1),
    mode: z.enum(['primary', 'subagent', 'all']).optional(),
    hidden: z.boolean().optional(),
    steps: z.number().int().positive().optional(),
    permissions: z.array(PermissionSchema).default([]),
})

export const parseAgentFile = (markdown: string) => {
    const frontmatter = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1]
    if (!frontmatter) throw new Error('에이전트 frontmatter가 없습니다.')
    return AgentFileSchema.parse(Bun.YAML.parse(frontmatter))
}

const matches = (pattern: string, resource: string) => {
    if (pattern.endsWith(' *') && resource === pattern.slice(0, -2)) return true
    const escaped = pattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replaceAll('*', '.*')
        .replaceAll('?', '.')
    return new RegExp(`^${escaped}$`).test(resource)
}

export const resolvePermission = (rules: z.infer<typeof PermissionSchema>[], action: string, resource: string) =>
    rules.findLast((rule) => matches(rule.action, action) && matches(rule.resource, resource))?.effect ?? 'ask'

export const permissionProbes = (id: string) => {
    const common = [
        { action: 'read', resource: 'nested/.env.production', expected: 'deny' as const },
        { action: 'read', resource: 'private/key.pem', expected: 'deny' as const },
    ]
    if (id === 'pen')
        return [
            ...common,
            { action: 'pen_subagent', resource: '*', expected: 'allow' as const },
            { action: 'shell', resource: 'git push origin main --force', expected: 'deny' as const },
        ]
    const specialist = [
        ...common,
        { action: 'subagent', resource: 'sub-pen', expected: 'deny' as const },
        { action: 'pen_subagent', resource: '*', expected: 'deny' as const },
    ]
    if (id === 'sub-pen') return [...specialist, { action: 'shell', resource: 'git -C . commit -m test', expected: 'deny' as const }]
    const readOnly = [
        ...specialist,
        { action: 'edit', resource: 'src/example.ts', expected: 'deny' as const },
        { action: 'shell', resource: 'pwd', expected: 'allow' as const },
        { action: 'shell', resource: 'python -c print(1)', expected: 'deny' as const },
        { action: 'shell', resource: 'git status', expected: 'allow' as const },
    ]
    if (id === 'verify-pen') return [...readOnly, { action: 'shell', resource: 'bun -e invalid', expected: 'deny' as const }]
    if (id === 'security-pen') return [...readOnly, { action: 'shell', resource: 'npm audit fix', expected: 'deny' as const }]
    return readOnly
}
