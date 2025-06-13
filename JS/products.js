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