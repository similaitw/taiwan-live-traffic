# TASKS.md

> Repository：`similaitw/taiwan-live-traffic`
>
> 執行原則：GitHub `main` 為唯一狀態來源。預設由 ChatGPT 直接實作與驗收；只有明確標示 `Executor: Codex` 才使用 Codex。一般 build / test 由 GitHub Actions 處理。
>
> 為節省 token，本檔只保留 Current task、近期完成內容與 milestone/CI 索引；早期細節可由 Git history 查閱。

## Current task

### M22.2 — Production deployment / browser smoke test

**Executor: Codex**

**原因：此任務需要本機 Vercel CLI / agent-browser，ChatGPT 目前的 Vercel connector 對 `similaitws-projects` team scope 仍無法可靠存取。**

Codex 執行前必讀：`docs/CODEX_M22_2.md`

正式網址：

`https://taiwan-live-traffic-4xtnqcy76-similaitws-projects.vercel.app/`

已知狀態：

- Vercel API 能由網址辨識 team scope 為 `similaitws-projects`，但 ChatGPT connector 一直無法可靠授權該 scope。
- `docs/TASKS.md` 已記錄本機 Vercel CLI 可使用 production scope；connector 403 不代表 deployment 失敗。
- GitHub `main` 最新重要 hotfix：`d6e910307e23f05bb721308739d301da75abeb56`，已改用 OpenStreetMap basemap。
- 該 hotfix CI `34757186602` 已成功。
- Repo-side V2 已是 Release Candidate；M22.2 是 Production acceptance 最後一步。

Codex 必須優先使用 skills：

- `vercel-api`：project / deployment / env presence / logs；若 connector 不通，依 skill 改走本機 Vercel CLI / REST fallback。
- `agent-browser`：最新 production URL 的 375 / 768 / 1280px 瀏覽器 smoke test與互動驗收。

完成條件與禁止事項全部寫在 `docs/CODEX_M22_2.md`；不要重新設計產品、不要新增功能、不要建立第二個 Vercel project。

完成後：

- [ ] 確認 production deployment identity / commit。
- [ ] production `/api/health` 200 且不洩漏 secrets。
- [ ] Camera / rainfall / TDX / CMS API smoke tests。
- [ ] Snapshot 可用；LIVE 由 UI 手動開啟／停止。
- [ ] 375px / 768px / 1280px browser smoke test。
- [ ] Search / Road / Direction / Share URL restore。
- [ ] Basemap 不再出現 `API KEY REQUIRED`。
- [ ] 更新 `docs/TASKS.md` 與 `docs/V2_RELEASE_READINESS.md`。
- [ ] 必要修復已 commit / push main，並確認 CI。

完成後才能把 Production Release 標記 accepted。

---

## 近期完成

### 底圖顯示 hotfix
- [x] 依使用者回報修正 CARTO 圖磚顯示 API KEY REQUIRED：改用 OpenStreetMap 標準圖磚並保留來源標示。
- [x] 深色濾鏡僅套用底圖，保留雷達與標記原色。
- 本機 Vercel CLI 可使用 production scope；connector 的 403 不影響 CLI 部署。M22.2 完整驗收仍待完成。

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
- [ ] **M22 V2 release readiness** — repo RC ready；M22.2 交由 Codex 使用 Vercel/agent-browser skills 完成 Production acceptance。

---

## Executor 原則

只有大型跨檔重構、複雜除錯、必須依賴完整本機／瀏覽器 agent、或 ChatGPT 無法可靠完成與驗證時，才標示 `Executor: Codex`。除此之外由 ChatGPT + GitHub Actions 完成。
