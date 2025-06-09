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
    const container = document.getElementById("mainContainer");

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
                            <th>Fecha de Nacimiento</th>
                            <th>Edad</th>
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
                let fullName = `${patient.PATERNO} ${patient.MATERNO || ""} ${patient.NOMBRE}`;
                
                tableHTML += `
                    <tr>
                        <td>${fullName}</td>
                        <td>${patient.TELEFONO}</td>
                        <td>${patient.FECHA_NACIMIENTO}</td>
                        <td>${age} años</td>
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
            $('#patientsTable').DataTable().destroy();
            initializeDataTable("#patientsTable");
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

    if (isEdit && patient) {
        modalLabel.innerText = "Editar Paciente";
        saveBtn.innerText = "Guardar Cambios";
        form.reset();
        document.getElementById("patientId").value = patient.ID_PACIENTE;
        document.getElementById("name").value = patient.NOMBRE;
        document.getElementById("paterno").value = patient.PATERNO;
        document.getElementById("materno").value = patient.MATERNO || "";
        document.getElementById("phone").value = patient.TELEFONO || "";
        document.getElementById("birthdate").value = patient.FECHA_NACIMIENTO;

        loadStates(patient.ID_ESTADO).then(() => {
            loadMunicipios(patient.ID_ESTADO, patient.ID_MUNICIPIO);
        });
    } else {
        modalLabel.innerText = "Agregar Paciente";
        saveBtn.innerText = "Guardar";
        form.reset();
        document.getElementById("patientId").value = "";
        loadStates();
        document.getElementById("municipio").innerHTML = "<option>Seleccione un estado primero</option>";
    }

    new bootstrap.Modal(document.getElementById("patientModal")).show();
}

function openAddPatientModal() {
    openPatientModal(false);
}

function editPatient(id) {
    fetch(`../PHP/patienthandler.php?action=GET&id=${id}`)
        .then(response => response.json())
        .then(patient => {
            if (patient.error) {
                Swal.fire("Error", patient.error, "error");
                return;
            }
            openPatientModal(true, patient);
        })
        .catch(error => {
            console.error("Error loading patient data:", error);
            Swal.fire("Error", "No se pudo cargar el paciente.", "error");
        });
}

function deletePatient(id) {
    Swal.fire({
        title: "¿Eliminar paciente?",
        text: "Esta acción no se puede deshacer.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar"
    }).then(result => {
        if (result.isConfirmed) {
            fetch(`../PHP/patienthandler.php?action=REMOVE`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: `id=${id}`
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    Swal.fire("Eliminado", "Paciente eliminado correctamente.", "success");
                    loadPatients();
                } else {
                    Swal.fire("Error", "Error eliminando paciente.", "error");
                }
            })
            .catch(error => {
                console.error("Error deleting patient:", error);
                Swal.fire("Error", "No se pudo eliminar el paciente.", "error");
            });
        }
    });
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

function savePatient() {
    let patientData = {
        nombre: document.getElementById("name").value,
        paterno: document.getElementById("paterno").value,
        materno: document.getElementById("materno").value,
        telefono: document.getElementById("phone").value,
        fecha_nacimiento: document.getElementById("birthdate").value,
        id_estado: document.getElementById("state").value,
        id_municipio: document.getElementById("municipio").value
    };

    const idPaciente = document.getElementById("patientId").value;
    const action = idPaciente ? "EDIT" : "ADD";
    if (idPaciente) patientData.id_paciente = idPaciente;

    if (!patientData.nombre || !patientData.paterno || !patientData.fecha_nacimiento || !patientData.telefono) {
    Swal.fire("Campos obligatorios", "Nombre, Apellido Paterno, Teléfono & Fecha de Nacimiento son requeridos.", "warning");
    return;
    }

    fetch(`../PHP/patienthandler.php?action=${action}${idPaciente ? `&id=${idPaciente}` : ''}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patientData)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            Swal.fire("Éxito", `Paciente ${idPaciente ? "actualizado" : "agregado"} correctamente.`, "success");
            document.querySelector("#patientModal .btn-close").click();
            loadPatients();
        } else {
            Swal.fire("Error", "No se pudo guardar el paciente.", "error");
        }
    })
    .catch(error => {
        console.error("Error saving patient:", error);
        Swal.fire("Error", "Error al enviar los datos del paciente.", "error");
    });
}
