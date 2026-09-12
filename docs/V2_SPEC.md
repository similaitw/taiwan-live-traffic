# Taiwan Live Traffic V2 規格書

> 專案：`similaitw/taiwan-live-traffic`
>
> 目標：由「全台監視器即時查詢」升級為「台灣即時交通地圖」，保留既有監視器能力，強化手機體驗、道路瀏覽、收藏、附近模式、即時狀態與後續交通資料整合能力。

---

## 1. V2 產品定位

### 1.1 核心定位

V1 是以攝影機為中心的 CCTV Viewer：

- 顯示全台 CCTV
- 關鍵字搜尋
- 國道／省道／縣市分類
- 地圖與清單切換
- 定位與距離排序
- 快照與 MJPEG 直播

V2 改為以使用情境為中心的即時交通工具：

> 使用者不需要先知道攝影機 ID，而是從「我要去哪裡／我要看哪條路」開始，再利用攝影機確認真實路況。

主要使用流程：

1. 搜尋道路、地點或地區。
2. 顯示符合的道路與沿線 CCTV。
3. 快速查看目前快照。
4. 必要時才開啟直播。
5. 收藏常用攝影機或道路。
6. 日後整合事故、壅塞、CMS 與天氣資訊。

### 1.2 V2 第一階段不做

- 不加入帳號登入。
- 不建資料庫儲存個人收藏。
- 不做完整導航。
- 不做使用者回報事故。
- 不重寫現有資料抓取架構。
- 不更換 Next.js / TypeScript / Tailwind / Leaflet 技術棧。
- 不一次整合所有第三方路況來源。

收藏與最近觀看先使用 `localStorage`。

---

## 2. 現有架構保留原則

現有架構：

```text
Next.js App Router
├─ app/
│  ├─ page.tsx
│  └─ api/
│     ├─ cameras/
│     └─ proxy/
├─ components/
│  ├─ SearchBar.tsx
│  ├─ CameraList.tsx
│  ├─ CameraCard.tsx
│  ├─ CameraModal.tsx
│  ├─ Map.tsx
│  └─ MapInner.tsx
├─ lib/
│  ├─ freeway.ts
│  ├─ thb.ts
│  └─ cache.ts
└─ types/
   └─ camera.ts
```

V2 原則：

- 不破壞現有 `/api/cameras`。
- 不破壞現有 proxy URL。
- 現有監視器資料若新欄位缺失，必須仍可正常呈現。
- UI 重構須分階段進行，不允許一次把首頁全部重寫後才測試。
- 每個 milestone 完成後均須 `npm run build`。
- 若建立測試框架，後續 milestone 必須維持測試通過。

---

## 3. 資料模型 V2

目前 Camera 欄位過少，V2 擴充為：

```ts
export type CameraType = 'freeway' | 'provincial' | 'county';

export type CameraStatus =
  | 'online'
  | 'stale'
  | 'offline'
  | 'unknown';

export interface Camera {
  id: string;
  name: string;
  type: CameraType;

  provider?: string;

  lat: number;
  lng: number;

  road?: string;
  roadNumber?: string;
  mile?: number | string;
  direction?: string;

  county?: string;
  district?: string;

  streamUrl: string;
  snapshotUrl?: string;
  streamType?: 'mjpeg' | 'image' | 'unknown';

  status?: CameraStatus;
  lastCheckedAt?: string;
  lastFrameAt?: string;

  tags?: string[];
}
```

### 3.1 相容性

新增欄位全部先採 optional。

現有 API source adapter 可逐步補資料，不要求第一階段一次取得所有欄位。

### 3.2 正規化

在 `lib/` 增加共用 normalize helper，避免不同來源各自產生不同格式。

建議：

```text
lib/
├─ camera-normalizer.ts
├─ freeway.ts
├─ thb.ts
└─ cache.ts
```

normalize 目標：

- 統一道路名稱。
- 統一方向字串。
- 提取道路編號，例如國5、台9、台2。
- 能提取公里數時存入 `mile`。
- 建立搜尋用 tags。

---

## 4. V2 UI / UX

## 4.1 設計原則

保留 V1 的深色科技感：

- dark background
- blue / green / amber 類型色
- glass panel
- subtle glow

但降低純裝飾動畫，提升資訊判讀能力。

主要視覺方向：

> Google Maps 的可用性 + 交通控制中心的即時感。

所有主要操作必須 mobile-first。

---

## 4.2 手機版首頁

手機版以「全畫面地圖」為主，不再讓 Header 與 filter bar 佔據過多高度。

建議結構：

```text
┌──────────────────────┐
│ 🔍 搜尋道路、地點、地區 │
└──────────────────────┘

[附近] [國道] [省道] [縣市] [更多]

                ◎ 定位


             MAP


╭──────────────────────╮
│ Camera Bottom Sheet  │
╰──────────────────────╯
```

### 必要行為

- 搜尋列固定在上方。
- filter chips 可橫向滑動。
- 地圖佔主要畫面。
- 點擊 CCTV marker 不直接開大型 modal。
- 手機先開 Bottom Sheet。
- Bottom Sheet 顯示快照、名稱、道路、方向、距離、狀態。
- 點「開啟直播」才進入完整直播畫面。

---

## 4.3 桌面版首頁

桌面採 sidebar + map：

```text
┌───────────────┬────────────────────────┐
│ Search        │                        │
│ Filters       │                        │
│               │                        │
│ Camera list   │          MAP           │
│               │                        │
│               │                        │
└───────────────┴────────────────────────┘
```

Sidebar 建議寬度約 320–380px。

使用者不用再於「Map / List」間完全切換；桌面可同時看到清單與地圖。

---

## 4.4 Camera Bottom Sheet / Detail Panel

內容順序：

1. 類型 badge。
2. CCTV 名稱。
3. 狀態。
4. 快照。
5. 道路／方向／公里數。
6. 距離使用者位置。
7. 收藏。
8. 分享。
9. 開啟直播。
10. 上一支／下一支沿線 CCTV。

狀態顯示禁止永遠使用假 LIVE 紅點。

狀態建議：

```text
● 即時
● 30 秒前
● 畫面過久未更新
● 來源異常
● 狀態未知
```

---

## 5. 地圖 V2

## 5.1 Marker clustering

目前低縮放層級只顯示離中心最近 N 個 marker，V2 改成 cluster。

需求：

- 縮放較遠時顯示群組數字。
- 點 cluster 自動 zoom in。
- 放大後才顯示單支 CCTV。
- 不應每次 `moveend` 都完整銷毀並重新建立所有 marker。

可採 Leaflet clustering 套件或其他輕量 clustering 實作，但需避免增加過重依賴。

## 5.2 Viewport filtering

只處理目前 viewport 及其周邊 buffer 的 marker。

目標：

- 全台數千支 CCTV 時地圖仍可順暢操作。
- 手機低階裝置不應一次建立所有 DOM marker。

## 5.3 點擊行為

Desktop：

- click marker → 選中 marker。
- sidebar 顯示 detail。
- 地圖平滑置中。

Mobile：

- click marker → Bottom Sheet。
- 不立即開直播。

Hover preview 僅視為 desktop enhancement，核心功能不可依賴 hover。

---

## 6. 搜尋 V2

搜尋需支援：

- CCTV 名稱。
- CCTV ID。
- 道路名稱。
- 道路編號。
- 縣市。
- 行政區。
- 公里數。
- tags。

範例：

```text
國5
雪隧
坪林
台9
羅東
宜蘭
38K
北上
```

### 搜尋 UX

輸入後顯示分類結果：

```text
道路
國道5號
台9線

地區
宜蘭縣
羅東鎮

監視器
國5 38.2K 北上
國5 40.1K 南下
```

第一階段可先 client-side 搜尋，不必導入搜尋服務。

---

## 7. 附近模式

新增快速操作：

```text
附近 5 km
附近 10 km
附近 20 km
```

定位成功後：

- 地圖移至使用者位置。
- 顯示半徑內 CCTV。
- 可依距離排序。
- Camera Card / Detail 顯示距離。

距離計算抽成共用 utility，不要在 `page.tsx` 與 `MapInner.tsx` 重複實作 Haversine。

建議：

```text
lib/geo.ts
```

---

## 8. 收藏與最近觀看

第一階段不需登入。

### 8.1 收藏

localStorage key：

```text
taiwan-live-traffic:favorites
```

儲存 camera ID 陣列。

功能：

- Camera Card 收藏按鈕。
- Detail 收藏按鈕。
- 首頁「收藏」入口。
- 若來源暫時消失，保留收藏 ID，但 UI 標示目前無資料。

### 8.2 最近觀看

localStorage key：

```text
taiwan-live-traffic:recent
```

建議最多保存 20 支。

每次真正開啟 Detail 或 Live 時更新。

---

## 9. 道路模式

新增「道路」入口。

第一階段至少支援由現有 Camera data 自動分組：

```text
國1
國3
國5
台2
台7
台9
...
```

道路頁／道路模式內容：

- 道路名稱。
- CCTV 數量。
- 方向。
- 依 mile 排序。
- 地圖只顯示該道路。
- 上一支／下一支 CCTV。

這是 V2 最重要的核心功能之一。

使用者應能快速完成：

> 國5 → 北上 → 依公里數一路查看。

---

## 10. 分享與 URL 狀態

主要 UI state 應逐步可被 URL 表示。

建議：

```text
/?camera=freeway-xxxx
/?road=國5
/?road=國5&direction=北上
/?nearby=10
/?q=雪隧
```

若後續適合，也可建立：

```text
/camera/[id]
/road/[road]
```

第一階段先 query-string 即可。

分享按鈕：

- 使用 Web Share API（支援時）。
- fallback 為複製網址。

---

## 11. Camera 狀態

V2 不得再把所有 Camera 直接呈現為 LIVE。

第一階段可用被動狀態：

- snapshot 成功 → online。
- snapshot 失敗 → unknown / offline。
- 不必對全台所有 CCTV 主動健康檢查。

避免每次首頁載入就對所有來源發送 snapshot probe。

後續若需要集中狀態檢查，再新增 server-side checker。

---

## 12. Snapshot / Live 策略

### 12.1 預設只使用 Snapshot

列表、marker preview、Bottom Sheet：

- 只抓 snapshot。
- snapshot 可短時間 cache。
- 不啟動 MJPEG live stream。

### 12.2 Live 需由使用者明確觸發

只有以下情況建立 `/api/proxy/image` stream：

- 使用者按「開啟直播」。
- 使用者進入完整 Camera detail 並明確切換 LIVE。

### 12.3 Live cleanup

關閉直播時必須確保 browser request 能停止。

切換 Camera 時舊 stream 必須卸載。

### 12.4 Proxy 安全

維持 hostname allowlist。

禁止把 proxy 變成任意 URL proxy。

---

## 13. Cache / API V2

目前 process-memory Map cache 可保留為 fallback，但不要把它視為跨 instance 的共享 cache。

第一階段：

- `/api/cameras` 仍維持 5 分鐘等級更新。
- 盡量使用 Next.js / HTTP caching semantic。
- upstream 失敗仍採 partial success。

API 建議逐步支援 metadata：

```json
{
  "data": [],
  "meta": {
    "updatedAt": "...",
    "total": 0,
    "sources": {
      "freeway": "ok",
      "provincial": "ok",
      "county": "error"
    }
  }
}
```

但若改變既有 `/api/cameras` response 會破壞前端，則建立新 endpoint：

```text
/api/v2/cameras
```

V1 endpoint 暫不移除。

---

## 14. 未來交通資料擴充

V2 架構必須預留圖層概念，但第一階段不全部實作。

預計 layer：

```ts
type MapLayer =
  | 'camera'
  | 'traffic-event'
  | 'cms'
  | 'weather'
  | 'parking';
```

優先順序：

1. CCTV。
2. 道路事件。
3. CMS。
4. 壅塞／速度。
5. 天氣。
6. 停車資訊。

未來可整合 TDX 或其他政府開放資料來源。

---

## 15. 元件重構建議

建議目標：

```text
components/
├─ layout/
│  ├─ DesktopSidebar.tsx
│  └─ MobileTopBar.tsx
├─ camera/
│  ├─ CameraCard.tsx
│  ├─ CameraDetail.tsx
│  ├─ CameraBottomSheet.tsx
│  ├─ CameraLiveView.tsx
│  └─ CameraStatus.tsx
├─ map/
│  ├─ TrafficMap.tsx
│  ├─ CameraMarkers.tsx
│  └─ UserLocationMarker.tsx
├─ search/
│  ├─ SearchBar.tsx
│  └─ SearchResults.tsx
├─ filters/
│  └─ FilterChips.tsx
└─ road/
   ├─ RoadList.tsx
   └─ RoadCameraNavigator.tsx
```

不要求一次搬完。

以 milestone 漸進重構，避免大爆炸式 rewrite。

---

## 16. State 管理

第一階段不需引入 Redux / Zustand。

優先使用：

- React state。
- custom hooks。
- URLSearchParams。
- localStorage hooks。

建議 custom hooks：

```text
hooks/
├─ useCameras.ts
├─ useGeolocation.ts
├─ useFavorites.ts
├─ useRecentCameras.ts
└─ useCameraFilters.ts
```

若未來 state 複雜度明顯增加，再評估 Zustand。

---

## 17. 效能要求

### 前端

- 首頁不可同時載入大量 MJPEG。
- Camera grid 圖片必須 lazy load。
- 地圖不可同時建立所有 marker DOM。
- 搜尋與 filter 應使用 memoized derived data。
- 不要在多個元件重複 filter 同一份 cameras。

### API

- 上游來源需 timeout。
- 單一來源失敗不可造成全 API 失敗。
- proxy 必須維持 allowlist。
- snapshot cache 不得無限制成長，需有最大容量或清理機制。

---

## 18. Accessibility

最低要求：

- 所有 icon button 有 `aria-label`。
- Bottom Sheet / modal 可鍵盤關閉。
- focus state 清楚。
- 不用單純顏色表示狀態。
- 對比符合一般文字閱讀需求。
- `prefers-reduced-motion` 時降低非必要動畫。

---

# 19. 開發里程碑

## M1 — 基礎整理與資料模型

### M1.1 Camera V2 type

工作：

- 擴充 `Camera` interface。
- 保持現有 source 相容。
- 新增 camera normalizer。

驗收：

- 現有監視器仍可載入。
- `npm run build` 通過。

### M1.2 共用 geo utilities

工作：

- 把 Haversine distance 移至 `lib/geo.ts`。
- 移除 `page.tsx`、`MapInner.tsx` 重複計算。

驗收：

- 最近排序結果與原本一致。
- build 通過。

### M1.3 hooks 基礎拆分

工作：

- 建立 `useGeolocation`。
- 建立 `useFavorites`。
- 建立 `useRecentCameras`。

驗收：

- 首頁功能不退化。
- localStorage SSR safe。

---

## M2 — UI 2.0

### M2.1 Mobile map-first layout

工作：

- 手機改全畫面地圖。
- Search floating bar。
- Filter chips。
- 定位 floating button。

驗收：

- 375px 寬度正常。
- 不出現主要操作被 header 擠壓。

### M2.2 Desktop sidebar layout

工作：

- 桌面改 sidebar + map。
- sidebar 可顯示 Camera list。
- 點清單同步地圖。

驗收：

- 1280px 以上正常。
- 不再必須 Map/List 二選一。

### M2.3 Camera Bottom Sheet

工作：

- mobile marker click → Bottom Sheet。
- 顯示 snapshot / metadata / favorite / share / live button。

驗收：

- 不會點 marker 就立即建立 MJPEG stream。

---

## M3 — 地圖效能

### M3.1 Marker clustering

工作：

- 建立 cluster。
- 移除目前 MAX_MARKERS 截斷策略。

驗收：

- 全台 view 不會只顯示隨機最近 50 支。
- cluster 點擊可放大。

### M3.2 Viewport optimization

工作：

- 限制 marker 處理範圍。
- 避免每次移動完整 recreate。

驗收：

- 大量 camera 時拖曳順暢。

---

## M4 — 使用者功能

### M4.1 收藏

工作：

- Favorite button。
- 收藏 filter / view。
- localStorage persistence。

### M4.2 最近觀看

工作：

- 保存最近 20 支。
- 首頁可快速返回。

### M4.3 Share / URL state

工作：

- camera / road / query 寫入 URL。
- Web Share API + copy fallback。

驗收：

- 分享網址重新開啟後可恢復主要 selection。

---

## M5 — 道路模式

### M5.1 Road grouping

工作：

- 從 cameras 建立 road groups。
- 支援國道、省道主要道路。

### M5.2 Road navigator

工作：

- 道路內依 mile / direction 排序。
- 上一支／下一支。

驗收：

- 國5 等道路可快速連續看沿線 CCTV。

### M5.3 Nearby mode

工作：

- 5 / 10 / 20 km。
- 依距離排序。

---

# 20. M6 以後規劃

M6 不屬於 V2 MVP，但需保留架構空間。

### M6 — 即時交通事件

- TDX 道路事件。
- 事件 marker。
- 事件與附近 CCTV 關聯。

### M7 — CMS / 速度 / 壅塞

- CMS 顯示內容。
- VD / travel speed。
- 路段壅塞著色。

### M8 — 天氣與旅途模式

- 降雨。
- 雷達。
- 天氣警特報。
- 行程沿線 CCTV。

---

# 21. V2 MVP Definition of Done

V2 MVP 完成時需符合：

- 手機為 map-first UX。
- 桌面為 sidebar + map。
- marker clustering 完成。
- 收藏可持久保存。
- 最近觀看完成。
- Nearby 5 / 10 / 20 km 完成。
- Road mode 完成。
- Road camera 上一支／下一支完成。
- Camera detail 預設只載 snapshot。
- Live 需使用者主動觸發。
- Camera 不再無條件顯示假 LIVE。
- URL 可分享主要 camera / search state。
- proxy allowlist 不退化。
- upstream partial failure 仍可用。
- `npm run build` 通過。

---

# 22. Codex 執行規則

Codex 每次只完成一個子任務，例如 `M1.1`。

每個子任務必須：

1. 先讀本文件。
2. 檢查目前實作，不假設前一個 milestone 已完成。
3. 只修改該任務必要檔案。
4. 不做未要求的大規模重寫。
5. 保持現有功能相容。
6. 執行 `npm run build`。
7. 有測試時執行相關測試。
8. 完成後回報：
   - 修改檔案
   - 功能摘要
   - 測試結果
   - build 結果
   - commit SHA

若 task 涉及 UI，至少檢查：

- mobile 375px
- tablet 768px
- desktop 1280px

若遇到上游 CCTV 不穩定，不應因單一來源暫時失敗而移除既有功能或改成假資料。

---

# 23. 建議第一個 Current Task

```text
M1.1 — Camera V2 data model
```

內容：

- 擴充 `types/camera.ts`。
- 建立 `lib/camera-normalizer.ts`。
- 調整 `freeway.ts` / `thb.ts` 逐步補 provider / roadNumber / mile / tags。
- 不改 UI。
- 不改 API response shape。
- `npm run build` 必須通過。

這個任務完成後再進行 M1.2。
