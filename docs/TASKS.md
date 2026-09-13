# TASKS.md

> Repository：`similaitw/taiwan-live-traffic`
>
> 執行原則：GitHub `main` 為唯一狀態來源。預設由 ChatGPT 直接實作與驗收；只有明確標示 `Executor: Codex` 才使用 Codex。一般 build 由 GitHub Actions 處理。
>
> 為節省 token，本檔只保留 Current task、近期完成內容與 milestone/CI 索引；早期細節可由 Git history 查閱。

## Current task

### M18.1 — Clear remaining npm audit findings

**Executor: ChatGPT**

目標／範圍：

- [ ] 使用 npm 正式更新 lockfile，修補目前剩餘 `baseline-browser-mapping` moderate 與 `postcss-selector-parser` low advisory。
- [ ] 不手工修改 package-lock integrity / transitive dependency。
- [ ] 優先使用非 breaking 的 `npm audit fix`；若會升 major 或破壞 build，停止並保留風險說明。
- [ ] 更新後 `npm audit` 目標為 0 vulnerabilities；至少不得重新出現 high / critical。
- [ ] `npm run test:security` 與 `npm run build` 全部通過。
- [ ] 完成後移除一次性 dependency-fix workflow。

完成後再評估下一個產品功能 milestone，不再為了「有事做」而加入低價值 production guardrail。

---

## 近期完成

### M17.1 — Snapshot proxy memory / payload bounds（完成）
- [x] `/api/proxy/snapshot` cache 改為 64-entry bounded cache、30 秒 TTL；寫入前清理 stale entries，滿載淘汰最舊 entry。
- [x] 非 multipart snapshot 改為 streaming bounded read，單張上限 2 MiB；不再無上限 `arrayBuffer()`。
- [x] multipart JPEG 維持 2 MiB byte cap，超限回 502；8 秒 timeout 現涵蓋完整 frame capture，而非只保護 response headers。
- [x] 新增 `tests/snapshot-resource-limits.test.ts`，涵蓋 TTL、stale prune、oldest eviction、Content-Length 與 chunked body 超限。
- [x] `test:security` 改跑全部 `tests/*.test.ts`。
- [x] CI `34730322887`：audit、security/resource tests、production build 全綠。
- [x] M17.2 per-instance rate limiting 暫不實作：在 serverless 環境不是全域限制，易產生錯誤安全感；若 production metrics 顯示濫用再導入可共享 rate-limit store。

### M16 — Security regression / attack surface（完成）
- [x] M16.1 移除任意 server-side fetch 的 `/api/test-source`；production route list 已移除該端點。CI `34725405017`。
- [x] M16.2 新增 Camera proxy security regression tests，涵蓋 allowlist、lookalike / loopback、protocol / credentials、redirect revalidation 與 redirect 上限。
- [x] `tsx` test runner 納入 devDependencies；`npm run test:security` 納入 push / PR CI。
- [x] 一次性 write-permission setup workflow 已刪除；正常 CI 維持 `contents: read`。最終 CI `34730221902` 全綠。

### M15 — CI modernization（完成）
- [x] 官方 actions：`checkout@v7.0.1`、`setup-node@v7.0.0`、`cache@v6.1.0`；專案 runtime Node 22。CI `34725249161`。
- [x] `.next/cache` 已確認真實 cache hit；每週 read-only dependency audit 已啟用。

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
- [x] **M17 Proxy resource controls** — snapshot bounds 完成；serverless local rate-limit deferred。
- [ ] **M18 Dependency cleanup** — 進行中。

---

## Executor 原則

只有大型跨檔重構、複雜除錯、必須依賴完整本機／瀏覽器 agent、或 ChatGPT 無法可靠完成與驗證時，才標示 `Executor: Codex`。除此之外由 ChatGPT + GitHub Actions 完成。
