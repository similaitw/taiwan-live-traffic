# TASKS.md

> Repository：`similaitw/taiwan-live-traffic`
>
> 執行原則：GitHub `main` 為唯一狀態來源。預設由 ChatGPT 直接實作與驗收；只有明確標示 `Executor: Codex` 才使用 Codex。一般 build / test 由 GitHub Actions 處理。
>
> 為節省 token，本檔只保留 Current task、近期完成內容與 milestone/CI 索引；早期細節可由 Git history 查閱。

## Current task

### M20.1 — Direction-aware road mode foundation

**Executor: ChatGPT**

目標／範圍：

- [ ] 建立共用道路方向 normalization，統一 `北向/北上/往北/N/NB/northbound` 等別名，南／東／西同理。
- [ ] 建立方向 label / option 聚合 utility，可由某道路 Camera 產生方向選項與數量。
- [ ] `route-corridor` 改用共用方向 matcher，移除自己的第二套 normalization。
- [ ] 對沒有方向 metadata 的事件／設備維持保守納入，不因選方向而錯誤丟掉可能影響全線的資料。
- [ ] 不改首頁 UI、不改 URL state；留給 M20.2。
- [ ] 補 direction regression tests；`npm audit`、全部 tests、production build 全部通過。

完成後進入 M20.2 — Direction filter UI / URL state / Trip Mode integration。

---

## 近期完成

### M19 — Passive Camera status（完成）
- [x] M19.1：snapshot success / failure 建立 `unknown / online / stale / offline` 被動 observation；2 分鐘無新 frame 轉 stale。CI `34730601848`。
- [x] CameraCard 只重用既有 snapshot `onLoad/onError`，不增加背景 probe；中性顯示「快照可用／待更新／暫不可用」。
- [x] M19.2：新增 browser-session shared registry + `useSyncExternalStore`；Card、Bottom Sheet、Modal 共用 `status / lastCheckedAt / lastFrameAt`。
- [x] Bottom Sheet / Modal 自己原本就會載入的 snapshot 也會回寫 registry；不新增 CCTV request、不寫 localStorage。
- [x] Modal 只有實際 live stream `<img onLoad>` 成功才顯示 LIVE；snapshot 狀態不冒充直播。
- [x] shared-registry regression tests 已納入正常測試；CI `34730778322`：0-vulnerability audit、tests、production build 全綠。

### M18 — Dependency cleanup（完成）
- [x] 非 breaking `npm audit fix` 後為 **0 vulnerabilities**；最終正常 CI `34730410486` 全綠。

### M17 — Proxy resource controls（完成）
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
- [x] **M19 Passive Camera status**。
- [ ] **M20 Direction-aware road mode** — M20.1 進行中。

---

## Executor 原則

只有大型跨檔重構、複雜除錯、必須依賴完整本機／瀏覽器 agent、或 ChatGPT 無法可靠完成與驗證時，才標示 `Executor: Codex`。除此之外由 ChatGPT + GitHub Actions 完成。
