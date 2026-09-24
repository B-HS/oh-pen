import { createHash } from "node:crypto"
import { mkdir, readFile, readdir, rm, stat } from "node:fs/promises"
import { dirname, join, relative } from "node:path"
import { z } from "zod"
import { ModelRefSchema } from "./agent-contract.ts"

export const ManifestSchema = z.object({
  version: z.string(), installedAt: z.string(), models: z.record(z.string(), ModelRefSchema),
  files: z.array(z.object({ path: z.string(), sha256: z.string(), originSha256: z.string() })),
  config: z.object({ defaultAgent: z.string().optional(), rootModel: z.string().optional() }),
  links: z.array(z.object({ path: z.string(), target: z.string() })).optional(),
  claudeCompatibility: z
    .object({
      shellProfile: z.string(),
      previousProjectConfigLine: z.string().optional(),
    })
    .optional(),
})
export type Manifest = z.infer<typeof ManifestSchema>
export type ManagedFile = Manifest["files"][number]
export type ManagedLink = NonNullable<Manifest['links']>[number]

export const sha256 = (data: string) => createHash("sha256").update(data).digest("hex")

export const readManifest = async (file: string): Promise<Manifest | undefined> => {
  try {
    const raw = await readFile(file, "utf8")
    return ManifestSchema.parse(JSON.parse(raw))
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
