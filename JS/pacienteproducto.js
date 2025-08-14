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

function openAssignProductoModal(idPaciente) {
    // Open modal to assign a product to this patient
}