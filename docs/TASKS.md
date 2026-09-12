# TASKS.md

> Repository：`similaitw/taiwan-live-traffic`
>
> 執行方式：每次只完成一個 `Current task`。預設由 ChatGPT 直接透過 GitHub 實作與驗收；只有明確標示 `Executor: Codex` 才使用 Codex。

## Current task

### M11.2 — Source freshness / health visibility

**Executor: ChatGPT**

目標／範圍：

- [ ] 建立前端共用 source-health model，至少涵蓋 TDX events / flow / CMS 與 CWA rainfall。
- [ ] 保留 API 回傳的 status / fetchedAt / dataCollectTime / observedAt，不只用 `enabled` 判斷顯示與否。
- [ ] 圖層面板顯示資料來源健康狀態：正常、未設定、暫時失敗、資料時間。
- [ ] 來源 unavailable 時圖層可以不可用，但需讓使用者知道原因，不再只是控制項消失。
- [ ] stale 判定使用保守門檻，且只標示「資料可能較舊」，不把延遲誤判為服務故障。
- [ ] Camera 主資料仍維持既有載入／錯誤顯示；本任務不重寫 `/api/cameras` response shape。
- [ ] 不暴露 TDX credentials、上游內部錯誤堆疊或敏感資訊。
- [ ] GitHub Actions CI build 通過。

完成後將 Current task 更新成 M11.3 — Live stream bandwidth / lifecycle guardrails。

---

## 已完成任務

### M11.1 — Camera proxy redirect / SSRF hardening（已完成）
- [x] image / snapshot proxy 共用單一 hostname allowlist 與 URL parser。
- [x] 僅允許 HTTP(S)，拒絕 URL credentials 與非 allowlist host。
- [x] redirect 改手動追蹤，每一跳重新驗證 host；最多 4 跳。
- [x] 相對 redirect 以目前上游 URL 解析後驗證。
- [x] 不擴大既有允許來源，保留 timeout、MJPEG 單幀擷取與快取語意。
- [x] GitHub Actions run `34709275148` 成功。

### M10 — 圖層控制與行動版整理（已完成）
- [x] M10.1 Unified map layer controls — CI `34709009247`
- [x] M10.2 Mobile layer-panel polish / responsive validation — CI `34709117895`
- [x] M10.3 Layer preferences persistence — CI `34709191760`

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
- [x] M10.1
- [x] M10.2
- [x] M10.3

### M11 — Production hardening
- [x] M11.1 Camera proxy redirect / SSRF hardening
- [ ] M11.2 Source freshness / health visibility — **ChatGPT**
- [ ] M11.3 Live stream bandwidth / lifecycle guardrails

---

## Executor 原則

預設：`ChatGPT`。只有大型跨檔重構、複雜除錯、必須依賴完整本機／瀏覽器 agent、或 ChatGPT 無法可靠完成與驗證時，才標示 `Executor: Codex`。一般 build 由 GitHub Actions 處理。
