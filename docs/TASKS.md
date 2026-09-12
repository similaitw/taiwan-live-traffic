# TASKS.md

> Repository：`similaitw/taiwan-live-traffic`
>
> 執行方式：每次只完成一個 `Current task`。預設由 ChatGPT 直接透過 GitHub 實作與驗收；只有明確標示 `Executor: Codex` 才使用 Codex。

## Current task

### M6.3 — Event filters / Camera verification workflow

**Executor: ChatGPT**

目標／範圍：

- [ ] 交通事件 overlay 提供「全部／警示以上／嚴重」篩選，不影響 Camera 篩選。
- [ ] 事件 marker popup 找出距離最近的 Camera；合理距離內提供「查看最近監視器」操作。
- [ ] 點「查看最近監視器」沿用既有 Camera `onSelect`，手機開 Bottom Sheet、桌面開詳細直播流程。
- [ ] popup 顯示最近 Camera 名稱與距離，讓使用者知道 CCTV 與事件位置並非同一點。
- [ ] 沒有鄰近 Camera 時不顯示驗證按鈕，不製造錯誤期待。
- [ ] 不把交通事件混進收藏／最近觀看 Camera 資料。
- [ ] GitHub Actions CI build 通過。

完成後 M6 結案，後續進入 M7 路況判斷深化。

---

## 已完成任務

### M6.2 — Traffic event map overlay（已完成）

- [x] `Map` 獨立讀取 `/api/traffic-events`，Camera API 載入不受影響。
- [x] TDX 啟用時才顯示交通事件切換；未啟用時維持 Camera-only。
- [x] 交通事件使用獨立 Leaflet layer，不混入 Camera clustering。
- [x] 事件依 `info / warning / serious` 顯示不同警示色。
- [x] 事件 popup 顯示標題、道路、影響描述與發布時間。
- [x] 事件 layer 採 viewport + 差異更新，與 Camera optimization 共存。
- [x] GitHub Actions run `34704812771` 成功。

### M6.1 — TDX road-event foundation（已完成）

- [x] `TrafficEvent` / source response model。
- [x] server-side TDX OAuth token 快取。
- [x] 國道道路事件 adapter 與 `/api/traffic-events`。
- [x] 未設定金鑰／上游失敗皆 graceful degradation。
- [x] `.env.example`。
- [x] GitHub Actions run `34704685825` 成功。

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
- [ ] M6.3 Event filters / Camera verification workflow — **ChatGPT**

### M7 — 路況判斷深化（暫定）
- [ ] 壅塞／旅行速度或路況資訊 overlay
- [ ] CMS / 即時資訊整合
- [ ] 天氣／降雨與 CCTV 交叉判讀

---

## Executor 原則

預設：`ChatGPT`。只有大型跨檔重構、複雜除錯、必須依賴完整本機／瀏覽器 agent、或 ChatGPT 無法可靠完成與驗證時，才標示 `Executor: Codex`。一般 build 由 GitHub Actions處理。
