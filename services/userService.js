const fs = require('fs').promises;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const USERS_FILE = 'users.json';

// more salt rounds = more security
// more security = more computing power
const SALT_ROUNDS = 10;

// also something about security
const JWT_SECRET = process.env.JWT_SECRET;

// simple user class
class User {
    constructor(username, email, passwordHash, userInfo) {
        this.id = Date.now();
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash
        this.userInfo = userInfo;
    }
}

function authenticateToken(req, res, next) {
    // extract token from the request header 
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // i should do oneliners more often
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error(err);
            return res.sendStatus(403); // invalid token
        }
        req.user = user;
        next();
    });
}

// creates a user object, appends to existing or newly created .json file
async function createUser(username, email, password, userInfo) {
    // hash the password, salt the hash a number of times
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = new User(username, email, passwordHash, userInfo);

    let users = [];
    try {
        // load existing users file
        const data = await fs.readFile(USERS_FILE, 'utf-8');
        users = JSON.parse(data);
    } catch (error) {
        // ignore the file not found error
        if (error.code !== 'ENOENT') {
            throw error;
        }
        // start with empty array if we cannot load the file
        users = [];
    }

    // check if the user already exists
    // RESEARCH: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some
    if(users.some(u => u.username === username || u.email === email)) {
        throw new Error('username or email already exists!');
    }

    // add the new user into the array
    users.push(user);

    // users array back to file
    await fs.writeFile('users.json', JSON.stringify(users, null, 2));

    console.log(`User ${username} has been created and saved to users.json`);

    // return the newly created user
    return { id: user.id, username: user.username, email: user.email };
}

async function getUser(query) {
    // since we have a id, username and email associated with a user
    // a query can contain any one of these
    let users = [];

    try {
        const data = await fs.readFile(USERS_FILE, 'utf-8');
        users = JSON.parse(data);
    } catch (error) {
        if(error.code === 'ENOENT') {
            return null; // no users.json file exists
        }
        throw error;
    }

    // RESEARCH: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
    if (query.id) {
        // if the id is found in users, return user, else return null
        return users.find(u => u.id === query.id) || null;
    } 
    
    if (query.username) {
        return users.find(u => u.username === query.username) || null;
    }

    if (query.email) {
        return users.find(u => u.email === query.email) || null;
    }

    // if all fails
    throw new Error('invalid query parameters');
}

async function loginUser(usernameOrEmail, password) {
    // find the user in the users file
    let user = await getUser({ username: usernameOrEmail });
    if(!user) {
        user = await getUser({ email: usernameOrEmail });
    }

    if(!user) {
        throw new Error('user not found');
    }

    // with the user, we need to compare the hash of the password with the users hashed password
    // RESEARCH: https://stackoverflow.com/questions/40076638/compare-passwords-bcryptjs
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if(!isMatch) {
        // password is incorrect
        throw new Error('invalid password!');
    }

    // since the password check passed, we can create a token and pass it to the user
    const token = jwt.sign(
        // RESEARCH: https://stackoverflow.com/questions/56855440/in-jwt-the-sign-method
        { id: user.id, username: user.username, email: user.email },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    // return the token once generated
    return token;
}

async function updateUserInfo(userId, newUserInfo) {
    // load all users from users file
    let users = [];
    try {
        const data = await fs.readFile(USERS_FILE, 'utf-8');
        users = JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            throw new Error('No users file found');
        }
        throw error;
    }

    // grab the user by id
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        throw new Error('user not found');
    }

    // update user userInfo
    // RESEARCH: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax
    const user = users[userIndex];
    user.userInfo = { ...user.userInfo, ...newUserInfo }; // to merge existing and new userInfo

    // save the updated users array into users.json
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));

    console.log(`User info updated for user ID: ${userId}`);

    // return updated user
    return user;
}

module.exports = { createUser, loginUser, updateUserInfo };