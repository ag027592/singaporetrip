# Singapore Travel Itinerary Site (2026)

這是可直接部署到 GitHub Pages 的靜態網站，內容為 2026/07/04-2026/07/12 新加坡每日行程，包含：

- 活動名稱、精確時間、地點與地址
- 預計花費（SGD）
- 交通建議（含 MRT 站名與預估車資）
- 每個地標的 Google Maps 連結
- 住宿建議與注意事項

## 本地預覽

建議使用本機靜態伺服器預覽（避免瀏覽器直接開檔的 `fetch` 限制）。

### 方法 A：Python

```bash
python -m http.server 8080
```

然後打開：`http://localhost:8080`

### 方法 B：VS Code / Cursor Live Server

直接對 `index.html` 使用 Live Server 開啟即可。

### 方法 C：Node（若已安裝 Node.js）

```bash
npx serve .
```

預設通常會提供 `http://localhost:3000`（以終端輸出為準）。

## 推送到 GitHub（你本機執行）

在 `d:\Ann\Singapore_Travel`：

```bash
git init
git add .
git commit -m "Add detailed Singapore itinerary website for Jul 2026"
git branch -M main
git remote add origin https://github.com/<你的帳號>/<你的倉庫>.git
git push -u origin main
```

## 啟用 GitHub Pages（main root）

1. 進入 GitHub 專案頁面。
2. `Settings` -> `Pages`。
3. `Source` 選 `Deploy from a branch`。
4. Branch 選 `main`，Folder 選 `/(root)`，按 Save。
5. 等待 1-5 分鐘後，會得到網站網址：
   `https://<你的帳號>.github.io/<你的倉庫>/`

## 資料來源與限制

- 會議資訊：ICPR7 官網  
  https://counsel.org.sg/icpr-home/
注意：

- 車資、票價與餐費是估算值，實際以當天為準。
- 會議細部場次請以主辦方公布的最終議程為準。
