import { readConfig, readDefaultAgent, readRootModel } from "./config.ts"
import { readManifest } from "./fs.ts"
import { agentsDir, configFile, configRoot, manifestFile } from "./paths.ts"

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

export const runVerify = async (options: { directory: string; expectHiddenBuiltins: boolean }): Promise<VerifyResult> => {
  const manifest = await readManifest(manifestFile())
  const checks: VerifyCheck[] = []

  checks.push({
    name: "manifest",
    ok: manifest !== undefined,
    detail: manifest ? `version ${manifest.version}, ${manifest.files.length} files` : `${manifestFile()} 없음`,
  })

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
    return { checks, ok: false }
  }

  const byId = new Map(agents.map((agent) => [agent.id, agent]))

  for (const [id, mode] of Object.entries(expectedMode)) {
    const agent = byId.get(id)
    checks.push({
      name: `${id} mode`,
      ok: agent?.mode === mode,
      detail: agent ? `mode=${agent.mode ?? "(없음)"} (기대: ${mode})` : "agent가 없습니다",
    })
    if (!agent) continue

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
        detail: actual ? `model=${JSON.stringify(actual)} (기대: ${expectedModel})` : `model 미지정 (기대: ${expectedModel})`,
      })
    }
  }

  if (options.expectHiddenBuiltins) {
    for (const id of ["build", "plan"]) {
      const agent = byId.get(id)
      checks.push({
        name: `${id} hidden`,
        ok: agent?.hidden === true,
        detail: agent ? `hidden=${agent.hidden ?? false}` : "agent가 없습니다",
      })
    }
  }

  if (manifest?.models.pen) {
    const configResponse = await readConfig(configFile())
    const rootModel = readRootModel(configResponse.value)
    checks.push({
      name: "root model (pen 세션 모델)",
      ok: rootModel === manifest.models.pen,
      detail: `model=${rootModel ?? "(없음)"} (기대: ${manifest.models.pen})`,
    })
    const defaultAgent = readDefaultAgent(configResponse.value)
    checks.push({
      name: "default_agent",
      ok: defaultAgent === "pen",
      detail: `default_agent=${defaultAgent ?? "(없음)"} (기대: pen)`,
    })
  }

  return { checks, ok: checks.every((check) => check.ok) }
}

const parseModelRef = (value: string) => {
  const [providerID = "", rest = ""] = value.split("/")
  const [id = "", variant] = rest.split("#")
  return { providerID, id, variant }
}

/** 설치 전 상태(에이전트 파일 없음)를 확인한다. */
export const verifyInstallTarget = async (): Promise<VerifyCheck[]> => {
  const checks: VerifyCheck[] = []
  checks.push({
    name: "config root",
    ok: true,
    detail: configRoot(),
  })
  checks.push({
    name: "agents dir",
    ok: true,
    detail: agentsDir(),
  })
  return checks
}
