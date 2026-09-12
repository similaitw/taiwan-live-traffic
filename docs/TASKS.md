# TASKS.md

> Repository：`similaitw/taiwan-live-traffic`
>
> 執行方式：每次只完成一個 `Current task`。預設由 ChatGPT 直接透過 GitHub 實作與驗收；只有明確標示 `Executor: Codex` 才使用 Codex。

## Current task

### M7.1 — Freeway live traffic foundation

**Executor: ChatGPT**

目標／範圍：

- [ ] 新增高速公路即時路況 normalized model。
- [ ] 串接 TDX `GET /api/basic/v2/Road/Traffic/Live/Freeway`，沿用既有 server-side OAuth helper。
- [ ] 正規化 `SectionID`、`TravelTime`、`TravelSpeed`、`CongestionLevelID`、`CongestionLevel`、`DataCollectTime`。
- [ ] parser 兼容裸 array、`LiveTraffics`、`LiveTraffic`、`LiveTrafficList` 等常見 envelope，不依賴單一回傳包裝。
- [ ] 新增 `/api/traffic-flow`，快取約 60 秒。
- [ ] 未設定 TDX 金鑰或上游暫時失敗時 graceful degradation，不影響 Camera / traffic-events 功能。
- [ ] 本任務不猜測 SectionID 的地理位置；geometry join 留給 M7.2。
- [ ] GitHub Actions CI build 通過。

完成後將 Current task 更新成 M7.2 — Freeway section metadata / shape join。

---

## 已完成任務

### M6.3 — Event filters / Camera verification workflow（已完成）

- [x] 交通事件支援「全部／警示以上／嚴重」篩選。
- [x] 事件 popup 尋找最近的目前可見 CCTV。
- [x] 15 km 內顯示 Camera 名稱、距離與「查看最近監視器」。
- [x] 點驗證按鈕沿用既有 Camera `onSelect`，不建立平行流程。
- [x] 沒有合理距離 Camera 時不顯示驗證操作。
- [x] 交通事件不混入 Camera 收藏／最近觀看。
- [x] GitHub Actions run `34704931928` 成功。

### M6.2 — Traffic event map overlay（已完成）
- [x] 事件獨立 Leaflet layer、切換、severity 視覺與 popup。
- [x] CI `34704812771` 成功。

### M6.1 — TDX road-event foundation（已完成）
- [x] TDX OAuth、事件 model、adapter、`/api/traffic-events` 與 graceful degradation。
- [x] CI `34704685825` 成功。

### M5 — 道路模式（已完成）
- [x] M5.1 Road grouping — CI `34704232348`
- [x] M5.2 Road navigator — CI `34704427438`
- [x] M5.3 Nearby mode — CI `34704517553`

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
- [x] M6.2 Traffic event map overlay
- [x] M6.3 Event filters / Camera verification workflow

### M7 — 壅塞／旅行速度
- [ ] M7.1 Freeway live traffic foundation — **ChatGPT**
- [ ] M7.2 Freeway section metadata / shape join
- [ ] M7.3 Congestion map overlay / Camera verification

### M8 — 後續路況深化（暫定）
- [ ] CMS / 即時資訊整合
- [ ] 天氣／降雨與 CCTV 交叉判讀

---

## Executor 原則

預設：`ChatGPT`。只有大型跨檔重構、複雜除錯、必須依賴完整本機／瀏覽器 agent、或 ChatGPT 無法可靠完成與驗證時，才標示 `Executor: Codex`。一般 build 由 GitHub Actions 處理。
