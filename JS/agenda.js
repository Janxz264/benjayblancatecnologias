document.addEventListener('DOMContentLoaded', function () {
    flatpickr("#appointmentTime", {
        enableTime: true,
        noCalendar: true,
        dateFormat: "h:i K", // 12-hour format with AM/PM
        time_24hr: false
    });
});

const agendaLink = document.getElementById("agendaLink");
if (agendaLink) {
    agendaLink.addEventListener("click", function (event) {
        event.preventDefault();
        loadCurrentAppointments();
    });
} else {
    console.error("Error: Element #agendaLink not found.");
}

const agendaPastLink = document.getElementById("agendaPastLink");
if (agendaPastLink) {
    agendaPastLink.addEventListener("click", function (event) {
        event.preventDefault();
        loadPastAppointments();
    });
} else {
    console.error("Error: Element #agendaPastLink not found.");
}

function loadCurrentAppointments() {
    document.getElementById("mainTitle").innerText = "Agenda del día";
    const container = document.getElementById("mainContainer");

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
                container.innerHTML += "<h1>No hay citas el día de hoy ni en el futuro registradas en la base de datos.</h1>";
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
                            <th>Finalizar</th>
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
                        <td>
                            <button class="btn btn-info btn-sm" onclick="finishAppointment(${appointment.ID_CITA})">
                                <i class="fa fa-calendar-check"></i> Finalizar Cita
                            </button>
                        </td>
                    </tr>
                `;
            });

            tableHTML += `</tbody></table>`;
            container.innerHTML += tableHTML;
            $('#appointmentsTable').DataTable().destroy();
            initializeDataTable("#appointmentsTable");
        })
        .catch(error => {
            console.error("Error fetching appointments:", error);
            container.innerHTML += "<p class='text-danger'>Error al obtener citas.</p>";
        });
}

function loadPastAppointments() {
    document.getElementById("mainTitle").innerText = "Historial de Citas";
    const container = document.getElementById("mainContainer");
    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
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
                container.innerHTML += "<h1>No hay citas pasadas registradas en la base de datos.</h1>";
                return;
            }

            let tableHTML = `
                <table id="appointmentsTable" class="table table-bordered table-striped">
                    <thead class="thead-dark">
                        <tr>
                            <th>Paciente</th>
                            <th>Fecha y Hora</th>
                            <th>Motivo</th>
                            <th>Observaciones</th>
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
                            <button class="btn btn-primary btn-sm" onclick="viewAppointment(${appointment.ID_CITA})">
                                <i class="fas fa-search"></i> Ver observaciones
                            </button>
                        </td>
                    </tr>
                `;
            });

            tableHTML += `</tbody></table>`;
            container.innerHTML += tableHTML;
            $('#appointmentsTable').DataTable().destroy();
            initializeDataTable("#appointmentsTable");
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
    $('#appointmentForm')[0].reset(); // Clean form
    $('#patientSelect').empty().append('<option value="">-- Cargando pacientes... --</option>');
    $('#appointmentModal').modal('show');
    loadPatientsForAppointment();
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
    const date = $('#appointmentDate').val(); // Ej: 2025-06-10
    const time = $('#appointmentTime').val(); // Ej: 10:30 AM
    const motivo = $('#appointmentReason').val();

    if (!pacienteId || !date || !time || !motivo) {
        Swal.fire('Campos incompletos', 'Todos los campos son obligatorios', 'warning');
        return;
    }

    // Convertir hora AM/PM a 24 horas para MySQL
    const [hourMinute, meridian] = time.split(' ');
    let [hour, minute] = hourMinute.split(':').map(Number);
    if (meridian === 'PM' && hour !== 12) hour += 12;
    if (meridian === 'AM' && hour === 12) hour = 0;
    const formattedTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    const mysqlDateTime = `${date} ${formattedTime}:00`; // MySQL DATETIME format

    const payload = {
        id_paciente: pacienteId,
        fecha_hora: mysqlDateTime,
        motivo: motivo
    };

    fetch('../PHP/agendahandler.php?action=ADD', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(response => {
        if (response.success) {
            $('#appointmentModal').modal('hide');
            Swal.fire('Cita guardada', 'La cita se ha registrado correctamente.', 'success');
            loadCurrentAppointments();
        } else {
            Swal.fire('Error', response.error || 'No se pudo guardar la cita', 'error');
        }
    })
    .catch(err => {
        console.error(err);
        Swal.fire('Error', 'Ocurrió un error al enviar la cita', 'error');
    });
}

function deleteAppointment(idCita) {
    Swal.fire({
        title: "¿Estás seguro?",
        text: "La cita será eliminada permanentemente.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar"
    }).then((result) => {
        if (result.isConfirmed) {
            fetch("../PHP/agendahandler.php?action=REMOVE", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: `id=${idCita}`
            })
            .then(res => res.json())
            .then(response => {
                if (response.success) {
                    Swal.fire("Eliminada", "La cita ha sido eliminada correctamente.", "success");
                    loadCurrentAppointments(); // Refresh table
                } else {
                    Swal.fire("Error", response.error || "No se pudo eliminar la cita", "error");
                }
            })
            .catch(err => {
                console.error(err);
                Swal.fire("Error", "Ocurrió un error al eliminar la cita", "error");
            });
        }
    });
}

function finishAppointment(idCita) {
    $("#endAppointmentId").val(idCita);
    $("#endAppointmentModal").modal("show");
}

function endAppointment() {
    const idCita = $("#endAppointmentId").val();
    const observaciones = $("#appointmentObservations").val().trim();

    if (!observaciones) {
        Swal.fire("Campo obligatorio", "Debe ingresar observaciones para finalizar la cita.", "warning");
        return;
    }

    const payload = { observaciones };

    fetch(`../PHP/agendahandler.php?action=FINISH&id=${idCita}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(response => {
        if (response.success) {
            $("#endAppointmentModal").modal("hide");
            Swal.fire("Cita finalizada", "La cita ha sido cerrada correctamente.", "success");
            loadCurrentAppointments(); // Refresh appointments
        } else {
            Swal.fire("Error", response.error || "No se pudo finalizar la cita.", "error");
        }
    })
    .catch(error => {
        console.error("Error:", error);
        Swal.fire("Error", "Ocurrió un error al finalizar la cita.", "error");
    });
}
