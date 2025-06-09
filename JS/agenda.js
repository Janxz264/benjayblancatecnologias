const agendaLink = document.getElementById("agendaLink");
if (agendaLink) {
    agendaLink.addEventListener("click", function (event) {
        event.preventDefault();
        loadCurrentAppointments();
    });
} else {
    console.error("Error: Element #agendaLink not found.");
}

function loadCurrentAppointments() {
    document.getElementById("mainTitle").innerText = "Agenda de Citas";
    const container = document.getElementById("patientsContainer"); // Usa el mismo contenedor

    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <button class="btn btn-success" onclick="openAddAppointmentModal()">
                <i class="fas fa-plus"></i> Agendar Cita
            </button>
        </div>
    `;

    fetch("../PHP/agendahandler.php?action=VIEWCURRENT")
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                container.innerHTML += `<p class="text-danger">Error: ${data.error}</p>`;
                return;
            }

            if (data.length === 0) {
                container.innerHTML += "<h1>No hay citas registradas.</h1>";
                return;
            }

            let tableHTML = `
                <table id="appointmentsTable" class="table table-bordered table-striped">
                    <thead class="thead-dark">
                        <tr>
                            <th>Paciente</th>
                            <th>Fecha y Hora</th>
                            <th>Motivo</th>
                            <th>Editar</th>
                            <th>Eliminar</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            data.forEach(appointment => {
                tableHTML += `
                    <tr>
                        <td>${appointment.NOMBRE_COMPLETO}</td>
                        <td>${formatDateTime(appointment.FECHA_HORA)}</td>
                        <td>${appointment.MOTIVO_DE_CONSULTA}</td>
                        <td>
                            <button class="btn btn-primary btn-sm" onclick="editAppointment(${appointment.ID_CITA})">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                        </td>
                        <td>
                            <button class="btn btn-danger btn-sm" onclick="deleteAppointment(${appointment.ID_CITA})">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>
                        </td>
                    </tr>
                `;
            });

            tableHTML += `</tbody></table>`;
            container.innerHTML += tableHTML;
            initializeDataTable(); // Si estás usando DataTables
        })
        .catch(error => {
            console.error("Error fetching appointments:", error);
            container.innerHTML += "<p class='text-danger'>Error al obtener citas.</p>";
        });
}

function loadPastAppointments() {
    document.getElementById("mainTitle").innerText = "Historial de Citas";
    const container = document.getElementById("patientsContainer"); // Usa el mismo contenedor

    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <button class="btn btn-success" onclick="openAddAppointmentModal()">
                <i class="fas fa-plus"></i> Agendar Cita
            </button>
        </div>
    `;

    fetch("../PHP/agendahandler.php?action=VIEWPAST")
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                container.innerHTML += `<p class="text-danger">Error: ${data.error}</p>`;
                return;
            }

            if (data.length === 0) {
                container.innerHTML += "<h1>No hay citas registradas.</h1>";
                return;
            }

            let tableHTML = `
                <table id="appointmentsTable" class="table table-bordered table-striped">
                    <thead class="thead-dark">
                        <tr>
                            <th>Paciente</th>
                            <th>Fecha y Hora</th>
                            <th>Motivo</th>
                            <th>Editar</th>
                            <th>Eliminar</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            data.forEach(appointment => {
                tableHTML += `
                    <tr>
                        <td>${appointment.NOMBRE_COMPLETO}</td>
                        <td>${formatDateTime(appointment.FECHA_HORA)}</td>
                        <td>${appointment.MOTIVO_DE_CONSULTA}</td>
                        <td>
                            <button class="btn btn-primary btn-sm" onclick="editAppointment(${appointment.ID_CITA})">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                        </td>
                        <td>
                            <button class="btn btn-danger btn-sm" onclick="deleteAppointment(${appointment.ID_CITA})">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>
                        </td>
                    </tr>
                `;
            });

            tableHTML += `</tbody></table>`;
            container.innerHTML += tableHTML;
            initializeDataTable(); // Si estás usando DataTables
        })
        .catch(error => {
            console.error("Error fetching appointments:", error);
            container.innerHTML += "<p class='text-danger'>Error al obtener citas.</p>";
        });
}

function formatDateTime(datetimeString) {
    const date = new Date(datetimeString);
    return date.toLocaleString("es-MX", {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

// Función para abrir el modal de cita
function openAddAppointmentModal() {
    $('#appointmentForm')[0].reset(); // Limpiar formulario
    $('#patientSelect').empty().append('<option value="">-- Cargando pacientes... --</option>');
    $('#appointmentModal').modal('show');
    loadPatientsForAppointment(); // Llenar dropdown
}

// Cargar pacientes desde patienthandler.php
function loadPatientsForAppointment() {
    $.ajax({
        url: '../PHP/patienthandler.php?action=VIEW',
        method: 'GET',
        dataType: 'json',
        success: function(patients) {
            let $select = $('#patientSelect');
            $select.empty().append('<option value="">-- Seleccione un paciente --</option>');
            patients.forEach(p => {
                const fullName = `${p.NOMBRE} ${p.PATERNO} ${p.MATERNO}`;
                $select.append(`<option value="${p.ID_PACIENTE}">${fullName}</option>`);
            });
        },
        error: function(err) {
            console.error("Error al cargar pacientes:", err);
            $('#patientSelect').html('<option value="">Error al cargar pacientes</option>');
        }
    });
}

function saveAppointment() {
    const pacienteId = $('#patientSelect').val();
    const fechaHora = $('#appointmentDatetime').val();
    const motivo = $('#appointmentReason').val();

    if (!pacienteId || !fechaHora || !motivo) {
        Swal.fire('Campos incompletos', 'Todos los campos son obligatorios', 'warning');
        return;
    }

    const payload = {
        id_paciente: pacienteId,
        fecha_hora: fechaHora,
        motivo: motivo
    };

    fetch('../PHP/appointmenthandler.php?action=ADD', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(response => {
        if (response.success) {
            $('#appointmentModal').modal('hide');
            Swal.fire('Cita guardada', 'La cita se ha registrado correctamente.', 'success');
            // Aquí podrías refrescar una tabla o calendario
        } else {
            Swal.fire('Error', response.error || 'No se pudo guardar la cita', 'error');
        }
    })
    .catch(err => {
        console.error(err);
        Swal.fire('Error', 'Ocurrió un error al enviar la cita', 'error');
    });
}