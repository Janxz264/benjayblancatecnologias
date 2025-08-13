// spinner.js
function showSpinner(message = "Cargando...") {
    $("#loadingMessage").text(message);
    $("#loadingSpinner").addClass("active");
}

function hideSpinner() {
    $("#loadingSpinner").removeClass("active");
}
