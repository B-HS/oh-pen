import { exists } from "./fs.ts"

export type ConfigObject = Record<string, unknown>

/** installer가 opencode.jsonc에서 관리하는 키. */
export const managedConfigKeys = ["default_agent", "model"] as const
export type ManagedConfigKey = (typeof managedConfigKeys)[number]

export const readConfig = async (file: string): Promise<{ value: ConfigObject; raw: string | undefined }> => {
  if (!(await exists(file))) return { value: {}, raw: undefined }
  const raw = await Bun.file(file).text()
  try {
    const parsed = Bun.JSONC.parse(raw) as unknown
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return { value: parsed as ConfigObject, raw }
    }
    return { value: {}, raw }
  } catch (error) {
    throw new Error(`${file} 를 파싱하지 못했습니다: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export const writeConfig = async (file: string, value: ConfigObject) => {
  const withSchema = { $schema: "https://opencode.ai/config.json", ...value }
  await Bun.write(file, `${JSON.stringify(withSchema, null, 2)}\n`)
}

export const readDefaultAgent = (value: ConfigObject) => {
  const raw = value.default_agent
  return typeof raw === "string" ? raw : undefined
}

export const readRootModel = (value: ConfigObject) => {
  const raw = value.model
  return typeof raw === "string" ? raw : undefined
}

export type ConfigChange = {
  key: ManagedConfigKey
  from: string | undefined
  to: string | undefined
}

/**
 * installer가 관리하는 키만 바꾸고 사용자 키는 보존한다.
 * pen의 primary 세션 모델은 root `model`이 결정하므로(실측) `model`도 관리한다.
 */
export const applyManagedKeys = (
  current: ConfigObject,
  desired: { defaultAgent?: string | undefined; rootModel?: string | undefined },
): { next: ConfigObject; changes: ConfigChange[] } => {
  const next: ConfigObject = structuredClone(current)
  const changes: ConfigChange[] = []

  if (desired.defaultAgent !== undefined && next.default_agent !== desired.defaultAgent) {
    changes.push({ key: "default_agent", from: readDefaultAgent(current), to: desired.defaultAgent })
    next.default_agent = desired.defaultAgent
  }

  if (desired.rootModel !== undefined && next.model !== desired.rootModel) {
    changes.push({ key: "model", from: readRootModel(current), to: desired.rootModel })
    next.model = desired.rootModel
  }

  return { next, changes }
}

export type ConfigRevert = {
  next: ConfigObject
  changes: ConfigChange[]
  warnings: string[]
}

/** installer가 설치한 값과 일치할 때만 되돌린다. 사용자가 바꾼 값은 보존한다. */
export const revertManagedKeys = (
  current: ConfigObject,
  installed: { defaultAgent?: string; rootModel?: string },
): ConfigRevert => {
  const next: ConfigObject = structuredClone(current)
  const changes: ConfigChange[] = []
  const warnings: string[] = []

  if (installed.defaultAgent !== undefined) {
    if (next.default_agent === installed.defaultAgent) {
      changes.push({ key: "default_agent", from: installed.defaultAgent, to: undefined })
      delete next.default_agent
    } else if (next.default_agent !== undefined) {
      warnings.push(`default_agent 가 ${String(next.default_agent)} 이므로 유지했습니다.`)
    }
  }

  if (installed.rootModel !== undefined) {
    if (next.model === installed.rootModel) {
      changes.push({ key: "model", from: installed.rootModel, to: undefined })
      delete next.model
    } else if (next.model !== undefined) {
      warnings.push(`model 이 ${String(next.model)} 이므로 유지했습니다.`)
    }
  }

  return { next, changes, warnings }
}
