const axios = require('axios')

const WEATHER_TOKEN = process.env.WEATHER_TOKEN;

// gets the current weather for a location
async function getCurrentWeather({lat, lon}) {
    let url;

    if (lat && lon) {
        // if lon and lat are provided, use them
        url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_TOKEN}`;
    } else {
        throw new Error("you must provide a location or coordinates!");
    }

    const response = await axios.get(url);
    return response.data;
}

module.exports = {
    getCurrentWeather,
};