# TASKS.md

> Repository：`similaitw/taiwan-live-traffic`
>
> 執行原則：GitHub `main` 為唯一狀態來源。預設由 ChatGPT 直接實作與驗收；只有明確標示 `Executor: Codex` 才使用 Codex。一般 build / test 由 GitHub Actions 處理。
>
> 為節省 token，本檔只保留 Current task、近期完成內容與 milestone/CI 索引；早期細節可由 Git history 查閱。

## Current task

### M22.2 — Production deployment / browser smoke test

**Executor: ChatGPT**

**正式部署網址已取得，但目前阻塞在 Vercel team scope 授權。**

正式網址：

`https://taiwan-live-traffic-4xtnqcy76-similaitws-projects.vercel.app/`

已確認：

- Vercel API 能由網址辨識 team scope 為 `similaitws-projects`。
- `get_deployment` 回傳 `403 Not authorized`，明確要求重新授權該 team scope；不是 project 不存在。
- Vercel share / protected deployment fetch 同樣因 403 team scope 無法建立。
- 此 ChatGPT 執行環境直接解析該 deployment hostname 亦失敗，因此不能用外部 DNS / browser fallback 冒充正式站 smoke test。
- repo 未提交 `.vercel/project.json`；GitHub commit status 也沒有可用的 Vercel deployment status 可交叉驗證。

取得 Vercel `similaitws-projects` scope 授權後立即執行：

- [ ] 確認這個 deployment 是 Production（不是單純 Preview）且部署 commit = GitHub `main` 最新 commit。
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
- [ ] **M22 V2 release readiness** — repo RC ready；M22.2 blocked only by Vercel `similaitws-projects` scope authorization / production smoke test。

---

## Executor 原則

只有大型跨檔重構、複雜除錯、必須依賴完整本機／瀏覽器 agent、或 ChatGPT 無法可靠完成與驗證時，才標示 `Executor: Codex`。除此之外由 ChatGPT + GitHub Actions 完成。
