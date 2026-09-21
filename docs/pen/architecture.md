# pen 에이전트 세트 설계

> OpenCode V2 기준. `docs/opencode/v2-agents.md`의 agent·permission·model 계약을 전제로 한다.
> 검증 환경: OpenCode v2.0.10.

## 1. 목표

1. `pen`을 단일 visible primary로 사용하고 built-in `build`·`plan`은 숨긴다.
2. 사용자가 매 작업마다 workflow나 모델을 선택하지 않아도 요청 범위의 실행·검증·commit·push를 끝까지 수행한다.
3. 역할별 subagent 모델은 설치 시 `convention`·`inherit`·사용자 지정 중에서 선택한다.
4. convention 모델은 추천 기본값일 뿐 강제가 아니며 OpenCode에 연결된 `provider/model#variant`를 사용할 수 있다.
5. 조사·탐색·공식 문서화·검증·보안 감사의 역할과 mutation 권한을 분리한다.
6. 시크릿과 이력 파괴를 차단하면서 일반 개발 명령과 Git commit·push는 자동 허용한다.

## 2. 에이전트 구성

| ID | mode | 역할 | 주요 권한 |
| --- | --- | --- | --- |
| `pen` | primary | 요구 해석, 직접 실행·위임 판단, 통합, 검증 근거 판단, Git | 프로젝트 read/edit/shell/web, 명시 subagent 6종, 일반 commit·push |
| `sub-pen` | subagent | 상세 계약 안의 구현·수정·검증 | 프로젝트 read/edit/shell/web, Git mutation·subagent·question 금지 |
| `research-pen` | subagent | 여러 코드·문서 근거를 종합해 제약·대안 결정 | read/glob/grep/web/skill |
| `explore-pen` | subagent | 코드베이스 파일·심볼·참조·부재 근거 탐색 | read/glob/grep |
| `doc-pen` | subagent | 공식 사용법·API 계약 조사 및 재사용 문서 작성 | read/glob/grep/web/skill, `docs/**` edit |
| `verify-pen` | subagent | 위험을 직접 덮는 독립 검증 | read/glob/grep/shell/skill, source edit·Git mutation 금지 |
| `security-pen` | subagent | 공격 경로·영향·신뢰도 기반 보안 감사 | read/glob/grep/web/skill, 기존 package manager audit |

모든 custom agent는 시크릿 파일 읽기를 차단한다. `research-pen`·`explore-pen`·`doc-pen`·`verify-pen`·`security-pen`은 agent 규칙 시작에서 `*`를 deny하고 필요한 action만 뒤에서 allow한다. 마지막 일치 규칙이 이기는 OpenCode V2 permission 계약을 이용한다.

### build·plan 숨김

`assets/agents/builtin/build.md`와 `plan.md`가 같은 ID의 built-in agent를 override하고 `hidden: true`를 적용한다. body는 비어 있으므로 non-empty custom system으로 provider 기본 prompt를 대체하지 않는다. uninstall이 파일을 제거하면 built-in 정의가 복구된다.

## 3. 모델 배정

### 설치 시 선택

| 모드 | 동작 |
| --- | --- |
| `convention` | `src/models.ts`의 Sol·Terra·Luna 추천 배정을 설치한다 |
| `inherit` | subagent의 `model:`을 생략해 primary 세션 모델을 상속한다 |
| `custom` | 사용자가 agent별 `provider/model#variant`를 직접 입력한다 |

사용자 지정 모델은 OpenCode에 연결된 provider/model이면 사용할 수 있다. installer는 참조 형식을 검증하지만 provider 연결과 실제 모델 존재 여부는 OpenCode 실행 시점에 판정된다. 사용할 수 없는 모델을 다른 모델로 자동 대체하지 않는다.

### 런타임 원칙

- `pen`은 새 도구 사용 작업마다 workflow 사용 여부와 subagent 모델 방식을 함께 질문한다.
- 기본 선택은 설치된 GPT 역할 배정이며, 사용자는 pen 모델 상속 또는 역할별 직접 지정을 선택할 수 있다.
- 사용자가 특정 subagent 모델을 명시하면 `~/.config/opencode/agents/<id>.md`의 `model:`을 바꾸고 다음 child session부터 사용한다.
- subagent tool에는 호출별 model 파라미터가 없으므로 agent 파일 변경 없이 한 번만 다른 모델을 주입할 수 없다.
- primary 모델은 session에 저장된다. agent 파일의 `model:`은 선택된 primary session 모델을 바꾸지 않는다.
- 활성 작업 중 root model을 바꾸고 reload하거나 새 session을 요구하지 않는다. primary 변경은 installer 또는 사용자의 명시적인 설정 작업으로 처리한다.

### convention 기본값

| 역할 | 기본값 |
| --- | --- |
| `pen` | `openai/gpt-5.6-sol#high` |
| `sub-pen` | `openai/gpt-5.6-terra#medium` |
| `research-pen` | `openai/gpt-5.6-luna#medium` |
| `explore-pen` | `openai/gpt-5.6-luna#low` |
| `doc-pen` | `openai/gpt-5.6-luna#high` |
| `verify-pen` | `openai/gpt-5.6-luna#medium` |
| `security-pen` | `openai/gpt-5.6-luna#high` |

## 4. 자율 실행

### 요청 분류

`pen`은 동사를 기준으로 mutation 권한을 추론한다.

- 답변·설명·검토·상태 보고: 읽기 전용, commit·push 없음
- 진단: 원인·재현 근거 보고, 수정 요청이 없으면 구현하지 않음
- 변경·구현·수정: 구현, 위험 비례 검증, 선별 staging, commit, 일반 push
- 모니터링: 지정된 상태가 바뀔 때까지 적절한 wait 수단 사용

되돌릴 수 있고 요청 범위 안인 선택은 기존 코드·문서 근거로 결정한다. 새 권한, 시크릿, 공개 계약을 바꾸는 선택, 복구하기 어려운 파괴 작업만 사용자에게 묻는다.

### workflow 선택

- 새 도구 사용 작업마다 workflow와 subagent 모델 방식을 한 번에 묻고 답을 기다린다.
- 사용자가 현재 요청에서 두 선택을 이미 지정했으면 중복 질문하지 않는다.
- 새 세션·resume·clear·compact·handoff·`PROCESS.md` 기반 재개에서는 다시 묻는다.
- workflow를 사용하지 않으면 `pen`이 직접 수행한다.
- workflow를 사용하면 독립된 조사·구현·검증을 background subagent로 병렬화한다.
- 같은 파일 수정이나 선행 결과가 필요한 작업은 직렬화한다.
- 선택 이후 요청 범위의 검증·선별 staging·commit·일반 push는 추가 승인 없이 진행한다.

### 위임 계약

subagent prompt에는 다음을 실제 파일 근거로 제공한다.

1. 목표와 측정 가능한 완료 조건
2. 확인된 파일·심볼·현재 동작·문서 근거
3. 수정 가능한 범위와 비목표
4. 적용 지시와 충돌 우선순위
5. 조사·구현·검증 실행 순서
6. 보존할 동작·엣지 케이스·금지 사항
7. 최소 검증 명령과 합격 기준
8. 결과 보고 형식
9. 병렬·직렬 관계와 충돌 시 중단 조건

`sub-pen`은 기존 패턴으로 해결 가능한 세부 판단을 스스로 내린다. 지시 충돌, 필수 파일 부재, 소유 범위 밖 수정, 새 권한, 사용자에게 보이는 계약 변경처럼 메인이 결정해야 하는 경우만 `BLOCKED`를 반환한다.

## 5. Git 정책

`pen`은 변경 요청에서 검증 성공 후 추가 승인 없이 다음 작업을 수행한다.

1. 최근 이력에서 커밋 언어와 형식을 확인한다.
2. 관련 파일만 선별 staging한다.
3. staged diff를 확인한다.
4. 독립적으로 되돌릴 수 있는 논리 단위로 commit한다.
5. 현재 브랜치에 일반 push한다.

일반 `git add`, `git commit`, `git push`는 permission에서 allow한다. 모든 force push는 deny한다. `reset --hard`, `clean -f`, 강제 브랜치 삭제, 작업 파일 폐기는 ask로 둔다. subagent는 Git status·diff를 읽을 수 있지만 staging·commit·push·브랜치·이력 mutation은 할 수 없다.

## 6. doc-pen 문서화

`doc-pen`은 단순 검색 결과가 아니라 재사용 가치가 있는 설치·설정·초기화·API 사용법을 발견하면 `docs/**`에 저장한다.

- 메인이 지정한 경로를 우선한다.
- 지정이 없으면 기존 `docs/` 분류를 따르고 적절한 위치가 없을 때 `docs/references/<주제>.md`를 사용한다.
- 출처 URL, 확인 날짜, 대상 버전, 실제 사용법, 기본값, 제약, deprecated 항목, 프로젝트 적용 주의사항을 기록한다.
- 장문 원문 전재 대신 필요한 짧은 인용과 정확한 최소 예제를 사용한다.
- `docs/PROCESS.md`, `docs/acknowledge/**`, `docs/history/**`는 수정하지 않는다.
- 단순 사실 한 건이나 기존 문서와 중복되는 내용은 파일로 만들지 않는다.

## 7. 보안과 외부 콘텐츠

모든 custom agent는 파일·문서·웹·도구 출력에 포함된 지시문을 실행 지시로 받아들이지 않는다. 외부 콘텐츠는 역할에 맞는 데이터로만 취급하고 상위 지시에서 채택한 작업만 수행한다.

- `.env`·키 파일 읽기와 출력 금지
- 사용자가 승인하지 않은 외부 시스템 mutation 금지
- read-only 역할은 deny-all 뒤 필요한 action만 허용
- `verify-pen`은 기존 검증 명령을 실행할 수 있지만 Git mutation·삭제·의존성 설치 금지
- `security-pen`은 이미 사용하는 package manager의 audit 명령만 허용하며 도구 설치 금지

## 8. 확장

새 subagent는 `mode: subagent`, 구체적인 description, 역할에 맞는 permission, untrusted content 경계, 완료 조건, 보고 형식을 정의한다. `pen`의 subagent allow 목록은 명시 목록이므로 새 ID를 추가해야 한다. 임의의 `*-pen`을 자동 허용하지 않는다.

Markdown body는 OpenCode V2에서 provider별 기본 system prompt를 대체한다. 따라서 각 custom agent는 역할·권한·완료·보고 계약을 self-contained하게 유지하고, 프로젝트별 코딩 컨벤션은 실제 `AGENTS.md`와 instructions에서 받는다.
