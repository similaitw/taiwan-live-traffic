# TASKS.md

> Repository：`similaitw/taiwan-live-traffic`
>
> 執行方式：每次只完成一個 `Current task`。完成、測試、commit、push 後，才把 Current task 移到下一項。

## Current task

### M1.3 — hooks 基礎拆分

目標／範圍：

- [ ] 拆分 `useGeolocation`。
- [ ] 建立 `useFavorites`。
- [ ] 建立 `useRecentCameras`。
- [ ] localStorage 必須 SSR safe。
- [ ] `npm run build` 通過；若已有相關測試，也要執行。

詳細需求需要時讀 `docs/V2_SPEC.md` 對應章節。完成後將 Current task 更新成 M2.1 — Mobile map-first layout，commit 並 push 到 main。

---

## 已完成任務

### M1.2 — 共用 geo utilities（已完成）

目標／範圍：

- [x] 新增 `lib/geo.ts`。
- [x] 把 Haversine distance 從 `app/page.tsx` 與 `components/MapInner.tsx` 移出。
- [x] 最近排序結果保持一致。
- [x] `npm run build` 通過；若已有相關測試，也要執行。

驗證：`npm run build` 通過；81 組座標距離與兩份原始函式完全一致，兩份函式各 9 組最近排序（含同距離）比較通過，公尺單位檢查通過。現有專案無相關測試套件。

---

### M1.1 — Camera V2 data model（已完成）

驗證：`npm run build` 通過；8 組 normalizer 案例（含相容性、重複正規化與不修改輸入）通過。現有專案無相關測試套件。

目標：擴充 Camera 資料模型與正規化層，但不改 UI、不改 `/api/cameras` response shape。

直接相關檔案：

- `types/camera.ts`
- `lib/freeway.ts`
- `lib/thb.ts`
- 新增 `lib/camera-normalizer.ts`

必要工作：

- [x] 擴充 `Camera` interface：`provider`、`roadNumber`、`mile`、`county`、`district`、`streamType`、`status`、`lastCheckedAt`、`lastFrameAt`、`tags`。
- [x] 新增 `CameraType`、`CameraStatus` type。
- [x] 新增 `lib/camera-normalizer.ts`。
- [x] normalizer 至少能處理道路名稱／道路編號／公里數／方向／tags 的基礎正規化。
- [x] `freeway.ts` 使用 normalizer，能取得時補 `provider`、`roadNumber`、`mile`、`tags`。
- [x] `thb.ts` 使用 normalizer，能取得時補 `provider`、`roadNumber`、`mile`、`tags`。
- [x] 所有新增欄位先保持 optional，相容既有資料來源。
- [x] 不修改 UI。
- [x] 不修改 `/api/cameras` response shape。
- [x] `npm run build` 通過。

完成後請：

1. 將 M1.1 標記完成。
2. 將 `Current task` 更新成 `M1.2 — 共用 geo utilities`。
3. commit 並 push 到 `main`。
4. 回報 commit SHA。

---

## Milestones

### M1 — 基礎整理與資料模型

- [x] M1.1 Camera V2 data model
- [x] M1.2 共用 geo utilities
- [ ] M1.3 hooks 基礎拆分

### M2 — UI 2.0

- [ ] M2.1 Mobile map-first layout
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

## 下一任務摘要

### M1.3 — hooks 基礎拆分

預定範圍：

- `useGeolocation`
- `useFavorites`
- `useRecentCameras`
- localStorage 必須 SSR safe。

其餘詳細需求需要時再讀 `docs/V2_SPEC.md` 對應章節，不要每次完整重讀。