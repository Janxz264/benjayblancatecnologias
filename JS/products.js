const productosLink = document.getElementById("productosLink");
if (productosLink) {
    productosLink.addEventListener("click", function (event) {
        event.preventDefault();
        loadProducts();
    });
} else {
    console.error("Error: Element #productosLink not found.");
}

function loadProducts() {
    document.getElementById("mainTitle").innerText = "Gestor de productos";
    const container = document.getElementById("mainContainer");

    // Clear and insert the header + Add Product button
    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <button class="btn btn-success" onclick="openAddProductModal()">
                <i class="fas fa-plus"></i> Agregar Producto
            </button>
        </div>
    `;

    fetch("../PHP/producthandler.php?action=VIEW")
        .then(response => response.json())
        .then(data => {
            if (!data || data.length === 0) {
                container.innerHTML += "<h1>No existen productos registrados en la base de datos.</h1>";
                return;
            }

            let tableHTML = `
                <table id="productsTable" class="table table-bordered table-striped">
                    <thead class="thead-dark">
                        <tr>
                            <th>Marca</th>
                            <th>Proveedor</th>
                            <th>Modelo</th>
                            <th>Precio Distribuidor</th>
                            <th>Precio de Venta</th>
                            <th>Número de Serie</th>
                            <th>Editar</th>
                            <th>Eliminar</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            data.forEach(product => {
                tableHTML += `
                    <tr>
                        <td>${safeText(product.NOMBRE_MARCA)}</td>
                        <td>${safeText(product.NOMBRE_PROVEEDOR)}</td>
                        <td>${safeText(product.MODELO)}</td>
                        <td>$${parseFloat(product.PRECIO_DISTRIBUIDOR).toFixed(2)}</td>
                        <td>$${parseFloat(product.PRECIO_DE_VENTA).toFixed(2)}</td>
                        <td>${safeText(product.NUMERO_DE_SERIE)}</td>
                        <td>
                            <button class="btn btn-primary btn-sm" onclick="editProduct(${product.ID_PRODUCTO})">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                        </td>
                        <td>
                            <button class="btn btn-danger btn-sm" onclick="deleteProduct(${product.ID_PRODUCTO})">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>
                        </td>
                    </tr>
                `;
            });

            tableHTML += `</tbody></table>`;
            container.innerHTML += tableHTML;

            // Refresh DataTable instance
            $('#productsTable').DataTable().destroy();
            initializeDataTable("#productsTable");
        })
        .catch(error => {
            console.error("Error fetching products:", error);
            container.innerHTML += "<p>Error al obtener datos de productos.</p>";
        });
}

function openAddProductModal() {
    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    modal.show();

    document.getElementById('productForm').reset();

    // Reset Marca
    const marcaCheckbox = document.getElementById('addNewMarcaCheckbox');
    document.getElementById('newMarcaFieldWrapper').classList.add('d-none');
    document.getElementById('newMarcaInput').value = '';
    const marcaSelect = document.getElementById('marcaSelect');
    marcaCheckbox.checked = false;
    marcaSelect.disabled = false;
    marcaSelect.value = '';

    // Reset Proveedor
    const proveedorCheckbox = document.getElementById('addNewProveedorCheckbox');
    document.getElementById('newProveedorFieldWrapper').classList.add('d-none');
    document.getElementById('newProveedorInput').value = '';
    const proveedorSelect = document.getElementById('proveedorSelect');
    proveedorCheckbox.checked = false;
    proveedorSelect.disabled = false;
    proveedorSelect.value = '';

    document.getElementById('productId').value = '';

    // Load dropdowns
    retrieveBrands();
    retrieveProviders();
}


function retrieveBrands() {
    fetch("../PHP/producthandler.php?action=RETRIEVEBRANDS")
        .then(response => response.json())
        .then(brands => {
            const marcaSelect = document.getElementById('marcaSelect');
            marcaSelect.innerHTML = '<option value="">-- Seleccione una marca --</option>';
            brands.forEach(brand => {
                const option = document.createElement('option');
                option.value = brand.ID_MARCA;
                option.textContent = brand.NOMBRE;
                marcaSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error("Error al recuperar marcas:", error);
        });
}

function retrieveProviders() {
    fetch("../PHP/producthandler.php?action=RETRIEVEPROVIDERS")
        .then(response => response.json())
        .then(providers => {
            const proveedorSelect = document.getElementById('proveedorSelect');
            proveedorSelect.innerHTML = '<option value="">-- Seleccione un proveedor --</option>';
            providers.forEach(provider => {
                const option = document.createElement('option');
                option.value = provider.ID_PROVEEDOR;
                option.textContent = provider.NOMBRE;
                proveedorSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error("Error al recuperar proveedores:", error);
        });
}

function toggleNewMarcaFields() {
    const checkbox = document.getElementById('addNewMarcaCheckbox');
    const wrapper = document.getElementById('newMarcaFieldWrapper');
    const input = document.getElementById('newMarcaInput');
    const select = document.getElementById('marcaSelect');

    if (checkbox.checked) {
        wrapper.classList.remove('d-none');
        select.value = '';
        select.disabled = true;
    } else {
        wrapper.classList.add('d-none');
        input.value = '';
        select.disabled = false;
    }
}

function toggleNewProveedorFields() {
    const checkbox = document.getElementById('addNewProveedorCheckbox');
    const wrapper = document.getElementById('newProveedorFieldWrapper');
    const input = document.getElementById('newProveedorInput');
    const select = document.getElementById('proveedorSelect');

    if (checkbox.checked) {
        wrapper.classList.remove('d-none');
        select.value = '';
        select.disabled = true;
    } else {
        wrapper.classList.add('d-none');
        input.value = '';
        select.disabled = false;
    }
}

//Función para guardar un nuevo producto

document.getElementById('saveProductBtn').addEventListener('click', function (e) {
    e.preventDefault();

    const marcaCheckbox = document.getElementById('addNewMarcaCheckbox');
    const proveedorCheckbox = document.getElementById('addNewProveedorCheckbox');

    const marcaSelect = document.getElementById('marcaSelect');
    const newMarcaInput = document.getElementById('newMarcaInput');
    const proveedorSelect = document.getElementById('proveedorSelect');
    const newProveedorInput = document.getElementById('newProveedorInput');

    const modeloInput = document.getElementById('modeloInput');
    const precioDistribuidorInput = document.getElementById('precioDistribuidor');
    const precioVentaInput = document.getElementById('precioVenta');
    const numeroSerieInput = document.getElementById('numeroSerie');

    let errors = [];

    let marcaData = null;
    if (marcaCheckbox.checked) {
        if (newMarcaInput.value.trim() === "") {
            errors.push("Ingrese el nombre de la nueva marca.");
        } else {
            marcaData = { nuevaMarca: newMarcaInput.value.trim() };
        }
    } else {
        if (marcaSelect.value === "") {
            errors.push("Seleccione una marca válida.");
        } else {
            marcaData = { idMarca: parseInt(marcaSelect.value) };
        }
    }

    let proveedorData = null;
    if (proveedorCheckbox.checked) {
        if (newProveedorInput.value.trim() === "") {
            errors.push("Ingrese el nombre del nuevo proveedor.");
        } else {
            proveedorData = { nuevoProveedor: newProveedorInput.value.trim() };
        }
    } else {
        if (proveedorSelect.value === "") {
            errors.push("Seleccione un proveedor válido.");
        } else {
            proveedorData = { idProveedor: parseInt(proveedorSelect.value) };
        }
    }

    const modelo = modeloInput.value.trim();
    if (modelo === "") {
        errors.push("El modelo es obligatorio.");
    }

    const precioDistribuidor = parseFloat(precioDistribuidorInput.value);
    const precioVenta = parseFloat(precioVentaInput.value);
    if (isNaN(precioDistribuidor) || precioDistribuidor < 0) {
        errors.push("Precio de distribuidor inválido.");
    }
    if (isNaN(precioVenta) || precioVenta < 0) {
        errors.push("Precio de venta inválido.");
    }

    const numeroSerie = numeroSerieInput.value.trim();
    if (numeroSerie === "") {
        errors.push("El número de serie es obligatorio.");
    }

    if (errors.length > 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Errores en el formulario',
            html: `<ul style='text-align:left;'>${errors.map(e => `<li>${e}</li>`).join('')}</ul>`,
            confirmButtonText: 'Corregir'
        });
        return;
    }

    const payload = {
        ...marcaData,
        ...proveedorData,
        modelo,
        precioDistribuidor,
        precioVenta,
        numeroSerie
    };

    fetch("../PHP/producthandler.php?action=ADD", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(response => {
        if (response.success) {
            Swal.fire({
                icon: 'success',
                title: 'Producto guardado',
                text: 'El producto fue registrado correctamente.',
                confirmButtonText: 'Cerrar'
            }).then(() => {
            document.getElementById("productForm").reset();

            // Get existing modal instance and close it
            const modalEl = document.getElementById('productModal');
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) modalInstance.hide();

            loadProducts(); // Refresh product table
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error al guardar',
                text: response.error || 'Error inesperado en el servidor.',
                confirmButtonText: 'Cerrar'
            });
        }
    })
    .catch(err => {
        console.error("Error en la solicitud:", err);
        Swal.fire({
            icon: 'error',
            title: 'Error de red',
            text: 'No se pudo enviar el formulario. Intenta nuevamente.',
            confirmButtonText: 'Cerrar'
        });
    });
});