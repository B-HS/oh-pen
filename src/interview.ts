import { cancel, confirm, group, intro, isCancel, log, select, text } from "@clack/prompts"
import { conventionModels, isValidModelRef, type AgentModels, type ModelMode } from "./models.ts"

export type InstallAnswers = {
  modelMode: ModelMode
  models: AgentModels
  /** pen 자신의 모델. primary 세션 모델은 root `model`이 결정한다 (실측). */
  rootModel: string | undefined
  hideBuiltins: boolean
  adoptDefaultAgent: boolean
  currentDefaultAgent: string | undefined
  currentRootModel: string | undefined
}

const modelEntries = Object.entries(conventionModels)

const requireValue = <T>(value: T | symbol): T => {
  if (isCancel(value)) {
    cancel("설치를 취소했습니다.")
    process.exit(0)
  }
  return value as T
}

const askModel = async (message: string, fallback: string) => {
  const value = requireValue(
    await text({
      message,
      placeholder: fallback,
      defaultValue: fallback,
      validate: (input) => {
        const candidate = input && input.length > 0 ? input : fallback
        return isValidModelRef(candidate) ? undefined : "형식: provider/model 또는 provider/model#variant"
      },
    }),
  )
  return (value as string) && (value as string).length > 0 ? (value as string) : fallback
}

export const runInterview = async (context: {
  currentDefaultAgent: string | undefined
  currentRootModel: string | undefined
}): Promise<InstallAnswers> => {
  intro("oh-pencode installer")
  log.info(
    [
      "pen 에이전트 세트를 설치합니다.",
      "위치: ~/.config/opencode/",
      "기존 설정은 먼저 백업합니다.",
    ].join("\n"),
  )

  const base = await group(
    {
      modelMode: () =>
        select({
          message: "모델 배정 방식을 선택하세요.",
          options: [
            {
              value: "convention" as const,
              label: "컨벤션 기본값",
              hint: "Sol/Terra/Luna",
            },
            { value: "inherit" as const, label: "부모 모델 상속" },
            { value: "custom" as const, label: "직접 지정" },
          ],
          initialValue: "convention" as const,
        }),
      hideBuiltins: () =>
        confirm({
          message: "build / plan 에이전트를 숨길까요?",
          initialValue: true,
          active: "숨김",
          inactive: "그대로 둠",
        }),
      adoptDefaultAgent: () =>
        confirm({
          message:
            context.currentDefaultAgent && context.currentDefaultAgent !== "pen"
              ? `default_agent 를 pen 으로 바꿀까요? (현재: ${context.currentDefaultAgent})`
              : "default_agent 를 pen 으로 설정할까요?",
          initialValue: true,
          active: "설정",
          inactive: "유지",
        }),
    },
    {
      onCancel: () => {
        cancel("설치를 취소했습니다.")
        process.exit(0)
      },
    },
  )

  const modelMode = base.modelMode as ModelMode
  const models: AgentModels = {}

  if (modelMode === "convention") {
    Object.assign(models, conventionModels)
  }

  if (modelMode === "custom") {
    for (const [agent, fallback] of modelEntries) {
      models[agent] = await askModel(`${agent} 모델 (provider/model#variant)`, fallback)
    }
  }

  const rootModelFallback = models.pen ?? "openai/gpt-5.6-sol#high"
  const rootModel = await askModel(
    "pen 의 세션 모델 (root model — primary 세션에 실제 적용되는 값)",
    context.currentRootModel ?? rootModelFallback,
  )

  const summary = modelEntries.map(([agent]) => `  ${agent.padEnd(14)} ${models[agent] ?? "(상속)"}`).join("\n")

  log.info(
    [
      "설치 요약",
      `모델: ${modelMode === "convention" ? "컨벤션 배정" : modelMode === "inherit" ? "부모 상속" : "직접 지정"}`,
      summary,
      `pen 세션 모델 (root): ${rootModel}`,
      `build/plan 숨김: ${base.hideBuiltins ? "예" : "아니오"}`,
      `default_agent: ${base.adoptDefaultAgent ? "pen" : "유지"}`,
    ].join("\n"),
  )

  const ok = requireValue(await confirm({ message: "이대로 설치할까요?", initialValue: true }))
  if (!ok) {
    cancel("설치를 취소했습니다.")
    process.exit(0)
  }

  log.info("설치를 시작합니다.")
  return {
    modelMode,
    models,
    rootModel,
    hideBuiltins: base.hideBuiltins as boolean,
    adoptDefaultAgent: base.adoptDefaultAgent as boolean,
    currentDefaultAgent: context.currentDefaultAgent,
    currentRootModel: context.currentRootModel,
  }
}
