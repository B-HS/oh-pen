# oh-pencode

OpenCode V2용 **pen** 에이전트 세트 installer.

`build`/`plan`을 숨기고 `pen` 단독 primary agent로 동작하며, 작업 성격별 서브에이전트(`sub-pen`, `research-pen`, `explore-pen`, `doc-pen`, `verify-pen`, `security-pen`)에 위임한다.

## 설치

```bash
curl -fsSL https://oh-pencode.github.io/oh-pencode/install.sh | bash
```

미리보기(파일을 쓰지 않음):

```bash
curl -fsSL https://oh-pencode.github.io/oh-pencode/install.sh | bash -s -- --dry-run
```

비대화형(컨벤션 배정 기본값):

```bash
curl -fsSL https://oh-pencode.github.io/oh-pencode/install.sh | bash -s -- --no-interview
```

검증 / 제거:

```bash
curl -fsSL https://oh-pencode.github.io/oh-pencode/install.sh | bash -s -- verify
curl -fsSL https://oh-pencode.github.io/oh-pencode/install.sh | bash -s -- uninstall
```

## 요구 사항

- OpenCode V2 (`opencode --version`)
- Bun (`bun --version`)

## 설치되는 것

`~/.config/opencode/` 아래에만 쓴다.

| 파일 | 내용 |
| --- | --- |
| `agents/pen.md` | 메인 오케스트레이터 (primary) |
| `agents/sub-pen.md` | 상세 계약 실행자 |
| `agents/research-pen.md` | 기획·조사 |
| `agents/explore-pen.md` | 코드베이스 탐색 |
| `agents/doc-pen.md` | 외부 문서 심층 분석 |
| `agents/verify-pen.md` | 독립 검증 |
| `agents/security-pen.md` | 보안 감사 |
| `agents/build.md`, `agents/plan.md` | built-in 숨김 (설치 시 선택) |
| `opencode.jsonc` | `default_agent`, root `model` (기존 키는 보존) |
| `oh-pencode/manifest.json` | 설치 기록 (해시·모델·설정값) |
| `oh-pencode/backup/<timestamp>/` | 설치 전 백업 |

## 에이전트 구성

| Agent | Mode | 역할 | 권한 |
| --- | --- | --- | --- |
| `pen` | primary | 요구 해석·분해·통합·검증·Git | 전체 (auto-mode) |
| `sub-pen` | subagent | 구현·수정·검증 | pen과 동일, subagent 호출 불가 |
| `research-pen` | subagent | 조사 | 읽기·검색만 |
| `explore-pen` | subagent | 탐색 | 읽기·검색만, 네트워크 불가 |
| `doc-pen` | subagent | 문서 분석 | 읽기·검색·web |
| `verify-pen` | subagent | 검증 | 읽기·검색·shell |
| `security-pen` | subagent | 보안 감사 | 읽기·검색·web, shell 불가 |

## 동작

### auto-mode

권한 승인을 묻지 않고 진행한다. `deny` 규칙(시크릿·외부 경계)은 그대로 차단된다.

### workflow

`pen`이 작업을 분해해 `subagent` tool로 위임한다. 위임 시 `ai-process.md`의 9개 계약 항목(목표·근거·소유 범위·규칙·순서·엣지 케이스·검증·보고 형식·통합)을 생략 없이 prompt에 넣는다.

### 모델 선택

새 작업을 시작할 때 pen이 workflow 사용 여부와 모델 배정을 묻는다. 선택은 그 작업에만 유효하다.

- subagent 모델: `agents/<id>.md`의 `model:` 수정으로 런타임 반영됨 (실측)
- pen 자신의 모델: `opencode.jsonc`의 root `model`이 결정함 (실측)

## 개발

```bash
bun install
bun run typecheck
bun run build:site                    # dist/ 생성
bun run src/cli.ts install --assets-dir ./dist/assets --dry-run
bun run src/cli.ts verify
```

`--assets-dir`는 로컬 `assets/`를 직접 쓰는 개발용 플래그다. 배포 시에는 GitHub Pages의 `manifest.json`과 `assets/`를 사용한다.

### GitHub Pages 배포

`main` 브랜치에 push하면 GitHub Actions가 `dist/`를 Pages에 배포한다.

## 문서

| 문서 | 내용 |
| --- | --- |
| `docs/opencode/v2-agents.md` | OpenCode V2 agent 계약 (실측 포함) |
| `docs/opencode/v2-install-surface.md` | 설치 지점·우선순위·멱등성 |
| `docs/pen/architecture.md` | 에이전트 세트 설계 |
| `docs/pen/installer.md` | installer 설계 |
| `docs/acknowledge/decisions.md` | 결정·합의 기록 |
| `docs/PROCESS.md` | 작업 상태 |

## 안전

- `~/.config/opencode/` 밖을 건드리지 않는다.
- 기존 `opencode.jsonc`의 사용자 키를 보존하고, 변경 전 백업한다.
- 설치 후 사용자가 수정한 파일은 재설치 시 보존한다.
- 시크릿·토큰·`.env`를 읽지 않는다.
- `sudo`를 쓰지 않는다.
