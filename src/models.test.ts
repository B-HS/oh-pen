import { describe, expect, test } from "bun:test"

import { sha256 } from "./fs.ts"
import { hasOnlyModelOverride, isValidModelRef, modelProfiles, readModelLine, writeModelLine } from "./models.ts"

const AGENT_WITHOUT_MODEL = `---
description: test agent
mode: subagent
---

Test body.
`

describe("agent 모델 참조", () => {
  test("Codex와 Claude 기본 프로필을 역할에 맞게 배정한다", () => {
    expect(modelProfiles.codex.pen).toBe("openai/gpt-6-sol#xhigh")
    expect(modelProfiles.codex["sub-pen"]).toBe("openai/gpt-6-luna#max")
    expect(modelProfiles.claude.pen).toBe("anthropic/claude-opus-5-5#high")
    expect(modelProfiles.claude["sub-pen"]).toBe("anthropic/claude-sonnet-5#xhigh")
  })
  test("연결 가능한 provider/model 형식을 허용한다", () => {
    expect(isValidModelRef("anthropic/claude-sonnet-4-6#high")).toBe(true)
    expect(isValidModelRef("openrouter/vendor/model#fast")).toBe(true)
    expect(isValidModelRef("provider/model")).toBe(true)
  })

  test("불완전한 모델 참조를 거부한다", () => {
    expect(isValidModelRef("model-only")).toBe(false)
    expect(isValidModelRef("provider/#high")).toBe(false)
    expect(isValidModelRef("provider/model#")).toBe(false)
  })
})

describe("agent 모델 override", () => {
  test("model 줄을 추가하고 제거해 원문을 복원한다", () => {
    const overridden = writeModelLine(AGENT_WITHOUT_MODEL, "anthropic/claude-sonnet-4-6#high")

    expect(readModelLine(overridden)).toBe("anthropic/claude-sonnet-4-6#high")
    expect(writeModelLine(overridden, undefined)).toBe(AGENT_WITHOUT_MODEL)
    expect(hasOnlyModelOverride(overridden, sha256(AGENT_WITHOUT_MODEL))).toBe(true)
  })

  test("본문 변경은 model 전용 override로 보지 않는다", () => {
    const changedBody = writeModelLine(AGENT_WITHOUT_MODEL.replace("Test body.", "Changed body."), "provider/model")

    expect(hasOnlyModelOverride(changedBody, sha256(AGENT_WITHOUT_MODEL))).toBe(false)
  })

  test("model 줄 제거를 inherit override로 판정한다", () => {
    const installed = writeModelLine(AGENT_WITHOUT_MODEL, "provider/model")
    const inherited = writeModelLine(installed, undefined)

    expect(readModelLine(inherited)).toBeUndefined()
    expect(hasOnlyModelOverride(inherited, sha256(AGENT_WITHOUT_MODEL))).toBe(true)
  })
})
