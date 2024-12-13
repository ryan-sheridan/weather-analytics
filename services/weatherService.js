// we require axios to send and recieve requests
const axios = require('axios')

// grab the weather token from the .config file
const WEATHER_TOKEN = process.env.WEATHER_TOKEN;

// take a lat and lon, return the city name
async function coordToCity({lat, lon}) {
    let url;

    // if lat and lon exist set the url, else throw an err
    if (lat && lon) {
        url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${WEATHER_TOKEN}`
    } else {
        throw new Error("you must provide a location or coordinates!");
    }

    // try to send request
    try {
        const response = await axios.get(url);

        // check if response name is availiable
        if (response.data && response.data.length > 0 && response.data[0].name) {
            return response.data[0].name; // return city name if so
        } else {
            console.warn(`No city name found for coordinates: Lat ${lat}, Lon ${lon}`);
            return "Unknown Location"; // fallback
        }
    } catch (error) {
        console.error('Error fetching city name:', error.message);
        return "Unknown Location"; // fallback on err
    }
}

// gets the 5 day forecast for a location, lat and lon
async function getForecast({ lat, lon }) {
    let url;

    // make sure lat and lon exist, if not throw an err
    if (lat && lon) {
        url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_TOKEN}`
    } else {
        throw new Error("you must provide a location or coordinates!");
    }

    // try to send a get request to url
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('err fetching forecast:', error.message);
        return "error fetching forecast";
    }
}

// gets the current weather for a location
async function getCurrentWeather({lat, lon}) {
    let url;

    if (lat && lon) {
        // if lon and lat are provided, use them
        url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&units=metric&lon=${lon}&appid=${WEATHER_TOKEN}`;
    } else {
        throw new Error("you must provide a location or coordinates!");
    }

    try {
        const response = await axios.get(url);
        return response.data; // Return real weather data if the request is successful
    } catch (error) {
        console.error("failed to fetch weather data:", error.message);

        return {
            coord: { lat, lon },
            weather: [
                {
                    id: 0,
                    main: "Fallback",
                    description: "0",
                    icon: "0",
                },
            ],
            main: {
                temp: 0.0, 
                feels_like: 0.0,
                temp_min: 0.0,
                temp_max: 0.0,
                pressure: 0,
                humidity: 0,
            },
            wind: {
                speed: 0,
                deg: 0,
            },
            clouds: {
                all: 0,
            },
            sys: {
                country: "0",
                sunrise: 0,
                sunset: 0, 
            },
            name: "0",
        }
    }
}

module.exports = {
    getCurrentWeather,
    coordToCity,
    getForecast
};