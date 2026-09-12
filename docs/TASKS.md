# TASKS.md

> Repository：`similaitw/taiwan-live-traffic`
>
> 執行方式：每次只完成一個 `Current task`。預設由 ChatGPT 直接透過 GitHub 實作與驗收；只有明確標示 `Executor: Codex` 才使用 Codex。

## Current task

### M4.2 — 最近觀看

**Executor: ChatGPT**

目標／範圍：

- [ ] 使用既有 `useRecentCameras`，最多保留 20 支 Camera。
- [ ] 手機開啟 Bottom Sheet、桌面開啟 Camera 詳細資訊時記錄最近觀看。
- [ ] 新增「最近」快速篩選入口，依最近觀看順序排列。
- [ ] 「收藏」與「最近」特殊篩選互斥，避免狀態混亂。
- [ ] localStorage 持久化與 SSR safety 不退化。
- [ ] GitHub Actions CI build 通過。

完成後將 Current task 更新成 M4.3 — Share / URL state。

---

## 已完成任務

### M4.1 — 收藏（已完成）

**Executor: ChatGPT**

- [x] 將既有 `useFavorites` 接入桌面與手機 UI。
- [x] CameraCard 與 Camera Bottom Sheet 可加入／取消收藏。
- [x] 桌面 sidebar 與手機 filter chips 可切換「只看收藏」。
- [x] 收藏持久化於 `taiwan-live-traffic:favorites`。
- [x] 移除 CameraCard 無條件顯示的紅色 LIVE 點，避免誤導。
- [x] GitHub Actions run `34703855243`：Install dependencies 與 Build 均成功。

### M3.2 — Viewport optimization（已完成）

**Executor: ChatGPT**

- [x] 只處理 viewport + 35% buffer 內的 Camera。
- [x] 使用 marker key/signature 做差異更新，不再每次移動完整 clear/recreate。
- [x] 使用 requestAnimationFrame 合併拖曳／縮放後的更新。
- [x] cluster 與 Camera click/hover 行為維持。
- [x] GitHub Actions run `34703721411`：Install dependencies 與 Build 均成功。

### M3.1 — Marker clustering（已完成）

**Executor: ChatGPT**

- [x] 移除 50 / 100 / 200 支 Camera 的中心距離截斷策略。
- [x] 使用 Leaflet 投影座標建立輕量 grid clustering，不新增 npm dependency。
- [x] cluster marker 顯示 Camera 數量，點擊後逐步放大。
- [x] 高縮放層級顯示單支 Camera marker，維持 hover preview 與 click 行為。
- [x] GitHub Actions run `34703638881`：Install dependencies 與 Build 均成功。

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
- [ ] M4.2 最近觀看 — **ChatGPT**
- [ ] M4.3 Share / URL state

### M5 — 道路模式
- [ ] M5.1 Road grouping
- [ ] M5.2 Road navigator
- [ ] M5.3 Nearby mode

---

## Executor 原則

預設：`ChatGPT`。只有大型跨檔重構、複雜除錯、必須依賴完整本機／瀏覽器 agent、或 ChatGPT 無法可靠完成與驗證時，才標示 `Executor: Codex`。一般 build 由 GitHub Actions 處理。
