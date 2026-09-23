# OpenCode V2 Agent 계약

> Source of truth: <https://opencode.ai/v2/docs/agents/>
> 검증 환경: OpenCode v2.0.10 (`opencode debug agents` 실측)
> V1 문서는 사용하지 않는다. V1과 V2는 필드 이름이 다르다.

---

## 1. V1 / V2 차이 (반드시 숙지)

| V1 | V2 | 비고 |
| --- | --- | --- |
| `agent` (단수 map) | `agents` | 복수형 |
| `prompt` | `system` | markdown은 body가 system |
| `disable` | `disabled` | |
| `permission` (tool별 map) | `permissions` (ordered array) | `{ action, resource, effect }` |
| `mode` map | `agents.<id>.mode` | |
| `variant` (별도 필드) | `model: provider/model#variant` | `#`로 결합 |
| `temperature`, `top_p`, `options` | `request.body` | V2 runner는 아직 전송하지 않음 |
| `maxSteps` | `steps` | |
| `bash` action | `shell` | |
| `task` action | `subagent` | |
| `write`, `patch` action | `edit` | write·patch·edit 통합 |

V2 문서는 "새 agent 설정에 legacy top-level 필드(`temperature`, `top_p`, `prompt`, `permission`, `tools`, `disable`, `maxSteps`)를 쓰지 말라"고 명시한다.

---

## 2. 유형과 모드

| Mode | 동작 |
| --- | --- |
| `primary` | 세션의 메인 agent. 사용자가 직접 대화 |
| `subagent` | `subagent` tool을 통한 child session에서만 실행 |
| `all` | 양쪽 모두 |

- 새 custom agent에서 `mode`를 생략하면 `primary`가 기본값이다.
- subagent는 fresh context를 가진 child session에서 foreground/background로 실행된다.
- 부모의 `subagent` 권한이 어떤 agent를 띄울 수 있는지 통제하고, child는 자기 permission을 쓴다.
- 기본 nesting depth는 1이다 (`experimental.subagent_depth`로 조정).

---

## 3. 기본 제공 agent

| Agent | Mode | 용도 |
| --- | --- | --- |
| `build` | primary | 기본 코딩 agent. tool 전부 허용, `.env`·외부 경로만 승인 |
| `plan` | primary | 편집 없이 탐색·계획. `~/.opencode/plan`만 쓰기 허용 |
| `general` | subagent | 조사·다단계 작업. subagent 실행 불가 |
| `explore` | subagent | 파일 탐색·읽기. 편집 불가 |
| `title` / `summary` / `compaction` | primary (hidden) | 시스템 maintenance. 선택 불가 |

- V2에는 built-in `scout` agent가 없다.
- 같은 ID로 config를 쓰면 built-in을 override한다.
- `disabled: true`로 built-in을 제거할 수 있다.

---

## 4. 정의 위치

```text
~/.config/opencode/agents/<name>.md     전역
.opencode/agents/<name>.md              프로젝트
```

- 프로젝트는 현재 디렉터리에서 프로젝트 root까지 `.opencode`를 탐색한다.
- 하위 경로는 agent ID에 포함된다: `.opencode/agents/team/reviewer.md` → `team/reviewer`
- V1의 `agent/`, `mode/`, `modes/` 디렉터리도 계속 발견된다. V2 권장은 `agents/`.

### Markdown frontmatter

frontmatter는 `agents` config entry와 같은 필드를 받고, body가 `system` prompt가 된다.

```md
---
description: Reviews changes for correctness and regressions
mode: subagent
model: anthropic/claude-sonnet-4-5#high
permissions:
  - action: edit
    resource: "*"
    effect: deny
  - action: shell
    resource: "*"
    effect: deny
---

Review the current changes. List findings in severity order with file and line references.
```

### JSONC

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "agents": {
    "reviewer": {
      "description": "Reviews current changes",
      "mode": "subagent",
      "system": "Report findings in severity order.",
      "permissions": [
        { "action": "edit", "resource": "*", "effect": "deny" },
      ],
    },
  },
}
```

---

## 5. 옵션 전체

| 옵션 | 설명 |
| --- | --- |
| `description` | agent 목적. subagent는 모델이 선택 근거로 보므로 필수 |
| `mode` | `primary` \| `subagent` \| `all` (기본 `primary`) |
| `model` | `provider/model` + optional `#variant`. JSON은 `{ providerID, model, variant }` 확장형도 가능 |
| `system` | 시스템 prompt. 비어있지 않으면 provider 기본 prompt를 **대체** |
| `permissions` | `{ action, resource, effect }` ordered array |
| `steps` | 최대 model step 수. 마지막 step에서 tool을 회수하고 요약을 요구 |
| `hidden` | 목록·자동완성·subagent 카탈로그에서 제거 (보안 기능 아님) |
| `color` | 6자리 hex |
| `disabled` | built-in/custom agent 제거 |
| `request` | `{ headers, body }` overlay. V2 runner는 아직 전송하지 않음 |

주의: `system`을 채우면 provider 기본 prompt가 대체된다. 프로젝트 지시·skill·reference·instruction은 그대로 추가된다.

---

## 6. 모델 선택 규칙

- subagent는 **자기 `model`이 있으면 그것을 쓰고, 없으면 부모 세션 모델을 상속**한다.
- 확장형: `{ "providerID": "anthropic", "model": "claude-sonnet-4-5", "variant": "high" }`
- 모델 selector 형식: provider는 첫 `/`까지, model은 추가 `/` 가능, variant는 `#` 뒤.
- provider/model ID는 **대소문자 구분**.
- root `model`은 variant를 보존하지 않는다. variant는 session·run·agent·command에서 지정한다.

### subagent tool 자체에는 model 파라미터가 없다

`subagent` tool 입력은 **agent ID, description, prompt (그리고 `background`)** 뿐이다. 따라서 native child 세션에서 호출별 모델을 지정할 수 없다. native child는 agent 정의의 `model`을 사용하고, 없으면 부모 모델을 상속한다.

설치 모델을 바꾸지 않는 호출별 선택은 별도 CLI 세션으로 실행한다:

```bash
opencode run --agent research-pen --model openai/gpt-5.6-terra#medium "완전한 조사 계약"
```

이는 native `subagent` 도구의 자식 세션이 아니므로 부모 문맥·완료 알림이 자동 전달되지 않는다. 메인이 작업 계약을 인자로 주고 결과를 회수한다. OpenCode v2.0.10 실측에서 설치된 `research-pen`은 Luna medium이었지만 위 호출의 새 세션 메타데이터는 `agent=research-pen`, `model=gpt-5.6-terra#medium`이었고 `parentID`는 없었다. 설치된 agent `.md`는 수정하지 않았다.

### 런타임 모델 변경 — 검증 결과 (v2.0.10)

| 대상 | 방법 | registry 반영 | 실제 세션 실행 모델 반영 |
| --- | --- | --- | --- |
| **subagent** | `agents/<id>.md`의 `model` 수정 | 반영됨 | **반영됨** (실측) |
| **subagent** | plugin `ctx.agent.transform` + `reload()` | 반영됨 | **반영되지 않음** (실측) |
| **primary** | `agents/<id>.md`의 `model` 수정 | 반영됨 | **반영되지 않음** (실측) |
| **primary** | root `opencode.jsonc`의 `model` | 반영됨 | **반영됨** (세션 기본값) |

실측 근거:

- `probe` subagent의 모델을 plugin transform으로 `definitely-not-a-real-model-xyz`로 바꾼 뒤 실행 → child session이 여전히 원래 모델(`gemma4:31b`)로 정상 실행됐다.
- 같은 subagent의 `model`을 markdown에서 `qwen3.5:397b`로 편집한 뒤 실행 → child session이 실제로 `qwen3.5:397b`를 사용함을 `session.hook("model.request")` 로그로 확인했다.
- primary `pen`의 `model`을 `ollama-cloud/mistral-large-3:675b`, `openai/gpt-5.6-sol#high` 등으로 바꿔도 세션은 root `model`(없으면 catalog 기본값 `opencode/jev-1.13-free`)로 실행됐다. `model.request` hook 로그의 `agent: "pen"` 항목은 항상 root/default 모델이었다.
- root `opencode.jsonc`의 `model`을 바꾸면 primary 세션 모델이 즉시 따라갔다.

**결론**:

- **native child의 지속적 모델 설정**은 agent `.md`의 `model:` 편집으로 동작한다. 작업별 선택에는 사용하지 않는다. 작업별 모델은 CLI `--agent`·`--model`로 별도 실행한다.
- **primary(pen) 자신의 모델**은 root `opencode.jsonc`의 `model`이 결정한다. agent 파일의 `model`은 primary 세션에 적용되지 않는다.
- V2 문서의 "session stores its selected model separately. Selecting a primary agent by ID does not change that model"이 이 동작을 설명한다.

### variant 전파

- subagent: `provider/model#variant`가 `model.request`의 `model.variant`로 그대로 전달된다 (`gemma4:31b` → `variant: "default"`처럼 provider 기본 variant가 붙는 경우가 있다).
- primary: agent 파일의 variant는 무시되고 root `model`의 값이 쓰인다. root `model`은 문서상 variant를 보존하지 않는다.

---

## 7. Permissions

```jsonc
{
  "permissions": [
    { "action": "*", "resource": "*", "effect": "deny" },
    { "action": "read", "resource": "src/**", "effect": "allow" },
  ],
}
```

| 필드 | 의미 |
| --- | --- |
| `action` | tool/permission action. wildcard 지원 |
| `resource` | path, command, agent ID 등. wildcard 지원 |
| `effect` | `allow` \| `ask` \| `deny` |

- **마지막으로 일치한 규칙이 이긴다.** 넓은 규칙을 앞에, 예외를 뒤에 둔다.
- 일치하는 규칙이 없으면 `ask`가 기본이다.
- 여러 resource를 검사하는 작업은 `deny` 하나라도 있으면 거부, 없으면 `ask` 하나라도 있으면 승인 요청.

### 주요 action

| action | resource |
| --- | --- |
| `read` | 정규화된 path (외부는 canonical absolute) |
| `edit` | `edit`·`write`·`patch` 대상 path |
| `glob` | 요청한 glob pattern |
| `grep` | 요청한 정규식 (검색 경로 아님) |
| `shell` | scanner가 만든 command string (복합 명령은 여러 개) |
| `subagent` | 대상 agent ID |
| `skill` | skill ID |
| `question` | `*` |
| `webfetch` | 요청 URL |
| `websearch` | 검색 query |
| `external_directory` | canonical 외부 디렉터리 경계 (`/*`로 끝남) |
| `<server>_<tool>` | MCP tool |
| `execute` | Code Mode 가용성 |

### 기본 정책 (모든 agent에 적용)

```jsonc
[
  { "action": "*", "resource": "*", "effect": "allow" },
  { "action": "external_directory", "resource": "*", "effect": "ask" },
  { "action": "read", "resource": "*.env", "effect": "ask" },
  { "action": "read", "resource": "*.env.*", "effect": "ask" },
  { "action": "read", "resource": "*.env.example", "effect": "allow" },
]
```

주의: `read *.env deny`는 **read tool 경로만 막는다.** shell(`cat .env` 등)을 통한 읽기는 `shell` 규칙이 없는 agent에서 차단되지 않는다 (전역 기본 `allow`). 시크릿 경계를 보려면 `shell` 규칙도 필요하다.

### 병합 동작 (실측으로 확인한 함정)

global `permissions`는 먼저 적용되고, agent별 규칙이 **뒤에 append**된다. `general`·`title`·`compaction` 같은 다른 agent에도 규칙이 붙는다.

따라서 전역 규칙이 의도치 않게 다른 agent를 제한하지 않도록, **agent 전용 규칙은 `agents.<id>.permissions`에 둔다.**

### shell 패턴

`"git status *"`는 `git status`와 `git status --short` 모두에 매칭된다. `resource`가 ` *`로 끝나면 인자 없는 명령도 포함한다.

oh-pen의 제한 역할은 `shell "*" deny` 뒤에 `pwd`, 파일 목록·검색·읽기와 Git 읽기 명령만 예외로 허용한다. `shell`은 운영체제 sandbox가 아니므로 `rg --pre`, Git external diff·output, 출력 리다이렉션은 예외 뒤에서 다시 거부한다. 메인 `pen`은 OpenCode 기본 shell 허용을 유지하고 파괴적 명령만 별도 ask·deny로 제한한다.

### 승인 저장

`ask`에서 **Allow always**를 선택하면 tool이 제안한 패턴이 프로젝트 스코프 `allow` 규칙으로 저장된다. 저장된 규칙은 `deny`를 덮어쓰지 못한다.

---

## 8. 에이전트 간 위임 (subagent tool)

- `subagent` tool: `agentID` + `description` + 완전한 `prompt`. `background: true`면 즉시 반환 후 완료 시 부모에게 알린다.
- 반환된 `sessionID`로 같은 child 대화를 이어갈 수 있다.
- `subagent` action으로 부모가 띄울 수 있는 agent를 통제한다.

```jsonc
{
  "agents": {
    "pen": {
      "permissions": [
        { "action": "subagent", "resource": "*", "effect": "deny" },
        { "action": "subagent", "resource": "sub-pen", "effect": "allow" },
      ],
    },
  },
}
```

`deny`이면 그 subagent는 Task tool 설명에서 완전히 제거되어 모델이 호출을 시도하지 않는다. 사용자는 `@` 자동완성으로 직접 호출할 수 있다.

---

## 9. 선택과 기본값

```jsonc
{
  "default_agent": "pen",
}
```

- 세션에 선택된 agent가 없을 때 쓰는 primary agent.
- 대상이 존재하고, visible하며, primary를 지원해야 한다. 아니면 `build` → 첫 visible primary 순으로 fallback.
- **이 설정은 이미 존재하는 세션의 agent를 바꾸지 않는다.**
- TUI에서 `<leader>a`(기본 `Ctrl+X` `A`)로 agent 목록, `Shift+Tab`으로 순환.

`hidden: true`는 목록·자동완성 가시성만 바꾼다. `default_agent`로 직접 지정하는 것은 여전히 가능하다 (실측 확인).

---

## 10. Agent 파일/설정 병합

- 설정 순서대로 merge된다. 뒤 scalar가 앞 scalar를 대체, request map은 key별 merge, permission 규칙은 append.
- global `permissions` → agent 규칙 순으로 적용되므로 agent 규칙으로 세분화할 수 있다.
- V2는 `mcp`·`compaction`·`experimental`에서만 V1/V2 혼합을 인정한다. **agent·provider·command·model entry는 한 형식으로 통일**해야 한다.

---

## 11. 실측으로 확인한 사실 (v2.0.10)

| 확인 항목 | 결과 |
| --- | --- |
| `agents.build.hidden: true` | `opencode debug agents`에서 `hidden: true` 확인 |
| `agents.plan.hidden: true` | 동일 |
| `default_agent: pen` | `pen`이 visible primary로 등록됨 |
| markdown frontmatter `permissions` (V2 array) | 정상 파싱되어 마지막 규칙으로 append됨 |
| markdown frontmatter `model: openai/gpt-5.6-sol#high` | `{ providerID: "openai", id: "gpt-5.6-sol", variant: "high" }`로 파싱 확인 |
| markdown body | `system`으로 반영 확인 |
| top-level `permissions` | `build`·`plan`·`general`·`title`·`compaction`·custom agent 전부에 append됨 (부작용) |
| `XDG_CONFIG_HOME` | 무시됨. config 경로는 `~/.config/opencode` 고정 |
| `opencode debug config` | 로드한 config source만 출력 (기본값 미출력) |

---

## 12. 관련 문서

- Permissions: <https://opencode.ai/v2/docs/permissions/>
- Config: <https://opencode.ai/v2/docs/config/>
- Tools (subagent tool): <https://opencode.ai/v2/docs/tools/>
- CLI run (`--agent`, `--model`): <https://opencode.ai/v2/docs/cli/commands/>
- Models / variants: <https://opencode.ai/v2/docs/models/>
- Instructions (AGENTS.md): <https://opencode.ai/v2/docs/instructions/>
- Skills: <https://opencode.ai/v2/docs/skills/>
- V1 → V2 migration: <https://opencode.ai/v2/docs/migrate-v1/>
