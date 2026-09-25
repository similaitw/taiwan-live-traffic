# Taiwan Live Traffic V3 — 路線型即時監控地圖

## 1. 產品定位

V3 的核心問題不是「哪裡有監視器」，而是：

> **我要走這條路，讓我快速把沿途看一遍。**

主要流程：

1. 選「路線 / 道路 / 附近」。
2. 路線模式輸入起點、終點與多個途經點。
3. 系統建立 Route Corridor，挑出沿途 CCTV。
4. CCTV 依道路方向與里程形成 sequence。
5. 預設啟用 snapshot autoplay；目前播放中的 Camera 與地圖同步。
6. 需要真正導航時，用免 API Key 的 Google Maps URL 開啟 Google Maps。

## 2. 地圖策略

### 站內

- Leaflet + OpenStreetMap。
- 免費、不依賴 Google Maps JavaScript API。
- 負責 CCTV、cluster、route corridor、TDX、CMS、CWA、目前播放 Camera。

### Google Maps

只使用 Maps URL：

- `https://www.google.com/maps/dir/?api=1`
- 不需要 API Key。
- 交給 Google Maps 處理導航、ETA 與重新計算路線。
- URL 長度上限需注意 2,048 字元。
- 官方文件：手機瀏覽器最多支援 3 個 waypoints，其他平台最多 9 個；站內 RoutePlan 最多保留 8 個途經點。

## 3. 三模式

### Route
- V3 預設模式。
- 起點 / 終點 / 途經點。
- URL state：`mode=route&from=&to=&via=`。
- V3.2 起建立 route corridor。

### Road
- 道路 + 方向。
- 沿用既有 RoadFilter / DirectionFilter。
- URL state：`mode=road&road=&direction=`。

### Nearby
- 5 / 10 / 20 km。
- 沿用既有 geolocation。
- URL state：`mode=nearby&nearby=`。

## 4. CCTV Player

V3.3：

- Autoplay 預設 ON。
- 預設只輪播 snapshot，不自動啟動 MJPEG。
- 3 / 5 / 10 秒切換。
- 上一支 / 下一支 / 暫停。
- Auto Follow 預設 ON：地圖跟隨目前 Camera。
- LIVE 維持 explicit opt-in。

## 5. 排列方式

### 手機
- map-first。
- 上方 RoutePlanner + 搜尋。
- CCTV Bottom Sheet。
- 單張 autoplay 為預設。
- Filmstrip 橫向滑動。

### 平板
- 約 40 / 60：控制/播放器 + Map。
- 可切 2 格監控。

### 桌面
- 左側 320–380px 控制區。
- 右側 Map。
- 底部 Filmstrip。
- 可切 1 / 2 / 4 / 6 格 snapshot grid。

## 6. URL State

主要參數：

- `mode=route|road|nearby`
- `from=`
- `to=`
- `via=礁溪|坪林`
- `road=`
- `direction=`
- `nearby=`
- `camera=`
- `autoplay=1|0`

舊 V2 URL 必須相容：有 `road` 而沒有 `mode` 時自動推斷 road；有 `nearby` 時推斷 nearby。

## 7. Milestones

### V3.1 Route UX Foundation
- 三模式。
- 起點/終點/途經點。
- Google Maps URL launcher。
- URL restore/share foundation。
- 手機/平板/桌面 responsive shell。

### V3.2 Corridor CCTV
- 由道路/RoutePlan 建立 Camera sequence。
- 方向 + 里程排序。
- 沿線 Camera focus / next / previous。

### V3.3 Autoplay
- 預設 ON。
- snapshot slideshow。
- 3 / 5 / 10 秒。
- map auto-follow。

### V3.4 Filmstrip
- 手機 horizontal。
- 桌面 bottom filmstrip。
- active Camera auto-scroll。

### V3.5 Multi Camera
- 1 / 2 / 4 / 6 格 snapshot。
- 單支 LIVE explicit opt-in。

### V3.6 Google Maps Bridge
- 強化 Maps URL。
- 多點平台限制提示。
- 常用路線 localStorage。

### V3.7 Traffic Context
- route-level event / congestion / CMS / rainfall summary。

### V3.8 Responsive Polish
- 375 / 768 / 1280+ smoke test。
- accessibility / reduced motion / keyboard。
