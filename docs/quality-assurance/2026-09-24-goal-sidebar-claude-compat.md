# Goal·Todo sidebar와 Claude Code 호환 검증

## 대상

- `src/models.ts`, `src/interview.ts`, `src/cli.ts`: Codex·Claude 모델 프로필과 관리 root model 갱신
- `src/opencode-plugin.ts`, `src/opencode-plugin-status.ts`, `src/opencode-plugin-tui.tsx`: Goal·Todo 저장, context 유지, 우측 sidebar 표시
- `src/claude-compat.ts`, `src/install.ts`, `src/uninstall.ts`, `src/verify.ts`: Claude rule·command symlink와 project instruction 비활성화
- `assets/commands/goal.md`, `assets/agents/pen.md`: `/goal`과 상태 갱신 계약

## 자동 검증

| 명령 | 결과 |
| --- | --- |
| `bun run typecheck` | 통과 |
| `bun test` | 64 pass, 0 fail, 328 expect |
| `bun run build:site` | v0.4.0, 16 assets, 11 pages 생성 |
| `git diff --check` | 통과 |

테스트는 두 모델 프로필의 정확한 문자열, 사용자 model 보존과 관리 model 마이그레이션, Claude rule·중첩 command symlink, `pen_status` 최신 상태 선택과 단일 active 항목, TUI·goal 자산 해시와 runtime 권한을 직접 검사합니다.

## 실제 OpenCode V2 검증

- OpenCode v2.0.15 전역 설치를 v0.4.0 Codex 프로필로 갱신했습니다.
- root model은 `openai/gpt-6-sol#xhigh`, 일곱 specialist는 `openai/gpt-6-luna#max`로 해석됐습니다.
- `verify`에서 agent 등록·권한·16개 자산 해시·server/TUI plugin·`/goal`·Claude symlink·project instruction 비활성화·root model을 모두 통과했습니다.
- command registry에서 `/goal`, `/prepare-new`, `/llm-rules/process`, `/llm-rules/verify`를 포함한 Claude Code command 10개를 확인했습니다.
- 새 OpenCode TUI를 시작해 plugin import 오류 없이 `pen`과 GPT-6 Sol xhigh가 표시되는 것을 확인한 뒤 종료했습니다.

## 남은 경계

- Claude provider는 현재 OpenCode에 연결되어 있지 않아 Claude Opus 5.5·Sonnet 5 프로필의 실제 유료 호출은 실행하지 않았습니다. 모델 ID는 Anthropic 공식 모델 문서로 확인했고 installer는 연결되지 않은 모델을 대체하지 않습니다.
- sidebar의 상태 전이 파서는 회귀 테스트로, TUI plugin 로딩은 실제 기동으로 확인했습니다. 유료 모델을 호출하는 `/goal` 전체 왕복 smoke test는 실행하지 않았습니다.
- `~/.zshenv` 변경은 새 terminal process부터 적용됩니다. 기존 terminal의 부모 환경은 설치기가 바꿀 수 없습니다.

## README·웹 배포 후속

- README 상단 탐색에 Goal·Claude 호환 섹션을 연결하고 설치 직후 새 terminal이 필요함을 명시했습니다.
- 랜딩의 이전 `Available in v0.2` 표기를 v0.4로 바로잡고 Goal/Todo sidebar와 Claude Code rule·command 연결을 설명하는 전용 섹션을 추가했습니다.
- `bun test scripts/build-site.test.ts` 7건, `bun run typecheck`, `bun run build:site`의 v0.4.0 16 assets·11 pages 생성을 통과했습니다.
- 구현 커밋 `8274041`의 GitHub Pages run `35946220292`가 성공했으며, 공개 랜딩에서 `/goal <objective>`, `CLAUDE.md` 연결, project `AGENTS.md` 비활성화 안내를 확인했습니다.
