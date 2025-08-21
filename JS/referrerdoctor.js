function toggleDoctorFields() {
    const checkbox = document.getElementById("referredCheckbox");
    const doctorFields = document.getElementById("doctorFields");
    const doctorSelectContainer = document.getElementById("doctorSelectContainer");
    const doctorManualFields = document.getElementById("doctorManualFields");

    if (checkbox.checked) {
        doctorFields.style.display = "block"; // Show entire section
        doctorManualFields.style.display = "block"; // Ensure manual input is visible upfront
        doctorSelectContainer.style.display = "block"; // Show dropdown

        fetchDoctors(); // Fetch doctors, but don't auto-hide manual fields
    } else {
        doctorFields.style.display = "none"; // Hide section
        doctorSelectContainer.style.display = "none"; // Hide dropdown
        doctorManualFields.style.display = "block"; // Show manual fields again
        clearDoctorFields(); // Clear inputs
    }
}

function fetchDoctors() {
    blockUI("Cargando médicos...");
    showSpinner("Cargando médicos...");

    fetch("../PHP/getDoctors.php")
        .then(response => response.json())
        .then(doctors => {
            hideSpinner();
            unblockUI();

            const doctorSelect = document.getElementById("doctorSelect");
            doctorSelect.innerHTML = '<option value="">-- Seleccione un médico --</option>';

            const manualInputs = [
                document.getElementById("doctorName"),
                document.getElementById("doctorPaterno"),
                document.getElementById("doctorMaterno")
            ];

            if (doctors.length > 0) {
                doctors.forEach(doctor => {
                    let option = new Option(` ${doctor.PATERNO} ${doctor.MATERNO} ${doctor.NOMBRE}`, doctor.ID_PERSONA);
                    doctorSelect.add(option);
                });

                document.getElementById("doctorSelectContainer").style.display = "block";
                manualInputs.forEach(input => input.disabled = false); // Keep manual inputs enabled
            } else {
                document.getElementById("doctorSelectContainer").style.display = "none";
                manualInputs.forEach(input => input.disabled = false); // Enable manual inputs if no options
            }

            handleDoctorSelection(); // Sync visibility
        })
        .catch(error => {
            hideSpinner();
            unblockUI();
            console.error("Error fetching doctors:", error);
        });
}

function handleDoctorSelection() {
    const doctorSelect = document.getElementById("doctorSelect");
    const manualInputs = [
        document.getElementById("doctorName"),
        document.getElementById("doctorPaterno"),
        document.getElementById("doctorMaterno")
    ];

    if (doctorSelect.value) {
        manualInputs.forEach(input => {
            input.disabled = true;
            input.value = "";
        });
    } else {
        manualInputs.forEach(input => input.disabled = false);
    }
}

// Disable dropdown if manual fields are filled
document.querySelectorAll("#doctorManualFields input").forEach(input => {
    input.addEventListener("input", function () {
        const doctorSelect = document.getElementById("doctorSelect");

        if (
            document.getElementById("doctorName").value ||
            document.getElementById("doctorPaterno").value ||
            document.getElementById("doctorMaterno").value
        ) {
            doctorSelect.disabled = true; // Disable dropdown
            doctorSelect.value = ""; // Reset selection to default placeholder
        } else {
            doctorSelect.disabled = false; // Enable dropdown if fields are empty
        }
    });
});

function clearDoctorFields() {
    document.getElementById("doctorName").value = "";
    document.getElementById("doctorPaterno").value = "";
    document.getElementById("doctorMaterno").value = "";
}