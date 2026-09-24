import { sha256 } from "./fs.ts"
import { AGENT_IDS, ModelRefSchema } from "./agent-contract.ts"

export const modelProfiles = {
  codex: {
    pen: "openai/gpt-6-sol#xhigh",
    "sub-pen": "openai/gpt-6-luna#max",
    "research-pen": "openai/gpt-6-luna#max",
    "explore-pen": "openai/gpt-6-luna#max",
    "doc-pen": "openai/gpt-6-luna#max",
    "verify-pen": "openai/gpt-6-luna#max",
    "security-pen": "openai/gpt-6-luna#max",
    "review-pen": "openai/gpt-6-luna#max",
  },
  claude: {
    pen: "anthropic/claude-opus-5-5#high",
    "sub-pen": "anthropic/claude-sonnet-5#xhigh",
    "research-pen": "anthropic/claude-sonnet-5#xhigh",
    "explore-pen": "anthropic/claude-sonnet-5#xhigh",
    "doc-pen": "anthropic/claude-sonnet-5#xhigh",
    "verify-pen": "anthropic/claude-sonnet-5#xhigh",
    "security-pen": "anthropic/claude-sonnet-5#xhigh",
    "review-pen": "anthropic/claude-sonnet-5#xhigh",
  },
} as const satisfies Record<'codex' | 'claude', Record<(typeof AGENT_IDS)[number], string>>

export const conventionModels = modelProfiles.codex

export type AgentModels = Record<string, string>

export type ModelMode = keyof typeof modelProfiles | "inherit" | "custom"

export const isValidModelRef = (value: string) => {
  return ModelRefSchema.safeParse(value).success
}

export const parseModelRef = (value: string) => {
  const valid = ModelRefSchema.parse(value)
  const slash = valid.indexOf("/")
  const remainder = valid.slice(slash + 1)
  const hash = remainder.indexOf("#")
  const id = hash === -1 ? remainder : remainder.slice(0, hash)
  const variant = hash === -1 ? undefined : remainder.slice(hash + 1)
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
