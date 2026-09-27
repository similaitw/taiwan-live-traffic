# TASKS.md

> Repository：`similaitw/taiwan-live-traffic`
>
> 執行原則：GitHub `main` 為唯一狀態來源。預設由 ChatGPT 直接實作與驗收；只有明確標示 `Executor: Codex` 才使用 Codex。一般 build / test 由 GitHub Actions 處理。
>
> 為節省 token，本檔只保留 Current task、近期完成內容與 milestone/CI 索引；早期細節可由 Git history 查閱。

## Current task

### V3.5 — 真正的站內 Route Planner

**Executor: ChatGPT**

原本「起點／終點 + Google Maps URL」只會外部跳轉，無法提供站內路線 geometry，也不能真正形成沿途 CCTV，因此已改成完整站內路線流程。

- [x] `/api/route-plan`：Nominatim（限台灣）地理編碼 → OSRM driving route。
- [x] Nominatim 僅在按「規畫路線」時呼叫，不做 autocomplete；1 req/s pacing + warm-cache。
- [x] Route Planner 主操作改成「規畫路線」，移除 Google Maps URL 核心功能。
- [x] Leaflet 直接畫 route geometry 並 fit bounds。
- [x] 以 route polyline segment 最短距離挑出 1.5km corridor 內 CCTV。
- [x] CCTV 依 route progress 排序，直接接既有 Snapshot autoplay / 3-5-10秒 / filmstrip。
- [x] Route mode 的 map/list 在規畫後只顯示沿途 CCTV。
- [x] route camera regression tests；修正稀疏 geometry 時的 segment-distance matching。
- [x] CI `36287099183`：audit / 全部 regression tests / production build 全綠。
- [ ] Vercel Git integration 恢復後部署 production，實測「羅東 → 台北」與 375 / 768 / 1280。

---

## 近期完成

### V3.2 / V3.3 / V3.4 — Corridor CCTV / Autoplay / Filmstrip / Skins（功能完成）
- [x] Feature commit：`04d6fe93344169b0690333678da4fa29807b4204`。
- [x] Mobile map autoplay sync fix：`6acf138a8152dbf2de317ac39f724d90682c86d7`。
- [x] Latest docs/main：`dee68e26924ef725a481e215c63a7df2c9448bf9`。
- [x] 4 skins：黑曜／海灣／森林／暮紫，localStorage 持久化。
- [x] Corridor player：Snapshot autoplay 預設 ON、3/5/10 秒、上一支／下一支、filmstrip。
- [x] Road + direction + mileage sequence、`play=` URL restore、map active-camera sync。
- [x] CI `36148795365` 全綠。
- [x] Vercel Preview READY：`taiwan-live-traffic-5x3wjhsyo-similaitws-projects.vercel.app`。
- [x] Vercel 近 24h runtime errors：0。
- [x] 已確認不採額外 `VERCEL_TOKEN` promotion workflow；正式部署應回歸 Vercel Git integration（Production Branch = `main`）。

---

### V3.1 — Route UX Foundation（完成）
- [x] Route / Road / Nearby 三模式；Route 為新版預設。
- [x] 起點、終點、最多 8 個途經點。
- [x] 免 API Key Google Maps Directions URL launcher。
- [x] `mode / from / to / via` URL restore / share foundation，並相容舊 road / nearby URL。
- [x] Desktop / Tablet sidebar + map、Mobile floating RoutePlanner。
- [x] 模式切換不再被隱藏的 road / nearby 條件暗中過濾。
- [x] `tests/route-plan.test.ts`。
- [x] Feature commit `025134274c7b3eeab381c01f85cff633a59c4911`。
- [x] CI `36083617053`：audit / regression tests / production build 全綠。

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
- [ ] **V3 路線型即時監控地圖** — V3.1–V3.5 核心功能完成，待 Vercel production 同步與 responsive smoke test。

---

## Executor 原則

只有大型跨檔重構、複雜除錯、必須依賴完整本機／瀏覽器 agent、或 ChatGPT 無法可靠完成與驗證時，才標示 `Executor: Codex`。除此之外由 ChatGPT + GitHub Actions 完成。
