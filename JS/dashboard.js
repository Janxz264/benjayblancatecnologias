document.addEventListener("DOMContentLoaded", function () {
    fetch("../PHP/getcurrentsession.php")
        .then(response => response.json())
        .then(data => {
            if (data.user) {
                document.getElementById("welcomeMessage").innerText = `Bienvenido, ${data.user}.\n Hoy es ${data.datetime}`;
            } else {
                // Redirect to index.html if no user is logged in
                window.location.href = "../index.html";  // Redirects to the login page
            }
        })
        .catch(error => {
            console.error("Error fetching session data:", error);
            // Redirect on error (optional)
            window.location.href = "../index.html";
        });

    // Ensure all elements exist before adding event listeners
    const logoutButton = document.getElementById("logoutButton");
    const changePasswordLink = document.getElementById("changePasswordLink");
    const changePasswordForm = document.getElementById("changePasswordForm");

    if (logoutButton) {
        logoutButton.addEventListener("click", function (event) {
            event.preventDefault();
            Swal.fire({
                title: "¿Estás seguro?",
                text: "Se cerrará la sesión y deberás volver a iniciar sesión.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
                confirmButtonText: "Sí, cerrar sesión",
                cancelButtonText: "Cancelar"
            }).then((result) => {
                if (result.isConfirmed) {
                    fetch("../PHP/logout.php")
                        .then(() => {
                            Swal.fire({
                                title: "Sesión cerrada",
                                text: "Serás redirigido a la página de inicio.",
                                icon: "success",
                                timer: 2000,
                                showConfirmButton: false
                            });
                            setTimeout(() => {
                                window.location.href = "../index.html"; // Redirect to login
                            }, 2000);
                        })
                        .catch(error => {
                            console.error("Error logging out:", error);
                            Swal.fire("Error", "Hubo un problema al cerrar sesión.", "error");
                        });
                }
            });
        });
    } else {
        console.error("Error: Element #logoutButton not found.");
    }

    if (changePasswordLink) {
        changePasswordLink.addEventListener("click", function (event) {
            event.preventDefault();
            document.getElementById("changePasswordModal").classList.remove("hidden");
        });
    } else {
        console.error("Error: Element #changePasswordLink not found.");
    }

    if (changePasswordForm) {
        changePasswordForm.addEventListener("submit", function (event) {
            event.preventDefault(); // Prevent form submission

            let currentPassword = document.getElementById("currentPassword").value;
            let newPassword = document.getElementById("newPassword").value;
            let repeatPassword = document.getElementById("repeatPassword").value;

            // Validate all fields
            if (!currentPassword || !newPassword || !repeatPassword) {
                Swal.fire("Error", "Todos los campos son obligatorios", "error");
                return;
            }

            // Check if new passwords match
            if (newPassword !== repeatPassword) {
                Swal.fire("Error", "Las nuevas contraseñas no coinciden", "error");
                return;
            }

            // Send AJAX request to change password
            fetch("../PHP/changepassword.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    Swal.fire("Éxito", "Contraseña cambiada con éxito", "success").then(() => {
                        closeModal();
                        $('#currentPassword, #newPassword, #repeatPassword').val('');
                    });
                } else {
                    Swal.fire("Error", data.error, "error");
                }
            })
            .catch(error => {
                console.error("Error:", error);
                Swal.fire("Error", "Hubo un problema al cambiar la contraseña", "error");
            });
        });
    } else {
        console.error("Error: Element #changePasswordForm not found.");
    }

    //Funciones de tecla Escape y descarte de menús laterales

     document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            document.getElementById("sidebar")?.classList.add("-translate-x-full");
            document.getElementById("settingsPanel")?.classList.remove("translate-x-0");
        }
    });

    // Clic fuera para cerrar paneles
    document.addEventListener('click', function (event) {
        const sidebar = document.getElementById("sidebar");
        const settingsPanel = document.getElementById("settingsPanel");

        const clickedSidebarToggle = event.target.closest('[onclick="toggleSidebar()"]');
        const clickedSettingsToggle = event.target.closest('[onclick="toggleSettings()"]');

        // Cerrar sidebar si se hace clic fuera y no en el botón
        if (sidebar && !sidebar.contains(event.target) && !clickedSidebarToggle) {
            sidebar.classList.add("-translate-x-full");
        }

        // Cerrar settings si se hace clic fuera y no en el botón
        if (settingsPanel && !settingsPanel.contains(event.target) && !clickedSettingsToggle) {
            settingsPanel.classList.remove("translate-x-0");
        }
    });
    updateRealTimeClock(); //Relojito dinámico
    document.getElementById("agendaLink").click(); //Irse directo a la agenda
});

// Global DataTables initializer
function initializeDataTable(tableId) {
    $(tableId).DataTable({
        paging: true,
        searching: true,
        ordering: true,
        language: {
            url: "https://cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json"
        }
    });
}


// Helper functions
function closeModal() {
    document.getElementById("changePasswordModal").classList.add("hidden");
}

function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("-translate-x-full");
}

function toggleSettings() {
    document.getElementById("settingsPanel").classList.toggle("translate-x-0");
}

function updateRealTimeClock() {
    const clockElement = document.getElementById("realTimeClock");

    function formatTime(date) {
        return new Intl.DateTimeFormat('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            timeZone: 'America/Mexico_City'
        }).format(date);
    }

    function updateClock() {
        const now = new Date();
        clockElement.innerText = `Hora actual: ${formatTime(now)}`;
    }

    setInterval(updateClock, 1000); // Update every second
    updateClock(); // Initialize immediately
}

document.addEventListener("DOMContentLoaded", function () {
    
});