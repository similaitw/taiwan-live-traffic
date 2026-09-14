# Taiwan Live Traffic V2 — Release Readiness

日期：2026-09-13

## 結論

**V2 Production Release accepted。**

驗收日期：2026-09-13～2026-09-14（Asia/Taipei）。本機 Vercel CLI 可存取既有 team/project，connector 403 不再阻塞。

- Production：https://taiwan-live-traffic.vercel.app/
- 驗收 deployment：https://taiwan-live-traffic-oofaoc3qz-similaitws-projects.vercel.app/
- Deployment：`dpl_D7ym8kK4Wbay2v93kngEnNbov8Nm`，READY / production。
- 部署／最小修復 SHA：`f0a1f4c0959ffbda7ead8b16ab0c0c819fa22233`（驗收時 main）；後續文件 commit 不改 runtime。
- 修復：Map 容器建立独立堆疊層，解除 Leaflet 蓋住手機搜尋／篩選／定位控制項。
- CI `34759241358` audit / regression tests / build 通過；Vercel production build 通過。

接受範圍依 `docs/CODEX_M22_2.md`：允許 TDX 未配置時的 disabled graceful degradation，不代表 TDX 實際資料已驗證。國道來源無資料仍列後續追蹤。

---

## 1. V2 MVP Definition of Done

| 項目 | 狀態 | Repo 證據 |
|---|---|---|
| 手機為 map-first UX | ✅ | `app/page.tsx` mobile full-map layout；`CameraBottomSheet.tsx` |
| 桌面為 sidebar + map | ✅ | `app/page.tsx` desktop persistent sidebar + Map |
| Marker clustering | ✅ | `components/MapInner.tsx` viewport clustering / zoom-in cluster behavior |
| 收藏可持久保存 | ✅ | `hooks/useFavorites.ts`，localStorage key `taiwan-live-traffic:favorites` |
| 最近觀看 | ✅ | `hooks/useRecentCameras.ts`，最多 20 支 |
| Nearby 5 / 10 / 20 km | ✅ | `components/NearbyFilter.tsx` + `lib/geo.ts` |
| Road mode | ✅ | `lib/roads.ts`、`RoadFilter.tsx`、M20 direction-aware road mode |
| Road Camera 上一支／下一支 | ✅ | `RoadCameraNavigator.tsx` + `getRoadNeighbors()` |
| Camera detail 預設只載 Snapshot | ✅ | `CameraBottomSheet.tsx` / `CameraModal.tsx` 使用 `/api/proxy/snapshot` |
| LIVE 需使用者主動觸發 | ✅ | `CameraModal.tsx` 只有按「開啟直播」才建立 `/api/proxy/image` |
| 不再無條件顯示假 LIVE | ✅ | passive Camera status；只有真正 live image `onLoad` 後才顯示 LIVE |
| URL 可分享主要 Camera / Search state | ✅ | `camera / q / road / direction / nearby / type` query-string state；Web Share + copy fallback |
| Proxy allowlist 不退化 | ✅ | `lib/camera-proxy-security.ts` 僅允許官方 Camera hosts / THB pattern；禁止 URL credentials |
| Redirect 防 SSRF | ✅ | `fetchAllowedCameraResource()` 使用 manual redirect，每跳重新 `parseAllowedCameraUrl()`，最多 4 跳 |
| Upstream partial failure 仍可用 | ✅ | `/api/cameras` 使用 `Promise.allSettled()`，失敗來源不阻斷已成功來源 |
| `npm run build` | ✅ | M21 最終正常 CI `34732975943` 全綠；M22.1 readiness audit CI `34733089266` 亦全綠 |

---

## 2. CI / dependency / regression gate

目前 `.github/workflows/ci.yml` 對 `main` push 與 PR 執行：

1. Node.js 22。
2. `npm ci`。
3. `npm audit --audit-level=high`。
4. `npm run test:security`（實際執行 `tests/*.test.ts` 全部 regression tests）。
5. `npm run build`。

並使用 GitHub 官方 `checkout@v7.0.1`、`setup-node@v7.0.0`、`cache@v6.1.0` 與 `.next/cache`。

M18 已將 npm audit 清至 **0 vulnerabilities**；其後 package manifest / lockfile 未因 M19–M22 文件／功能修改而變更。

---

## 3. Production configuration consistency

### TDX

`.env.example` 與目前 server-side auth 使用相同 Production variables：

- `TDX_CLIENT_ID`
- `TDX_CLIENT_SECRET`

不得使用 `NEXT_PUBLIC_*` 暴露 credentials。

### CWA

目前 rainfall / radar 使用公開 OpenData：

- `O-A0002-001` rainfall
- `O-A0058-006` radar

不要求 CWA API key。

### Passive health endpoint

`/api/health`：

- `Cache-Control: no-store`
- 只回 `tdx.configured` boolean，不回 credentials
- 回報 deployment environment / commit SHA
- 回報 proxy allowlist、redirect revalidation、LIVE explicit opt-in 與 90 秒 relay guardrail
- 不主動 probe TDX / CWA / CCTV upstream

---

## 4. Camera proxy / resource guardrails

Repo 已驗證：

- 只允許 HTTP(S)。
- 拒絕 URL username/password。
- Camera hostname allowlist + THB CCTV hostname pattern。
- redirect manual follow；每跳重驗 hostname；最多 4 跳。
- Snapshot：bounded memory cache、payload size cap、timeout、單幀 capture。
- LIVE：使用者 explicit opt-in、關閉 / visibility / pagehide cleanup、server relay duration guardrail。
- 已移除舊 `/api/test-source?url=` 任意 fetch 診斷 endpoint。

---

## 5. Accessibility / interaction readiness

M21 已完成：

- icon-only 主要操作提供可讀名稱。
- Camera / source health 同時顯示文字，不只靠顏色。
- Modal / Bottom Sheet / Search suggestions / Map layer panel 支援 Escape。
- 全站 `:focus-visible` outline。
- `prefers-reduced-motion: reduce` 降低非必要 animation / transition。
- CameraModal 使用 `role="dialog"`、`aria-modal="true"`、`aria-labelledby`。
- Modal 開啟時 focus 移入；Tab / Shift+Tab 留在 dialog；關閉後盡量還原原操作元素。
- Bottom Sheet 保持非 modal，地圖仍可互動。

---

## 6. Production acceptance evidence

| 檢查 | 結果 |
|---|---|
| Identity | team similaitws-projects、project prj_eClgksBgIni9eIWxpRXbyx4gfqaS；REST metadata production / READY / githubCommitSha 與 health 相符；Git integration production branch=main |
| Health | 200、ok、production、no-store；不含 credentials，tdx.configured=false |
| Cameras / rainfall | 200；2,181 cameras，首次 1,335 rainfall stations / source ok；修復後 API 再驗通過 |
| TDX APIs / CMS | traffic-events、traffic-flow、traffic-sections、cms 全部 200 / enabled=false / disabled；介面顯示需要金鑰，沒有全站 500 |
| Snapshot | provincial-CCTV-35-0260-042-003：200、image/jpeg、10,683 bytes、JPEG magic ffd8；UI 顯示快照 |
| LIVE | UI 點開詳情與直播後 naturalWidth=308、狀態 LIVE；停止後 live image=0；預設與 reload 均不自動直播；修復後重驗成功 |
| 375px | 搜尋／chips／定位可見，Bottom Sheet、圖層開關、雷達與雨量操作正常；stacking 修復後重驗 |
| 768px | Sidebar / map 無嚴重重疊；搜尋、道路方向、Modal 快照正常 |
| 1280px | Sidebar / map、快照 Modal；Tab / Shift+Tab 留在 dialog、Escape 關閉 |
| Search / Road / Direction / Share URL | 42K+230、0K+410 命中；q=0K+410、road=台61、direction=south、camera=provincial-CCTV-11-0610-000-018 reload 後全部還原。已點分享按鈕，clipboard 讀取被系統拒絕；以實際 address-bar URL reload 驗證分享連結 |
| Nearby | 選 5km 後 URL nearby=5，拒絕 geolocation 時明示 User denied Geolocation，不偽造成功 |
| Basemap / layers | OSM 無 API KEY REQUIRED；雷達／雨量可切換，TDX unavailable 明示 |
| Errors | agent-browser errors 無 uncaught error；Vercel 近 1h error logs 查無結果（僅代表查詢區間） |

截圖保留於本機 TEMP（m22-fixed-375.png、m22-fixed-sheet.png、m22-768-main.png、m22-768-detail.png、m22-1280-main.png），不提交二進位檔。

## 7. Release decision

**V2 Production Release：accepted。**

已完成 M22.2 指定的 deployment、API、Snapshot/LIVE 與三種 viewport 實際驗收，並以最小修復解除手機 controls 遮蔽問題。

後續追蹤：TDX credentials 仍缺；國道／縣市來源無資料；OSM best-effort 可用性。進階功能另開任務。
