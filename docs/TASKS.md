# TASKS.md

> Repository：`similaitw/taiwan-live-traffic`
>
> 執行方式：每次只完成一個 `Current task`。預設由 ChatGPT 直接透過 GitHub 實作與驗收；只有明確標示 `Executor: Codex` 才使用 Codex。

## Current task

### M4.3 — Share / URL state

**Executor: ChatGPT**

目標／範圍：

- [ ] 將主要搜尋狀態寫入 URL：`q`、`type`、`camera`。
- [ ] 重新開啟分享網址時恢復搜尋／類型篩選，Camera 資料載入後恢復選取。
- [ ] Camera 關閉時移除 `camera` query parameter，不重新載入頁面。
- [ ] 手機分享優先使用 Web Share API；不支援時 fallback 複製網址。
- [ ] 桌面 Camera 詳細 modal 與手機 Bottom Sheet 都提供分享入口。
- [ ] 不在本任務加入 road URL；M5 道路模式完成時再加入 `road` / `direction`。
- [ ] GitHub Actions CI build 通過。

完成後將 Current task 更新成 M5.1 — Road grouping。

---

## 已完成任務

### M4.2 — 最近觀看（已完成）

**Executor: ChatGPT**

- [x] 使用 `useRecentCameras`，最多保留 20 支 Camera。
- [x] 手機開 Bottom Sheet、桌面開 Camera 詳細資訊時寫入最近觀看。
- [x] 新增「最近」快速篩選，依最近觀看順序排列。
- [x] 「收藏」與「最近」特殊篩選互斥。
- [x] 修正 `Map` React 元件名稱遮蔽原生 `Map` 型別問題，改用 `globalThis.Map`。
- [x] GitHub Actions run `34704005838`：Install dependencies 與 Build 均成功。

### M4.1 — 收藏（已完成）

**Executor: ChatGPT**

- [x] 將 `useFavorites` 接入桌面與手機 UI。
- [x] CameraCard 與 Camera Bottom Sheet 可加入／取消收藏。
- [x] 桌面 sidebar 與手機 filter chips 可切換「只看收藏」。
- [x] 收藏持久化於 `taiwan-live-traffic:favorites`。
- [x] 移除 CameraCard 無條件顯示的紅色 LIVE 點，避免誤導。
- [x] GitHub Actions run `34703855243`：Install dependencies 與 Build 均成功。

### M3 — 地圖效能（已完成）

- [x] M3.1 Marker clustering — **ChatGPT**；CI run `34703638881` 成功。
- [x] M3.2 Viewport optimization — **ChatGPT**；CI run `34703721411` 成功。

### M2 — UI 2.0（已完成）

- [x] M2.1 Mobile map-first layout — **ChatGPT**
- [x] M2.2 Desktop sidebar layout — **ChatGPT**
- [x] M2.3 Camera Bottom Sheet — **ChatGPT**

### M1 — 基礎整理與資料模型（已完成）

- [x] M1.1 Camera V2 data model
- [x] M1.2 共用 geo utilities
- [x] M1.3 hooks 基礎拆分

---

## Milestones

### M1 — 基礎整理與資料模型
- [x] M1.1 Camera V2 data model
- [x] M1.2 共用 geo utilities
- [x] M1.3 hooks 基礎拆分

### M2 — UI 2.0
- [x] M2.1 Mobile map-first layout — **ChatGPT**
- [x] M2.2 Desktop sidebar layout — **ChatGPT**
- [x] M2.3 Camera Bottom Sheet — **ChatGPT**

### M3 — 地圖效能
- [x] M3.1 Marker clustering — **ChatGPT**
- [x] M3.2 Viewport optimization — **ChatGPT**

### M4 — 使用者功能
- [x] M4.1 收藏 — **ChatGPT**
- [x] M4.2 最近觀看 — **ChatGPT**
- [ ] M4.3 Share / URL state — **ChatGPT**

### M5 — 道路模式
- [ ] M5.1 Road grouping
- [ ] M5.2 Road navigator
- [ ] M5.3 Nearby mode

---

## Executor 原則

預設：`ChatGPT`。只有大型跨檔重構、複雜除錯、必須依賴完整本機／瀏覽器 agent、或 ChatGPT 無法可靠完成與驗證時，才標示 `Executor: Codex`。一般 build 由 GitHub Actions 處理。
