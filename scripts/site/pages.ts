import { docCategories, docPages, type DocPage, type RenderedDoc } from "./docs.ts"
import { icon, type IconName } from "./icons.ts"
import { layout, type LayoutOptions } from "./shell.ts"

type DocPager = NonNullable<LayoutOptions["pager"]>

const INSTALL_URL = "https://b-hs.github.io/oh-pen/install.sh"
const INSTALL_COMMAND = `curl -fsSL ${INSTALL_URL} | bash`
const STATE_CARD_ICON_SIZE = 28

const esc = (value: string) =>
    value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;")

const sortedDocPages = [...docPages].toSorted((a, b) => a.order - b.order)

const categoryLabel = (category: DocPage["category"]) =>
    docCategories.find((entry) => entry.id === category)?.label ?? category

const upFrom = (href: string) => "../".repeat(href.split("/").length - 1)

const copyButton = (value: string) =>
    `<button class="copy-btn" type="button" data-copy="${esc(value)}" aria-label="명령 복사">${icon("copy")}<span>Copy</span></button>`

const docCard = (page: DocPage, href: string) => `<a class="doc-card" href="${href}">
  <div class="doc-card-top"><span class="badge">${esc(categoryLabel(page.category))}</span>${icon("arrow-right")}</div>
  <h3>${esc(page.title)}</h3>
  <p>${esc(page.summary)}</p>
  <small>${esc(page.source)}</small>
</a>`

const workflowSteps: { title: string; text: string }[] = [
    {
        title: "Choose",
        text: "pen asks once for workflow and subagent models before any tool-using work begins.",
    },
    {
        title: "Route",
        text: "It follows the answer: work directly, or delegate bounded units with the selected model policy.",
    },
    {
        title: "Integrate",
        text: "Results are reviewed against the real diff, then combined without crossing ownership boundaries.",
    },
    {
        title: "Deliver",
        text: "Proportional checks run before selective staging, Conventional Commit, and normal push.",
    },
]

const specialists: { id: string; title: string; text: string }[] = [
    { id: "sub-pen", title: "Implementation", text: "Executes a precise work contract inside an assigned scope." },
    { id: "research-pen", title: "Research", text: "Resolves external facts, constraints, and official contracts." },
    { id: "explore-pen", title: "Codebase", text: "Finds symbols, patterns, and dependency paths without mutation." },
    { id: "doc-pen", title: "Documentation", text: "Turns reusable official usage into project-owned docs under docs/**." },
    { id: "verify-pen", title: "Verification", text: "Runs the smallest independent check that covers the actual risk." },
    { id: "security-pen", title: "Security", text: "Audits secrets, input boundaries, auth, injection, and dependencies." },
]

const checkItems = (items: string[]) => `<ul class="bullet-list">${items
    .map((item) => `<li>${icon("check")}<span>${item}</span></li>`)
    .join("")}</ul>`

export const homePage = () =>
    layout({
        lang: "en",
        surface: "surface-b",
        activeHref: "index.html",
        title: "Autonomous agent delivery for OpenCode V2",
        description:
            "Install one pen primary agent and six specialized OpenCode V2 subagents with verified assets, flexible model assignment, and autonomous delivery.",
        body: `<section class="hero" aria-labelledby="home-hero-title">
  <div class="hero-copy">
    <p class="eyebrow">Built for OpenCode V2</p>
    <h1 class="hero-title" id="home-hero-title">One pen.<br /><span>A complete <br class="mobile-break" />delivery system.</span></h1>
    <p class="hero-sub">oh-pen replaces fragmented build and plan modes with one autonomous primary agent that understands, delegates, verifies, commits, and pushes — backed by six focused specialists.</p>
    <div class="hero-actions">
      <a class="btn btn--primary" href="docs/index.html">Read the docs${icon("arrow-right")}</a>
      <a class="btn btn--secondary" href="https://github.com/B-HS/oh-pen" rel="noreferrer">${icon("github")}View on GitHub</a>
    </div>
    <p class="hero-note">${icon("shield")}Verified assets · Backups before writes · No force push</p>
  </div>
  <div class="terminal-card" aria-label="oh-pen installation and delivery flow">
    <div class="terminal-top"><span>oh-pen — install</span><span class="terminal-dots"><span></span><span></span><span></span></span></div>
    <div class="terminal-body">
      <div class="terminal-command"><span class="terminal-prompt">$</span><code>${esc(INSTALL_COMMAND)}</code>${copyButton(INSTALL_COMMAND)}</div>
      <div class="terminal-flow">
        <div class="terminal-step"><span>01</span><strong>Inspect project contract</strong><small>pen</small></div>
        <div class="terminal-step"><span>02</span><strong>Delegate independent work</strong><small>specialists</small></div>
        <div class="terminal-step"><span>03</span><strong>Verify against risk</strong><small>verify-pen</small></div>
        <div class="terminal-step"><span>04</span><strong>Commit and push</strong><small>pen</small></div>
      </div>
      <span class="terminal-status">Delivery complete</span>
    </div>
  </div>
</section>
<div class="metric-strip" aria-label="Project overview">
  <div class="metric"><strong>1</strong><span>primary agent</span></div>
  <div class="metric"><strong>6</strong><span>specialist agents</span></div>
  <div class="metric"><strong>Any</strong><span>connected model</span></div>
  <div class="metric"><strong>SHA-256</strong><span>asset verification</span></div>
</div>
<section class="section" aria-labelledby="workflow-title">
  <div class="section-heading">
    <div><p class="section-kicker">Workflow</p><h2 class="section-title" id="workflow-title">From request to pushed change.</h2></div>
    <p class="section-lead">pen asks once for workflow and model choices before using tools, then owns the full delivery loop without repeated approval prompts.</p>
  </div>
  <div class="workflow-grid">
${workflowSteps
    .map(
        (step, index) => `    <article class="workflow-card"><span class="workflow-index">0${index + 1}</span><h3>${step.title}</h3><p>${step.text}</p></article>`,
    )
    .join("\n")}
  </div>
</section>
<section class="section" aria-labelledby="agents-title">
  <div class="section-heading">
    <div><p class="section-kicker">Agent system</p><h2 class="section-title" id="agents-title">Clear ownership at every layer.</h2></div>
    <p class="section-lead">The primary agent keeps context, decisions, integration, and Git. Specialists receive bounded contracts with permissions aligned to their role.</p>
  </div>
  <div class="agent-stage">
    <article class="primary-agent">
      <div class="agent-icon">${icon("pen")}</div>
      <p class="agent-label">Primary · pen</p>
      <h3>Orchestrator and owner</h3>
      <p>Understands the request, assigns work, reviews evidence, resolves overlap, verifies the integrated result, and delivers it.</p>
      <div class="agent-tags"><span>integrate</span><span>verify</span><span>commit</span><span>push</span></div>
    </article>
    <div class="specialist-grid">
${specialists
    .map(
        (agent) => `      <article class="specialist-card"><p class="agent-label">${agent.id}</p><h3>${agent.title}</h3><p>${agent.text}</p></article>`,
    )
    .join("\n")}
    </div>
  </div>
</section>
<section class="section" aria-labelledby="models-title">
  <div class="section-heading">
    <div><p class="section-kicker">Configuration</p><h2 class="section-title" id="models-title">Use the model mix that fits your work.</h2></div>
    <p class="section-lead">Convention defaults are a starting point, not a lock-in. Every role can inherit the primary model or use any provider, model, and variant already connected to OpenCode.</p>
  </div>
  <div class="split-panel">
    <div>
      <span class="panel-icon">${icon("list")}</span>
      <h3>Per-role model assignment</h3>
      <p>Installation sets the recommended GPT defaults. Every new tool-using task can keep them, inherit the primary model, or assign connected models per role.</p>
      ${checkItems([
          "Convention defaults for a ready-to-run setup",
          "Primary-model inheritance for a uniform stack",
          "Direct provider/model#variant input for each role",
      ])}
      <pre class="code-sample"><code>provider/model#variant</code></pre>
    </div>
    <div>
      <span class="panel-icon">${icon("doc")}</span>
      <h3>Documentation that stays with the project</h3>
      <p>When official docs contain reusable setup or API usage, doc-pen extracts the contract and saves it under the existing docs taxonomy.</p>
      ${checkItems([
          "Official sources and version differences first",
          "Project-specific cautions recorded beside usage",
          "One-off facts returned without creating duplicate docs",
      ])}
      <pre class="code-sample"><code>docs/references/&lt;topic&gt;.md</code></pre>
    </div>
  </div>
</section>
<section class="section" aria-labelledby="autonomy-title">
  <div class="section-heading">
    <div><p class="section-kicker">Autonomy boundary</p><h2 class="section-title" id="autonomy-title">Fewer prompts. Explicit limits.</h2></div>
    <p class="section-lead">Routine delivery is intentionally uninterrupted. Actions that introduce new authority, expose sensitive data, or rewrite history remain outside that automatic path.</p>
  </div>
  <div class="boundary-grid">
    <article class="boundary-card boundary-card--go"><h3>Continues automatically</h3><p>Actions already inside the requested change.</p><ul><li>Read, edit, build, and proportionate verification</li><li>Selective staging and Conventional Commit</li><li>Normal push to the configured remote</li><li>Documentation updates required by the change</li></ul></article>
    <article class="boundary-card boundary-card--stop"><h3>Stops at a real boundary</h3><p>Actions that need a new decision or authority.</p><ul><li>Force push or history rewriting</li><li>Secrets, tokens, and .env access</li><li>Destructive or hard-to-recover operations</li><li>Missing product decisions that change the contract</li></ul></article>
  </div>
</section>
<section class="section" aria-labelledby="docs-title">
  <div class="section-heading">
    <div><p class="section-kicker">Documentation</p><h2 class="section-title" id="docs-title">Understand the system before it runs.</h2></div>
    <p class="section-lead">The published docs are generated from the repository’s source documents, so architecture, installer behavior, measured OpenCode contracts, and project decisions stay aligned.</p>
  </div>
  <div class="doc-grid">
${sortedDocPages
    .slice(0, 6)
    .map((page) => docCard(page, page.href))
    .join("\n")}
  </div>
</section>
<section class="cta-panel" aria-labelledby="cta-title">
  <div><h2 id="cta-title">Install the pen system.</h2><p>Preview first with --dry-run, or install directly with verified assets and automatic backups.</p></div>
  <a class="btn btn--primary" href="docs/installer.html">Installation guide${icon("arrow-right")}</a>
</section>`,
    })

export const docsIndexPage = () =>
    layout({
        lang: "ko",
        surface: "surface-a",
        activeHref: "docs/index.html",
        title: "문서",
        description: "oh-pen 문서 — 에이전트 아키텍처, 설치, OpenCode V2 계약, 결정과 검증 이력.",
        body: `<section class="docs-index" aria-labelledby="docs-index-title">
  <header class="docs-intro">
    <p class="section-kicker">oh-pen documentation</p>
    <h1 id="docs-index-title">필요한 근거까지<br />확인할 수 있는 문서.</h1>
    <p>빠른 설치부터 에이전트 권한, 모델 배정, OpenCode V2 실측 계약, 프로젝트 결정과 검증 이력까지 저장소 문서를 그대로 연결합니다.</p>
    <div class="quickstart"><pre><code>${esc(INSTALL_COMMAND)}</code></pre>${copyButton(INSTALL_COMMAND)}</div>
  </header>
  <div class="docs-categories">
${docCategories
    .map((category) => {
        const pages = sortedDocPages.filter((page) => page.category === category.id)
        return `    <section class="docs-category" aria-labelledby="category-${category.id}">
      <header><h2 id="category-${category.id}">${esc(category.label)}</h2><p>${pages.length}개 문서</p></header>
      <div class="docs-category-grid">${pages.map((page) => docCard(page, `../${page.href}`)).join("")}</div>
    </section>`
    })
    .join("\n")}
  </div>
</section>`,
    })

export const docPage = (doc: DocPage, rendered: RenderedDoc, pager: DocPager) =>
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
        body: `<article class="docs-article">
  <header class="doc-header"><p class="section-kicker">${esc(categoryLabel(doc.category))}</p><h1>${esc(doc.title)}</h1><p>${esc(doc.summary)}</p></header>
  <div class="prose">${rendered.html}</div>
</article>`,
    })

export const notFoundPage = () =>
    layout({
        lang: "en",
        surface: "surface-b",
        activeHref: "404.html",
        title: "Page not found",
        description: "The requested oh-pen page does not exist.",
        body: `<section class="state-card" aria-labelledby="notfound-title"><div>
  ${icon("search", STATE_CARD_ICON_SIZE)}
  <h1 id="notfound-title">Page not found</h1>
  <p class="muted">The page you requested does not exist. Continue from the home page or browse the documentation.</p>
  <div class="hero-actions"><a class="btn btn--primary" href="index.html">Home</a><a class="btn btn--secondary" href="docs/index.html">Docs</a></div>
</div></section>`,
    })
