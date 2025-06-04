$(document).ready(function () {
    $("#loginForm").submit(function (event) {
        event.preventDefault(); // Stop the form from submitting traditionally
        event.stopPropagation(); // Ensures JavaScript fully intercepts it

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

        $.ajax({
            url: "/benjayblancatecnologias/PHP/login.php", // Absolute path to avoid routing errors
            type: "POST",
            data: { username, password },
            dataType: "json",
            success: function (response) {
                console.log("Response:", response);

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
                console.error("AJAX Error:", error);
                Swal.fire({
                    icon: "error",
                    title: "Error inesperado",
                    text: "Hubo un problema con el servidor. Inténtalo de nuevo más tarde.",
                    confirmButtonColor: "#005f5f"
                });
            }
        });
    });
});
