# pen 에이전트 세트 설계

> OpenCode V2 기준. `docs/opencode/v2-agents.md`의 계약을 전제로 한다.
> 검증 환경: OpenCode v2.0.10.

---

## 1. 목표

1. **pen 단독 사용** — TUI에서 `build`/`plan`을 숨기고 `pen`만 primary로 노출한다.
2. **auto-mode** — 권한 승인을 묻지 않고 자동 승인한다. `deny` 규칙(시크릿·범위 밖)은 그대로 차단된다.
3. **workflow 위임** — pen이 작업을 분해해 서브에이전트에 위임한다. subagent마다 모델이 다르다.
4. **매 작업 시작 시 모델 질문** — 새 세션/작업이 시작되면 workflow 사용 여부와 함께 에이전트별 모델을 묻고, 그 결과를 반영해 기동한다.
5. **sub-pen** — pen 전용 실행자. 권한은 pen과 동일. 프롬프트를 상세히 주입받아야 기동한다. 지시가 모호하면 메인 pen에게 되묻는다.
6. **research-pen / explore-pen / doc-pen** — 조사·탐색·문서 심층 읽기 전용.
7. **확장 가능** — 사용자가 subagent를 추가하고 모델·권한을 정의할 수 있다.

---

## 2. 에이전트 세트

| ID | mode | 역할 | 권한 (pen 대비) |
| --- | --- | --- | --- |
| `pen` | primary | 오케스트레이터. 요구 해석·분해·통합·검증 근거·Git | 전체 허용, `question` 허용, subagent 호출 허용 |
| `sub-pen` | subagent | 실행자. 상세 작업 계약을 받아 구현·검증 | pen과 동일. 단 subagent 호출 불가 |
| `research-pen` | subagent | 기획·조사. 구현 전 사실·제약·선행 조건 | 읽기·검색·web. 편집 불가 |
| `explore-pen` | subagent | 코드베이스 탐색. 패턴·심볼·구조 | 읽기·검색만. 편집·web 불가 |
| `doc-pen` | subagent | 외부 문서 심층 분석. 공식 스펙·API 계약 | 읽기·검색·web + 외부 문서 경로 읽기 |
| `verify-pen` | subagent | 독립 검증. 변경 위험을 직접 덮는 최소 검증 실행 | 읽기·검색·shell(검증 명령 한정) |
| `security-pen` | subagent | 보안 감사. 시크릿·인증·injection·의존성 | 읽기·검색·web. 편집 불가 |

- `pen`을 제외한 모두 `mode: subagent`.
- **모든 `*-pen`은 visible** (사용자 결정). `@` mention과 자동완성에 노출된다.
- 사용자가 자기 subagent를 추가할 수 있도록 이름 규칙을 권장한다: `*-pen`.

### build/plan 숨김

`agents/build.md`, `agents/plan.md`를 만들고 body를 비운다.

```md
---
description: Hidden built-in (replaced by pen)
hidden: true
---
```

- markdown 방식은 `opencode.jsonc`를 수정하지 않아 사용자 설정과 충돌하지 않는다 (실측 확인).
- built-in build를 override하므로 `system`이 빈 문자열이 된다. pen 세트에서 build는 쓰지 않으므로 문제없다.
- uninstall이 이 파일을 지우면 원래 build/plan이 복구된다.

---

## 3. 모델 배정 — 매 작업 시작 시 질문

### 흐름

```text
세션 시작
  └─ pen이 작업을 받음
       └─ 작업 시작 전 1회 질문 (한 번에 모아서):
            Q1. 이번 작업을 다중 에이전트 workflow로 진행할까요?
                A. 사용  B. 사용하지 않음
            Q2. 에이전트 모델을 어떻게 할까요?
                A. 컨벤션 배정 (ai-process.md §1.2 Codex 표)
                B. 직접 지정 → 에이전트별 provider/model#variant 입력
         └─ 선택을 agent 정의에 반영
              └─ 위임 실행
```

- 컨벤션 `ai-process.md` §3.1 및 §1.1에 따라 **새 세션·resume·clear·compact·handoff·PROCESS 재개마다 다시 묻는다.** 이전 선택을 승계하지 않는다.
- Q1과 Q2는 **같은 질문 묶음**으로 한 번에 제시한다.
- 선택은 그 작업에만 유효하다. 장기 기본값으로 저장하지 않는다.

### 컨벤션 배정 (기본안)

`ai-process.md` §1.2의 Codex 표를 pen 세트에 대응시킨다.

| pen 역할 | 컨벤션 대응 | 컨벤션 기본값 |
| --- | --- | --- |
| `pen` (메인, 모호한 다단계·고위험 통합) | Sol high | `openai/gpt-5.6-sol#high` |
| `pen` (범위가 분명한 조율) | Terra medium | `openai/gpt-5.6-terra#medium` |
| `sub-pen` (분석·일반 구현) | Terra medium | `openai/gpt-5.6-terra#medium` |
| `sub-pen` (복잡한 구현·보안 판단) | Terra high | `openai/gpt-5.6-terra#high` |
| `research-pen` (좁고 반복적 조사) | Luna low | `openai/gpt-5.6-luna#low` |
| `research-pen` (일반 조사) | Luna medium | `openai/gpt-5.6-luna#medium` |
| `explore-pen` (기계적 탐색) | Luna low | `openai/gpt-5.6-luna#low` |
| `doc-pen` (문서 심층 분석) | Luna high | `openai/gpt-5.6-luna#high` |
| `verify-pen` (기계 검증) | Luna medium | `openai/gpt-5.6-luna#medium` |
| `security-pen` (어려운 판정) | Luna high 이상 | `openai/gpt-5.6-luna#high` |

### 모델을 바꾸는 방법 (실측 결과)

| 대상 | 방법 | 실제 세션 실행 반영 |
| --- | --- | --- |
| subagent | `~/.config/opencode/agents/<id>.md`의 `model:` 수정 | **반영됨** |
| subagent | plugin `ctx.agent.transform` + `reload()` | 반영 안 됨 |
| primary (pen) | `agents/pen.md`의 `model:` 수정 | **반영 안 됨** |
| primary (pen) | `opencode.jsonc`의 root `model` 수정 | **반영됨** |

→ **pen이 subagent 모델을 바꾸려면 agent `.md`의 `model:` 줄을 `edit` tool로 수정한다.** OpenCode는 설정 파일 변경을 감지해 다음 model 요청부터 반영한다.
→ **pen 자신의 모델은 root `opencode.jsonc`의 `model`이 결정한다.** agent 파일의 `model`은 primary 세션에 적용되지 않는다.

### 모델 확정 절차

1. pen이 Q2 답을 받는다.
2. 지정 모드면 각 agent의 `model:` 줄을 갱신한다.
   - subagent: 해당 `.md`의 `model:` 줄
   - pen 자신: `opencode.jsonc`의 root `model`
3. 반영 확인: `opencode debug agents` (subagent 등록 상태) 또는 `opencode reload`.
4. 위임 시작.

주의: `.md` 파일을 수정하면 파일 해시가 manifest와 달라진다. installer의 `upgrade`는 **사용자가 바꾼 model 줄을 보존**하고 나머지만 갱신해야 한다.

주의: pen asset의 `permissions`에 `edit: ~/.config/opencode/agents/*`와 `external_directory: ~/.config/opencode/*`가 허용되어 있어야 pen이 자기 에이전트 파일의 모델을 바꿀 수 있다.

---

## 4. pen의 동작 (auto-mode)

### auto-mode 정의

- **권한 승인을 묻지 않는다.** `ask`가 발생할 상황을 pen 세트에서는 `allow`로 두거나, 세션에 `--auto`를 쓴다.
- **`deny`는 그대로 유지된다** — 시크릿(`.env`), 외부 디렉토리 경계, `git push` 같은 위험 명령.
- 자동 승인해도 **되돌릴 수 있게** 남긴다: 스냅샷(`snapshots` 기본 on), `git diff` 검토, 커밋 단위 분리.

### 권한 설계

| action | pen | sub-pen | research-pen | explore-pen | doc-pen | verify-pen | security-pen |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `read` | allow | allow | allow | allow | allow | allow | allow |
| `glob`/`grep` | allow | allow | allow | allow | allow | allow | allow |
| `edit` | allow | allow | deny | deny | deny | deny | deny |
| `shell` | allow | allow | deny | deny | deny | allow(검증) | deny |
| `webfetch`/`websearch` | allow | allow | allow | deny | allow | deny | allow |
| `subagent` | allow `*-pen` | deny | deny | deny | deny | deny | deny |
| `question` | allow | deny | deny | deny | deny | deny | deny |
| `external_directory` | ask | ask | ask | ask | allow(문서 경로) | ask | ask |
| `read *.env*` | deny | deny | deny | deny | deny | deny | deny |

- `deny`는 사용자가 명시적으로 허용하지 않는 한 유지한다.
- `sub-pen`이 `question`을 deny하는 이유: 부모에게 물어야 하는 구조이므로 사용자에게 직접 묻지 않는다. (`agent`의 `question` deny는 사용자에게 프롬프트를 띄우지 못하게 한다.)

### sub-pen의 보고 규약

`sub-pen`은 지시가 모호하면 **추측하지 않고** 다음 형식으로 반환한다.

```text
## BLOCKED — 추가 정보 필요
- 모호한 지점: <구체적 문장>
- 필요한 결정: <선택지 또는 필요한 사실>
- 추측 시 위험: <잘못 가정하면 무엇이 깨지는가>
- 현재까지 확인한 근거: <파일:라인>
```

pen은 이 보고를 받으면 **사용자에게 묻지 않고** 자기 컨텍스트로 결정하거나, 사용자 결정이 필요하면 그때 `question` tool로 한 번에 모은다.

---

## 5. workflow (서브에이전트 위임)

### pen의 위임 절차

1. **요구 분해** — 작업을 독립 단위로 나눈다.
2. **소유권 결정** — 각 단위의 파일·디렉토리를 배정한다. 같은 파일을 두 서브에이전트가 동시에 만지지 않는다.
3. **의존성 정렬** — 독립은 병렬, 선행 필요는 직렬.
4. **모델·에이전트 선택** — 작업 성격에 맞는 `*-pen`을 고른다 (모델은 이미 확정됨).
5. **상세 계약 주입** — `ai-process.md` §1.2의 9개 항목을 생략 없이 prompt에 넣는다.
6. **실행** — `subagent` tool. 독립 작업은 `background: true`로 병렬.
7. **통합 검증** — 결과를 실제 diff·파일·명령 출력으로 점검.
8. **Git** — 논리 단위별 커밋·푸시 (pen 전담).

### 위임 계약 (prompt에 반드시 포함)

`ai-process.md` §1.2의 9개 항목:

1. 목표와 완료 조건
2. 확인된 근거 (파일·심볼·문서 링크)
3. 소유 범위와 비목표
4. 적용 규칙 (`AGENTS.md`·컨벤션·Skill)
5. 실행 순서
6. 엣지 케이스와 금지 사항
7. 검증 계약 (최소 명령, 성공 기준, 재사용 조건)
8. 결과 보고 형식
9. 통합 계약 (병렬/직렬, 대기 조건)

### 격리 방식

- **파일 소유권**으로 격리한다. 서브에이전트마다 수정 가능 파일을 명시한다.
- git worktree는 쓰지 않는다 (사용자 정정: worktree가 아니라 workflow).
- 여러 서브에이전트가 같은 파일을 만져야 하면 **직렬로 실행**하고 중간 결과를 확인한다.

### 병렬 실행 한도

- OpenCode 기본 `experimental.subagent_depth`는 1이다. 즉 **sub-pen이 다시 subagent를 부를 수 없다.**
- pen이 여러 `*-pen`을 동시에 `background: true`로 띄우는 방식으로 병렬화한다.
- 동시 실행 개수는 사용자 config 또는 pen 판단으로 제한한다.

---

## 6. 사용자 확장 방법

사용자가 subagent를 추가하려면:

```md
---
description: 무슨 작업을 언제 맡기는지 (모델이 선택 근거로 읽는다)
mode: subagent
model: <provider>/<model>#<variant>
permissions:
  - action: edit
    resource: "*"
    effect: deny
---
시스템 프롬프트. 작업 원칙·보고 형식·금지 사항.
```

그리고 pen의 `subagent` 허용 목록에 추가한다.

```yaml
permissions:
  - action: subagent
    resource: "*"
    effect: deny
  - action: subagent
    resource: "sub-pen"
    effect: allow
  - action: subagent
    resource: "research-pen"
    effect: allow
  - action: subagent
    resource: "*-pen"      # 사용자 추가분
    effect: allow
```

`*-pen` glob을 pen 허용 목록에 넣으면 사용자가 추가한 `*-pen`도 자동으로 허용된다.

---

## 7. 검증된 제약 (실측)

| 제약 | 영향 |
| --- | --- |
| subagent tool에 model 파라미터 없음 | 모델은 agent 정의에 고정. 런타임 변경은 `.md` 편집 |
| plugin `agent.transform`은 실행 모델에 미반영 | 모델 선택을 plugin으로 구현하지 않는다 |
| `XDG_CONFIG_HOME` 무시 | `~/.config/opencode` 고정 경로 |
| top-level `permissions`는 전 agent에 append | `agents.<id>.permissions`만 사용 |
| built-in `mode` map 없음 | `agents.<id>.mode` |
| agent entry는 V1/V2 혼합 불가 | 전부 V2 native 형식 |
| `default_agent`는 기존 세션을 바꾸지 않음 | 새 세션에만 적용 |
| `title`/`summary`/`compaction`은 hidden 시스템 agent | 설정하지 않는다 |
| V2에 built-in `scout` 없음 | `doc-pen`이 그 역할을 대체 |
