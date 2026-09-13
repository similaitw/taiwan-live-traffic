# TASKS.md

> Repository：`similaitw/taiwan-live-traffic`
>
> 執行原則：GitHub `main` 為唯一狀態來源。預設由 ChatGPT 直接實作與驗收；只有明確標示 `Executor: Codex` 才使用 Codex。一般 build / test 由 GitHub Actions 處理。
>
> 為節省 token，本檔只保留 Current task、近期完成內容與 milestone/CI 索引；早期細節可由 Git history 查閱。

## Current task

### M22.2 — Production deployment / browser smoke test

**Executor: ChatGPT**

**目前阻塞：尚無可信的 production URL / Vercel project scope。**

已確認：

- Vercel connected app `list_teams` 回傳空陣列。
- repo 未提交 `.vercel/project.json`。
- repo 搜尋不到 `*.vercel.app` / production URL。
- 既有個人對話／檔案脈絡未找到此 repo 的 production domain。
- 公開搜尋結果有其他台灣即時影像網站，但無證據屬於 `similaitw/taiwan-live-traffic`，不得拿來驗收。

取得可信 production URL 或 Vercel access 後執行：

- [ ] 確認 production deployment commit = GitHub `main` 最新 commit。
- [ ] `/api/health` HTTP 200，commit SHA / environment 正確且不洩漏 secrets。
- [ ] Camera / rainfall / TDX / CMS API smoke checks。
- [ ] Snapshot 可用；LIVE 只有手動開啟並可正常停止。
- [ ] 375px 手機 smoke test。
- [ ] 768px 平板 smoke test。
- [ ] 1280px 桌面 smoke test。
- [ ] Search / Road / Direction / Nearby / Share URL 狀態可恢復。
- [ ] TDX unavailable 時 graceful degradation 正常。

完成後才能把 Production Release 標記 accepted。

---

## 近期完成

### M22.1 — V2 Definition of Done / release-readiness audit（完成）
- [x] 逐項核對 `docs/V2_SPEC.md` §21，V2 MVP repo-side Definition of Done 全部有實作／CI 證據。
- [x] 正常 CI 維持 Node 22、`npm ci`、`npm audit --audit-level=high`、全部 regression tests、`npm run build`。
- [x] `.env.example` 與 server-side TDX env 名稱一致；CWA public OpenData 不需 key。
- [x] `/api/health` 為 passive / no-store，只回 TDX configured boolean，不暴露 credentials。
- [x] `/api/cameras` 仍使用 `Promise.allSettled` 保持 partial success。
- [x] Camera proxy 仍有 hostname allowlist、URL credential rejection、manual redirect revalidation、最多 4 跳。
- [x] 產出 `docs/V2_RELEASE_READINESS.md`，清楚區分 repo RC 與 production acceptance。
- [x] Release-readiness 文件 commit 後正常 CI `34733089266` 全綠。
- [x] 結論：**Repo 可標記 V2 Release Candidate；Production Release 尚未接受。**

### M21 — Accessibility / interaction hardening（完成）
- [x] 全站 focus-visible / reduced-motion、dialog semantics、文字化狀態。
- [x] CameraModal focus save / trap / restore；Bottom Sheet 維持非 modal。
- [x] 最終正常 CI `34732975943` 全綠。

### M20 — Direction-aware road mode（完成）
- [x] 道路方向 normalization / filter / URL / Trip Mode integration；最終 CI `34732610626`。

---

## Milestone / CI 索引

- [x] **M1 基礎資料模型**。
- [x] **M2 UI 2.0**。
- [x] **M3 地圖效能**。
- [x] **M4 使用者功能**。
- [x] **M5 道路模式**。
- [x] **M6 即時事件**。
- [x] **M7 壅塞／旅行速度**。
- [x] **M8 CMS**。
- [x] **M9 天氣／降雨**。
- [x] **M10 圖層控制**。
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
- [ ] **M22 V2 release readiness** — repo RC ready；M22.2 production smoke test blocked by production URL/access。

---

## Executor 原則

只有大型跨檔重構、複雜除錯、必須依賴完整本機／瀏覽器 agent、或 ChatGPT 無法可靠完成與驗證時，才標示 `Executor: Codex`。除此之外由 ChatGPT + GitHub Actions 完成。
