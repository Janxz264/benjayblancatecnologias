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
    fetch("../PHP/getDoctors.php")
        .then(response => response.json())
        .then(doctors => {
            const doctorSelect = document.getElementById("doctorSelect");
            doctorSelect.innerHTML = '<option value="">-- Seleccione un médico --</option>'; // Default option

            if (doctors.length > 0) {
                doctors.forEach(doctor => {
                    let option = new Option(` ${doctor.PATERNO} ${doctor.MATERNO} ${doctor.NOMBRE}`, doctor.ID_PERSONA);
                    doctorSelect.add(option);
                });

                document.getElementById("doctorSelectContainer").style.display = "block"; // Show dropdown
            } else {
                document.getElementById("doctorSelectContainer").style.display = "none"; // Hide dropdown
            }

            handleDoctorSelection(); // Ensure manual fields remain visible if no doctor is selected
        })
        .catch(error => console.error("Error fetching doctors:", error));
}

function handleDoctorSelection() {
    const doctorSelect = document.getElementById("doctorSelect");
    const doctorManualFields = document.getElementById("doctorManualFields");

    if (doctorSelect.value) {
        doctorManualFields.style.display = "none"; // Hide manual entry
        clearDoctorFields(); // Clear manual input fields
    } else {
        doctorManualFields.style.display = "block"; // Show manual entry
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