# TASKS.md

> Repository：`similaitw/taiwan-live-traffic`
>
> 執行方式：每次只完成一個 `Current task`。預設由 ChatGPT 直接透過 GitHub 實作與驗收；只有明確標示 `Executor: Codex` 才使用 Codex。

## Current task

### M13.1 — Search V2 matching foundation

**Executor: ChatGPT**

目標／範圍：

- [ ] 建立共用 Camera 搜尋 utility，不再把欄位比對邏輯散落在 `app/page.tsx`。
- [ ] 搜尋至少支援：Camera 名稱、ID、道路名稱、道路編號、縣市、行政區、公里數、方向與 tags。
- [ ] 查詢與資料文字採 NFKC / trim / case-insensitive 正規化；臺／台差異不得影響道路與地區常見搜尋。
- [ ] 公里數搜尋支援常見 `38K` / `38.2K` / `38+200` 等輸入，不要求使用者完全符合來源格式。
- [ ] 回傳可供下一階段分類建議使用的 match metadata，但 M13.1 不改現有搜尋 UI。
- [ ] 空查詢維持顯示全部 Camera；不破壞道路、收藏、最近、附近等既有 filter。
- [ ] 不導入外部搜尋服務或新狀態管理套件。
- [ ] GitHub Actions CI build 通過。

完成後將 Current task 更新成 M13.2 — Categorized search suggestions。

---

## 已完成任務

### M12.3 — Corridor navigation / share state（已完成）
- [x] Trip Mode 新增沿線分享按鈕；支援 Web Share API，fallback 複製網址。
- [x] 分享網址固定保留 `road=`；若 corridor 未來帶 direction，會使用 `direction=`，未提供方向則安全移除。
- [x] corridor 分享移除 `camera/q/type/nearby` 等可能意外縮窄結果的狀態，重新開啟可恢復道路情境。
- [x] 沿線 Camera 導覽直接使用 M12.1 已依 mile 排序的 `corridor.cameras`。
- [x] 上一支／下一支只切換沿線 Camera；「查看 CCTV」帶 `camera=` 回到既有 detail workflow，不建立第二套 viewer。
- [x] 手機仍使用 Bottom Sheet、桌面仍使用 snapshot-first Modal；不因 Trip Mode 自動啟動 LIVE。
- [x] UI 持續標示「道路情境聚合，非 A→B 導航路線」。
- [x] GitHub Actions run `34724413433` 成功。

### M12.2 — Trip Mode UI / corridor summary（已完成）
- [x] 新增 `components/TripModeSummary.tsx`，提供桌面完整卡片與手機可收合摘要。
- [x] 單一道路 context 自動顯示沿線摘要，不影響既有 Camera clustering / detail / layer controls。
- [x] 摘要使用 `buildRouteCorridor()`，呈現目前可見 CCTV、壅塞、事件、CMS、鄰近雨量站與近 1 小時最大雨量。
- [x] 明確標示「道路情境聚合，非 A→B 導航路線」。
- [x] TDX unavailable 時顯示不可用／—，仍保留 CCTV / CWA 可用資訊，不把 unavailable 誤當 0。
- [x] 不新增 API fetch、不自動開 LIVE；重用 Map 已載入資料與既有 snapshot-first 流程。
- [x] GitHub Actions run `34712481748` 成功。

### M12.1 — Route corridor / Trip Mode foundation（已完成）
- [x] 新增 `types/route-corridor.ts` 共用資料模型。
- [x] 新增 `lib/route-corridor.ts`，以道路編號／方向聚合 Camera、即時壅塞、事件、CMS 與附近雨量。
- [x] Camera 依 mile 排序；壅塞沿用既有 TDX congestion level >= 3 判定。
- [x] 雨量只使用 corridor Camera 15 km 內測站作沿線參考，不把直線距離冒充導航路徑。
- [x] summary 輸出 Camera、壅塞路段、事件、CMS 設備／訊息、雨量站、有雨測站與近 1 小時最大雨量。
- [x] 每個資料源保留 available / unavailable，TDX 未設定仍可產生部分 corridor。
- [x] 不改既有 Camera / traffic / CMS / rainfall API response shape。
- [x] GitHub Actions run `34712316259` 成功。

### M11.4 — Production diagnostics / deploy checklist（已完成）
- [x] 新增 `docs/PRODUCTION_CHECKLIST.md`，涵蓋 GitHub CI、Vercel env、TDX、CWA、Camera API、proxy 與正式站 smoke check。
- [x] 新增被動 `/api/health`，不主動 probe upstream，不製造額外 TDX / CWA / CCTV 負載。
- [x] health 只回報 TDX credentials 是否 configured，不回傳 Client ID / Secret 實際值。
- [x] health 回報 deployment environment / commit、CWA public OpenData 與 Camera proxy guardrails。
- [x] `.env.example` 明確記錄 TDX server-side env 與 CWA 無需 API key。
- [x] 正式站 checklist 明列 375px / 768px / 1280px、snapshot、手動 live、圖層面板與 graceful degradation。
- [x] 文件記錄目前 ChatGPT 執行環境無法取得 Vercel team / production URL，因此正式站瀏覽器 smoke check 不冒充已完成。
- [x] GitHub Actions run `34712218377` 成功。

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
- [x] M11.4 Production diagnostics / deploy checklist

### M12 — Route / Trip Mode
- [x] M12.1 Route corridor foundation
- [x] M12.2 Trip Mode UI / corridor summary
- [x] M12.3 Corridor navigation / share state

### M13 — Search V2
- [ ] M13.1 Search matching foundation — **ChatGPT**
- [ ] M13.2 Categorized search suggestions
- [ ] M13.3 Search selection / URL polish

---

## Executor 原則

預設：`ChatGPT`。只有大型跨檔重構、複雜除錯、必須依賴完整本機／瀏覽器 agent、或 ChatGPT 無法可靠完成與驗證時，才標示 `Executor: Codex`。一般 build 由 GitHub Actions 處理。
