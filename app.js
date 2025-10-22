require('dotenv').config();
const express = require('express');
const path = require('path'); // Node.js標準のモジュール
const app = express();
const port = process.env.PORT || 3000;

// 'public' フォルダを静的ファイルの配信フォルダとして設定
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  const currentUser ={
    display_name: 'なお',
    icon_url: 'https://kotonohaworks.com/free-icons/wp-content/uploads/kkrn_icon_user_1-768x768.png'
  }
  res.render('index', {
    isLoggedIn: true,
    user:currentUser
  });
})
app.get('/login', (req, res) => {
  res.render('login', { 
    isLoggedIn: false,
    user: null // ユーザー情報なし
  });
});

app.get('/signup', (req, res) => {
  res.render('signup', { 
    isLoggedIn: false,
    user: null // ユーザー情報なし
  });
})

// サーバーを起動
app.listen(port, () => {
  console.log(`サーバーが http://localhost:${port} で起動しました`);
});