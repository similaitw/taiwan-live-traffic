# TASKS.md

> Repository：`similaitw/taiwan-live-traffic`
>
> 執行方式：每次只完成一個 `Current task`。預設由 ChatGPT 直接透過 GitHub 實作與驗收；只有明確標示 `Executor: Codex` 才使用 Codex。

## Current task

### M10.3 — Layer preferences persistence

**Executor: ChatGPT**

目標／範圍：

- [ ] 以 localStorage 記住雷達、雨量、CMS、即時路況、交通事件的顯示開關。
- [ ] 記住 rainfall / CMS / flow / event filter，但不記動態 CMS road 選項，避免資料來源變動造成空畫面。
- [ ] 儲存 key 使用版本化命名；資料損壞或舊格式時安全忽略並採預設值。
- [ ] 首次 hydration 完成前不得用預設值覆蓋既有偏好。
- [ ] TDX/CMS 暫時 unavailable 時不得清掉已儲存偏好，日後資料源恢復仍沿用。
- [ ] 不影響 Camera 收藏／最近觀看的既有 localStorage。
- [ ] GitHub Actions CI build 通過。

完成後 M10 圖層控制階段結案。

---

## 已完成任務

### M10.2 — Mobile layer-panel polish / responsive validation（已完成）
- [x] 行動版加入 safe-area bottom offset。
- [x] 面板使用 dynamic viewport 高度限制與 overscroll containment。
- [x] Escape 可收合，panel 有 region / aria label。
- [x] 主要 toggle / select / close button 採 44px 級觸控目標；超窄螢幕 CMS filters 改單欄。
- [x] 375 / 768 / 1280 響應式規則完成程式碼檢查。
- [x] 瀏覽器視覺驗證未宣稱完成：執行環境有 Chromium，但容器無法解析 GitHub DNS；Vercel connector 也未回傳可用 team/project。
- [x] GitHub Actions run `34709117895` 成功。

### M10.1 — Unified map layer controls（已完成）
- [x] 新增 `MapLayerControls`，多排浮動控制收成單一圖層入口。
- [x] 天氣、路況、事件、CMS 開關與既有 filters 保留。
- [x] `Map` 保留資料／狀態管理；Leaflet 邏輯未搬入控制元件。
- [x] 不可用的 TDX/CMS 圖層自動隱藏，CWA/CCTV 不受影響。
- [x] GitHub Actions run `34709009247` 成功。

### M9 — 天氣／降雨（已完成）
- [x] M9.1 CWA rainfall observation foundation — CI `34708540549`
- [x] M9.2 Rainfall / radar map overlay — CI `34708797685`
- [x] M9.3 Rainfall / CCTV cross-check workflow — CI `34708915050`

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
- [x] M9.1
- [x] M9.2
- [x] M9.3

### M10 — 圖層控制與行動版整理
- [x] M10.1 Unified map layer controls
- [x] M10.2 Mobile layer-panel polish / responsive validation
- [ ] M10.3 Layer preferences persistence — **ChatGPT**

---

## Executor 原則

預設：`ChatGPT`。只有大型跨檔重構、複雜除錯、必須依賴完整本機／瀏覽器 agent、或 ChatGPT 無法可靠完成與驗證時，才標示 `Executor: Codex`。一般 build 由 GitHub Actions 處理。
