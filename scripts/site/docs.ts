import { readFile } from "node:fs/promises"
import { join } from "node:path"

export type DocSection = {
  level: 2 | 3
  id: string
  text: string
}

export type DocCategory = "design" | "contract" | "project" | "history"

export type DocPage = {
  slug: string
  href: string
  source: string
  title: string
  category: DocCategory
  summary: string
  order: number
}

export const docPages: DocPage[] = [
  {
    slug: "architecture",
    href: "docs/architecture.html",
    source: "docs/pen/architecture.md",
    title: "에이전트 세트 설계",
    category: "design",
    summary: "pen을 포함한 7개 에이전트의 역할, 모델 배정, 권한, 위임 계약, 확장 방법.",
    order: 1,
  },
  {
    slug: "installer",
    href: "docs/installer.html",
    source: "docs/pen/installer.md",
    title: "installer 설계",
    category: "design",
    summary: "GitHub Pages 배포, CLI 명령과 플래그, 설치 파일 조작, 무결성 검증, 안전 규칙.",
    order: 2,
  },
  {
    slug: "v2-agents",
    href: "docs/v2-agents.html",
    source: "docs/opencode/v2-agents.md",
    title: "OpenCode V2 Agent 계약",
    category: "contract",
    summary: "V2 agent 스키마, permissions 병합 규칙, 모델 선택, 실측으로 확인한 동작.",
    order: 3,
  },
  {
    slug: "v2-install-surface",
    href: "docs/v2-install-surface.html",
    source: "docs/opencode/v2-install-surface.md",
    title: "OpenCode V2 설치 지점",
    category: "contract",
    summary: "설치 경로, 설정 우선순위, 멱등성, build/plan 숨김 방식, 설치 후 검증.",
    order: 4,
  },
  {
    slug: "decisions",
    href: "docs/decisions.html",
    source: "docs/acknowledge/decisions.md",
    title: "결정과 합의",
    category: "project",
    summary: "사용자 결정 D1~D11, 해소된 미해결 항목, 실측 전제 기록.",
    order: 5,
  },
  {
    slug: "process",
    href: "docs/process.html",
    source: "docs/PROCESS.md",
    title: "작업 상태",
    category: "project",
    summary: "체크리스트, 검증 결과 표, 저장소·배포·커밋 기록.",
    order: 6,
  },
  {
    slug: "history/2026-09-20-audit-and-integrity",
    href: "docs/history/2026-09-20-audit-and-integrity.html",
    source: "docs/history/2026-09-20-audit-and-integrity.md",
    title: "전수조사와 무결성 이력",
    category: "history",
    summary: "읽기 전용 에이전트 4종 전수조사, 정합성 수정, install:local 회귀 해소, 검증 결과.",
    order: 7,
  },
]

export const docCategories: { id: DocCategory; label: string }[] = [
  { id: "design", label: "설계" },
  { id: "contract", label: "OpenCode 계약" },
  { id: "project", label: "프로젝트" },
  { id: "history", label: "이력" },
]

const repoRoot = join(import.meta.dir, "..", "..")

const stripLeadingTitle = (markdown: string) => markdown.replace(/^# [^\n]*\n+/, "")

const wrapTables = (html: string) =>
  html.replaceAll("<table>", '<div class="table-scroll"><table>').replaceAll("</table>", "</table></div>")

export type RenderedDoc = {
  html: string
  sections: DocSection[]
  lineCount: number
}

export const renderDoc = async (doc: DocPage): Promise<RenderedDoc> => {
  const raw = await readFile(join(repoRoot, doc.source), "utf8")
  const sections: DocSection[] = []
  let headingCount = 0
  const body = wrapTables(
    Bun.markdown.html(stripLeadingTitle(raw)).replace(
      /<h([23])>([\s\S]*?)<\/h\1>/g,
      (_match: string, level: string, inner: string) => {
        headingCount += 1
        const id = `sec-${headingCount}`
        sections.push({ level: level === "3" ? 3 : 2, id, text: inner.replace(/<[^>]+>/g, "").trim() })
        return `<h${level} id="${id}">${inner}</h${level}>`
      },
    ),
  )
  return { html: body, sections, lineCount: raw.split("\n").length }
}
