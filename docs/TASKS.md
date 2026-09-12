# TASKS.md

> Repository：`similaitw/taiwan-live-traffic`
>
> 執行原則：GitHub `main` 為唯一狀態來源。預設由 ChatGPT 直接實作與驗收；只有明確標示 `Executor: Codex` 才使用 Codex。一般 build 由 GitHub Actions 處理。
>
> 為節省 token，本檔只保留 Current task、近期完成內容與 milestone/CI 索引；早期細節可由 Git history 查閱。

## Current task

### M16.1 — Production attack-surface cleanup

**Executor: ChatGPT**

目標／範圍：

- [x] 移除未被產品使用、可由 query parameter 讓 server 任意 `fetch()` URL 的 `/api/test-source` 開發診斷端點。
- [x] 搜尋 API routes 的 user-controlled `url` query；保留的 `/api/proxy/image` 與 `/api/proxy/snapshot` 必須繼續經共用 allowlist / redirect revalidation。
- [ ] production build route list 不再出現 `/api/test-source`。
- [ ] `npm audit --audit-level=high` 與 `npm run build` 通過。

完成後再評估 M16.2 是否需要補 security regression tests / route allowlist tests。

---

## 近期完成

### M15 — CI modernization（完成）
- [x] M15.1 升級官方 actions：`checkout@v7.0.1`、`setup-node@v7.0.0`、`cache@v6.1.0`；專案 runtime 仍為 Node 22。CI `34725249161`。
- [x] 新增 `.next/cache`；後續 run log 明確 `Cache hit for: Linux-nextjs-...`，production compile 約由 5.3s 降至 113ms。
- [x] push / PR CI 保留 `npm ci` + `npm audit --audit-level=high` + `npm run build`，workflow 僅 `contents: read`。
- [x] M15.2 新增每週一 00:15 UTC（台灣約 08:15）read-only dependency audit；不自動修改依賴、不 push main。首次 audit run `34725323604` 全綠。
- [x] 新 audit workflow commit 的正常 CI `34725323559` 也全綠。

### M14 — Dependency / CI security（完成）
- [x] Next.js `16.2.1` → `16.3.5`；`fast-xml-parser` `5.5.9` → `5.11.1`，由 npm 在 GitHub runner 正式重建 lockfile。
- [x] `npm audit` 從 8 個漏洞（1 critical / 4 high / 2 moderate / 1 low）降為 2 個（0 critical / 0 high / 1 moderate / 1 low）。
- [x] CI 新增 `npm audit --audit-level=high`；最終 CI `34725159970` 全綠。

### M13 — Search V2（完成）
- [x] M13.1 共用 matcher：name / ID / road / roadNumber / county / district / mile / direction / tags。CI `34724600973`。
- [x] M13.2 分類建議：道路／地區／監視器；鍵盤操作與行動版高度限制。CI `34724916576`。
- [x] M13.3 URL / ARIA polish。CI `34724980764`。

---

## Milestone / CI 索引

- [x] **M1 基礎資料模型** — Camera V2、geo、hooks。
- [x] **M2 UI 2.0** — mobile map-first、desktop sidebar、Bottom Sheet。
- [x] **M3 地圖效能** — clustering `34703638881`、viewport diff `34703721411`。
- [x] **M4 使用者功能** — 收藏 `34703855243`、最近 `34704005838`、分享/URL `34704132752`。
- [x] **M5 道路模式** — grouping `34704232348`、navigator `34704427438`、nearby `34704517553`。
- [x] **M6 即時事件** — foundation `34704685825`、overlay `34704812771`、workflow `34704931928`。
- [x] **M7 壅塞／旅行速度** — live flow `34705057134`、shape join `34705149764`、overlay `34705369615`。
- [x] **M8 CMS** — foundation `34705565204`、overlay `34705688422`、filters `34705864679`。
- [x] **M9 天氣／降雨** — rainfall `34708540549`、radar `34708797685`、CCTV cross-check `34708915050`。
- [x] **M10 圖層控制** — unified controls `34709009247`、mobile polish `34709117895`、preferences `34709191760`。
- [x] **M11 Production hardening** — 完成。
- [x] **M12 Route / Trip Mode** — 完成。
- [x] **M13 Search V2** — 完成。
- [x] **M14 Dependency / CI security** — 完成。
- [x] **M15 CI modernization** — 完成。
- [ ] **M16 Security regression / attack surface** — 進行中。

---

## Executor 原則

只有大型跨檔重構、複雜除錯、必須依賴完整本機／瀏覽器 agent、或 ChatGPT 無法可靠完成與驗證時，才標示 `Executor: Codex`。除此之外由 ChatGPT + GitHub Actions 完成。
