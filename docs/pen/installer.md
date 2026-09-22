# installer 설계

> 프로젝트: `oh-pencode` — oh-my-openagent 스타일의 pen 에이전트 세트 installer
> 배포: GitHub Pages + `curl` 원라인 설치
> 스택: Bun + TypeScript (사용자 합의)
> 설치 범위: 전역 `~/.config/opencode/` 만 (사용자 결정)

---

## 1. 배포 형태

oh-my-openagent는 `bunx oh-my-openagent install`을 쓴다. 하지만 사용자 요구는 **GitHub Pages + curl**이다.

### 설치 원라인

```bash
curl -fsSL https://b-hs.github.io/oh-pen/install.sh | bash
```

`install.sh`는 얇은 부트스트랩이다.

1. OpenCode 설치 여부 확인 (`opencode --version`).
2. Bun 설치 여부 확인. 없으면 안내하고 중단 (임의 설치 금지).
3. GitHub Pages에서 installer 번들(`oh-pencode.ts`)과 `manifest.json`을 임시 디렉터리로 내려받는다.
4. `manifest.json`의 asset 목록을 임시 디렉터리로 내려받는다.
5. manifest의 `sha256` 맵으로 번들·에셋 해시를 검증한다. 불일치하면 `exit 1`로 중단한다.
6. `bun run <tmp>/oh-pencode.ts <command> --assets-dir <tmp>/assets "$@"` 실행.
7. 임시 디렉터리 정리.

### 정적 asset (GitHub Pages)

GitHub Pages는 파일만 서빙한다. 다음을 정적으로 배포한다.

| `dist/` 아래 경로 | 내용 |
| --- | --- |
| `index.html`, `docs/**/*.html`, `site.css` | 홈페이지와 사용·설계 문서 |
| `install.sh`, `oh-pencode.ts` | curl 부트스트랩과 단일 installer 번들 |
| `manifest.json` | 버전·13개 asset 목록·SHA-256 |
| `assets/agents/*.md` | pen·sub·research·explore·doc·verify·security·review 8종 |
| `assets/agents/builtin/{build,plan}.md` | built-in 숨김 2종 |
| `assets/oh-pencode/runtime.js` | 실행·취소·재개 도구 |
| `assets/oh-pencode/{task,result}.schema.json` | 작업과 결과 계약 2종 |

### manifest.json

```jsonc
{
  "version": "0.2.0",
  "releasedAt": "<빌드 시각 UTC ISO 8601>",
  "assets": [
    "agents/builtin/build.md",
    "agents/builtin/plan.md",
    "agents/doc-pen.md",
    "agents/explore-pen.md",
    "agents/pen.md",
    "agents/research-pen.md",
    "agents/review-pen.md",
    "agents/security-pen.md",
    "agents/sub-pen.md",
    "agents/verify-pen.md",
    "oh-pencode/result.schema.json",
    "oh-pencode/runtime.js",
    "oh-pencode/task.schema.json",
  ],
  "sha256": {
    "oh-pencode.ts": "<installer 번들 해시>",
    "agents/builtin/build.md": "<...>",
    "agents/pen.md": "<...>",
  },
}
```

- `assets`는 `agents/...`와 `oh-pencode/...`의 경로 문자열 목록이고, `sha256`은 `oh-pencode.ts` 번들과 각 에셋의 해시 맵이다 (`scripts/build-site.ts`의 `buildManifest`). `oh-pencode.ts`는 `assets`에 없고 `sha256` 맵에만 있다. 위 해시는 구조 예시이며 실제 manifest에는 모든 자산의 해시가 포함된다.
- `install.sh`가 다운로드한 파일을 이 맵과 비교해 검증하고, 불일치하면 `exit 1`로 중단한다.
- CLI도 http base-url일 때 manifest의 sha256 맵으로 asset을 검증한다.

---

## 2. 명령

```bash
# 설치 (대화형 인터뷰)
curl -fsSL https://b-hs.github.io/oh-pen/install.sh | bash

# 비대화형
... | bash -s -- --no-interview --models convention

# 미리보기 (파일을 쓰지 않음)
... | bash -s -- --dry-run

# 검증
... | bash -s -- verify

# 업데이트
... | bash -s -- upgrade

# 제거
... | bash -s -- uninstall
```

### 플래그

| 플래그 | 의미 |
| --- | --- |
| `--dry-run` | 쓸 파일과 diff를 출력만 한다 |
| `--no-interview` | 인터뷰 없이 기본값으로 진행 (아래 §3 참조) |
| `--models <mode>` | `convention` \| `inherit` (`custom` 문법은 미구현) |
| `--force` | 사용자가 수정한 관리 파일도 덮는다 |
| `--no-backup` | 백업을 생략한다 (권장하지 않음) |

---

## 3. 인터뷰

설치 시 아래를 **한 번에 모아서** 묻는다 (컨벤션 `ai-process.md` §3.1).

```text
1) 에이전트 모델을 어떻게 할까요?
   A. 컨벤션 배정 (Sol/Terra/Luna)  [기본]
   B. 부모 모델 상속 (model 미지정)
   C. 직접 지정

2) (C 선택 시) 에이전트별 모델을 입력하세요.
   pen              : openai/gpt-5.6-sol#high
   sub-pen          : openai/gpt-5.6-terra#medium
   research-pen     : openai/gpt-5.6-luna#medium
   explore-pen      : openai/gpt-5.6-luna#low
   doc-pen          : openai/gpt-5.6-luna#high
   verify-pen       : openai/gpt-5.6-luna#medium
   security-pen     : openai/gpt-5.6-luna#high
   review-pen       : openai/gpt-5.6-terra#high

3) build/plan 에이전트를 숨길까요?
   A. 숨김 (pen 단독 사용)  [기본]
   B. 그대로 둠

4) 기존 opencode.jsonc 의 default_agent 를 pen 으로 바꿀까요?
   현재 값: <build> → pen
   A. 바꿈  B. 유지

5) pen의 세션 모델을 입력하세요 (root model — primary 세션에 실제 적용되는 값).
   기본값: 기존 root model 또는 convention pen 모델

6) 설치 요약을 보여주고 "이대로 설치할까요?" 최종 확인을 받는다.
```

- 설치 시 인터뷰는 초기 GPT 역할 배정을 정한다. 이후 `pen`은 새 도구 작업마다 workflow와 모델 방식을 함께 묻고, 설치 배정을 추천 기본값으로 제시한다 (architecture.md §3~4).
- convention은 추천 기본값일 뿐 강제가 아니다. `custom`을 선택하면 OpenCode에 연결한 임의의 `provider/model#variant`를 agent별로 입력할 수 있다.
- 사용자가 작업에서 모델 상속이나 역할별 모델을 선택하면 `pen`은 `opencode run --agent ... --model ...` 플래그로 별도 실행하고 설치된 agent 파일은 변경하지 않는다. 사용할 수 없는 모델을 다른 모델로 자동 대체하지 않는다.
- `--no-interview`면 `default_agent=pen`과 root `model`은 **기존 값이 있으면 유지**하고, 나머지는 기본값(A: convention 배정, build/plan 숨김)으로 진행한다 (src/cli.ts `noInterviewAnswers`).

---

## 4. 파일 조작

### 쓰는 파일

```text
~/.config/opencode/agents/pen.md
~/.config/opencode/agents/sub-pen.md
~/.config/opencode/agents/research-pen.md
~/.config/opencode/agents/explore-pen.md
~/.config/opencode/agents/doc-pen.md
~/.config/opencode/agents/verify-pen.md
~/.config/opencode/agents/security-pen.md
~/.config/opencode/agents/review-pen.md
~/.config/opencode/agents/build.md      (hidden)
~/.config/opencode/agents/plan.md       (hidden)
~/.config/opencode/opencode.jsonc       (default_agent, model 키만)
~/.config/opencode/oh-pencode/manifest.json
~/.config/opencode/oh-pencode/runtime.js
~/.config/opencode/oh-pencode/task.schema.json
~/.config/opencode/oh-pencode/result.schema.json
```

### opencode.jsonc 병합 규칙

1. 파일이 없으면 `{ "$schema": "https://opencode.ai/config.json" }`로 만든다.
2. 있으면 읽어 `Bun.JSONC.parse`로 파싱한다.
3. **installer가 관리하는 키만** 바꾼다: `default_agent`, `model` (src/config.ts `managedConfigKeys`).
4. 사용자의 다른 키는 그대로 둔다.
5. 재직렬화는 `JSON.stringify(obj, null, 2)` — 주석과 trailing comma가 사라진다.
6. 쓰기 전에 원본을 백업하고, **주석·trailing comma 소실을 1줄 고지로 출력한다.**
7. 사용자가 `--dry-run`을 주면 diff만 출력한다.

### 멱등성

- `agents/*.md`, 실행 도구, 계약 스키마는 installer 관리 파일이다. 재실행 시 사용자 변경 여부를 확인한 뒤 갱신한다.
- **사용자가 수정한 흔적이 있으면** (해시 불일치) 확인 질문 없이 자동 보존하고, 보존 사실을 경고로 출력한다 (src/install.ts: 기존 sha256과 디스크 해시 비교 → `preserved` + `warnings`).
- 변경이 `model:` 줄뿐이면 사용자 지정 모델을 보존하면서 새 asset 본문과 permission을 갱신한다. model 줄을 제거해 이전 `originSha256`과 비교하므로 다른 본문 변경과 구분한다.
- 갱신 뒤 manifest의 `models`는 설치 답변이 아니라 실제 설치 파일의 `model:` 값을 다시 읽어 기록하므로 verify 기대값과 일치한다.
- model 외 본문을 수정한 파일은 `--force` 없이 전체 보존한다.
- manifest에 관리 파일과 해시(`sha256`, `originSha256`)를 기록한다.

### uninstall

- manifest의 파일만 지운다. 해시가 다르면(사용자 수정) `--force` 없이는 보존한다.
- `opencode.jsonc`의 `default_agent`·`model`은 **installer가 설치한 값과 일치할 때만** 되돌린다. 다른 값이면 건드리지 않고 경고한다.
- 사용자가 수정한 파일은 지우지 않고 목록만 보고한다.

---

## 5. 검증

### installer 자체 검증

- **에셋 sha256 검증** — `install.sh`가 다운로드한 `oh-pencode.ts`와 각 asset을 manifest의 `sha256` 맵과 비교한다. 불일치하면 `exit 1`로 중단한다. CLI도 http base-url일 때 manifest의 sha256으로 asset을 검증한다.
- **에셋 내용 검증** — `scripts/build-site.ts`의 `verifyIntegrity`: agent md의 frontmatter·mode·description·hidden 존재와 빈 파일 여부를 확인한다. custom agent는 prompt injection 경계, 역할별 mutation 제한, pen의 일반 push 허용·force push 차단, doc-pen의 `docs/**` edit 계약까지 단언한다.
- **JSONC 재파싱 검증** — 미구현. 쓴 `opencode.jsonc`를 다시 파싱해 확인하는 단계는 없다.

### 설치 후 검증

```bash
opencode debug config
opencode debug agents
```

installer의 `verify` 단계에서 `opencode debug agents`를 JSON으로 파싱해 단언한다.

- `pen` 존재, `mode: primary`
- 설치 대상으로 선택한 `build`·`plan`의 실제 runtime `hidden: true`
- 각 `*-pen`의 등록·`mode: subagent`·48단계 상한·권한 경계와 manifest에 기록된 모델 또는 상속 상태
- `default_agent`가 설치 때 선택한 값인지 (installer가 관리한 경우)
- root `model`이 manifest에 기록된 값과 일치하는지 (manifest.config.rootModel에 기록된 경우)
- runtime 번들을 포함한 설치 파일의 SHA-256이 manifest와 일치하는지

실패하면 보고하고 종료한다. 실패 시 롤백은 **미구현**이다. 일부만 설치된 상태가 남을 수 있다.

### 알려진 한계

- `opencode debug agents`는 CLI 레벨이라 plugin transform이 반영되지 않는다. installer는 plugin을 쓰지 않으므로 무관하다.
- installer의 verify는 등록 상태를 검사합니다. 실행 도구는 해당 시도의 실제 assistant 메시지에 기록된 agent·model을 별도로 확인합니다.

---

## 6. 프로젝트 구조

```text
oh-pencode/
├── README.md
├── package.json
├── tsconfig.json
├── src/
│   ├── cli.ts            CLI 진입점 (install/verify/upgrade/uninstall, 플래그 파싱)
│   ├── interview.ts      대화형 질문 (@clack/prompts)
│   ├── install.ts        파일 쓰기·병합·백업
│   ├── uninstall.ts      manifest 기반 제거·config 되돌림
│   ├── verify.ts         debug agents 파싱·단언
│   ├── config.ts         opencode.jsonc 읽기·관리 키 적용·되돌림
│   ├── models.ts         컨벤션 모델 배정, frontmatter model 줄 읽기·쓰기
│   ├── assets.ts         HTTP·로컬 asset 소스
│   ├── fs.ts             해시·manifest·파일 목록 유틸
│   └── paths.ts          전역 경로 해석
├── assets/
│   └── agents/
│       ├── *.md          pen 세트 7종
│       └── builtin/      build.md·plan.md (hidden)
├── scripts/
│   └── build-site.ts     dist/ 생성 (번들 + install.sh + index.html + manifest + 무결성 검증)
├── docs/
│   ├── PROCESS.md
│   ├── opencode/
│   ├── pen/
│   └── acknowledge/
└── dist/                    (빌드 산출물, gitignore)
```

### 빌드

```bash
bun run build:site
```

1. `assets/**`를 복사하고 installer와 runtime을 각각 Bun 단일 번들로 만든다.
2. Zod 작업·결과 계약을 JSON Schema로 내보내 runtime과 함께 배치한다.
3. `install.sh`, 홈페이지와 문서 페이지를 생성한다.
4. installer와 13개 자산의 sha256을 manifest에 기록하고 역할 권한·공통 계약·빈 파일 검사를 수행한다.

GitHub Actions로 `main` push 시 `dist/`를 GitHub Pages에 배포한다.

### 개발

```bash
bun run install:local     # 이 레포의 installer를 그대로 실행 (--dry-run 아님)
bun run verify            # 설치 상태 검증
```

`install:local`은 `bun run src/cli.ts install --base-url ./dist`다. `./dist`가 로컬 경로로 해석되어 dist의 `manifest.json`과 `assets/`를 직접 읽는다 (`--assets-dir` 지정과 동일한 로컬 소스 경로). 빌드 후 그대로 실행하면 설치가 진행된다.

---

## 7. 안전

- **시크릿을 읽지 않는다.** installer는 `.env`·토큰·API 키를 건드리지 않는다.
- **기존 설정을 존중한다.** 사용자 키를 덮지 않고, 백업을 남기고, `--dry-run`을 제공한다.
- **원격 코드 실행 최소화.** `install.sh`는 해시 검증 후 로컬 번들을 실행할 뿐, 원격에서 임의 명령을 받아 실행하지 않는다. 다운로드한 `oh-pencode.ts`와 에셋을 manifest의 `sha256` 맵으로 검증하고, 불일치하면 `exit 1`로 중단한다.
- **에셋 경로를 검증한다.** install/uninstall은 asset 경로의 절대경로·`..` 세그먼트를 거부해 `~/.config/opencode` 밖으로 벗어나는 쓰기·삭제를 막는다 (src/install.ts `assertSafeAssetPath`, src/uninstall.ts `containedTarget`).
- **`--base-url`의 `http://` 스킴을 거부한다.** https 원격 또는 로컬 경로만 허용한다.
- **`sudo`를 쓰지 않는다.** 모든 경로는 사용자 홈 아래다.
- **`git add -A` 같은 전체 조작을 하지 않는다** (installer는 git을 조작하지 않는다).

---

## 8. 결정 완료 (구현에 반영됨)

| 항목 | 결정 |
| --- | --- |
| 인터뷰 UI | `@clack/prompts` 채택 (src/interview.ts) |
| 번들 방식 | `bun build --target=bun` (scripts/build-site.ts) |
| GitHub Pages 도메인 | `https://b-hs.github.io/oh-pen` |
| 버전 관리 | `dist/manifest.json`의 `version` = package.json의 `version` (빌드 시 고정) |
| `*-pen` glob 허용 | pen 허용 목록에 glob을 넣지 않고 명시 목록으로 둔다 (사용자 결정, architecture.md §6) |

## v0.2.0 설치 자산과 검증

- review-pen을 포함한 custom agent 8종과 built-in 숨김 2종을 배포합니다.
- `oh-pencode/runtime.js`, `task.schema.json`, `result.schema.json`을 같은 manifest와 백업·사용자 수정 보존·제거 체계로 관리합니다. 실행 도구는 Bun 번들이므로 설치 위치에 node_modules가 필요하지 않습니다.
- 파일 존재뿐 아니라 runtime agent 등록·mode·hidden·모델(중첩 ID 포함)·권한 금지 경계와 실제 설치 파일 SHA-256을 확인합니다. 상속 모델과 선택적으로 유지한 default_agent도 설치 선택대로 검사합니다.
- 배포 CI는 타입 검사·전체 회귀 검사·에셋 빌드를 수행합니다. PR에서는 검사만, main에서는 Pages 배포까지 진행합니다.
- 실행·체크포인트·취소·근거 재사용은 [실행 도구 안내](runtime.md)를 참조합니다.
