# PROCESS

## 기준 문서

| 문서 | 용도 |
| --- | --- |
| `~/.claude/convention/index.md` | 코딩 컨벤션 진입점 (COMMON/FE/BE/Desktop) |
| `~/.claude/convention/ai-process.md` | AI 작업 프로세스, workflow·모델 배정, 위임 계약 |
| `~/AGENTS.md` | 전역 에이전트 지시 (컨벤션 문서 참조) |
| `https://opencode.ai/v2/docs/agents/` | OpenCode V2 agent 계약 (source of truth) |

## 환경 (합의)

| 항목 | 값 | 근거 |
| --- | --- | --- |
| OpenCode | v2.0.10 (`/Users/hyunseokbyun/.opencode/bin/opencode`) | `opencode --version` 실측 |
| 런타임 | Bun 1.4.2 | 컨벤션 `common.md` |
| 언어 | TypeScript strict | 컨벤션 `common.md` |
| 설치 대상 | 전역 `~/.config/opencode/` 만 | 사용자 결정 (2026-09-20) |
| workflow | 이번 세션: **사용** (병렬 워크스트림 A1 docs 정합성 / A2 코드 무결성) | 사용자 결정 (2026-09-20, 이번 세션) |
| 이번 세션 모델 | `ollama-cloud/glm-5.3-flash` | 세션 실측 |

## 작업: pen 에이전트 세트 + installer

### 체크리스트

- [x] OpenCode V2 공식 문서 조사 (agents, config, permissions, tools, models, instructions, skills, references, compaction, migrate-v1, plugins, commands, keybinds, snapshots)
- [x] V2 동작 실측 검증 (hidden, default_agent, markdown frontmatter permissions, model#variant, top-level permissions 병합 부작용)
- [x] 사용자 결정 확정 (설치 범위·스택·workflow·모델 질문 방식·sub-pen 노출·docs 위치)
- [x] `docs/opencode/v2-agents.md` 작성 — V2 agent 정확한 사용법
- [x] `docs/opencode/v2-install-surface.md` 작성 — 설치 지점(설정 파일·디렉터리·우선순위·멱등성)
- [x] `docs/pen/architecture.md` 작성 — 에이전트 세트 설계
- [x] `docs/pen/installer.md` 작성 — installer 설계
- [x] `docs/acknowledge/decisions.md` 작성 — 사용자 합의 기록
- [x] installer 구현 (Bun + TypeScript)
- [x] installer 검증 (dry-run, 실제 설치, `opencode debug agents` 확인)
- [x] README 작성
- [x] GitHub Actions Pages 배포 워크플로
- [x] 전수조사 (src·scripts·assets·docs·README·배포본 대조, 부정합 목록화)
- [x] docs 정합성 수정 (이 문서 포함 6개 문서를 실제 구현 기준으로)
- [x] README 재작성 (rotater 스타일, 실제 동작 기준)
- [x] 커밋·푸시 (docs·src 수정 통합, Pages 재배포 확인)
- [x] 공식 사이트 (DESIGN.md 기반 랜딩 + docs 7페이지 + 404, 무결성·접근성 검증)

### 상세

1. **문서 우선** — 사용자 지시에 따라 구현 전에 V2 계약과 설계를 `docs/`에 고정한다.
2. **설치 방식** — GitHub Pages + curl 부트스트랩. `curl -fsSL <pages>/install.sh | bash`.
3. **모델 배정** — 컨벤션 `ai-process.md` §1.2 의 Codex 배정(Sol/Terra/Luna)을 기본안으로 제시하고, 사용자가 컨벤션 채택 여부와 개별 모델을 선택한다.
4. **에이전트 구성** — `pen`(primary, build/plan 숨김 대체), `sub-pen`, `research-pen`, `explore-pen`, `doc-pen`, `verify-pen`, `security-pen`.
5. **검증** — `opencode debug agents`로 mode/hidden/model/permissions/system 실제 반영을 확인한다.

### 위험 / 미완료

- top-level `permissions`는 모든 agent에 병합되므로, 전역 규칙을 `agents.<id>.permissions`에만 두어 부작용을 피한다 (실측으로 확인).
- `title`/`summary`/`compaction`은 hidden 시스템 agent이므로 설정을 건드리지 않는다.
- XDG_CONFIG_HOME은 무시되고 `~/.config/opencode`가 고정 경로이다 (실측).
- plugin `agent.transform`은 registry만 바꾸고 세션 실행 모델에는 반영되지 않는다 (실측). subagent 런타임 모델 변경은 agent `.md` 편집으로 한다.
- primary agent(pen)의 `model` 필드는 세션 모델에 반영되지 않는다 (실측). root `opencode.jsonc`의 `model`이 결정한다.
- `question` tool은 비대화형 `opencode run`에서 세션을 중단시킨다 (실측). pen asset은 시작 질문을 텍스트로 제시하도록 작성했다.

### 검증 결과 (v2.0.10, macOS)

| 검증 | 결과 |
| --- | --- |
| `bun run typecheck` | 통과 |
| `bun run build:site` | dist/ 9 assets 생성 |
| `src/cli.ts install --assets-dir ... --dry-run` | 계획 출력, 파일 미변경 |
| 실제 설치 → `opencode debug agents` | pen primary, build/plan hidden, subagent 6종 model 반영 |
| `src/cli.ts verify` | 실측 27개 항목 전부 통과 (agent 파일/mode/model 21 + manifest 1 + debug agents 1 + build/plan hidden 2 + default_agent 1 + root model 1) |
| 재설치 멱등성 | 통과 |
| 사용자 수정 파일 보존 | 통과 (해시 비교) |
| 런타임 모델 변경 (subagent `.md` 수정) | `debug agents`에 반영 확인 |
| 런타임 모델 변경 (primary root model) | 세션 실행 모델 반영 확인 |
| HTTP 배포본 install.sh → install/verify | 통과 |
| **GitHub Pages 배포본 (b-hs.github.io/oh-pen)** | install.sh·manifest 200, 배포본 manifest에 sha256 맵 10개 키 반영 확인 |
| 독립 검증 (verify-pen) | typecheck·build·install:local·verify 27개·uninstall dry-run·install.sh 변조 차단(exit 1)·http 거부·서버·TMP 잔존 없음 확인 |
| `install:local` | 수정 전 실패(exit 1) → 수정 후 통과 (`--base-url ./dist` 로컬 경로 해석) |
| install.sh 해시 검증 | 구현: 다운로드 파일을 manifest sha256과 비교, 불일치 시 exit 1 (변조 재현 확인) |
| dead export 제거 | 5개 제거 (verifyInstallTarget, managedAgentIds, ManagedAgentId, userAgentSuffix, toRelative) |
| end-to-end 위임 | pen → explore-pen / sub-pen 호출·통합·커밋 확인 |
| `.env` deny 경계 | pen이 거부 확인 |
| uninstall | 파일·config 키 복원 확인 |
| 사이트 빌드 | 9 assets + 11 pages (site.css·index·404·docs 8) |
| 사이트 링크 전수 검사 | href 247개 해석 실패 0건 (depth 0/1/2), 중복 id 0, toc↔헤딩 일치 |
| 사이트 DESIGN.md 준수 | 팔레트 40값 verbatim, 700 가중치 0, 스피너 0, 이모지 0, Surface A radius 0·shadow none 확인 |

### 저장소

- 로컬: `/Users/hyunseokbyun/development/oh-pencode`
- 원격: <https://github.com/B-HS/oh-pen>
- 배포: <https://b-hs.github.io/oh-pen/>
- 커밋: `729a53b` feat, `fd2f908` fix, `b7dc4c1` ci, `76a29bf` docs, `01398d8` fix, `3d1a31d` docs, `b53fa75` docs
