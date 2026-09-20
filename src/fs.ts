import { createHash } from "node:crypto"
import { mkdir, readFile, readdir, rm, stat } from "node:fs/promises"
import { dirname, join, relative } from "node:path"

export type ManagedFile = {
  /** configRoot 기준 상대 경로. 예: `agents/pen.md` */
  path: string
  sha256: string
  /** 설치 시점의 asset 해시. 사용자 수정 여부 판별에 쓴다. */
  originSha256: string
}

export type Manifest = {
  version: string
  installedAt: string
  models: Record<string, string>
  files: ManagedFile[]
  /**
   * installer가 설정한 config 값. uninstall이 이 값과 일치할 때만 되돌린다.
   * 재설치 시 변경이 없어도 이전 값을 유지한다.
   */
  config: {
    defaultAgent?: string
    rootModel?: string
  }
}

export const sha256 = (data: string) => createHash("sha256").update(data).digest("hex")

export const readManifest = async (file: string): Promise<Manifest | undefined> => {
  try {
    const raw = await readFile(file, "utf8")
    return JSON.parse(raw) as Manifest
  } catch {
    return undefined
  }
}

export const writeManifest = async (file: string, manifest: Manifest) => {
  await mkdir(dirname(file), { recursive: true })
  await Bun.write(file, `${JSON.stringify(manifest, null, 2)}\n`)
}

export const timestamp = () => new Date().toISOString().replace(/[:.]/g, "-")

/** `dir` 아래 모든 파일의 상대 경로를 재귀 수집한다. */
export const listFiles = async (dir: string, base = dir): Promise<string[]> => {
  const entries = await readdir(dir, { withFileTypes: true })
  const results: string[] = []
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...(await listFiles(full, base)))
    } else if (entry.isFile()) {
      results.push(relative(base, full))
    }
  }
  return results
}

export const exists = async (path: string) => {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

export const removeIfEmpty = async (dir: string) => {
  try {
    const entries = await readdir(dir)
    if (entries.length === 0) await rm(dir, { recursive: false })
  } catch {
    // 디렉터리가 없거나 비어 있지 않다. 무시한다.
  }
}
