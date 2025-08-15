const patientsLink = document.getElementById("patientsLink");
if (patientsLink) {
    patientsLink.addEventListener("click", function (event) {
        event.preventDefault();
        loadPatients();
    });
} else {
    console.error("Error: Element #patientsLink not found.");
}

function safeText(value) {
    return value && value.trim ? value.trim() : "--";
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

    showSpinner("Cargando pacientes...");

    fetch("../PHP/patienthandler.php?action=VIEW")
        .then(response => response.json())
        .then(data => {
            hideSpinner();

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
                            <th>Sexo</th>
                            <th>Municipio</th>
                            <th>Estado</th>
                            <th>Editar</th>
                            <th>Eliminar</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            data.forEach(patient => {
                let age = patient.FECHA_NACIMIENTO ? calculateAge(patient.FECHA_NACIMIENTO) + " años" : "--";
                let fullName = `${patient.PATERNO} ${patient.MATERNO || ""} ${patient.NOMBRE}`;
                
                tableHTML += `
                    <tr>
                        <td>${fullName}</td>
                        <td>${safeText(patient.TELEFONO)}</td>
                        <td>${safeText(patient.FECHA_NACIMIENTO)}</td>
                        <td>${age}</td>
                        <td>${safeText(patient.SEXO)}</td>
                        <td>${safeText(patient.NOMBRE_MUNICIPIO)}</td>
                        <td>${safeText(patient.NOMBRE_ESTADO)}</td>
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
            hideSpinner();
            console.error("Error fetching patients:", error);
            container.innerHTML += "<p class='text-danger'>Error al obtener datos.</p>";
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

        if (patient.SEXO === 'Hombre' || patient.SEXO === 1) {
            document.getElementById("sexo_hombre").checked = true;
        } else if (patient.SEXO === 'Mujer' || patient.SEXO === 0) {
            document.getElementById("sexo_mujer").checked = true;
        }

        // Cargar estados y municipios
        loadStates(patient.ID_ESTADO).then(() => {
            loadMunicipios(patient.ID_ESTADO, patient.ID_MUNICIPIO);
        });

        // Cargar seguros y seleccionar
        loadAssurances().then(() => {
            if (patient.ID_SEGURO) {
            document.getElementById("assuranceCheckbox").checked = true;
            document.getElementById("assuranceFields").style.display = "block";
            document.getElementById("assuranceSelectContainer").style.display = "block";
            document.getElementById("assuranceSelect").value = patient.ID_SEGURO;
            document.getElementById("assuranceSelect").disabled = false;
            document.getElementById("assuranceName").disabled = false;
            document.getElementById("assuranceManualField").style.display = "none";
        }
        else {
            document.getElementById("assuranceFields").style.display = "none";
        }
        });

        // Cargar doctores y seleccionar
        loadDoctors().then(() => {
        if (patient.ID_DOCTOR_REFERENTE) {
            document.getElementById("referredCheckbox").checked = true;
            document.getElementById("doctorFields").style.display = "block";
            document.getElementById("doctorSelectContainer").style.display = "block";
            document.getElementById("doctorSelect").value = patient.ID_DOCTOR_REFERENTE;
            document.getElementById("doctorSelect").disabled = false;
            document.getElementById("doctorName").disabled = false;
            document.getElementById("doctorPaterno").disabled = false;
            document.getElementById("doctorMaterno").disabled = false;
            document.getElementById("doctorManualFields").style.display = "none";
        } else {
            document.getElementById("doctorFields").style.display = "none";
        }
        });
    } else {
        modalLabel.innerText = "Agregar Paciente";
        saveBtn.innerText = "Guardar";
        form.reset();
        document.getElementById("patientId").value = "";
        // Reset manual assurance fields
    document.getElementById("assuranceCheckbox").checked = false;
    document.getElementById("assuranceFields").style.display = "none";
    document.getElementById("assuranceSelectContainer").style.display = "none";
    document.getElementById("assuranceSelect").value = "";
    document.getElementById("assuranceSelect").disabled = true;
    document.getElementById("assuranceName").value = "";
    document.getElementById("assuranceName").disabled = true;
    document.getElementById("assuranceManualField").style.display = "none";

    // Reset manual doctor fields
    document.getElementById("referredCheckbox").checked = false;
    document.getElementById("doctorFields").style.display = "none";
    document.getElementById("doctorSelectContainer").style.display = "none";
    document.getElementById("doctorSelect").value = "";
    document.getElementById("doctorSelect").disabled = true;
    document.getElementById("doctorName").value = "";
    document.getElementById("doctorName").disabled = true;
    document.getElementById("doctorPaterno").value = "";
    document.getElementById("doctorPaterno").disabled = true;
    document.getElementById("doctorMaterno").value = "";
    document.getElementById("doctorMaterno").disabled = true;
    document.getElementById("doctorManualFields").style.display = "none";

    // Reset estado y municipio
    loadStates();
    document.getElementById("municipio").innerHTML = "<option>Seleccione un estado primero</option>";
    
    // Cargar listas
    loadAssurances();
    loadDoctors();
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
    let selectedSexo = document.querySelector('input[name="sexo"]:checked');
    if (!selectedSexo) {
        Swal.fire("Campos obligatorios", "Seleccione el sexo del paciente.", "warning");
        return;
    }
    let sexoValor = selectedSexo.value === "Hombre" ? 1 : 0;

    let patientData = {
        nombre: document.getElementById("name").value.trim(),
        paterno: document.getElementById("paterno").value.trim(),
        materno: document.getElementById("materno").value.trim(),
        telefono: document.getElementById("phone").value.trim(),
        fecha_nacimiento: document.getElementById("birthdate").value,
        id_estado: document.getElementById("state").value,
        id_municipio: document.getElementById("municipio").value,
        sexo: sexoValor
    };

    const assuranceCheckbox = document.getElementById("assuranceCheckbox").checked;
    const assuranceSelect = document.getElementById("assuranceSelect").value;
    const assuranceName = document.getElementById("assuranceName").value.trim();

    const referredCheckbox = document.getElementById("referredCheckbox").checked;
    const doctorSelect = document.getElementById("doctorSelect").value;
    const doctorName = document.getElementById("doctorName").value.trim();
    const doctorPaterno = document.getElementById("doctorPaterno").value.trim();
    const doctorMaterno = document.getElementById("doctorMaterno").value.trim();

    // Validación seguro médico
    if (assuranceCheckbox) {
        if (!assuranceSelect && assuranceName === "") {
            Swal.fire("Campos obligatorios", "Seleccione un seguro o ingrese uno nuevo.", "warning");
            return;
        }
        if (assuranceSelect) {
            patientData.id_seguro = assuranceSelect;
        } else {
            patientData.new_seguro = assuranceName;
        }
    }

    // Validación médico referente
    if (referredCheckbox) {
        if (!doctorSelect && (doctorName === "" || doctorPaterno === "")) {
            Swal.fire("Campos obligatorios", "Seleccione un médico referente o registre uno nuevo con nombre y apellido paterno.", "warning");
            return;
        }
        if (doctorSelect) {
            patientData.id_doctor_referente = doctorSelect;
        } else {
            patientData.new_doctor = {
                nombre: doctorName,
                paterno: doctorPaterno,
                materno: doctorMaterno
            };
        }
    }

    // Validación campos obligatorios generales
    if (!patientData.nombre || !patientData.paterno || !patientData.telefono || !patientData.fecha_nacimiento) {
        Swal.fire("Campos obligatorios", "Nombre, Apellido Paterno, Teléfono y Fecha de Nacimiento son requeridos.", "warning");
        return;
    }

    // Acción ADD o EDIT
    const idPaciente = document.getElementById("patientId").value;
    const action = idPaciente ? "EDIT" : "ADD";
    if (idPaciente) patientData.id_paciente = idPaciente;

    // Si no está marcado el seguro, forzamos id_seguro = null para borrarlo al editar
    if (!assuranceCheckbox && idPaciente) {
        patientData.id_seguro = null;
    }

    // Si no está marcado el médico, forzamos id_doctor_referente = null para borrarlo al editar
    if (!referredCheckbox && idPaciente) {
        patientData.id_doctor_referente = null;
    }

    showSpinner(idPaciente ? "Actualizando paciente..." : "Guardando paciente...");

    fetch(`../PHP/patienthandler.php?action=${action}${idPaciente ? `&id=${idPaciente}` : ''}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patientData)
    })
    .then(response => response.json())
    .then(result => {
        hideSpinner();
        if (result.success) {
            Swal.fire("Éxito", `Paciente ${idPaciente ? "actualizado" : "agregado"} correctamente.`, "success");
            document.querySelector("#patientModal .btn-close").click();
            loadPatients();
        } else {
            Swal.fire("Error", "No se pudo guardar el paciente.", "error");
        }
    })
    .catch(error => {
        hideSpinner();
        console.error("Error saving patient:", error);
        Swal.fire("Error", "Error al enviar los datos del paciente.", "error");
    });
}

function loadAssurances() {
    return fetch('../PHP/patienthandler.php?action=GET_ASSURANCES')
        .then(res => res.json())
        .then(data => {
            const select = document.getElementById("assuranceSelect");
            select.innerHTML = `<option value="">Seleccione un seguro</option>`;
            data.forEach(seguro => {
                const option = document.createElement("option");
                option.value = seguro.ID_SEGURO;
                option.textContent = seguro.NOMBRE;
                select.appendChild(option);
            });
        });
}

function loadDoctors() {
    return fetch('../PHP/patienthandler.php?action=GET_DOCTORS')
        .then(res => res.json())
        .then(data => {
            const select = document.getElementById("doctorSelect");
            select.innerHTML = `<option value="">Seleccione un médico referente</option>`;
            data.forEach(doc => {
                const option = document.createElement("option");
                option.value = doc.ID_PERSONA;
                option.textContent = `${doc.NOMBRE} ${doc.PATERNO} ${doc.MATERNO || ''}`.trim();
                select.appendChild(option);
            });
        });
}
