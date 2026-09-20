import { homedir } from "node:os"
import { join } from "node:path"

/** OpenCode V2는 XDG_CONFIG_HOME을 무시하고 홈 아래 고정 경로를 쓴다. */
export const configRoot = () => join(homedir(), ".config", "opencode")

export const agentsDir = () => join(configRoot(), "agents")

export const configFile = () => join(configRoot(), "opencode.jsonc")

export const managedDir = () => join(configRoot(), "oh-pencode")

export const manifestFile = () => join(managedDir(), "manifest.json")

export const backupDir = () => join(managedDir(), "backup")

export const managedAgentIds = [
  "pen",
  "sub-pen",
  "research-pen",
  "explore-pen",
  "doc-pen",
  "verify-pen",
  "security-pen",
  "build",
  "plan",
] as const

export type ManagedAgentId = (typeof managedAgentIds)[number]

/** 사용자가 임의로 추가할 수 있는 서브에이전트 접미사. */
export const userAgentSuffix = "-pen"
