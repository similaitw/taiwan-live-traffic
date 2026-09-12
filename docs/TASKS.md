# TASKS.md

> Repository：`similaitw/taiwan-live-traffic`
>
> 執行方式：每次只完成一個 `Current task`。預設由 ChatGPT 直接透過 GitHub 實作與驗收；只有明確標示 `Executor: Codex` 才使用 Codex。

## Current task

### M8.2 — CMS map overlay / Camera verification

**Executor: ChatGPT**

目標／範圍：

- [ ] `Map` 獨立讀取 `/api/cms`，不得影響 Camera／事件／壅塞資料載入。
- [ ] TDX CMS 啟用時顯示「官方看板」切換；預設 overlay 僅顯示 `active=true` 且有座標的 CMS。
- [ ] `MapInner` 新增獨立 CMS Leaflet layer，不混進 Camera clustering、事件 marker 或壅塞 polyline。
- [ ] CMS marker 視覺需與 Camera／事件清楚區分。
- [ ] popup 顯示道路／方向、看板訊息、設備狀態、資料時間。
- [ ] popup 尋找 15 km 內最近 Camera，顯示距離並提供「查看最近監視器」。
- [ ] CMS 無座標、資料不完整或來源 partial 時不得造成地圖錯誤。
- [ ] GitHub Actions CI build 通過。

完成後將 Current task 更新成 M8.3 — CMS filtering / road workflow。

---

## 已完成任務

### M8.1 — CMS foundation（已完成）

- [x] 串接 TDX CMS 靜態 `/Road/Traffic/CMS/Freeway` 與動態 `/Road/Traffic/Live/CMS/Freeway`。
- [x] 以 CMSUID 優先、CMSID fallback 合併靜態與動態資料並去重。
- [x] 靜態正規化座標／Link／道路欄位；動態正規化 MessageStatus／Messages／Status／DataCollectTime。
- [x] 兼容舊版 `Text` 與新版 `Messages`。
- [x] `/api/cms`：靜態 6 小時 cache、動態 2 分鐘 cache。
- [x] 輸出 `active` 供 UI 判斷目前是否有循環訊息。
- [x] 支援 disabled / partial / error graceful degradation。
- [x] GitHub Actions run `34705565204` 成功。

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
- [x] M8.1 CMS foundation
- [ ] M8.2 CMS map overlay / Camera verification — **ChatGPT**
- [ ] M8.3 CMS filtering / road workflow

### M9 — 天氣／降雨（暫定）
- [ ] 降雨／雷達與 CCTV 交叉判讀

---

## Executor 原則

預設：`ChatGPT`。只有大型跨檔重構、複雜除錯、必須依賴完整本機／瀏覽器 agent、或 ChatGPT 無法可靠完成與驗證時，才標示 `Executor: Codex`。一般 build 由 GitHub Actions 處理。
