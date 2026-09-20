export const siteCss: string = `/* ═════════════════════════════════════════════════════════════
   TIER 1 — PALETTE.  DESIGN.md §16-1, verbatim.  Raw values,
   never referenced by components.  Surface B literals from §3-6.
   ═════════════════════════════════════════════════════════════ */
:root {
    /* Neutral ramp — chroma is exactly 0 throughout. Name = L × 1000. */
    --palette-neutral-1000: oklch(1 0 0);       /* card, popover, destructive-fg (light) */
    --palette-neutral-985:  oklch(0.985 0 0);   /* primary-fg (light) / foreground (dark) */
    --palette-neutral-970:  oklch(0.97 0 0);    /* secondary, muted, accent (light) */
    --palette-neutral-955:  oklch(0.955 0 0);   /* background — tier 2 (light) */
    --palette-neutral-922:  oklch(0.922 0 0);   /* border, input (light) / primary (dark) */
    --palette-neutral-915:  oklch(0.915 0 0);   /* sidebar — tier 1 (light) */
    --palette-neutral-900:  oklch(0.9 0 0);     /* sidebar-border (light) */
    --palette-neutral-855:  oklch(0.855 0 0);   /* sidebar-accent (light) */
    --palette-neutral-708:  oklch(0.708 0 0);   /* ring (light) / muted-fg (dark) */
    --palette-neutral-556:  oklch(0.556 0 0);   /* muted-fg (light) / ring (dark) */
    --palette-neutral-420:  oklch(0.42 0 0);    /* sidebar-foreground (light) */
    --palette-neutral-269:  oklch(0.269 0 0);   /* secondary, muted, accent (dark) */
    --palette-neutral-232:  oklch(0.232 0 0);   /* sidebar-accent (dark) */
    --palette-neutral-212:  oklch(0.212 0 0);   /* card — tier 3 (dark) */
    --palette-neutral-205:  oklch(0.205 0 0);   /* primary (light) / popover, primary-fg (dark) */
    --palette-neutral-162:  oklch(0.162 0 0);   /* background — tier 2 (dark) */
    --palette-neutral-145:  oklch(0.145 0 0);   /* foreground (light) */
    --palette-neutral-098:  oklch(0.098 0 0);   /* sidebar — tier 1 (dark) */

    /* Source drift, preserved verbatim: dark destructive-foreground is written
       with four decimals. 0.0001 above --palette-neutral-985. See §3-2. */
    --palette-neutral-985-alt: oklch(0.9851 0 0);

    /* Translucent white — dark hairlines that adapt to any surface tier. */
    --palette-white-a10: oklch(1 0 0 / 10%);    /* border (dark) */
    --palette-white-a15: oklch(1 0 0 / 15%);    /* input (dark) */

    /* Chromatic accents. Fractional hue is reproduced from source verbatim. */
    --palette-red-577:    oklch(0.577 0.245 27.325);   /* destructive (light) */
    --palette-red-704:    oklch(0.704 0.191 22.216);   /* destructive (dark) */
    --palette-amber-705:  oklch(0.705 0.153 70);       /* warning (light) */
    --palette-amber-790:  oklch(0.79 0.145 75);        /* warning (dark) */
    --palette-orange-646: oklch(0.646 0.222 41.116);   /* chart-1 (light) — selection */
    --palette-teal-600:   oklch(0.6 0.118 184.704);    /* chart-2 (light) — "good" */
    --palette-blue-398:   oklch(0.398 0.07 227.392);   /* chart-3 (light) — fills only */
    --palette-yellow-828: oklch(0.828 0.189 84.429);   /* chart-4 (light) — "needs improvement" */
    --palette-amber-769:  oklch(0.769 0.188 70.08);    /* chart-5 (light) AND chart-3 (dark) */
    --palette-indigo-488: oklch(0.488 0.243 264.376);  /* chart-1 (dark) — selection */
    --palette-green-696:  oklch(0.696 0.17 162.48);    /* chart-2 (dark) — "good" */
    --palette-purple-627: oklch(0.627 0.265 303.9);    /* chart-4 (dark) — "needs improvement" */
    --palette-rose-645:   oklch(0.645 0.246 16.439);   /* chart-5 (dark) */

    /* Sidebar chromatics — converted from HSL; original strings kept for traceability. */
    --palette-slate-210: oklch(0.210 0.006 286);  /* hsl(240 5.9% 10%) */
    --palette-slate-968: oklch(0.968 0.001 286);  /* hsl(240 4.8% 95.9%) */
    --palette-slate-274: oklch(0.274 0.005 286);  /* hsl(240 3.7% 15.9%) */
    --palette-blue-623:  oklch(0.623 0.188 260);  /* hsl(217.2 91.2% 59.8%) */
    --palette-blue-488:  oklch(0.488 0.217 264);  /* hsl(224.3 76.3% 48%) */

    /* Shadow ink — hsl(0 0% 0%) */
    --palette-shadow-ink: oklch(0 0 0);

    /* Surface B literals — one plane, no sidebar tier, no warning (§3-6). */
    --palette-b-background-light: oklch(1 0 0);       /* --background (light) */
    --palette-b-card-light:       oklch(1 0 0);       /* --card (light) */
    --palette-b-background-dark:  oklch(0.145 0 0);   /* --background (dark) */
    --palette-b-card-dark:        oklch(0.205 0 0);   /* --card (dark) */
}

/* ═════════════════════════════════════════════════════════════
   SHARED TOKENS — fonts, type scale, motion, layout constants.
   Identical on both surfaces (§16-2: everything not listed is
   identical to 16-1).  --text-2xs diverges per surface (§5-5).
   ═════════════════════════════════════════════════════════════ */
:root {
    --font-sans:
        ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
        'Helvetica Neue', Arial, 'Noto Sans', sans-serif,
        'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
    --font-serif: ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif;
    --font-mono:
        ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
        'Courier New', monospace;

    --text-xs: 0.75rem;
    --text-sm: 0.875rem;
    --text-base: 1rem;
    --text-lg: 1.125rem;
    --text-xl: 1.25rem;
    --text-2xl: 1.5rem;
    --text-3xl: 1.875rem;

    --spacing: 0.25rem;

    --motion-ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
    --motion-fade-duration: 0.18s;
    --motion-bar-duration: 0.24s;

    --sidebar-width: 16rem;
    --sidebar-width-icon: 3rem;
    --sidebar-width-mobile: 18rem;
    --context-panel-width: 20rem;
    --rail-chrome-height: 3rem;
    --nav-item-height: 2.25rem;
    --panel-inset: 12px;
    --panel-gutter: 1px;
    --chart-height: 14rem;
    --skeleton-page: 24rem;
    --skeleton-table: 16rem;
    --skeleton-panel: 6rem;
    --skeleton-row: 1.5rem;

    --z-rail: 10;
    --z-raised: 20;
    --z-overlay: 50;

    /* Theme-invariant code surface (§11-H): fixed dark slab, light text. */
    --color-cmd-bg: var(--palette-neutral-145);
    --color-cmd-fg: var(--palette-neutral-922);
}

/* ═════════════════════════════════════════════════════════════
   TIER 2 — SEMANTIC (LIGHT).  Components reference --color-* only.
   Shared 22 bindings; surface-specific extras follow.
   ═════════════════════════════════════════════════════════════ */
body.surface-a,
body.surface-b {
    --foreground:            var(--palette-neutral-145);
    --card-foreground:       var(--palette-neutral-145);
    --popover:               var(--palette-neutral-1000);
    --popover-foreground:    var(--palette-neutral-145);
    --primary:               var(--palette-neutral-205);
    --primary-foreground:    var(--palette-neutral-985);
    --secondary:             var(--palette-neutral-970);
    --secondary-foreground:  var(--palette-neutral-205);
    --muted:                 var(--palette-neutral-970);
    --muted-foreground:      var(--palette-neutral-556);
    --accent:                var(--palette-neutral-970);
    --accent-foreground:     var(--palette-neutral-205);
    --destructive:           var(--palette-red-577);
    --destructive-foreground:var(--palette-neutral-1000);
    --border:                var(--palette-neutral-922);
    --input:                 var(--palette-neutral-922);
    --ring:                  var(--palette-neutral-708);

    --chart-1: var(--palette-orange-646);
    --chart-2: var(--palette-teal-600);
    --chart-3: var(--palette-blue-398);
    --chart-4: var(--palette-yellow-828);
    --chart-5: var(--palette-amber-769);
}

/* Surface A — three-tier depth, square, flat, with sidebar tier and warning. */
body.surface-a {
    --background: var(--palette-neutral-955);   /* tier 2 */
    --card:       var(--palette-neutral-1000);  /* tier 3 */
    --warning:    var(--palette-amber-705);
    --sidebar:    var(--palette-neutral-915);   /* tier 1 */
    --sidebar-foreground:         var(--palette-neutral-420);
    --sidebar-primary:            var(--palette-slate-210);
    --sidebar-primary-foreground: var(--palette-neutral-985);
    --sidebar-accent:             var(--palette-neutral-855);
    --sidebar-accent-foreground:  var(--palette-slate-210);
    --sidebar-border:             var(--palette-neutral-900);
    --sidebar-ring:               var(--palette-blue-623);

    /* Radius: all four pin to --radius. Never calc() — §6-3, §12-3. */
    --radius: 0rem;
    --radius-sm: var(--radius);
    --radius-md: var(--radius);
    --radius-lg: var(--radius);
    --radius-xl: var(--radius);

    /* Shadows — surfaces flat, overlays lifted (§6-5). */
    --shadow-2xs: none;
    --shadow-xs:  none;
    --shadow-sm:  none;
    --shadow:     none;
    --shadow-md:  0px 2px 8px 0px oklch(0 0 0 / 0.10);
    --shadow-lg:  0px 4px 16px 0px oklch(0 0 0 / 0.12);
    --shadow-xl:  0px 8px 24px 0px oklch(0 0 0 / 0.14);
    --shadow-2xl: 0px 16px 40px 0px oklch(0 0 0 / 0.18);

    --text-2xs: 0.6875rem;   /* 11px — the dashboard step (§5-5) */
}

/* Surface B — one white plane, 6px rounded, the inherited glow stack. */
body.surface-b {
    --background: var(--palette-b-background-light);
    --card:       var(--palette-b-card-light);

    --radius: 0.375rem;   /* 6px — calc chain valid because radius is non-zero */
    --radius-sm: calc(var(--radius) - 4px);   /* 2px */
    --radius-md: calc(var(--radius) - 2px);   /* 4px */
    --radius-lg: var(--radius);               /* 6px */
    --radius-xl: calc(var(--radius) + 4px);   /* 10px */

    --shadow-2xs: 0px 0px 7px 0px oklch(0 0 0 / 0.03);
    --shadow-xs:  0px 0px 7px 0px oklch(0 0 0 / 0.03);
    --shadow-sm:  0px 0px 7px 0px oklch(0 0 0 / 0.06), 0px 1px 2px -1px oklch(0 0 0 / 0.06);
    --shadow:     0px 0px 7px 0px oklch(0 0 0 / 0.06), 0px 1px 2px -1px oklch(0 0 0 / 0.06);
    --shadow-md:  0px 0px 7px 0px oklch(0 0 0 / 0.06), 0px 2px 4px -1px oklch(0 0 0 / 0.06);
    --shadow-lg:  0px 0px 7px 0px oklch(0 0 0 / 0.06), 0px 4px 6px -1px oklch(0 0 0 / 0.06);
    --shadow-xl:  0px 0px 7px 0px oklch(0 0 0 / 0.06), 0px 8px 10px -1px oklch(0 0 0 / 0.06);
    --shadow-2xl: 0px 0px 7px 0px oklch(0 0 0 / 0.15);

    --text-2xs: 0.625rem;   /* 10px — NOT 0.6875rem. The two surfaces diverge (§5-5). */
}

/* --color-* mapping — the Tailwind @theme inline equivalent. */
body.surface-a,
body.surface-b {
    --color-background: var(--background);
    --color-foreground: var(--foreground);
    --color-card: var(--card);
    --color-card-foreground: var(--card-foreground);
    --color-popover: var(--popover);
    --color-popover-foreground: var(--popover-foreground);
    --color-primary: var(--primary);
    --color-primary-foreground: var(--primary-foreground);
    --color-secondary: var(--secondary);
    --color-secondary-foreground: var(--secondary-foreground);
    --color-muted: var(--muted);
    --color-muted-foreground: var(--muted-foreground);
    --color-accent: var(--accent);
    --color-accent-foreground: var(--accent-foreground);
    --color-destructive: var(--destructive);
    --color-destructive-foreground: var(--destructive-foreground);
    --color-border: var(--border);
    --color-input: var(--input);
    --color-ring: var(--ring);

    --color-chart-1: var(--chart-1);
    --color-chart-2: var(--chart-2);
    --color-chart-3: var(--chart-3);
    --color-chart-4: var(--chart-4);
    --color-chart-5: var(--chart-5);
}

body.surface-a {
    --color-warning: var(--warning);
    --color-sidebar: var(--sidebar);
    --color-sidebar-foreground: var(--sidebar-foreground);
    --color-sidebar-primary: var(--sidebar-primary);
    --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
    --color-sidebar-accent: var(--sidebar-accent);
    --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
    --color-sidebar-border: var(--sidebar-border);
    --color-sidebar-ring: var(--sidebar-ring);
}

/* ═════════════════════════════════════════════════════════════
   TIER 2 — SEMANTIC (DARK).  Only bindings change (§4-3).
   .dark is the mechanism; [data-theme='dark'] is the interop alias.
   ═════════════════════════════════════════════════════════════ */
.dark body.surface-a, [data-theme='dark'] body.surface-a,
.dark body.surface-b, [data-theme='dark'] body.surface-b {
    --foreground:            var(--palette-neutral-985);
    --card-foreground:       var(--palette-neutral-985);
    --popover:               var(--palette-neutral-205);
    --popover-foreground:    var(--palette-neutral-985);
    --primary:               var(--palette-neutral-922);
    --primary-foreground:    var(--palette-neutral-205);
    --secondary:             var(--palette-neutral-269);
    --secondary-foreground:  var(--palette-neutral-985);
    --muted:                 var(--palette-neutral-269);
    --muted-foreground:      var(--palette-neutral-708);
    --accent:                var(--palette-neutral-269);
    --accent-foreground:     var(--palette-neutral-985);
    --destructive:           var(--palette-red-704);
    --destructive-foreground:var(--palette-neutral-985-alt);
    --border:                var(--palette-white-a10);
    --input:                 var(--palette-white-a15);
    --ring:                  var(--palette-neutral-556);

    --chart-1: var(--palette-indigo-488);
    --chart-2: var(--palette-green-696);
    --chart-3: var(--palette-amber-769);
    --chart-4: var(--palette-purple-627);
    --chart-5: var(--palette-rose-645);
}

.dark body.surface-a, [data-theme='dark'] body.surface-a {
    --background: var(--palette-neutral-162);   /* tier 2 */
    --card:       var(--palette-neutral-212);   /* tier 3 — brighter than body */
    --warning:    var(--palette-amber-790);
    --sidebar:    var(--palette-neutral-098);   /* tier 1 */
    --sidebar-foreground:         var(--palette-slate-968);
    --sidebar-primary:            var(--palette-blue-488);
    --sidebar-primary-foreground: var(--palette-neutral-1000);
    --sidebar-accent:             var(--palette-neutral-232);
    --sidebar-accent-foreground:  var(--palette-slate-968);
    --sidebar-border:             var(--palette-slate-274);
    --sidebar-ring:               var(--palette-blue-623);
}

.dark body.surface-b, [data-theme='dark'] body.surface-b {
    --background: var(--palette-b-background-dark);
    --card:       var(--palette-b-card-dark);
}

/* ═════════════════════════════════════════════════════════════
   BASE (§5-1, §8-5)
   ═════════════════════════════════════════════════════════════ */
html {
    scrollbar-width: none;
    scroll-behavior: smooth;
}

html.dark, html[data-theme='dark'] { color-scheme: dark; }
[data-theme='light'] { color-scheme: light; }

body {
    margin: 0;
    background: var(--color-background);
    color: var(--color-foreground);
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    scrollbar-width: none;
    scroll-behavior: smooth;
}

::-webkit-scrollbar { display: none; }

*, ::before, ::after {
    box-sizing: border-box;
    border-color: var(--color-border);
    outline-color: color-mix(in oklch, var(--color-ring) 50%, transparent);
}

button { font: inherit; }

/* Focus ring §6-6 — focus-visible:border-ring + ring-ring/50 ring-[3px]. */
a:focus-visible,
button:focus-visible {
    border-color: var(--color-ring);
    box-shadow: 0 0 0 3px color-mix(in oklch, var(--color-ring) 50%, transparent);
    outline: none;
}

/* ═════════════════════════════════════════════════════════════
   UTILITIES
   ═════════════════════════════════════════════════════════════ */
.skip-link {
    position: fixed;
    top: 12px;
    left: -9999px;
    z-index: var(--z-overlay);
    padding: var(--panel-inset);
    background: var(--color-card);
    color: var(--color-foreground);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-weight: 500;
    text-decoration: none;
}

.skip-link:focus-visible { left: 12px; }

.mono { font-family: var(--font-mono); }
.muted { color: var(--color-muted-foreground); }
.num { text-align: right; font-variant-numeric: tabular-nums; }

/* ═════════════════════════════════════════════════════════════
   BADGE — §10-5, verbatim
   ═════════════════════════════════════════════════════════════ */
.badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    width: fit-content;
    flex-shrink: 0;
    overflow: hidden;
    border-radius: 9999px;
    border: 1px solid transparent;
    padding: 2px 8px;
    font-size: var(--text-xs);
    font-weight: 500;
    white-space: nowrap;
    transition: color 0.15s, box-shadow 0.15s;
}

.badge--default     { background: var(--color-primary);     color: var(--color-primary-foreground); }
.badge--secondary   { background: var(--color-secondary);   color: var(--color-secondary-foreground); }
/* §10-5: the source writes a literal white here, NOT --color-destructive-foreground. */
.badge--destructive { background: var(--color-destructive); color: oklch(1 0 0); }
.badge--outline     { border-color: var(--color-border);    color: var(--color-foreground); }

/* ═════════════════════════════════════════════════════════════
   BUTTON — §14-4: height 36/32px, padding 16/12px; radius follows
   the surface token; icon 16px descendant rule §14-2.
   ═════════════════════════════════════════════════════════════ */
.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 36px;
    padding-inline: 16px;
    border: 1px solid transparent;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--color-foreground);
    font-size: var(--text-sm);
    font-weight: 500;
    white-space: nowrap;
    cursor: pointer;
    text-decoration: none;
    transition: color 0.15s, background-color 0.15s, border-color 0.15s, box-shadow 0.15s;
}

.btn:disabled { opacity: 0.5; pointer-events: none; }

.btn--default { background: var(--color-primary); color: var(--color-primary-foreground); }
.btn--default:hover { background: color-mix(in oklch, var(--color-primary) 90%, transparent); }

.btn--outline { border-color: var(--color-input); background: var(--color-background); color: var(--color-foreground); }
.btn--outline:hover { background: var(--color-accent); color: var(--color-accent-foreground); }

.btn--ghost:hover { background: var(--color-accent); color: var(--color-accent-foreground); }

.btn--sm { height: 32px; padding-inline: 12px; }

.btn svg { width: 16px; height: 16px; pointer-events: none; flex-shrink: 0; }

/* ═════════════════════════════════════════════════════════════
   CMD — theme-invariant code block (§11-H): fixed dark slab,
   light text, in both themes.
   ═════════════════════════════════════════════════════════════ */
.cmd {
    background: var(--color-cmd-bg);
    color: var(--color-cmd-fg);
    font-family: var(--font-mono);
    border-radius: var(--radius-md);
    padding: var(--panel-inset);
}

pre.cmd { margin: 0; overflow-x: auto; }

pre.cmd > code {
    display: block;
    font-family: inherit;
    font-size: var(--text-2xs);
    white-space: pre-wrap;
    word-break: break-all;
}

@media (min-width: 64rem) {
    pre.cmd > code { font-size: var(--text-sm); }
}

/* ═════════════════════════════════════════════════════════════
   DATA TABLE — §10-3, verbatim
   ═════════════════════════════════════════════════════════════ */
.table-scroll { overflow-x: auto; }

.data-table { width: 100%; border-collapse: collapse; font-size: var(--text-xs); }
.data-table th,
.data-table td { padding: 8px; vertical-align: middle; }
.data-table th { font-weight: 500; color: var(--color-muted-foreground); text-align: left; }
.data-table tbody tr { border-bottom: 1px solid var(--color-border); }
.data-table .num { text-align: right; font-variant-numeric: tabular-nums; }
.data-table .mono { font-family: var(--font-mono); }
.data-table .flex-cell { max-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ═════════════════════════════════════════════════════════════
   PANEL CARD — §10-1, verbatim.  Separation is the parent's
   1px gap, never a border.
   ═════════════════════════════════════════════════════════════ */
.panel {
    display: flex;
    flex-direction: column;
    gap: var(--panel-inset);
    padding-block: var(--panel-inset);
    background: var(--color-card);
    border: 0;
    border-radius: 0;
    box-shadow: none;
}

.panel-header,
.panel-content { padding-inline: var(--panel-inset); }

.panel-title { margin: 0; font-size: var(--text-sm); font-weight: 500; color: var(--color-card-foreground); }

.panel-content > :last-child { margin-bottom: 0; }

.panel-footnote {
    margin: 0;
    padding-inline: var(--panel-inset);
    font-size: var(--text-xs);
    color: var(--color-muted-foreground);
}

.page-root { display: flex; flex-direction: column; gap: var(--panel-gutter); }

.page-root > .crumb,
.page-root > .pager {
    background: var(--color-card);
    padding: 8px var(--panel-inset);
}

/* ═════════════════════════════════════════════════════════════
   SKELETON + STATE CARD — §10-10: skeleton, never a spinner.
   ═════════════════════════════════════════════════════════════ */
@keyframes pulse { 50% { opacity: 0.5; } }

.skeleton {
    background: var(--color-muted);
    border-radius: var(--radius-md);
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.state-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 24px;
    padding: var(--panel-inset);
    background: var(--color-card);
    border: 1px dashed transparent;
    text-align: center;
    text-wrap: balance;
}

/* ═════════════════════════════════════════════════════════════
   SECTIONS · CARDS · HERO — site compositions on the token set.
   ═════════════════════════════════════════════════════════════ */
.section { display: flex; flex-direction: column; gap: 16px; }
.section-title { margin: 0; font-size: var(--text-xl); font-weight: 600; letter-spacing: -0.025em; }
.section-lead { margin: 0; font-size: var(--text-sm); line-height: 1.75; color: var(--color-muted-foreground); }

.card-grid { display: grid; gap: 16px; }
@media (min-width: 48rem) { .card-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
body.surface-a .card-grid { gap: var(--panel-gutter); }

.doc-card {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px;
    background: var(--color-card);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
}

body.surface-a .doc-card { gap: var(--panel-inset); padding: var(--panel-inset); }

.doc-card--link {
    color: inherit;
    text-decoration: none;
    transition: color 0.15s, background-color 0.15s, box-shadow 0.15s;
}

.doc-card--link:hover { box-shadow: var(--shadow-md); }
body.surface-a .doc-card--link:hover { box-shadow: none; background: var(--color-accent); }

.doc-card-title { margin: 0; font-size: var(--text-sm); font-weight: 600; }
.doc-card-summary { margin: 0; font-size: var(--text-sm); line-height: 1.75; color: var(--color-muted-foreground); }
.doc-card-meta { font-size: var(--text-2xs); color: var(--color-muted-foreground); }

.feature-grid { display: grid; gap: 16px; }
@media (min-width: 48rem) { .feature-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }

.feature-card {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px;
    background: var(--color-card);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
}

.feature-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: var(--radius-md);
    background: var(--color-muted);
    color: var(--color-foreground);
}

.feature-icon svg { width: 16px; height: 16px; }

.hero { display: flex; flex-direction: column; gap: 16px; }
.hero-title { margin: 0; font-size: var(--text-3xl); font-weight: 600; letter-spacing: -0.025em; }
.hero-sub { margin: 0; max-width: 42rem; font-size: var(--text-sm); line-height: 1.75; color: var(--color-muted-foreground); }
.hero-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }

/* ═════════════════════════════════════════════════════════════
   LANDING CHROME — Surface B.  Sticky 48px translucent header
   over a 768px column (§11-H Guide, §8-6).
   ═════════════════════════════════════════════════════════════ */
.site-main {
    max-width: 48rem;
    margin-inline: auto;
    padding: 24px 16px 80px;
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.site-header {
    position: sticky;
    top: 0;
    z-index: var(--z-overlay);
    height: var(--rail-chrome-height);
    background: color-mix(in oklch, var(--color-background) 60%, transparent);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    border-bottom: 1px solid var(--color-border);
}

.site-header-inner {
    display: flex;
    align-items: center;
    gap: 16px;
    height: 100%;
    max-width: 48rem;
    margin-inline: auto;
    padding-inline: 16px;
}

.wordmark {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: var(--text-sm);
    font-weight: 600;
    letter-spacing: -0.025em;
    color: var(--color-foreground);
    text-decoration: none;
}

.wordmark-mark { display: inline-flex; }
.wordmark-mark svg { width: 20px; height: 20px; }

.site-nav { display: flex; align-items: center; gap: 16px; margin-left: auto; }

.nav-link {
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--color-muted-foreground);
    text-decoration: none;
    transition: color 0.15s;
}

.nav-link:hover { color: var(--color-foreground); }
.nav-link--active { color: var(--color-foreground); }

.icon-btn,
.theme-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: 0;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--color-foreground);
    cursor: pointer;
    transition: color 0.15s, background-color 0.15s;
}

.icon-btn:hover,
.theme-toggle:hover { background: var(--color-accent); color: var(--color-accent-foreground); }

.icon-btn svg,
.theme-toggle svg { width: 16px; height: 16px; pointer-events: none; }

/* Light shows the moon (switch to dark); dark shows the sun. */
.theme-toggle .icon-sun { display: none; }
.dark .theme-toggle .icon-sun,
[data-theme='dark'] .theme-toggle .icon-sun { display: inline-flex; }
.dark .theme-toggle .icon-moon,
[data-theme='dark'] .theme-toggle .icon-moon { display: none; }

.site-footer { border-top: 1px solid var(--color-border); }

.footer-inner { max-width: 48rem; margin-inline: auto; padding: 24px 16px; }

.footer-meta {
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    font-size: var(--text-xs);
    color: var(--color-muted-foreground);
}

.footer-meta a { color: inherit; text-decoration: none; }
.footer-meta a:hover { color: var(--color-foreground); text-decoration: underline; }

/* ═════════════════════════════════════════════════════════════
   CONSOLE SHELL — Surface A.  Three columns, no header bar,
   1px gutters (§8-1, §8-2, §10-11, §10-12).
   ═════════════════════════════════════════════════════════════ */
.shell { display: flex; height: 100dvh; min-height: 0; }

.rail {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    width: var(--sidebar-width);
    background: var(--color-sidebar);
    color: var(--color-sidebar-foreground);
    z-index: var(--z-rail);
}

.rail-header {
    display: flex;
    align-items: center;
    gap: 8px;
    height: var(--rail-chrome-height);
    padding-inline: var(--panel-inset);
    flex-shrink: 0;
}

.rail-wordmark {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    color: inherit;
    text-decoration: none;
}

.rail-wordmark svg { width: 20px; height: 20px; flex-shrink: 0; }

.rail-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: var(--text-sm);
    font-weight: 600;
    letter-spacing: -0.025em;
}

.rail-menu {
    display: flex;
    flex-direction: column;
    gap: 0;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    margin: 0;
    padding: 0;
    list-style: none;
}

.rail-group-label {
    margin: 0;
    padding: 12px 12px 4px;
    font-size: var(--text-2xs);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.025em;
    color: var(--color-muted-foreground);
}

.rail-item {
    display: flex;
    align-items: center;
    gap: 12px;
    height: var(--nav-item-height);
    padding-inline: var(--panel-inset);
    border-radius: 0;
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--color-sidebar-foreground);
    text-decoration: none;
}

.rail-item > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rail-item svg { width: 16px; height: 16px; flex-shrink: 0; }

.rail-item:hover,
.rail-item--active,
.rail-item[aria-current="page"] {
    background: var(--color-sidebar-accent);
    color: var(--color-sidebar-accent-foreground);
}

.rail-footer {
    display: flex;
    align-items: center;
    gap: 8px;
    height: var(--rail-chrome-height);
    padding-inline: var(--panel-inset);
    flex-shrink: 0;
}

.rail .icon-btn { color: var(--color-sidebar-foreground); }
.rail .icon-btn:hover { background: var(--color-sidebar-accent); color: var(--color-sidebar-accent-foreground); }

.content {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    min-height: 0;
    background: var(--color-background);
    overflow: hidden;
}

.content-scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
}

.context {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    width: var(--context-panel-width);
    min-height: 0;
    background: var(--color-sidebar);
    color: var(--color-sidebar-foreground);
    overflow-y: auto;
}

.context-block {
    display: flex;
    flex-direction: column;
    gap: var(--panel-inset);
    padding: var(--panel-inset);
    flex-shrink: 0;
    border-bottom: 1px solid var(--color-sidebar-border);
}

.context-title {
    margin: 0;
    font-size: var(--text-2xs);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.025em;
    color: var(--color-muted-foreground);
}

.doc-meta { display: flex; flex-direction: column; gap: 6px; }

.doc-meta > div {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    font-size: var(--text-2xs);
}

.doc-meta > div > span:last-child {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: var(--font-mono);
}

.context .panel-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: var(--text-xs);
}

.toc {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: var(--panel-inset);
}

.toc-item {
    color: var(--color-sidebar-foreground);
    font-size: var(--text-sm);
    text-decoration: none;
    transition: color 0.15s;
}

.toc-item:hover { color: var(--color-sidebar-accent-foreground); }
.toc-item--h3 { padding-left: 12px; font-size: var(--text-xs); }

.crumb {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    font-size: var(--text-xs);
    color: var(--color-muted-foreground);
}

.crumb a { color: inherit; text-decoration: none; }
.crumb a:hover { color: var(--color-foreground); text-decoration: underline; }
.crumb span[aria-hidden="true"] { color: var(--color-muted-foreground); }
.crumb span[aria-current="page"] { color: var(--color-foreground); }

.pager { display: flex; align-items: center; gap: 8px; }

.pager-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 28px;
    min-width: 0;
    padding-inline: 12px;
    border: 0;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--color-foreground);
    font-size: var(--text-xs);
    font-weight: 500;
    text-decoration: none;
    cursor: pointer;
    transition: color 0.15s, background-color 0.15s;
}

.pager-btn:hover { background: var(--color-accent); color: var(--color-accent-foreground); }
.pager-btn:disabled { opacity: 0.5; pointer-events: none; }
.pager-btn > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pager-btn svg { width: 16px; height: 16px; flex-shrink: 0; }

.pager-spacer { flex: 1; }

/* ═════════════════════════════════════════════════════════════
   PROSE — markdown body.  Weights 400/500/600 only; machine
   values mono; pre sits on --color-muted with the surface radius.
   ═════════════════════════════════════════════════════════════ */
.prose {
    font-size: var(--text-sm);
    line-height: 1.75;
    color: var(--color-foreground);
}

.prose > :first-child { margin-top: 0; }
.prose > :last-child { margin-bottom: 0; }

.prose h2 {
    margin: 32px 0 12px;
    font-size: var(--text-xl);
    font-weight: 600;
    letter-spacing: -0.025em;
    line-height: 1.4;
    scroll-margin-top: calc(var(--rail-chrome-height) + 8px);
}

.prose h3 {
    margin: 24px 0 8px;
    font-size: var(--text-lg);
    font-weight: 600;
    letter-spacing: -0.025em;
    line-height: 1.4;
    scroll-margin-top: calc(var(--rail-chrome-height) + 8px);
}

.prose h4 { margin: 16px 0 8px; font-size: var(--text-sm); font-weight: 600; }

.prose p { margin: 0 0 12px; }

.prose ul,
.prose ol {
    margin: 0 0 12px;
    padding-left: 24px;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.prose code {
    padding: 2px 4px;
    background: var(--color-muted);
    border-radius: var(--radius-sm);
    font-family: var(--font-mono);
    font-size: var(--text-2xs);
}

.prose .task-list-item {
    display: flex;
    align-items: baseline;
    gap: 8px;
}

.prose .task-list-item-checkbox {
    flex-shrink: 0;
    margin: 0;
}

.prose pre {
    margin: 0 0 12px;
    padding: var(--panel-inset);
    background: var(--color-muted);
    border-radius: var(--radius-sm);
    overflow-x: auto;
}

.prose pre code {
    display: block;
    padding: 0;
    background: transparent;
    font-size: var(--text-2xs);
    white-space: pre;
}

.prose blockquote {
    margin: 0 0 12px;
    padding-left: 12px;
    border-left: 1px solid var(--color-border);
    color: var(--color-muted-foreground);
}

.prose a { color: var(--color-foreground); text-decoration: none; }
.prose a:hover { text-decoration: underline; }

.prose hr { margin: 24px 0; border: 0; border-top: 1px solid var(--color-border); }

.prose strong { font-weight: 600; }
.prose em { font-style: italic; }

.prose img { display: block; max-width: 100%; height: auto; margin: 0 0 12px; }

.prose table { width: 100%; border-collapse: collapse; font-size: var(--text-xs); }
.prose th,
.prose td { padding: 8px; text-align: left; vertical-align: middle; }
.prose th { font-weight: 500; color: var(--color-muted-foreground); }
.prose tbody tr { border-bottom: 1px solid var(--color-border); }

/* ═════════════════════════════════════════════════════════════
   RESPONSIVE — the single 768px break (§9-2, Gate 6-4).
   ═════════════════════════════════════════════════════════════ */
@media (max-width: 767px) {
    .rail,
    .context { display: none; }
}

/* ═════════════════════════════════════════════════════════════
   REDUCED MOTION — §16-1 recommended block, verbatim.
   ═════════════════════════════════════════════════════════════ */
@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
    }
}
`