# OpenCode native child 호출별 모델 검증

## 대상

- plugin: `src/opencode-plugin.ts`, `src/opencode-plugin-native-subagent.ts`
- 설치·검증: `src/install.ts`, `src/verify.ts`, `scripts/build-site.ts`
- 역할 계약: `assets/agents/pen.md`, `assets/agents/sub-pen.md`, `src/agent-contract.ts`
- 호환 runtime: `src/runtime.ts`, `src/runtime-transport.ts`, `src/runtime-result.ts`
- 안내: README, `docs/pen/*`, `docs/opencode/*`, `docs/acknowledge/decisions.md`

## 결과

OpenCode v2.0.15의 native `subagent`가 child session을 만들고, bundled plugin이 child prompt admission 전에 선택 모델을 적용하도록 전환했습니다. child는 실제 parent의 `parentID`를 가지므로 built-in subagent 목록에 표시됩니다. `pen_subagent`는 native 입력을 준비·검증할 뿐 별도 root session을 만들지 않습니다.

설치 검증은 manifest와 파일 해시, 실제 agent 등록·권한·기본 모델에 더해 `opencode plugin list`의 plugin ID와 설치 경로까지 확인합니다. 전문 역할은 `pen_subagent` 사용이 거부되고 메인 `pen`만 허용됩니다.

## 실행 결과

| 검사 | 결과 |
| --- | --- |
| `bun test` | 57 pass, 0 fail, 296 expect 호출, 9개 파일 |
| `bun run typecheck` | exit 0 |
| `bun run build:site` | exit 0, v0.3.0, 14 assets, 11 pages |
| `git diff --check` | 오류 없음 |
| `bun run src/cli.ts verify` | 검증 통과, plugin bundle 해시와 `oh-pencode.child-session` 활성 경로 확인 |
| 실제 native child smoke | DONE, 읽기 전용, 파일 변경 없음 |

최종 smoke child는 `ses_f30810ff8ffeguW96lKAtbTXcf`, parent는 `ses_f30812919ffeMqsT6Rfxj7aHW4`입니다. child session과 assistant 메시지 모두 `explore-pen` 및 `ollama-cloud/deepseek-v4.1-flash#max`였고, prompt 첫 이벤트에는 설치 기본값 `openai/gpt-5.6-luna#low`에서 지정 모델로 전환된 기록이 있습니다.

## 실패 경로와 보강

첫 smoke에서는 지정 모델이 적용된 child가 완료 조건 문자열을 바꿔 반환해 plugin이 `완료 조건이 누락되었습니다.`로 거부했습니다. 이후 Pen이 준비 도구 없이 같은 native 입력을 직접 재호출하면서 설치 기본 모델 child가 생성되는 우회 경로를 발견했습니다.

이를 다음 계약으로 막았습니다.

- 실패한 준비 호출 뒤에는 같은 parent에서 `pen_subagent`를 다시 호출하기 전 native 재시도를 거부합니다.
- 성공한 준비 입력은 다시 사용할 수 없습니다.
- 다른 계약의 일반 native 호출은 유지합니다.
- DONE 결과는 `acceptanceCriteria`, 검증 결과는 `checks.command`를 원문 그대로 반환하도록 child prompt에 명시합니다.

단위 테스트로 실패 후 무준비 재시도, 성공 입력 중복, 다른 입력 허용을 고정했고 최종 smoke는 재시도 없이 첫 native 호출에서 통과했습니다.

## 남은 경계

- `pen_subagent`는 Code Mode 도구이고 native `subagent`는 provider가 직접 노출하는 도구이므로 두 호출은 서로 다른 model step에서 실행됩니다.
- plugin은 child의 parent·agent·모델·구조화 결과를 검증하지만 모델이 보고한 셸 출력의 의미 전체를 독립적으로 증명하지는 않습니다. 메인은 중요한 변경에서 실제 diff와 검사 출력을 계속 확인해야 합니다.
- 호출별 모델은 OpenCode에 연결된 provider/model이어야 하며 사용할 수 없는 모델을 자동 대체하지 않습니다.
