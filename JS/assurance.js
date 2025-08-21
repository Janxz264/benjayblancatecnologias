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
            assuranceSelect.innerHTML = '<option value="">-- Seleccione un seguro --</option>'; // Default option

            if (assurances.length > 0) {
                assurances.forEach(assurance => {
                    let option = new Option(assurance.NOMBRE, assurance.ID_SEGURO);
                    assuranceSelect.add(option);
                });

                document.getElementById("assuranceSelectContainer").style.display = "block"; // Show dropdown
            } else {
                document.getElementById("assuranceSelectContainer").style.display = "none"; // Hide dropdown
            }

            handleAssuranceSelection(); // Ensure manual field remains visible if no assurance is selected
        })
        .catch(error => {
            hideSpinner();
            unblockUI();
            console.error("Error fetching assurances:", error);
        });
}

function handleAssuranceSelection() {
    const assuranceSelect = document.getElementById("assuranceSelect");
    const assuranceManualField = document.getElementById("assuranceManualField");

    if (assuranceSelect.value) {
        assuranceManualField.style.display = "none"; // Hide manual entry
        clearAssuranceField(); // Clear manual input field
    } else {
        assuranceManualField.style.display = "block"; // Show manual entry
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