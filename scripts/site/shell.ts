import { docCategories, docPages, type DocSection } from "./docs.ts"
import { appIcon, icon } from "./icons.ts"

export type LayoutOptions = {
    title: string
    description: string
    activeHref: string
    lang: "en" | "ko"
    surface: "surface-b" | "surface-a"
    body: string
    baseHref?: string
    toc?: DocSection[]
    meta?: { label: string; value: string }[]
    breadcrumb?: { label: string; href: string }[]
    pager?: { prev?: { href: string; title: string }; next?: { href: string; title: string } }
}

const SITE_TITLE_SUFFIX = " — oh-pen"
const STORAGE_KEY = "oh-pencode-theme"

const prePaintScript = `<script>
const savedTheme=localStorage.getItem('${STORAGE_KEY}');
const prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;
const isDark=savedTheme==='dark'||(savedTheme===null&&prefersDark);
document.documentElement.classList.toggle('dark',isDark);
document.documentElement.dataset.theme=isDark?'dark':'light';
</script>`

const interactionScript = `<script>
document.querySelectorAll('.theme-toggle').forEach((button) => {
    button.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark')
        document.documentElement.dataset.theme = isDark ? 'dark' : 'light'
        localStorage.setItem('${STORAGE_KEY}', isDark ? 'dark' : 'light')
    })
})
document.querySelectorAll('[data-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
        const value = button.getAttribute('data-copy')
        if (value === null) return
        await navigator.clipboard.writeText(value)
        const label = button.querySelector('span')
        if (label === null) return
        const previous = label.textContent
        label.textContent = 'Copied'
        window.setTimeout(() => { label.textContent = previous }, 1600)
    })
})
</script>`

const depthPrefix = (activeHref: string) => "../".repeat(activeHref.split("/").length - 1)

const styleHref = (activeHref: string) => `${depthPrefix(activeHref)}site.css`

const esc = (value: string) =>
    value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;")

const navLink = (href: string, isActive: boolean, label: string) =>
    `<a class="nav-link${isActive ? " nav-link--active" : ""}" href="${href}"${isActive ? ' aria-current="page"' : ""}>${esc(label)}</a>`

const themeToggle = () =>
    `<button class="theme-toggle" type="button" aria-label="테마 전환">${icon("sun")}${icon("moon")}</button>`

const siteHeader = (activeHref: string, lang: LayoutOptions["lang"]) => {
    const prefix = depthPrefix(activeHref)
    const isHome = activeHref === "index.html"
    const docsLabel = lang === "ko" ? "문서" : "Docs"
    return `<header class="site-header">
      <div class="site-header-inner">
        <a class="wordmark" href="${prefix}index.html">${appIcon()}<span>oh-pen</span></a>
        <span class="header-divider" aria-hidden="true"></span>
        <a class="header-product" href="${prefix}docs/index.html">${docsLabel}</a>
        <nav class="site-nav" aria-label="Primary navigation">
          ${navLink(`${prefix}index.html`, isHome, lang === "ko" ? "홈" : "Home")}
          ${navLink(`${prefix}docs/index.html`, !isHome, docsLabel)}
          <a class="icon-btn" href="https://github.com/B-HS/oh-pen" aria-label="GitHub" rel="noreferrer">${icon("github")}</a>
          ${themeToggle()}
        </nav>
      </div>
    </header>`
}

const footer = () => `<footer class="site-footer">
  <div class="footer-inner">
    <p>Autonomous agent delivery for OpenCode V2.</p>
    <nav aria-label="Site links"><a href="https://github.com/B-HS/oh-pen">GitHub</a><a href="https://b-hs.github.io/oh-pen/docs/index.html">Docs</a></nav>
  </div>
</footer>`

const docLinks = [...docPages].toSorted((a, b) => a.order - b.order)

const docsNavigation = (options: LayoutOptions, className: string) => {
    const prefix = depthPrefix(options.activeHref)
    const groups = docCategories
        .map((category) => {
            const links = docLinks
                .filter((page) => page.category === category.id)
                .map(
                    (page) =>
                        `<a class="docs-nav-link${page.href === options.activeHref ? " docs-nav-link--active" : ""}" href="${prefix}${page.href}"${page.href === options.activeHref ? ' aria-current="page"' : ""}>${esc(page.title)}</a>`,
                )
                .join("")
            return `<div class="docs-nav-group"><p>${esc(category.label)}</p>${links}</div>`
        })
        .join("")
    return `<nav class="${className}" aria-label="문서 탐색">
      <a class="docs-nav-home${options.activeHref === "docs/index.html" ? " docs-nav-link--active" : ""}" href="${prefix}docs/index.html">${icon("book")}<span>문서 홈</span></a>
      ${groups}
    </nav>`
}

const mobileDocsNavigation = (options: LayoutOptions) => `<details class="mobile-docs-menu">
  <summary>${icon("menu")}<span>문서 탐색</span></summary>
  ${docsNavigation(options, "mobile-docs-nav")}
</details>`

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
    const metaBlock = metaRows.length > 0 ? `<div class="context-block"><p>문서 정보</p><div class="doc-meta">${metaRows}</div></div>` : ""
    const tocBlock =
        tocItems.length > 0
            ? `<div class="context-block"><p>이 페이지에서</p><nav class="toc">${tocItems}</nav></div>`
            : `<div class="context-block"><p>시작하기</p><a class="context-link" href="${depthPrefix(options.activeHref)}docs/architecture.html">에이전트 설계 보기${icon("arrow-right")}</a></div>`
    return `${tocBlock}${metaBlock}`
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
        ? `<a class="pager-btn" href="${prev.href}">${icon("arrow-left")}<span><small>이전</small>${esc(prev.title)}</span></a>`
        : `<span></span>`
    const nextSide = next
        ? `<a class="pager-btn pager-btn--next" href="${next.href}"><span><small>다음</small>${esc(next.title)}</span>${icon("arrow-right")}</a>`
        : `<span></span>`
    return `<nav class="pager" aria-label="문서 이동">${prevSide}${nextSide}</nav>`
}

const landingLayout = (options: LayoutOptions) => `<!doctype html>
<html lang="${options.lang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    ${options.baseHref ? `<base href="${esc(options.baseHref)}" />` : ""}
    <title>${esc(options.title)}${SITE_TITLE_SUFFIX}</title>
    <meta name="description" content="${esc(options.description)}" />
    ${prePaintScript}
    <link rel="stylesheet" href="${styleHref(options.activeHref)}" />
  </head>
  <body class="surface-b">
    <a class="skip-link" href="#main">Skip to content</a>
    ${siteHeader(options.activeHref, options.lang)}
    <main id="main" class="site-main">${options.body}</main>
    ${footer()}
    ${interactionScript}
  </body>
</html>`

const docsLayout = (options: LayoutOptions) => `<!doctype html>
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
    ${siteHeader(options.activeHref, options.lang)}
    ${mobileDocsNavigation(options)}
    <div class="docs-shell">
      <aside class="docs-sidebar">${docsNavigation(options, "docs-nav")}</aside>
      <main id="main" class="docs-main">
        ${crumbRow(options)}
        ${options.body}
        ${pagerRow(options)}
      </main>
      <aside class="docs-context">${contextPanel(options)}</aside>
    </div>
    ${interactionScript}
  </body>
</html>`

export const layout = (options: LayoutOptions) => {
    if (options.surface === "surface-b") return landingLayout(options)
    return docsLayout(options)
}
