const express = require('express');
const router = express.Router();
const db = require('../db');
const messages = require('../config/message');

router.post('/', async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await sessionStore.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if(users.length === 0) {
      res.status(401).json({
        user: null,
        error: messages.AUTH.AUTH_FAILED
      });
    }

    // if(users.length === 0) {
    //   res.render('signin', { 
    //     pageTitle: 'ログイン',
    //     isLoggedIn: false,
    //     user: null, // ユーザー情報なし,
    //     error: messages.AUTH.AUTH_FAILED
    //   });
    // }

    const user = users[0];

    const match = await bcrypt.compare(password, user.password_hash);
    if (match) {
      req.session.userName = user.user_name;
      req.session.display_name = user.display_name;
      req.session.icon_url = user.icon_url;
      req.session.userUuid = user.user_uuid;
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
module.exports = router;