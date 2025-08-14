// spinner.js
function showSpinner(message = "Cargando...") {
    $("#loadingMessage").text(message);
    $("#loadingSpinner").addClass("active");
}

function hideSpinner() {
    setTimeout(() => {
        $("#loadingSpinner").removeClass("active");
    }, 300);
}