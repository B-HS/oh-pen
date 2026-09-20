# 사용자 결정 · 합의 (2026-09-20)

> 컨벤션 `ai-process.md` §9에 따라 사용자의 명시적 결정과 전제를 기록한다.
> 이후 세션에서 같은 결정을 다시 묻지 않기 위한 근거다.

---

## 1. 목표

사용자 원문:

> opencode 의 공식 홈페이지를 먼저 확인하고 primary agent를 만들어서 현재 존재하는 plan/build agent를 숨기고 단독으로 사용할거야
> 해당 primary agent의 이름은 pen
> claude code의 auto-mode 와 동일하게 작동할거야
> claude code workflow처럼 당연히 sub-agent를 부를수도있어야하고 각 sub-agent에대해서 모델도 정해서 기동하게할수있어야겠지
> sub-pen 이라고 만들고 얘는 pen에서 지시를받아서 프롬프트를 상세하게 주입받아야만 기동하는 에이전트야. 메인 pen에서 지시가 모호한경우 다시 메인 pen 에 물어서 완벽한 상태로 돌아가는 sub-pen
> 기타 research 용 research-pen, codebase 탐색용 explore-pen, 외부 문서를 더욱더 심층적이고 완벽하게 읽는 doc-pen

정정: 최초 "worktree" 는 오기이며 **workflow**를 의미한다.

## 2. 결정 사항

| # | 항목 | 결정 | 비고 |
| --- | --- | --- | --- |
| D1 | 설치 대상 | **전역 `~/.config/opencode/`만** | 프로젝트별 설치는 지원하지 않는다 |
| D2 | 스택 | **Bun + TypeScript** | 컨벤션 `common.md` 준수 |
| D3 | workflow | 이번 작업은 **사용하지 않음** (메인 직접 수행) | 세션마다 재질문 대상 |
| D4 | 모델 배정 시점 | **매 작업 시작 시 질문** | 설치 시 1회가 아니다 |
| D5 | auto-mode 의미 | **권한 자동 승인** (deny는 유지) | 무중단 자율 실행이 아니다 |
| D6 | sub-pen 노출 | **노출** (`@` mention 가능) | hidden 처리하지 않는다 |
| D7 | docs 위치 | `oh-pencode/docs/` | |
| D8 | 서브에이전트 세트 | pen, sub-pen, research-pen, explore-pen, doc-pen **+ verify-pen, security-pen** (총 7) | 확장 가능하게 |
| D9 | installer 실행 방식 | **GitHub Pages + curl** | `curl -fsSL .../install.sh \| bash` |
| D10 | 설치 방식 | **installer 제작** (oh-my-openagent 스타일) | 지금 바로 전역에 설치하지 않는다 |
| D11 | 이번 세션 (2026-09-20) | 전수조사·정합성 검사·README 재작성·install:local 수정·무결성 검증 구현 | `scripts/build-site.ts`의 `verifyIntegrity`, manifest sha256, dead export 제거 포함 |

## 3. 전제 (실측으로 확인)

| 전제 | 확인 방법 |
| --- | --- |
| OpenCode v2.0.10 | `opencode --version` |
| `hidden: true`로 build/plan 숨김 | `opencode debug agents` |
| markdown만으로 build/plan 숨김 가능 | 실측 |
| `default_agent` 동작 | 실측 |
| subagent tool에 model 파라미터 없음 | `ctx.tool.list()` 스키마 확인 |
| 런타임 모델 변경은 `.md` 편집으로 가능 | `session.hook("model.request")` 로그 |
| plugin `agent.transform`은 실행 모델 미반영 | 실측 (부정 결과) |
| `XDG_CONFIG_HOME` 무시 | 실측 |
| top-level `permissions`는 전 agent에 append | 실측 |

## 4. 컨벤션 적용

- `~/.claude/convention/` 의 문서를 기준으로 한다 (`~/AGENTS.md`가 참조).
- `docs/PROCESS.md`를 세션 간 상태 기준으로 삼는다.
- 커밋은 Conventional Commits, AI 트레일러 금지, 선별 스테이징.
- git 저장소: GitHub 원격 `https://github.com/B-HS/oh-pen.git`, `main` 단일 브랜치. Pages 배포는 `https://b-hs.github.io/oh-pen`.

## 5. 미해결 → 해소 완료

초기 미해결 항목 U1~U4는 모두 해소됐다.

| # | 항목 | 초기 선택지 | 해소 결과 |
| --- | --- | --- | --- |
| U1 | git 저장소 초기화 | `git init` 여부, 원격·Pages 설정 | 해소: GitHub 원격 `https://github.com/B-HS/oh-pen.git`, `main` 단일 브랜치, Pages 배포 |
| U2 | GitHub Pages 경로 | `<user>.github.io/oh-pencode` | 해소: `https://b-hs.github.io/oh-pen` |
| U3 | 인터뷰 UI 라이브러리 | `@clack/prompts` vs 자체 `readline` | 해소: `@clack/prompts` 채택 (src/interview.ts) |
| U4 | pen 허용 목록에 `*-pen` glob 사용 여부 | 확장 편의 vs 명시 통제 | 해소: **명시 목록** (사용자 결정, architecture.md §6) |
