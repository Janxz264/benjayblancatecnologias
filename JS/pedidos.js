const pedidosLink = document.getElementById("pedidosLink");

let pedidosCache = [];

if (pedidosLink) {
    pedidosLink.addEventListener("click", function (event) {
        event.preventDefault();
        loadPedidos();
    });
} else {
    console.error("Error: Element #pedidosLink not found.");
}

function loadPedidos() {
    document.getElementById("mainTitle").innerText = "Gestor de pedidos";
    const container = document.getElementById("mainContainer");

    // Clear and insert the header + Add Product button
    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <button class="btn btn-success" onclick="openAddPedidoModal()">
                <i class="fas fa-plus"></i> Agregar Pedido
            </button>
        </div>
    `;

    fetch("../PHP/pedidohandler.php?action=VIEW")
        .then(response => response.json())
        .then(data => {
            if (!data || data.length === 0) {
                container.innerHTML += "<h1>No existen pedidos registrados en la base de datos.</h1>";
                return;
            }

            let tableHTML = `
                <table id="pedidosTable" class="table table-bordered table-striped">
                    <thead class="thead-dark">
                        <tr>
                            <th>Fecha de pedido</th>
                            <th>Fecha de entrega</th>
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

            data.forEach(pedido => {
                tableHTML += `
                    <tr>
                        <td>${safeText(pedido.FECHA_DE_PEDIDO)}</td>
                        <td>${safeText(pedido.FECHA_DE_ENTREGA)}</td>
                        <td>${safeText(pedido.NOMBRE_MARCA)}</td>
                        <td>${safeText(pedido.NOMBRE_PROVEEDOR)}</td>
                        <td>${safeText(pedido.MODELO)}</td>
                        <td>$${parseFloat(pedido.PRECIO_DISTRIBUIDOR).toFixed(2)}</td>
                        <td>$${parseFloat(pedido.PRECIO_DE_VENTA).toFixed(2)}</td>
                        <td>${safeText(pedido.NUMERO_DE_SERIE)}</td>
                        <td>
                            <button class="btn btn-primary btn-sm" onclick="editPedido(${pedido.ID_PEDIDO})">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                        </td>
                        <td>
                            <button class="btn btn-danger btn-sm" onclick="deletePedido(${pedido.ID_PEDIDO})">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>
                        </td>
                    </tr>
                `;
            });

            tableHTML += `</tbody></table>`;
            container.innerHTML += tableHTML;
            pedidosCache = data; // Store full product list globally

            // Refresh DataTable instance
            $('#pedidosTable').DataTable().destroy();
            initializeDataTable("#pedidosTable");
        })
        .catch(error => {
            console.error("Error fetching pedidos:", error);
            container.innerHTML += "<p>Error al obtener datos de pedidos.</p>";
        });
}

function deletePedido(id_pedido) {
    Swal.fire({
        title: '¿Está seguro de que desea eliminar este pedido?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        reverseButtons: true
    }).then(result => {
        if (result.isConfirmed) {
            fetch(`../PHP/pedidohandler.php?action=REMOVE`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: id_pedido })
            })
            .then(res => res.json())
            .then(response => {
                if (response.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Pedido eliminado',
                        text: 'El pedido fue eliminado correctamente.',
                        confirmButtonText: 'Cerrar'
                    });
                    loadPedidos(); // Refresh pedidos list
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: response.error || 'No se pudo eliminar el pedido.',
                        confirmButtonText: 'Cerrar'
                    });
                }
            })
            .catch(error => {
                console.error("Error al eliminar pedido:", error);
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

function openAddPedidoModal() {
  const modal = new bootstrap.Modal(document.getElementById('pedidoModal'));
  modal.show();

  document.getElementById('pedidoForm').reset();

  document.getElementById('productoSelect').disabled = false;
  document.getElementById('productoSelect').value = '';
  document.getElementById('addNewProductCheckbox').checked = false;
  document.getElementById('embeddedProductForm').classList.add('d-none');

  // Fetch product list dynamically
  fetch("../PHP/producthandler.php?action=VIEW")
    .then(res => res.json())
    .then(products => {
      const select = document.getElementById('productoSelect');
      select.innerHTML = '<option value="">-- Seleccione un producto --</option>';
      products.forEach(p => {
        const option = document.createElement('option');
        option.value = p.ID_PRODUCTO;
        option.textContent = `${p.MODELO} | ${p.NUMERO_DE_SERIE}`;
        select.appendChild(option);
      });
    });
}

function toggleNewProductMode() {
  const checkbox = document.getElementById('addNewProductCheckbox');
  const select = document.getElementById('productoSelect');
  const productWrapper = document.getElementById('embeddedProductForm');
  const productForm = document.getElementById('productForm');
  const productModal = document.getElementById('productModal');

  if (checkbox.checked) {
    select.value = '';
    select.disabled = true;
    productWrapper.classList.remove('d-none');

    // Hide the original modal so it doesn't conflict
    if (productModal) productModal.classList.add('d-none');

    // Move the form visually
    productWrapper.appendChild(productForm);

    // Reset form
    productForm.reset();
    retrieveBrands();
    retrieveProviders();
  } else {
    select.disabled = false;
    productWrapper.classList.add('d-none');

    // Return form to original modal location
    const modalBody = document.querySelector('#productModal .modal-body');
    if (modalBody && !modalBody.contains(productForm)) {
      modalBody.appendChild(productForm);
    }

    // Clear content visually
    productForm.reset();
    if (productModal) productModal.classList.remove('d-none');
  }
}
