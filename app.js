require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const path = require('path'); // Node.js標準のモジュール
const app = express();
const port = process.env.PORT || 3000;

// 'public' フォルダを静的ファイルの配信フォルダとして設定
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');

const options = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  clearExpired: true,
  checkExpirationInterval: 900000,
};

const sessionStore = new MySQLStore(options);

function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    res.redirect('/login')
  }
}
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  store: sessionStore,

  resave: false,
  saveUninitialized: false,

  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: true,
    sameSite: 'lax'
  }
}));

app.post('/register', async (req, res) => {
  try {
    const { email, password, display_name } = req.body;

    const saltRounds = 10;

    const passwordHash = await bcrypt.hash(password, saltRounds);

    await pool.query(
      'INSERT INTO users (email, password_hash, display_name) VALUES (?, ?, ?)',
      [email, passwordHash, display_name]
    )

    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.redirect('/register');
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    )

    if(users.length === 0) {
      console.log('ユーザーが見つかりません');
      return res.redirect('/login');
    }

    const user = users[0];

    const match = await bcrypt.compare(password, user.passwordHash);

    if (match) {
      req.session.userId = user.id;
      req.session.display_name = user.display_name;
      req.session.icon_url = user.icon_url;

      res.redirect('/');
    } else {
      console.log('パスワードが違います');
      res.redirect('/login');
    }
  } catch (err) {
    console.error(err);
    res.redirect('/login');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect('/');
    }

    res.clearCookie('connect.sid');
    res.redirect('/login')
  })
})
app.get('/', isAuthenticated, (req, res) => {
  const currentUser ={
    display_name: req.session.display_name,
    icon_url: req.session.icon_url
  }
  res.render('index', {
    isLoggedIn: true,
    user:currentUser
  });
})
app.get('/login', (req, res) => {
  res.render('login', { 
    pageTitle: 'ログイン',
    isLoggedIn: false,
    user: null // ユーザー情報なし
  });
});

app.get('/signup', (req, res) => {
  res.render('signup', { 
    pageTitle: "サインアップ",
    isLoggedIn: false,
    user: null // ユーザー情報なし
  });
})

// サーバーを起動
app.listen(port, () => {
  console.log(`サーバーが http://localhost:${port} で起動しました`);
});