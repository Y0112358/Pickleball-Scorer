<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1cKfX173Mbbg79VxC_sJ-O6lJ7Ww-E-7c

## 🚀 開始使用 / Getting Started

### 📋 前置需求 / Prerequisites
- **Node.js**: v18 或更高版本
- **Unique Gemini API Key**: 確保你擁有 API key (設定於 `.env.local` 檔案中)

### 🛠️ 安裝與執行 / Installation & Run

1. **安裝依賴套件 / Install dependencies**
   ```bash
   npm install
   ```

2. **設定環境變數 / Setup Environment Variables**
   複製 `.env.example` (若有) 或直接建立 `.env.local` 並填入：
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

3. **啟動開發伺服器 / Start Dev Server**
   ```bash
   npm run dev
   ```

## 📦 部署 / Deployment

本專案已設定 GitHub Actions，可自動部署至 GitHub Pages。
1. 到 GitHub Repository 的 **Settings > Pages**。
2. 在 **Build and deployment** 下，選擇 Source 為 **GitHub Actions**。
3. 推送程式碼到 `main` 分支即可觸發部署。

## 📜 專案結構 / Project Structure
- `.github/workflows`: CI/CD 設定
- `src`: 原始碼
- `vite.config.ts`: Vite 設定
