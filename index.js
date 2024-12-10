// required by weatherService
const dotenv = require('dotenv');
dotenv.config({ path: '.config' });
const authenticateToken = require('./middleware/authenticateToken');

// for localhost
const express = require("express");
app = express();

// import routes
const weatherRouter = require('./routes/weather')
const userRouter = require('./routes/user')

// middleware to parse json
app.use(express.json());

app.use('/weather', weatherRouter);
app.use('/user', userRouter);

app.get('/protected', authenticateToken, (req, res) => {
    res.json({ message: 'this is a protected route', user: req.user });
});

// will run on port defined in .config, if not defined it will run on 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});