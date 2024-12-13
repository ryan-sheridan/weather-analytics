const fs = require('fs').promises;
// for hashing passwords
const bcrypt = require('bcrypt');
// for creating a session when logged in
const jwt = require('jsonwebtoken');
// for validating json schema
const Ajv = require('ajv');

const USERS_FILE = 'users.json';

// more salt rounds = more security
// more security = more computing power
const SALT_ROUNDS = 10;

// also something about security
const JWT_SECRET = process.env.JWT_SECRET;

// simple user class
class User {
    constructor(username, email, passwordHash, info) {
        this.id = Date.now();
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash
        this.info = info;
    }
}

// users should only able to save locations as favourites to user info
// {
//     "savedLocations": [
//         {
//             "lat": 53.3496,
//             "lon": -6.2602
//         },
//         {
//             "lat": 40.7128,
//             "lon": -74.0060
//         }
//     ]
// }
const infoSchema = {
    type: 'object',
    properties: {
        savedLocations: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    lat: { type: 'number' },
                    lon: { type: 'number' }
                },
                required: ['lat', 'lon']
            }
        }
    },
    required: ['savedLocations'],
    additionalProperties: false
};

// function to validate json with a json schema
function validateJson(schema, data) {
    const ajv = new Ajv();
    const validate = ajv.compile(schema);
    const valid = validate(data);

    if (!valid) {
        console.error('validation errors:', validate.errors);
        throw new Error('invalid json data');
    }

    console.log('json is valid');
}

// returns users from file
async function loadUsers() {
    try {
        const data = await fs.readFile(USERS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}

// saves users to file
async function saveUsers(users) {
    try {
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
    } catch (error) {
        throw new Error('failed to update users file');
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

function validateRegistration(username, email, password) {
    // SOURCE: https://stackoverflow.com/questions/201323/how-can-i-validate-an-email-address-using-a-regular-expression
    const emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)])/;

    if(!email.match(emailRegex)) {
        throw new Error('invalid email!');
    }

    // SOURCE: gpt
    // lowercase, alphanumeric, atleast 4 characters, and can contain - and _
    const usernameRegex = /^[a-z0-9_-]{4,}$/

    if(!username.match(usernameRegex)) {
        throw new Error('invalid username!');
    }

    // SOURCE ORIG: https://stackoverflow.com/questions/19605150/regex-for-password-must-contain-at-least-eight-characters-at-least-one-number-a
    const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;

    if(!password.match(passwordRegex)) {
        throw new Error('invalid password!');
    }
}

// creates a user object, appends to existing or newly created .json file
async function createUser(username, email, password, info) {

    try {
        validateRegistration(username, email, password);
    } catch (error) {
        console.error(error);
        throw new Error('error validating user registration input!');
    }

    // hash the password, salt the hash a number of times
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    info = { "savedLocations": [] };

    // create a new user object with name, email, passwordHash and optional info
    const user = new User(username, email, passwordHash, info);

    // grab users from file
    const users = await loadUsers();

    // check if the user already exists
    // RESEARCH: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some
    if(users.some(u => u.username === username || u.email === email)) {
        throw new Error('username or email already exists!');
    }

    // add the new user into the array
    users.push(user);

    // save new users to file
    await saveUsers(users);
    console.log(`User ${username} has been created and saved to users.json`);

    // return the newly created user
    return { id: user.id, username: user.username, email: user.email };
}

// query can be either id, email or username
async function getUser(query) {
    const users = await loadUsers();

    // RESEARCH: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
    if (query.id) {
        // if the id is found in users, return user, else return null
        const user = users.find(u => u.id == query.id);
        return user || null;
    } 
    
    if (query.username) {
        const user = users.find(u => u.username === query.username);
        return user || null;
    }

    if (query.email) {
        const user = users.find(u => u.email === query.email);
        return user || null;
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

    console.log('generating token');

    // since the password check passed, we can create a token and pass it to the user
    const token = jwt.sign(
        // RESEARCH: https://stackoverflow.com/questions/56855440/in-jwt-the-sign-method
        { id: user.id, username: user.username, email: user.email },
        JWT_SECRET,
        { expiresIn: '24h' }
    );

    // return the token once generated
    return { token, user };
}

async function updateSavedLocations(userId, newinfo) {
    try { 
        validateJson(infoSchema, newinfo)
    } catch (error) {
        console.error(error);
        throw new Error('validation for info failed')
    }
    
    const users = await loadUsers();

    // grab the user by id
    const userIndex = users.findIndex(u => u.id == userId);
    if (userIndex === -1) {
        throw new Error('user not found');
    }

    // update user info
    // RESEARCH: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax
    const user = users[userIndex];
    
    user.info = { ...user.info, ...newinfo }; // to merge existing and new info

    await saveUsers(users);
    console.log(`user info updated for user id: ${userId}`);

    // return updated user
    return { id: user.id, info: user.info };
}

// grab saved locations for a user
async function getSavedLocations(userId) {
    const user = await getUser({ id: userId });
    return user.info.savedLocations;
}

async function editUser(userId, newUsername, newEmail) {
    const users = await loadUsers();

    // grab user by id
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        throw new Error('user not found');
    }

    // validate
    if (newUsername) {
        const usernameRegex = /^[a-z0-9_-]{4,}$/;
        if (!newUsername.match(usernameRegex)) {
            throw new Error('invalid username!');
        }

        // check for duplicate
        if (users.some(u => u.username === newUsername && u.id !== userId)) {
            throw new Error('username already exists!');
        }
    }

    // validate
    if (newEmail) {
        const emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)])/;
        if (!newEmail.match(emailRegex)) {
            throw new Error('invalid email!');
        }

        // check for duplicate
        if (users.some(u => u.email === newEmail && u.id !== userId)) {
            throw new Error('email already exists!');
        }
    }

    // update user details
    const user = users[userIndex];
    if (newUsername) user.username = newUsername;
    if (newEmail) user.email = newEmail;

    // save to file
    await saveUsers(users);

    const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email },
        JWT_SECRET,
        { expiresIn: '24h' }
    );

    console.log(`user with id ${userId} updated`);

    return { user: { id: user.id, username: user.username, email: user.email }, token };
}


// delete a user by an id
async function deleteUser(userId) {
    const users = await loadUsers();

    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        throw new Error('user not found');
    }

    // remove number of elements starting from an index
    // remove 1 element from users at userIndex
    // .spice() returns an array, [0] accesses the first and only element of that array
    const user = users.splice(userIndex, 1)[0];

    try {
        // null means no transformation, 2 means the level of indentation
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
    } catch (error) {
        throw new Error('failed to update users file');
    }

    return { id: user.id, username: user.username, email: user.email };
}

module.exports = { createUser, loginUser, updateSavedLocations, getSavedLocations, deleteUser, editUser };