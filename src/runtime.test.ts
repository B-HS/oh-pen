import { afterEach, describe, expect, test } from 'bun:test'
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { TaskContractSchema, validateResult } from './runtime-contract.ts'
import { cancelTask, recoverTask, runTask } from './runtime.ts'
import { loadEvidence, readCheckpoint, safeFile, saveEvidence, snapshotProject, taskPath, writeJson } from './runtime-state.ts'
import { routeTask, readMetrics } from './runtime-routing.ts'
import { executeBounded } from './runtime-transport.ts'
import type { OpenCodeTransport } from './runtime-transport.ts'

const FIXTURE_TIMEOUT_MS = 20
const FUTURE_DATE = '2099-01-01T00:00:00.000Z'
const roots = new Set<string>()
const fixture = async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pen-runtime-test-'))
    roots.add(directory)
    Bun.spawnSync(['git', 'init', '-q'], { cwd: directory })
    await mkdir(join(directory, 'src'))
    await writeFile(join(directory, 'src/value.ts'), 'export const value = 1\n')
    return directory
}
const contract = () =>
    TaskContractSchema.parse({
        version: 1,
        taskId: 'test-task',
        agent: 'explore-pen',
        model: 'provider/model#high',
        goal: '파일 확인',
        acceptanceCriteria: ['값 위치 확인'],
        context: ['src/value.ts를 확인합니다.'],
        ownedFiles: [],
        readFiles: ['src/value.ts'],
        nonGoals: ['파일 수정'],
        instructions: ['읽기 전용'],
        steps: ['값의 위치를 찾습니다.'],
        checks: [],
    })
const result = () => ({
    taskId: 'test-task',
    status: 'DONE',
    summary: '위치를 확인했습니다.',
    completedCriteria: ['값 위치 확인'],
    changedFiles: [],
    evidence: ['src/value.ts:1'],
    verification: [],
    risks: [],
    decisionRequests: [],
})
const transport = (overrides: Partial<OpenCodeTransport> = {}): OpenCodeTransport => ({
    validateAgent: async () => {},
    createSession: async () => 'ses_test',
    runSession: async () => ({ outputBytes: 1 }),
    interruptSession: async () => {},
    readResult: async () => ({ result: result(), steps: 1, tokens: null, cost: null }),
    ...overrides,
})
afterEach(async () => {
    await Promise.all([...roots].map((directory) => rm(directory, { recursive: true, force: true })))
    roots.clear()
})

describe('실행 계약과 체크포인트', () => {
    test('필수 계약과 역할 소유권을 검사한다', () => {
        expect(() => TaskContractSchema.parse({ taskId: 'empty' })).toThrow()
        expect(() => TaskContractSchema.parse({ ...contract(), ownedFiles: ['src/value.ts'] })).toThrow()
        expect(() => TaskContractSchema.parse({ ...contract(), agent: 'doc-pen', ownedFiles: ['docs/PROCESS.md'] })).toThrow()
        expect(() => TaskContractSchema.parse({ ...contract(), readFiles: ['../outside'] })).toThrow()
    })
    test('미완료 결과와 다른 작업의 결과를 성공 처리하지 않는다', () => {
        expect(() => validateResult({ ...result(), completedCriteria: [] }, contract())).toThrow()
        expect(() => validateResult({ ...result(), taskId: 'other' }, contract())).toThrow()
        expect(() => validateResult(result(), { ...contract(), checks: [{ command: ['bun', 'test'], expectation: '통과' }] })).toThrow()
    })
    test('정상 결과를 저장하고 같은 상태의 완료 작업은 재실행하지 않는다', async () => {
        const directory = await fixture()
        let calls = 0
        const client = transport({
            runSession: async () => {
                calls += 1
                return { outputBytes: 1 }
            },
        })
        expect((await runTask(contract(), { directory, transport: client }))?.status).toBe('DONE')
        expect((await runTask(contract(), { directory, resume: true, transport: client }))?.status).toBe('DONE')
        expect(calls).toBe(1)
        expect((await readMetrics(directory)).attempts).toBe(1)
    })
    test('입력 파일이 달라지면 완료 근거를 재사용하지 않는다', async () => {
        const directory = await fixture()
        await runTask(contract(), { directory, transport: transport() })
        await writeFile(join(directory, 'src/value.ts'), 'changed')
        await expect(runTask(contract(), { directory, resume: true, transport: transport() })).rejects.toThrow('프로젝트 상태')
    })
    test('소유 범위 밖 변경은 차단하고 원본 fingerprint를 보존한다', async () => {
        const directory = await fixture()
        const before = await snapshotProject(directory)
        const client = transport({
            runSession: async () => {
                await writeFile(join(directory, 'src/value.ts'), 'changed')
                return { outputBytes: 1 }
            },
        })
        const state = await runTask(contract(), { directory, transport: client })
        expect(state?.status).toBe('BLOCKED')
        expect(state?.snapshot.fingerprint).toBe(before.fingerprint)
    })
    test('시간 초과는 서버 세션을 중단하고 재시도에도 같은 세션을 사용한다', async () => {
        const directory = await fixture()
        let interrupted = false
        const task = { ...contract(), limits: { ...contract().limits, timeoutMs: FIXTURE_TIMEOUT_MS } }
        const client = transport({
            runSession: async (_task, _id, _prompt, signal) => {
                await new Promise<void>((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true }))
                return { outputBytes: 0 }
            },
            interruptSession: async () => {
                interrupted = true
            },
        })
        expect((await runTask(task, { directory, transport: client }))?.status).toBe('TIMED_OUT')
        expect(interrupted).toBe(true)
        const resumed = transport({
            createSession: async () => {
                throw new Error('새 세션 생성 금지')
            },
        })
        expect((await runTask(task, { directory, resume: true, transport: resumed }))?.sessionId).toBe('ses_test')
    })
    test('잘못된 결과와 재시도 한도를 실패로 처리한다', async () => {
        const directory = await fixture()
        const task = { ...contract(), limits: { ...contract().limits, maxAttempts: 1 } }
        expect(
            (
                await runTask(task, {
                    directory,
                    transport: transport({
                        readResult: async () => {
                            throw new Error('invalid')
                        },
                    }),
                })
            )?.status,
        ).toBe('FAILED')
        await expect(runTask(task, { directory, resume: true, transport: transport() })).rejects.toThrow('재시도 한도')
    })
    test('진행 중인 같은 작업의 중복 실행을 막는다', async () => {
        const directory = await fixture()
        const controller = new AbortController()
        let resolveStarted: (() => void) | undefined
        const started = new Promise<void>((resolve) => {
            resolveStarted = resolve
        })
        const pending = runTask(contract(), {
            directory,
            signal: controller.signal,
            transport: transport({
                runSession: async (_task, _id, _prompt, signal) => {
                    resolveStarted?.()
                    await new Promise<void>((_resolve, reject) =>
                        signal.addEventListener('abort', () => reject(new Error('cancelled')), { once: true }),
                    )
                    return { outputBytes: 0 }
                },
            }),
        })
        await started
        await expect(runTask(contract(), { directory, transport: transport() })).rejects.toThrow()
        controller.abort()
        expect((await pending)?.status).toBe('CANCELLED')
        expect((await readCheckpoint(directory, 'test-task'))?.status).toBe('CANCELLED')
    })
    test('취소 요청 파일을 감지하고 서버 중단 실패 시 잠금을 보존한다', async () => {
        const directory = await fixture()
        let resolveStarted: (() => void) | undefined
        const started = new Promise<void>((resolve) => {
            resolveStarted = resolve
        })
        const client = transport({
            runSession: async (_task, _id, _prompt, signal) => {
                resolveStarted?.()
                await new Promise<void>((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('cancelled')), { once: true }))
                return { outputBytes: 0 }
            },
            interruptSession: async () => {
                throw new Error('서버 연결 실패')
            },
        })
        const pending = runTask(contract(), { directory, transport: client })
        await started
        expect((await cancelTask(directory, 'test-task')).status).toBe('CANCEL_REQUESTED')
        expect((await pending)?.status).toBe('BLOCKED')
        await expect(runTask(contract(), { directory, resume: true, transport: transport() })).rejects.toThrow('잠금')
    })
    test('중단 완료 뒤 변경을 저장하고 죽은 실행의 소유 파일 변경을 복구한다', async () => {
        const directory = await fixture()
        const task = { ...contract(), agent: 'sub-pen', ownedFiles: ['src/value.ts'] }
        const state = await runTask(task, {
            directory,
            transport: transport({
                runSession: async () => {
                    throw new Error('실행 연결 종료')
                },
                interruptSession: async () => {
                    await writeFile(join(directory, 'src/value.ts'), 'stopped')
                },
            }),
        })
        expect(state?.status).toBe('FAILED')
        expect(state?.snapshot.fingerprint).toBe((await snapshotProject(directory)).fingerprint)
        const child = Bun.spawn([process.execPath, '-e', 'process.exit(0)'])
        await child.exited
        await writeJson(directory, taskPath('test-task'), { ...state, status: 'RUNNING', runnerPid: child.pid })
        await writeFile(join(directory, 'src/value.ts'), 'partial')
        const recovered = await recoverTask(directory, 'test-task', transport())
        expect(recovered.status).toBe('INTERRUPTED')
        expect(recovered.snapshot.fingerprint).toBe((await snapshotProject(directory)).fingerprint)
    })
    test('역할 확인 중 취소되면 세션을 생성하지 않는다', async () => {
        const directory = await fixture()
        const controller = new AbortController()
        let created = false
        const state = await runTask(contract(), {
            directory,
            signal: controller.signal,
            transport: transport({
                validateAgent: async () => {
                    controller.abort()
                },
                createSession: async () => {
                    created = true
                    return 'ses_unused'
                },
            }),
        })
        expect(state?.status).toBe('CANCELLED')
        expect(created).toBe(false)
    })
})

describe('근거 재사용과 경로 경계', () => {
    test('코드 근거는 파일이 변경되면 무효화한다', async () => {
        const directory = await fixture()
        await saveEvidence(directory, {
            key: 'value-location',
            kind: 'code',
            topic: '값',
            summary: '값의 위치',
            files: ['src/value.ts'],
            sources: [],
            expiresAt: FUTURE_DATE,
        })
        expect((await loadEvidence(directory, 'value-location')).usable).toBe(true)
        await writeFile(join(directory, 'src/value.ts'), 'changed')
        expect(await loadEvidence(directory, 'value-location')).toEqual({ usable: false, reason: 'files-changed' })
    })
    test('외부 문서의 대상 버전이 바뀌면 재사용하지 않는다', async () => {
        const directory = await fixture()
        await saveEvidence(directory, {
            key: 'official',
            kind: 'external',
            topic: '계약',
            summary: '공식 계약',
            files: [],
            sources: [{ url: 'https://example.org/docs', version: '1', checkedAt: new Date().toISOString() }],
            expiresAt: FUTURE_DATE,
        })
        expect(await loadEvidence(directory, 'official', '2')).toEqual({ usable: false, reason: 'version-changed' })
    })
    test('경로 탈출과 심볼릭 링크를 읽기 전에 차단한다', async () => {
        const directory = await fixture()
        await symlink(tmpdir(), join(directory, 'outside'))
        await expect(safeFile(directory, '../file')).rejects.toThrow()
        await expect(safeFile(directory, '.env')).rejects.toThrow()
        await expect(safeFile(directory, 'outside/file')).rejects.toThrow()
    })
    test('작업 위험에 필요한 역할만 선택한다', () => {
        expect(routeTask({ workflow: false, kind: 'implement', risk: 'high' }).agents).toEqual([])
        expect(routeTask({ workflow: true, kind: 'implement', risk: 'low' }).agents).toEqual(['sub-pen'])
        expect(routeTask({ workflow: true, kind: 'implement', risk: 'high', securityBoundary: true }).agents).toEqual([
            'sub-pen',
            'verify-pen',
            'review-pen',
            'security-pen',
        ])
    })
    test('실제 프로세스의 출력 초과와 비정상 종료를 감지한다', async () => {
        const directory = await fixture()
        const options = { directory, timeoutMs: 1_000, maxOutputBytes: 1 }
        await expect(executeBounded([process.execPath, '-e', 'process.stdout.write("large")'], options)).rejects.toThrow('출력 크기')
        await expect(executeBounded([process.execPath, '-e', 'process.exit(1)'], options)).rejects.toThrow('exit 1')
    })
})
