// this is a mess
import { initialiseMapBoxGL, focusMapOnLocation } from './mapbox.js'
import { displayToast } from './ui.js'
import { getWeatherBlocks } from './api.js';

// global mapCoords
let mapCoords = null;

// debug
if (typeof $ === 'undefined') {
    console.error('jQuery is not loaded!');
}

// global map
let map = null;

// when jquery is loaded
$(document).ready(async function () {
    // if we are on the weather page
    if(window.location.pathname === '/weather') {
        // init the map
        map = await initialiseMapBoxGL(mapCoords);

        // display a toast message saying welcome to the weather map, for 3 seconds
        displayToast("Welcome to the weather map!", 3000);

        // get the savedLocationBlocks
        getWeatherBlocks(map);
    }

    // simple refresh when user wants to view new locations, because again, i cannot call getWeatherBlocks twice and i dont know why
    $('.refresh').on('click', function (e) { 
        history.go(0);
    });

    $('.logout').on('click', function (e) { 
        e.preventDefault();
        localStorage.clear();

        $.ajax({
            url: '/user/logout',
            type: 'GET',
            contentType: 'application/json',
            success: function (response) {
                location.href = '/';
            },
            error: function (error) {
                alert(error);
            }
        });
    });

    $('.delete-account').on('click', function (e) { 
        e.preventDefault();
        $.ajax({
            url: '/user/delete-account',
            type: 'GET',
            contentType: 'application/json',
            success: function (response) {
                // clear cookie after delete account 
                // not so DRY
                localStorage.clear();

                $.ajax({
                    url: '/user/logout',
                    type: 'GET',
                    contentType: 'application/json',
                    success: function (response) {
                        location.href = '/';
                    },
                    error: function (error) {
                        alert(error);
                    }
                });

            },
            error: function (error) {
                alert(error);
            }
        });
    });

    //
    $('.edit-profile').on('click', function (e) { 
        e.preventDefault();

        const email = $('#email').val();
        const username = $('#username').val();

        $.ajax({
            url: '/user/edit',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ username, email }),
            success: function (response) {
                location.href = '/';
            },
            error: function (error) {
                alert(error);
            }
        });
    });    

    // register user when register button is pressed
    $('#register').on('click', function (e) {
        e.preventDefault();

        // grab username, email and password from fields
        const username = $('#username').val();
        const email = $('#email').val();
        const password = $('#password').val();

        // define our alert elements for success and error
        const alertSuccess = $('#alert-success');
        const alertError = $('#alert-error');

        // when register is pressed, make a post request to /user/register
        $.ajax({
            url: '/user/register',
            type: 'POST',
            contentType: 'application/json',
            // the body of the post request should be in the format we have defined in user.js route to /user/register
            data: JSON.stringify({ username, email, password }),
            success: function (response) {
                // on success the error alert should not exist (if an error occured before hand)
                // and the success alert should be shown, with embedded html to allow the user to go straight to login page
                alertError.css('display', 'none')
                alertSuccess.css('display', 'block').html("Account created successfully! <a href='/login'>Go to login</a>");
            },
            error: function (error) {
                // the error message is parsed
                let errorMessage = JSON.parse(error.responseText).error;
                // alert success should not be visible (if a success occured before)
                alertSuccess.css('display', 'none')
                // display the error alert, with the parsed error message
                alertError.css('display', 'block').text(errorMessage || "An error occurred.");
            }
        });
    });

    $('#login').on('click', function (e) {
        e.preventDefault();
        // when the login button is clicked
        // grab username and password from fields
        const usernameOrEmail = $('#usernameOrEmail').val();
        const password = $('#password').val();

        // define our alert elements for success and error
        const alertSuccess = $('#alert-success');
        const alertError = $('#alert-error');

        $.ajax({
            url: '/user/login',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ usernameOrEmail, password }),
            success: function (response) {

                // debug
                // window.location.href = '/protected';
                localStorage.setItem("userId", response.userId);

                alertError.css('display', 'none')
                alertSuccess.css('display', 'block').html("Account login successfull! <a href='/profile'>Go to profile</a>");
            },
            error: function (error) {
                let errorMessage = JSON.parse(error.responseText).error;
                alertSuccess.css('display', 'none')
                alertError.css('display', 'block').text(errorMessage || "An error occurred.");
            }
        });
    });
});