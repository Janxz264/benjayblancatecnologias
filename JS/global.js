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

function blockUI(message = "Procesando...") {
    const blocker = document.createElement("div");
    blocker.id = "uiBlocker";
    blocker.innerHTML = `<div class="blocker-message">${message}</div>`;
    blocker.style = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(255,255,255,0.5); z-index: 9999;
        display: flex; align-items: center; justify-content: center;
        font-size: 1.5em; font-weight: bold; color: #333;
    `;
    document.body.appendChild(blocker);
}

function unblockUI() {
    const blocker = document.getElementById("uiBlocker");
    if (blocker) blocker.remove();
}
