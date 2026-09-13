# Codex 任務：M22.2 Production deployment / browser smoke test

> Repo：`similaitw/taiwan-live-traffic`
>
> 本任務只做正式站驗收與必要的部署／存取修復；**不要新增產品功能、不要重構 UI、不要改 API shape**。

## 必讀順序

1. 先讀根目錄 `AGENTS.md`。
2. 再讀 `docs/TASKS.md`，確認 Current task 是 M22.2 且 `Executor: Codex`。
3. 使用 Codex 已安裝的 Vercel skills：
   - `vercel-api`：專案、deployment、env presence、logs、Vercel CLI / REST fallback。
   - `agent-browser`：實際 production URL 的瀏覽器 smoke test、viewport、互動、screenshot/console error 檢查。
4. 只有需要驗收標準時，再讀 `docs/PRODUCTION_CHECKLIST.md` 與 `docs/V2_RELEASE_READINESS.md`；不要整份掃 repo。

## 已知資訊

- 正式部署網址：
  `https://taiwan-live-traffic-4xtnqcy76-similaitws-projects.vercel.app/`
- Vercel team slug：`similaitws-projects`
- ChatGPT Vercel connector 對該 team 一直 403，但 `docs/TASKS.md` 已記錄：**本機 Vercel CLI 可使用 production scope；connector 403 不代表 deployment 失敗。**
- GitHub `main` 最新已知重要 hotfix：`d6e910307e23f05bb721308739d301da75abeb56`（OpenStreetMap basemap）。
- 該 hotfix GitHub Actions CI `34757186602` 已成功。
- Repo-side V2 已是 Release Candidate；M22.2 是 Production acceptance 最後一步。

## 執行策略

### A. 先解 Vercel project / deployment identity

優先使用 `vercel-api` skill 建議的方式；若 MCP / connector 權限仍 403，**不要卡住，直接改走本機 Vercel CLI**。

建議檢查：

```bash
vercel whoami
vercel teams ls
vercel project ls
vercel inspect https://taiwan-live-traffic-4xtnqcy76-similaitws-projects.vercel.app/
```

若 repo 尚未 link，可在**不覆寫 production 設定**的前提下使用 `vercel link` 對正確 team/project；不要新建一個同名 project 來繞過問題。

確認：

- deployment 所屬 project / team。
- deployment environment 是 production 還是 preview。
- deployment Git commit SHA。
- 與 GitHub `main` 最新 SHA 是否一致。

若使用者提供的 `4xtnqcy76` URL 是舊 deployment / preview，找到該 project 最新 production URL，後續 smoke test 應以**最新 production deployment**為準，並把 URL 寫回 TASKS。

### B. Environment / health

只確認 env **是否存在**，絕不輸出 secret value：

- `TDX_CLIENT_ID`
- `TDX_CLIENT_SECRET`

CWA 不需要 key。

驗證 production：

- `/api/health` HTTP 200。
- `status: ok`。
- `deployment.environment` 符合 production。
- `deployment.commitSha` 與預期 deployment/main 一致（若 Vercel 提供）。
- `configuration.tdx.configured` 只為 boolean。
- response 不包含 Client ID / Secret 或其他 secret value。

### C. API smoke tests

在 production domain 驗：

- `/api/cameras`
- `/api/rainfall`
- `/api/traffic-events`
- `/api/traffic-flow`
- `/api/traffic-sections`
- `/api/cms`

接受 graceful degradation：TDX 若沒設定，可以回 disabled/empty 的設計狀態，但不可造成全站 500。

Camera：

- 從 `/api/cameras` 選一支合法 Camera。
- 用 `/api/proxy/snapshot?url=...` 驗證單張 snapshot。
- LIVE 不要做壓力測試；只在 UI 由使用者操作路徑驗證一次。

### D. Browser smoke test — 必須讀 `agent-browser` skill

以**最新 production URL**驗證至少：

#### 375px
- mobile map-first。
- 浮動搜尋可用。
- 圖層面板可開關。
- Camera 點選後 Bottom Sheet。
- snapshot 預覽。
- LIVE 預設不啟動；按「開啟直播」才啟動；可停止。
- safe-area / 控制項無明顯遮擋。

#### 768px
- 平板 breakpoint 無嚴重重疊。
- Map / search / layer controls 正常。

#### 1280px
- desktop sidebar + map。
- Camera detail Modal。
- Modal focus/keyboard 不退化。
- snapshot-first / explicit LIVE。

共同驗證：

- Search：`羅東`、`38K` 或現有可命中的道路／Camera。
- Road mode + Direction。
- Nearby filter（若瀏覽器 geolocation 無法授權，只驗 graceful failure，不偽造成功）。
- Share URL / reload 能恢復主要 `q / road / direction / camera` 狀態。
- 圖層：rainfall / radar；TDX event/flow/CMS 若 unavailable 要清楚顯示狀態，不可整站掛掉。
- Basemap 不可再出現 `API KEY REQUIRED`。
- 檢查 browser console：不得有會破壞主流程的 uncaught error。

可用 agent-browser screenshot 作為驗收證據；不要把大量二進位 screenshot commit 進 repo，除非 TASKS 明確需要。

### E. 若正式站是舊版

若 production deployment 沒包含 `main` 最新 commit：

1. 先確認 Vercel Git integration 是否應自動部署 main。
2. 若安全且已 link 到正確 project，可用 Vercel 官方流程部署**目前 main**到 production。
3. 不要建立第二個 project。
4. 部署後重新做 B–D。

### F. 修改原則

- 若 smoke test 找到 production-only blocker，可做最小修復。
- 不要藉機加功能。
- 不修改 proxy allowlist 為任意 URL。
- 不暴露 secrets。
- 不把 Preview 冒充 Production。
- 不把 GitHub CI 綠燈冒充 browser smoke test。

## 完成條件

只有以下全部達成，M22.2 才可打勾：

- production deployment identity / commit 已確認。
- `/api/health` production 200 且安全。
- Camera / rainfall / TDX/CMS API smoke test 已完成或 graceful degradation 已確認。
- snapshot 成功。
- LIVE lifecycle 由 UI 手動驗過。
- 375 / 768 / 1280 三種 viewport 已實際 browser smoke test。
- Search / Road / Direction / Share restore 已驗。
- Basemap hotfix 已在 production 生效。
- 無重大 console/runtime blocker。

## 完成後

1. 更新 `docs/TASKS.md`：M22.2 完成，M22 V2 release readiness 整段完成。
2. 更新 `docs/V2_RELEASE_READINESS.md`：Production Release 改成 accepted，記錄實際 production URL、deployment commit、驗收日期；不要寫 secret。
3. 若有必要修 code，正常 commit/push main 並確認 CI。
4. 回報：
   - production URL
   - deployment commit SHA
   - health / API / browser smoke 結果
   - 有沒有做修復與對應 commit SHA
   - 最終是否可標記 V2 Production Release accepted
