function toggleAssuranceFields() {
    const checkbox = document.getElementById("assuranceCheckbox");
    const assuranceFields = document.getElementById("assuranceFields");
    const assuranceSelectContainer = document.getElementById("assuranceSelectContainer");
    const assuranceManualField = document.getElementById("assuranceManualField");

    if (checkbox.checked) {
        assuranceFields.style.display = "block"; // Show entire section
        assuranceManualField.style.display = "block"; // Ensure manual input is visible upfront
        assuranceSelectContainer.style.display = "block"; // Show dropdown
        fetchAssurances(); // Fetch available assurances
    } else {
        assuranceFields.style.display = "none"; // Hide section
        assuranceSelectContainer.style.display = "none"; // Hide dropdown
        assuranceManualField.style.display = "block"; // Show manual field again
        clearAssuranceField(); // Clear input
    }
}

function fetchAssurances() {
    blockUI("Cargando seguros disponibles...");
    showSpinner("Cargando seguros...");

    fetch("../PHP/getAssurances.php")
        .then(response => response.json())
        .then(assurances => {
            hideSpinner();
            unblockUI();

            const assuranceSelect = document.getElementById("assuranceSelect");
            const assuranceManualInput = document.getElementById("assuranceName");

            assuranceSelect.innerHTML = '<option value="">-- Seleccione un seguro --</option>';

            if (assurances.length > 0) {
                assurances.forEach(assurance => {
                    let option = new Option(assurance.NOMBRE, assurance.ID_SEGURO);
                    assuranceSelect.add(option);
                });

                document.getElementById("assuranceSelectContainer").style.display = "block";
                assuranceManualInput.disabled = false; // Keep manual input enabled by default
            } else {
                document.getElementById("assuranceSelectContainer").style.display = "none";
                assuranceManualInput.disabled = false; // Enable manual input if no options
            }

            handleAssuranceSelection(); // Sync visibility
        })
        .catch(error => {
            hideSpinner();
            unblockUI();
            console.error("Error fetching assurances:", error);
        });
}

function handleAssuranceSelection() {
    const assuranceSelect = document.getElementById("assuranceSelect");
    const assuranceManualInput = document.getElementById("assuranceName");

    if (assuranceSelect.value) {
        assuranceManualInput.disabled = true;
        assuranceManualInput.value = "";
    } else {
        assuranceManualInput.disabled = false;
    }
}

// Disable dropdown if manual field is filled
document.getElementById("assuranceName").addEventListener("input", function () {
    const assuranceSelect = document.getElementById("assuranceSelect");

    if (this.value !== "") {
        assuranceSelect.disabled = true; // Disable dropdown
        assuranceSelect.value = ""; // Reset selection to default placeholder
    } else {
        assuranceSelect.disabled = false; // Enable dropdown if field is empty
    }
});

function clearAssuranceField() {
    document.getElementById("assuranceName").value = "";
}