# TASKS.md

> Repository：`similaitw/taiwan-live-traffic`
>
> 執行方式：每次只完成一個 `Current task`。預設由 ChatGPT 直接透過 GitHub 實作與驗收；只有明確標示 `Executor: Codex` 才使用 Codex。

## Current task

### M6.1 — TDX road-event foundation

**Executor: ChatGPT**

目標／範圍：

- [ ] 新增 `TrafficEvent` 資料模型與 TDX road-event normalizer。
- [ ] 先串接 TDX `道路事件 v1` 的國道即時事件，伺服器端使用 `TDX_CLIENT_ID` / `TDX_CLIENT_SECRET`，金鑰不得送到瀏覽器。
- [ ] 新增 `/api/traffic-events`；未設定 TDX 金鑰時要安全回傳 `enabled: false`，不得讓網站或 build 失敗。
- [ ] 支援 TDX OAuth token 記憶體快取，避免每次 API request 都重新取 token。
- [ ] normalizer 至少處理 `EventID`、`EventTitle`、`Positions` WKT `POINT(lng lat)`、`Location.FreeExpressHighway.Road`、`Impact.Description`、`PublishTime` / `EffectiveTime`。
- [ ] 上游回應兼容裸 array 與 `{ RoadEvents: [...] }` envelope。
- [ ] API 對 TDX 暫時性失敗採 graceful degradation，回傳空事件＋來源狀態，不影響 Camera 功能。
- [ ] GitHub Actions CI build 通過。

完成後將 Current task 更新成 M6.2 — Traffic event map overlay。

---

## 已完成任務

### M5.3 — Nearby mode（已完成）

**Executor: ChatGPT**

- [x] 新增 5 / 10 / 20 km 附近模式。
- [x] 啟用後只顯示半徑內 Camera，並依距離由近到遠排序。
- [x] 尚未取得定位時，選擇附近模式會主動觸發定位。
- [x] 桌面與手機均有附近模式入口。
- [x] URL 支援 `nearby=5|10|20`，分享／重開可恢復。
- [x] 可與道路／類型／搜尋篩選疊加使用。
- [x] GitHub Actions run `34704517553`：Install dependencies 與 Build 均成功。

### M5.2 — Road navigator（已完成）

- [x] 同道路優先同方向序列，再依里程排序。
- [x] 手機 Bottom Sheet 與桌面直播畫面提供上一支／下一支。
- [x] 切換同步最近觀看與 `camera=` URL。
- [x] GitHub Actions run `34704427438` Build step 成功。

### M5.1 — Road grouping（已完成）

- [x] 自動辨識道路編號並建立道路群組與 Camera 數量。
- [x] 桌面與手機皆可道路篩選。
- [x] URL 支援 `road=` 並可恢復。
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

### V2 MVP — M1–M5
- [x] M1 基礎整理與資料模型
- [x] M2 UI 2.0
- [x] M3 地圖效能
- [x] M4 使用者功能
- [x] M5 道路模式

### M6 — 即時交通事件
- [ ] M6.1 TDX road-event foundation — **ChatGPT**
- [ ] M6.2 Traffic event map overlay
- [ ] M6.3 Event filters / Camera verification workflow

### M7 — 路況判斷深化（暫定）
- [ ] 壅塞／旅行速度或路況資訊 overlay
- [ ] CMS / 即時資訊整合
- [ ] 天氣／降雨與 CCTV 交叉判讀

---

## Executor 原則

預設：`ChatGPT`。只有大型跨檔重構、複雜除錯、必須依賴完整本機／瀏覽器 agent、或 ChatGPT 無法可靠完成與驗證時，才標示 `Executor: Codex`。一般 build 由 GitHub Actions 處理。
