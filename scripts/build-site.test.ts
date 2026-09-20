import { describe, expect, test } from "bun:test"
import { renderInstallScript } from "./build-site.ts"

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
