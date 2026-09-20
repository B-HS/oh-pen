# OpenCode V2 설치 지점 (install surface)

> installer가 실제로 건드리는 파일·디렉터리와 그 이유.
> 검증 환경: OpenCode v2.0.10, macOS.
> Source: <https://opencode.ai/v2/docs/config/>, <https://opencode.ai/v2/docs/agents/>, <https://opencode.ai/v2/docs/instructions/>

---

## 1. 경로

| 항목 | 경로 | 실측 |
| --- | --- | --- |
| config (전역) | `~/.config/opencode/opencode.json(c)` | `opencode debug config`로 확인 |
| agents (전역) | `~/.config/opencode/agents/<name>.md` | 확인 |
| instructions (전역) | `~/.config/opencode/AGENTS.md` | 문서 기준 |
| skills (전역) | `~/.config/opencode/skills/<id>/SKILL.md` | 문서 기준 |
| data | `~/.local/share/opencode` | `opencode debug paths` |
| cache | `~/.cache/opencode` | 동일 |
| state | `~/.local/state/opencode` | 동일 |
| log | `~/.local/share/opencode/log` | 동일 |
| repos (references) | `~/.local/share/opencode/repos` | 동일 |

### XDG_CONFIG_HOME은 무시된다 (실측)

`XDG_CONFIG_HOME=/tmp/... opencode debug config`를 실행해도 config 경로는 `/Users/<user>/.config/opencode`로 고정됐다. installer는 `~/.config/opencode`를 직접 쓴다.

### 프로젝트 측 (참고, 이 installer는 전역만 지원)

```text
<project>/opencode.json(c)
<project>/.opencode/opencode.json(c)     ← .opencode가 direct config를 덮는다
<project>/.opencode/agents/<name>.md
<project>/AGENTS.md
```

탐색은 현재 디렉터리에서 파일시스템 root까지 올라가며, direct config를 먼저(먼 곳 → 가까운 곳), 그다음 `.opencode` config를 같은 순서로 merge한다. **모든 `.opencode` config가 모든 direct config를 덮는다.**

---

## 2. 우선순위

낮음 → 높음:

1. `~/.config/opencode/opencode.json(c)` (전역)
2. 조상 디렉터리 direct `opencode.json(c)`
3. 현재 디렉터리 direct `opencode.json(c)`
4. `.opencode/opencode.json(c)` (먼 곳 → 가까운 곳)

- 서로 충돌하지 않는 설정은 보존된다.
- **`.opencode` config는 프로젝트에서 전역을 이긴다.** 따라서 전역에 설치한 pen 세트는 프로젝트가 `default_agent`나 `agents`를 덮으면 그 프로젝트에서 바뀔 수 있다.
- agent 정의 merge 규칙: 뒤 scalar가 앞 scalar를 대체, request map은 key별 merge, **permission 규칙은 append**.
- V2는 `mcp`·`compaction`·`experimental`에서만 V1/V2 혼합을 허용한다. **agent entry는 한 형식으로 통일**해야 한다.

---

## 3. installer가 쓰는 파일

전역 설치만 지원하므로 `~/.config/opencode/` 아래의 agents 디렉터리·config·oh-pencode 관리 디렉터리만 쓴다.

```text
~/.config/opencode/opencode.jsonc
~/.config/opencode/agents/pen.md
~/.config/opencode/agents/sub-pen.md
~/.config/opencode/agents/research-pen.md
~/.config/opencode/agents/explore-pen.md
~/.config/opencode/agents/doc-pen.md
~/.config/opencode/agents/verify-pen.md
~/.config/opencode/agents/security-pen.md
~/.config/opencode/agents/build.md          (hidden)
~/.config/opencode/agents/plan.md           (hidden)
~/.config/opencode/oh-pencode/manifest.json
```

총 9개 agent 파일(7 pen + build/plan hidden) + config + manifest다.

### 설정 병합 방식

installer는 `opencode.jsonc`를 **통째로 덮어쓰지 않는다.** 다음을 지킨다.

1. 기존 파일을 읽는다 (없으면 `{ "$schema": "..." }`로 시작).
2. JSONC 주석·trailing comma를 보존해야 하므로 **`Bun.JSONC.parse`만으로는 부족**하다. installer는 다음 중 하나를 택한다.
   - (권장) `opencode.jsonc`는 installer가 관리하는 **pen 블록만** 별도 파일로 두지 않고, JSONC를 파싱 → merge → `Bun.JSON.stringify`로 재직렬화하되 원본을 백업하고 사용자에게 "주석이 사라질 수 있음"을 고지한다.
   - (대안) 사용자가 이미 관리 중인 설정과 충돌하지 않도록 `--dry-run`에서 diff를 보여주고 승인받은 뒤에만 쓴다.

   실제 구현(A2): 파싱 → merge → `JSON.stringify(value, null, 2)` 재직렬화를 쓴다. **주석·trailing comma는 소실되며**, 쓰기 전에 원본을 백업하고 소실 고지를 1줄 출력한다 (src/config.ts `writeConfig`).
3. merge 대상 키는 `default_agent`, `model` (src/config.ts `managedConfigKeys`)뿐이다. **사용자의 다른 키는 그대로 둔다.**
4. 기존 `default_agent`가 pen이 아니면 인터뷰에서 확인 질문을 한다 (`--no-interview`면 pen으로 설정한다).
5. 백업은 `~/.config/opencode/oh-pencode/backup/<timestamp>/`에 둔다 (src/paths.ts `backupDir`).

### 멱등성

- agents/`*.md`는 installer가 관리하는 파일이므로 재실행 시 전체 재생성한다.
- 사용자가 그 파일을 수정했을 수 있으므로 **해시를 manifest에 기록**하고, 다르면 확인 없이 자동 보존하고 경고만 출력한다 (`--force`면 덮는다).
- manifest: `~/.config/opencode/oh-pencode/manifest.json`

```jsonc
{
  "version": "0.1.0",
  "installedAt": "2026-09-20T00:00:00.000Z",
  "models": { "pen": "openai/gpt-5.6-sol#high" },
  "files": [
    { "path": "agents/pen.md", "sha256": "<설치된 내용 해시>", "originSha256": "<asset 원본 해시>" },
  ],
  "config": { "defaultAgent": "pen", "rootModel": "openai/gpt-5.6-sol#high" },
}
```

- `files`의 `sha256`은 설치 시점의 디스크 내용 해시, `originSha256`은 asset 원본 해시다. 사용자 수정 판별은 두 값 비교로 한다 (src/fs.ts `ManagedFile`).
- `config`는 installer가 설정한 값이며, uninstall은 이 값과 일치할 때만 되돌린다.

### uninstall

- manifest에 기록된 파일만 지운다. 디스크 내용 해시가 manifest의 `sha256`과 다르면(사용자 수정) `--force` 없이는 보존한다.
- `opencode.jsonc`에서는 installer가 설치한 `default_agent`·`model` 값과 일치할 때만 제거한다. 사용자가 바꿨으면 경고하고 유지한다.
- 백업 복원 옵션(`--restore`)은 미구현이다. 백업 디렉터리는 남아 있다.

---

## 4. build/plan 숨김 방식

두 가지가 모두 동작함을 실측했다. installer는 **markdown 파일 방식**을 쓴다.

| 방식 | 파일 | 장점 | 단점 |
| --- | --- | --- | --- |
| config | `opencode.jsonc`의 `agents.build.hidden` | 설정 한 곳에 모임 | 사용자 config 수정 필요 |
| **markdown** | `agents/build.md`, `agents/plan.md` (body 비움) | 설정 파일 무수정, 파일 단위로 되돌리기 쉬움 | agent 파일이 2개 늘어남 |

markdown 방식 실측 결과: `system`이 빈 문자열이 되고 `hidden: true`가 적용됐다. build/plan은 pen 세트에서 쓰지 않으므로 프롬프트가 비는 것은 문제가 없다.

주의: `agents/build.md`를 만들면 built-in build를 **override**한다. 사용자가 `default_agent`를 pen이 아닌 build로 되돌리면 프롬프트 없는 build가 된다. uninstall이 이 파일을 지우면 원래 build가 복구된다.

---

## 5. 설치 후 검증 명령

```bash
opencode debug config          # 로드한 config source 확인
opencode debug agents          # agent별 mode/hidden/model/permissions/system 확인
opencode debug paths           # 경로 확인
```

`opencode debug agents`는 JSON을 출력하므로 installer의 `verify` 단계에서 파싱해 다음을 단언한다 (src/verify.ts).

- `pen`이 존재하고 `mode: primary`
- `build`·`plan`의 agent 파일이 전역 agents 디렉터리에 존재하는지 (파일 존재 검사. `hidden: true` 속성 단언은 아님)
- 각 `*-pen` subagent의 `mode`와, manifest에 기록된 기대 `model`의 반영
- `default_agent`가 `pen` (config에서 확인)
- root `model`이 manifest 기록 값과 일치 (manifest.config.rootModel이 있는 경우)

permissions 반영 검증은 미구현이다. 실제 검사 항목은 파일 존재·mode·model·default_agent·root model이다.

### reload

설정은 보통 파일 변경 시 자동 반영된다. 서버 재시작 없이 반영하려면:

```bash
opencode reload
```

---

## 6. 주의 사항

- `title`/`summary`/`compaction`은 hidden 시스템 agent다. installer는 이들을 건드리지 않는다.
- top-level `permissions`는 **모든 agent에 append**된다. installer는 전역 `permissions`를 쓰지 않고 `agents.<id>.permissions`만 쓴다.
- `.env` 읽기는 `ask`, `external_directory`는 `ask`가 기본이다. pen이 파일을 읽을 때 이 동작을 유지한다.
- `opencode.jsonc`가 없는 상태에서 `opencode`를 처음 실행하면 마이그레이션이 일어날 수 있다. installer는 `service.json` 같은 다른 파일을 건드리지 않는다.
- `~/.config/opencode/AGENTS.md`는 사용자 전역 지시 파일이다. installer는 **내용을 수정하지 않는다.** 별도 안내 파일 생성(`oh-pencode/pen-instructions.md`)은 미구현이다.
