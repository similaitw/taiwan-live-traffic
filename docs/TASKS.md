# TASKS.md

> Repository：`similaitw/taiwan-live-traffic`
>
> 執行方式：每次只完成一個 `Current task`。預設由 ChatGPT 直接透過 GitHub 實作與驗收；只有明確標示 `Executor: Codex` 才使用 Codex。

## Current task

### M8.1 — CMS foundation

**Executor: ChatGPT**

目標／範圍：

- [ ] 串接 TDX 高速公路 CMS 靜態 `/Road/Traffic/CMS/Freeway` 與動態 `/Road/Traffic/Live/CMS/Freeway`。
- [ ] 新增 CMS normalized model，以 `CMSUID` 優先、`CMSID` fallback 對應靜態與動態資料。
- [ ] 靜態資料至少處理 CMSID／CMSUID、PositionLat／PositionLon、LinkID，以及可取得的 RoadID／RoadName／RoadDirection。
- [ ] 動態資料至少處理 MessageStatus、Messages/Text、Status、DataCollectTime；兼容舊版單一 `Text` 與新版 `Messages` 陣列。
- [ ] 新增 `/api/cms`，靜態資料長快取、動態資料約 120 秒快取。
- [ ] 預設保留所有設備，但輸出 `active` 旗標供 UI 判斷目前是否有循環訊息。
- [ ] 未設定 TDX 金鑰或任一來源失敗時 graceful degradation；若只取得靜態或只取得動態則回 partial。
- [ ] 本任務不渲染地圖 CMS marker；留給 M8.2。
- [ ] GitHub Actions CI build 通過。

完成後將 Current task 更新成 M8.2 — CMS map overlay / Camera verification。

---

## 已完成任務

### M7.3 — Congestion map overlay / Camera verification（已完成）

- [x] `/api/traffic-flow` 與 `/api/traffic-sections` 以 SectionID join。
- [x] 壅塞使用獨立 Leaflet polyline layer，不干擾 Camera / traffic-event layers。
- [x] 依官方級別呈現順暢、車多、壅塞、嚴重壅塞、極度壅塞與未知／異常。
- [x] 提供「即時路況」與「只看壅塞」。
- [x] 路段 popup 顯示速度、旅行時間、壅塞狀態、資料時間。
- [x] 15 km 內可直接開啟最近 CCTV 驗證。
- [x] GitHub Actions run `34705369615` 成功。

### M7.2 — Freeway section metadata / shape join（已完成）
- [x] Section / SectionShape join、WKT geometry parser、`/api/traffic-sections`。
- [x] CI `34705149764` 成功。

### M7.1 — Freeway live traffic foundation（已完成）
- [x] Live/Freeway normalized API `/api/traffic-flow`。
- [x] CI `34705057134` 成功。

### M6 — 即時交通事件（已完成）
- [x] M6.1 TDX road-event foundation — CI `34704685825`
- [x] M6.2 Traffic event map overlay — CI `34704812771`
- [x] M6.3 Event filters / Camera verification workflow — CI `34704931928`

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
- [x] M1–M5 全完成

### M6 — 即時交通事件
- [x] M6.1
- [x] M6.2
- [x] M6.3

### M7 — 壅塞／旅行速度
- [x] M7.1
- [x] M7.2
- [x] M7.3

### M8 — CMS / 官方即時提醒
- [ ] M8.1 CMS foundation — **ChatGPT**
- [ ] M8.2 CMS map overlay / Camera verification
- [ ] M8.3 CMS filtering / road workflow

### M9 — 天氣／降雨（暫定）
- [ ] 降雨／雷達與 CCTV 交叉判讀

---

## Executor 原則

預設：`ChatGPT`。只有大型跨檔重構、複雜除錯、必須依賴完整本機／瀏覽器 agent、或 ChatGPT 無法可靠完成與驗證時，才標示 `Executor: Codex`。一般 build 由 GitHub Actions 處理。
