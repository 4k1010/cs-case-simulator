# CS Case Simulator (MERN Stack)

這是一個基於 **MERN Stack (MongoDB, Express, React, Node.js)** 開發的 CS:GO / CS2 開箱模擬器。包含真實的機率計算、價格系統、庫存管理以及自動開箱功能。

## 專案結構與檔案功能說明

### 1. 後端與伺服器 (Root & Scripts)

* **`server.ts`**
  * **核心後端入口**。建立 Express 伺服器，連接 MongoDB。
  * 提供 API 路由：
    * `GET /api/crates`：取得所有箱子列表。
    * `POST /api/open`：處理開箱請求、伺服器端計算中獎物品、將中獎結果寫入使用者庫存。
    * `GET /api/inventory`：讀取特定使用者的庫存。
    * `DELETE /api/inventory`：清空使用者庫存。

* **`scripts/seed.ts`**
  * **資料庫填充腳本**。
  * 從外部 API (ByMykel CSGO-API & CSGOTrader) 抓取真實的槍枝皮膚、箱子與價格資料。
  * 負責將資料清洗、配對價格，並存入 MongoDB，建立初始資料庫環境。

### 2. 資料庫模型 (src/models)

使用 Mongoose 定義資料結構 Schema。

* **`src/models/Skin.ts`**
  * 定義**槍枝/造型**的資料結構。
  * 包含名稱、稀有度 (Rarity)、磨損範圍 (Float)、圖片以及各磨損度的價格表。

* **`src/models/Crate.ts`**
  * 定義**箱子**的資料結構。
  * 包含箱子資訊以及 `contains` (一般物品) 與 `specialItems` (罕見特殊物品，如刀/手套) 的關聯。

* **`src/models/Inventory.ts`**
  * 定義**使用者庫存**。
  * 記錄 `userId` 與獲得的 `skin` (ObjectId) 之間的關聯，並記錄獲得時間。

### 3. 前端核心 (src)

* **`src/App.tsx`**
  * **前端主組件**。
  * 管理全域狀態：`user` (登入資訊)、`currentView` (頁面切換)、`crates` (箱子列表)。
  * 負責初始化時呼叫 API 載入箱子列表。
  * 處理 Google Login 的回調邏輯與登出功能。

* **`src/types.ts`**
  * **TypeScript 型別定義**。
  * 定義 `Skin`, `Crate` 等介面，確保前後端資料格式一致，減少開發錯誤。

### 4. 前端組件 (src/components)

* **`src/components/OpeningView.tsx`**
  * **核心開箱頁面**。
  * 負責呼叫後端 `/api/open` 開箱 API。
  * 處理開箱動畫流程（Ready -> Unlocking -> Rolling -> Won）。
  * 包含 **Auto Open (自動開箱)** 的循環邏輯與停止按鈕 UI。
  * 顯示中獎物品詳情（磨損度、價格、Phase）。

* **`src/components/Storage.tsx`**
  * **庫存頁面**。
  * 根據使用者 ID 向後端撈取已獲得的物品列表。
  * 顯示物品價值統計、總花費，並提供「一鍵清空庫存」的功能。

* **`src/components/Navbar.tsx`**
  * 頂部導覽列 (在 `App.tsx` 中引用)。
  * 顯示登入/登出按鈕、使用者資訊，以及切換「箱子列表」與「庫存」頁面的功能。

* **`src/components/RollingAnimation.tsx`**
  * 負責繪製與執行「輪盤轉動」的視覺效果 (在 `OpeningView.tsx` 中引用)。

---

## 🚀 快速啟動 (Quick Start)

1.  **安裝依賴**
    ```bash
    npm install
    ```

2.  **設定環境變數**
    建立 `.env.local` 並填入：
    ```env
    MONGODB_URI=你的_MongoDB_連線字串
    VITE_GOOGLE_CLIENT_ID=你的_Google_OAuth_Client_ID
    ```

3.  **初始化資料庫** (僅需執行一次)
    ```bash
    npx ts-node scripts/seed.ts
    ```

4.  **啟動開發環境**
    * **終端機 1 (後端)**:
        ```bash
        npx ts-node server.ts
        ```
    * **終端機 2 (前端)**:
        ```bash
        npm run dev
        ```

5.  **開啟瀏覽器**
    前往 `http://localhost:5173` 開始體驗。

