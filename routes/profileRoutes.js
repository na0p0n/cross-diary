const express = require('express');
const router = express.Router();
const db = require('../db');
const messages = require('../config/message');

router.post('/edit/username', async (req, res) => {
    const currentUserName = req.body.currentValue;
    const newUserName = req.body.updateValue;
    const uuid = req.body.userUuid;
    console.log(currentUserName);
    console.log(newUserName);

    try {
        await db.execute(
            'UPDATE users SET user_name = ? WHERE user_name = ? AND user_uuid = ?',
            [newUserName, currentUserName, uuid]
        );

        res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: messages.SQL_ERROR.ER_DUP_USERNAME });
    }
});
router.post('/edit/email', async (req, res) => {
    const currentEmail = req.body.currentValue;
    const newEmail = req.body.updateValue;
    const uuid = req.body.userUuid;

    try {
        await db.execute(
            'UPDATE users SET email = ? WHERE email = ? AND user_uuid = ?',
            [newEmail, currentEmail, uuid]
        );

        res.status(200).json({ success: true });
    } catch (error) {
        //console.error(error);
        res.status(500).json({ success: false, error: messages.SQL_ERROR.ER_DUP_EMAIL });
    }
})
router.post('/edit/displayname', async (req, res) => {
    const currentDisplayName = req.body.currentValue;
    const newDisplayName = req.body.updateValue;
    const uuid = req.body.userUuid;

    try {
        await db.execute(
            'UPDATE users SET display_name = ? WHERE display_name = ? AND user_uuid = ?',
            [newDisplayName, currentDisplayName, uuid]
        );

        res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false });
    }
});

module.exports = router;