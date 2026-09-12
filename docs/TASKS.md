# TASKS.md

> Repository：`similaitw/taiwan-live-traffic`
>
> 執行原則：GitHub `main` 為唯一狀態來源。預設由 ChatGPT 直接實作與驗收；只有明確標示 `Executor: Codex` 才使用 Codex。一般 build 由 GitHub Actions 處理。
>
> 為節省 token，本檔只保留 Current task、近期完成內容與 milestone/CI 索引；早期細節可由 Git history 查閱。

## Current task

### M14.1 — Dependency security upgrade

**Executor: ChatGPT**

目標／範圍：

- [ ] 升級 Next.js 至已修補近期 critical advisories 的 `>=16.3.3`。
- [ ] 升級 `fast-xml-parser` 至 `>=5.10.1`，避開目前已知 entity-expansion DoS advisories。
- [ ] 正確重建 `package-lock.json`，維持 `npm ci` 可重現安裝；不手工猜 integrity / transitive dependency。
- [ ] 重新執行 `npm audit`，記錄剩餘漏洞數與 severity；若仍有 critical/high，逐項判斷是否可在本任務安全修復。
- [ ] `npm run build` 通過，既有 Camera / TDX / CWA API 與 UI 不做功能性改寫。
- [ ] 安全升級完成後移除任何一次性 dependency-update workflow／腳本。

完成後將 Current task 更新成 M14.2 — CI dependency audit guardrail。

---

## 近期完成

### M13 — Search V2（完成）
- [x] M13.1 共用 matcher：name / ID / road / roadNumber / county / district / mile / direction / tags；支援 NFKC、臺/台、多 token、`38K` / `38.2K` / `38+200`。CI `34724600973`。
- [x] CameraList 與首頁共用同一 matcher；Map 直接使用首頁已篩好的 Camera，避免舊規則二次過濾。
- [x] M13.2 分類建議：道路／地區／監視器，去重與 score 排序，手機 max 50dvh，ArrowUp/Down、Enter、Escape。CI `34724916576`。
- [x] M13.3 搜尋選取／ARIA polish：桌面與手機 listbox ID 唯一、Enter 可直接選第一項；既有 `q/road/camera` URL state 與 snapshot-first detail workflow 沿用。CI `34724980764`。

### M12 — Route / Trip Mode（完成）
- [x] M12.1 Route corridor aggregation。CI `34712316259`。
- [x] M12.2 Trip Mode UI / corridor summary。CI `34712481748`。
- [x] M12.3 corridor share + mile-sorted Camera navigation。CI `34724413433`。

### M11 — Production hardening（完成）
- [x] Proxy redirect / SSRF hardening。CI `34709275148`。
- [x] Source freshness / health visibility。CI `34709736577`。
- [x] Live opt-in / lifecycle / 90s relay guardrail。CI `34709897660`。
- [x] `/api/health` + `PRODUCTION_CHECKLIST.md`。CI `34712218377`。

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
- [ ] **M14 Dependency / CI security** — 進行中。

---

## Executor 原則

只有大型跨檔重構、複雜除錯、必須依賴完整本機／瀏覽器 agent、或 ChatGPT 無法可靠完成與驗證時，才標示 `Executor: Codex`。除此之外由 ChatGPT + GitHub Actions 完成。
