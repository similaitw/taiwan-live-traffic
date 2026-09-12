# TASKS.md

> Repository：`similaitw/taiwan-live-traffic`
>
> 執行方式：每次只完成一個 `Current task`。預設由 ChatGPT 直接透過 GitHub 實作與驗收；只有明確標示 `Executor: Codex` 才使用 Codex。

## Current task

### M2.1 — Mobile map-first layout

**Executor: ChatGPT**

目標／範圍：

- [ ] 手機版改為 map-first，地圖成為主要畫面。
- [ ] 搜尋列改為地圖上方 floating search bar。
- [ ] 類型 filter chips 可水平滑動且不擠壓地圖高度。
- [ ] 定位改為地圖 floating button。
- [ ] 手機版弱化／移除佔高度的傳統 Header 與 filter bar。
- [ ] 保留既有搜尋、類型篩選、定位、最近排序、Map/List 功能相容性；若手機 UI 隱藏 List toggle，桌面既有功能仍需保留。
- [ ] 375px 寬度不得有主要操作被遮住或水平溢位。
- [ ] 768px、1280px 既有介面不可明顯退化；M2.2 才正式做 desktop sidebar。
- [ ] 不在此任務加入 Bottom Sheet；留給 M2.3。
- [ ] GitHub Actions CI build 通過。

完成後將 Current task 更新成 M2.2 — Desktop sidebar layout。

---

## 已完成任務

### M1.3 — hooks 基礎拆分（已完成）

**Executor: ChatGPT**

- [x] 拆分 `useGeolocation`，首頁改用共用 hook。
- [x] 保留原本自動定位「失敗靜默」、手動定位「失敗顯示錯誤」的行為。
- [x] 建立 `useFavorites`，使用 `taiwan-live-traffic:favorites`。
- [x] 建立 `useRecentCameras`，使用 `taiwan-live-traffic:recent`，最多 20 支。
- [x] localStorage 僅在 client effect／`window` 可用時讀寫，SSR safe。
- [x] 新增 GitHub Actions CI，往後 push 自動執行 `npm ci` + `npm run build`。
- [x] GitHub Actions run `34703000850` 的 Build step 通過。

---

### M1.2 — 共用 geo utilities（已完成）

- [x] 新增 `lib/geo.ts`。
- [x] 把 Haversine distance 從 `app/page.tsx` 與 `components/MapInner.tsx` 移出。
- [x] 最近排序結果保持一致。
- [x] `npm run build` 通過。

驗證：81 組座標距離與兩份原始函式完全一致，兩份函式各 9 組最近排序（含同距離）比較通過，公尺單位檢查通過。

---

### M1.1 — Camera V2 data model（已完成）

- [x] 擴充 `Camera` interface：`provider`、`roadNumber`、`mile`、`county`、`district`、`streamType`、`status`、`lastCheckedAt`、`lastFrameAt`、`tags`。
- [x] 新增 `CameraType`、`CameraStatus` type。
- [x] 新增 `lib/camera-normalizer.ts`。
- [x] normalizer 處理道路名稱／道路編號／公里數／方向／tags 基礎正規化。
- [x] `freeway.ts`、`thb.ts` 使用 normalizer。
- [x] 所有新增欄位保持 optional，相容既有資料來源。
- [x] 不修改 `/api/cameras` response shape。
- [x] `npm run build` 通過。

驗證：8 組 normalizer 案例（含相容性、重複正規化與不修改輸入）通過。

---

## Milestones

### M1 — 基礎整理與資料模型

- [x] M1.1 Camera V2 data model
- [x] M1.2 共用 geo utilities
- [x] M1.3 hooks 基礎拆分

### M2 — UI 2.0

- [ ] M2.1 Mobile map-first layout — **ChatGPT**
- [ ] M2.2 Desktop sidebar layout
- [ ] M2.3 Camera Bottom Sheet

### M3 — 地圖效能

- [ ] M3.1 Marker clustering
- [ ] M3.2 Viewport optimization

### M4 — 使用者功能

- [ ] M4.1 收藏
- [ ] M4.2 最近觀看
- [ ] M4.3 Share / URL state

### M5 — 道路模式

- [ ] M5.1 Road grouping
- [ ] M5.2 Road navigator
- [ ] M5.3 Nearby mode

---

## Executor 原則

預設：`ChatGPT`。

只有符合以下任一情況，才把 Current task 標示為 `Executor: Codex`：

- 大型跨檔重構且需要長上下文探索。
- 難以定位的 bug，需要反覆執行與除錯。
- 必須依賴完整本機 runtime／瀏覽器 agent，而 GitHub Actions 或 ChatGPT 現有工具無法可靠驗證。
- ChatGPT 完成初步實作後，仍有明確未解的工程問題。

單純 build 不構成使用 Codex 的理由；一般 build 由 GitHub Actions 處理。
