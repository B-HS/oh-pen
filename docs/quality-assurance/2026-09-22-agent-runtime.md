# 에이전트 실행 체계 v0.2.0 검증

## 대상 파일

- 역할 자산: `assets/agents/*.md`, 신규 `review-pen.md`
- 실행·계약·상태: `src/agent-contract.ts`, `src/runtime*.ts`
- 설치·배포: `src/install.ts`, `src/verify.ts`, `src/models.ts`, `src/fs.ts`, `scripts/build-site.ts`, `.github/workflows/deploy.yml`
- 안내: README, `docs/pen/{architecture,installer,runtime}.md`, 사이트 페이지

## 리포트

제안한 8개 고도화 항목을 구현했습니다. 역할별 권한과 공통 입력·결과 계약, review-pen, 호출별 모델을 사용하는 별도 세션 실행, 시간·단계·재시도·출력·동시 실행 한도, 취소·재개·상태 저장, 근거 재사용과 성과 집계를 추가했습니다. 설치 자산은 13개이며 사이트는 12페이지입니다.

## 실행 결과

| 검사 | 결과 |
| --- | --- |
| `bun test` | 49 pass, 0 fail, 155 expect 호출, 7개 파일 |
| `bun run typecheck` | exit 0 |
| `bun run build:site` | exit 0, v0.2.0, 13 assets, 12 pages |
| 설치기·runtime 배포 번들의 `--help` | 모두 exit 0 |
| 배포 자산 임시 경로 설치 | 13개 설치, manifest 버전·각 파일 sha256 일치 |
| 설치된 runtime으로 문서의 작업 JSON `validate` | exit 0, valid=true |
| `git diff --check` | 오류 없음 |

임시 설치 검사에는 배포 manifest의 자산 목록과 sha256을 사용했습니다. 기존 사용자 전역 설정은 변경하지 않았으며 임시 경로는 검사 후 삭제했습니다.

## 통합·배포 결과

- 구현 커밋 `0b58949`, [PR #1](https://github.com/B-HS/oh-pen/pull/1), main 병합 커밋 `c639b8c`.
- [PR 검사](https://github.com/B-HS/oh-pen/actions/runs/35700384669): frozen install·typecheck·test·build 성공.
- [main 배포](https://github.com/B-HS/oh-pen/actions/runs/35700535774): build·deploy 성공.
- 공개 사이트의 manifest v0.2.0, 자산 13개, 설치기 응답을 직접 조회했습니다. 모든 자산이 HTTP 200이며 공개 manifest 해시와 로컬 빌드의 해시가 일치하고 설치기 해시도 일치했습니다.

## 검증 상세

- 실제 Markdown 권한 규칙에서 Git 변경·재위임·비밀 파일 접근·검사 자동 수정·audit fix를 거부하는지 검사했습니다. 설치 검증은 runtime 등록 누락, built-in hidden 불일치, 파일 변조, 모델 ID 잘림과 권한 override를 실패로 처리합니다.
- 주입 가능한 OpenCode 전송 경계로 완료·잘못된 결과·소유 범위 밖 변경·재시도 한도·시간 초과·취소·서버 중단 실패를 재현했습니다. 중단 완료 뒤 파일 상태를 저장하며 죽은 프로세스의 소유 파일 변경을 복구할 수 있습니다.
- 동일 완료 작업은 재호출하지 않고 입력이 바뀌면 재사용을 거부합니다. 코드 근거의 파일 변경과 외부 근거의 버전 불일치를 검사했습니다. 실제 자식 프로세스로 출력 크기 초과와 비정상 종료를 확인했습니다.
- 2026-09-22 로컬 OpenCode V2 도움말과 OpenAPI의 세션 생성·메시지 조회·interrupt 계약을 확인했습니다. 모델·에이전트를 실제 응답과 대조하고 사용량 미제공은 null로 남깁니다.

## 한계와 후속 검증 조건

- 실제 외부 모델을 호출하는 종단 검사는 수행하지 않았습니다. 모델 연결·과금·실제 서버 권한 승인은 설치 환경에서 작은 읽기 전용 계약으로 확인해야 합니다. 테스트는 실제 OpenAPI 응답 형태의 fixture를 사용합니다.
- 권한 패턴과 snapshot은 운영체제 격리가 아닙니다. 프로젝트 검사 script 자체의 부작용, Git ignore 파일, 다른 프로세스의 동시 변경은 메인이 확인해야 합니다. 공유 디렉터리의 수정 작업은 직렬 실행합니다.
- 전원 차단 또는 잠금·체크포인트 생성 사이의 강제 종료는 자동 정리 대상이 아닙니다. 정상 체크포인트가 없는 잠금은 원격 세션과 다른 실행이 끝났는지 확인한 뒤 수동으로 처리해야 합니다. 재현을 위해 프로세스를 강제 종료하는 장애 주입 검사는 생략했으며, 무인 장기 운영에 도입할 때 추가 검증합니다.
- 명령 성공·근거 요약은 모델의 구조화된 보고입니다. 실행 도구는 계약과 파일 변경을 대조하지만 모든 내용을 독립적으로 증명하지 않습니다. 메인은 실제 diff와 출력 근거를 점검해야 합니다.
