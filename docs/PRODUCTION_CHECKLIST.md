# Production deploy checklist

本文件用於 `similaitw/taiwan-live-traffic` 正式部署前後驗收。原則：不在任何畫面、log、health response 或文件中暴露實際 secrets。

## 1. GitHub / build

- `main` 為唯一正式部署來源。
- 最新 GitHub Actions `CI` 必須成功。
- `npm ci` 與 `npm run build` 必須通過。
- 確認部署 commit 與 `main` 最新 commit 一致。

## 2. Vercel environment

TDX 圖層需要以下兩個 Production environment variables：

- `TDX_CLIENT_ID`
- `TDX_CLIENT_SECRET`

只確認是否存在，不複製值到 issue、截圖、log 或 `/api/health`。

中央氣象署資料不需要額外 API key：

- 雨量：CWA OpenData `O-A0002-001`
- 雷達：CWA OpenData `O-A0058-006`
- 專案使用中央氣象署公開 OpenData / 官方公開資料來源。

## 3. Passive health check

開啟：

`/api/health`

預期：

- HTTP 200。
- `status` 為 `ok`。
- `configuration.tdx.configured` 只回傳 boolean，不得包含 Client ID / Secret。
- `configuration.cwa.authenticationRequired` 為 `false`。
- Camera proxy 顯示 allowlist / redirect revalidation / live explicit opt-in guardrails。
- health endpoint 不主動呼叫 TDX、CWA 或 CCTV upstream。

`/api/health` 只代表部署設定與程式保護機制存在，不代表所有外部資料源當下都在線。

## 4. API smoke checks

依序確認下列 endpoint 能回應 JSON 或預期影像：

- `/api/cameras`：主要 Camera 清單可載入；單一上游失敗不得讓全部 cameras API 掛掉。
- `/api/rainfall`：可回 rainfall stations；上游失敗時前端需顯示來源狀態。
- `/api/traffic-events`：有 TDX credentials 時可啟用；未設定時 graceful degradation。
- `/api/traffic-flow`：有 TDX credentials 時可啟用；未設定時 graceful degradation。
- `/api/traffic-sections`：有 TDX credentials 時可啟用；未設定時 graceful degradation。
- `/api/cms`：有 TDX credentials 時可啟用；未設定時 graceful degradation。
- `/api/proxy/snapshot?url=...`：只測一個已知允許來源，確認單張 snapshot 可回傳。
- `/api/proxy/image?url=...`：只在手動 LIVE 驗證時使用，不做自動壓力測試。

## 5. Camera proxy / security

- 非 allowlist hostname 必須被拒絕。
- 非 HTTP(S) URL 必須被拒絕。
- 含 URL credentials 的來源必須被拒絕。
- redirect 每一跳都重新驗證 hostname。
- redirect 最多 4 跳。
- snapshot 保持單幀擷取與短快取。
- live MJPEG 只有使用者主動按「開啟直播」後才建立。
- 停止直播、關閉 Modal、切換 Camera、分頁隱藏或 pagehide 時應停止 live request。
- live relay server-side 最長 90 秒；逾時後使用者可重新手動開啟。

## 6. 正式站 UI smoke check

至少以以下 viewport 驗證：

- 375px：手機 map-first、浮動搜尋、圖層面板、Bottom Sheet、safe area。
- 768px：平板 breakpoint、地圖與控制不互相遮擋。
- 1280px：桌面 sidebar + map、Camera detail、道路導覽。

每個 viewport 至少確認：

- Camera map markers / clustering 正常。
- Search / 類型 / 道路 / Nearby 可操作。
- Camera snapshot 正常。
- LIVE 不會自動啟動；按「開啟直播」後才連線，並可「停止直播」。
- 圖層面板可開關雷達、雨量、壅塞、事件、CMS。
- 資料來源 unavailable 時顯示「未啟用／暫時失敗／資料較舊」，而不是控制項無聲消失。
- 收藏、最近觀看與圖層偏好重整後仍保留。
- 分享 URL 可恢復主要狀態。

## 7. Graceful degradation

刻意以沒有 TDX credentials 的環境或 Preview 驗證一次：

- CCTV 主功能仍可用。
- CWA 雨量 / 雷達仍可用。
- TDX 事件 / 壅塞 / CMS 顯示「未啟用」，不造成全站錯誤。
- `/api/health` 顯示 `configuration.tdx.configured: false`，但不回傳任何 secret 內容。

## 8. Production browser verification limitation

截至 M11.4 完成時，此 ChatGPT 執行環境無法直接取得使用者的 Vercel team / production deployment URL；先前 Vercel connector 也未回傳可用 team。因此本文件中的「正式站瀏覽器 smoke check」屬於部署後必跑項目，不能因 CI build 成功就視為已完成。

當可取得正式 deployment URL 時，再以實際瀏覽器補跑 375px / 768px / 1280px 與上述互動驗證。

## 9. Release acceptance

正式接受 release 前需同時符合：

- GitHub CI 綠燈。
- `/api/health` 200 且不洩漏 secrets。
- 正式站 Camera snapshot 可用。
- 手動 LIVE lifecycle 正常。
- 圖層面板與 source health 正常。
- TDX 有設定時事件／路況／CMS 可用；未設定時 graceful degradation 正常。
- CWA 雨量／雷達可用或能清楚顯示暫時失敗。
- 至少完成 375 / 768 / 1280px 正式站 smoke check。
