import { readConfig, readDefaultAgent, readRootModel } from "./config.ts"
import { exists, readManifest } from "./fs.ts"
import { agentsDir, configFile, configRoot, manifestFile } from "./paths.ts"
import { readdir } from "node:fs/promises"
import { join } from "node:path"

export type VerifyCheck = {
  name: string
  ok: boolean
  detail: string
}

export type VerifyResult = {
  checks: VerifyCheck[]
  ok: boolean
}

type AgentInfo = {
  id: string
  mode?: string
  hidden?: boolean
  model?: { providerID: string; id: string; variant?: string } | null
}

const runDebugAgents = async (directory: string): Promise<AgentInfo[]> => {
  const proc = Bun.spawn(["opencode", "debug", "agents"], {
    cwd: directory,
    stdout: "pipe",
    stderr: "pipe",
  })
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ])
  if (exitCode !== 0) {
    throw new Error(`opencode debug agents 실패: ${stderr.trim() || `exit ${exitCode}`}`)
  }
  const parsed = JSON.parse(stdout) as AgentInfo[]
  return Array.isArray(parsed) ? parsed : []
}

const expectedMode: Record<string, string> = {
  pen: "primary",
  "sub-pen": "subagent",
  "research-pen": "subagent",
  "explore-pen": "subagent",
  "doc-pen": "subagent",
  "verify-pen": "subagent",
  "security-pen": "subagent",
}

/** 전역 agents 디렉터리에 실제로 존재하는 agent md 파일의 ID 목록. */
const installedAgentFiles = async () => {
  const dir = agentsDir()
  if (!(await exists(dir))) return []
  const entries = await readdir(dir, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name.replace(/\.md$/, ""))
}

const parseModelRef = (value: string) => {
  const [providerID = "", rest = ""] = value.split("/")
  const [id = "", variant] = rest.split("#")
  return { providerID, id, variant }
}

export const runVerify = async (options: { directory: string }): Promise<VerifyResult> => {
  const manifest = await readManifest(manifestFile())
  const checks: VerifyCheck[] = []

  checks.push({
    name: "manifest",
    ok: manifest !== undefined,
    detail: manifest ? `version ${manifest.version}, ${manifest.files.length} files` : `${manifestFile()} 없음`,
  })

  const definedIds = new Set(await installedAgentFiles())
  const { value: config } = await readConfig(configFile())

  let agents: AgentInfo[] = []
  try {
    agents = await runDebugAgents(options.directory)
    checks.push({ name: "opencode debug agents", ok: true, detail: `${agents.length} agents` })
  } catch (error) {
    checks.push({
      name: "opencode debug agents",
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    })
  }

  const byId = new Map(agents.map((agent) => [agent.id, agent]))

  for (const [id, mode] of Object.entries(expectedMode)) {
    checks.push({
      name: `${id} 파일`,
      ok: definedIds.has(id),
      detail: definedIds.has(id) ? "정의됨" : `${join(agentsDir(), `${id}.md`)} 없음`,
    })

    const agent = byId.get(id)
    if (!agent) continue

    checks.push({
      name: `${id} mode`,
      ok: agent.mode === mode,
      detail: `mode=${agent.mode ?? "(없음)"} (기대: ${mode})`,
    })

    const expectedModel = manifest?.models[id]
    if (expectedModel) {
      const parsed = parseModelRef(expectedModel)
      const actual = agent.model ?? undefined
      const match =
        actual !== undefined &&
        actual.providerID === parsed.providerID &&
        actual.id === parsed.id &&
        (parsed.variant === undefined || actual.variant === parsed.variant)
      checks.push({
        name: `${id} model`,
        ok: match,
        detail: actual
          ? `model=${JSON.stringify(actual)} (기대: ${expectedModel})`
          : `model 미지정 (기대: ${expectedModel})`,
      })
    }
  }

  for (const id of ["build", "plan"]) {
    checks.push({
      name: `${id} hidden`,
      ok: definedIds.has(id),
      detail: definedIds.has(id) ? "숨김 파일 정의됨" : `${id}.md 없음`,
    })
  }

  const defaultAgent = readDefaultAgent(config)
  checks.push({
    name: "default_agent",
    ok: defaultAgent === "pen",
    detail: `default_agent=${defaultAgent ?? "(없음)"} (기대: pen)`,
  })

  if (manifest?.config.rootModel !== undefined) {
    const rootModel = readRootModel(config)
    checks.push({
      name: "root model (pen 세션 모델)",
      ok: rootModel === manifest.config.rootModel,
      detail: `model=${rootModel ?? "(없음)"} (기대: ${manifest.config.rootModel})`,
    })
  }

  return { checks, ok: checks.every((check) => check.ok) }
}

/** 설치 전 상태(에이전트 파일 없음)를 확인한다. */
export const verifyInstallTarget = async (): Promise<VerifyCheck[]> => [
  { name: "config root", ok: true, detail: configRoot() },
  { name: "agents dir", ok: true, detail: agentsDir() },
]
