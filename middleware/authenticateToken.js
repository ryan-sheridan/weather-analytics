const jwt = require('jsonwebtoken');

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

module.exports = authenticateToken;