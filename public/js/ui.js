export function showToast() {
    $('.r-toast').removeClass('hide').addClass('show');
}

export function hideToast() {
    $('.r-toast').removeClass('show').addClass('hide');
}

export function displayToast(message, ms) {
    $('.r-toast .r-toast-message').text(" " + message);

    showToast();

    setTimeout(function () {
        hideToast();
    }, ms);
}