import { readdir } from "node:fs/promises"
import { exists, sha256 } from "./fs.ts"

export type AssetVerification =
  | { mode: "sha256"; hashes: Record<string, string> }
  | { mode: "skipped"; reason: string }

export type AssetSource = {
  /** `agents/pen.md` 같은 상대 경로의 내용을 읽는다. */
  read: (path: string) => Promise<string>
  list: () => Promise<string[]>
  /** 무결성 검증 방식. 해시 정보가 없으면 skipped다. */
  verification: AssetVerification
}

/** 검증 정보가 없을 때 사용자에게 보여줄 경고 1줄. 검증 가능하면 undefined. */
export const verificationWarning = (verification: AssetVerification) =>
  verification.mode === "skipped" ? verification.reason : undefined

const missingHashReason = "sha256 검증 정보가 없어 에셋 해시 검증을 건너뜁니다."

const assertSha256 = (verification: AssetVerification, path: string, content: string) => {
  if (verification.mode !== "sha256") return
  const expected = verification.hashes[path]
  if (expected === undefined) {
    throw new Error(`manifest에 에셋 해시 정보가 없습니다: ${path}`)
  }
  if (sha256(content) !== expected) {
    throw new Error(`에셋 sha256이 일치하지 않습니다: ${path}`)
  }
}

/** GitHub Pages·로컬 `dist/` 같은 HTTP 기반 asset 소스. */
export const httpAssets = (baseUrl: string, manifestAssets: string[], sha256Map?: Record<string, string>): AssetSource => {
  const normalized = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl
  const verification: AssetVerification = sha256Map
    ? { mode: "sha256", hashes: sha256Map }
    : { mode: "skipped", reason: missingHashReason }
  return {
    verification,
    read: async (path) => {
      const response = await fetch(`${normalized}/${path}`)
      if (!response.ok) {
        throw new Error(`에셋을 내려받지 못했습니다: ${path} (HTTP ${response.status})`)
      }
      const content = await response.text()
      assertSha256(verification, path, content)
      return content
    },
    list: async () => manifestAssets,
  }
}

export type LocalAssetsOptions = {
  /** manifest 기반 소스에서 asset 읽기 접두사. `assets`면 `<root>/assets/<asset>`을 읽는다. */
  assetPrefix?: string
  /** manifest가 지정한 asset 목록. 없으면 root를 재귀 탐색한다(하위호환). */
  assets?: string[]
  /** manifest가 지정한 sha256 맵. 있으면 read 때 검증한다. */
  sha256?: Record<string, string>
}

/** 레포 안의 로컬 디렉터리를 직접 읽는 소스. 개발·테스트용. */
export const localAssets = (root: string, options: LocalAssetsOptions = {}): AssetSource => {
  const verification: AssetVerification = options.sha256
    ? { mode: "sha256", hashes: options.sha256 }
    : { mode: "skipped", reason: missingHashReason }
  const fileFor = (path: string) => (options.assetPrefix ? `${root}/${options.assetPrefix}/${path}` : `${root}/${path}`)
  const read = async (path: string) => {
    const file = fileFor(path)
    if (!(await exists(file))) throw new Error(`에셋이 없습니다: ${path}`)
    const content = await Bun.file(file).text()
    assertSha256(verification, path, content)
    return content
  }
  const manifestAssets = options.assets
  if (manifestAssets) {
    return { verification, read, list: async () => manifestAssets }
  }
  return {
    verification,
    read,
    list: async () => {
      const results: string[] = []
      const walk = async (dir: string, prefix: string) => {
        const entries = await readdir(dir, { withFileTypes: true })
        for (const entry of entries) {
          const next = `${prefix}/${entry.name}`
          if (entry.isDirectory()) {
            await walk(`${dir}/${entry.name}`, next)
          } else if (entry.isFile()) {
            results.push(next.replace(/^\//, ""))
          }
        }
      }
      await walk(root, "")
      return results
    },
  }
}
