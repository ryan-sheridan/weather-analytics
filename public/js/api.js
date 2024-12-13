
// SECTION: user location/information handling

// TODO: re comment comments so they make sense with current code

import { displayToast } from './ui.js';
import { focusMapOnLocation } from './mapbox.js'; 

// client side request to get user locations from server
export function getUserLocations(userId, callback) {
    $.ajax({
        url: '/user/saved-locations',
        type: 'GET',
        data: { userId },
        success: function (response) {
            // this originally was in two seperate ajax requests
            // a problem occured that the data being sent (newSavedLocations) was being truncated when printed
            // on the server side, i questioned why for about an hour, realising that its got to do with
            // javascript synchronicity. 

            // we got the saved locations, but when the second post request was sent, it was sent immediatly, before
            // it could read newSavedLocations which had the appended response of the first request

            // to fix this, the post request is nested within the get request, the post request only posts once the get
            // request has been successfull and fullSavedLocations has been constructed
            callback(null, response);
        },
        error: function (error) {
            callback(error, null);
        }
    });
}

// get the savedLocationBlocks
export function getWeatherBlocks(map) {
    // promise was an attempt to solve an issue where i cannot call this function twice
    // tought it might be a concurrency issue, i dont know what it is, but im not touching it because
    // the function still does what its supposed to
    return new Promise((resolve, reject) => {
        // request the savedLocationBlock ejs, or html, whatever
        $.ajax({
            url: '/partial/saved-location-weather',
            type: 'GET',
            success: function (response) {
                // put the response in this container that is within info-panel
                $('.saved-weather-block-container').html(response);
                
                // bind each button in the savedLocationBlocks to an event
                bindSavedLocationEvents(map);

                // promise resolve
                resolve();
            },
            error: function (error) {
                console.error(error);
                displayToast("err: could not get weather html blocks", 3000);
                reject();
            }
        });
    });
}

// binds each button to an event within the info panel, called after savedLocationBlocks are recieved
function bindSavedLocationEvents(map) {
    $('.saved-location-container').off('click').on('click', function () {
        // collapse/uncollapse on click
        const deleteOrAnalyse = $(this).next('.delete-or-analyse');
        $(this).toggleClass('collapsed');
        deleteOrAnalyse.toggleClass('collapsed');
    });

    // secondary buttons will delete user location for the index defined in data-index
    $('.analyse-btn.btn-secondary').off('click').on('click', function () {
        // each savedLocationBlock is made of two parts 
        const siblingCollapseContainer = $(this).closest('.delete-or-analyse');
        const parentContainer = siblingCollapseContainer.prev('.saved-location-container');
        const dataIndex = parentContainer.data('index');

        // the index starts at 1, so -1
        deleteUserLocation(dataIndex - 1);
        // remove the container when deleted
        parentContainer.remove();
        // remove the sibling container as its made of two parts
        siblingCollapseContainer.remove();
    });

    // success button goes to a location on the map
    $('.analyse-btn.btn-success').off('click').on('click', function () {
        // grab the parent container, grab the data-lat data-lon
        const parentContainer = $(this).closest('.delete-or-analyse').prev('.saved-location-container');
        const lat = parentContainer.data('lat');
        const lon = parentContainer.data('lon');
        // move map to that location
        focusMapOnLocation(map, lon, lat);
    });

    // primary button will direct the user to the analyse page with graph.js graphs
    $('.analyse-btn.btn-primary').off('click').on('click', function () {
        // grab the parent container
        const siblingCollapseContainer = $(this).closest('.delete-or-analyse');
        const parentContainer = siblingCollapseContainer.prev('.saved-location-container');
        
        // get data-lat data-lon
        const lat = parentContainer.data('lat');
        const lon = parentContainer.data('lon');

        // redirect to this path, with lat and lon and query params
        location.href = `/analyse/location?lat=${lat}&lon=${lon}`;
    });
}

// deletes a user location by index
export function deleteUserLocation(index) {
    // the userId is stored in localStorage for ease of use
    const userId = localStorage.getItem('userId');

    // grab each location for that user, this is done through the authorization token
    getUserLocations(userId, (error, response) => {
        if (error) {
            console.error('error getting saved locations:', error);
            displayToast("failed to get saved locations", 3000);
            return;
        }

        // if the saved locations exist
        if (response.savedLocations && response.savedLocations.length > index) {
            // trick to remove the location at the specified index
            const updatedSavedLocations = response.savedLocations.filter((_, i) => i !== index);

            // new locations without the one we deleted
            const updatedLocationsObject = {
                savedLocations: updatedSavedLocations
            };

            // send a post request to update user locations
            $.ajax({
                url: '/user/add-saved-locations',
                type: 'POST',
                contentType: 'application/json',
                // send along the user id with the new updated locations, this will be validated by the authorization token to make sure we 
                // are not editing another users saved locations
                data: JSON.stringify({
                    userId,
                    info: updatedLocationsObject
                }),
                success: function () {
                    // on success, display a toast/snackbar
                    console.log('deleted location at index:', index);
                    displayToast("location deleted successfully", 3000);
                },
                error: function (xhr, status, error) {
                    // debug if an error occurs
                    console.error('err deleting location:', error);
                    console.log('xhr status:', status);
                    console.log('full xhr response:', xhr.responseText);
                }
            });
        } else {
            // debug
            displayToast("invalid index", 3000);
        }
    });
}

// delete all user locations
export function deleteAllUserLocations() {
    // grab the userId of the logged in user, saved in localStorage
    const userId = localStorage.getItem('userId');

    const updatedLocationsObject = {
        savedLocations: []
    };

    $.ajax({
        url: '/user/add-saved-locations',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            userId,
            info: updatedLocationsObject
        }),
        success: function () {
            console.log('deleted all saved locations');
            displayToast("all locations deleted successfully", 3000);
        },
        error: function (xhr, status, error) {
            console.error('err deleting all locations:', error);
            console.log('xhr status:', status);
            console.log('full xhr response:', xhr.responseText);
        }
    });
}

export async function saveUserLocation(mapCoords) {
    return new Promise((resolve, reject) => {
        const userId = localStorage.getItem('userId');
                    
        // everytime add to favourites is clicked, we add 1 new location
        const newSavedLocations = {
            savedLocations: [
                {
                    lat: mapCoords.lat,
                    lon: mapCoords.lng
                }
            ]
        };

        // we need to grab the user locations that already exist, and append the response onto new saved locations
        getUserLocations(userId, (error, response) => {
            if (error) {
                console.error('error getting saved locations:', error);
                throw new Error('error getting saved locations');
            }

            if (response.savedLocations && response.savedLocations.length > 0) {
                newSavedLocations.savedLocations = [
                    ...newSavedLocations.savedLocations,
                    ...response.savedLocations
                ];
            }

            const fullSavedLocations = {
                savedLocations: newSavedLocations.savedLocations
            };

            // second ajax call only happens when we have fullSavedLocations, this is why its nested within the success
            $.ajax({
                // send the userId and fullSavedLocations to /user/add-saved-locations
                url: '/user/add-saved-locations',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    userId,
                    info: fullSavedLocations
                }),
                success: function (response) {
                    // the new savedLocations have been successfully sent to the server
                    console.log('sent savedLocations:', fullSavedLocations);
                    displayToast("User location saved!", 3000);
                    resolve();
                },
                error: function(xhr, status, error) {
                    // print everything incase of an error
                    console.error('err sending locations:', error);
                    console.log('xhr status:', status);
                    console.log('full xhr response:', xhr.responseText);
                    throw new Error('error saving new locations');
                    reject();
                }
            });
        });
    });
}

// SECTION_END: user location/information handling