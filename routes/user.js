// the user route uses express
const express = require('express');
const router = express.Router();
// we need all user CRUD operations here
const { createUser, loginUser, updateSavedLocations, getSavedLocations, deleteUser, editUser } = require('../services/userService');
// we need to validate the cookie for some requests
const authenticateCookie = require('../middleware/authenticateCookie');

// RESEARCH: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#successful_responses

// endpoint for /user/register, will sign the user up using a username, email, password and optional account info 
// (optional account info not implemented)
router.post('/register', async (req, res) => {
    const { username, email, password, info } = req.body;

    // if username, email or password do not exist
    if (!username || !email || !password) {
        // status 400 is bad request
        return res.status(400).json({ error: 'username, email, and password are required to register!' });
    }

    // try to create a new user
    try {
        // status 201 is creation successful
        const newUser = await createUser(username, email, password, info);
        res.status(201).json({ message: 'user created successfully', user: newUser });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
});

// endpoint for logging in, will recieve a username/email and a password
// we need to hash the password and compare it with the hash in our users.json
router.post('/login', async (req, res) => {
    // take username/email and password from the body of the post request
    const { usernameOrEmail, password } = req.body;

    // if the username/email or password do not exist, respond status 400 bad request
    if(!usernameOrEmail || !password) {
        return res.status(400).json({ error: 'username/email and password are required to login!' })
    }

    // this is strange as originally on the client the authorization bearer was ment to be stored in localStorage
    // but this means that every request sent to an end point i would have to manually attach the authorization bearer 

    // also when the user browses the site using anchor tags, i cannot attach headers to the request, im sure theres some 
    // security reasons behind this 

    // so we just return a set-cookie header which will allow the browser to set the cookie, this cannot be accessed by javascript

    // for some odd reason, this will not work on mobile, i have tried intercepting the requests and seeing if the cookie is being 
    // sent from mobile but to no avail, had some weird issues with jquery, anyways this is out of scope so not to worry
    try {
        // return a cookie for a new user login
        // the cookie can then be used to access the users information
        const { token, user } = await loginUser(usernameOrEmail, password);
        
        // set the set-cookie of the response
        res.cookie('authToken', token, {
            httpOnly: true, // js should not be able to access the cookie
            secure: true, // sure
            sameSite: 'Strict', // can only be used on this site
            maxAge: 24 * 60 * 60 * 1000 // 1 day expiration
        });

        // 200 means OK
        res.status(200).json({ message: 'login successful', userId: user.id });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
});

// endpoint to update saved locations for a user, takes a userId and information in the request body
// the function uses middleware, which will authenticate the cookie before hand and will set the req.user
// variable, we can then check if req.user.id == userId to see if the user is trying to edit someone elses profile
router.post('/add-saved-locations', authenticateCookie, async (req, res) => {
    const { userId, info } = req.body;

    // users should only be able to edit their own user info
    if(req.user.id != userId) {
        return res.status(401).json({ error: 'you can only update the info of your own account!' });
    }

    // userId or info does not exist
    if(!userId || !info) {
        return res.status(400).json({ error: 'userId and info are required to update user info! ' });
    }

    // updateSavedLocations will return the user, for debug purposes
    try {
        const user = await updateSavedLocations(userId, info);
        res.json({ message: 'user info updated successfully', user});
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
});

router.post('/edit', authenticateCookie, async (req, res) => {
    const userId = req.user.id;
    const { username, email } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'userId is required to edit info' });
    }

    try {
        const { updatedUser, token } = await editUser(userId, username, email);

        // update the cookie to use the new token, which contains our new username and or email
        res.cookie('authToken', token, {
            httpOnly: true, 
            secure: true,
            sameSite: 'Strict',
            maxAge: 24 * 60 * 60 * 1000
        });

        res.status(200).json({ message: 'user updated successfully', user: updatedUser });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
});

// gets the saved locations for a user, any user should be able to access any other users saved locations
// so no middleware authenticateCookie here
router.get('/saved-locations', async (req, res) => {
    // no token validation here, users should be able to get other users saved locations
    const { userId } = req.query;

    // if the user id does not exist, respond with a status 401, unauthorized
    if(!userId) {
        return res.status(401).json({ error: 'you need to provide userId to access saved locations!' });
    }

    // respond with saved locations
    try {
        const savedLocations = await getSavedLocations(userId);
        res.json({ savedLocations: savedLocations });
    } catch (error) {
        console.error(error);
        // 204 no content found
        res.status(204).json({ error: error.message });
    }
});

// any user can delete there own account, no userId is passed in the body here, since the cookie should
// contain the userId within it, so authenticate the cookie to make sure its not modified, then delete the user by the id in the cookie
router.get('/delete-account', authenticateCookie, async (req, res) => {
    try {
        const user = await deleteUser(req.user.id);
        res.json({ message: `user @${user.username} deleted successfully`});
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
});

router.get('/logout', authenticateCookie, async (req, res) => {
    res.cookie('authToken', '', { expires: new Date(0), httpOnly: true });
    res.status(200).json({ message: 'logged out' }); 
});

// debug
router.get('/', async (req, res) => {
    res.status(200).json({ message: 'user route is working' }); 
});

module.exports = router;