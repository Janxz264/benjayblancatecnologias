const patientsLink = document.getElementById("patientsLink");
if (patientsLink) {
    patientsLink.addEventListener("click", function (event) {
        event.preventDefault();
        loadPatients();
    });
} else {
    console.error("Error: Element #patientsLink not found.");
}

function loadPatients() {
    document.getElementById("mainTitle").innerText = "Gestor de pacientes";
    const container = document.getElementById("patientsContainer");

    // Add "Agregar Paciente" button at the top-right before the table
    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <button class="btn btn-success" onclick="openAddPatientModal()">
                <i class="fas fa-plus"></i> Agregar Paciente
            </button>
        </div>
    `;

    fetch("../PHP/patienthandler.php?action=VIEW")
        .then(response => response.json())
        .then(data => {
            if (data.length === 0) {
                container.innerHTML += "<h1>No existen pacientes registrados en la base de datos.</h1>";
                return;
            }

            let tableHTML = `
                <table id="patientsTable" class="table table-bordered table-striped">
                    <thead class="thead-dark">
                        <tr>
                            <th>Nombre Completo</th>
                            <th>Teléfono</th>
                            <th>Fecha de Nacimiento / Edad</th>
                            <th>Municipio</th>
                            <th>Estado</th>
                            <th>Editar</th>
                            <th>Eliminar</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            data.forEach(patient => {
                let age = calculateAge(patient.FECHA_NACIMIENTO);
                let fullName = `${patient.PATERNO} ${patient.MATERNO ? patient.MATERNO : ""} ${patient.NOMBRES}`;
                
                tableHTML += `
                    <tr>
                        <td>${fullName}</td>
                        <td>${patient.TELEFONO}</td>
                        <td>${patient.FECHA_NACIMIENTO} (${age} años)</td>
                        <td>${patient.NOMBRE_MUNICIPIO}</td>
                        <td>${patient.NOMBRE_ESTADO}</td>
                        <td>
                            <button class="btn btn-primary btn-sm" onclick="editPatient(${patient.ID_PACIENTE})">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                        </td>
                        <td>
                            <button class="btn btn-danger btn-sm" onclick="deletePatient(${patient.ID_PACIENTE})">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>
                        </td>
                    </tr>
                `;
            });

            tableHTML += `</tbody></table>`;
            container.innerHTML += tableHTML;
            initializeDataTable();
        })
        .catch(error => {
            console.error("Error fetching patients:", error);
            container.innerHTML += "<p>Error al obtener datos.</p>";
        });
}

function openPatientModal(isEdit = false, patient = null) {
    const modalLabel = document.getElementById("patientModalLabel");
    const saveBtn = document.getElementById("savePatientBtn");
    const form = document.getElementById("patientForm");

    if (isEdit) {
        // Editing a patient
        modalLabel.innerText = "Editar Paciente";
        saveBtn.innerText = "Guardar Cambios";
        document.getElementById("patientId").value = patient.ID_PACIENTE;
        document.getElementById("name").value = patient.NOMBRES;
        document.getElementById("paterno").value = patient.PATERNO;
        document.getElementById("materno").value = patient.MATERNO || "";
        document.getElementById("phone").value = patient.TELEFONO || "";
        document.getElementById("birthdate").value = patient.FECHA_NACIMIENTO;

        loadStates(patient.ID_ESTADO); // Preselect existing state
        loadMunicipios(patient.ID_ESTADO, patient.ID_MUNICIPIO); // Preselect existing municipio
    } else {
        // Adding a new patient
        modalLabel.innerText = "Agregar Paciente";
        saveBtn.innerText = "Guardar";
        form.reset();
        document.getElementById("patientId").value = ""; // Ensure ID is empty

        loadStates(); // Load default states
        document.getElementById("municipio").innerHTML = "<option>Seleccione un estado primero</option>"; // Reset municipios
    }

    new bootstrap.Modal(document.getElementById("patientModal")).show();
}

// Open Add Patient Modal
function openAddPatientModal() {
    openPatientModal(false);
}

// Open Edit Patient Modal
function editPatient(id) {
    fetch(`../PHP/patienthandler.php?action=GET&id=${id}`)
        .then(response => response.json())
        .then(patient => {
            if (patient.error) {
                alert(patient.error);
                return;
            }
            openPatientModal(true, patient);
        })
        .catch(error => console.error("Error loading patient data:", error));
}

function deletePatient(id) {
    if (confirm("¿Estás seguro de que deseas eliminar este paciente? Esta acción no se puede deshacer.")) {
        fetch(`../PHP/patienthandler.php?action=REMOVE`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `id=${id}`
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                alert("Paciente eliminado correctamente.");
                loadPatients();
            } else {
                alert("Error eliminando paciente.");
            }
        })
        .catch(error => console.error("Error deleting patient:", error));
    }
}

function calculateAge(birthDateString) {
    // Convert "DD/MM/YYYY" to "YYYY-MM-DD"
    let parts = birthDateString.split('/');
    let formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`; // Rearrange to YYYY-MM-DD
    
    let birthDate = new Date(formattedDate);
    let today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    let monthDiff = today.getMonth() - birthDate.getMonth();
    let dayDiff = today.getDate() - birthDate.getDate();

    // Adjust age if birth month/day hasn't occurred yet
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        age--;
    }

    return age;
}

function savePatient() {
    let patientData = {
        nombres: document.getElementById("name").value,
        paterno: document.getElementById("paterno").value,
        materno: document.getElementById("materno").value,
        telefono: document.getElementById("phone").value,
        fecha_nacimiento: document.getElementById("birthdate").value,
        id_estado: document.getElementById("state").value,
        id_municipio: document.getElementById("municipio").value
    };

    fetch("../PHP/patienthandler.php?action=ADD", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patientData)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert("Paciente agregado correctamente.");
            $("#addPatientModal").modal("hide");
            loadPatients();
        } else {
            alert("Error al agregar paciente.");
        }
    })
    .catch(error => console.error("Error adding patient:", error));
}