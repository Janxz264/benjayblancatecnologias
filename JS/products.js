const productosLink = document.getElementById("productosLink");

let productsCache = [];

let currentEditMode = false;

if (productosLink) {
    productosLink.addEventListener("click", function (event) {
        event.preventDefault();
        loadProducts();
    });
} else {
    console.error("Error: Element #productosLink not found.");
}

function formatAsDecimal(input) {
    input.addEventListener('input', () => {
        let value = input.value;

        // Allow only digits and one optional dot
        value = value.replace(/[^0-9.]/g, '');

        // If multiple dots, keep only the first
        const parts = value.split('.');
        const integerPart = parts[0];
        const decimalPart = parts[1] ? parts[1].slice(0, 2) : '';

        input.value = parts.length > 1 ? `${integerPart}.${decimalPart}` : integerPart;
    });
}

// Apply to both price fields
formatAsDecimal(document.getElementById('precioDistribuidor'));
formatAsDecimal(document.getElementById('precioVenta'));

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
            productsCache = data; // Store full product list globally

            // Refresh DataTable instance
            $('#productsTable').DataTable().destroy();
            initializeDataTable("#productsTable");
        })
        .catch(error => {
            console.error("Error fetching products:", error);
            container.innerHTML += "<p>Error al obtener datos de productos.</p>";
        });
}

function openAddProductModal(isEditMode = false) {
    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    modal.show();

    document.getElementById('productForm').reset();
    currentEditMode = isEditMode;

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

    //Reset Garantía
    const garantiaCheckbox = document.getElementById('hasWarrantyCheckbox');
    garantiaCheckbox.checked = false;
    document.getElementById('warrantyFieldsWrapper').classList.add('d-none');

    document.getElementById('productId').value = '';

    // Load dropdowns
    retrieveBrands();
    retrieveProviders();
}

function editProduct(id_producto) {
    const product = productsCache.find(p => p.ID_PRODUCTO === id_producto);
    if (!product) {
        Swal.fire({
            icon: 'error',
            title: 'Producto no encontrado',
            text: 'No se pudo localizar el producto en caché.',
            confirmButtonText: 'Cerrar'
        });
        return;
    }

    // Open modal and preload dropdowns
    openAddProductModal(true); // pass edit mode flag

    // Load dropdowns and set selected values once populated
    retrieveBrands(() => {
        document.getElementById('marcaSelect').value = product.ID_MARCA;
    });

    retrieveProviders(() => {
        document.getElementById('proveedorSelect').value = product.ID_PROVEEDOR;
    });

    // Fill other fields immediately
    document.getElementById('productId').value = product.ID_PRODUCTO;
    document.getElementById('modeloInput').value = product.MODELO;
    document.getElementById('precioDistribuidor').value = parseFloat(product.PRECIO_DISTRIBUIDOR).toFixed(2);
    document.getElementById('precioVenta').value = parseFloat(product.PRECIO_DE_VENTA).toFixed(2);
    document.getElementById('numeroSerie').value = product.NUMERO_DE_SERIE;
}

function retrieveBrands(callback) {
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
            if (typeof callback === 'function') callback();
        })
        .catch(error => {
            console.error("Error al recuperar marcas:", error);
        });
}

function retrieveProviders(callback) {
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
            if (typeof callback === 'function') callback();
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

function deleteProduct(id_producto) {
    Swal.fire({
        title: '¿Está seguro de que desea eliminar este producto?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        reverseButtons: true
    }).then(result => {
        if (result.isConfirmed) {
            fetch(`../PHP/producthandler.php?action=REMOVE`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: id_producto })
            })
            .then(res => res.json())
            .then(response => {
                if (response.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Producto eliminado',
                        text: 'El producto fue eliminado correctamente.',
                        confirmButtonText: 'Cerrar'
                    });
                    loadProducts(); // Refresh product list
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: response.error || 'No se pudo eliminar el producto.',
                        confirmButtonText: 'Cerrar'
                    });
                }
            })
            .catch(error => {
                console.error("Error al eliminar producto:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error de red',
                    text: 'No se pudo contactar al servidor.',
                    confirmButtonText: 'Cerrar'
                });
            });
        }
    });
}

//Función para guardar un nuevo producto

document.getElementById('saveProductBtn').addEventListener('click', function (e) {
    const productId = document.getElementById("productId").value;
    const isEdit = productId !== "";

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

    fetch(`../PHP/producthandler.php?action=${isEdit ? 'EDIT' : 'ADD'}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            ...marcaData,
            ...proveedorData,
            modelo,
            precioDistribuidor,
            precioVenta,
            numeroSerie,
            ...(isEdit && { id: parseInt(productId) }) // send ID only if editing
        })
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

function toggleWarrantyFields() {
    const checkbox = document.getElementById('hasWarrantyCheckbox');
    const wrapper = document.getElementById('warrantyFieldsWrapper');
    const fechaInicio = document.getElementById('fechaInicio');
    const fechaFin = document.getElementById('fechaFin');

    if (checkbox.checked) {
        wrapper.classList.remove('d-none');

        // Set today's date as default start
        const today = new Date().toISOString().split('T')[0];
        fechaInicio.value = today;

        // Trigger auto-calculation of end date
        autoCalculateEndDate();
    } else {
        wrapper.classList.add('d-none');
        fechaInicio.value = '';
        fechaFin.value = '';
    }
}

function autoCalculateEndDate() {
    const fechaInicio = document.getElementById('fechaInicio');
    const fechaFin = document.getElementById('fechaFin');

    const startDate = new Date(fechaInicio.value);
    if (isNaN(startDate)) return;

    const defaultEnd = new Date(startDate);
    defaultEnd.setMonth(defaultEnd.getMonth() + 6);

    // Only auto-set if user hasn't manually modified fechaFin
    const userModified = fechaFin.getAttribute('data-user-modified') === 'true';
    if (!userModified) {
        const formattedEnd = defaultEnd.toISOString().split('T')[0];
        fechaFin.value = formattedEnd;
    }
}

document.getElementById('fechaInicio').addEventListener('change', autoCalculateEndDate);
document.getElementById('fechaFin').addEventListener('input', function () {
    this.setAttribute('data-user-modified', 'true');
});
