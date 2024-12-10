const express = require('express');
const router = express.Router();
const { createUser, loginUser, updateUserInfo } = require('../services/userService');
const authenticateToken = require('../middleware/authenticateToken');

// RESEARCH: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#successful_responses

router.post('/register', async (req, res) => {
    const { username, email, password, userInfo } = req.body;

    // if username, email or password do not exist
    if (!username || !email || !password) {
        // status 400 is bad request
        return res.status(400).json({ error: 'username, email, and password are required to register!' });
    }

    // try to create a new user
    try {
        // status 201 is creation successful
        console.log(userInfo)
        const newUser = await createUser(username, email, password, userInfo);
        res.status(201).json({ message: 'user created successfully', user: newUser });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
});

router.post('/login', async (req, res) => {
    const { usernameOrEmail, password } = req.body;

    if(!usernameOrEmail || !password) {
        return res.status(400).json({ error: 'username/email and password are required to login!' })
    }

    try {
        // return a token for a new user login
        // the token can then be used to access the users information
        const token = await loginUser(usernameOrEmail, password);
        res.json({ message: 'login successful', token });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
});

router.post('/update', authenticateToken, async (req, res) => {
    const { userId, userInfo } = req.body;

    // users should only be able to edit their own user info
    if(req.user.id != userId) {
        return res.status(401).json({ error: 'not a chance :)' });
    }

    if(!userId || !userInfo) {
        return res.status(400).json({ error: 'userId and userInfo are required to update user info! ' });
    }

    try {
        const user = await updateUserInfo(userId, userInfo);
        res.json({ message: 'user info updated successfully', user});
    } catch {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
});

router.get('/', async (req, res) => {
    res.status(200).json({ message: 'user route is working' }); 
});

module.exports = router;