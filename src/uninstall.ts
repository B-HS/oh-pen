import { rm } from "node:fs/promises"
import { isAbsolute, join, relative } from "node:path"
import { readConfig, revertManagedKeys, writeConfig } from "./config.ts"
import { exists, readManifest, removeIfEmpty } from "./fs.ts"
import { agentsDir, backupDir, configFile, configRoot, managedDir } from "./paths.ts"

export type UninstallResult = {
  removed: string[]
  preserved: string[]
  warnings: string[]
}

/** manifest 기록 경로가 configRoot 안에 머무는지 검사한다. 위반이면 undefined. */
const containedTarget = (root: string, path: string) => {
  if (path.length === 0 || isAbsolute(path)) return undefined
  const invalid = path.split("/").filter((segment) => segment.length === 0 || segment === "." || segment === "..")
  if (invalid.length > 0) return undefined
  const target = join(root, path)
  const relativePath = relative(root, target)
  if (relativePath.startsWith("..") || isAbsolute(relativePath) || relativePath.length === 0) return undefined
  return target
}

/** manifest에 기록된 파일만 제거한다. 사용자가 수정한 파일은 보존한다. */
export const uninstall = async (options: { dryRun: boolean; force: boolean }): Promise<UninstallResult> => {
  const root = configRoot()
  const result: UninstallResult = { removed: [], preserved: [], warnings: [] }
  const manifest = await readManifest(join(managedDir(), "manifest.json"))

  if (!manifest) {
    result.warnings.push("manifest가 없습니다. 설치되지 않았거나 이미 제거되었습니다.")
    return result
  }

  for (const file of manifest.files) {
    const target = containedTarget(root, file.path)
    if (target === undefined) {
      result.warnings.push(`manifest의 경로가 설치 대상 밖이라 건너뜁니다: ${file.path}`)
      continue
    }
    if (!(await exists(target))) continue
    const onDisk = await Bun.file(target).text()
    const { sha256 } = await import("./fs.ts")
    if (sha256(onDisk) !== file.sha256 && !options.force) {
      result.preserved.push(target)
      continue
    }
    if (options.dryRun) {
      result.removed.push(`${target} (dry-run)`)
      continue
    }
    await rm(target, { force: true })
    result.removed.push(target)
  }

  const revertTargets: { defaultAgent?: string; rootModel?: string } = {}
  if (manifest.config.defaultAgent !== undefined) revertTargets.defaultAgent = manifest.config.defaultAgent
  if (manifest.config.rootModel !== undefined) revertTargets.rootModel = manifest.config.rootModel

  if (Object.keys(revertTargets).length > 0) {
    const { value } = await readConfig(configFile())
    const reverted = revertManagedKeys(value, revertTargets)
    if (reverted.changes.length > 0) {
      if (options.dryRun) {
        for (const change of reverted.changes) {
          result.removed.push(`${configFile()} ${change.key} (dry-run)`)
        }
      } else {
        await writeConfig(configFile(), reverted.next)
        result.warnings.push(
          `opencode.jsonc의 주석과 trailing comma가 재작성 과정에서 사라질 수 있습니다 (백업: ${backupDir()})`,
        )
        for (const change of reverted.changes) {
          result.removed.push(`${configFile()} ${change.key}`)
        }
      }
    }
    result.warnings.push(...reverted.warnings)
  }

  // 백업은 `--restore`를 위해 남긴다.
  if (!options.dryRun) {
    await removeIfEmpty(agentsDir())
  }

  return result
}
