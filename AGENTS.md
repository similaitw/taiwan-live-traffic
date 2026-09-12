# AGENTS.md

本專案以 GitHub `main` 為唯一狀態來源。目標是用最少模型額度完成小型、可驗收的增量任務。

## Executor 路由規則

- **預設 Executor = ChatGPT。** 能由 ChatGPT 透過 GitHub 直接完成、檢查與更新的工作，不交給 Codex。
- 只有 `docs/TASKS.md` 明確標示 `Executor: Codex` 的任務，才使用 Codex。
- 適合 Codex 的情況：大型跨檔重構、複雜除錯、需要長時間 agent 探索、或 ChatGPT 無法可靠完成／驗證的本機工作。
- 單純文件、型別、hooks、小型 API/UI 修改、任務拆分、review、GitHub 狀態更新，原則上由 ChatGPT 完成。
- Build / test 優先交由 GitHub Actions 自動驗證，不為了單純跑 build 消耗 Codex 額度。
- 若 Codex 被啟動但 Current task 沒有標示 `Executor: Codex`，不要執行任務；只回報應先交由 ChatGPT 處理。

## Codex 每次工作固定流程

1. 先讀 `AGENTS.md`。
2. 再讀 `docs/TASKS.md`。
3. 確認 Current task 明確標示 `Executor: Codex`；否則停止。
4. 只執行 `Current task`。
5. 先檢查該任務直接相關的程式檔，不要掃描整個 repository。
6. **只有任務內容不足以判斷產品／架構要求時，才讀 `docs/V2_SPEC.md` 的相關章節；不要預設整份讀取。**
7. 只修改完成 Current task 必要的檔案，不順手做下一個 milestone。
8. 執行必要測試；GitHub Actions 已負責一般 `npm run build` 驗證時，不重複做無必要工作。
9. 完成後更新 `docs/TASKS.md`，commit 並 push 到 `main`。
10. 回報：完成內容、測試結果、commit SHA、下一個 Current task。

## Token / 額度節省規則

- 不需要重新解釋專案背景；以 GitHub 檔案為準。
- 不要每次重讀 README、完整 V2_SPEC、完整 commit history。
- 不要為了了解一個型別或函式而讀不相關 UI/API 檔案。
- 優先使用精準搜尋與指定檔案讀取。
- 若 `docs/TASKS.md` 已寫明檔案範圍與驗收標準，以 TASKS 為主要上下文。
- 發現超出 Current task 的問題，只在完成回報中註記，不要自行擴充 scope。
- 不做大規模 rewrite，除非 Current task 明確要求。

## 開發原則

- 保持既有功能相容。
- 不破壞 `/api/cameras` 既有 response shape，除非任務明確要求。
- 不把 image proxy 改成任意 URL proxy；必須維持 hostname allowlist。
- 單一上游 CCTV 來源失敗不可造成整個 cameras API 失敗。
- UI 採 mobile-first；涉及 UI 時至少檢查 375px、768px、1280px。
- 不使用假 LIVE 狀態冒充真實攝影機狀態。
- 列表／地圖預覽優先 snapshot；MJPEG live 只有使用者主動要求時才啟動。

## Source of truth

- 執行狀態、Executor 與下一步：`docs/TASKS.md`
- V2 完整產品／架構規格：`docs/V2_SPEC.md`
- 實際程式狀態：`main`
- 自動 build 驗證：`.github/workflows/ci.yml`

若三者有衝突：實際程式狀態優先判斷相容性，任務範圍以 `docs/TASKS.md` 為準，產品方向以 `docs/V2_SPEC.md` 為準。
