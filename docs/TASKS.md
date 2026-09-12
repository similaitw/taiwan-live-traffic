# TASKS.md

> Repository：`similaitw/taiwan-live-traffic`
>
> 執行方式：每次只完成一個 `Current task`。預設由 ChatGPT 直接透過 GitHub 實作與驗收；只有明確標示 `Executor: Codex` 才使用 Codex。

## Current task

### M5.1 — Road grouping

**Executor: ChatGPT**

目標／範圍：

- [ ] 從 Camera V2 `roadNumber` / `road` 自動建立道路群組與 Camera 數量。
- [ ] 至少能穩定辨識國道與主要省道，例如國1、國3、國5、台2、台7、台9。
- [ ] 桌面與手機提供道路篩選入口。
- [ ] 選定道路後，地圖與清單只顯示該道路 Camera。
- [ ] URL 支援 `road=<道路編號>`，分享／重開可恢復道路篩選。
- [ ] 不在本任務做上一支／下一支；留給 M5.2。
- [ ] GitHub Actions CI build 通過。

完成後將 Current task 更新成 M5.2 — Road navigator。

---

## 已完成任務

### M4.3 — Share / URL state（已完成）

**Executor: ChatGPT**

- [x] URL 同步 `q`、`type`、`camera`，使用 `history.replaceState`，不重載頁面。
- [x] 分享網址重開後恢復搜尋／類型，Camera 資料載入後恢復選取。
- [x] Camera 關閉時移除 `camera` query parameter。
- [x] 新增共用 `CameraShareButton`；支援 Web Share API 與複製網址 fallback。
- [x] 手機 Bottom Sheet 與桌面直播 overlay 都提供分享入口。
- [x] GitHub Actions run `34704132752` Build step 成功。

### M4.2 — 最近觀看（已完成）

- [x] 最近觀看最多 20 支，localStorage 持久化。
- [x] 手機／桌面開啟 Camera 詳細資訊時記錄。
- [x] 新增「最近」快速篩選並依最近順序排列。
- [x] 「收藏」與「最近」互斥。
- [x] CI run `34704005838` 成功。

### M4.1 — 收藏（已完成）

- [x] CameraCard / Bottom Sheet 收藏。
- [x] 桌面與手機「只看收藏」。
- [x] 移除 CameraCard 假 LIVE 紅點。
- [x] CI run `34703855243` 成功。

### M3 — 地圖效能（已完成）
- [x] M3.1 Marker clustering — CI `34703638881`
- [x] M3.2 Viewport optimization — CI `34703721411`

### M2 — UI 2.0（已完成）
- [x] M2.1 Mobile map-first layout
- [x] M2.2 Desktop sidebar layout
- [x] M2.3 Camera Bottom Sheet

### M1 — 基礎整理與資料模型（已完成）
- [x] M1.1 Camera V2 data model
- [x] M1.2 共用 geo utilities
- [x] M1.3 hooks 基礎拆分

---

## Milestones

### M1 — 基礎整理與資料模型
- [x] M1.1
- [x] M1.2
- [x] M1.3

### M2 — UI 2.0
- [x] M2.1
- [x] M2.2
- [x] M2.3

### M3 — 地圖效能
- [x] M3.1
- [x] M3.2

### M4 — 使用者功能
- [x] M4.1 收藏
- [x] M4.2 最近觀看
- [x] M4.3 Share / URL state

### M5 — 道路模式
- [ ] M5.1 Road grouping — **ChatGPT**
- [ ] M5.2 Road navigator
- [ ] M5.3 Nearby mode

---

## Executor 原則

預設：`ChatGPT`。只有大型跨檔重構、複雜除錯、必須依賴完整本機／瀏覽器 agent、或 ChatGPT 無法可靠完成與驗證時，才標示 `Executor: Codex`。一般 build 由 GitHub Actions 處理。
