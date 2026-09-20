import { cp, mkdir, rm } from "node:fs/promises"
import { join } from "node:path"
import { exists, listFiles, sha256 } from "../src/fs.ts"

const root = join(import.meta.dir, "..")
const dist = join(root, "dist")
const distAssets = join(dist, "assets")
const srcAssets = join(root, "assets")

const manifest = async () => {
  const versionFile = Bun.file(join(root, "package.json"))
  const pkg = (await versionFile.json()) as { version: string }
  return pkg.version
}

const buildInstallerBundle = async () => {
  const result = await Bun.build({
    entrypoints: [join(root, "src", "cli.ts")],
    target: "bun",
    format: "esm",
    minify: false,
    outdir: dist,
    naming: "oh-pencode.ts",
  })
  if (!result.success) {
    for (const log of result.logs) console.error(log)
    throw new Error("installer 번들 생성에 실패했습니다.")
  }
}

const buildInstallScript = async (version: string) => {
  const script = `#!/usr/bin/env bash
set -euo pipefail

# oh-pencode installer bootstrap
# usage: curl -fsSL https://b-hs.github.io/oh-pen/install.sh | bash -s -- [flags]

BASE_URL="\${OH_PENCODE_BASE_URL:-https://b-hs.github.io/oh-pen}"
VERSION="${version}"

if ! command -v opencode >/dev/null 2>&1; then
  echo "OpenCode가 설치되어 있지 않습니다. 먼저 OpenCode V2를 설치하세요." >&2
  echo "  https://opencode.ai/v2/docs/cli/" >&2
  exit 1
fi

if ! command -v bun >/dev/null 2>&1; then
  echo "Bun이 필요합니다. 설치 후 다시 실행하세요." >&2
  echo "  https://bun.sh" >&2
  exit 1
fi

TMP_DIR="$(mktemp -d "\${TMPDIR:-/tmp}/oh-pencode.XXXXXX")"
cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

echo "oh-pencode \${VERSION} 내려받는 중..."
curl -fsSL "$BASE_URL/oh-pencode.ts" -o "$TMP_DIR/oh-pencode.ts"
curl -fsSL "$BASE_URL/manifest.json" -o "$TMP_DIR/manifest.json"

MANIFEST_ASSETS="$(bun -e 'const m = await Bun.file(process.argv[1]).json(); console.log((m.assets ?? []).join("\\n"))' "$TMP_DIR/manifest.json")"
while IFS= read -r asset; do
  [ -z "$asset" ] && continue
  mkdir -p "$TMP_DIR/assets/$(dirname "$asset")"
  curl -fsSL "$BASE_URL/assets/$asset" -o "$TMP_DIR/assets/$asset"
done <<EOF
$MANIFEST_ASSETS
EOF

bun -e '
const manifest = await Bun.file(process.argv[1]).json();
const hashes = manifest.sha256;
if (!hashes) { console.error("manifest에 sha256 검증 정보가 없습니다."); process.exit(1); }
const entries = Object.entries(hashes);
for (const [path, expected] of entries) {
  const file = path === "oh-pencode.ts" ? process.argv[2] + "/oh-pencode.ts" : process.argv[2] + "/assets/" + path;
  if (!(await Bun.file(file).exists())) { console.error("파일이 없습니다: " + path); process.exit(1); }
  const actual = new Bun.CryptoHasher("sha256").update(await Bun.file(file).text()).digest("hex");
  if (actual !== expected) { console.error("sha256이 일치하지 않습니다: " + path); process.exit(1); }
}
console.log("sha256 검증 통과: " + entries.length + "개 파일");
' "$TMP_DIR/manifest.json" "$TMP_DIR"

COMMAND="\${1:-install}"
case "$COMMAND" in
  install|verify|uninstall|upgrade) shift || true ;;
  *) COMMAND=install ;;
esac

bun run "$TMP_DIR/oh-pencode.ts" "$COMMAND" --assets-dir "$TMP_DIR/assets" "$@"
`
  await Bun.write(join(dist, "install.sh"), script)
}

const buildLandingPage = async (version: string) => {
  const html = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>oh-pencode</title>
    <style>
      :root { color-scheme: light dark; }
      body {
        margin: 0 auto; max-width: 52rem; padding: 3rem 1.5rem 6rem;
        font: 16px/1.7 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      h1 { font-size: 2rem; margin: 0 0 .5rem; }
      .sub { opacity: .7; margin: 0 0 2.5rem; }
      h2 { font-size: 1.15rem; margin: 2.5rem 0 .75rem; }
      pre {
        background: color-mix(in srgb, currentColor 7%, transparent);
        padding: .9rem 1.1rem; border-radius: .5rem; overflow-x: auto;
      }
      code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .9em; }
      p, li { opacity: .92; }
    </style>
  </head>
  <body>
    <h1>oh-pencode</h1>
    <p class="sub">OpenCode V2용 pen 에이전트 세트 installer · v${version}</p>

    <h2>설치</h2>
    <pre><code>curl -fsSL https://b-hs.github.io/oh-pen/install.sh | bash</code></pre>

    <h2>미리보기</h2>
    <pre><code>curl -fsSL https://b-hs.github.io/oh-pen/install.sh | bash -s -- --dry-run</code></pre>

    <h2>검증 / 제거</h2>
    <pre><code>curl -fsSL https://b-hs.github.io/oh-pen/install.sh | bash -s -- verify
curl -fsSL https://b-hs.github.io/oh-pen/install.sh | bash -s -- uninstall</code></pre>

    <h2>설치되는 것</h2>
    <ul>
      <li><code>pen</code> — 메인 오케스트레이터 (build/plan 대체)</li>
      <li><code>sub-pen</code> — 상세 계약을 받아 실행하는 실행자</li>
      <li><code>research-pen</code> — 기획·조사</li>
      <li><code>explore-pen</code> — 코드베이스 탐색</li>
      <li><code>doc-pen</code> — 외부 문서 심층 분석</li>
      <li><code>verify-pen</code> — 독립 검증</li>
      <li><code>security-pen</code> — 보안 감사</li>
    </ul>

    <h2>요구 사항</h2>
    <ul>
      <li>OpenCode V2 (<code>opencode --version</code>)</li>
      <li>Bun (<code>bun --version</code>)</li>
    </ul>
  </body>
</html>
`
  await Bun.write(join(dist, "index.html"), html)
}

const buildManifest = async (version: string) => {
  const assetFiles = await listFiles(distAssets)
  const assets = assetFiles.filter((path) => !path.startsWith(".")).sort()
  const sha256Map: Record<string, string> = { "oh-pencode.ts": sha256(await Bun.file(join(dist, "oh-pencode.ts")).text()) }
  for (const asset of assets) {
    sha256Map[asset] = sha256(await Bun.file(join(distAssets, asset)).text())
  }
  await Bun.write(
    join(dist, "manifest.json"),
    `${JSON.stringify({ version, releasedAt: new Date().toISOString(), assets, sha256: sha256Map }, null, 2)}\n`,
  )
  return assets
}

const verifyIntegrity = async (assets: string[]) => {
  if (assets.length === 0) throw new Error("에셋이 비어 있습니다.")
  const manifest = (await Bun.file(join(dist, "manifest.json")).json()) as { sha256?: Record<string, string> }
  const hashes = manifest.sha256
  if (!hashes) throw new Error("manifest에 sha256 맵이 없습니다.")
  const targets = ["oh-pencode.ts", ...assets]
  for (const asset of targets) {
    const expected = hashes[asset]
    if (expected === undefined) throw new Error(`sha256 맵에 항목이 없습니다: ${asset}`)
    const file = asset === "oh-pencode.ts" ? join(dist, asset) : join(distAssets, asset)
    if (!(await exists(file))) throw new Error(`파일이 없습니다: ${asset}`)
    const content = await Bun.file(file).text()
    if (sha256(content) !== expected) throw new Error(`sha256이 일치하지 않습니다: ${asset}`)
    if (asset === "oh-pencode.ts") continue
    if (content.trim().length === 0) throw new Error(`에셋이 비어 있습니다: ${asset}`)
    if (asset.startsWith("agents/") && asset.endsWith(".md")) {
      if (!content.startsWith("---")) throw new Error(`frontmatter가 없습니다: ${asset}`)
      const isBuiltin = asset.split("/").includes("builtin")
      if (!isBuiltin && !content.includes("mode:")) throw new Error(`mode가 없습니다: ${asset}`)
      if (!content.includes("description:")) throw new Error(`description이 없습니다: ${asset}`)
      if (isBuiltin && !content.includes("hidden: true")) throw new Error(`hidden이 없습니다: ${asset}`)
    }
  }
}

const main = async () => {
  const version = await manifest()
  await rm(dist, { recursive: true, force: true })
  await mkdir(distAssets, { recursive: true })
  await cp(srcAssets, distAssets, { recursive: true })
  await buildInstallerBundle()
  await buildInstallScript(version)
  await buildLandingPage(version)
  const assets = await buildManifest(version)
  await verifyIntegrity(assets)
  console.log(`dist/ 생성 완료 — v${version}, ${assets.length} assets`)
  for (const asset of assets) console.log(`  ${asset}`)
}

await main()
