# TASKS.md

> Repository：`similaitw/taiwan-live-traffic`
>
> 執行方式：每次只完成一個 `Current task`。預設由 ChatGPT 直接透過 GitHub 實作與驗收；只有明確標示 `Executor: Codex` 才使用 Codex。

## Current task

### M7.3 — Congestion map overlay / Camera verification

**Executor: ChatGPT**

目標／範圍：

- [ ] `Map` 獨立讀取 `/api/traffic-flow` 與 `/api/traffic-sections`，以 `SectionID` join 即時速度與 geometry。
- [ ] 使用獨立 Leaflet polyline layer，不混入 Camera marker clustering 或 traffic-event layer。
- [ ] 依官方壅塞級別呈現：未知／異常灰、1 順暢綠、2 車多黃、3 壅塞橘、4 嚴重壅塞紅、5+ 極度壅塞深紅。
- [ ] 提供「即時路況」顯示切換與「全部／只看壅塞」篩選。
- [ ] 路段 popup 顯示道路／路段、平均速度、旅行時間、壅塞狀態、資料時間。
- [ ] 路段 popup 尋找合理距離內最近 Camera，提供 CCTV 現場驗證操作。
- [ ] TDX 任一 API 未啟用或暫時失敗時，Camera 與 traffic-event 功能維持正常。
- [ ] GitHub Actions CI build 通過。

完成後 M7 結案，後續進 M8 CMS / 天氣等路況深化。

---

## 已完成任務

### M7.2 — Freeway section metadata / shape join（已完成）

- [x] 串接 TDX `Section/Freeway` 與 `SectionShape/Freeway`。
- [x] 以 SectionID 合併 metadata 與 geometry。
- [x] WKT `LINESTRING / MULTILINESTRING` 轉 Leaflet `[lat,lng]` paths。
- [x] metadata optional normalization，支援來源部分失敗。
- [x] 新增 `/api/traffic-sections`，6 小時 cache。
- [x] GitHub Actions run `34705149764` 成功。

### M7.1 — Freeway live traffic foundation（已完成）
- [x] TDX Live/Freeway normalized model、adapter、`/api/traffic-flow`。
- [x] 60 秒 cache 與 graceful degradation。
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
- [x] M7.1 Freeway live traffic foundation
- [x] M7.2 Freeway section metadata / shape join
- [ ] M7.3 Congestion map overlay / Camera verification — **ChatGPT**

### M8 — 後續路況深化（暫定）
- [ ] CMS / 即時資訊整合
- [ ] 天氣／降雨與 CCTV 交叉判讀

---

## Executor 原則

預設：`ChatGPT`。只有大型跨檔重構、複雜除錯、必須依賴完整本機／瀏覽器 agent、或 ChatGPT 無法可靠完成與驗證時，才標示 `Executor: Codex`。一般 build 由 GitHub Actions 處理。
