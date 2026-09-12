# TASKS.md

> Repository：`similaitw/taiwan-live-traffic`
>
> 執行方式：每次只完成一個 `Current task`。預設由 ChatGPT 直接透過 GitHub 實作與驗收；只有明確標示 `Executor: Codex` 才使用 Codex。

## Current task

### M9.3 — Rainfall / CCTV cross-check workflow

**Executor: ChatGPT**

目標／範圍：

- [ ] 雨量站 popup 尋找距離最近的目前可見 Camera。
- [ ] 15 km 內才顯示 Camera 名稱、距離與「查看附近監視器」操作；不得暗示測站與 CCTV 位於同一點。
- [ ] 點擊驗證按鈕沿用既有 Camera `onSelect`，手機開 Bottom Sheet、桌面進既有詳細／直播流程。
- [ ] popup 保留雨量數據與觀測時間，明確呈現「測站數值 + 附近現場影像」兩種不同證據。
- [ ] 沒有合理距離 CCTV 時不顯示驗證按鈕。
- [ ] Rainfall 不混入 Camera 收藏、最近觀看或 Camera clustering。
- [ ] 雷達 overlay、雨量站 filter、TDX/CMS layers 需維持既有行為。
- [ ] GitHub Actions CI build 通過。

完成後 M9 天氣／降雨階段結案。

---

## 已完成任務

### M9.2 — Rainfall / radar map overlay（已完成）
- [x] `Map` 獨立載入 `/api/rainfall`，不影響其他資料來源。
- [x] CWA O-A0058-006 雷達透明圖層使用獨立 Leaflet pane。
- [x] 雷達位於底圖上、壅塞與 marker layers 下方，並約每 10 分鐘刷新 URL。
- [x] 雨量站採獨立 viewport/diff marker layer。
- [x] 預設只顯示近 1 小時有雨測站，可切換全部測站。
- [x] popup 顯示測站位置、時間與 10min / 1hr / 3hr / 24hr 雨量。
- [x] 雨量 marker 強度僅供視覺辨識，不宣稱官方警戒門檻。
- [x] GitHub Actions run `34708797685` 成功。

### M9.1 — CWA rainfall observation foundation（已完成）
- [x] CWA `O-A0002-001` normalized model / parser / `/api/rainfall`。
- [x] 使用 CWA 官方管理的公開 AWS Open Data raw JSON，不需額外 API key。
- [x] WGS84 優先、特殊雨量值不誤判為 0、10 分鐘 cache、graceful degradation。
- [x] GitHub Actions run `34708540549` 成功。

### M8 — CMS / 官方即時提醒（已完成）
- [x] M8.1 CMS foundation — CI `34705565204`
- [x] M8.2 CMS map overlay / Camera verification — CI `34705688422`
- [x] M8.3 CMS filtering / road workflow — CI `34705864679`

### M7 — 壅塞／旅行速度（已完成）
- [x] M7.1 Freeway live traffic foundation — CI `34705057134`
- [x] M7.2 Freeway section metadata / shape join — CI `34705149764`
- [x] M7.3 Congestion map overlay / Camera verification — CI `34705369615`

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
- [x] M8.1
- [x] M8.2
- [x] M8.3

### M9 — 天氣／降雨
- [x] M9.1 CWA rainfall observation foundation
- [x] M9.2 Rainfall / radar map overlay
- [ ] M9.3 Rainfall / CCTV cross-check workflow — **ChatGPT**

---

## Executor 原則

預設：`ChatGPT`。只有大型跨檔重構、複雜除錯、必須依賴完整本機／瀏覽器 agent、或 ChatGPT 無法可靠完成與驗證時，才標示 `Executor: Codex`。一般 build 由 GitHub Actions處理。
