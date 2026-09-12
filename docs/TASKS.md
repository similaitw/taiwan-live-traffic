# TASKS.md

> Repository：`similaitw/taiwan-live-traffic`
>
> 執行方式：每次只完成一個 `Current task`。預設由 ChatGPT 直接透過 GitHub 實作與驗收；只有明確標示 `Executor: Codex` 才使用 Codex。

## Current task

### M11.4 — Production diagnostics / deploy checklist

**Executor: ChatGPT**

目標／範圍：

- [ ] 新增 production deploy checklist，明確列出 GitHub CI、Vercel env、TDX、CWA、Camera API、proxy 與正式站 smoke check。
- [ ] 提供不洩漏 secrets 的 server-side health / diagnostics 輸出，至少能辨識 TDX credentials 是否已設定與主要 API 是否可用。
- [ ] health endpoint 不主動大量打上游；優先回報設定、版本／時間與安全狀態，避免自己成為額外負載來源。
- [ ] 文件記錄 CWA rainfall / radar 使用公開官方 OpenData，無需另外設定 CWA API key。
- [ ] 文件記錄 TDX 功能需要 `TDX_CLIENT_ID` / `TDX_CLIENT_SECRET`，但任何診斷輸出不得回傳實際值。
- [ ] 列出正式站至少需驗證 375px / 768px / 1280px、Camera snapshot、手動 live、圖層面板、事件／路況／CMS／雨量 graceful degradation。
- [ ] 記錄目前此 ChatGPT 執行環境無法直接取得使用者 Vercel team / production URL，因此正式站瀏覽器 smoke check 必須在可取得 deployment URL 的環境補跑，不可假裝已完成。
- [ ] GitHub Actions CI build 通過。

完成後 M11 Production hardening 結案，再評估是否進 M12。

---

## 已完成任務

### M11.3 — Live stream bandwidth / lifecycle guardrails（已完成）
- [x] repo 僅 `CameraModal` 使用 `/api/proxy/image`；卡片、地圖 hover、Bottom Sheet 維持 snapshot。
- [x] Camera Modal 預設顯示 snapshot，不再於快照載入後自動建立 MJPEG live。
- [x] 使用者必須明確按「開啟直播」；直播中提供「停止直播」，停止後回到 snapshot。
- [x] Camera 切換／modal 關閉會卸載 live `<img>`；分頁隱藏與 pagehide 也會停止 live。
- [x] live error 改為手動重試，不做背景自動重連，避免重複 proxy request。
- [x] `/api/proxy/image` 保留 no-cache、allowlist 與 redirect revalidation。
- [x] server-side connect timeout 15 秒、live relay 最長 90 秒、Vercel `maxDuration=120`。
- [x] client request abort 時同步 abort upstream stream。
- [x] GitHub Actions run `34709897660` 成功。

### M11.2 — Source freshness / health visibility（已完成）
- [x] 前端共用 source-health model 涵蓋 TDX events / flow / CMS 與 CWA rainfall。
- [x] 保留 API status / fetchedAt / dataCollectTime / observedAt，不只依賴 `enabled`。
- [x] 圖層面板顯示載入中、正常、部分資料、未啟用、暫時失敗、資料較舊與來源時間。
- [x] unavailable 圖層保留灰色控制項並顯示原因，不再直接消失。
- [x] rainfall / flow / CMS 使用保守 stale 門檻，只標示資料較舊，不等同服務故障。
- [x] 不顯示 TDX credentials、上游 stack 或原始敏感錯誤內容。
- [x] GitHub Actions run `34709736577` 成功。

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
- [x] M11.2 Source freshness / health visibility
- [x] M11.3 Live stream bandwidth / lifecycle guardrails
- [ ] M11.4 Production diagnostics / deploy checklist — **ChatGPT**

---

## Executor 原則

預設：`ChatGPT`。只有大型跨檔重構、複雜除錯、必須依賴完整本機／瀏覽器 agent、或 ChatGPT 無法可靠完成與驗證時，才標示 `Executor: Codex`。一般 build 由 GitHub Actions 處理。
