# TASKS.md

> Repository：`similaitw/taiwan-live-traffic`
>
> 執行方式：每次只完成一個 `Current task`。預設由 ChatGPT 直接透過 GitHub 實作與驗收；只有明確標示 `Executor: Codex` 才使用 Codex。

## Current task

### M7.2 — Freeway section metadata / shape join

**Executor: ChatGPT**

目標／範圍：

- [ ] 串接 TDX `Road/Traffic/Section/Freeway` 與 `Road/Traffic/SectionShape/Freeway`。
- [ ] 以 `SectionID` 合併發布路段 metadata 與 geometry。
- [ ] shape parser 支援 WKT `LINESTRING` / `MULTILINESTRING`，轉為 Leaflet 可直接使用的 `[lat, lng][]` 線段。
- [ ] metadata 欄位保持寬鬆 optional；至少保留可取得的 RoadID / RoadName / RoadDirection / SectionName / Start / End。
- [ ] 新增 `/api/traffic-sections`，靜態資料使用長時間 cache（數小時）。
- [ ] 任一靜態來源暫時失敗時 graceful degradation；不得阻斷 Camera 或即時路況 API。
- [ ] 不在本任務渲染 congestion polyline；留給 M7.3。
- [ ] GitHub Actions CI build 通過。

完成後將 Current task 更新成 M7.3 — Congestion map overlay / Camera verification。

---

## 已完成任務

### M7.1 — Freeway live traffic foundation（已完成）

- [x] 新增 `TrafficFlowSegment` normalized model。
- [x] 串接 TDX `/api/basic/v2/Road/Traffic/Live/Freeway`。
- [x] 正規化 SectionID、旅行時間、速度、壅塞等級與資料時間。
- [x] parser 兼容裸 array / LiveTraffics / LiveTraffic / LiveTrafficList 等 envelope。
- [x] 新增 `/api/traffic-flow`，60 秒 cache 與 graceful degradation。
- [x] 未猜測 SectionID geometry。
- [x] GitHub Actions run `34705057134` 成功。

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
- [x] M1 基礎整理與資料模型
- [x] M2 UI 2.0
- [x] M3 地圖效能
- [x] M4 使用者功能
- [x] M5 道路模式

### M6 — 即時交通事件
- [x] M6.1
- [x] M6.2
- [x] M6.3

### M7 — 壅塞／旅行速度
- [x] M7.1 Freeway live traffic foundation
- [ ] M7.2 Freeway section metadata / shape join — **ChatGPT**
- [ ] M7.3 Congestion map overlay / Camera verification

### M8 — 後續路況深化（暫定）
- [ ] CMS / 即時資訊整合
- [ ] 天氣／降雨與 CCTV 交叉判讀

---

## Executor 原則

預設：`ChatGPT`。只有大型跨檔重構、複雜除錯、必須依賴完整本機／瀏覽器 agent、或 ChatGPT 無法可靠完成與驗證時，才標示 `Executor: Codex`。一般 build 由 GitHub Actions 處理。
