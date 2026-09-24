import { cp, mkdir, rm } from "node:fs/promises"
import { homedir } from "node:os"
import { dirname, isAbsolute, join, relative } from "node:path"
import type { AssetSource } from "./assets.ts"
import { installClaudeCompatibility } from "./claude-compat.ts"
import { applyManagedKeys, readConfig, writeConfig, type ConfigChange } from "./config.ts"
import { exists, listFiles, readManifest, sha256, timestamp, writeManifest, type Manifest } from "./fs.ts"
import { hasOnlyModelOverride, readModelLine, writeModelLine } from "./models.ts"
import { configRoot } from "./paths.ts"
import {
  AGENT_IDS,
  CONTRACT_ASSET,
  GOAL_COMMAND_ASSET,
  LEGACY_PLUGIN_ASSET,
  PLUGIN_ASSET,
  RESULT_ASSET,
  RUNTIME_ASSET,
  TUI_PLUGIN_ASSET,
  parseAgentFile,
} from "./agent-contract.ts"
import type { InstallAnswers } from "./interview.ts"

export type InstallOptions = {
  answers: InstallAnswers
  assets: AssetSource
  version: string
  dryRun: boolean
  force: boolean
  skipBackup: boolean
  root?: string
  claudeRoot?: string
  shellProfile?: string
}

export type InstallResult = {
  wrote: string[]
  skipped: string[]
  preserved: string[]
  warnings: string[]
  backups: string[]
  linked: string[]
  configChanges: ConfigChange[]
}

/** asset 상대 경로를 검증한다. 절대 경로·`..` 등으로 root 밖을 가리킬 수 있는 경로는 거부한다. */
const assertSafeAssetPath = (assetPath: string) => {
  if (assetPath.length === 0 || isAbsolute(assetPath)) {
    throw new Error(`asset 경로가 안전하지 않습니다: ${assetPath}`)
  }
  const invalid = assetPath.split("/").filter((segment) => segment.length === 0 || segment === "." || segment === "..")
  if (invalid.length > 0) {
    throw new Error(`asset 경로가 안전하지 않습니다: ${assetPath}`)
  }
}

/** asset 경로 → 설치 대상 경로. `agents/builtin/build.md`는 `agents/build.md`로 평탄화한다. */
const targetPathFor = (root: string, assetPath: string) => {
  assertSafeAssetPath(assetPath)
  const segments = assetPath.split("/")
  const fileName = segments.at(-1) ?? ""
  const isBuiltin = segments.includes("builtin")
  const target = isBuiltin ? join(root, "agents", fileName) : join(root, assetPath)
  if (relative(root, target).startsWith("..") || isAbsolute(relative(root, target))) {
    throw new Error(`asset 경로가 설치 대상 밖으로 벗어납니다: ${assetPath}`)
  }
  return target
}

const agentIdFor = (assetPath: string) => (assetPath.split("/").at(-1) ?? "").replace(/\.md$/, "")

const isBuiltinAsset = (assetPath: string) => assetPath.split("/").includes("builtin")

const backupFile = async (source: string, backupRoot: string, root: string) => {
  if (!(await exists(source))) return false
  const relative = source.startsWith(`${root}/`) ? source.slice(root.length + 1) : (source.split("/").at(-1) ?? "file")
  const destination = join(backupRoot, relative)
  await mkdir(dirname(destination), { recursive: true })
  await cp(source, destination)
  return true
}

const configRewriteWarning = (backupRoot: string) =>
  `opencode.jsonc의 주석과 trailing comma가 재작성 과정에서 사라질 수 있습니다 (백업: ${backupRoot})`

export const install = async (options: InstallOptions): Promise<InstallResult> => {
  const root = options.root ?? configRoot()
  const manifestPath = join(root, "oh-pencode", "manifest.json")
  const configurationPath = join(root, "opencode.jsonc")
  const backupsPath = join(root, "oh-pencode", "backup")
  const result: InstallResult = { wrote: [], skipped: [], preserved: [], warnings: [], backups: [], linked: [], configChanges: [] }

  const assetPaths = await options.assets.list()
  const allowed = new Set([
    ...AGENT_IDS.map((id) => `agents/${id}.md`),
    "agents/builtin/build.md",
    "agents/builtin/plan.md",
    PLUGIN_ASSET,
    TUI_PLUGIN_ASSET,
    GOAL_COMMAND_ASSET,
    RUNTIME_ASSET,
    CONTRACT_ASSET,
    RESULT_ASSET,
  ])
  if (assetPaths.some((path) => !allowed.has(path))) throw new Error("지원하지 않는 설치 에셋 경로가 있습니다.")
  const agentAssets = assetPaths.filter((path) => path.startsWith("agents/"))
  const managedAssets = assetPaths
  const contents = new Map(await Promise.all(managedAssets.map(async (path) => {
    const content = await options.assets.read(path)
    if (path.startsWith("agents/")) parseAgentFile(content)
    return [path, content] as const
  })))
  if (agentAssets.length === 0) {
    throw new Error("에셋에 agent 정의가 없습니다. manifest를 확인하세요.")
  }

  const previous = await readManifest(manifestPath)
  const backupRoot = join(backupsPath, timestamp())
  const { value: currentConfig } = await readConfig(configurationPath)

  if (options.dryRun) {
    for (const assetPath of managedAssets) {
      if (isBuiltinAsset(assetPath) && !options.answers.hideBuiltins) continue
      result.wrote.push(`${targetPathFor(root, assetPath)} (dry-run)`)
    }
    if (options.answers.adoptDefaultAgent) result.wrote.push(`${configurationPath} default_agent=pen (dry-run)`)
    if (options.answers.rootModel) {
      result.wrote.push(`${configurationPath} model=${options.answers.rootModel} (dry-run)`)
    }
    for (const [agent, model] of Object.entries(options.answers.models)) {
      result.wrote.push(`agents/${agent}.md ← model: ${model} (dry-run)`)
    }
    const compatibility = await installClaudeCompatibility({
      configRoot: root,
      claudeRoot: options.claudeRoot ?? join(homedir(), ".claude"),
      shellProfile: options.shellProfile ?? join(homedir(), ".zshenv"),
      dryRun: true,
    })
    result.linked.push(...compatibility.links.map((link) => `${join(root, link.path)} → ${link.target} (dry-run)`))
    if (compatibility.wroteShellProfile) result.wrote.push(`${compatibility.shellProfile} (dry-run)`)
    result.warnings.push(...compatibility.warnings)
    return result
  }

  if (!options.skipBackup) {
    const backupTargets = [configurationPath, ...managedAssets.map((path) => targetPathFor(root, path))]
    const legacyEntry = previous?.files.find((file) => file.path === LEGACY_PLUGIN_ASSET)
    if (legacyEntry) backupTargets.push(join(root, LEGACY_PLUGIN_ASSET))
    const compatibilityPreview = await installClaudeCompatibility({
      configRoot: root,
      claudeRoot: options.claudeRoot ?? join(homedir(), ".claude"),
      shellProfile: options.shellProfile ?? join(homedir(), ".zshenv"),
      dryRun: true,
    })
    if (compatibilityPreview.wroteShellProfile) backupTargets.push(compatibilityPreview.shellProfile)
    for (const target of backupTargets) {
      if (await backupFile(target, backupRoot, root)) result.backups.push(target)
    }
  }

  const legacyEntry = previous?.files.find((file) => file.path === LEGACY_PLUGIN_ASSET)
  const legacyTarget = join(root, LEGACY_PLUGIN_ASSET)
  if (legacyEntry && (await exists(legacyTarget))) {
    const legacyContent = await Bun.file(legacyTarget).text()
    if (sha256(legacyContent) === legacyEntry.sha256 || options.force) {
      await rm(legacyTarget, { force: true })
      result.wrote.push(`${legacyTarget} 제거`)
    } else {
      result.preserved.push(legacyTarget)
      result.warnings.push(`${legacyTarget} 는 설치 후 수정되어 기존 plugin을 보존합니다.`)
    }
  }

  const files: Manifest["files"] = []

  for (const assetPath of managedAssets) {
    if (isBuiltinAsset(assetPath) && !options.answers.hideBuiltins) {
      result.skipped.push(assetPath)
      continue
    }

    const agentId = agentIdFor(assetPath)
    const target = targetPathFor(root, assetPath)
    const assetContent = contents.get(assetPath)
    if (assetContent === undefined) throw new Error("에셋 내용을 찾을 수 없습니다.")
    const installedPath = relative(root, target)
    const isAgent = assetPath.startsWith("agents/")
    const previousEntry = previous?.files.find((file) => file.path === installedPath)
    let shouldPreserveModel = false
    let preservedModel: string | undefined

    if (previousEntry && (await exists(target))) {
      const onDisk = await Bun.file(target).text()
      const userModified = sha256(onDisk) !== previousEntry.sha256
      const isOnlyModelOverride = isAgent && hasOnlyModelOverride(onDisk, previousEntry.originSha256)
      if (userModified && isOnlyModelOverride && !options.force) {
        shouldPreserveModel = true
        preservedModel = readModelLine(onDisk)
        result.preserved.push(`${target} model`)
        result.warnings.push(`${target} 의 사용자 지정 model을 보존하고 agent 본문을 갱신합니다.`)
      }
      if (userModified && !isOnlyModelOverride && !options.force) {
        result.preserved.push(target)
        result.warnings.push(`${target} 는 설치 후 수정되었습니다. 사용자 변경을 보존합니다.`)
        files.push({ path: installedPath, sha256: sha256(onDisk), originSha256: previousEntry.originSha256 })
        continue
      }
    }

    const model = shouldPreserveModel ? preservedModel : options.answers.models[agentId]
    const content = isAgent && model ? writeModelLine(assetContent, model) : assetContent
    await mkdir(dirname(target), { recursive: true })
    await Bun.write(target, content)
    files.push({ path: installedPath, sha256: sha256(content), originSha256: sha256(assetContent) })
    result.wrote.push(target)
  }

  const installedModels = Object.fromEntries(
    (
      await Promise.all(
        files.filter((file) => file.path.startsWith("agents/")).map(async (file) => {
          const installedContent = await Bun.file(join(root, file.path)).text()
          const installedModel = readModelLine(installedContent)
          const agentId = file.path.split("/").at(-1)?.replace(/\.md$/, "") ?? ""
          return installedModel ? [[agentId, installedModel] as const] : []
        }),
      )
    ).flat(),
  )

  const desiredDefaultAgent = options.answers.adoptDefaultAgent ? "pen" : undefined
  const shouldPreserveCurrentRootModel =
    options.answers.preserveCurrentRootModel &&
    options.answers.currentRootModel !== undefined &&
    previous?.config.rootModel !== options.answers.currentRootModel &&
    !options.force
  const desiredRootModel = shouldPreserveCurrentRootModel ? options.answers.currentRootModel : options.answers.rootModel
  if (shouldPreserveCurrentRootModel) {
    result.preserved.push(`${configurationPath} model`)
    result.warnings.push(`${configurationPath} 의 사용자 지정 root model을 보존합니다.`)
  }
  const { next: nextConfig, changes } = applyManagedKeys(currentConfig, {
    defaultAgent: desiredDefaultAgent,
    rootModel: desiredRootModel,
  })
  if (changes.length > 0) {
    await writeConfig(configurationPath, nextConfig)
    result.wrote.push(configurationPath)
    result.configChanges.push(...changes)
    result.warnings.push(configRewriteWarning(backupRoot))
  }

  const compatibility = await installClaudeCompatibility({
    configRoot: root,
    claudeRoot: options.claudeRoot ?? join(homedir(), ".claude"),
    shellProfile: options.shellProfile ?? join(homedir(), ".zshenv"),
    dryRun: false,
  })
  result.linked.push(...compatibility.links.map((link) => `${join(root, link.path)} → ${link.target}`))
  result.warnings.push(...compatibility.warnings)
  if (compatibility.wroteShellProfile) result.wrote.push(compatibility.shellProfile)

  const previousProjectConfigLine =
    compatibility.previousProjectConfigLine ?? previous?.claudeCompatibility?.previousProjectConfigLine
  const hasClaudeRule = compatibility.links.some((link) => link.path === "AGENTS.md")
  const manifest: Manifest = {
    version: options.version,
    installedAt: new Date().toISOString(),
    models: installedModels,
    files,
    links: compatibility.links,
    ...(hasClaudeRule
      ? {
          claudeCompatibility: {
            shellProfile: compatibility.shellProfile,
            ...(previousProjectConfigLine ? { previousProjectConfigLine } : {}),
          },
        }
      : {}),
    config: {
      ...(previous?.config?.defaultAgent ? { defaultAgent: previous.config.defaultAgent } : {}),
      ...(previous?.config?.rootModel ? { rootModel: previous.config.rootModel } : {}),
      ...(desiredDefaultAgent ? { defaultAgent: desiredDefaultAgent } : {}),
      ...(desiredRootModel ? { rootModel: desiredRootModel } : {}),
    },
  }
  await writeManifest(manifestPath, manifest)

  if (await exists(backupRoot)) {
    const backups = await listFiles(backupRoot)
    if (backups.length === 0) await rm(backupRoot, { recursive: true, force: true })
  }

  return result
}
