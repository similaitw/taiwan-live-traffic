# TASKS.md

> Repository：`similaitw/taiwan-live-traffic`
>
> 執行方式：每次只完成一個 `Current task`。預設由 ChatGPT 直接透過 GitHub 實作與驗收；只有明確標示 `Executor: Codex` 才使用 Codex。

## Current task

### M6.2 — Traffic event map overlay

**Executor: ChatGPT**

目標／範圍：

- [ ] 首頁在 client 端讀取 `/api/traffic-events`，不得影響 Camera API 載入。
- [ ] 新增「交通事件」顯示切換；TDX 未啟用時維持 Camera-only，不顯示錯誤 overlay。
- [ ] Map / MapInner 接受 `TrafficEvent[]`，以獨立 layer render，不混進 Camera clustering。
- [ ] 有座標的事件在地圖顯示 marker；依 `info / warning / serious` 做視覺區分。
- [ ] 點事件 marker 顯示事件標題、道路、影響描述、發布時間等摘要，不啟動 Camera live modal。
- [ ] 事件 overlay 與 Camera viewport optimization 可共存，拖曳／縮放不應造成 Camera marker 退化。
- [ ] GitHub Actions CI build 通過。

完成後將 Current task 更新成 M6.3 — Event filters / Camera verification workflow。

---

## 已完成任務

### M6.1 — TDX road-event foundation（已完成）

**Executor: ChatGPT**

- [x] 新增 `TrafficEvent` / source response model。
- [x] 新增 server-side TDX OAuth helper，使用 `TDX_CLIENT_ID` / `TDX_CLIENT_SECRET` 並快取 access token。
- [x] 新增國道即時道路事件 adapter，支援裸 array 與 `{ RoadEvents: [...] }` envelope。
- [x] normalizer 處理 `EventID`、`EventTitle`、`Positions` WKT、道路、Impact、發布／生效時間。
- [x] 新增 `/api/traffic-events`，未設定 TDX 金鑰時安全回傳 `enabled:false`。
- [x] TDX 上游失敗時 graceful degradation，不影響 Camera 功能。
- [x] 新增 `.env.example`。
- [x] GitHub Actions run `34704685825`：Install dependencies 與 Build 均成功。

### M5.3 — Nearby mode（已完成）
- [x] 5 / 10 / 20 km 附近模式、定位觸發、半徑過濾與距離排序。
- [x] URL 支援 `nearby=5|10|20`。
- [x] CI `34704517553` 成功。

### M5.2 — Road navigator（已完成）
- [x] 同道路／同方向上一支與下一支。
- [x] CI `34704427438` 成功。

### M5.1 — Road grouping（已完成）
- [x] 道路自動辨識、群組、篩選與 `road=` URL。
- [x] CI `34704232348` 成功。

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

### V2 MVP — M1–M5
- [x] M1 基礎整理與資料模型
- [x] M2 UI 2.0
- [x] M3 地圖效能
- [x] M4 使用者功能
- [x] M5 道路模式

### M6 — 即時交通事件
- [x] M6.1 TDX road-event foundation
- [ ] M6.2 Traffic event map overlay — **ChatGPT**
- [ ] M6.3 Event filters / Camera verification workflow

### M7 — 路況判斷深化（暫定）
- [ ] 壅塞／旅行速度或路況資訊 overlay
- [ ] CMS / 即時資訊整合
- [ ] 天氣／降雨與 CCTV 交叉判讀

---

## Executor 原則

預設：`ChatGPT`。只有大型跨檔重構、複雜除錯、必須依賴完整本機／瀏覽器 agent、或 ChatGPT 無法可靠完成與驗證時，才標示 `Executor: Codex`。一般 build 由 GitHub Actions處理。
