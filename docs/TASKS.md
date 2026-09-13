# TASKS.md

> Repository：`similaitw/taiwan-live-traffic`
>
> 執行原則：GitHub `main` 為唯一狀態來源。預設由 ChatGPT 直接實作與驗收；只有明確標示 `Executor: Codex` 才使用 Codex。一般 build / test 由 GitHub Actions 處理。
>
> 為節省 token，本檔只保留 Current task、近期完成內容與 milestone/CI 索引；早期細節可由 Git history 查閱。

## Current task

### M21.1 — Accessibility / reduced-motion audit

**Executor: ChatGPT**

目標／範圍：

- [ ] 依 `docs/V2_SPEC.md` §18 稽核主要互動元件：icon button `aria-label`、Modal / Bottom Sheet Escape 關閉、focus 可見性。
- [ ] 補上全站 `prefers-reduced-motion` fallback，降低非必要 animation / transition，不影響地圖核心操作。
- [ ] 狀態資訊不得只靠顏色；若現有 Camera status / source health 有純顏色表達，補文字或可讀 label。
- [ ] 優先小幅修補，不做 UI 大重構，不新增 accessibility 套件。
- [ ] `npm audit`、全部 tests、production build 全部通過。

完成後再評估 M21.2 — Detail / focus workflow polish。

---

## 近期完成

### M20 — Direction-aware road mode（完成）
- [x] M20.1：共用 direction normalization；北向/北上/NB/northbound 等統一 canonical direction；route-corridor 共用 matcher。CI `34730950896`。
- [x] M20.2：選道路後顯示方向 filter；URL 支援 `direction=north|south|east|west`，換路或無效方向自動清除。
- [x] Camera 清單／地圖套用同一 direction；缺少 direction metadata 的 Camera 保守保留。
- [x] Map 將 canonical direction 傳入 `buildRouteCorridor()`，Trip Mode 顯示中文方向但分享網址保留 canonical value。
- [x] Desktop / mobile 皆可操作；one-shot integration 成功後已移除，最終正常 CI `34732610626` 全綠。

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
- [x] **M20 Direction-aware road mode**。
- [ ] **M21 Accessibility / interaction hardening** — M21.1 進行中。

---

## Executor 原則

只有大型跨檔重構、複雜除錯、必須依賴完整本機／瀏覽器 agent、或 ChatGPT 無法可靠完成與驗證時，才標示 `Executor: Codex`。除此之外由 ChatGPT + GitHub Actions 完成。
