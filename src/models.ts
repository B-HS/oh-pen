import { sha256 } from "./fs.ts"
import { AGENT_IDS, ModelRefSchema } from "./agent-contract.ts"

export const conventionModels = {
  pen: "openai/gpt-5.6-sol#high",
  "sub-pen": "openai/gpt-5.6-terra#medium",
  "research-pen": "openai/gpt-5.6-luna#medium",
  "explore-pen": "openai/gpt-5.6-luna#low",
  "doc-pen": "openai/gpt-5.6-luna#high",
  "verify-pen": "openai/gpt-5.6-luna#medium",
  "security-pen": "openai/gpt-5.6-luna#high",
  "review-pen": "openai/gpt-5.6-terra#high",
} as const satisfies Record<(typeof AGENT_IDS)[number], string>

export type AgentModels = Record<string, string>

export type ModelMode = "convention" | "inherit" | "custom"

export const isValidModelRef = (value: string) => {
  return ModelRefSchema.safeParse(value).success
}

export const parseModelRef = (value: string) => {
  const valid = ModelRefSchema.parse(value)
  const slash = valid.indexOf("/")
  const [id, variant] = valid.slice(slash + 1).split("#")
  return { providerID: valid.slice(0, slash), id, variant }
}

const frontmatterRange = (markdown: string) => {
  const lines = markdown.split("\n")
  if (lines[0]?.trim() !== "---") return undefined
  const closeIndex = lines.indexOf("---", 1)
  if (closeIndex === -1) return undefined
  return { lines, closeIndex }
}

export const readModelLine = (markdown: string) => {
  const range = frontmatterRange(markdown)
  if (!range) return undefined
  const line = range.lines.slice(1, range.closeIndex).find((entry) => entry.startsWith("model:"))
  const value = line?.slice("model:".length).trim()
  return value && value.length > 0 ? value : undefined
}

export const writeModelLine = (markdown: string, model: string | undefined) => {
  const range = frontmatterRange(markdown)
  if (!range) return markdown

  const { lines, closeIndex } = range
  const head = lines.slice(1, closeIndex)
  const body = lines.slice(closeIndex)
  const withoutModel = head.filter((line) => !line.startsWith("model:"))

  if (!model) return ["---", ...withoutModel, ...body].join("\n")

  const trimmed = withoutModel.filter((line, index) => !(index === withoutModel.length - 1 && line.trim() === ""))
  return ["---", ...trimmed, `model: ${model}`, ...body].join("\n")
}

export const hasOnlyModelOverride = (markdown: string, originSha256: string) =>
  sha256(writeModelLine(markdown, undefined)) === originSha256
