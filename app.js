require('dotenv').config();
const express = require('express');
const path = require('path'); // Node.js標準のモジュール
const app = express();
const port = process.env.PORT || 3000;

// 'public' フォルダを静的ファイルの配信フォルダとして設定
app.use(express.static(path.join(__dirname, 'public')));

// サーバーを起動
app.listen(port, () => {
  console.log(`サーバーが http://localhost:${port} で起動しました`);
});