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
    // Open modal
    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    modal.show();

    // Reset form fields
    document.getElementById('productForm').reset();

    // Uncheck and reset "Agregar nueva Marca"
    const marcaCheckbox = document.getElementById('addNewMarcaCheckbox');
    const marcaWrapper = document.getElementById('newMarcaFieldWrapper');
    const marcaInput = document.getElementById('newMarcaInput');
    const marcaSelect = document.getElementById('marcaSelect');

    marcaCheckbox.checked = false;
    marcaWrapper.classList.add('d-none');
    marcaInput.value = '';
    marcaSelect.disabled = false;
    marcaSelect.value = '';

    // Uncheck and reset "Agregar nuevo Proveedor"
    const proveedorCheckbox = document.getElementById('addNewProveedorCheckbox');
    const proveedorWrapper = document.getElementById('newProveedorFieldWrapper');
    const proveedorInput = document.getElementById('newProveedorInput');
    const proveedorSelect = document.getElementById('proveedorSelect');

    proveedorCheckbox.checked = false;
    proveedorWrapper.classList.add('d-none');
    proveedorInput.value = '';
    proveedorSelect.disabled = false;
    proveedorSelect.value = '';

    // You can optionally reset the hidden productId too
    document.getElementById('productId').value = '';
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
