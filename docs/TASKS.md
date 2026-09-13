# TASKS.md

> Repository：`similaitw/taiwan-live-traffic`
>
> 執行原則：GitHub `main` 為唯一狀態來源。預設由 ChatGPT 直接實作與驗收；只有明確標示 `Executor: Codex` 才使用 Codex。一般 build / test 由 GitHub Actions 處理。
>
> 為節省 token，本檔只保留 Current task、近期完成內容與 milestone/CI 索引；早期細節可由 Git history 查閱。

## Current task

### M22.1 — V2 Definition of Done / release-readiness audit

**Executor: ChatGPT**

目標／範圍：

- [ ] 逐項核對 `docs/V2_SPEC.md` §21 V2 MVP Definition of Done，引用目前 repo 實作／CI 證據，不靠印象勾選。
- [ ] 確認正常 CI 仍包含 npm audit、全部 regression tests、production build。
- [ ] 檢查正式部署所需環境變數／health endpoint／production checklist 是否與目前程式一致。
- [ ] 若可從已連接的 Vercel 專案取得正式部署狀態，確認 main 最新部署是否成功；無法存取時明確標示未驗證，不冒充完成。
- [ ] 產出精簡 release-readiness 文件，區分「repo 已驗證」「production 尚待人工/連接驗證」。
- [ ] 不新增產品功能；只修正本稽核發現的 release blocker。

完成後若沒有 blocker，V2 可標記 Release Candidate；正式上線 smoke test 另列 M22.2。

---

## 近期完成

### M21 — Accessibility / interaction hardening（完成）
- [x] M21.1：全站 `:focus-visible`、`prefers-reduced-motion`；CameraModal 補 `role="dialog"`、`aria-modal`、標題關聯；主要 icon buttons / status text 稽核完成。CI `34732812658`。
- [x] M21.2：CameraModal 開啟時保存／移入 focus，Tab / Shift+Tab trap，Escape 沿用關閉 workflow，關閉後還原原操作元素；Bottom Sheet 維持非 modal。Feature commit `1035e65a2b2eceeb407c7fc6cce1e96a40739143`。
- [x] one-shot setup 已移除；最終正常 CI `34732975943` 全綠。

### M20 — Direction-aware road mode（完成）
- [x] 共用 direction normalization；道路方向 filter；canonical `direction=` URL；Trip Mode 中文顯示／canonical 分享；Desktop / mobile 皆可操作。最終 CI `34732610626`。

### M19 — Passive Camera status（完成）
- [x] 實際 snapshot 成敗建立 passive status；Card / Bottom Sheet / Modal 共用 session registry；真正 live `onLoad` 才顯示 LIVE。

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
- [x] **M21 Accessibility / interaction hardening**。
- [ ] **M22 V2 release readiness** — M22.1 進行中。

---

## Executor 原則

只有大型跨檔重構、複雜除錯、必須依賴完整本機／瀏覽器 agent、或 ChatGPT 無法可靠完成與驗證時，才標示 `Executor: Codex`。除此之外由 ChatGPT + GitHub Actions 完成。
