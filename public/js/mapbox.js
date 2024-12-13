import { saveUserLocation, getUserLocations, deleteUserLocation, deleteAllUserLocations } from './api.js'
import { displayToast } from './ui.js'

// mapbox module for interacting with the map
export async function initialiseMapBoxGL(mapCoords) {
    // weird hack to fix bug
    const navbar = $('nav.navbar');
    const navbarHeight = navbar.length ? navbar.outerHeight() : 0;
    document.documentElement.style.setProperty('--navbar-height', `${navbarHeight}px`);

    // access token for mapboxgl
    mapboxgl.accessToken = 'pk.eyJ1IjoiMHhyeWFuIiwiYSI6ImNtNGtjZWhkZTBueXUydnNmOGNwMThudjIifQ.odTEDav40cOS-UGLU_vo3w';

    // dark map style
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [-6.2602, 53.3496],
        zoom: 12
    });

    let marker = null;
    let popup = null;

    // add saved locations to the map using markers
    const userId = localStorage.getItem('userId');
    getUserLocations(userId, (error, response) => {
        if (error) {
            console.error('error getting saved locations:', error);
            return;
        }

        if (response.savedLocations && response.savedLocations.length > 0) {
            response.savedLocations.forEach(location => {
                new mapboxgl.Marker()
                    .setLngLat([location.lon, location.lat])
                    .addTo(map);
            });
        }
    });

    // right click event listener
    map.on('contextmenu', function (e) {
        // get coords of right click
        mapCoords = e.lngLat;

        // remove marker and popup
        if (marker) {
            marker.remove();
        }
        if (popup) {
            popup.remove();
        }

        // create custom popup
        popup = new mapboxgl.Popup({ offset: 25 })
            .setLngLat([mapCoords.lng, mapCoords.lat])
            .setHTML(`<b>Lat:</b> <b>${mapCoords.lat.toFixed(4)}</b><br><b>Lon:</b> <b>${mapCoords.lng.toFixed(4)}</b><br><button id="add-to-favourites" class="mt-3 btn btn-primary">Add to favourites</button>`)
            .addTo(map);
        });

        $(document).on('click', '#add-to-favourites', async function (e) {
            try {
                await Promise.all([
                    saveUserLocation(mapCoords),
                ]);

                new mapboxgl.Marker()
                    .setLngLat([mapCoords.lng, mapCoords.lat])
                    .addTo(map);
                
            } catch (error) {
                displayToast("error saving user locations", 3000);
            }

        });

    // this is so broken, if i location.refresh the js and css breaks
    $(document).on('click', '#delete-all-location', function (e) {
        deleteAllUserLocations();
    });

    return map;
}

// function to focus map to a location based on a lat and a lon, zoom is 14 by default
export function focusMapOnLocation(map, lon, lat, zoom = 14) {
    // should have the flyTo function
    if (!map || typeof map.flyTo !== 'function') {
        console.error('invalid mapboxgl instance');
        return;
    }

    try {
        map.flyTo({
            center: [lon, lat],
            zoom: zoom,
            essential: true 
        });

        new mapboxgl.Marker()
            .setLngLat([lon, lat])
            .addTo(map);
    } catch (error) {
        console.error('error focusing map on location:', error);
    }
}
