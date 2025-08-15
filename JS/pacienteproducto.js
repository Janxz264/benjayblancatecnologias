const patientsProductsLink = document.getElementById("patientsProductsLink");
if (patientsProductsLink) {
    patientsProductsLink.addEventListener("click", function (event) {
        event.preventDefault();
        loadPatientsProducts();
    });
} else {
    console.error("Error: Element #patientsProductsLink not found.");
}

function loadPatientsProducts() {
    document.getElementById("mainTitle").innerText = "Productos por paciente";
    const container = document.getElementById("mainContainer");
    container.innerHTML = "";

    showSpinner("Cargando relación paciente-producto...");

    fetch("../PHP/pacienteproductohandler.php?action=VIEW")
        .then(response => response.json())
        .then(data => {
            hideSpinner();

            if (!data || data.length === 0) {
                container.innerHTML = "<h1>No existen ni pacientes ni productos registrados, registre uno en la sección que corresponda.</h1>";
                return;
            }

            const grouped = {};
            let orphanProducts = [];

            data.forEach(item => {
                if (item.ID_PACIENTE) {
                    if (!grouped[item.ID_PACIENTE]) {
                        grouped[item.ID_PACIENTE] = {
                            nombre: item.NOMBRE_COMPLETO,
                            productos: []
                        };
                    }
                    if (item.ID_PRODUCTO) {
                        grouped[item.ID_PACIENTE].productos.push(item);
                    }
                } else if (item.ID_PRODUCTO) {
                    orphanProducts.push(item);
                }
            });

            const totalProducts = data.filter(item => item.ID_PRODUCTO).length;
            const linkedProducts = data.filter(item => item.ID_PRODUCTO && item.ID_PACIENTE).length;

            if (Object.keys(grouped).length > 0 && totalProducts > 0 && linkedProducts === 0) {
                container.innerHTML = `
                    <h1>Hay productos registrados pero ninguno está asignado a un paciente.</h1>
                    <p>Puede asignarlos desde la sección correspondiente.</p>
                `;
                return;
            }

            let tableHTML = "";

            if (Object.keys(grouped).length > 0) {
                tableHTML += `
                    <table id="pacienteProductosTable" class="table table-bordered table-striped">
                        <thead class="thead-dark">
                            <tr>
                                <th>Paciente</th>
                                <th># Productos</th>
                                <th>Lista de Productos</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                `;

                Object.entries(grouped).forEach(([idPaciente, info]) => {
                    const productosHTML = info.productos.map(prod => `
                        <div class="border p-2 mb-2 rounded bg-light">
                            <strong>${safeText(prod.MODELO)}</strong><br>
                            Serie: ${safeText(prod.NUMERO_DE_SERIE)}<br>
                            Marca: ${safeText(prod.NOMBRE_MARCA)}<br>
                            Proveedor: ${safeText(prod.NOMBRE_PROVEEDOR)}<br>
                            Precio: $${parseFloat(prod.PRECIO_DE_VENTA).toFixed(2)}<br>
                            <button class="btn btn-danger btn-sm mt-1" onclick="unlinkProducto(${prod.ID_PRODUCTO})">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>
                        </div>
                    `).join("");

                    tableHTML += `
                        <tr>
                            <td>${safeText(info.nombre)}</td>
                            <td>${info.productos.length}</td>
                            <td>${productosHTML || "<em>Sin productos asignados</em>"}</td>
                            <td>
                                <button class="btn btn-success btn-sm" onclick="openAvailableProductsModal(${idPaciente})">
                                    <i class="fas fa-plus"></i> Agregar Producto
                                </button>
                            </td>
                        </tr>
                    `;
                });

                tableHTML += `</tbody></table>`;
            }

            if (orphanProducts.length > 0 && Object.keys(grouped).length === 0) {
                container.innerHTML = "<h1>No existe ningún paciente al cuál asignarle un producto, registre un paciente para poder vincular el producto al mismo.</h1>";
                return;
            }

            container.innerHTML = tableHTML;

            if (tableHTML) {
                $('#pacienteProductosTable').DataTable().destroy();
                initializeDataTable("#pacienteProductosTable");
            }
        })
        .catch(error => {
            hideSpinner();
            console.error("Error fetching paciente-producto data:", error);
            container.innerHTML = "<p class='text-danger'>Error al obtener productos por paciente.</p>";
        });
}

function unlinkProducto(idProducto) {
    Swal.fire({
        title: '¿Estás seguro?',
        text: 'El producto se desvinculará del paciente y estará disponible para otro paciente.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, quitar',
        cancelButtonText: 'Cancelar'
    }).then(result => {
        if (result.isConfirmed) {
            fetch('../PHP/pacienteproductohandler.php?action=REMOVE', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `idProducto=${encodeURIComponent(idProducto)}`
            })
            .then(res => res.json())
            .then(response => {
                if (response.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Producto desvinculado',
                        text: response.message || 'El producto ha sido removido del paciente.',
                        confirmButtonText: 'Entendido'
                    }).then(() => {
                        // RELOAD ON SUCCES
                        loadPatientsProducts();
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: response.error || 'No se pudo quitar el producto.',
                        confirmButtonText: 'Cerrar'
                    });
                }
            })
            .catch(err => {
                console.error("Error unlinking product:", err);
                Swal.fire({
                    icon: 'error',
                    title: 'Error de conexión',
                    text: 'No se pudo conectar con el servidor.',
                    confirmButtonText: 'Cerrar'
                });
            });
        }
    });
}

function openAvailableProductsModal(idPaciente, onSelectCallback = null) {
    // Remove existing modal if present
    const existingModal = document.getElementById("availableProductsModal");
    if (existingModal) existingModal.remove();

    // Create modal container
    const modal = document.createElement("div");
    modal.id = "availableProductsModal";
    modal.className = "position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center";
    modal.style.backgroundColor = "rgba(0,0,0,0.5)";
    modal.style.zIndex = "1050";

    // Inner modal content
    modal.innerHTML = `
        <div class="custom-form-bg p-4 rounded shadow" style="min-width: 300px;">
            <h5 class="mb-3">Añade los productos para el paciente:</h5>
            <div id="availableProductList" class="mb-3" style="max-height: 300px; overflow-y: auto;">
                <p>Cargando productos...</p>
            </div>
            <div class="d-flex justify-content-end">
                <button class="btn btn-danger me-2" onclick="document.getElementById('availableProductsModal').remove()">Cerrar</button>
                <button class="btn btn-success" onclick="assignSelectedProducts(${idPaciente})">Añadir producto(s) al cliente</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Fetch available products
    fetch(`../PHP/pacienteproductohandler.php?action=VIEWAVAILABLEPRODUCTS&idPaciente=${idPaciente}`)
        .then(res => res.json())
        .then(products => {

            if (!products || products.length === 0) {
                Swal.fire({
                    icon: 'info',
                    title: 'Sin productos disponibles',
                    text: 'No hay productos que puedan asignarse en este momento a este paciente.',
                    confirmButtonText: 'Entendido'
                }).then(() => {
                    // Close modal after alert is acknowledged
                    const modalToClose = document.getElementById("availableProductsModal");
                    if (modalToClose) modalToClose.remove();
                });
                return;
            }

            const list = document.getElementById("availableProductList");
            list.innerHTML = "";

            products.forEach(prod => {
                const wrapper = document.createElement("div");
                wrapper.className = "form-check";

                wrapper.innerHTML = `
                    <input class="form-check-input" type="checkbox" value="${prod.ID_PRODUCTO}" id="prod_${prod.ID_PRODUCTO}">
                    <label class="form-check-label" for="prod_${prod.ID_PRODUCTO}">
                        ${prod.MODELO} - ${prod.NUMERO_DE_SERIE || "Sin serie"}
                    </label>
                `;
                list.appendChild(wrapper);
            });

        })
        .catch(err => {
            console.error("Error fetching available products:", err);
            const select = document.getElementById("availableProductSelect");
            select.innerHTML = `<option disabled selected>Error al cargar productos</option>`;
        });

    // Selection handler
    window.handleProductSelection = function () {
        const selectedIds = Array.from(document.querySelectorAll("#availableProductList input:checked"))
            .map(input => input.value);

        if (selectedIds.length === 0) return;

        if (typeof onSelectCallback === "function") {
            onSelectCallback(selectedIds);
        }

        modal.remove();
    };
}

function assignProductToPatient(productIds, idPaciente) {
    showSpinner("Asignando productos al paciente...");

    const formData = new FormData();
    formData.append("idPaciente", idPaciente);
    productIds.forEach(id => formData.append("idProducto[]", id));

    fetch("../PHP/pacienteproductohandler.php?action=ADD", {
        method: "POST",
        body: formData
    })
    .then(res => res.json())
    .then(response => {
        hideSpinner();
        console.log(response.message);
        Swal.fire({
            icon: 'success',
            title: 'Productos asignados',
            text: response.message || 'Los productos fueron asignados correctamente.',
            timer: 2000,
            showConfirmButton: false
        });
        loadPatientsProducts();
    })
    .catch(err => {
        hideSpinner();
        console.error("Error en la asignación múltiple:", err);
        Swal.fire({
            icon: 'error',
            title: 'Error al asignar productos',
            text: 'Ocurrió un problema al intentar asignar los productos. Intenta nuevamente.',
            confirmButtonText: 'Cerrar'
        });

        const assignBtn = document.querySelector("#availableProductsModal .btn-success");
        if (assignBtn) assignBtn.disabled = false;
    });
}

function assignSelectedProducts(idPaciente) {
    const selectedIds = Array.from(document.querySelectorAll("#availableProductList input:checked"))
        .map(input => input.value);

    if (selectedIds.length === 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Ningún producto seleccionado',
            text: 'Por favor selecciona al menos un producto para asignar.',
            confirmButtonText: 'Entendido'
        });
        return;
    }

    const assignBtn = document.querySelector("#availableProductsModal .btn-success");
    if (assignBtn) assignBtn.disabled = true;

    assignProductToPatient(selectedIds, idPaciente);

    const modal = document.getElementById("availableProductsModal");
    if (modal) modal.remove();
}