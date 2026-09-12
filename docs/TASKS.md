# TASKS.md

> Repository：`similaitw/taiwan-live-traffic`
>
> 執行方式：每次只完成一個 `Current task`。預設由 ChatGPT 直接透過 GitHub 實作與驗收；只有明確標示 `Executor: Codex` 才使用 Codex。

## Current task

### M5.2 — Road navigator

**Executor: ChatGPT**

目標／範圍：

- [ ] 同一道路 Camera 優先依方向分組，再依 `mile` 由小到大排序。
- [ ] Camera 詳細資訊提供「上一支／下一支」沿線導航。
- [ ] 手機 Bottom Sheet 與桌面直播畫面都可切換沿線 Camera。
- [ ] 切換 Camera 時同步更新最近觀看與 `camera=` URL。
- [ ] 無法判斷里程時保持穩定排序，不因缺值崩潰。
- [ ] GitHub Actions CI build 通過。

完成後將 Current task 更新成 M5.3 — Nearby mode。

---

## 已完成任務

### M5.1 — Road grouping（已完成）

**Executor: ChatGPT**

- [x] 新增 `lib/roads.ts`，由 `roadNumber` / `road` / name 自動辨識道路編號。
- [x] 自動建立道路群組與 Camera 數量，國道、省道、縣道、鄉道依類型／號碼排序。
- [x] 新增共用 `RoadFilter`，桌面與手機皆可使用。
- [x] 道路篩選同步作用於地圖與清單。
- [x] URL 支援 `road=` 並可於重開時恢復。
- [x] GitHub Actions run `34704232348` 成功。

### M4 — 使用者功能（已完成）
- [x] M4.1 收藏 — CI `34703855243`
- [x] M4.2 最近觀看 — CI `34704005838`
- [x] M4.3 Share / URL state — CI `34704132752`

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
- [x] M5.1 Road grouping — **ChatGPT**
- [ ] M5.2 Road navigator — **ChatGPT**
- [ ] M5.3 Nearby mode

---

## Executor 原則

預設：`ChatGPT`。只有大型跨檔重構、複雜除錯、必須依賴完整本機／瀏覽器 agent、或 ChatGPT 無法可靠完成與驗證時，才標示 `Executor: Codex`。一般 build 由 GitHub Actions 處理。
