# history: 전수조사와 docs 정합성·installer 무결성 (2026-09-20)

## 대상

- 저장소: `/Users/hyunseokbyun/development/oh-pencode`
- 커밋: `01398d8` fix, `3d1a31d` docs, `b53fa75` docs
- 배포: <https://b-hs.github.io/oh-pen/> (run 35506556970, success)

## 조사 (읽기 전용 에이전트 4종 병렬)

| 에이전트 | 범위 | 결과 |
| --- | --- | --- |
| explore-pen | 저장소 전수 인벤토리 | 파일 32개, dead export 5개, asset frontmatter 표 |
| research-pen | docs 6개 + README vs 구현 | 실불일치 33, 부분일치 8, 문서누락 12, 해소된 역사 3 |
| verify-pen | 실행 기준값 명령 8종 | verify 27개 통과, install:local exit 1 실패 확인, --dry-run 단독 인터뷰 걸림 |
| security-pen | install.sh 신뢰 모델·권한 | high 2 (무결성 검증 전무, .env deny의 shell 우회), medium 2, low 3 |

## 수정 (워크스트림 2종 병렬)

### A2 코드 (`01398d8`)

- `install:local` 회귀: `--base-url ./dist`가 manifest+`assets/`를 해석하도록 `localAssets`에 `assetPrefix`·`assets`·`sha256` 옵션 추가
- 무결성: `buildManifest`가 sha256 맵 기록, install.sh가 다운로드 후 검증(불일치 exit 1), CLI read 경로도 검증, 구버전 manifest는 경고 후 건너뜀
- 경로 검증: `assertSafeAssetPath`(install), `containedTarget`(uninstall)
- `http://` base-url 거부, JSONC 재작성 고지
- dead export 5개 제거

### A1 문서 (`3d1a31d`)

- installer.md 17항목, v2-install-surface.md 9항목, architecture.md 8항목, decisions.md 3항목, PROCESS.md 5항목, v2-agents.md 1항목

## 검증

- 독립 verify-pen: 명령 8종 전부 실행, install.sh 변조 차단(exit 1) 재현, 서버·TMP 잔존 없음, `~/.config/opencode` 무변경
- 배포 확인: Pages manifest에 sha256 맵 10키 반영
- 잔여 정밀도 1건(installer.md sha256 키 서술) 수정 후 재커밋 없이 `3d1a31d`에 포함

## 알려진 제약 (수정하지 않음)

- `.env` read deny는 read tool만 막고 shell 경로는 막지 않는다 (전역 기본 allow). `docs/pen/architecture.md` §7에 기록
- upgrade의 `model:` 줄 보존, `--restore`, 실패 시 롤백, JSONC 재파싱 검증은 미구현 (문서에 명시)
- install.sh도 같은 origin에서 오므로 해시 검증은 부분 침해 완화이며 origin 전체 침해 시에는 `oh-pencode.ts` 교체가 더 강력하다
