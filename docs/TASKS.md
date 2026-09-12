# TASKS.md

> Repository：`similaitw/taiwan-live-traffic`
>
> 執行方式：每次只完成一個 `Current task`。預設由 ChatGPT 直接透過 GitHub 實作與驗收；只有明確標示 `Executor: Codex` 才使用 Codex。

## Current task

### M3.1 — Marker clustering

**Executor: ChatGPT**

目標／範圍：

- [ ] 移除目前依地圖中心距離只顯示 50 / 100 / 200 支 Camera 的截斷策略。
- [ ] 低縮放層級將鄰近 Camera 聚合成 cluster marker，顯示數量。
- [ ] 點 cluster 後自動放大到該區域，逐步展開 Camera。
- [ ] 放大後顯示單支 Camera marker，維持既有點擊／快照預覽行為。
- [ ] 不新增重型 clustering dependency；優先使用 Leaflet 現有投影能力實作輕量 clustering。
- [ ] 本任務先不做 viewport optimization；留給 M3.2。
- [ ] GitHub Actions CI build 通過。

完成後將 Current task 更新成 M3.2 — Viewport optimization。

---

## 已完成任務

### M2.3 — Camera Bottom Sheet（已完成）

**Executor: ChatGPT**

- [x] 手機 Camera marker / 清單點擊改為 Bottom Sheet，不直接開大型直播 modal。
- [x] Bottom Sheet 顯示名稱、類型、快照、道路／方向／公里數與快照可用狀態。
- [x] Bottom Sheet 不使用全螢幕 backdrop，地圖上方區域仍可操作。
- [x] 預設只載 snapshot；只有按「開啟直播」才啟動既有 `CameraModal` / MJPEG。
- [x] 桌面版維持原本 CameraModal 行為。
- [x] GitHub Actions run `34703560223`：Install dependencies 與 Build 均成功。

---

### M2.2 — Desktop sidebar layout（已完成）

**Executor: ChatGPT**

- [x] 桌面版改為左側 sidebar + 右側 map 同時顯示。
- [x] sidebar 寬度為 340px，XL 為 380px，包含品牌、搜尋、類型篩選、定位、最近排序與 Camera list。
- [x] CameraList 新增 `sidebar` variant，桌面 sidebar 使用單欄卡片。
- [x] 桌面不再使用 Map/List 二選一；地圖始終為主要工作區。
- [x] 手機版 M2.1 map-first 浮動控制維持原樣。
- [x] GitHub Actions run `34703455963`：Install dependencies 與 Build 均成功。

---

### M2.1 — Mobile map-first layout（已完成）

**Executor: ChatGPT**

- [x] 手機版改為 map-first，傳統 Header 與 filter bar 在 `< md` 隱藏。
- [x] 搜尋列改為地圖上方 floating search bar。
- [x] 類型 filter chips 改為可水平滑動的 floating chips。
- [x] 定位與「最近」改為地圖 floating actions。
- [x] 保留手機 Map/List 切換，並以底部 compact switch 呈現。
- [x] 手機地圖取消外層 padding／圓角留白，成為主要畫面。
- [x] Leaflet 縮放控制在手機下移，避免被搜尋／filter 區遮住。
- [x] GitHub Actions run `34703338571`：Install dependencies 與 Build 均成功。

---

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

- [x] M2.1 Mobile map-first layout — **ChatGPT**
- [x] M2.2 Desktop sidebar layout — **ChatGPT**
- [x] M2.3 Camera Bottom Sheet — **ChatGPT**

### M3 — 地圖效能

- [ ] M3.1 Marker clustering — **ChatGPT**
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
