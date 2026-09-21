import { describe, expect, test } from "bun:test"
import { join } from "node:path"
import { renderInstallScript } from "./build-site.ts"

const penAsset = await Bun.file(join(import.meta.dir, "..", "assets", "agents", "pen.md")).text()

describe("install bootstrap", () => {
  const script = renderInstallScript("0.1.0")

  test("대화형 설치 입력을 제어 터미널로 연결한다", () => {
    expect(script).toContain('if [ "$INTERACTIVE" = true ]')
    expect(script).toContain('if [ -t 1 ]')
    expect(script).toContain('0<&1')
    expect(script).toContain('0<&2')
  })

  test("비대화형 설치는 터미널 없이 실행할 수 있다", () => {
    expect(script).toContain('if [ "$arg" = "--no-interview" ]')
    expect(script).toContain('INTERACTIVE=false')
  })
})

describe("pen 작업 시작 계약", () => {
  test("workflow와 모델을 실행 전에 함께 묻는다", () => {
    expect(penAsset).toContain("새 작업마다 실행 전에 아래 두 질문을 한 번에 제시하고 답을 기다린다")
    expect(penAsset).toContain("설치된 GPT 기본 배정 유지")
    expect(penAsset).toContain("pen 모델 상속")
    expect(penAsset).toContain("역할별 직접 지정")
  })

  test("답변 전 도구 실행과 자동 workflow 판단을 금지한다", () => {
    expect(penAsset).toContain("답을 받기 전에는 자동 주입된 지시와 상태를 확인하는 것 외에 조사·수정·검증 도구를 사용하지 않는다")
    expect(penAsset).not.toContain("별도 지정이 없으면 작업의 독립성·복잡도·검증 분리 필요성을 판단해 직접 수행하거나 서브에이전트를 자동 사용한다")
    expect(penAsset).not.toContain("매 작업마다 다시 묻지 않는다")
  })
})
