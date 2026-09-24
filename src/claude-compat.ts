import { lstat, mkdir, readFile, readdir, readlink, symlink } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import type { ManagedLink } from './fs.ts'

export const PROJECT_CONFIG_ENVIRONMENT_LINE = 'export OPENCODE_DISABLE_PROJECT_CONFIG=1'

const pathKind = async (path: string) => {
    try {
        const value = await lstat(path)
        if (value.isSymbolicLink()) return 'link' as const
        if (value.isDirectory()) return 'directory' as const
        return 'file' as const
    } catch {
        return 'missing' as const
    }
}

const ensureLink = async (path: string, target: string) => {
    const kind = await pathKind(path)
    if (kind === 'link' && resolve(dirname(path), await readlink(path)) === resolve(target)) return true
    if (kind !== 'missing') return false
    await mkdir(dirname(path), { recursive: true })
    await symlink(target, path)
    return true
}

const listCommandFiles = async (directory: string, prefix = ''): Promise<string[]> => {
    const entries = await readdir(directory, { withFileTypes: true })
    const files: string[] = []
    for (const entry of entries) {
        const relative = prefix.length > 0 ? `${prefix}/${entry.name}` : entry.name
        if (entry.isDirectory()) files.push(...(await listCommandFiles(join(directory, entry.name), relative)))
        else if (entry.isFile() && entry.name.endsWith('.md')) files.push(relative)
    }
    return files
}

export const installClaudeCompatibility = async (input: {
    configRoot: string
    claudeRoot: string
    shellProfile: string
    dryRun: boolean
}) => {
    const links: ManagedLink[] = []
    const warnings: string[] = []
    const ruleSource = join(input.claudeRoot, 'CLAUDE.md')
    const ruleTarget = join(input.configRoot, 'AGENTS.md')

    if ((await pathKind(ruleSource)) === 'file') {
        if (input.dryRun || (await ensureLink(ruleTarget, ruleSource))) links.push({ path: 'AGENTS.md', target: ruleSource })
        else warnings.push(`${ruleTarget} 가 이미 있어 Claude Code rule 연결을 건너뜁니다.`)
    } else {
        warnings.push(`${ruleSource} 가 없어 Claude Code rule 연결을 건너뜁니다.`)
    }

    const commandSource = join(input.claudeRoot, 'commands')
    if ((await pathKind(commandSource)) === 'directory') {
        const commands = await listCommandFiles(commandSource)
        for (const command of commands) {
            const target = join(input.configRoot, 'commands', command)
            const source = join(commandSource, command)
            if (input.dryRun || (await ensureLink(target, source))) links.push({ path: `commands/${command}`, target: source })
            else warnings.push(`${target} 가 이미 있어 Claude Code command 연결을 건너뜁니다.`)
        }
    } else {
        warnings.push(`${commandSource} 가 없어 Claude Code command 연결을 건너뜁니다.`)
    }

    const hasRuleLink = links.some((link) => link.path === 'AGENTS.md')
    let previousProjectConfigLine: string | undefined
    let wroteShellProfile = false
    const shellKind = await pathKind(input.shellProfile)
    const raw = shellKind === 'file' ? await readFile(input.shellProfile, 'utf8') : ''
    const lines = raw.split('\n')
    const assignmentIndex = lines.findIndex((line) => /^(?:export\s+)?OPENCODE_DISABLE_PROJECT_CONFIG=/.test(line.trim()))
    if (hasRuleLink && assignmentIndex === -1) {
        lines.splice(lines.at(-1) === '' ? -1 : lines.length, 0, PROJECT_CONFIG_ENVIRONMENT_LINE)
        wroteShellProfile = true
    } else if (hasRuleLink && lines[assignmentIndex]?.trim() !== PROJECT_CONFIG_ENVIRONMENT_LINE) {
        previousProjectConfigLine = lines[assignmentIndex]
        lines[assignmentIndex] = PROJECT_CONFIG_ENVIRONMENT_LINE
        wroteShellProfile = true
    }
    if (wroteShellProfile && !input.dryRun) {
        await mkdir(dirname(input.shellProfile), { recursive: true })
        await Bun.write(input.shellProfile, lines.join('\n'))
    }

    return { links, warnings, wroteShellProfile, shellProfile: input.shellProfile, previousProjectConfigLine }
}
