require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const messages = require('./config/message');
const path = require('path'); // Node.js標準のモジュール
const { upload, uploadIconToMinio } = require('./config/iconUpload');
const app = express();
const port = process.env.PORT || 3000;
const router = require('./routes/profileRoutes');

// 'public' フォルダを静的ファイルの配信フォルダとして設定
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');

const options = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  clearExpired: true,
  checkExpirationInterval: 900000,
};

const sessionStore = new MySQLStore(options);

function isAuthenticated(req, res, next) {
  if (req.session.display_name) {
    next();
  } else {
    res.redirect('/signin')
  }
}

app.use(express.urlencoded({ extended: false }));
app.use('/api/profile', router);
app.set('trust proxy', 1);
app.use(session({
  secret: process.env.SESSION_SECRET,
  store: sessionStore,

  resave: false,
  saveUninitialized: false,

  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'prod',
    sameSite: 'lax'
  }
}));

app.post(
  '/register',
  upload.single('iconFile'),
  uploadIconToMinio,
  async (req, res, next) => {
    try {
      const { email, password, displayName, userName, iconUrl } = req.body;

      const saltRounds = 10;

      const passwordHash = await bcrypt.hash(password, saltRounds);

      await sessionStore.query(
        'INSERT INTO users (email, password_hash, display_name, user_name, icon_url) VALUES (?, ?, ?, ?, ?)',
        [email, passwordHash, displayName, userName, iconUrl || null ]
      );

      res.redirect('/signin');
    } catch (err) {
      console.error(err);
      next(err);
    }
  }
);

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await sessionStore.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    )

    if(users.length === 0) {
      res.render('signin', { 
        pageTitle: 'ログイン',
        isLoggedIn: false,
        user: null, // ユーザー情報なし,
        error: messages.AUTH.AUTH_FAILED
      });
    }

    const user = users[0];

    const match = await bcrypt.compare(password, user.password_hash);
    if (match) {
      req.session.userName = user.user_name;
      req.session.display_name = user.display_name;
      req.session.icon_url = user.icon_url;
      console.log(user.display_name);

      res.redirect('/');
    } else {
      res.render('signin', { 
        pageTitle: 'ログイン',
        isLoggedIn: false,
        user: null, // ユーザー情報なし,
        error: messages.AUTH.AUTH_FAILED
      });
    }
  } catch (err) {
    res.render('signin', { 
      pageTitle: 'ログイン',
      isLoggedIn: false,
      user: null, // ユーザー情報なし,
      // error: messages.AUTH.LOGIN_PROCESS_ERROR
      error: err
    });
  }
});
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect('/');
    }

    res.clearCookie('connect.sid');
    res.redirect('/signin')
  })
})
app.get('/', isAuthenticated, (req, res) => {
  res.render('index', {
    isLoggedIn: true,
    user: {
      display_name: req.session.display_name,
      icon_url: req.session.icon_url,
    }
  });
})
app.get('/signin', (req, res) => {
  res.render('signin', { 
    pageTitle: 'ログイン',
    isLoggedIn: false,
    user: null, // ユーザー情報なし
    error: null
  });
});

app.get('/profile/edit', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userName;

    const [accountInfo] = await sessionStore.query(
      `
      SELECT
        email,
        user_name,
        display_name,
        icon_url
      FROM users
      WHERE user_name = ?
      `,
      [userId]
    );

    if (accountInfo.length === 0) {
      return res.redirect('/');
    }

    const userData = accountInfo[0];

    res.render('profile', {
      pageTitle: 'ユーザー情報',
      isLoggedIn: true,
      user: {
        email: userData.email,
        user_name: userData.user_name,
        display_name: userData.display_name,
        icon_url: userData.icon_url
      },
      error: null
    })
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});

app.get('/signup', (req, res) => {
  res.render('signup', { 
    pageTitle: "サインアップ",
    isLoggedIn: false,
    user: null, // ユーザー情報なし
    error: null
  });
})

app.use((err, req, res, next) => {
  console.error(err);

  res.render('signup', {
    pageTitle: "サインアップ",
    isLoggedIn: false,
    user: null,
    error: err.message
  });
});

// サーバーを起動
app.listen(port, () => {
  console.log(`サーバーが http://localhost:${port} で起動しました`);
});