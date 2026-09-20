import { cp, mkdir, rm } from "node:fs/promises"
import { dirname, join } from "node:path"
import type { AssetSource } from "./assets.ts"
import { applyManagedKeys, readConfig, readRootModel, writeConfig, type ConfigChange } from "./config.ts"
import { exists, listFiles, readManifest, sha256, timestamp, writeManifest, type Manifest } from "./fs.ts"
import { writeModelLine } from "./models.ts"
import { backupDir, configFile, configRoot, manifestFile } from "./paths.ts"
import type { InstallAnswers } from "./interview.ts"

export type InstallOptions = {
  answers: InstallAnswers
  assets: AssetSource
  version: string
  dryRun: boolean
  force: boolean
  skipBackup: boolean
}

export type InstallResult = {
  wrote: string[]
  skipped: string[]
  preserved: string[]
  warnings: string[]
  backups: string[]
  configChanges: ConfigChange[]
}

/** asset 경로 → 설치 대상 경로. `agents/builtin/build.md`는 `agents/build.md`로 평탄화한다. */
const targetPathFor = (root: string, assetPath: string) => {
  const segments = assetPath.split("/")
  const fileName = segments.at(-1) ?? ""
  const isBuiltin = segments.includes("builtin")
  return isBuiltin ? join(root, "agents", fileName) : join(root, assetPath)
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

export const install = async (options: InstallOptions): Promise<InstallResult> => {
  const root = configRoot()
  const result: InstallResult = { wrote: [], skipped: [], preserved: [], warnings: [], backups: [], configChanges: [] }

  const assetPaths = await options.assets.list()
  const agentAssets = assetPaths.filter((path) => path.startsWith("agents/") && path.endsWith(".md"))
  if (agentAssets.length === 0) {
    throw new Error("에셋에 agent 정의가 없습니다. manifest를 확인하세요.")
  }

  const previous = await readManifest(manifestFile())
  const backupRoot = join(backupDir(), timestamp())
  const { value: currentConfig } = await readConfig(configFile())

  if (options.dryRun) {
    for (const assetPath of agentAssets) {
      if (isBuiltinAsset(assetPath) && !options.answers.hideBuiltins) continue
      result.wrote.push(`${targetPathFor(root, assetPath)} (dry-run)`)
    }
    if (options.answers.adoptDefaultAgent) result.wrote.push(`${configFile()} default_agent=pen (dry-run)`)
    if (options.answers.rootModel) {
      result.wrote.push(`${configFile()} model=${options.answers.rootModel} (dry-run)`)
    }
    for (const [agent, model] of Object.entries(options.answers.models)) {
      result.wrote.push(`agents/${agent}.md ← model: ${model} (dry-run)`)
    }
    return result
  }

  if (!options.skipBackup) {
    const backupTargets = [configFile(), ...agentAssets.map((path) => targetPathFor(root, path))]
    for (const target of backupTargets) {
      if (await backupFile(target, backupRoot, root)) result.backups.push(target)
    }
  }

  const files: Manifest["files"] = []

  for (const assetPath of agentAssets) {
    if (isBuiltinAsset(assetPath) && !options.answers.hideBuiltins) {
      result.skipped.push(assetPath)
      continue
    }

    const agentId = agentIdFor(assetPath)
    const target = targetPathFor(root, assetPath)
    const assetContent = await options.assets.read(assetPath)
    const previousEntry = previous?.files.find((file) => file.path === `agents/${agentId}.md`)

    if (previousEntry && (await exists(target))) {
      const onDisk = await Bun.file(target).text()
      const userModified = sha256(onDisk) !== previousEntry.sha256
      if (userModified && !options.force) {
        result.preserved.push(target)
        result.warnings.push(`${target} 는 설치 후 수정되었습니다. 사용자 변경을 보존합니다.`)
        files.push({ path: `agents/${agentId}.md`, sha256: sha256(onDisk), originSha256: previousEntry.originSha256 })
        continue
      }
    }

    const model = options.answers.models[agentId]
    const content = model ? writeModelLine(assetContent, model) : assetContent
    await mkdir(dirname(target), { recursive: true })
    await Bun.write(target, content)
    files.push({ path: `agents/${agentId}.md`, sha256: sha256(content), originSha256: sha256(assetContent) })
    result.wrote.push(target)
  }

  const desiredDefaultAgent = options.answers.adoptDefaultAgent ? "pen" : undefined
  const desiredRootModel = options.answers.rootModel
  const { next: nextConfig, changes } = applyManagedKeys(currentConfig, {
    defaultAgent: desiredDefaultAgent,
    rootModel: desiredRootModel,
  })
  if (changes.length > 0) {
    await writeConfig(configFile(), nextConfig)
    result.wrote.push(configFile())
    result.configChanges.push(...changes)
  }

  const manifest: Manifest = {
    version: options.version,
    installedAt: new Date().toISOString(),
    models: options.answers.models,
    files,
    config: {
      ...(previous?.config?.defaultAgent ? { defaultAgent: previous.config.defaultAgent } : {}),
      ...(previous?.config?.rootModel ? { rootModel: previous.config.rootModel } : {}),
      ...(desiredDefaultAgent ? { defaultAgent: desiredDefaultAgent } : {}),
      ...(desiredRootModel ? { rootModel: desiredRootModel } : {}),
    },
  }
  await writeManifest(manifestFile(), manifest)

  if (await exists(backupRoot)) {
    const backups = await listFiles(backupRoot)
    if (backups.length === 0) await rm(backupRoot, { recursive: true, force: true })
  }

  return result
}
