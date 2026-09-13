# TASKS.md

> Repository：`similaitw/taiwan-live-traffic`
>
> 執行原則：GitHub `main` 為唯一狀態來源。預設由 ChatGPT 直接實作與驗收；只有明確標示 `Executor: Codex` 才使用 Codex。一般 build / test 由 GitHub Actions 處理。
>
> 為節省 token，本檔只保留 Current task、近期完成內容與 milestone/CI 索引；早期細節可由 Git history 查閱。

## Current task

### M20.2 — Direction filter UI / URL state / Trip Mode integration

**Executor: ChatGPT**

目標／範圍：

- [ ] 選定道路後顯示方向 filter，選項來自該道路 Camera 的 canonical direction 與數量。
- [ ] URL 支援 `direction=north|south|east|west`；重開分享網址可恢復道路 + 方向 context。
- [ ] 換道路、取消道路、或 URL direction 不存在於該道路時，自動清除方向，避免空白狀態。
- [ ] direction 套用到首頁 Camera 清單與地圖 Camera，沒有 direction metadata 的 Camera 保守保留。
- [ ] `Map` 將同一 direction 傳入 `buildRouteCorridor()`，讓 TDX flow / event / CMS 與 Trip Mode 摘要一致。
- [ ] Trip Mode 顯示中文方向 label，但分享網址保留 canonical `direction=`。
- [ ] 桌面與手機都可操作；不破壞搜尋／收藏／附近／道路 filter。
- [ ] `npm audit`、全部 tests、production build 全部通過。

完成後 M20 Direction-aware road mode 結案。

---

## 近期完成

### M20.1 — Direction-aware road mode foundation（完成）
- [x] 新增共用 direction normalization，統一北向/北上/往北/N/NB/northbound 等別名，南／東／西同理。
- [x] 新增 canonical direction label / option aggregation，方向順序固定北、南、東、西。
- [x] `route-corridor` 改用共用 matcher，移除自己的第二套 normalization。
- [x] direction filter 對缺少方向 metadata 的事件／設備預設保守納入。
- [x] direction regression tests 已納入正常測試；CI `34730950896`：0-vulnerability audit、tests、production build 全綠。

### M19 — Passive Camera status（完成）
- [x] M19.1：Card 以既有 snapshot 成敗建立 `unknown / online / stale / offline` observation。CI `34730601848`。
- [x] M19.2：session shared registry；Card、Bottom Sheet、Modal 共用狀態；真正 live `onLoad` 才顯示 LIVE。CI `34730778322`。

### M18 — Dependency cleanup（完成）
- [x] 非 breaking `npm audit fix` 後為 **0 vulnerabilities**；最終正常 CI `34730410486` 全綠。

### M17 — Proxy resource controls（完成）
- [x] snapshot proxy：64-entry / 30s TTL cache、2 MiB payload cap、8s full capture timeout；CI `34730322887` 全綠。

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
- [ ] **M20 Direction-aware road mode** — M20.1 完成，M20.2 進行中。

---

## Executor 原則

只有大型跨檔重構、複雜除錯、必須依賴完整本機／瀏覽器 agent、或 ChatGPT 無法可靠完成與驗證時，才標示 `Executor: Codex`。除此之外由 ChatGPT + GitHub Actions 完成。
