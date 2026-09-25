# TASKS.md

> Repository：`similaitw/taiwan-live-traffic`
>
> 執行原則：GitHub `main` 為唯一狀態來源。預設由 ChatGPT 直接實作與驗收；只有明確標示 `Executor: Codex` 才使用 Codex。一般 build / test 由 GitHub Actions 處理。
>
> 為節省 token，本檔只保留 Current task、近期完成內容與 milestone/CI 索引；早期細節可由 Git history 查閱。

## Current task

### V3.1 — Route UX Foundation

**Executor: ChatGPT**

- [x] 建立 V3 product spec，改以「路線上的即時監控播放器」為核心。
- [x] 新增 Route / Road / Nearby 三模式；Route 為新版預設。
- [x] Route 支援起點、終點、最多 8 個途經點。
- [x] 新增免 API Key 的 Google Maps Directions URL launcher。
- [x] 新增 `mode / from / to / via` URL restore / share foundation，並相容既有 road / nearby URL。
- [x] Desktop sidebar、mobile floating controls 重排；Tablet 沿用 sidebar + map breakpoint。
- [x] 隱藏模式不再持續套用 road / nearby filter，避免模式切換後結果被舊條件暗中縮小。
- [x] 新增 route-plan regression tests。
- [ ] GitHub Actions audit / regression tests / production build 通過。

完成後進 V3.2：Route Corridor → 沿途 CCTV sequence。

---

## 近期完成

### M22.2 — Production deployment / browser smoke test（完成）

Executor: Codex；驗收日期：2026-09-13～2026-09-14（Asia/Taipei）。

- Production：https://taiwan-live-traffic.vercel.app/
- 驗收 deployment：https://taiwan-live-traffic-oofaoc3qz-similaitws-projects.vercel.app/
- Deployment ID：`dpl_D7ym8kK4Wbay2v93kngEnNbov8Nm`；READY / production。
- 部署與修復 commit：`f0a1f4c0959ffbda7ead8b16ab0c0c819fa22233`（驗收時 main）；後續文件 commit 僅記錄結果。
- [x] CLI / REST metadata 與 health 確認 team、project、production、SHA；未建立新 project。
- [x] Health 200 / ok / production / no-store；未輸出 credentials。
- [x] Cameras 200（2,181 筆）；rainfall 200 / ok（首次 1,335 站）；TDX 四個 API 全部 200 / disabled。
- [x] 合法 Camera snapshot 200 / image/jpeg / JPEG magic；UI 快照可用。
- [x] UI 手動 LIVE 成功，收到 308px 寬影像；停止後 live image 元素數歸零；預設與 URL restore 不啟動 LIVE。
- [x] 375px mobile / Bottom Sheet / layers；768px sidebar / detail；1280px sidebar / modal / Tab / Shift+Tab / Escape 實測。
- [x] Search、台61 / south / camera URL reload 還原；Nearby 5km 被拒定位時明示錯誤。
- [x] OSM 無 API KEY REQUIRED；雨量／雷達正常，TDX 圖層明示未啟用。
- [x] 最小修復：Map 容器加 isolate / z-0，解除手機控制項被地圖蓋住；production 重驗通過。
- [x] 修復 CI `34759241358` audit / regression tests / build 通過，Vercel build 通過；browser errors 無 uncaught error，近 1h Vercel error logs 無結果。
- **V2 Production Release accepted**，依 M22.2 允許 TDX disabled 的驗收條件。
- 已知限制：TDX 兩項憑證未設定；國道／縣市目前無資料，公路來源正常。進階功能另開任務。



### 底圖顯示 hotfix
- [x] 依使用者回報修正 CARTO 圖磚顯示 API KEY REQUIRED：改用 OpenStreetMap 標準圖磚並保留來源標示。
- [x] 深色濾鏡僅套用底圖，保留雷達與標記原色。
- 本機 Vercel CLI 可使用 production scope；connector 的 403 不影響 CLI 部署。M22.2 完整驗收仍待完成。

### M22.1 — V2 Definition of Done / release-readiness audit（完成）
- [x] 逐項核對 `docs/V2_SPEC.md` §21，V2 MVP repo-side Definition of Done 全部有實作／CI 證據。
- [x] 正常 CI 維持 Node 22、`npm ci`、`npm audit --audit-level=high`、全部 regression tests、`npm run build`。
- [x] `.env.example` 與 server-side TDX env 名稱一致；CWA public OpenData 不需 key。
- [x] `/api/health` 為 passive / no-store，只回 TDX configured boolean，不暴露 credentials。
- [x] `/api/cameras` 仍使用 `Promise.allSettled` 保持 partial success。
- [x] Camera proxy 仍有 hostname allowlist、URL credential rejection、manual redirect revalidation、最多 4 跳。
- [x] 產出 `docs/V2_RELEASE_READINESS.md`，清楚區分 repo RC 與 production acceptance。
- [x] Release-readiness 文件 commit 後正常 CI `34733089266` 全綠。
- [x] 結論：**Repo 可標記 V2 Release Candidate；Production Release 尚未接受。**

### M21 — Accessibility / interaction hardening（完成）
- [x] 全站 focus-visible / reduced-motion、dialog semantics、文字化狀態。
- [x] CameraModal focus save / trap / restore；Bottom Sheet 維持非 modal。
- [x] 最終正常 CI `34732975943` 全綠。

### M20 — Direction-aware road mode（完成）
- [x] 道路方向 normalization / filter / URL / Trip Mode integration；最終 CI `34732610626`。

---

## Milestone / CI 索引

- [x] **M1 基礎資料模型**。
- [x] **M2 UI 2.0**。
- [x] **M3 地圖效能**。
- [x] **M4 使用者功能**。
- [x] **M5 道路模式**。
- [x] **M6 即時事件**。
- [x] **M7 壅塞／旅行速度**。
- [x] **M8 CMS**。
- [x] **M9 天氣／降雨**。
- [x] **M10 圖層控制**。
- [x] **M11 Production hardening**。
- [x] **M12 Route / Trip Mode**。
- [x] **M13 Search V2**。
- [x] **M14 Dependency / CI security**。
- [x] **M15 CI modernization**。
- [x] **M16 Security regression / attack surface**。
- [x] **M17 Proxy resource controls**。
- [x] **M18 Dependency cleanup** — 0 npm vulnerabilities。
- [x] **M19 Passive Camera status**。
- [x] **M20 Direction-aware road mode**。
- [x] **M21 Accessibility / interaction hardening**。
- [x] **M22 V2 release readiness** — Production accepted，詳見 M22.2 驗收紀錄。
- [ ] **V3 路線型即時監控地圖** — V3.1 開發中。

---

## Executor 原則

只有大型跨檔重構、複雜除錯、必須依賴完整本機／瀏覽器 agent、或 ChatGPT 無法可靠完成與驗證時，才標示 `Executor: Codex`。除此之外由 ChatGPT + GitHub Actions 完成。
