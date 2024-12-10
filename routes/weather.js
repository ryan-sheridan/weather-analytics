const express = require('express');
const router = express.Router();
const { getCurrentWeather } = require('../services/weatherService');

// define route to return current weather data
router.get('/', async (req, res) => {
    try {
        const lon = parseFloat(req.query.lon);
        const lat = parseFloat(req.query.lat);
        let weatherData;

        if (!isNaN(lon) && !isNaN(lat)) {
            // if both lon and lat are numbers
            weatherData = await getCurrentWeather({ lat: lat, lon: lon });
        } else {
            return new Error('cannot fetch weather data, lat and or lon are not valid numbers!');
        }

        res.json(weatherData);
    } catch (error) {
        console.error(error);
        res.status(500).send('error fetching weather data');
    }
});

module.exports = router;
