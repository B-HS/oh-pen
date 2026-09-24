---
description: "현재 세션의 지속 목표를 설정하고 Todo를 우측 사이드바에 표시"
agent: pen
subagent: false
---

현재 세션의 목표를 다음 내용으로 설정하세요: $ARGUMENTS

먼저 `pen_status`를 한 번 호출하세요. `goal`에는 위 목표를 정확히 정리하고, `todos`에는 목표를 달성할 수 있는 구체적인 작업을 순서대로 넣으세요. 첫 작업만 `in_progress`, 나머지는 `pending`으로 설정하세요. 이후 각 작업이 끝날 때마다 전체 목록을 새 상태로 다시 호출하고, 목표가 달성될 때까지 같은 목표를 유지하세요.
