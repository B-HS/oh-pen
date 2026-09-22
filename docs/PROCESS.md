# PROCESS

## 작업: 웹사이트·README 최종 정리 (2026-09-22)

- [x] a. 현재 소스·배포 화면 확인 — 문서의 `runtime.md` 링크 404, 중첩 404의 홈 경로 오류, 이전 설치 자산 예시·README 제거 설명 불일치 확인
- [x] b. README·설치 안내·홈페이지의 v0.2 사용 흐름 정리와 문서 링크 수정
- [x] c. 링크 회귀 검사·타입·빌드 및 데스크톱·모바일 화면 확인 — 회귀 2건 통과, HTML 11개·내부 링크 414건 정상, 주요 10개 페이지 390px 가로 넘침 없음
- [ ] d. 선별 commit·push·PR merge 및 배포 확인

사용자가 지정한 지속 목표인 웹사이트와 README 정리를 마무리합니다. 기존 디자인·모델·에이전트 실행 동작을 유지하며, 이번 후속 단계도 하위 에이전트 없이 메인이 직접 수행합니다.
검증 상세는 `docs/quality-assurance/2026-09-22-site-readme.md`에 기록합니다. 빌드 로그가 CSS를 페이지 수에 포함하던 표기도 실제 HTML 11개 기준으로 바로잡았습니다.

## 작업: 에이전트 고도화 8개 항목 구현과 통합 (2026-09-22)

- [x] a. 현재 구현·공식 계약 확인 및 작업 브랜치 준비 — `codex/agent-workflow-upgrade`, OpenCode CLI 도움말·로컬 OpenAPI 확인
- [x] b. 역할 권한 제한·review-pen·공통 위임 및 결과 계약 구현 (후보 1·3·5)
- [x] c. 설치 검증·에이전트 회귀 검사·CI 보강 (후보 2)
- [x] d. 별도 세션 실행·한도·결과 회수·취소 구현 (후보 4·6)
- [x] e. 체크포인트 재개·조사 근거 재사용 구현 (후보 7·8)
- [x] f. 설치·문서·사이트 통합 및 위험 비례 검증 — 49 tests 통과, typecheck·v0.2.0 빌드·13개 자산 임시 설치·해시·번들 계약 검증 성공
- [x] g. 선별 commit·브랜치 push·main merge·push와 배포 결과 확인 — `0b58949`, PR #1, merge `c639b8c`, Pages 성공·공개 자산 해시 일치

### 실행 계약

- 사용자 승인 범위: 조사에서 제안한 8개 항목 전체 구현, commit·push·merge. 이번 작업은 메인이 직접 수행합니다.
- 기존 시작 질문·모델 선택·설치 설정 보존·메인 전용 Git 통합 정책을 유지합니다.
- 기준: 사용자 AGENTS 지시 및 `~/.codex/llm-rules/{ai-process,common,comments,security,git}.md`.
- 검증: 재현 가능한 계약·권한·설치·실행/재개 회귀 테스트, 타입 검사, 배포 번들 빌드. 실제 외부 모델 사용 없이 주입 가능한 프로세스 경계로 실패·취소를 검증합니다.
- 결과물: agent 자산, Bun 기반 실행 도구, 설치/검증 코드, 자동 테스트와 CI, 사용자 문서. 기존 조사 기록을 보존합니다.
- 검증 기록: `docs/quality-assurance/2026-09-22-agent-runtime.md`. 외부 모델 호출과 사용자 전역 설치 갱신은 수행하지 않았습니다.
- 통합: [PR #1](https://github.com/B-HS/oh-pen/pull/1) 병합 완료. [main 배포](https://github.com/B-HS/oh-pen/actions/runs/35700535774) 성공, 공개 manifest v0.2.0·13개 자산과 설치기 해시 확인.

## 작업: 에이전트 고도화 후보 조사 (2026-09-22)

- [x] a. 현재 구성·권한·위임 계약 확인 — 메인 1종·전문 6종·built-in 숨김 2종, 모델 배정·검증·배포 경로 확인
- [x] b. 고도화 후보의 근거·효과·우선순위 정리 — 권한·검증·위임·실행 관리 우선 보완 4건과 기능 확장 4건 정리
- [x] c. 선택 가능한 목록 제시 — 아래 조사 결과를 기록했으며 후보 구현은 사용자 결정 전까지 미착수

### 범위와 기준

- 사용자는 현재 에이전트 확인과 고도화 방향 목록을 먼저 요청했으며, 구현 방향은 목록을 보고 결정합니다.
- 이번 작업은 메인이 직접 조사합니다. 에이전트·소스·설치 설정을 수정하거나 설치·모델 호출을 실행하지 않습니다.
- 기준: 사용자 제공 AGENTS 지시, `~/.codex/llm-rules/ai-process.md`, `common.md`, `security.md`, `docs/pen/architecture.md`, `docs/acknowledge/decisions.md`.
- 검증은 실제 정의·호출 경로·기존 테스트와의 대조에 한정하며, 실행하지 않은 동작은 확인된 사실로 보고하지 않습니다.

### 조사 결과: 우선 보완 후보

| 번호 | 대상 | 확인된 근거 | 제안 및 기대 효과 | 변경 규모 |
| --- | --- | --- | --- | --- |
| 1 | verify-pen·security-pen·sub-pen·pen | `verify-pen.md:18`은 shell 전체 허용, `security-pen.md:30`은 `npm audit *` 허용, `sub-pen.md:30`부터 일부 Git 명령만 개별 차단합니다. 프롬프트의 수정·Git 금지와 실제 권한 범위가 일치하지 않습니다. | 검증·감사 명령의 변경 옵션을 구분하고 실행 경계를 제한합니다. 셸 패턴만으로 파일 소유권까지 보장한다고 주장하지 않고 필요 시 실행 격리를 검토합니다. 정상적인 메인 Git 자율 실행은 유지합니다. | 중간~큼 |
| 2 | 설치 verify·에이전트 테스트·CI | `src/verify.ts:104`에서 runtime agent 누락을 건너뛰고 `:131`에서 hidden을 파일 존재로 판단합니다. 설치 파일의 manifest 해시 대조가 없고, `:63`의 모델 파서는 추가 `/`가 있는 모델 ID를 잘라냅니다. 배포 CI에는 `bun test` 단계가 없습니다. | 실제 등록·hidden·모델·설치 자산 무결성을 검사하고 권한·위임·실패 시나리오 회귀 검사를 배포 전에 실행합니다. 정상으로 잘못 판정하는 경우를 줄입니다. | 중간 |
| 3 | pen·전체 전문 에이전트 | `pen.md:162`의 위임 9개 항목은 이미 충실하지만 공통 입력 검증과 상태 형식은 없고, `sub-pen.md:100`의 BLOCKED 형식만 별도로 존재합니다. | 필수 계약 누락 시 착수하지 않도록 하고, 작업 ID·완료/부분 완료/차단·변경 파일·검증 근거를 공통 결과 형식으로 고정합니다. 검증 근거에는 변경 상태 식별값을 포함합니다. | 중간 |
| 4 | pen의 호출별 모델 실행 | `pen.md:178`부터 native child와 CLI 별도 세션을 구분하지만 `src/`·`scripts/`에는 이를 공통 관리하는 실행기가 없습니다. 종료·취소·재개·결과 회수는 프롬프트에 맡깁니다. | 별도 CLI 실행에 안전한 인자 전달, 구조화 출력 회수, 세션 ID, 실패·시간 제한·취소를 관리하는 계층을 추가합니다. 모델 실패 시 무단 대체하거나 설치 설정을 바꾸지 않습니다. | 큼 |

### 조사 결과: 기능 확장 후보

| 번호 | 대상 | 현재 상태 | 제안 및 기대 효과 | 변경 규모 |
| --- | --- | --- | --- | --- |
| 5 | 선택적 review-pen | `verify-pen.md:82`는 검사 실행 중심이고 독립적인 일반 코드 리뷰 역할은 없습니다. `pen`의 통합 리뷰와 `security-pen`의 보안 감사는 이미 존재합니다. | 동작 오류·회귀·설계·컨벤션을 읽기 전용으로 검토하는 역할을 추가합니다. 변경 위험이 있을 때만 호출하고 재현 가능한 지적·위치·영향을 반환합니다. | 중간 |
| 6 | pen의 역할 선택·작업 한도 | `pen.md:188`에 역할별 사용 시점은 있으나 동시 실행·단계·재시도·조사량 한도와 성과 기록은 없습니다. | 작업 유형별 역할 선택 기준, 선택 가능한 단계·시간 한도, 소요·실패·검증 성과 기록을 추가합니다. 시작 질문과 사용자가 선택한 모델은 유지합니다. | 중간 |
| 7 | pen의 중단 후 재개 | 재개 시 시작 질문은 `pen.md:136`에 있으나 자식 세션·소유 파일·선행 의존·완료 근거를 복원하는 공통 상태 계약은 없습니다. | 작업별 체크포인트에 세션 ID·작업 상태·소유 파일·검증 근거를 저장하고, 실제 파일 상태와 대조해 이어갑니다. workflow 선택은 재개 경계에서 다시 확인합니다. | 중간~큼 |
| 8 | explore-pen·research-pen·doc-pen | 역할 분리, 출처·버전 표시, 중복 문서 방지, 같은 조사 내 반복 검색 억제는 이미 있습니다. 조사 결과의 공통 재사용·무효화 기준은 없습니다. | 코드 탐색 결과는 변경 상태에, 외부 사실은 출처·대상 버전·확인 시점에 연결합니다. 다른 역할은 기존 근거를 먼저 사용하고 변경된 부분만 다시 조사합니다. | 중간 |

### 검증과 한계

- `bun test scripts/build-site.test.ts src/models.test.ts`: 10 pass, 0 fail, 30 expect 호출. 기존 테스트는 설치 스크립트 문구·pen 프롬프트 문구·모델 문자열 처리 중심입니다.
- OpenCode 공식 [권한](https://opencode.ai/v2/docs/permissions/), [에이전트](https://opencode.ai/v2/docs/agents/), [CLI](https://opencode.ai/v2/docs/cli/commands/) 문서를 확인했습니다. 셸은 호스트 권한으로 실행되며 좁은 허용 목록이 권장됩니다. `steps`와 `run --format json`은 공식 계약에 존재합니다.
- 권한 문제는 정적 설정과 공식 규칙을 대조한 결과이며, 금지 명령·실제 모델 호출·설치본 변경을 실행한 결과가 아닙니다.
- 이번 작업은 조사 요청이므로 소스·에이전트 정의·설치 설정·원격 저장소를 변경하지 않습니다. 후보 목록과 조사 상태만 이 문서에 기록합니다.

## 작업: 호출별 workflow 모델 지정과 설치 설정 보존

- [x] a. OpenCode V2 공식 계약·CLI 확인 — native `subagent`에는 모델 인자가 없고 `opencode run --agent --model`은 별도 실행의 호출별 선택임을 확인
- [x] b. 기존 agent 모델을 변경하지 않는 호출별 모델 지정 실측 — `opencode run --agent research-pen --model openai/gpt-5.6-terra#medium` 성공, 세션 export에서 역할·모델 확인, `parentID` 없음
- [x] c. pen 자산·회귀 검사 수정 — 사용자 지정 모델은 CLI 플래그로 전달하고 설치된 `.md`/config는 변경하지 않음
- [x] d. README·설계·합의·사이트 동기화 — native child와 CLI 별도 실행의 차이, 한계와 사용법 명시
- [x] e. 최소 검증·설치본 갱신·선별 커밋·일반 push·Pages 확인

### 완료 기준

1. A(기본 GPT)는 설치된 역할 모델을 그대로 사용한다.
2. B(상속)·C(역할별 지정)는 설정 파일 변경 없이 호출 시 `--agent`·`--model`로 적용한다.
3. 한 작업의 모델 선택이 후속 작업의 설치 모델을 바꾸지 않는다.
4. CLI 별도 실행이 native subagent child와 다른 점을 명확히 설명한다.

### 검증 근거

- `bun test scripts/build-site.test.ts`: 5 pass, 0 fail.
- `bun run typecheck`: 성공.
- `bun run build:site`: 9 assets, 11 pages 생성.
- `git diff --check`: 성공.
- OpenCode v2.0.10에서 `research-pen`에 `--model openai/gpt-5.6-terra#medium`을 적용한 별도 세션을 확인했다. 설치본 재갱신 후에도 research agent와 root config의 SHA-256이 갱신 전과 동일하다.
- `3f8730c`를 `main`에 일반 push했고, Pages 실행 `35565301918`의 build·deploy가 성공했다. 공개 `/oh-pen/assets/agents/pen.md`와 랜딩 페이지에 새 지시가 반영된 것을 확인했다.

## 작업: workflow·모델 시작 질문 복구

- [x] a. 현재 동작과 회귀 원인 확인 — D13·D14에서 시작 질문을 자동 판단으로 바꾸고 설치된 `research-pen`의 GPT 기본 모델을 즉시 사용하도록 만든 충돌 확인
- [x] b. `pen` 시작 계약 복구 — 새 도구 작업마다 workflow와 모델 선택을 한 번에 묻고 답 전 실행을 금지
- [x] c. 문서·사이트·회귀 계약 동기화 — 기본 GPT 배정, 직접 지정·상속, 답변 이후 자율 Git 범위를 일치시키고 회귀 검사 2건 추가
- [x] d. 저장소·설치본 검증 — 테스트 9건·타입검사·사이트 빌드·OpenCode v2.0.10 runtime 질문 계약과 GPT 모델 해석 확인
- [x] e. 설치본 갱신·선별 commit·일반 push·Pages 배포 확인 — `a807429`, Actions `35546675043`, 공개 asset·랜딩 반영 확인

### 완료 기준

1. 새 도구 사용 작업은 실행 전에 workflow와 subagent 모델 선택을 함께 묻는다.
2. 기본 선택은 현재 GPT 역할 배정(Sol·Terra·Luna)을 유지한다.
3. 사용자는 primary 상속 또는 OpenCode에 연결된 역할별 모델을 선택할 수 있다.
4. 선택 이후 구현·검증·선별 commit·일반 push는 추가 승인 없이 완료한다.
5. 저장소 asset, 실제 설치본, README, GitHub Pages 문서가 같은 계약을 설명한다.

### 검증 결과

| 검증 | 결과 |
| --- | --- |
| `bun run typecheck` | 통과 |
| `bun test` | 9건 통과, 실패 0건 |
| `bun run build:site` | 9 assets, 11 pages 생성 |
| 실제 설치본 upgrade | 9 agent 파일 갱신, 기존 GPT 모델 배정 유지, 10개 파일 백업 |
| `opencode debug agents` | `asksWorkflow=true`, `asksModel=true`, `blocksBeforeAnswer=true` |
| runtime 모델 | `pen=gpt-5.6-sol#high`, `research-pen=gpt-5.6-luna#medium` |
| GitHub Pages | Actions `35546675043` 성공, 공개 pen asset과 랜딩의 시작 질문 계약 확인 |

## 작업: 스트림 설치 TTY·프롬프트 UI 수정

- [x] a. 스크린샷과 실행 경로 진단 — `curl | bash`의 파이프 stdin 상속으로 방향키 escape sequence가 노출되고 좁은 터미널에서 안내 박스가 넘치는 현상 확인
- [x] b. 실패 재현 — 파이프 stdin을 상속한 PTY에서 `↓`·Enter가 `^[[B`로 출력되고 선택이 진행되지 않는 현상 재현
- [x] c. TTY 전달·반응형 프롬프트 수정 — 대화형 설치만 읽기·쓰기가 가능한 터미널 fd를 입력으로 사용하고 박스형 장문 안내를 짧은 흐름형 UI로 교체
- [x] d. 위험 비례 검증 — 테스트 7건·타입검사·사이트 빌드·45열 PTY 방향키/Enter·비대화형 dry-run 통과
- [x] e. 선별 staging·Conventional Commit·일반 push 및 Pages 배포 확인 — `fbc646a`, Actions `35544944702`, 공개 PTY 입력 통과

### 완료 기준

1. 문서의 `curl ... | bash` 설치 명령에서 방향키와 Enter가 정상 동작한다.
2. `--no-interview`와 제어 터미널이 없는 자동화 환경은 기존처럼 실행된다.
3. 좁은 터미널에서도 초기 안내 UI가 잘리거나 가로로 넘치지 않는다.
4. 생성된 `install.sh`와 공개 GitHub Pages 배포본이 같은 수정 계약을 가진다.

### 검증 결과

| 검증 | 결과 |
| --- | --- |
| `bun run typecheck` | 통과 |
| `bun test` | 7건 통과, 실패 0건 |
| `bun run build:site` | 9 assets, 11 pages 생성 |
| 대화형 스트림 설치 | 45열 PTY에서 `↓`로 선택 이동 후 Enter로 다음 질문 진입 |
| 비대화형 설치 | 터미널 없는 `--no-interview --dry-run` 통과 |
| GitHub Pages | Actions `35544944702` 성공, 공개 `curl | bash` 설치에서 `↓`·Enter 동작 확인 |

## 작업: README·GitHub Pages 문서 경험 고도화

- [x] a. 현재 배포본과 생성 소스 시각·구조 감사 — 랜딩의 과도한 카드 나열, 모바일 문서 내비게이션 부재, 문서형 위계 부족 확인
- [x] b. README 정보 구조 재작성 — 빠른 설치, 자율 실행 흐름, 에이전트·모델·Git·문서화 계약을 실제 동작 기준으로 정리
- [x] c. GitHub Pages 랜딩·문서 셸 재설계 — 제품 개요와 문서 탐색이 분리되는 반응형 문서 포털 구현
- [x] d. 접근성·반응형·링크·HTML 무결성 검증 — 데스크톱·모바일·다크 모드 렌더, 모바일 문서 메뉴, 329개 내부 링크 확인
- [x] e. GitHub Pages 배포 확인 — Actions `35515014150` 성공, 공개 랜딩·에이전트 설계 문서의 새 렌더 확인
- [x] f. 선별 staging·Conventional Commit·일반 push — `e31cb84`를 `origin/main`에 push 완료

### 완료 기준

1. README만 읽어도 설치, 동작 흐름, 모델 선택, 자율 Git 범위, `doc-pen` 산출 위치를 이해할 수 있다.
2. 랜딩은 핵심 가치와 설치를 먼저 보여주고, 상세 내용은 문서 탐색으로 연결한다.
3. 문서 페이지는 데스크톱의 좌측 내비게이션·본문·우측 목차와 모바일 문서 내비게이션을 제공한다.
4. 라이트·다크 테마, 키보드 포커스, 축소 모션, 가로 넘침 없는 모바일 레이아웃을 유지한다.
5. 빌드·타입검사·내부 링크 검사·실제 브라우저 시각 검증을 통과한 결과만 배포한다.

### 검증 결과

| 검증 | 결과 |
| --- | --- |
| `bun run typecheck` | 통과 |
| `bun test` | 5건 통과, 실패 0건 |
| `bun run build:site` | 9 assets, 11 pages 생성 |
| HTML 무결성 | HTML 10개, 내부 링크 329개, 누락 0, 중복 ID 0, 페이지별 H1 1개 |
| 실제 브라우저 | 1440px 랜딩·3열 문서, 모바일 랜딩·문서 메뉴, 다크 모드, 복사 버튼 확인 |
| GitHub Pages | [Actions run 35515014150](https://github.com/B-HS/oh-pen/actions/runs/35515014150) 성공, [공개 사이트](https://b-hs.github.io/oh-pen/) 반영 확인 |

## 작업: 에이전트 자율 실행 고도화

- [x] a. 사용자 결정 확정 — 모델은 설치값 기본·명시 override, 일반 commit/push 자동 허용, doc-pen은 `docs/**` 문서화
- [x] b. 7개 custom agent 프롬프트·권한 고도화 — 자율 workflow·모델 override·역할 경계·untrusted content 계약 반영
- [x] c. asset 무결성 검사를 역할 계약까지 강화 — Git·docs·시크릿·역할별 permission 필수 조각 단언
- [x] d. README·설계·합의 문서를 실제 동작과 동기화 — D13~D16 기록
- [x] e. 위험 비례 검증 및 OpenCode 해석 확인 — test 5건·typecheck·site build·v2.0.10 debug agents 통과
- [x] f. 선별 staging·Conventional Commit·일반 push — `4c5d956`을 `origin/main`에 push 완료

### 상세

1. 당시 `pen`의 매 작업 workflow·모델 질문을 제거했으나, 이 결정은 2026-09-21 D17에서 폐기했다. 현재는 시작 질문 이후 구현·검증·commit·push를 중단 없이 완료한다.
2. 설치 시 `convention`·`inherit`·사용자 지정 모델을 지원하고, 런타임 모델 변경은 사용자가 명시했을 때만 수행한다.
3. `doc-pen`은 재사용 가치가 있는 공식 사용법을 main이 지정한 `docs/**` 경로에 저장하고 다른 경로는 수정하지 않는다.
4. 일반 Git commit·push는 `pen`에 허용하고, force push·이력 파괴·복구하기 어려운 삭제만 금지한다. subagent는 Git 통합을 하지 않는다.
5. 읽기 전용 역할은 불필요한 mutation 도구를 차단하되 조사·탐색·검증의 자율 실행에 필요한 도구는 유지한다.

## 작업: assets/agents 품질 감사

- [x] a. 감사 범위·실행 방식 확정 — `assets/agents` 전수, workflow 미사용, 컨펌 전 에이전트 파일 수정 금지
- [x] b. 에이전트별 역할·권한·프롬프트 계약 감사 — 9개 asset 전수 확인
- [x] c. OpenCode V2 공식 계약·다중 모델 호환성 대조 — v2.0.10 `debug agents` 및 최신 공식 문서 대조
- [x] d. 고도화 필요성·우선순위·구체 변경안 사용자 컨펌 — 전면 고도화 및 자율 Git·사용자 모델·doc 문서화 승인

### 감사 기준

1. 역할 경계와 위임 조건이 겹치지 않고 선택 가능해야 한다.
2. 지시가 특정 모델의 추론 습관에 의존하지 않고 완료 조건·근거·보고 형식을 명시해야 한다.
3. 권한은 역할 수행에 필요한 최소 범위이며 프롬프트 계약과 실제 frontmatter가 일치해야 한다.
4. OpenCode V2의 agent·permission·system 대체 동작과 현재 설치·검증 계약에 맞아야 한다.
5. 고도화안은 실제 파일 변경 전에 사용자 확인을 받는다.

### 감사 결과

- 공통: Markdown body가 provider별 기본 system prompt를 대체하므로, 현재 본문만으로 tool loop·지속 실행·권한 경계까지 자급자족해야 한다.
- 공통: 기본 permission이 allow이므로 edit·shell만 막아도 MCP·execute 등 새 action은 허용된다. 읽기 전용 agent는 deny-all 뒤 역할별 allow가 필요하다.
- `pen`: workflow 답변 전 조사 허용 문구, 영구 설정을 바꾸면서 선택을 저장하지 않는다는 문구, auto-mode와 실제 permission 사이에 충돌이 있다.
- `pen`·`sub-pen`: 읽기/진단 요청과 변경 요청의 권한 경계, 외부 문서·저장소의 prompt injection 무시 규칙이 부족하다.
- `doc-pen`: 전 문서 통독·원문 전재 지시는 대형 문서와 인용 제한에서 비현실적이며 핵심 계약 추출 방식으로 바꿔야 한다.
- `verify-pen`: 실제 출력 전체 전재는 시크릿·토큰·출력량 위험이 있고, 검증 명령의 파일 생성 가능성과 무편집 계약을 구분하지 않는다.
- `security-pen`: 정적 읽기만으로 의존성 취약점·실제 도달 가능성을 완전히 판정한다고 기대해 역할과 권한이 충돌한다.
- `research-pen`·`doc-pen`: 조사와 공식 문서 계약 추출의 선택 기준이 겹치며, 불확실성·상충 근거의 판정 형식을 더 구조화해야 한다.
- `build`·`plan`: 숨김 override는 v2.0.10에서 의도대로 해석되며 현재 목적에는 적절하다.

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
- plugin `agent.transform`은 registry만 바꾸고 세션 실행 모델에는 반영되지 않는다 (실측). 당시 native child의 지속 설정에 agent `.md` 편집을 사용했으나 작업별 모델 선택은 D18에 따라 CLI 플래그를 사용한다.
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
