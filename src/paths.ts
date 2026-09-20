import { homedir } from "node:os"
import { join } from "node:path"

/** OpenCode V2는 XDG_CONFIG_HOME을 무시하고 홈 아래 고정 경로를 쓴다. */
export const configRoot = () => join(homedir(), ".config", "opencode")

export const agentsDir = () => join(configRoot(), "agents")

export const configFile = () => join(configRoot(), "opencode.jsonc")

export const managedDir = () => join(configRoot(), "oh-pencode")

export const manifestFile = () => join(managedDir(), "manifest.json")

export const backupDir = () => join(managedDir(), "backup")
