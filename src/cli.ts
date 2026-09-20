import { intro, log, outro, spinner } from "@clack/prompts"
import { join } from "node:path"
import { httpAssets, localAssets, verificationWarning, type AssetSource } from "./assets.ts"
import { readConfig, readDefaultAgent, readRootModel } from "./config.ts"
import { exists } from "./fs.ts"
import { install } from "./install.ts"
import { runInterview, type InstallAnswers } from "./interview.ts"
import { conventionModels } from "./models.ts"
import { configFile } from "./paths.ts"
import { uninstall } from "./uninstall.ts"
import { runVerify } from "./verify.ts"

type Command = "install" | "verify" | "uninstall" | "upgrade"

type Flags = {
  command: Command
  baseUrl: string | undefined
  assetsDir: string | undefined
  dryRun: boolean
  force: boolean
  noInterview: boolean
  noBackup: boolean
  models: string | undefined
  help: boolean
}

const defaultBaseUrl = "https://b-hs.github.io/oh-pen"

type RemoteManifest = {
  version?: string
  assets?: string[]
  sha256?: Record<string, string>
}

const parseFlags = (argv: string[]): Flags => {
  const commands: Command[] = ["install", "verify", "uninstall", "upgrade"]
  const found = argv.find((arg) => commands.includes(arg as Command))
  const valueOf = (name: string) => {
    const index = argv.indexOf(`--${name}`)
    return index === -1 ? undefined : argv[index + 1]
  }
  return {
    command: (found ?? "install") as Command,
    baseUrl: valueOf("base-url"),
    assetsDir: valueOf("assets-dir"),
    dryRun: argv.includes("--dry-run"),
    force: argv.includes("--force"),
    noInterview: argv.includes("--no-interview"),
    noBackup: argv.includes("--no-backup"),
    models: valueOf("models"),
    help: argv.includes("--help") || argv.includes("-h"),
  }
}

const printHelp = () => {
  intro("oh-pencode")
  log.info(
    [
      "oh-pencode install      pen 에이전트 세트를 ~/.config/opencode 에 설치",
      "oh-pencode verify       설치 상태를 검증",
      "oh-pencode uninstall    설치 제거",
      "oh-pencode upgrade      최신 에셋으로 갱신",
      "",
      "플래그:",
      "  --base-url <url>   에셋을 받을 위치 (기본: GitHub Pages)",
      "  --assets-dir <p>   로컬 assets 디렉터리를 직접 사용 (개발용)",
      "  --dry-run          파일을 쓰지 않고 계획만 출력",
      "  --force            사용자 수정 파일도 덮어씀",
      "  --no-interview     기본값으로 진행",
      "  --no-backup        백업 생략",
      "  --models <mode>    convention | inherit",
      "  --help             도움말",
    ].join("\n"),
  )
}

const resolveAssets = async (flags: Flags): Promise<{ assets: AssetSource; version: string; warnings: string[] }> => {
  if (flags.assetsDir) {
    return { assets: localAssets(flags.assetsDir), version: "local", warnings: [] }
  }
  const baseUrl = (flags.baseUrl ?? defaultBaseUrl).replace(/\/$/, "")
  if (baseUrl.startsWith("http://")) {
    throw new Error("http는 허용되지 않습니다. https 또는 로컬 경로만 허용합니다.")
  }
  if (baseUrl.startsWith(".") || baseUrl.startsWith("/") || baseUrl.startsWith("file:")) {
    const root = baseUrl.startsWith("file:") ? baseUrl.replace("file://", "") : baseUrl
    if (!(await exists(root))) {
      throw new Error(`로컬 에셋 경로가 없습니다: ${root}`)
    }
    const manifestPath = `${root}/manifest.json`
    if (await exists(manifestPath)) {
      const manifest = (await Bun.file(manifestPath).json()) as RemoteManifest
      const assetPaths = manifest.assets ?? []
      if (assetPaths.length === 0) {
        throw new Error("manifest에 에셋 목록이 없습니다.")
      }
      const source = localAssets(root, { assetPrefix: "assets", assets: assetPaths, sha256: manifest.sha256 })
      return { assets: source, version: manifest.version ?? "local", warnings: [verificationWarning(source.verification)].filter((line) => line !== undefined) }
    }
    const source = localAssets(root)
    return { assets: source, version: "local", warnings: [verificationWarning(source.verification)].filter((line) => line !== undefined) }
  }
  const manifestResponse = await fetch(`${baseUrl}/manifest.json`)
  if (!manifestResponse.ok) {
    throw new Error(
      `manifest를 받지 못했습니다 (HTTP ${manifestResponse.status}). --assets-dir 또는 --base-url 을 확인하세요.`,
    )
  }
  const manifest = (await manifestResponse.json()) as RemoteManifest
  const assetPaths = manifest.assets ?? []
  if (assetPaths.length === 0) {
    throw new Error("manifest에 에셋 목록이 없습니다.")
  }
  const source = httpAssets(baseUrl, assetPaths, manifest.sha256)
  return {
    assets: source,
    version: manifest.version ?? "unknown",
    warnings: [verificationWarning(source.verification)].filter((line) => line !== undefined),
  }
}

const printResult = (label: string, lines: string[], warnings: string[] = []) => {
  if (lines.length > 0) log.info([label, ...lines].join("\n"))
  for (const warning of warnings) log.warn(warning)
}

const noInterviewAnswers = (flags: Flags, context: { defaultAgent: string | undefined; rootModel: string | undefined }): InstallAnswers => {
  const mode = flags.models === "inherit" ? "inherit" : "convention"
  return {
    modelMode: mode,
    models: mode === "convention" ? { ...conventionModels } : {},
    rootModel: context.rootModel ?? conventionModels.pen,
    hideBuiltins: true,
    adoptDefaultAgent: true,
    currentDefaultAgent: context.defaultAgent,
    currentRootModel: context.rootModel,
  }
}

const main = async () => {
  const flags = parseFlags(process.argv.slice(2))
  if (flags.help) {
    printHelp()
    return
  }
  if (flags.command === "verify") {
    const spin = spinner()
    spin.start("검증 중")
    const result = await runVerify({ directory: process.cwd(), })
    spin.stop(result.ok ? "검증 통과" : "검증 실패")
    const checks = result.checks.map((check) => `${check.ok ? "ok  " : "FAIL"} ${check.name}: ${check.detail}`)
    log.info(
      ["검증 결과", ...checks].join("\n"),
    )
    if (!result.ok) process.exitCode = 1
    return
  }

  if (flags.command === "uninstall") {
    const result = await uninstall({ dryRun: flags.dryRun, force: flags.force })
    printResult(
      flags.dryRun ? "제거 계획 (dry-run)" : "제거 완료",
      [
        ...result.removed.map((path) => `제거: ${path}`),
        ...result.preserved.map((path) => `보존: ${path}`),
      ],
      result.warnings,
    )
    return
  }

  const { assets, version, warnings } = await resolveAssets(flags)
  const { value: currentConfig } = await readConfig(configFile())
  const currentDefaultAgent = readDefaultAgent(currentConfig)
  const currentRootModel = readRootModel(currentConfig)
  const context = { currentDefaultAgent, currentRootModel }

  const answers = flags.noInterview
    ? noInterviewAnswers(flags, { defaultAgent: currentDefaultAgent, rootModel: currentRootModel })
    : await runInterview(context)

  const result = await install({
    answers,
    assets,
    version,
    dryRun: flags.dryRun,
    force: flags.force,
    skipBackup: flags.noBackup,
  })

  printResult(
    flags.dryRun ? "설치 계획 (dry-run)" : "설치 완료",
    [
      ...warnings,
      ...result.wrote.map((path) => `쓰기: ${path}`),
      ...result.skipped.map((path) => `건너뜀: ${path}`),
      ...result.preserved.map((path) => `보존: ${path}`),
      ...result.configChanges.map(
        (change) => `설정: ${change.key} ${change.from ?? "(없음)"} → ${change.to ?? "(제거)"}`,
      ),
      ...(result.backups.length > 0 ? [`백업: ${result.backups.length}개 파일`] : []),
    ],
    result.warnings,
  )

  if (!flags.dryRun) {
    outro("설치했습니다. 새 OpenCode 세션에서 pen을 사용하세요.")
  }
}

await main().catch((error: unknown) => {
  log.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
