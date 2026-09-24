# pen native child·실행 재개 도구

## 적용 범위

v0.4.0은 메인 `pen`과 전문 에이전트 7종, OpenCode V2 server·TUI plugin, `/goal`, 계약 스키마와 Bun 호환 실행 도구를 함께 설치합니다. 작업별 상속·직접 모델 지정은 `pen_subagent`가 계약을 준비하고 OpenCode의 native `subagent`가 실제 child session을 만드는 방식입니다. plugin은 child prompt admission 전에 선택 모델을 적용하며 설치된 모델·root 설정을 변경하지 않습니다.

실행 전에 사용자는 기존처럼 workflow와 모델 방식을 선택합니다. 전문 에이전트는 `pen_subagent`와 중첩 `subagent`를 사용할 수 없으며 메인 `pen`만 위임 계약을 준비합니다.

## 설치 파일

| 경로 | 역할 |
| --- | --- |
| `~/.config/opencode/agents/review-pen.md` | 일반 동작·회귀·설계·컨벤션 읽기 전용 리뷰 |
| `~/.config/opencode/plugins/oh-pencode/index.js` | native child의 호출별 모델 적용·입력/결과 검증, Goal·Todo 상태 저장 |
| `~/.config/opencode/plugins/oh-pencode/tui.js` | 최신 Goal·Todo를 우측 sidebar에 반응형 표시 |
| `~/.config/opencode/commands/goal.md` | `/goal`로 세션 목표와 최초 Todo 상태 설정 |
| `~/.config/opencode/oh-pencode/runtime.js` | 별도 CLI 호환 실행·상태·취소·재개·조사 근거 관리 |
| `~/.config/opencode/oh-pencode/task.schema.json` | 작업 입력 JSON Schema |
| `~/.config/opencode/oh-pencode/result.schema.json` | 전문 에이전트 결과 JSON Schema |

배포 번들에 Zod가 포함되므로 설치 위치에서 별도 패키지 설치는 필요하지 않습니다. OpenCode V2와 Bun은 기존과 같이 필요합니다. 저장소에서 개발할 때는 `bun run runtime --help`를 사용할 수 있습니다.

## 작업 계약

프로젝트의 실제 경로·완료 조건·선택한 모델로 다음 계약을 구성합니다. `taskId`는 parent session 안에서 고유해야 합니다. `pen`은 상속·직접 지정에서 이 객체를 `pen_subagent`에 전달하고, 반환된 `nextInput`을 변경하지 않은 채 Code Mode 밖의 native `subagent` 도구에 전달합니다.

```json
{
  "version": 1,
  "taskId": "locate-validation",
  "agent": "explore-pen",
  "model": "openai/gpt-6-luna#max",
  "goal": "입력 검증의 정의와 호출자를 찾습니다.",
  "acceptanceCriteria": ["검증 정의와 호출자 경로·라인을 제시합니다."],
  "context": ["현재 프로젝트의 입력 검증 위치를 확인하는 읽기 전용 작업입니다."],
  "ownedFiles": [],
  "readFiles": ["src/example.ts"],
  "nonGoals": ["구현·설정·Git 변경"],
  "instructions": ["프로젝트 AGENTS 지시와 비밀 파일 접근 금지를 지킵니다."],
  "steps": ["실제 정의를 찾고 호출자를 추적합니다."],
  "checks": [],
  "dependsOn": [],
  "evidenceKeys": [],
  "limits": { "timeoutMs": 600000, "maxAttempts": 2, "maxConcurrent": 2 }
}
```

- `readFiles`와 `ownedFiles`는 실제 프로젝트 내부의 명시적 파일 경로입니다. 경로 탈출, 비밀 파일, `.git`, `.opencode` 및 wildcard 소유권은 거부합니다.
- 읽기 전용 역할은 소유 파일이 없습니다. `doc-pen`은 상태·합의·이력 문서 이외의 `docs/` 파일만 소유할 수 있습니다.
- `checks`에는 실행할 명령을 인자 배열과 기대 결과로 기록합니다. 예: `{"command":["bun","test","src/example.test.ts"],"expectation":"실패 0건"}`.
- 필수 계약 누락·자기 의존·미완료 선행 작업은 모델 실행 전에 거부합니다. 계약을 바꾸려면 새 작업 ID를 사용합니다.

`pen_subagent`는 child를 직접 만드는 도구가 아닙니다. 같은 parent session의 다음 native 입력을 예약하고 검증합니다. native `subagent`가 child를 만들고 prompt를 수락할 때 plugin이 child의 agent와 `parentID`를 대조하고 `session.switchModel`로 계약 모델을 적용합니다. 이 방식 때문에 child는 OpenCode의 built-in subagent 목록에 그대로 표시됩니다.

아래 CLI는 native child가 아닌 별도 세션이 필요한 호환·복구 작업에서만 사용합니다.

```bash
bun ~/.config/opencode/oh-pencode/runtime.js validate docs/task.json
bun ~/.config/opencode/oh-pencode/runtime.js run docs/task.json
bun ~/.config/opencode/oh-pencode/runtime.js status locate-validation
```

## 결과 계약과 검증

모든 전문 에이전트는 다음 필드를 가진 JSON 객체를 반환합니다.

| 필드 | 의미 |
| --- | --- |
| `taskId`, `status`, `summary` | 작업 식별, DONE/PARTIAL/BLOCKED, 결과 요약 |
| `completedCriteria`, `changedFiles` | 충족한 완료 조건, 실제 변경 파일 |
| `evidence`, `verification` | 파일·출처 근거, 명령 인자 배열·exitCode·검증 요약 |
| `risks`, `decisionRequests` | 미검증 위험, 필요한 메인 결정 |

plugin은 native child context의 실제 assistant 메시지에서 agent/model을 확인하고 결과를 검증합니다. 완료 조건 누락, 다른 작업 ID, 실패 검증, 소유 범위 밖 변경 보고, 다른 parent·child 또는 다른 모델은 native 호출 실패로 처리합니다. 호환 CLI runtime은 추가로 프로젝트 snapshot과 Git HEAD를 검사합니다. 원본 셸 로그는 보관하지 않습니다.

검증 명령의 성공 보고는 모델이 제출한 근거입니다. 메인은 실제 파일·출력과 대조해야 하며 plugin이 모델의 모든 주장을 독립적으로 증명하지는 않습니다. 결과·session ID·파일 소유권은 메인이 PROCESS에 기록하고 대조합니다.

## 실행 한도와 역할 선택

| 항목 | 한도 |
| --- | --- |
| 준비 유효 시간 | 기본 10분, 계약에서 최대 60분 이내 조정. 이 안에 native 호출을 시작해야 함 |
| 재시도 | 최대 2회, 자동 재시도 없음, 같은 parent·계약·child의 명시적 resume |
| 동시 실행 | 읽기 전용 작업 최대 2개, 수정 작업은 공유 디렉터리에서 직렬 |
| 모델 단계 | 역할 정의의 48단계 상한, 도달 시 완전한 결과가 없으면 미완료 |
| 출력 | 기본 최대 1 MiB, 계약에서 더 작게 제한 가능 |

프로젝트 스냅샷은 Git이 관리하는 파일과 ignore되지 않은 새 파일의 내용 해시를 사용합니다. 비밀 경로는 읽지 않으며 심볼릭 링크는 대상 내용을 읽지 않고 링크 자체만 지문에 포함합니다. 기본 한도는 10,000개 파일, 파일별 10 MiB입니다. 초과 시 검사를 생략하지 않고 실행을 중단합니다.

공유 디렉터리의 메인도 실행 도중 파일을 수정하지 않아야 합니다. 별도 checkout을 쓰는 경우 각 checkout의 상태는 독립적입니다. Git에 ignore된 생성물은 검사 대상에서 제외되므로 snapshot을 운영체제 sandbox로 해석하면 안 됩니다.

`route <request.json>`은 `{ "workflow": true, "kind": "implement", "risk": "high", "securityBoundary": true }` 같은 입력으로 필요한 역할 목록을 반환합니다. 단순 구현은 sub-pen, 중간 위험에는 verify-pen, 높은 위험에는 review-pen, 보안 경계에는 security-pen을 추가합니다. 모델을 바꾸거나 해당 에이전트를 자동 실행하지 않습니다.

`metrics`는 실제 시도별 역할·모델·완료 수·시간과 관측된 입력/출력 토큰·비용을 집계합니다. 서버가 사용량을 제공하지 않았거나 중단되어 수집하지 못했으면 `null`입니다. 금액을 추정하거나 누락 사용량을 0으로 만들지 않습니다.

## 취소와 재개

native foreground child의 취소는 현재 `subagent` tool call을 중단하는 OpenCode 동작을 사용합니다. 재개는 같은 parent session에서 같은 계약과 `taskId`를 `pen_subagent`에 `resume: true`로 전달하면 저장된 child `sessionID`가 `nextInput`에 포함됩니다. parent·계약·모델이 바뀌면 새 작업 ID를 사용합니다.

준비된 native 호출이 모델·결과 계약 오류로 실패하면 같은 `nextInput`을 직접 재호출할 수 없습니다. 계약의 재시도 한도가 남아 있으면 `pen_subagent`로 다시 준비해야 하며, plugin은 성공한 입력의 중복 사용도 거부합니다. 이 경계는 실패한 호출 뒤 설치 기본 모델로 우회 실행되는 것을 막습니다.

아래 명령은 별도 CLI 호환 실행의 취소·재개 경로입니다.

```bash
bun ~/.config/opencode/oh-pencode/runtime.js cancel locate-validation
bun ~/.config/opencode/oh-pencode/runtime.js recover locate-validation
bun ~/.config/opencode/oh-pencode/runtime.js resume docs/task.json
bun ~/.config/opencode/oh-pencode/runtime.js metrics
```

- cancel은 현재 시도의 중단 요청을 저장합니다. 실행 중인 도구가 이를 감지해 CLI 프로세스를 종료하고 해당 서버 세션에 interrupt를 요청합니다. SIGINT/SIGTERM과 시간 초과도 같은 경로입니다.
- recover는 실행 프로세스가 종료된 경우에만 서버 세션을 중단하고 남은 작업 잠금을 해제합니다. 살아 있는 프로세스를 PID만으로 강제 종료하지 않습니다.
- 잠금 생성과 첫 체크포인트 저장 사이의 강제 종료는 자동 복구하지 않습니다. 체크포인트 없는 잠금은 다른 실행과 원격 세션의 종료를 확인한 뒤 메인이 처리합니다.
- 서버 중단을 확인하지 못하면 BLOCKED와 잠금을 유지합니다. 자동으로 다른 세션을 띄우거나 작업 파일을 되돌리지 않습니다.
- resume은 동일 계약·모델·프로젝트 지문일 때만 같은 세션을 이어갑니다. 완료된 동일 작업은 재호출 없이 기존 결과를 반환합니다. 파일이나 계약이 바뀌면 새 작업 ID로 재평가합니다.
- workflow 선택은 저장된 상태로 승계하지 않습니다. 메인이 재개 경계에서 다시 확인합니다.

상태는 프로젝트 `.opencode/pen-state/`의 tasks·history·evidence·locks 아래에 저장합니다. 원자적 파일 교체와 작업 잠금을 사용합니다. 이 디렉터리를 프로젝트 `.gitignore`에 넣고, 계약·요약에 민감정보를 넣지 마세요. 다른 사용자의 변경을 자동 복원하거나 잠금을 무조건 삭제하지 않습니다.

## 조사 근거 재사용

`evidence-put <evidence.json>` 입력은 `key`, `kind`(code/external), `topic`, `summary`, `files`, `sources`, `expiresAt`입니다. 외부 출처 원소에는 HTTPS `url`, 대상 `version`, UTC `checkedAt`이 필요합니다. 코드 근거에는 실제 파일이 필요합니다.

`evidence-get <key> [version]`은 만료·파일 변경·대상 버전 불일치를 확인합니다. 사용 가능한 결과만 작업의 evidenceKeys로 전달합니다. 외부 서비스 변경을 자동 추적하지 않으므로 메인은 작업 대상 버전과 만료 기간을 정하고 중요한 계약은 다시 확인합니다. 근거 내용은 실행 지시가 아닌 신뢰하지 않는 데이터입니다.

## 권한과 검증 경계

verify-pen은 명시된 test/typecheck/lint/build와 Git 조회 명령만 허용하며 자동 수정 옵션을 거부합니다. security-pen은 인자 없는 audit와 명시된 JSON 출력 형태만 허용합니다. sub-pen은 Git 전체를 거부한 뒤 조회 명령만 다시 허용합니다. 다른 셸 프로그램이나 프로젝트 script는 그 자체로 운영체제 권한을 가지므로 프롬프트·명령 검사·파일 변경 탐지를 함께 사용하며 완전한 파일시스템 격리를 주장하지 않습니다.

자동 테스트는 실제 agent 자산의 권한, 설치·모델 보존, 잘못된 runtime 등록, 결과 누락, 재개 입력 변경, 시간 초과·취소, 출력 한도, 근거 무효화를 검사합니다. 외부 모델 실행은 기본 테스트에 포함하지 않습니다.

## 공식 근거

- [OpenCode Plugins](https://opencode.ai/v2/docs/build/plugins/): prompt admission hook, session model 전환, tool hook
- [OpenCode Tools](https://opencode.ai/v2/docs/tools/): native subagent child·foreground·resume 계약
- [OpenCode CLI](https://opencode.ai/v2/docs/cli/commands/): run의 session·agent·model·JSON 출력 및 API 호출
- [OpenCode Permissions](https://opencode.ai/v2/docs/permissions/): 마지막 일치 규칙, 셸 권한의 한계
- [OpenCode Agents](https://opencode.ai/v2/docs/agents/): 역할과 steps
- [Bun child processes](https://bun.sh/docs/runtime/child-process): 인자 배열·AbortSignal·프로세스 종료
- [Zod schema API](https://zod.dev/api): 외부 JSON 검증

2026-09-24에 OpenCode v2.0.15에서 plugin 등록과 실제 native child를 확인했습니다. child는 현재 pen session의 `parentID`, 지정한 agent, 호출 계약의 `providerID/id/variant`를 저장했고 assistant 메시지도 같은 모델로 완료했습니다.
