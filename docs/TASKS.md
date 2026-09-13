# TASKS.md

> Repository：`similaitw/taiwan-live-traffic`
>
> 執行原則：GitHub `main` 為唯一狀態來源。預設由 ChatGPT 直接實作與驗收；只有明確標示 `Executor: Codex` 才使用 Codex。一般 build / test 由 GitHub Actions 處理。
>
> 為節省 token，本檔只保留 Current task、近期完成內容與 milestone/CI 索引；早期細節可由 Git history 查閱。

## Current task

### M19.1 — Passive Camera snapshot status foundation

**Executor: ChatGPT**

目標／範圍：

- [ ] 不新增背景 probe；只重用使用者原本就會載入的 snapshot 成功／失敗事件。
- [ ] 建立共用 Camera status observation utility，沿用既有 `online / stale / offline / unknown` 型別。
- [ ] snapshot 成功記錄 `online + lastCheckedAt + lastFrameAt`；失敗記錄 `lastCheckedAt`，有既有 frame 時標示 `stale`，無既有 frame 時標示 `offline`。
- [ ] 已成功但長時間沒有新 frame 的狀態可轉為 `stale`，避免永遠顯示 online。
- [ ] CameraCard 顯示中性、非假 LIVE 的被動快照狀態；錯誤文案不得把單次失敗誇大為永久離線。
- [ ] 不改 `/api/cameras` response shape、不增加 CCTV upstream 請求、不自動啟動 live stream。
- [ ] 補純函式 regression tests；`npm audit`、security tests、`npm run build` 全部通過。

完成後進入 M19.2 — Share passive status with Bottom Sheet / detail surfaces。

---

## 近期完成

### M18 — Dependency cleanup（完成）
- [x] 使用非 breaking `npm audit fix` 更新 transitive dependencies，未使用 `--force`、未手工改 lockfile integrity。
- [x] `npm audit`：2 個（1 moderate / 1 low）→ **0 vulnerabilities**。
- [x] one-shot run `34730371657`：13/13 security/resource tests 通過、production build 成功。
- [x] bot commit `b6972c9` 套用 lockfile fixes；一次性 write-permission workflow 已移除。
- [x] 最終正常 read-only CI `34730410486`：audit、tests、build 全綠。

### M17.1 — Snapshot proxy memory / payload bounds（完成）
- [x] `/api/proxy/snapshot` 改為 64-entry bounded cache、30 秒 TTL；滿載淘汰最舊 entry。
- [x] 非 multipart 與 multipart frame 都有 2 MiB 上限；8 秒 timeout 涵蓋完整 frame capture。
- [x] 新增 snapshot resource regression tests；CI `34730322887` 全綠。
- [x] serverless per-instance rate-limit 暫不實作，避免產生全域防護的錯誤安全感。

### M16 — Security regression / attack surface（完成）
- [x] 移除任意 server-side fetch 的 `/api/test-source`；production route list 已移除該端點。CI `34725405017`。
- [x] Camera proxy allowlist / redirect regression tests 納入正常 CI；最終 CI `34730221902` 全綠。

### M15 — CI modernization（完成）
- [x] 官方 actions 更新至 checkout 7.0.1 / setup-node 7.0.0 / cache 6.1.0；Node 22。
- [x] `.next/cache` 已確認真實 cache hit；每週 read-only dependency audit 已啟用。

---

## Milestone / CI 索引

- [x] **M1 基礎資料模型** — Camera V2、geo、hooks。
- [x] **M2 UI 2.0** — mobile map-first、desktop sidebar、Bottom Sheet。
- [x] **M3 地圖效能** — clustering / viewport diff。
- [x] **M4 使用者功能** — 收藏、最近、分享/URL。
- [x] **M5 道路模式** — grouping、navigator、nearby。
- [x] **M6 即時事件** — TDX event foundation / overlay。
- [x] **M7 壅塞／旅行速度** — TDX flow / shape / overlay。
- [x] **M8 CMS** — foundation / overlay / filters。
- [x] **M9 天氣／降雨** — CWA rainfall / radar / CCTV cross-check。
- [x] **M10 圖層控制** — unified controls / mobile polish / preferences。
- [x] **M11 Production hardening**。
- [x] **M12 Route / Trip Mode**。
- [x] **M13 Search V2**。
- [x] **M14 Dependency / CI security**。
- [x] **M15 CI modernization**。
- [x] **M16 Security regression / attack surface**。
- [x] **M17 Proxy resource controls**。
- [x] **M18 Dependency cleanup** — 0 npm vulnerabilities。
- [ ] **M19 Passive Camera status** — 進行中。

---

## Executor 原則

只有大型跨檔重構、複雜除錯、必須依賴完整本機／瀏覽器 agent、或 ChatGPT 無法可靠完成與驗證時，才標示 `Executor: Codex`。除此之外由 ChatGPT + GitHub Actions 完成。
