/** 모델 배정 기본안. 컨벤션 ai-process.md §1.2 의 Codex 표를 pen 세트에 대응시킨다. */
export const conventionModels = {
  pen: "openai/gpt-5.6-sol#high",
  "sub-pen": "openai/gpt-5.6-terra#medium",
  "research-pen": "openai/gpt-5.6-luna#medium",
  "explore-pen": "openai/gpt-5.6-luna#low",
  "doc-pen": "openai/gpt-5.6-luna#high",
  "verify-pen": "openai/gpt-5.6-luna#medium",
  "security-pen": "openai/gpt-5.6-luna#high",
} as const

export type AgentModels = Record<string, string>

export type ModelMode = "convention" | "inherit" | "custom"

/** `provider/model#variant` 형식을 검증한다. variant는 선택이다. */
export const isValidModelRef = (value: string) => {
  const hashIndex = value.indexOf("#")
  const withoutVariant = hashIndex === -1 ? value : value.slice(0, hashIndex)
  const variant = hashIndex === -1 ? "" : value.slice(hashIndex + 1)
  if (hashIndex !== -1 && variant.length === 0) return false
  if (variant.includes("#")) return false
  const slashIndex = withoutVariant.indexOf("/")
  if (slashIndex <= 0) return false
  if (slashIndex === withoutVariant.length - 1) return false
  return !withoutVariant.slice(0, slashIndex).includes("/")
}

/** frontmatter 블록의 시작·끝 인덱스를 찾는다. 없으면 undefined. */
const frontmatterRange = (markdown: string) => {
  const lines = markdown.split("\n")
  if (lines[0]?.trim() !== "---") return undefined
  const closeIndex = lines.indexOf("---", 1)
  if (closeIndex === -1) return undefined
  return { lines, closeIndex }
}

/** agent markdown의 frontmatter `model:` 값을 읽는다. 없으면 undefined. */
export const readModelLine = (markdown: string) => {
  const range = frontmatterRange(markdown)
  if (!range) return undefined
  const line = range.lines.slice(1, range.closeIndex).find((entry) => entry.startsWith("model:"))
  const value = line?.slice("model:".length).trim()
  return value && value.length > 0 ? value : undefined
}

/**
 * frontmatter의 `model:` 줄을 추가하거나 교체한다.
 * 본문은 건드리지 않는다. `model`이 undefined면 줄을 제거한다.
 */
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
