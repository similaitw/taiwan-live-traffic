# TASKS.md

> Repository：`similaitw/taiwan-live-traffic`
>
> 執行原則：GitHub `main` 為唯一狀態來源。預設由 ChatGPT 直接實作與驗收；只有明確標示 `Executor: Codex` 才使用 Codex。一般 build 由 GitHub Actions 處理。
>
> 為節省 token，本檔只保留 Current task、近期完成內容與 milestone/CI 索引；早期細節可由 Git history 查閱。

## Current task

### M15.2 — Scheduled dependency audit / cache effectiveness

**Executor: ChatGPT**

目標／範圍：

- [ ] 驗證 M15.1 建立的 `.next/cache` 在後續不改程式來源的 CI run 能命中／還原；cache miss 仍需安全 fallback。
- [ ] 評估加入低頻 scheduled dependency audit，讓沒有新 commit 時也能發現新公布的 high / critical npm advisory。
- [ ] scheduled job 僅需 `contents: read`，不得自動修改套件或 push main。
- [ ] scheduled audit 使用 Node 22 + `npm ci` + `npm audit --audit-level=high`，不需每次排程都跑完整 production build。
- [ ] 保留既有 push / pull_request CI 的 audit + build gate。
- [ ] GitHub Actions CI 全流程通過。

完成後 M15 CI modernization 結案。

---

## 近期完成

### M15.1 — GitHub Actions runtime / build-cache modernization（完成）
- [x] 官方最新穩定版確認：`actions/checkout@v7.0.1`、`actions/setup-node@v7.0.0`、`actions/cache@v6.1.0`。
- [x] 專案應用程式 runtime 保持 Node.js 22；只升級 action 自身 runtime / implementation。
- [x] 新增 `.next/cache` restore/save；key 綁定 OS、package-lock 與 JS/TS/CSS source hash，cache miss 可安全重建。
- [x] 保留 `npm ci`、`npm audit --audit-level=high`、`npm run build`。
- [x] workflow 維持 `contents: read`，只使用 GitHub 官方 actions。
- [x] GitHub Actions run `34725249161` 全綠。

### M14 — Dependency / CI security（完成）
- [x] Next.js `16.2.1` → `16.3.5`；`fast-xml-parser` `5.5.9` → `5.11.1`，由 npm 在 GitHub runner 正式重建 lockfile。
- [x] 升級後 production build 成功，Next.js 16.3.5 / TypeScript / static generation 全部通過。One-shot updater run `34725091999`。
- [x] `npm audit` 從 8 個漏洞（1 critical / 4 high / 2 moderate / 1 low）降為 2 個（0 critical / 0 high / 1 moderate / 1 low）。
- [x] 一次性 dependency updater 已從 repo 移除。
- [x] CI 新增 `npm audit --audit-level=high`，未來 high / critical 會阻擋 main；最終 CI `34725159970` 全綠。

### M13 — Search V2（完成）
- [x] M13.1 共用 matcher：name / ID / road / roadNumber / county / district / mile / direction / tags；支援 NFKC、臺/台、多 token、`38K` / `38.2K` / `38+200`。CI `34724600973`。
- [x] CameraList 與首頁共用同一 matcher；Map 直接使用首頁已篩好的 Camera，避免舊規則二次過濾。
- [x] M13.2 分類建議：道路／地區／監視器，去重與 score 排序，手機 max 50dvh，ArrowUp/Down、Enter、Escape。CI `34724916576`。
- [x] M13.3 搜尋選取／ARIA polish：桌面與手機 listbox ID 唯一、Enter 可直接選第一項；既有 `q/road/camera` URL state 與 snapshot-first detail workflow 沿用。CI `34724980764`。

---

## Milestone / CI 索引

- [x] **M1 基礎資料模型** — Camera V2、geo、hooks。
- [x] **M2 UI 2.0** — mobile map-first、desktop sidebar、Bottom Sheet。
- [x] **M3 地圖效能** — clustering `34703638881`、viewport diff `34703721411`。
- [x] **M4 使用者功能** — 收藏 `34703855243`、最近 `34704005838`、分享/URL `34704132752`。
- [x] **M5 道路模式** — grouping `34704232348`、navigator `34704427438`、nearby `34704517553`。
- [x] **M6 即時事件** — foundation `34704685825`、overlay `34704812771`、workflow `34704931928`。
- [x] **M7 壅塞／旅行速度** — live flow `34705057134`、shape join `34705149764`、overlay `34705369615`。
- [x] **M8 CMS** — foundation `34705565204`、overlay `34705688422`、filters `34705864679`。
- [x] **M9 天氣／降雨** — rainfall `34708540549`、radar `34708797685`、CCTV cross-check `34708915050`。
- [x] **M10 圖層控制** — unified controls `34709009247`、mobile polish `34709117895`、preferences `34709191760`。
- [x] **M11 Production hardening** — 完成。
- [x] **M12 Route / Trip Mode** — 完成。
- [x] **M13 Search V2** — 完成。
- [x] **M14 Dependency / CI security** — 完成。
- [ ] **M15 CI modernization** — 進行中。

---

## Executor 原則

只有大型跨檔重構、複雜除錯、必須依賴完整本機／瀏覽器 agent、或 ChatGPT 無法可靠完成與驗證時，才標示 `Executor: Codex`。除此之外由 ChatGPT + GitHub Actions 完成。
