import { createHash, randomUUID } from 'node:crypto'
import { lstat, mkdir, open, readFile, readdir, readlink, realpath, rename, rm } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { z } from 'zod'
import { CheckpointSchema, EvidenceInputSchema, isSensitivePath, RUNTIME_LIMITS, TaskIdSchema } from './runtime-contract.ts'

export const digest = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex')
export const stateDirectory = (directory: string) => join(directory, '.opencode', 'pen-state')

export const safeFile = async (directory: string, file: string, allowLeafSymlink = false) => {
    const root = await realpath(directory)
    const target = resolve(root, file)
    const suffix = relative(root, target)
    if (!suffix || suffix.startsWith('..') || isSensitivePath(suffix)) throw new Error('허용되지 않는 파일 경로입니다.')
    const segments = suffix.split('/')
    for (const index of segments.keys()) {
        try {
            if ((await lstat(join(root, ...segments.slice(0, index + 1)))).isSymbolicLink() && !(allowLeafSymlink && index === segments.length - 1))
                throw new Error('심볼릭 링크 경로는 허용하지 않습니다.')
        } catch (error) {
            if (error instanceof Error && 'code' in error && error.code === 'ENOENT') break
            throw error
        }
    }
    return target
}

export const writeJson = async (directory: string, file: string, value: object) => {
    const target = await safeFile(directory, file)
    await mkdir(dirname(target), { recursive: true })
    const temporary = `${target}.${randomUUID()}.tmp`
    const handle = await open(temporary, 'wx', 0o600)
    try {
        await handle.writeFile(`${JSON.stringify(value, null, 2)}\n`)
        await handle.sync()
    } finally {
        await handle.close()
    }
    await rename(temporary, target)
}

export const taskPath = (id: string) => `.opencode/pen-state/tasks/${TaskIdSchema.parse(id)}.json`
export const readCheckpoint = async (directory: string, id: string) => {
    const file = await safeFile(directory, taskPath(id))
    if (!(await Bun.file(file).exists())) return undefined
    return CheckpointSchema.parse(JSON.parse(await readFile(file, 'utf8')))
}

export const snapshotProject = async (directory: string) => {
    const root = await realpath(directory)
    const process = Bun.spawn(['git', 'ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: root, stdout: 'pipe', stderr: 'pipe' })
    const [listing, exitCode] = await Promise.all([new Response(process.stdout).text(), process.exited])
    if (exitCode !== 0) throw new Error('체크포인트에는 Git 프로젝트가 필요합니다.')
    const paths = [
        ...new Set(listing.split('\0').filter((path) => path && !isSensitivePath(path) && !path.startsWith('.opencode/pen-state/'))),
    ].toSorted()
    if (paths.length > RUNTIME_LIMITS.maxFiles) throw new Error('체크포인트 파일 수 한도를 넘었습니다.')
    const entries = await Promise.all(
        paths.map(async (path) => {
            const target = await safeFile(root, path, true)
            try {
                const info = await lstat(target)
                if (info.isSymbolicLink()) return [path, `link:${digest(await readlink(target))}`] as const
                if (!info.isFile()) return [path, 'directory'] as const
                if (info.size > RUNTIME_LIMITS.maxFileBytes) throw new Error(`체크포인트 파일 크기 한도: ${path}`)
                return [path, digest(await readFile(target))] as const
            } catch (error) {
                if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return [path, 'missing'] as const
                throw error
            }
        }),
    )
    const headProcess = Bun.spawn(['git', 'rev-parse', '--verify', 'HEAD'], { cwd: root, stdout: 'pipe', stderr: 'pipe' })
    const [headText, headExit] = await Promise.all([new Response(headProcess.stdout).text(), headProcess.exited])
    const head = headExit === 0 ? headText.trim() : 'unborn'
    const files = Object.fromEntries(entries)
    return { head, files, fingerprint: digest(JSON.stringify({ head, entries })) }
}

const StoredEvidenceSchema = z.strictObject({ input: EvidenceInputSchema, fingerprints: z.record(z.string(), z.string()) })
export const saveEvidence = async (directory: string, input: unknown) => {
    const evidence = EvidenceInputSchema.parse(input)
    if (Date.parse(evidence.expiresAt) <= Date.now()) throw new Error('근거의 유효 기간이 만료되었습니다.')
    if (evidence.sources.some((source) => Date.parse(source.checkedAt) > Date.now())) throw new Error('출처 확인 시점이 미래입니다.')
    const snapshot = await snapshotProject(directory)
    if (evidence.files.some((file) => !snapshot.files[file] || snapshot.files[file] === 'missing')) throw new Error('근거 파일을 찾을 수 없습니다.')
    const fingerprints = Object.fromEntries(evidence.files.map((file) => [file, snapshot.files[file] ?? 'missing']))
    await writeJson(directory, `.opencode/pen-state/evidence/${evidence.key}.json`, { input: evidence, fingerprints })
    return evidence
}

export const loadEvidence = async (directory: string, key: string, version?: string) => {
    const file = await safeFile(directory, `.opencode/pen-state/evidence/${TaskIdSchema.parse(key)}.json`)
    if (!(await Bun.file(file).exists())) return { usable: false, reason: 'missing' } as const
    const evidence = StoredEvidenceSchema.parse(JSON.parse(await readFile(file, 'utf8')))
    if (Date.parse(evidence.input.expiresAt) <= Date.now()) return { usable: false, reason: 'expired' } as const
    if (version && evidence.input.sources.some((source) => source.version !== version)) return { usable: false, reason: 'version-changed' } as const
    const snapshot = await snapshotProject(directory)
    if (Object.entries(evidence.fingerprints).some(([path, hash]) => snapshot.files[path] !== hash))
        return { usable: false, reason: 'files-changed' } as const
    return { usable: true, evidence: evidence.input } as const
}

export const acquireSlot = async (directory: string, taskId: string, maximum: number, isWriter: boolean) => {
    const locks = await safeFile(directory, '.opencode/pen-state/locks')
    await mkdir(locks, { recursive: true })
    const existing = await readdir(locks)
    if (existing.includes(taskId)) throw new Error('같은 작업이 실행 중이거나 중단된 잠금이 남았습니다. recover로 상태를 확인하세요.')
    const globalLock = join(locks, 'dispatch')
    await mkdir(globalLock)
    try {
        const active = (await readdir(locks)).filter((name) => name !== 'dispatch')
        if (active.length >= maximum) throw new Error('동시 실행 한도에 도달했습니다.')
        const peers = await Promise.all(active.map((id) => readCheckpoint(directory, id)))
        if (active.length > 0 && (isWriter || peers.some((peer) => !peer || peer.contract.ownedFiles.length > 0)))
            throw new Error('공유 작업 디렉터리의 수정 작업은 직렬로 실행합니다.')
        const lock = join(locks, taskId)
        await mkdir(lock)
        return async () => {
            await rm(lock, { recursive: true, force: true })
        }
    } finally {
        await rm(globalLock, { recursive: true, force: true })
    }
}
