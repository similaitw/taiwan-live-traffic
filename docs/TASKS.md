# TASKS.md

> Repository：`similaitw/taiwan-live-traffic`
>
> 執行原則：GitHub `main` 為唯一狀態來源。預設由 ChatGPT 直接實作與驗收；只有明確標示 `Executor: Codex` 才使用 Codex。一般 build 由 GitHub Actions 處理。
>
> 為節省 token，本檔只保留 Current task、近期完成內容與 milestone/CI 索引；早期細節可由 Git history 查閱。

## Current task

### M17.1 — Snapshot proxy memory / payload bounds

**Executor: ChatGPT**

目標／範圍：

- [ ] 為 `/api/proxy/snapshot` 的 in-memory cache 設定最大 entries，避免 user-controlled allowed URL variants 無限制增加 Map。
- [ ] cache 寫入前清理過期 entries；超過上限時淘汰最舊 entry。
- [ ] 對非 multipart snapshot response 設單張最大 bytes；不得再無上限 `arrayBuffer()`。
- [ ] multipart JPEG 擷取維持既有 byte cap，並確保 reader / timeout 正常清理。
- [ ] 不改 hostname allowlist、不改 redirect revalidation、不影響正常 Camera snapshot-first UI。
- [ ] 補必要 regression tests；`npm audit --audit-level=high`、tests、`npm run build` 全部通過。

完成後再評估 M17.2 是否需要 rate limiting / upstream concurrency guardrail。

---

## 近期完成

### M16 — Security regression / attack surface（完成）
- [x] M16.1 移除未被產品使用、可任意 server-side fetch URL 的 `/api/test-source`；production route list 已移除該端點。CI `34725405017`。
- [x] user-controlled `url` API route 僅剩 `/api/proxy/image` 與 `/api/proxy/snapshot`，兩者都經共用 allowlist / redirect revalidation。
- [x] M16.2 新增 `tests/camera-proxy-security.test.ts`，涵蓋官方 host、THB dynamic host、lookalike / loopback、非 HTTP(S)、credentials、redirect revalidation 與 redirect 上限。
- [x] `tsx` test runner 已鎖入 devDependencies；`npm run test:security` 納入 push / PR CI。
- [x] 一次性 write-permission setup workflow 已刪除；正常 CI 維持 `contents: read`。
- [x] 最終 CI `34730221902`：audit、security tests、production build 全綠。

### M15 — CI modernization（完成）
- [x] 官方 actions：`checkout@v7.0.1`、`setup-node@v7.0.0`、`cache@v6.1.0`；專案 runtime Node 22。CI `34725249161`。
- [x] `.next/cache` 已確認真實 cache hit，production compile 曾由約 5.3s 降至 113ms。
- [x] 每週一 00:15 UTC read-only dependency audit；首次 run `34725323604` 全綠。

### M14 — Dependency / CI security（完成）
- [x] Next.js `16.2.1` → `16.3.5`；`fast-xml-parser` `5.5.9` → `5.11.1`。
- [x] `npm audit` 從 8 個漏洞降為 2 個（0 critical / 0 high / 1 moderate / 1 low）。
- [x] CI `npm audit --audit-level=high` gate；CI `34725159970` 全綠。

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
- [x] **M16 Security regression / attack surface** — 完成。
- [ ] **M17 Proxy resource controls** — 進行中。

---

## Executor 原則

只有大型跨檔重構、複雜除錯、必須依賴完整本機／瀏覽器 agent、或 ChatGPT 無法可靠完成與驗證時，才標示 `Executor: Codex`。除此之外由 ChatGPT + GitHub Actions 完成。
