// required by weatherService
const dotenv = require('dotenv');
dotenv.config({ path: '.config' });
const authenticateCookie = require('./middleware/authenticateCookie');
const path = require('path');
const engine = require('ejs-mate');
const cookieParser = require('cookie-parser');

// for localhost
const express = require("express");
app = express();

// cookie parsing for jwt token
app.use(cookieParser());

// import routes
const partialRouter = require('./routes/partials')
const weatherRouter = require('./routes/weather')
const analyseRouter = require('./routes/analyse')
const userRouter = require('./routes/user')

// middleware to parse json
app.use(express.json());

app.use('/partial', partialRouter);
app.use('/weather', weatherRouter);
app.use('/analyse', analyseRouter);
app.use('/user', userRouter);

// ejs
app.engine('ejs', engine);
app.set('view engine', 'ejs');

// for client side styles and js
app.use('/public', express.static(path.join(__dirname, 'public')));

// set the views directory
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
    authenticateCookie(req, res, (err) => {
        if (err) {
            // user is not logged in
            res.render('index', { title: 'Home', profile: "disabled", user: req.user });
        }
    });
    // user is logged in, profile link should be enabled
    res.render('index', { title: 'Home', profile: "enabled", user: req.user });
});

app.get('/login', (req, res) => {
    authenticateCookie(req, res, (err) => {
        if (err) {
            // user is not logged in
            res.render('login', { title: 'Login', profile: "disabled" });
        }
    });
    // user is logged in, profile link should be enabled
    res.render('login', { title: 'Login', profile: "enabled" });
});

app.get('/register', (req, res) => {
    authenticateCookie(req, res, (err) => {
        if (err) {
            // user is not logged in
            res.render('register', { title: 'Register', profile: "disabled" });
        }
    });
    // user is logged in, profile link should be enabled
    res.render('register', { title: 'Register', profile: "enabled" });
});

app.get('/profile', (req, res) => {
    authenticateCookie(req, res, (err) => {
        if (err) {
            res.render('profile', { title: 'Profile', user: req.user, profile: "disabled" });
        }
    });
    res.render('profile', { title: 'Profile', user: req.user, profile: "enabled" });
});

app.get('/weather', (req, res) => {
    authenticateCookie(req, res, (err) => {
        if (err) {
            res.render('login', { title: 'Login', profile: "enabled" });
        }
    });
    res.render('weather', { title: 'Weather', user: req.user, profile: "enabled" });
});

// will run on port defined in .config, if not defined it will run on 3000
const PORT = process.env.PORT || 3000;
const HOST = 'localhost';

app.listen(PORT, HOST, () => {
    console.log(`Server is running on port ${PORT}`);
});