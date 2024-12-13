const express = require('express');
const router = express.Router();
const { getSavedLocations } = require('../services/userService');
const { coordToCity, getCurrentWeather, getForecast } = require('../services/weatherService');
const authenticateCookie = require('../middleware/authenticateCookie');

router.get('/location', authenticateCookie, async (req, res) => {
    try {
        const lat = req.query.lat;
        const lon = req.query.lon;

        const weatherForecast = await getForecast({lat, lon});

        res.render('analyse', { title: 'Home', profile: "disabled", user: req.user, forecast: weatherForecast.list });
    } catch (error) {
        console.error('err fetching saved locations or weather data:', error);
        res.status(500).send('internal server error');
    }
});

module.exports = router;