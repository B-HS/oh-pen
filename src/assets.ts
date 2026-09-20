import { readdir } from "node:fs/promises"
import { exists } from "./fs.ts"

export type AssetSource = {
  /** `agents/pen.md` 같은 상대 경로의 내용을 읽는다. */
  read: (path: string) => Promise<string>
  list: () => Promise<string[]>
}

/** GitHub Pages·로컬 `dist/` 같은 HTTP 기반 asset 소스. */
export const httpAssets = (baseUrl: string, manifestAssets: string[]): AssetSource => {
  const normalized = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl
  return {
    read: async (path) => {
      const response = await fetch(`${normalized}/${path}`)
      if (!response.ok) {
        throw new Error(`에셋을 내려받지 못했습니다: ${path} (HTTP ${response.status})`)
      }
      return response.text()
    },
    list: async () => manifestAssets,
  }
}

/** 레포 안의 `assets/` 를 직접 읽는 로컬 소스. 개발·테스트용. */
export const localAssets = (root: string): AssetSource => ({
  read: async (path) => {
    const file = `${root}/${path}`
    if (!(await exists(file))) throw new Error(`에셋이 없습니다: ${path}`)
    return Bun.file(file).text()
  },
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
})
