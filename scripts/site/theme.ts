export const siteCss = `
:root {
    color-scheme: light;
    --font-sans: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    --font-mono: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    --background: oklch(0.985 0.004 270);
    --surface: oklch(1 0 0);
    --surface-subtle: oklch(0.965 0.008 270);
    --surface-raised: oklch(0.995 0.003 270);
    --foreground: oklch(0.19 0.02 270);
    --muted-foreground: oklch(0.48 0.025 270);
    --faint-foreground: oklch(0.61 0.02 270);
    --border: oklch(0.9 0.012 270);
    --border-strong: oklch(0.82 0.02 270);
    --accent: oklch(0.55 0.2 276);
    --accent-strong: oklch(0.46 0.22 276);
    --accent-soft: oklch(0.94 0.04 276);
    --success: oklch(0.58 0.16 155);
    --success-soft: oklch(0.95 0.04 155);
    --warning-soft: oklch(0.96 0.05 80);
    --code-background: oklch(0.17 0.025 270);
    --code-foreground: oklch(0.91 0.02 270);
    --shadow-sm: 0 1px 2px oklch(0.17 0.02 270 / 0.05), 0 6px 20px oklch(0.17 0.02 270 / 0.04);
    --shadow-md: 0 12px 40px oklch(0.17 0.02 270 / 0.09);
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 20px;
    --header-height: 64px;
    --content-width: 1180px;
}

:root.dark,
:root[data-theme="dark"] {
    color-scheme: dark;
    --background: oklch(0.135 0.018 270);
    --surface: oklch(0.18 0.022 270);
    --surface-subtle: oklch(0.22 0.026 270);
    --surface-raised: oklch(0.195 0.024 270);
    --foreground: oklch(0.94 0.01 270);
    --muted-foreground: oklch(0.7 0.025 270);
    --faint-foreground: oklch(0.58 0.025 270);
    --border: oklch(0.3 0.025 270);
    --border-strong: oklch(0.39 0.03 270);
    --accent: oklch(0.72 0.16 276);
    --accent-strong: oklch(0.78 0.14 276);
    --accent-soft: oklch(0.27 0.07 276);
    --success: oklch(0.72 0.14 155);
    --success-soft: oklch(0.26 0.055 155);
    --warning-soft: oklch(0.27 0.045 80);
    --code-background: oklch(0.105 0.015 270);
    --code-foreground: oklch(0.9 0.015 270);
    --shadow-sm: 0 1px 2px oklch(0 0 0 / 0.18), 0 8px 24px oklch(0 0 0 / 0.12);
    --shadow-md: 0 16px 48px oklch(0 0 0 / 0.24);
}

html {
    scroll-behavior: smooth;
    scroll-padding-top: calc(var(--header-height) + 24px);
}

body {
    margin: 0;
    background: var(--background);
    color: var(--foreground);
    font-family: var(--font-sans);
    font-size: 15px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
}

body.surface-b {
    background-image:
        radial-gradient(circle at 12% 8%, color-mix(in oklch, var(--accent) 9%, transparent), transparent 26rem),
        radial-gradient(circle at 88% 26%, color-mix(in oklch, var(--success) 7%, transparent), transparent 22rem);
    background-attachment: fixed;
}

*,
*::before,
*::after {
    box-sizing: border-box;
}

button,
summary {
    font: inherit;
}

a {
    color: inherit;
}

a:focus-visible,
button:focus-visible,
summary:focus-visible {
    outline: 3px solid color-mix(in oklch, var(--accent) 42%, transparent);
    outline-offset: 3px;
}

.skip-link {
    position: fixed;
    top: 12px;
    left: -9999px;
    z-index: 100;
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    background: var(--foreground);
    color: var(--background);
    font-weight: 600;
    text-decoration: none;
}

.skip-link:focus-visible {
    left: 12px;
}

.mono {
    font-family: var(--font-mono);
}

.muted {
    color: var(--muted-foreground);
}

.site-header {
    position: sticky;
    top: 0;
    z-index: 50;
    height: var(--header-height);
    border-bottom: 1px solid color-mix(in oklch, var(--border) 85%, transparent);
    background: color-mix(in oklch, var(--background) 82%, transparent);
    backdrop-filter: blur(18px) saturate(1.2);
    -webkit-backdrop-filter: blur(18px) saturate(1.2);
}

.site-header-inner {
    display: flex;
    align-items: center;
    height: 100%;
    width: min(calc(100% - 40px), var(--content-width));
    margin-inline: auto;
}

.wordmark {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: var(--foreground);
    font-size: 16px;
    font-weight: 600;
    letter-spacing: -0.025em;
    text-decoration: none;
}

.wordmark svg {
    width: 30px;
    height: 30px;
}

.header-divider {
    width: 1px;
    height: 20px;
    margin-inline: 16px;
    background: var(--border);
}

.header-product {
    color: var(--muted-foreground);
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;
}

.site-nav {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
}

.nav-link {
    padding: 7px 10px;
    border-radius: 7px;
    color: var(--muted-foreground);
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;
    transition: background-color 160ms ease, color 160ms ease;
}

.nav-link:hover,
.nav-link--active {
    background: var(--surface-subtle);
    color: var(--foreground);
}

.icon-btn,
.theme-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 0;
    border: 0;
    border-radius: 9px;
    background: transparent;
    color: var(--muted-foreground);
    cursor: pointer;
    transition: background-color 160ms ease, color 160ms ease;
}

.icon-btn:hover,
.theme-toggle:hover {
    background: var(--surface-subtle);
    color: var(--foreground);
}

.icon-btn svg,
.theme-toggle svg {
    width: 18px;
    height: 18px;
}

.theme-toggle svg:first-child {
    display: none;
}

.dark .theme-toggle svg:first-child,
[data-theme="dark"] .theme-toggle svg:first-child {
    display: block;
}

.dark .theme-toggle svg:last-child,
[data-theme="dark"] .theme-toggle svg:last-child {
    display: none;
}

.site-main {
    display: flex;
    flex-direction: column;
    gap: 0;
    width: min(calc(100% - 40px), var(--content-width));
    margin-inline: auto;
}

.hero {
    display: grid;
    grid-template-columns: minmax(0, 1.08fr) minmax(390px, 0.92fr);
    align-items: center;
    gap: 72px;
    min-height: 620px;
    padding-block: 88px;
}

.hero-copy {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 22px;
    padding: 6px 10px;
    border: 1px solid color-mix(in oklch, var(--accent) 22%, var(--border));
    border-radius: 999px;
    background: color-mix(in oklch, var(--accent-soft) 68%, transparent);
    color: var(--accent-strong);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

.eyebrow::before {
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: var(--success);
    content: "";
}

.hero-title {
    max-width: 760px;
    margin: 0;
    font-size: clamp(42px, 6vw, 72px);
    font-weight: 600;
    letter-spacing: -0.055em;
    line-height: 1.02;
    text-wrap: balance;
}

.hero-title span {
    color: var(--accent);
}

.mobile-break {
    display: none;
}

.hero-sub {
    max-width: 650px;
    margin: 26px 0 0;
    color: var(--muted-foreground);
    font-size: 18px;
    line-height: 1.72;
}

.hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 30px;
}

.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 42px;
    padding-inline: 17px;
    border: 1px solid transparent;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
    transition: transform 160ms ease, background-color 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
}

.btn:hover {
    transform: translateY(-1px);
}

.btn svg {
    width: 16px;
    height: 16px;
}

.btn--primary {
    background: var(--foreground);
    color: var(--background);
    box-shadow: var(--shadow-sm);
}

.btn--primary:hover {
    box-shadow: var(--shadow-md);
}

.btn--secondary {
    border-color: var(--border);
    background: color-mix(in oklch, var(--surface) 82%, transparent);
    color: var(--foreground);
}

.btn--secondary:hover {
    border-color: var(--border-strong);
    background: var(--surface);
}

.hero-note {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 16px 0 0;
    color: var(--faint-foreground);
    font-size: 12px;
}

.hero-note svg {
    width: 15px;
    height: 15px;
    color: var(--success);
}

.terminal-card {
    overflow: hidden;
    border: 1px solid color-mix(in oklch, var(--border) 75%, transparent);
    border-radius: var(--radius-lg);
    background: var(--code-background);
    box-shadow: 0 30px 80px oklch(0.15 0.04 275 / 0.18);
    color: var(--code-foreground);
}

.terminal-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 50px;
    padding: 0 16px;
    border-bottom: 1px solid oklch(1 0 0 / 0.08);
    color: oklch(0.67 0.02 270);
    font: 12px var(--font-mono);
}

.terminal-dots {
    display: flex;
    gap: 6px;
}

.terminal-dots span {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: oklch(1 0 0 / 0.19);
}

.terminal-body {
    display: flex;
    flex-direction: column;
    gap: 18px;
    min-height: 350px;
    padding: 24px;
    font: 13px/1.65 var(--font-mono);
}

.terminal-command {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: start;
    gap: 10px;
    padding-bottom: 20px;
    border-bottom: 1px solid oklch(1 0 0 / 0.08);
}

.terminal-command code {
    min-width: 0;
    color: oklch(0.92 0.02 270);
    overflow-wrap: anywhere;
}

.terminal-prompt {
    color: oklch(0.74 0.14 155);
}

.copy-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 7px;
    border: 1px solid oklch(1 0 0 / 0.12);
    border-radius: 6px;
    background: oklch(1 0 0 / 0.06);
    color: oklch(0.72 0.02 270);
    font: 11px var(--font-sans);
    cursor: pointer;
}

.copy-btn:hover {
    background: oklch(1 0 0 / 0.11);
    color: white;
}

.copy-btn svg {
    width: 13px;
    height: 13px;
}

.terminal-flow {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.terminal-step {
    display: grid;
    grid-template-columns: 26px minmax(0, 1fr) auto;
    align-items: center;
    gap: 11px;
    color: oklch(0.7 0.02 270);
}

.terminal-step > span:first-child {
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border-radius: 7px;
    background: oklch(1 0 0 / 0.07);
    color: oklch(0.87 0.02 270);
    font: 11px var(--font-sans);
}

.terminal-step strong {
    color: oklch(0.9 0.02 270);
    font-weight: 500;
}

.terminal-step small {
    color: oklch(0.55 0.02 270);
}

.terminal-status {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    margin-top: auto;
    color: oklch(0.74 0.14 155);
    font-size: 12px;
}

.terminal-status::before {
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: currentColor;
    content: "";
}

.metric-strip {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    margin: 0 0 34px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: color-mix(in oklch, var(--surface) 80%, transparent);
    box-shadow: var(--shadow-sm);
}

.metric {
    padding: 18px 22px;
}

.metric + .metric {
    border-left: 1px solid var(--border);
}

.metric strong {
    display: block;
    font-size: 19px;
    font-weight: 600;
    letter-spacing: -0.025em;
}

.metric span {
    color: var(--muted-foreground);
    font-size: 12px;
}

.section {
    padding-block: 94px;
    border-top: 1px solid var(--border);
}

.section-heading {
    display: grid;
    grid-template-columns: minmax(0, 0.8fr) minmax(300px, 1.2fr);
    gap: 80px;
    align-items: end;
    margin-bottom: 44px;
}

.section-kicker {
    margin: 0 0 11px;
    color: var(--accent-strong);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.section-title {
    margin: 0;
    font-size: clamp(30px, 4vw, 44px);
    font-weight: 600;
    letter-spacing: -0.045em;
    line-height: 1.12;
    text-wrap: balance;
}

.section-lead {
    margin: 0;
    color: var(--muted-foreground);
    font-size: 16px;
    line-height: 1.75;
}

.workflow-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
}

.workflow-card {
    position: relative;
    min-height: 210px;
    padding: 22px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: color-mix(in oklch, var(--surface) 82%, transparent);
}

.workflow-card:not(:last-child)::after {
    position: absolute;
    top: 34px;
    right: -19px;
    z-index: 2;
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: var(--background);
    color: var(--faint-foreground);
    content: "→";
}

.workflow-index {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    margin-bottom: 34px;
    border-radius: 9px;
    background: var(--accent-soft);
    color: var(--accent-strong);
    font-size: 12px;
    font-weight: 600;
}

.workflow-card h3,
.specialist-card h3,
.boundary-card h3,
.docs-category h2 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: -0.015em;
}

.workflow-card p,
.specialist-card p,
.boundary-card p {
    margin: 9px 0 0;
    color: var(--muted-foreground);
    font-size: 13px;
    line-height: 1.65;
}

.agent-stage {
    display: grid;
    grid-template-columns: minmax(260px, 0.72fr) minmax(0, 1.28fr);
    gap: 16px;
}

.primary-agent {
    display: flex;
    flex-direction: column;
    min-height: 100%;
    padding: 28px;
    border-radius: var(--radius-lg);
    background: var(--foreground);
    color: var(--background);
    box-shadow: var(--shadow-md);
}

.agent-icon {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    border: 1px solid color-mix(in oklch, var(--background) 18%, transparent);
    border-radius: 12px;
    background: color-mix(in oklch, var(--background) 9%, transparent);
}

.agent-icon svg {
    width: 20px;
    height: 20px;
}

.primary-agent .agent-label {
    margin-top: 44px;
    color: color-mix(in oklch, var(--background) 65%, transparent);
}

.agent-label {
    margin: 0 0 7px;
    font: 11px var(--font-mono);
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

.primary-agent h3 {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
    letter-spacing: -0.04em;
}

.primary-agent > p:last-of-type {
    margin: 14px 0 28px;
    color: color-mix(in oklch, var(--background) 74%, transparent);
}

.agent-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin-top: auto;
}

.agent-tags span {
    padding: 4px 8px;
    border: 1px solid color-mix(in oklch, var(--background) 18%, transparent);
    border-radius: 999px;
    color: color-mix(in oklch, var(--background) 78%, transparent);
    font: 10px var(--font-mono);
}

.specialist-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
}

.specialist-card {
    padding: 20px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: color-mix(in oklch, var(--surface) 84%, transparent);
}

.specialist-card .agent-label {
    color: var(--accent-strong);
}

.split-panel {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    overflow: hidden;
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    background: var(--surface);
    box-shadow: var(--shadow-sm);
}

.split-panel > div {
    padding: 38px;
}

.split-panel > div + div {
    border-left: 1px solid var(--border);
    background: var(--surface-subtle);
}

.panel-icon {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    margin-bottom: 30px;
    border-radius: 11px;
    background: var(--accent-soft);
    color: var(--accent-strong);
}

.panel-icon svg {
    width: 19px;
    height: 19px;
}

.split-panel h3 {
    margin: 0;
    font-size: 22px;
    font-weight: 600;
    letter-spacing: -0.035em;
}

.split-panel > div > p {
    margin: 12px 0 0;
    color: var(--muted-foreground);
}

.bullet-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 24px 0 0;
    padding: 0;
    list-style: none;
}

.bullet-list li {
    display: grid;
    grid-template-columns: 20px minmax(0, 1fr);
    gap: 10px;
    font-size: 13px;
}

.bullet-list svg {
    width: 16px;
    height: 16px;
    margin-top: 2px;
    color: var(--success);
}

.code-sample {
    margin: 24px 0 0;
    padding: 16px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--code-background);
    color: var(--code-foreground);
    font: 12px/1.65 var(--font-mono);
    overflow-x: auto;
}

.boundary-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
}

.boundary-card {
    padding: 26px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: color-mix(in oklch, var(--surface) 84%, transparent);
}

.boundary-card--go {
    border-top: 3px solid var(--success);
}

.boundary-card--stop {
    border-top: 3px solid var(--accent);
}

.boundary-card ul {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 22px 0 0;
    padding-left: 18px;
    color: var(--muted-foreground);
    font-size: 13px;
}

.doc-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
}

.doc-card {
    display: flex;
    flex-direction: column;
    min-height: 210px;
    padding: 22px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: color-mix(in oklch, var(--surface) 86%, transparent);
    color: var(--foreground);
    text-decoration: none;
    transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
}

.doc-card:hover {
    transform: translateY(-2px);
    border-color: var(--border-strong);
    box-shadow: var(--shadow-md);
}

.doc-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: var(--accent-strong);
}

.doc-card-top svg {
    width: 17px;
    height: 17px;
}

.badge {
    width: fit-content;
    padding: 3px 8px;
    border-radius: 999px;
    background: var(--surface-subtle);
    color: var(--muted-foreground);
    font-size: 10px;
    font-weight: 600;
}

.doc-card h3 {
    margin: 32px 0 0;
    font-size: 16px;
    font-weight: 600;
}

.doc-card p {
    margin: 9px 0 0;
    color: var(--muted-foreground);
    font-size: 13px;
    line-height: 1.65;
}

.doc-card small {
    margin-top: auto;
    padding-top: 18px;
    color: var(--faint-foreground);
    font: 10px var(--font-mono);
}

.cta-panel {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 36px;
    margin: 96px 0;
    padding: 40px;
    border-radius: var(--radius-lg);
    background: var(--foreground);
    color: var(--background);
    box-shadow: var(--shadow-md);
}

.cta-panel h2 {
    margin: 0;
    font-size: 30px;
    font-weight: 600;
    letter-spacing: -0.04em;
}

.cta-panel p {
    margin: 8px 0 0;
    color: color-mix(in oklch, var(--background) 70%, transparent);
}

.cta-panel .btn--primary {
    background: var(--background);
    color: var(--foreground);
}

.site-footer {
    border-top: 1px solid var(--border);
}

.footer-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: min(calc(100% - 40px), var(--content-width));
    min-height: 100px;
    margin-inline: auto;
    color: var(--muted-foreground);
    font-size: 12px;
}

.footer-inner p {
    margin: 0;
}

.footer-inner nav {
    display: flex;
    gap: 18px;
}

.footer-inner a {
    text-decoration: none;
}

.footer-inner a:hover {
    color: var(--foreground);
}

.docs-shell {
    display: grid;
    grid-template-columns: 230px minmax(0, 820px) 220px;
    justify-content: center;
    gap: 48px;
    width: min(calc(100% - 40px), 1400px);
    margin-inline: auto;
}

.docs-sidebar,
.docs-context {
    position: sticky;
    top: var(--header-height);
    align-self: start;
    max-height: calc(100dvh - var(--header-height));
    overflow-y: auto;
    padding-block: 34px;
}

.docs-nav,
.mobile-docs-nav {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.docs-nav-home {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 8px 10px;
    border-radius: 8px;
    color: var(--muted-foreground);
    font-size: 13px;
    font-weight: 500;
    text-decoration: none;
}

.docs-nav-home svg {
    width: 16px;
    height: 16px;
}

.docs-nav-group {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.docs-nav-group > p {
    margin: 0 0 7px;
    padding-inline: 10px;
    color: var(--faint-foreground);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.docs-nav-link {
    padding: 7px 10px;
    border-radius: 8px;
    color: var(--muted-foreground);
    font-size: 13px;
    line-height: 1.45;
    text-decoration: none;
}

.docs-nav-link:hover,
.docs-nav-link--active {
    background: var(--surface-subtle);
    color: var(--foreground);
}

.docs-nav-link--active {
    font-weight: 600;
}

.docs-main {
    min-width: 0;
    padding: 34px 0 80px;
}

.crumb {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 7px;
    margin-bottom: 22px;
    color: var(--faint-foreground);
    font-size: 12px;
}

.crumb a {
    text-decoration: none;
}

.crumb a:hover,
.crumb span[aria-current="page"] {
    color: var(--foreground);
}

.docs-article,
.docs-index {
    min-width: 0;
}

.doc-header {
    padding-bottom: 34px;
    border-bottom: 1px solid var(--border);
}

.doc-header .section-kicker {
    margin-bottom: 12px;
}

.doc-header h1,
.docs-intro h1 {
    margin: 0;
    font-size: clamp(34px, 5vw, 48px);
    font-weight: 600;
    letter-spacing: -0.05em;
    line-height: 1.12;
}

.doc-header > p,
.docs-intro > p {
    max-width: 680px;
    margin: 16px 0 0;
    color: var(--muted-foreground);
    font-size: 16px;
    line-height: 1.75;
}

.docs-intro {
    padding-bottom: 36px;
    border-bottom: 1px solid var(--border);
}

.quickstart {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 18px;
    align-items: center;
    margin-top: 30px;
    padding: 18px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--surface);
    box-shadow: var(--shadow-sm);
}

.quickstart pre {
    min-width: 0;
    margin: 0;
    overflow-x: auto;
    font: 12px var(--font-mono);
}

.quickstart .copy-btn {
    border-color: var(--border);
    background: var(--surface-subtle);
    color: var(--muted-foreground);
}

.docs-categories {
    display: flex;
    flex-direction: column;
    gap: 48px;
    margin-top: 44px;
}

.docs-category > header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 14px;
}

.docs-category > header p {
    margin: 0;
    color: var(--faint-foreground);
    font-size: 12px;
}

.docs-category-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
}

.docs-category .doc-card {
    min-height: 176px;
    background: var(--surface);
}

.docs-context {
    display: flex;
    flex-direction: column;
    gap: 28px;
}

.context-block > p {
    margin: 0 0 10px;
    color: var(--faint-foreground);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.toc {
    display: flex;
    flex-direction: column;
    gap: 7px;
    padding-left: 12px;
    border-left: 1px solid var(--border);
}

.toc-item {
    color: var(--muted-foreground);
    font-size: 12px;
    line-height: 1.5;
    text-decoration: none;
}

.toc-item:hover {
    color: var(--foreground);
}

.toc-item--h3 {
    padding-left: 9px;
    font-size: 11px;
}

.doc-meta {
    display: flex;
    flex-direction: column;
    gap: 7px;
}

.doc-meta > div {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    color: var(--muted-foreground);
    font-size: 11px;
}

.doc-meta > div span:last-child {
    min-width: 0;
    overflow: hidden;
    color: var(--foreground);
    font-family: var(--font-mono);
    text-overflow: ellipsis;
    white-space: nowrap;
}

.context-link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: var(--muted-foreground);
    font-size: 12px;
    text-decoration: none;
}

.context-link:hover {
    color: var(--foreground);
}

.context-link svg {
    width: 14px;
    height: 14px;
}

.prose {
    color: var(--foreground);
    font-size: 15px;
    line-height: 1.78;
}

.prose > :first-child {
    margin-top: 34px;
}

.prose > :last-child {
    margin-bottom: 0;
}

.prose h2 {
    margin: 48px 0 16px;
    padding-top: 4px;
    font-size: 26px;
    font-weight: 600;
    letter-spacing: -0.035em;
    line-height: 1.25;
}

.prose h3 {
    margin: 34px 0 12px;
    font-size: 19px;
    font-weight: 600;
    letter-spacing: -0.025em;
    line-height: 1.35;
}

.prose h4 {
    margin: 26px 0 10px;
    font-size: 16px;
    font-weight: 600;
}

.prose p {
    margin: 0 0 16px;
}

.prose ul,
.prose ol {
    display: flex;
    flex-direction: column;
    gap: 7px;
    margin: 0 0 18px;
    padding-left: 24px;
}

.prose a {
    color: var(--accent-strong);
    text-underline-offset: 3px;
}

.prose code {
    padding: 2px 5px;
    border: 1px solid var(--border);
    border-radius: 5px;
    background: var(--surface-subtle);
    font: 0.84em var(--font-mono);
}

.prose pre {
    margin: 20px 0;
    padding: 18px;
    border-radius: var(--radius-sm);
    background: var(--code-background);
    color: var(--code-foreground);
    overflow-x: auto;
}

.prose pre code {
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    font-size: 12px;
    white-space: pre;
}

.prose blockquote {
    margin: 22px 0;
    padding: 16px 18px;
    border-left: 3px solid var(--accent);
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
    background: var(--accent-soft);
    color: var(--muted-foreground);
}

.prose blockquote p:last-child {
    margin-bottom: 0;
}

.prose hr {
    margin: 42px 0;
    border: 0;
    border-top: 1px solid var(--border);
}

.table-scroll {
    max-width: 100%;
    margin: 22px 0;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    overflow-x: auto;
}

.prose table,
.data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
}

.prose th,
.prose td,
.data-table th,
.data-table td {
    padding: 11px 12px;
    border-bottom: 1px solid var(--border);
    text-align: left;
    vertical-align: top;
}

.prose th,
.data-table th {
    background: var(--surface-subtle);
    font-weight: 600;
    white-space: nowrap;
}

.prose tr:last-child td,
.data-table tr:last-child td {
    border-bottom: 0;
}

.prose .task-list-item {
    list-style: none;
}

.prose .task-list-item-checkbox {
    margin-right: 8px;
}

.pager {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin-top: 64px;
    padding-top: 24px;
    border-top: 1px solid var(--border);
}

.pager-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    padding: 14px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface);
    text-decoration: none;
}

.pager-btn--next {
    justify-content: flex-end;
    text-align: right;
}

.pager-btn:hover {
    border-color: var(--border-strong);
}

.pager-btn svg {
    width: 17px;
    height: 17px;
    flex-shrink: 0;
}

.pager-btn span {
    min-width: 0;
    overflow: hidden;
    font-size: 13px;
    font-weight: 500;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.pager-btn small {
    display: block;
    color: var(--faint-foreground);
    font-size: 10px;
    font-weight: 500;
}

.mobile-docs-menu {
    display: none;
}

.state-card {
    display: grid;
    place-items: center;
    min-height: 62vh;
    text-align: center;
}

.state-card > div {
    max-width: 520px;
}

.state-card svg {
    color: var(--accent);
}

.state-card h1 {
    margin: 18px 0 0;
    font-size: 40px;
    letter-spacing: -0.04em;
}

.state-card p {
    margin: 12px 0 0;
}

@media (max-width: 1120px) {
    .hero {
        grid-template-columns: minmax(0, 1fr) minmax(340px, 0.9fr);
        gap: 40px;
    }

    .docs-shell {
        grid-template-columns: 220px minmax(0, 780px);
        gap: 36px;
    }

    .docs-context {
        display: none;
    }
}

@media (max-width: 860px) {
    .hero {
        grid-template-columns: 1fr;
        min-height: auto;
        padding-block: 70px;
    }

    .terminal-card {
        max-width: 650px;
    }

    .metric-strip,
    .workflow-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .metric:nth-child(3) {
        border-left: 0;
    }

    .metric:nth-child(n + 3) {
        border-top: 1px solid var(--border);
    }

    .workflow-card:not(:last-child)::after {
        display: none;
    }

    .section-heading {
        grid-template-columns: 1fr;
        gap: 18px;
    }

    .agent-stage {
        grid-template-columns: 1fr;
    }

    .primary-agent {
        min-height: 330px;
    }

    .doc-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .docs-shell {
        display: block;
        width: min(calc(100% - 40px), 820px);
    }

    .docs-sidebar {
        display: none;
    }

    .mobile-docs-menu {
        display: block;
        position: sticky;
        top: var(--header-height);
        z-index: 40;
        border-bottom: 1px solid var(--border);
        background: color-mix(in oklch, var(--background) 92%, transparent);
        backdrop-filter: blur(16px);
    }

    .mobile-docs-menu > summary {
        display: flex;
        align-items: center;
        gap: 9px;
        width: min(calc(100% - 40px), 820px);
        min-height: 46px;
        margin-inline: auto;
        color: var(--muted-foreground);
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        list-style: none;
    }

    .mobile-docs-menu > summary::-webkit-details-marker {
        display: none;
    }

    .mobile-docs-menu > summary svg {
        width: 16px;
        height: 16px;
    }

    .mobile-docs-nav {
        max-height: calc(100dvh - 112px);
        padding: 6px 20px 24px;
        background: var(--background);
        overflow-y: auto;
    }
}

@media (max-width: 640px) {
    .site-header-inner,
    .site-main,
    .footer-inner,
    .docs-shell {
        width: min(calc(100% - 44px), var(--content-width));
    }

    .header-divider,
    .header-product,
    .nav-link {
        display: none;
    }

    .site-nav {
        gap: 2px;
    }

    .site-nav .icon-btn {
        display: none;
    }

    .icon-btn,
    .theme-toggle {
        width: 34px;
        height: 34px;
    }

    .hero {
        gap: 42px;
        padding-block: 54px;
    }

    .hero-title {
        font-size: clamp(38px, 11vw, 48px);
        overflow-wrap: anywhere;
    }

    .mobile-break {
        display: block;
    }

    .hero-sub {
        font-size: 16px;
    }

    .terminal-body {
        min-height: 320px;
        padding: 18px;
        font-size: 11px;
    }

    .terminal-command {
        grid-template-columns: auto minmax(0, 1fr);
    }

    .terminal-command .copy-btn {
        grid-column: 2;
        justify-self: start;
    }

    .terminal-step {
        grid-template-columns: 24px minmax(0, 1fr);
    }

    .terminal-step small {
        display: none;
    }

    .metric-strip,
    .workflow-grid,
    .specialist-grid,
    .split-panel,
    .boundary-grid,
    .doc-grid,
    .docs-category-grid,
    .cta-panel {
        grid-template-columns: 1fr;
    }

    .metric + .metric {
        border-top: 1px solid var(--border);
        border-left: 0;
    }

    .section {
        padding-block: 70px;
    }

    .section-heading {
        margin-bottom: 32px;
    }

    .split-panel > div {
        padding: 28px;
    }

    .split-panel > div + div {
        border-top: 1px solid var(--border);
        border-left: 0;
    }

    .cta-panel {
        justify-items: start;
        margin-block: 70px;
        padding: 30px;
    }

    .footer-inner {
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        gap: 10px;
    }

    .mobile-docs-menu > summary {
        width: calc(100% - 28px);
    }

    .docs-main {
        padding-top: 28px;
    }

    .quickstart {
        grid-template-columns: minmax(0, 1fr);
    }

    .quickstart .copy-btn {
        width: fit-content;
    }

    .pager-btn span {
        white-space: normal;
    }
}

@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        scroll-behavior: auto !important;
        transition-duration: 0.01ms !important;
    }
}
`
