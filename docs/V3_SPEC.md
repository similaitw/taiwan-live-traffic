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
6. Route mode 直接在站內計算行車路線、畫線並形成沿途 CCTV sequence。

## 2. 地圖策略

### 站內

- Leaflet + OpenStreetMap。
- 免費、不依賴 Google Maps JavaScript API。
- 負責 CCTV、cluster、route corridor、TDX、CMS、CWA、目前播放 Camera。

### 路線服務

- 地點解析：OpenStreetMap Nominatim，限台灣、按鈕觸發、不做 autocomplete。
- 行車路線：OSRM Route API，回傳 GeoJSON。
- 路線 Provider 由 server-side `/api/route-plan` 隔離，未來可替換自架服務。
- 站內不依賴 Google Maps JavaScript API / API Key。

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
- Route input / URL restore foundation。
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

### V3.5 In-app Route Planner
- Nominatim geocoding + OSRM driving route。
- Leaflet route geometry。
- 1.5km CCTV corridor + route progress ordering。

### V3.6 Multi Camera / Saved Routes
- 1 / 2 / 4 / 6 格 snapshot。
- 常用路線 localStorage。
- 單支 LIVE explicit opt-in。

### V3.7 Traffic Context
- route-level event / congestion / CMS / rainfall summary。

### V3.8 Responsive Polish
- 375 / 768 / 1280+ smoke test。
- accessibility / reduced motion / keyboard。


## 8. Skins

V3 提供持久化 Skin 切換，預設「黑曜」：黑曜／海灣／森林／暮紫。Skin 使用 CSS variables + `data-skin`，存在 localStorage，不影響資料與分享 URL。

## 9. Implementation status

- **V3.1 Route UX Foundation**：完成。
- **V3.2 Corridor CCTV**：道路 / 方向 / 里程 sequence、previous / next、map focus 已完成。
- **V3.3 Autoplay**：Snapshot autoplay 預設 ON、3 / 5 / 10 秒已完成；LIVE 仍為手動。
- **V3.4 Filmstrip**：沿線橫向 sequence 已完成。
- **Skins**：黑曜／海灣／森林／暮紫，localStorage 持久化已完成。
- **V3.5 In-app Route Planner**：完成；Nominatim + OSRM + Leaflet geometry + route CCTV sequence。
- **V3.6 Multi Camera / Saved Routes**：待開發。
- **V3.7 Traffic Context**：沿用既有 TDX / CMS / CWA，route-level 整合仍可再強化。
- **V3.8 Responsive Polish**：待 production 對齊後做 375 / 768 / 1280 最終驗收。


## 10. Actual in-app routing

- Route mode 不再以 Google Maps 外部 URL 當核心。
- 使用者按「規畫路線」才送出地理編碼，不做 autocomplete。
- Nominatim 限台灣、server-side proxy、User-Agent / Referer、1 req/s pacing、warm-cache。
- OSRM Route API 回傳 GeoJSON。
- Leaflet 站內繪製路線並 fit bounds。
- 以約 1.5km corridor 找出 CCTV，再依 route progress 排列成 autoplay sequence。
- Provider 集中在 `/api/route-plan`，未來可替換自架服務。
