// login.js
$(document).ready(function () {
    $("#loginForm").submit(function (event) {
        event.preventDefault();
        event.stopPropagation();

        const username = $("#username").val().trim();
        const password = $("#password").val().trim();

        if (!username || !password) {
            Swal.fire({
                icon: "warning",
                title: "Campos requeridos",
                text: "Por favor ingresa tu usuario y contraseña",
                confirmButtonColor: "#005f5f"
            });
            return;
        }

        showSpinner("Iniciando sesión...");

        $.ajax({
            url: "/benjayblancatecnologias/PHP/login.php",
            type: "POST",
            data: { username, password },
            dataType: "json",
            success: function (response) {
                hideSpinner();

                if (response.success) {
                    Swal.fire({
                        icon: "success",
                        title: "Inicio de sesión exitoso",
                        text: "Redirigiendo...",
                        showConfirmButton: false,
                        timer: 1500
                    }).then(() => {
                        window.location.href = "HTML/dashboard.php";
                    });
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Error de inicio de sesión",
                        text: "Usuario o contraseña incorrectos",
                        confirmButtonColor: "#005f5f"
                    });
                }
            },
            error: function (xhr, status, error) {
                hideSpinner();

                Swal.fire({
                    icon: "error",
                    title: "Error del servidor",
                    html: `
                        <div style="max-height:400px;overflow:auto;border:1px solid #ccc;background:#fff;padding:10px;">
                            ${xhr.responseText}
                        </div>
                    `,
                    confirmButtonColor: "#005f5f"
                });
            }
        });
    });
});