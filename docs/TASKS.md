# TASKS.md

> Repository：`similaitw/taiwan-live-traffic`
>
> 執行原則：GitHub `main` 為唯一狀態來源。預設由 ChatGPT 直接實作與驗收；只有明確標示 `Executor: Codex` 才使用 Codex。一般 build / test 由 GitHub Actions 處理。
>
> 為節省 token，本檔只保留 Current task、近期完成內容與 milestone/CI 索引；早期細節可由 Git history 查閱。

## Current task

### M21.2 — Modal focus workflow polish

**Executor: ChatGPT**

目標／範圍：

- [ ] CameraModal 開啟時保存先前 focus，將 focus 移入 dialog。
- [ ] Modal 開啟期間 Tab / Shift+Tab 不可跑出 `aria-modal` dialog。
- [ ] Escape / backdrop / 關閉按鈕沿用同一 `onClose` workflow。
- [ ] Modal 關閉或切換離開後，盡量將 focus 還原到原操作元素；元素已不存在時安全略過。
- [ ] 手機 Bottom Sheet 維持非 modal，不阻斷地圖互動，不做 focus trap。
- [ ] 不新增 accessibility 套件，不改 Snapshot / Live lifecycle。
- [ ] `npm audit`、全部 tests、production build 全部通過。

完成後 M21 Accessibility / interaction hardening 結案。

---

## 近期完成

### M21.1 — Accessibility / reduced-motion audit（完成）
- [x] Modal、Bottom Sheet、Search suggestions、Map layer panel 皆已支援 Escape 關閉；主要 icon-only buttons 已有 `aria-label`。
- [x] Camera status / source health 同時提供文字狀態，不依賴顏色單獨傳達資訊。
- [x] 全站新增 `:focus-visible` 明確 outline。
- [x] 全站新增 `prefers-reduced-motion: reduce`，壓低非必要 animation / transition。
- [x] CameraModal 補 `role="dialog"`、`aria-modal="true"`、`aria-labelledby` 與標題 ID。
- [x] one-shot setup 已移除；最終正常 CI `34732812658` 全綠。

### M20 — Direction-aware road mode（完成）
- [x] M20.1：共用 direction normalization；北向/北上/NB/northbound 等統一 canonical direction；route-corridor 共用 matcher。CI `34730950896`。
- [x] M20.2：選道路後顯示方向 filter；URL 支援 `direction=north|south|east|west`，換路或無效方向自動清除。
- [x] Camera 清單／地圖套用同一 direction；缺少 direction metadata 的 Camera 保守保留。
- [x] Map 將 canonical direction 傳入 `buildRouteCorridor()`，Trip Mode 顯示中文方向但分享網址保留 canonical value。
- [x] Desktop / mobile 皆可操作；最終正常 CI `34732610626` 全綠。

### M19 — Passive Camera status（完成）
- [x] Card 以實際 snapshot 成敗建立 passive status；Card / Bottom Sheet / Modal 共用 session registry；真正 live `onLoad` 才顯示 LIVE。

### M18 — Dependency cleanup（完成）
- [x] 非 breaking `npm audit fix` 後為 **0 vulnerabilities**。

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
- [ ] **M21 Accessibility / interaction hardening** — M21.2 進行中。

---

## Executor 原則

只有大型跨檔重構、複雜除錯、必須依賴完整本機／瀏覽器 agent、或 ChatGPT 無法可靠完成與驗證時，才標示 `Executor: Codex`。除此之外由 ChatGPT + GitHub Actions 完成。
