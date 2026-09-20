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
curl -fsSL https://<user>.github.io/oh-pencode/install.sh | bash
```

`install.sh`는 얇은 부트스트랩이다.

1. OpenCode 설치 여부 확인 (`opencode --version`).
2. Bun 설치 여부 확인. 없으면 안내하고 중단 (임의 설치 금지).
3. GitHub Pages에서 installer 번들(`oh-pencode.ts`)과 asset을 임시 디렉터리로 내려받는다.
4. `bun run <tmp>/oh-pencode.ts install "$@"` 실행.
5. 임시 디렉터리 정리.

### 정적 asset (GitHub Pages)

GitHub Pages는 파일만 서빙한다. 다음을 정적으로 배포한다.

```text
dist/
├── index.html              사람이 보는 안내 페이지
├── install.sh              curl 부트스트랩
├── manifest.json           버전·asset 목록·해시
├── oh-pencode.ts           installer 본체 (단일 번들)
└── assets/
    ├── agents/
    │   ├── pen.md
    │   ├── sub-pen.md
    │   ├── research-pen.md
    │   ├── explore-pen.md
    │   ├── doc-pen.md
    │   ├── verify-pen.md
    │   ├── security-pen.md
    │   ├── build.md        (hidden)
    │   └── plan.md         (hidden)
    └── README.md
```

### manifest.json

```jsonc
{
  "version": "0.1.0",
  "releasedAt": "2026-09-20T00:00:00.000Z",
  "installer": { "path": "oh-pencode.ts", "sha256": "..." },
  "assets": [
    { "path": "agents/pen.md", "sha256": "..." },
  ],
}
```

- `install.sh`는 manifest를 먼저 받고, 각 asset의 해시를 검증한 뒤 installer를 실행한다.
- 버전 pin: `curl -fsSL https://.../install.sh | bash -s -- --version 0.1.0`

---

## 2. 명령

```bash
# 설치 (대화형 인터뷰)
curl -fsSL https://<user>.github.io/oh-pencode/install.sh | bash

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
| `--no-interview` | 인터뷰 없이 기본값(컨벤션 배정)으로 진행 |
| `--models <mode>` | `convention` \| `inherit` \| `custom:<agent>=<model>,...` |
| `--force` | 사용자가 수정한 관리 파일도 덮는다 |
| `--version <v>` | 특정 버전 asset 사용 |
| `--yes` | 모든 확인에 yes |
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

3) build/plan 에이전트를 숨길까요?
   A. 숨김 (pen 단독 사용)  [기본]
   B. 그대로 둠

4) 기존 opencode.jsonc 의 default_agent 를 pen 으로 바꿀까요?
   현재 값: <build> → pen
   A. 바꿈  B. 유지
```

- 설치 시 인터뷰는 **1회**다. 세션마다의 모델 질문은 pen이 런타임에 한다 (architecture.md §3).
- `--no-interview`면 모두 기본값(A)으로 진행한다.

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
~/.config/opencode/agents/build.md      (hidden)
~/.config/opencode/agents/plan.md       (hidden)
~/.config/opencode/opencode.jsonc       (default_agent 키만)
~/.config/opencode/oh-pencode/manifest.json
```

### opencode.jsonc 병합 규칙

1. 파일이 없으면 `{ "$schema": "https://opencode.ai/config.json" }`로 만든다.
2. 있으면 읽어 `Bun.JSONC.parse`로 파싱한다.
3. **installer가 관리하는 키만** 바꾼다: `default_agent`.
4. 사용자의 다른 키는 그대로 둔다.
5. 재직렬화는 `JSON.stringify(obj, null, 2)` — 주석과 trailing comma가 사라진다.
6. 쓰기 전에 원본을 백업하고, 주석이 사라질 수 있음을 고지한다.
7. 사용자가 `--dry-run`을 주면 diff만 출력한다.

### 멱등성

- `agents/*.md`는 installer 관리 파일이다. 재실행 시 재생성한다.
- **사용자가 수정한 흔적이 있으면** (해시 불일치) 덮기 전에 경고하고 확인을 받는다.
- `model:` 줄은 사용자가 런타임에 바꿀 수 있으므로, **upgrade 시 보존 대상**으로 취급한다. asset의 model이 기본값이고, 사용자가 바꾼 값이 있으면 그 값을 유지한다.
- manifest에 관리 파일과 해시를 기록한다.

### uninstall

- manifest의 파일만 지운다.
- `opencode.jsonc`의 `default_agent`가 `pen`이면 제거한다. 다른 값이면 건드리지 않는다.
- 사용자가 수정한 파일은 지우지 않고 목록만 보고한다.
- `--restore <timestamp>`로 백업 복원을 지원한다.

---

## 5. 검증

### installer 자체 검증

- **에셋 해시 검증** — 다운로드 후 sha256 비교.
- **YAML frontmatter 파싱** — 생성한 `.md`가 유효한지 확인.
- **JSONC 파싱** — 쓴 `opencode.jsonc`가 유효한지 확인.

### 설치 후 검증

```bash
opencode debug config
opencode debug agents
```

installer의 `verify` 단계에서 `opencode debug agents`를 JSON으로 파싱해 단언한다.

- `pen` 존재, `mode: primary`, `hidden !== true`
- `build`·`plan` `hidden: true`
- 각 `*-pen`의 `mode: subagent`, 기대 `model`, 기대 `permissions`
- `default_agent`가 config source에 `pen`인지

실패하면 보고하고 종료한다. 일부만 설치된 상태를 남기지 않도록 실패 시 롤백한다.

### 알려진 한계

- `opencode debug agents`는 CLI 레벨이라 plugin transform이 반영되지 않는다. installer는 plugin을 쓰지 않으므로 무관하다.
- 실제 모델 사용 여부는 `session.hook("model.request")` 없이는 CLI로 확인할 수 없다. installer의 검증은 등록 상태까지만 보증하고, 실행 검증은 pen 또는 사용자가 한다.

---

## 6. 프로젝트 구조

```text
oh-pencode/
├── README.md
├── package.json
├── tsconfig.json
├── src/
│   ├── oh-pencode.ts        CLI 진입점 (install/verify/upgrade/uninstall)
│   ├── interview.ts         대화형 질문
│   ├── install.ts           파일 쓰기·병합·백업
│   ├── manifest.ts          오버레이 파일·해시
│   ├── verify.ts            debug agents 파싱·단언
│   └── paths.ts             경로 해석
├── assets/
│   └── agents/*.md
├── scripts/
│   └── build-site.ts        dist/ 생성 (번들 + 해시 + manifest)
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

1. `src/**`를 `dist/oh-pencode.ts`로 번들한다.
2. `assets/**`를 `dist/assets/**`로 복사한다.
3. sha256을 계산해 `dist/manifest.json`을 만든다.
4. `install.sh`와 `index.html`을 만든다.

GitHub Actions로 `main` push 시 `dist/`를 GitHub Pages에 배포한다.

### 개발

```bash
bun run install:local     # 이 레포의 installer를 그대로 실행 (--dry-run 아님)
bun run verify            # 설치 상태 검증
```

---

## 7. 안전

- **시크릿을 읽지 않는다.** installer는 `.env`·토큰·API 키를 건드리지 않는다.
- **기존 설정을 존중한다.** 사용자 키를 덮지 않고, 백업을 남기고, `--dry-run`을 제공한다.
- **원격 코드 실행 최소화.** `install.sh`는 해시 검증 후 로컬 번들을 실행할 뿐, 원격에서 임의 명령을 받아 실행하지 않는다.
- **`sudo`를 쓰지 않는다.** 모든 경로는 사용자 홈 아래다.
- **`git add -A` 같은 전체 조작을 하지 않는다** (installer는 git을 조작하지 않는다).

---

## 8. 미해결 (구현 시 결정)

| 항목 | 선택지 |
| --- | --- |
| 인터뷰 UI | `@clack/prompts` 같은 TUI 라이브러리 vs 자체 `readline` |
| 번들 방식 | `bun build --target=bun` vs `--target=node` (Bun 필수라면 bun) |
| GitHub Pages 도메인 | `<user>.github.io/oh-pencode` |
| 버전 관리 | `dist/manifest.json`의 `version` vs git tag |
| `*-pen` glob 허용 | pen 허용 목록에 `*-pen`을 넣을지, 명시 목록으로 둘지 |
