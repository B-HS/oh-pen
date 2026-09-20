import { docCategories, docPages, type DocPage, type RenderedDoc } from "./docs.ts"
import { icon, type IconName } from "./icons.ts"
import { layout, type LayoutOptions } from "./shell.ts"

type DocPager = NonNullable<LayoutOptions["pager"]>

const INSTALL_URL = "https://b-hs.github.io/oh-pen/install.sh"
const STATE_CARD_ICON_SIZE = 24

const esc = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;")

const cmd = (command: string) => `<pre class="cmd"><code>${esc(command)}</code></pre>`

const sortedDocPages = [...docPages].toSorted((a, b) => a.order - b.order)

const categoryLabel = (category: DocPage["category"]) =>
  docCategories.find((entry) => entry.id === category)?.label ?? category

/** 페이지 깊이에 맞는 상위 경로 접두. `docs/pen/x.md`(depth 2)면 `../../`. */
const upFrom = (href: string) => "../".repeat(href.split("/").length - 1)

const docCard = (page: DocPage, href: string) =>
  `<a class="doc-card doc-card--link" href="${href}">
    <h3 class="doc-card-title">${esc(page.title)}</h3>
    <p class="doc-card-summary">${esc(page.summary)}</p>
    <p class="doc-card-meta"><span class="mono">${esc(page.source)}</span></p>
    <span class="badge badge--secondary">${esc(categoryLabel(page.category))}</span>
  </a>`

const homeFeatures: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "agent",
    title: "Agent delegation",
    text: "pen parses the request, decomposes the work, and delegates each unit to a specialized subagent. Independent units run in parallel.",
  },
  {
    icon: "shield",
    title: "Auto-mode with deny kept",
    text: "Approvals are granted without prompts, while deny rules for secrets and out-of-scope paths stay enforced.",
  },
  {
    icon: "check",
    title: "Verified installs",
    text: "install.sh checks the bundle and every asset against the SHA-256 map in manifest.json and stops before writing on any mismatch.",
  },
  {
    icon: "layers",
    title: "Global install with backup",
    text: "Writes only under ~/.config/opencode/, backs up managed files before writing, and preserves files you edited.",
  },
  {
    icon: "list",
    title: "Per-role model assignment",
    text: "Each subagent carries its own model, and pen asks for the assignment at the start of every task.",
  },
  {
    icon: "pen",
    title: "Extensible",
    text: "Add your own subagents with custom models and permissions, then allow them from pen's explicit list.",
  },
]

const agentModeBadge = { primary: "badge badge--default", subagent: "badge badge--secondary" } as const

const agentRows: { id: string; mode: keyof typeof agentModeBadge; role: string; permissions: string }[] = [
  {
    id: "pen",
    mode: "primary",
    role: "Orchestrates: parses requirements, decomposes work, integrates results, owns Git",
    permissions: `Full auto-mode, <code class="mono">deny</code> rules for <code class="mono">.env</code> kept`,
  },
  {
    id: "sub-pen",
    mode: "subagent",
    role: "Executes a detailed work contract within an assigned scope",
    permissions: "Same as pen, cannot spawn subagents",
  },
  {
    id: "research-pen",
    mode: "subagent",
    role: "Investigates facts, constraints, and prerequisites before implementation",
    permissions: "Read, search, web",
  },
  {
    id: "explore-pen",
    mode: "subagent",
    role: "Finds patterns, symbols, and structure in a codebase",
    permissions: "Read, search only, no network",
  },
  {
    id: "doc-pen",
    mode: "subagent",
    role: "Reads official documentation and API contracts in depth",
    permissions: "Read, search, web",
  },
  {
    id: "verify-pen",
    mode: "subagent",
    role: "Runs the smallest independent verification that covers a change's risk",
    permissions: "Read, search, shell",
  },
  {
    id: "security-pen",
    mode: "subagent",
    role: "Audits secrets, auth, injection, and dependencies",
    permissions: "Read, search, web, no shell",
  },
]

const agentsTable = `<div class="table-scroll">
    <table class="data-table">
      <thead>
        <tr>
          <th scope="col" style="width:112px">Agent</th>
          <th scope="col" style="width:96px">Mode</th>
          <th scope="col">Role</th>
          <th scope="col" style="width:224px">Permissions</th>
        </tr>
      </thead>
      <tbody>
${agentRows
  .map(
    (agent) => `        <tr>
          <td class="mono">${agent.id}</td>
          <td><span class="${agentModeBadge[agent.mode]}">${agent.mode}</span></td>
          <td class="flex-cell">${agent.role}</td>
          <td>${agent.permissions}</td>
        </tr>`,
  )
  .join("\n")}
      </tbody>
    </table>
  </div>`

const installCommands = [
  { label: "Install", command: `curl -fsSL ${INSTALL_URL} | bash` },
  { label: "Preview", command: `curl -fsSL ${INSTALL_URL} | bash -s -- --dry-run` },
  { label: "Non-interactive", command: `curl -fsSL ${INSTALL_URL} | bash -s -- --no-interview` },
  { label: "Verify", command: `curl -fsSL ${INSTALL_URL} | bash -s -- verify` },
  { label: "Uninstall", command: `curl -fsSL ${INSTALL_URL} | bash -s -- uninstall` },
]

export const homePage = (): string =>
  layout({
    lang: "en",
    surface: "surface-b",
    activeHref: "index.html",
    title: "OpenCode V2 pen agent installer",
    description:
      "Install the oh-pen agent set for OpenCode V2: one pen primary agent, six specialized subagents, SHA-256 verified installs.",
    body: `<section class="hero" aria-labelledby="home-hero-title">
  <h1 class="hero-title" id="home-hero-title">oh-pencode</h1>
  <p class="hero-sub">A single pen primary agent for OpenCode V2 — with six specialized subagents. build and plan are hidden, auto-mode skips approval prompts, and every subagent carries its own model.</p>
  ${cmd(`curl -fsSL ${INSTALL_URL} | bash`)}
  <div class="hero-actions">
    <a class="btn btn--default" href="https://github.com/B-HS/oh-pen" rel="noreferrer">GitHub</a>
    <a class="btn btn--outline" href="docs/index.html">Docs</a>
  </div>
</section>
<section class="section" aria-labelledby="home-features-title">
  <h2 class="section-title" id="home-features-title">Features</h2>
  <div class="feature-grid">
${homeFeatures
  .map(
    (feature) => `    <article class="feature-card">
      <div class="feature-icon">${icon(feature.icon)}</div>
      <h3 class="doc-card-title">${feature.title}</h3>
      <p class="doc-card-summary">${feature.text}</p>
    </article>`,
  )
  .join("\n")}
  </div>
</section>
<section class="section" aria-labelledby="home-agents-title">
  <h2 class="section-title" id="home-agents-title">Agents</h2>
  ${agentsTable}
  <p class="muted">build and plan are installed as hidden stubs so the pen set owns the primary slot.</p>
</section>
<section class="section" aria-labelledby="home-usage-title">
  <h2 class="section-title" id="home-usage-title">Usage</h2>
${installCommands.map((entry) => `  <p class="muted">${entry.label}</p>\n  ${cmd(entry.command)}`).join("\n")}
  <p class="muted">Requires OpenCode V2 and Bun.</p>
</section>
<section class="section" aria-labelledby="home-safety-title">
  <h2 class="section-title" id="home-safety-title">Safety</h2>
  <ul>
    <li>Writes only under <code class="mono">~/.config/opencode/</code> — global install, no per-project mode.</li>
    <li>Backs up managed files to <code class="mono">~/.config/opencode/oh-pencode/backup/&lt;timestamp&gt;/</code> before writing.</li>
    <li>Preserves agent files edited after installation and reports them.</li>
    <li>Rejects asset paths containing <code class="mono">..</code> or absolute paths.</li>
    <li>Accepts only <code class="mono">https</code> or local asset sources; plain <code class="mono">http://</code> is refused.</li>
    <li>Never reads secrets, tokens, or <code class="mono">.env</code> files.</li>
  </ul>
</section>
<section class="section" aria-labelledby="home-docs-title">
  <h2 class="section-title" id="home-docs-title">Docs</h2>
  <div class="card-grid">
${sortedDocPages.map((page) => docCard(page, page.href)).join("\n")}
  </div>
</section>`,
  })

export const docsIndexPage = (): string =>
  layout({
    lang: "ko",
    surface: "surface-a",
    activeHref: "docs/index.html",
    title: "문서",
    description: "oh-pen 문서 목록 — 에이전트 세트 설계, OpenCode V2 계약, 프로젝트 기록과 이력.",
    body: `<section class="panel" aria-labelledby="docs-index-title">
  <header class="panel-header"><h2 class="panel-title" id="docs-index-title">문서</h2></header>
  <div class="panel-content">
    <p class="muted">저장소 문서를 HTML로 렌더한 것이다. 설계·OpenCode 계약·프로젝트·이력 4개 카테고리로 묶여 있다.</p>
${docCategories
  .map((category) => {
    const pages = sortedDocPages.filter((page) => page.category === category.id)
    return `    <h3 class="muted">${esc(category.label)}</h3>
    <div class="card-grid">
${pages.map((page) => docCard(page, `../${page.href}`)).join("\n")}
    </div>`
  })
  .join("\n")}
  </div>
</section>`,
  })

export const docPage = (doc: DocPage, rendered: RenderedDoc, pager: DocPager): string =>
  layout({
    lang: "ko",
    surface: "surface-a",
    activeHref: doc.href,
    title: doc.title,
    description: doc.summary,
    toc: rendered.sections,
    meta: [
      { label: "출처", value: doc.source },
      { label: "줄 수", value: String(rendered.lineCount) },
      { label: "분류", value: categoryLabel(doc.category) },
    ],
    breadcrumb: [
      { label: "oh-pen", href: `${upFrom(doc.href)}index.html` },
      { label: "문서", href: `${upFrom(doc.href)}docs/index.html` },
      { label: doc.title, href: doc.href },
    ],
    pager,
    body: `<section class="panel" aria-labelledby="doc-page-title">
  <header class="panel-header"><h2 class="panel-title" id="doc-page-title">${esc(doc.title)}</h2></header>
  <div class="panel-content"><article class="prose">${rendered.html}</article></div>
</section>`,
  })

export const notFoundPage = (): string =>
  layout({
    lang: "en",
    surface: "surface-b",
    activeHref: "404.html",
    title: "Page not found",
    description: "The requested oh-pen page does not exist.",
    body: `<section class="state-card" aria-labelledby="notfound-title">
  ${icon("search", STATE_CARD_ICON_SIZE)}
  <h1 class="section-title" id="notfound-title">Page not found</h1>
  <p class="muted">The page you requested does not exist on this site. Continue from the home page or the docs index.</p>
  <div class="hero-actions">
    <a class="btn btn--default" href="index.html">Home</a>
    <a class="btn btn--outline" href="docs/index.html">Docs</a>
  </div>
</section>`,
  })