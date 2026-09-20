import { docCategories, docPages, type DocSection } from "./docs.ts"
import { appIcon, icon } from "./icons.ts"

export type LayoutOptions = {
  /** <title>과 헤더에 쓰는 페이지 제목 */
  title: string
  /** meta description */
  description: string
  /** "index.html" | "docs/index.html" | "docs/architecture.html" 등. 레일·헤더의 aria-current 판정에 쓴다 */
  activeHref: string
  /** "en" | "ko" */
  lang: "en" | "ko"
  /** "surface-b" | "surface-a" */
  surface: "surface-b" | "surface-a"
  /** 페이지 본문 HTML */
  body: string
  /** 있으면 우측 context 패널에 목차를 렌더한다 */
  toc?: DocSection[]
  /** context 패널 상단에 표시할 문서 메타 (source 경로·줄 수 등) */
  meta?: { label: string; value: string }[]
  /** 상단 breadcrumb. 첫 항목은 보통 {label:"oh-pen", href:"index.html"} */
  breadcrumb?: { label: string; href: string }[]
  /** 이전·다음 문서 페이저. 문서 페이지에서만 */
  pager?: { prev?: { href: string; title: string }; next?: { href: string; title: string } }
}

const SITE_TITLE_SUFFIX = " — oh-pen"
const STORAGE_KEY = "oh-pencode-theme"

const prePaintScript = `<script>if(localStorage.getItem('${STORAGE_KEY}')==='dark')document.documentElement.classList.add('dark')</script>`

const themeToggleScript = `<script>
document.querySelector('.theme-toggle').addEventListener('click', () => {
  const dark = document.documentElement.classList.toggle('dark')
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  localStorage.setItem('${STORAGE_KEY}', dark ? 'dark' : 'light')
})
</script>`

const depthPrefix = (activeHref: string) => "../".repeat(activeHref.split("/").length - 1)

const styleHref = (activeHref: string) => `${depthPrefix(activeHref)}site.css`

const esc = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;")

const navLink = (href: string, activeHref: string, label: string) => {
  const active = href === activeHref
  return `<a class="nav-link${active ? " nav-link--active" : ""}" href="${href}"${active ? ' aria-current="page"' : ""}>${esc(label)}</a>`
}

const themeToggle = () =>
  `<button class="theme-toggle" type="button" aria-label="테마 전환">${icon("sun")}${icon("moon")}</button>`

const footerLinks = `<nav class="footer-meta" aria-label="사이트 링크"><a href="https://github.com/B-HS/oh-pen">GitHub</a><a href="https://b-hs.github.io/oh-pen/">배포</a></nav>`

const surfaceBBody = (options: LayoutOptions) => {
  const prefix = depthPrefix(options.activeHref)
  const active = options.activeHref === "index.html" ? "index.html" : "docs/index.html"
  return `<!doctype html>
<html lang="${options.lang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${esc(options.title)}${SITE_TITLE_SUFFIX}</title>
    <meta name="description" content="${esc(options.description)}" />
    ${prePaintScript}
    <link rel="stylesheet" href="${styleHref(options.activeHref)}" />
  </head>
  <body class="surface-b">
    <a class="skip-link" href="#main">Skip to content</a>
    <header class="site-header">
      <div class="site-header-inner">
        <a class="wordmark" href="${prefix}index.html">${appIcon()}<span class="wordmark-mark">oh-pen</span></a>
        <nav class="site-nav">
          ${navLink(`${prefix}index.html`, prefix === "" ? active : `${prefix}index.html`, "Home")}
          ${navLink(`${prefix}docs/index.html`, prefix === "" ? active : `${prefix}docs/index.html`, "Docs")}
          ${themeToggle()}
        </nav>
      </div>
    </header>
    <main id="main" class="site-main">${options.body}</main>
    <footer class="site-footer">
      <div class="footer-inner">
        ${footerLinks}
        <p class="footer-meta">oh-pen · OpenCode V2 agent set installer</p>
      </div>
    </footer>
    ${themeToggleScript}
  </body>
</html>`
}

const docLinks = [...docPages].sort((a, b) => a.order - b.order)

const contextPanel = (options: LayoutOptions) => {
  const metaRows = (options.meta ?? [])
    .map((row) => `<div><span>${esc(row.label)}</span><span>${esc(row.value)}</span></div>`)
    .join("")
  const tocItems = (options.toc ?? [])
    .map(
      (section) =>
        `<a class="toc-item${section.level === 3 ? " toc-item--h3" : ""}" href="#${section.id}">${esc(section.text)}</a>`,
    )
    .join("")
  const metaBlock =
    metaRows.length > 0
      ? `<div class="context-block"><p class="context-title">문서 정보</p><div class="doc-meta">${metaRows}</div></div>`
      : ""
  const tocBlock =
    tocItems.length > 0
      ? `<div class="context-block"><p class="context-title">목차</p><nav class="toc">${tocItems}</nav></div>`
      : `<div class="context-block"><p class="context-title">oh-pen</p><div class="panel-content"><p>oh-pen은 OpenCode V2 에이전트 세트 설치기다. 좌측 레일에서 문서를 고르세요.</p></div></div>`
  return `${metaBlock}${tocBlock}`
}

const crumbRow = (options: LayoutOptions) => {
  const items = options.breadcrumb ?? []
  if (items.length === 0) return ""
  const crumbs = items
    .map((item, index) => {
      const isLast = index === items.length - 1
      if (isLast) return `<span aria-current="page">${esc(item.label)}</span>`
      return `<a href="${item.href}">${esc(item.label)}</a><span aria-hidden="true">/</span>`
    })
    .join("")
  return `<nav class="crumb" aria-label="위치">${crumbs}</nav>`
}

const pagerRow = (options: LayoutOptions) => {
  const prev = options.pager?.prev
  const next = options.pager?.next
  if (prev === undefined && next === undefined) return ""
  const prevSide = prev
    ? `<a class="pager-btn" href="${prev.href}">${icon("arrow-left")}<span>${esc(prev.title)}</span></a>`
    : `<span class="pager-spacer"></span>`
  const nextSide = next
    ? `<a class="pager-btn" href="${next.href}"><span>${esc(next.title)}</span>${icon("arrow-right")}</a>`
    : `<span class="pager-spacer"></span>`
  return `<nav class="pager" aria-label="문서 이동">${prevSide}${nextSide}</nav>`
}

const surfaceABody = (options: LayoutOptions) => {
  const prefix = depthPrefix(options.activeHref)
  return `<!doctype html>
<html lang="${options.lang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${esc(options.title)}${SITE_TITLE_SUFFIX}</title>
    <meta name="description" content="${esc(options.description)}" />
    ${prePaintScript}
    <link rel="stylesheet" href="${styleHref(options.activeHref)}" />
  </head>
  <body class="surface-a">
    <a class="skip-link" href="#main">본문으로 건너뛰기</a>
    <div class="shell">
      <aside class="rail">
        <div class="rail-header">
          <a class="rail-wordmark" href="${prefix}index.html">${appIcon()}<span class="rail-title">oh-pen</span></a>
        </div>
        <nav class="rail-menu" aria-label="문서">
${docCategories
  .map((category) => {
    const items = docLinks
      .filter((page) => page.category === category.id)
      .map(
        (page) =>
          `          <a class="rail-item${page.href === options.activeHref ? " rail-item--active" : ""}" href="${prefix}${page.href}"${page.href === options.activeHref ? ' aria-current="page"' : ""}>${icon("doc")}<span>${esc(page.title)}</span></a>`,
      )
      .join("\n")
    return `          <p class="rail-group-label">${esc(category.label)}</p>
${items}`
  })
  .join("\n")}
        </nav>
        <div class="rail-footer">${themeToggle()}</div>
      </aside>
      <main id="main" class="content">
        <div class="content-scroll">
          <div class="page-root">
${crumbRow(options) ? `            ${crumbRow(options)}\n` : ""}            ${options.body}
${pagerRow(options) ? `            ${pagerRow(options)}\n` : ""}          </div>
        </div>
      </main>
      <aside class="context">
        ${contextPanel(options)}
      </aside>
    </div>
    ${themeToggleScript}
  </body>
</html>`
}

export const layout = (options: LayoutOptions) => {
  if (options.surface === "surface-b") return surfaceBBody(options)
  return surfaceABody(options)
}