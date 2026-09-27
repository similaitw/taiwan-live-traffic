# Taiwan Live Traffic

台灣即時路況地圖。V3 以「沿著我要走的路，快速把沿途 CCTV 看一遍」為核心。

## V3 功能

- **路線 / 道路 / 附近** 三模式，路線模式為預設。
- 道路 + 方向 + 里程形成穩定的沿線 CCTV sequence。
- **Snapshot autoplay 預設開啟**，可選 3 / 5 / 10 秒。
- 上一支 / 下一支、橫向 CCTV filmstrip、地圖跟隨目前播放 Camera。
- LIVE 維持使用者手動啟動，不會因 autoplay 自動開啟 MJPEG。
- 起點 / 終點 / 最多 8 個途經點。
- 使用 **Google Maps URL** 開啟導航，不使用 Google Maps JavaScript API / API Key。
- 站內地圖使用 Leaflet + OpenStreetMap。
- 4 套持久化 Skins：**黑曜 / 海灣 / 森林 / 暮紫**。
- TDX 事件 / 車流 / CMS、CWA 雨量 / 雷達、收藏、最近觀看、Nearby 等 V2 功能保留。

## Responsive Layout

- **Mobile < 768px**：map-first、浮動 Route Planner、Bottom Sheet、單張 autoplay。
- **Tablet ≥ 768px**：sidebar + map，適合雙欄資訊。
- **Desktop ≥ 1280px**：交通控制中心式 sidebar + map + corridor player。

## Deployment

- GitHub：`main` 為唯一 source of truth。
- CI：Node 22 + `npm ci` + `npm audit --audit-level=high` + regression tests + production build。
- Production：<https://taiwan-live-traffic.vercel.app/>
- Vercel 應由 Git integration 追蹤 `main` 自動部署；若 main push 只產生 Preview，需在 Vercel Project → Settings → Git 確認 Production Branch = `main`。

## Development

```bash
npm ci
npm run dev
npm test
npm run build
```

詳細規格：[`docs/V3_SPEC.md`](docs/V3_SPEC.md)  
目前進度：[`docs/TASKS.md`](docs/TASKS.md)
