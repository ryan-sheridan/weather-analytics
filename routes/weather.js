const express = require('express');
const router = express.Router();
const { getCurrentWeather, coordToCity, getForecast } = require('../services/weatherService');
const { error } = require('ajv/dist/vocabularies/applicator/dependencies');

router.get('/reverse', async (req, res) => {
    try {
        const lon = parseFloat(req.query.lon);
        const lat = parseFloat(req.query.lat);
        let locationData;

        if (!isNaN(lon) && !isNaN(lat)) {
            locationData = await coordToCity({ lat: lat, lon: lon });
        } else {
            return res.status(400).send('lat and/or lon are not valid numbers!');
        }
        
        res.json(locationData);
    } catch (error) {
        console.error(error);
        res.status(500).send('error getting city for lon and lat');
    }
});

router.get('/forecast', async (req, res) => {
    try {
        const lon = parseFloat(req.query.lon);
        const lat = parseFloat(req.query.lat);
        let forecast;

        if (!isNaN(lon) && !isNaN(lat)) {
            forecast = await getForecast({ lat: lat, lon: lon });
        } else {
            return res.status(400).send('lat and/or lon are not valid numbers!');
        }

        res.json(forecast);
    } catch (error) {
        console.error(error);
        res.status(500).send('error getting forecast');
    }
});

// define route to return current weather data
router.get('/current', async (req, res) => {
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
