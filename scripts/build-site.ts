import { z } from "zod"
import { AGENT_IDS, CONTRACT_ASSET, RESULT_ASSET, RUNTIME_ASSET, parseAgentFile, permissionProbes, resolvePermission } from "../src/agent-contract.ts"
import { TaskContractSchema, TaskResultSchema } from "../src/runtime-contract.ts"
import { cp, mkdir, rm } from "node:fs/promises"
import { join } from "node:path"
import { exists, listFiles, sha256 } from "../src/fs.ts"
import { docPages, renderDoc } from "./site/docs.ts"
import { docPage, docsIndexPage, homePage, notFoundPage } from "./site/pages.ts"
import { siteCss } from "./site/theme.ts"

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

export const renderInstallScript = (version: string) => `#!/usr/bin/env bash
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

INTERACTIVE=false
if [ "$COMMAND" = "install" ] || [ "$COMMAND" = "upgrade" ]; then
  INTERACTIVE=true
  for arg in "$@"; do
    if [ "$arg" = "--no-interview" ]; then
      INTERACTIVE=false
      break
    fi
  done
fi

if [ "$INTERACTIVE" = true ]; then
  if [ -t 1 ]; then
    bun run "$TMP_DIR/oh-pencode.ts" "$COMMAND" --assets-dir "$TMP_DIR/assets" "$@" 0<&1
  elif [ -t 2 ]; then
    bun run "$TMP_DIR/oh-pencode.ts" "$COMMAND" --assets-dir "$TMP_DIR/assets" "$@" 0<&2
  else
    echo "대화형 설치에는 터미널이 필요합니다. 자동화에서는 --no-interview를 사용하세요." >&2
    exit 1
  fi
else
  bun run "$TMP_DIR/oh-pencode.ts" "$COMMAND" --assets-dir "$TMP_DIR/assets" "$@"
fi
`

const buildInstallScript = async (version: string) => {
  const script = renderInstallScript(version)
  await Bun.write(join(dist, "install.sh"), script)
}

const buildDocsPages = async () => {
  const sorted = [...docPages].sort((a, b) => a.order - b.order)
  await mkdir(join(dist, "docs"), { recursive: true })
  await mkdir(join(dist, "docs", "history"), { recursive: true })
  await Bun.write(join(dist, "site.css"), siteCss)
  await Bun.write(join(dist, "index.html"), homePage())
  await Bun.write(join(dist, "docs", "index.html"), docsIndexPage())
  await Bun.write(join(dist, "404.html"), notFoundPage())

  const written: string[] = ["index.html", "docs/index.html", "404.html"]
  for (const [index, doc] of sorted.entries()) {
    const rendered = await renderDoc(doc)
    const prev = sorted[index - 1]
    const next = sorted[index + 1]
    const up = "../".repeat(doc.href.split("/").length - 1)
    const html = docPage(doc, rendered, {
      ...(prev ? { prev: { href: `${up}${prev.href}`, title: prev.title } } : {}),
      ...(next ? { next: { href: `${up}${next.href}`, title: next.title } } : {}),
    })
    const target = join(dist, doc.href)
    await Bun.write(target, html)
    written.push(doc.href)
  }
  return written
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
      if (isBuiltin) continue
      const agentId = asset.split("/").at(-1)?.replace(/\.md$/, "") ?? ""
      const definition = parseAgentFile(content)
      if (!AGENT_IDS.some((id) => id === agentId)) throw new Error(`알 수 없는 agent: ${agentId}`)
      for (const probe of permissionProbes(agentId)) {
        if (resolvePermission(definition.permissions, probe.action, probe.resource) !== probe.expected)
          throw new Error(`권한 계약 위반: ${agentId} ${probe.resource}`)
      }
      if (agentId !== "pen" && !content.includes("## 공통 작업 계약")) throw new Error(`공통 계약 누락: ${agentId}`)

    }
  }
}

const main = async () => {
  const version = await manifest()
  await rm(dist, { recursive: true, force: true })
  await mkdir(distAssets, { recursive: true })
  await cp(srcAssets, distAssets, { recursive: true })
  await buildInstallerBundle()
  const runtime = await Bun.build({ entrypoints: [join(root, "src", "runtime-cli.ts")], target: "bun", format: "esm", outdir: join(distAssets, "oh-pencode"), naming: "runtime.js" })
  if (!runtime.success) throw new Error("runtime 번들 생성 실패")
  if (!(await exists(join(distAssets, RUNTIME_ASSET)))) throw new Error("runtime 번들 누락")
  await Bun.write(join(distAssets, CONTRACT_ASSET), JSON.stringify(z.toJSONSchema(TaskContractSchema), null, 2))
  await Bun.write(join(distAssets, RESULT_ASSET), JSON.stringify(z.toJSONSchema(TaskResultSchema), null, 2))
  await buildInstallScript(version)
  const pages = await buildDocsPages()
  const assets = await buildManifest(version)
  await verifyIntegrity(assets)
  console.log(`dist/ 생성 완료 — v${version}, ${assets.length} assets, ${pages.length} pages`)
  for (const asset of assets) console.log(`  ${asset}`)
}

if (import.meta.main) await main()
