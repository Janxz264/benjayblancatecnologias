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

function formatPrice(value) {
    // Convert to number if it's not already
    const num = parseFloat(value);
    
    // Check if it's a valid number
    if (isNaN(num)) {
        return "$0.00";
    }
    
    // Split into integer and decimal parts
    const [integerPart, decimalPart = '00'] = num.toFixed(2).split('.');
    
    // Add commas for thousands separators
    const integerWithCommas = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    return `$${integerWithCommas}.${decimalPart}`;
}

function parseFechaDDMMYYYY(fechaStr) {
    if (!fechaStr) return null;
    const [dia, mes, año] = fechaStr.split('/');
    return new Date(Date.UTC(año, mes - 1, dia));
}

function convertToDateInputFormat(dateStr) {
  // Expects input like "16/07/2025"
  if (!dateStr) return null;
  const [day, month, year] = dateStr.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function calculateAge(birthDateString) {
    let parts = birthDateString.split('/');
    let formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    let birthDate = new Date(formattedDate);
    let today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    let monthDiff = today.getMonth() - birthDate.getMonth();
    let dayDiff = today.getDate() - birthDate.getDate();

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        age--;
    }
    return age;
}