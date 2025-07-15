document.addEventListener('DOMContentLoaded', function () {
    flatpickr("#appointmentTime", {
        enableTime: true,
        noCalendar: true,
        dateFormat: "h:i K", // 12-hour format with AM/PM
        time_24hr: false
    });
    // Update Save button behavior
            document.getElementById('saveAppointmentBtn').onclick = function () {
                saveAppointment();
            };
});

let currentAppointments = []; // variable global

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

            currentAppointments = data;

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

            const today = new Date();
            today.setHours(0, 0, 0, 0); // Remove time for accurate comparison

            data.forEach(appointment => {
                const appointmentDate = new Date(appointment.FECHA_HORA);
                appointmentDate.setHours(0, 0, 0, 0);

                // Determine if the appointment is today or in the future
                const isToday = appointmentDate.getTime() === today.getTime();
                const formattedDate = isToday 
                    ? `Hoy a las ${formatDateTime(appointment.FECHA_HORA)}` 
                    : formatDateTime(appointment.FECHA_HORA);

                // Configure Finalizar button behavior
                const finalizarButton = isToday 
                    ? `<button class="btn btn-info btn-sm" onclick="finishAppointment(${appointment.ID_CITA})">
                        <i class="fa fa-calendar-check"></i> Finalizar Cita
                      </button>`
                    : `<button class="btn btn-info btn-sm" disabled style="cursor: not-allowed;" title="No es posible finalizar aún">
                        <i class="fa fa-calendar-check"></i> Finalizar Cita
                      </button>`;

                tableHTML += `
                    <tr>
                        <td>${appointment.NOMBRE_COMPLETO}</td>
                        <td>${formattedDate}</td>
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
                            ${finalizarButton}
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
                            <th>Detalle</th>
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
                            <button class="btn btn-info btn-sm" onclick="viewAppointment(${appointment.ID_CITA})">
                                <i class="fa fa-search"></i> Ver detalles
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
    const today = new Date();

    // Remove time from today for accurate comparison
    today.setHours(0, 0, 0, 0);
    const appointmentDate = new Date(date);
    appointmentDate.setHours(0, 0, 0, 0);

    // Format options for future & past dates
    const fullDateOptions = {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true
    };

    const onlyTimeOptions = {
        hour: "numeric",
        minute: "numeric",
        hour12: true
    };

    // If appointment is today → Show only time
    if (appointmentDate.getTime() === today.getTime()) {
        return date.toLocaleTimeString("es-MX", onlyTimeOptions);
    }
    
    // If appointment is tomorrow or later → Full date format
    return date.toLocaleDateString("es-MX", fullDateOptions);
}

// Función para abrir el modal de cita
function openAddAppointmentModal() {
    $('#appointmentForm')[0].reset();
    $('#patientSelect').empty().append('<option value="">-- Cargando pacientes... --</option>');
    const appointmentModal = new bootstrap.Modal(document.getElementById('appointmentModal'));
    appointmentModal.show();

    // Reset and show first-time patient UI
    document.getElementById('firstTimeWrapper').classList.remove('d-none');
    document.getElementById('firstTimeCheckbox').disabled = false;
    document.getElementById('firstTimeCheckbox').checked = false;
    document.getElementById('firstTimeFields').classList.add('d-none');
    document.getElementById('sexoAgendaGroup').classList.add('d-none'); 

    // Also reset dropdown behavior
    document.getElementById('patientSelect').disabled = false;
    document.getElementById('patientSelect').setAttribute('required', 'required');
    document.getElementById('patientSelectText').innerText = "Seleccione al paciente";

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('appointmentDate').value = today;
    document.getElementById('appointmentDate').setAttribute('min', today);
    
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

            // Populate dropdown with patient data
            patients.forEach(p => {
                const fullName = `${p.NOMBRE} ${p.PATERNO} ${p.MATERNO}`;
                $select.append(`<option value="${p.ID_PACIENTE}">${fullName}</option>`);
            });
        },
        error: function(err) {
            console.error("Error al cargar pacientes:", err);
            Swal.fire("Error", "Ocurrió un problema al cargar los pacientes.", "error");
        }
    });
}

function saveAppointment() {
    const isFirstTime = document.getElementById('firstTimeCheckbox').checked;
    const date = $('#appointmentDate').val();
    const time = $('#appointmentTime').val();
    const motivo = $('#appointmentReason').val();

    if (!date || !time || !motivo) {
        Swal.fire('Campos incompletos', 'Todos los campos son obligatorios', 'warning');
        return;
    }

    // Convertir hora AM/PM a 24 horas
    const [hourMinute, meridian] = time.split(' ');
    let [hour, minute] = hourMinute.split(':').map(Number);
    if (meridian === 'PM' && hour !== 12) hour += 12;
    if (meridian === 'AM' && hour === 12) hour = 0;
    const formattedTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    const mysqlDateTime = `${date} ${formattedTime}:00`;

    if (isOverlappingAppointment(mysqlDateTime)) {
        Swal.fire('Conflicto de horario', 'Ya existe una cita agendada dentro de la ventana de 1 hora alrededor de esta hora.', 'warning');
        return;
    }

    if (isFirstTime) {
        const nombre = $('#nameagenda').val().trim();
        const paterno = $('#paternoagenda').val().trim();
        const materno = $('#maternoagenda').val().trim();
        const selectedSexo = document.querySelector('input[name="sexo_agenda"]:checked');
        const sexoValor = selectedSexo.value === "Hombre" ? 1 : 0;

        if (!nombre || !paterno) {
            Swal.fire('Campos incompletos', 'Nombre y Apellido paterno son obligatorios', 'warning');
            return;
        }

        const payload = {
            nombre: nombre,
            paterno: paterno,
            materno: materno,
            sexo: sexoValor,
            fecha_hora: mysqlDateTime,
            motivo: motivo
        };

        fetch('../PHP/agendahandler.php?action=ADDFIRSTTIME', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(response => {
            if (response.success) {
                $('#appointmentModal').modal('hide');
                Swal.fire('Cita guardada', 'Se ha registrado la cita con un paciente de primera vez.', 'success');
                loadCurrentAppointments();
            } else {
                Swal.fire('Error', response.error || 'No se pudo guardar la cita', 'error');
            }
        })
        .catch(err => {
            console.error(err);
            Swal.fire('Error', 'Error al enviar la cita', 'error');
        });

    } else {
        const pacienteId = $('#patientSelect').val();
        if (!pacienteId) {
            Swal.fire('Campos incompletos', 'Seleccione un paciente existente', 'warning');
            return;
        }

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

function formatSpanishDateTime(fechaHora) {
    const date = new Date(fechaHora);

    // Options for formatting
    const options = {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true
    };

    // Ensure Spanish locale
    return date.toLocaleDateString("es-ES", options);
}

function viewAppointment(idCita) {

    const existingModal = document.getElementById("viewAppointmentModal");
    if (existingModal) {
        existingModal.remove();
    }

    fetch(`../PHP/agendahandler.php?action=GET&id=${idCita}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                Swal.fire("Error", data.error, "error");
                return;
            }

            // Helper to handle null or empty values
            const safe = (value) => value ? value : "No registrado";

            // Format the date using JavaScript
            const formattedDateTime = formatSpanishDateTime(data.FECHA_HORA);
            const formattedBirthdate = data.FECHA_NACIMIENTO ? formatBirthdate(data.FECHA_NACIMIENTO) : "No registrado";

            // Generate modal content dynamically
            const modalContent = `
                <div class="modal fade" id="viewAppointmentModal" tabindex="-1" aria-labelledby="viewAppointmentModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-lg modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header custom-header-bg text-white">
                                <h5 class="modal-title" id="viewAppointmentModalLabel">Detalles de la Cita</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                            </div>
                            <div class="modal-body">
                                <ul class="list-group">
                                    <li class="list-group-item"><strong>Paciente:</strong> ${safe(data.NOMBRE_COMPLETO)}</li>
                                    <li class="list-group-item"><strong>Teléfono:</strong> ${safe(data.TELEFONO)}</li>
                                    <li class="list-group-item"><strong>Sexo:</strong> ${safe(data.SEXO)}</li>
                                    <li class="list-group-item"><strong>Fecha de nacimiento:</strong> ${formattedBirthdate}</li>
                                    <li class="list-group-item"><strong>Seguro:</strong> ${safe(data.SEGURO)}</li>
                                    <li class="list-group-item"><strong>Médico referente:</strong> ${safe(data.DOCTOR_REFERENTE)}</li>
                                    <li class="list-group-item"><strong>Fecha y hora de consulta:</strong> ${formattedDateTime}</li>
                                    <li class="list-group-item"><strong>Motivo:</strong> ${safe(data.MOTIVO_DE_CONSULTA)}</li>
                                    <li class="list-group-item"><strong>Observaciones:</strong> ${safe(data.OBSERVACIONES)}</li>
                                </ul>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Insert and show modal
            const modalContainer = document.createElement("div");
            modalContainer.innerHTML = modalContent;
            document.body.appendChild(modalContainer);
            $("#viewAppointmentModal").modal("show");
        })
        .catch(error => {
            console.error("Error fetching appointment details:", error);
            Swal.fire("Error", "Ocurrió un problema al obtener los detalles de la cita.", "error");
        });
}

function formatBirthdate(dateString) {
    const dateParts = dateString.split("-"); // Extract components (YYYY-MM-DD)
    const year = dateParts[0];
    const month = dateParts[1];
    const day = dateParts[2];
    return `${day}/${month}/${year}`; // Correct format without Date object
}

function editAppointment(idCita) {
    const appointmentModal = new bootstrap.Modal(document.getElementById('appointmentModal'));
    $('#appointmentForm')[0].reset(); // Clean form
    $('#patientSelect').empty().append('<option value="">-- Cargando pacientes... --</option>');
    loadPatientsForAppointment();
    appointmentModal.show();

    // Hide first-time controls when editing
    document.getElementById('firstTimeWrapper').classList.add('d-none');
    document.getElementById('firstTimeFields').classList.add('d-none');
    document.getElementById('firstTimeCheckbox').disabled = true;
    document.getElementById('firstTimeCheckbox').checked = false;
    document.getElementById('sexoAgendaGroup').classList.add('d-none');

    // Ensure patientSelect is active again
    const patientSelect = document.getElementById('patientSelect');
    patientSelect.disabled = false;
    patientSelect.setAttribute('required', 'required');
    document.getElementById('patientSelectText').innerText = "Seleccione al paciente";

    fetch(`../PHP/agendahandler.php?action=GET&id=${idCita}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                Swal.fire({
                    title: "Error",
                    text: data.error,
                    icon: "error"
                });
                return;
            }

            document.getElementById('appointmentId').value = idCita;
            document.getElementById('patientSelect').value = data.ID_PACIENTE;
            document.getElementById('appointmentDate').value = data.FECHA_HORA.split(" ")[0];
            document.getElementById('appointmentTime').value = data.FECHA_HORA.split(" ")[1];
            document.getElementById('appointmentReason').value = data.MOTIVO_DE_CONSULTA;

            document.getElementById('saveAppointmentBtn').onclick = function () {
                saveEditedAppointment();
            };
        })
        .catch(error => {
            console.error("Error fetching appointment:", error);
            Swal.fire({
                title: "Error",
                text: "Hubo un problema al obtener la información de la cita.",
                icon: "error"
            });
        });
}

function saveEditedAppointment() {
    const idCita = document.getElementById('appointmentId').value;
    if (!idCita) {
        Swal.fire({
            title: "Error",
            text: "No se ha seleccionado ninguna cita para editar.",
            icon: "error"
        });
        return;
    }

    const patientId = document.getElementById('patientSelect').value;
    const appointmentDate = document.getElementById('appointmentDate').value;
    const appointmentTime = document.getElementById('appointmentTime').value;
    const appointmentReason = document.getElementById('appointmentReason').value;

    const time24 = convertTo24Hour(appointmentTime);
    const fechaHora = `${appointmentDate} ${time24}`;

    if (!patientId || !appointmentDate || !appointmentTime || !appointmentReason) {
        Swal.fire({
            title: "Error",
            text: "Todos los campos son obligatorios.",
            icon: "warning"
        });
        return;
    }

    if (isOverlappingAppointment(fechaHora, 60, idCita)) {
        Swal.fire('Conflicto de horario', 'Ya existe otra cita agendada dentro de la ventana de 1 hora alrededor de esta hora.', 'warning');
        return;
    }

    const updatedData = {
        id_paciente: patientId,
        fecha_hora: fechaHora,
        motivo: appointmentReason
    };

    fetch(`../PHP/agendahandler.php?action=EDIT&id=${idCita}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            Swal.fire({
                title: "Éxito",
                text: "Cita actualizada correctamente.",
                icon: "success",
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                loadCurrentAppointments();
                $('#appointmentForm')[0].reset(); // Clean form
                $('#patientSelect').empty().append('<option value="">-- Cargando pacientes... --</option>');
                $('#appointmentModal').modal('hide');
            });
        } else {
            Swal.fire({
                title: "Error",
                text: "Hubo un problema al actualizar la cita.",
                icon: "error"
            });
        }
    })
    .catch(error => {
        console.error("Error saving appointment:", error);
        Swal.fire({
            title: "Error",
            text: "Error de comunicación con el servidor.",
            icon: "error"
        });
    });
}

function convertTo24Hour(timeStr) {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':');
    hours = parseInt(hours);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
}

function toggleFirstTimeFields() {
    const isFirstTime = document.getElementById('firstTimeCheckbox').checked;
    const patientSelect = document.getElementById('patientSelect');
    const labelText = document.getElementById('patientSelectText');

    // Toggle visibility
    document.getElementById('firstTimeFields').classList.toggle('d-none', !isFirstTime);
    document.getElementById('sexoAgendaGroup').classList.toggle('d-none', !isFirstTime);

    if (isFirstTime) {
        patientSelect.value = "";
        patientSelect.disabled = true;
        patientSelect.removeAttribute('required');
        labelText.innerText = "Ingrese a un nuevo paciente";
    } else {
        patientSelect.disabled = false;
        patientSelect.setAttribute('required', 'required');
        labelText.innerText = "Seleccione al paciente";

        // Optionally clear the first-time fields
        document.getElementById('nameagenda').value = '';
        document.getElementById('paternoagenda').value = '';
        document.getElementById('maternoagenda').value = '';
        document.getElementById('sexo_hombre_agenda').checked = true;
    }
}

/**
 * Verifica si una nueva cita en `newDateTime` se solapa con alguna cita en currentAppointments
 * dentro de un margen de `toleranceMinutes` minutos.
 * Si es edición, se pasa `excludeId` para no comparar contra sí misma.
 */
function isOverlappingAppointment(newDateTime, toleranceMinutes = 60, excludeId = null) {
    const newTime = new Date(newDateTime).getTime();

    for (const appt of currentAppointments) {
        if (excludeId && appt.ID_CITA == excludeId) continue;

        const apptTime = new Date(appt.FECHA_HORA).getTime();
        const diffMinutes = Math.abs((apptTime - newTime) / 60000);

        if (diffMinutes < toleranceMinutes) {
            return true; // Hay solapamiento
        }
    }

    return false; // No hay solapamiento
}