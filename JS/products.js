const productosLink = document.getElementById("productosLink");
if (productosLink) {
    productosLink.addEventListener("click", function (event) {
        event.preventDefault();
        loadProducts();
    });
} else {
    console.error("Error: Element #productosLink not found.");
}

function loadProducts(){
    document.getElementById("mainTitle").innerText = "Gestor de productos";
    const container = document.getElementById("mainContainer");

    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <button class="btn btn-success" onclick="openAddProductModal()">
                <i class="fas fa-plus"></i> Agregar Producto
            </button>
        </div>
    `;
}

function openAddProductModal() {
    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    modal.show();
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
