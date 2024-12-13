const express = require('express');
const router = express.Router();
const { getSavedLocations } = require('../services/userService');
const { coordToCity, getCurrentWeather } = require('../services/weatherService');
const authenticateCookie = require('../middleware/authenticateCookie');

router.get('/saved-location-weather', authenticateCookie, async (req, res) => {
    try {
        const userId = req.user.id;
        const savedLocations = await getSavedLocations(userId);

        console.log(savedLocations);

        let index = 0;

        // fetch weather based on locations
        const locationsWithWeather = await Promise.all(

            savedLocations.map(async (location) => {
                const cityName = await coordToCity({ lat: location.lat, lon: location.lon });
                const weather = await getCurrentWeather({ lat: location.lat, lon: location.lon });

                // THANKS gpt
                const weatherIcons = {
                    "Clear": "fa-sun",
                    "Clouds": "fa-cloud",
                    "Rain": "fa-cloud-showers-heavy",
                    "Snow": "fa-snowflake",
                    "Drizzle": "fa-cloud-rain",
                    "Thunderstorm": "fa-bolt",
                    "Mist": "fa-smog",
                    "Fog": "fa-smog",
                    "Smoke": "fa-smog",
                    "Haze": "fa-smog",
                    "Dust": "fa-smog",
                    "Sand": "fa-smog",
                    "Ash": "fa-smog",
                    "Squall": "fa-wind",
                    "Tornado": "fa-wind",
                };

                const fontAwesomeIcon = weatherIcons[weather.weather[0].main] || "fa-question-circle";
                
                const currentIndex = index;
                index += 1;

                return {
                    index: index,
                    ...location,
                    cityName: cityName,
                    weather: {
                        ...weather,
                        fontAwesomeIcon,
                    },
                };
            })
        );
        // render ejs with data
        res.render('partials/savedLocationBlock', { locations: locationsWithWeather });
    } catch (error) {
        console.error('err fetching saved locations or weather data:', error);
        res.status(500).send('internal server error');
    }
});

module.exports = router;