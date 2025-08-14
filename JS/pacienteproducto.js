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
                                <button class="btn btn-success btn-sm" onclick="openAssignProductoModal(${idPaciente})">
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
    // Confirm and send unlink request
}

function openAvailableProductsModal(onSelectCallback = null) {
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
        <div class="bg-white p-4 rounded shadow" style="min-width: 300px;">
            <h5 class="mb-3">Seleccionar producto disponible</h5>
            <select id="availableProductSelect" class="form-select mb-3">
                <option disabled selected>Cargando productos...</option>
            </select>
            <div class="d-flex justify-content-end">
                <button class="btn btn-secondary me-2" onclick="document.getElementById('availableProductsModal').remove()">Cerrar</button>
                <button class="btn btn-primary" onclick="handleProductSelection()">Seleccionar</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Fetch available products
    fetch("../PHP/pacienteproductohandler.php?action=VIEWAVAILABLEPRODUCTS")
        .then(res => res.json())
        .then(products => {
            const select = document.getElementById("availableProductSelect");
            select.innerHTML = "";

            if (!products || products.length === 0) {
                select.innerHTML = `<option disabled selected>No hay productos disponibles</option>`;
                return;
            }

            products.forEach(prod => {
                const option = document.createElement("option");
                option.value = prod.ID_PRODUCTO;
                option.textContent = `${prod.MODELO} - ${prod.NUMERO_DE_SERIE || "Sin serie"}`;
                select.appendChild(option);
            });
        })
        .catch(err => {
            console.error("Error fetching available products:", err);
            const select = document.getElementById("availableProductSelect");
            select.innerHTML = `<option disabled selected>Error al cargar productos</option>`;
        });

    // Selection handler
    window.handleProductSelection = function () {
        const select = document.getElementById("availableProductSelect");
        const selectedId = select.value;
        if (!selectedId) return;

        if (typeof onSelectCallback === "function") {
            onSelectCallback(selectedId);
        }

        modal.remove();
    };
}