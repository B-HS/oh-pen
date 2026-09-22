import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { z } from 'zod'
import { TaskContractSchema } from './runtime-contract.ts'
import { cancelTask, recoverTask, runTask } from './runtime.ts'
import { loadEvidence, readCheckpoint, safeFile, saveEvidence } from './runtime-state.ts'
import { readMetrics, routeTask } from './runtime-routing.ts'

const CommandSchema = z.enum(['validate', 'run', 'resume', 'status', 'cancel', 'recover', 'evidence-put', 'evidence-get', 'route', 'metrics'])
const main = async () => {
    const [commandValue, target, version] = process.argv.slice(2)
    if (commandValue === '--help' || !commandValue) {
        process.stdout.write(
            'pen runtime: validate|run|resume <contract.json>; status|cancel|recover <task-id>; evidence-put <evidence.json>; evidence-get <key> [version]; route <request.json>; metrics\n',
        )
        return
    }
    const command = CommandSchema.parse(commandValue)
    if (command === 'metrics') return readMetrics(process.cwd())
    if (!target) throw new Error('작업 ID 또는 프로젝트 내부 입력 파일을 지정하세요.')
    const directory = resolve(process.cwd())
    if (command === 'status') return readCheckpoint(directory, target)
    if (command === 'cancel') return cancelTask(directory, target)
    if (command === 'recover') return recoverTask(directory, target)
    if (command === 'evidence-get') return loadEvidence(directory, target, version)
    const input: unknown = JSON.parse(await readFile(await safeFile(directory, target), 'utf8'))
    if (command === 'route') return routeTask(input)
    if (command === 'evidence-put') return saveEvidence(directory, input)
    if (command === 'validate') return { valid: true, taskId: TaskContractSchema.parse(input).taskId }
    const controller = new AbortController()
    const abort = () => controller.abort()
    process.once('SIGINT', abort)
    process.once('SIGTERM', abort)
    try {
        const result = await runTask(input, { directory, resume: command === 'resume', signal: controller.signal })
        if (result?.status !== 'DONE') process.exitCode = 1
        return result
    } finally {
        process.removeListener('SIGINT', abort)
        process.removeListener('SIGTERM', abort)
    }
}

if (import.meta.main) {
    try {
        const result = await main()
        if (result !== undefined) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
    } catch (error) {
        process.stderr.write(`${error instanceof Error ? error.message : '실행 실패'}\n`)
        process.exitCode = 1
    }
}
