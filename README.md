# 成語填空・手寫辨識

一個讓小朋友在手機上練習成語填空、並用手寫作答的網頁程式。

## 專案結構（一個 Git 專案）

```
成語/
├── frontend/          # 前端：成語題目 + 手寫畫板
│   ├── index.html
│   ├── style.css
│   ├── idioms.js      # 150 題題庫
│   └── main.js
├── backend/           # 後端：/recognize API（手寫辨識）
│   ├── package.json
│   └── server.js
├── .gitignore
└── README.md
```

## 本地執行方式

### 1. 後端（先啟動）

```bash
cd backend
npm install
npm start
```

後端會在 `http://localhost:3000` 提供 `/recognize` API。

### 2. 開啟網頁（請用這個方式，避免連線失敗）

後端啟動後，**在瀏覽器網址列輸入**：

`http://localhost:3000`

（不要雙擊 `index.html` 用 `file://` 開啟，否則很多瀏覽器會擋住對辨識 API 的連線，畫面會顯示「無法連線到辨識服務」。）

若只想單獨測前端、後端在別台，可用 `npx serve frontend`，並把 `main.js` 裡的 `API_BASE` 改成後端網址。

### 3. 發佈給小朋友

- 前端可部署到 **GitHub Pages**（只放 `frontend/` 內容）。
- 後端需另外部署到 **Render / Railway** 等，並把前端的 API 網址改成後端實際網址。

## 手寫辨識

目前後端為 **mock 模式**（回傳假資料），方便先跑通流程。  
要接上真正辨識時，在 `backend/server.js` 中改為呼叫 Google Cloud Vision 或 Azure 等 API，並在伺服器設定環境變數存放 API 金鑰。

## 授權

可依需要自行選擇開源授權（如 MIT）。
