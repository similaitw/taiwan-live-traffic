# Taiwan Live Traffic V2 — Release Readiness

日期：2026-09-13

## 結論

**Repo 狀態：Release Candidate ready。**

V2 MVP 的程式碼、security guardrails、regression tests 與 production build 已具備完整 repo-side 證據；但 **Production Release 尚未正式接受**。

已取得使用者提供的 deployment URL：

`https://taiwan-live-traffic-4xtnqcy76-similaitws-projects.vercel.app/`

Vercel API 能由此網址辨識 team scope `similaitws-projects`，但目前 connected app 對該 scope 回 `403 Not authorized`，並要求重新授權；share / protected deployment fetch 也因同一 scope 權限失敗。這代表目前阻塞已不是「不知道 production URL」，而是「無法取得該 Vercel team scope 的授權與部署資訊」。

此外，此 ChatGPT 執行環境直接解析該 deployment hostname 失敗，因此目前無法以 browser / HTTP fallback 完成 375 / 768 / 1280px 正式站 smoke test、`/api/health` production response、TDX Production env 與實際 Snapshot / LIVE 驗證。

> GitHub CI 成功不等同 production deployment 已成功。本文件刻意把「repo 已驗證」與「正式站待驗證」分開。

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

## 6. 尚未驗證：Production acceptance

目前 **不可標示已完成**：

- [ ] 確認提供的 deployment URL 是 Production 而非 Preview。
- [ ] Vercel 最新 Production deployment 對應目前 `main` commit。
- [ ] Production `TDX_CLIENT_ID` / `TDX_CLIENT_SECRET` 已設定（只確認存在，不讀取值）。
- [ ] Production `/api/health` HTTP 200，commit SHA 與 main 一致。
- [ ] `/api/cameras` / rainfall / TDX APIs production smoke checks。
- [ ] 一支允許來源 Camera Snapshot 可用。
- [ ] 手動 LIVE 開啟／停止 lifecycle 可用。
- [ ] 375px 手機 smoke test。
- [ ] 768px 平板 smoke test。
- [ ] 1280px 桌面 smoke test。
- [ ] 無 TDX credentials 的 graceful degradation smoke test（Preview 或測試環境）。

目前唯一已知外部阻塞：Vercel connected app 對 `similaitws-projects` team scope 未授權。重新授權該 scope 後即可繼續 M22.2。

---

## 7. Release decision

### V2 Release Candidate

**✅ 可標記 RC。**

Repo-side Definition of Done、build / test / dependency gate、proxy security、resource limits、passive status、road direction mode 與 accessibility hardening 均已完成。

### Production Release

**⏳ 尚待 M22.2 production smoke test。**

正式接受 release 前仍需完成 `docs/PRODUCTION_CHECKLIST.md` 的 production deployment / environment / browser smoke checks。
