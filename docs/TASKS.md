# TASKS.md

> Repository：`similaitw/taiwan-live-traffic`
>
> 執行原則：GitHub `main` 為唯一狀態來源。預設由 ChatGPT 直接實作與驗收；只有明確標示 `Executor: Codex` 才使用 Codex。一般 build / test 由 GitHub Actions 處理。
>
> 為節省 token，本檔只保留 Current task、近期完成內容與 milestone/CI 索引；早期細節可由 Git history 查閱。

## Current task

### M19.2 — Share passive status with Bottom Sheet / detail surfaces

**Executor: ChatGPT**

目標／範圍：

- [ ] 將 M19.1 的被動 Camera observation 提升為 browser session 內共用 registry；不引入 Redux / Zustand / localStorage。
- [ ] CameraCard、手機 Bottom Sheet、桌面 CameraModal 讀寫同一支 Camera 的 `status / lastCheckedAt / lastFrameAt`。
- [ ] 各 surface 自己原本就會載入的 snapshot `onLoad/onError` 可更新同一份 observation；不新增背景 probe。
- [ ] Bottom Sheet / Modal 顯示中性被動狀態；live stream 成功時仍只有 CameraModal 的實際 stream `onLoad` 才可顯示 LIVE。
- [ ] stale freshness timer 沿用 M19.1 規則，不新增額外 CCTV request。
- [ ] 不改 `/api/cameras` response shape、不持久化個別 Camera health 到跨 session storage。
- [ ] 補 shared-registry regression tests；`npm audit`、全部 tests、`npm run build` 全部通過。

完成後 M19 Passive Camera status 結案，再評估下一個產品功能。

---

## 近期完成

### M19.1 — Passive Camera snapshot status foundation（完成）
- [x] 新增共用 `camera-status` observation：`unknown / online / stale / offline`，沿用既有 Camera V2 型別。
- [x] snapshot success → `online + lastCheckedAt + lastFrameAt`；failure 有舊 frame → `stale`，無舊 frame → `offline`。
- [x] online observation 超過 2 分鐘沒有新 frame 會轉 stale，避免永久假 online。
- [x] CameraCard 以既有 snapshot `onLoad/onError` 被動更新狀態；無任何額外 probe / live request。
- [x] UI 使用「快照可用／快照待更新／快照暫不可用」等中性文案，不以單次失敗宣稱永久離線。
- [x] 新增 Camera status transition regression tests；CI `34730601848`：0-vulnerability audit、tests、production build 全綠。

### M18 — Dependency cleanup（完成）
- [x] 非 breaking `npm audit fix` 後為 **0 vulnerabilities**；13/13 security/resource tests 與 build 成功。
- [x] 一次性 write workflow 已移除；最終正常 read-only CI `34730410486` 全綠。

### M17.1 — Snapshot proxy memory / payload bounds（完成）
- [x] snapshot proxy：64-entry / 30s TTL cache、2 MiB payload cap、8s full capture timeout；CI `34730322887` 全綠。

### M16 — Security regression / attack surface（完成）
- [x] 移除 `/api/test-source` 任意 server fetch；Camera proxy allowlist / redirect tests 納入 CI。

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
- [ ] **M19 Passive Camera status** — M19.1 完成，M19.2 進行中。

---

## Executor 原則

只有大型跨檔重構、複雜除錯、必須依賴完整本機／瀏覽器 agent、或 ChatGPT 無法可靠完成與驗證時，才標示 `Executor: Codex`。除此之外由 ChatGPT + GitHub Actions 完成。
