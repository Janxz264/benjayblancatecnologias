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

function cleanUpModals() {
  document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
  document.body.classList.remove('modal-open');
  document.body.style.paddingRight = '';
}
