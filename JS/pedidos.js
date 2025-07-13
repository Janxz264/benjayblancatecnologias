const pedidosLink = document.getElementById("pedidosLink");

let pedidosCache = [];
let availableProducts = []; // Fetched from backend
let selectedProducts = [];
let savedFechaPedido = null;

function renderProductLists() {
  const availableList = document.getElementById("availableProductsList");
  const selectedList = document.getElementById("selectedProductsList");

  availableList.innerHTML = '';
  selectedList.innerHTML = '';

  // Sort both arrays alphabetically by product.MODELO (case-insensitive)
  const sortedAvailable = [...availableProducts].sort((a, b) =>
    a.MODELO.localeCompare(b.MODELO, 'es', { sensitivity: 'base' })
  );
  const sortedSelected = [...selectedProducts].sort((a, b) =>
    a.MODELO.localeCompare(b.MODELO, 'es', { sensitivity: 'base' })
  );

  // Render available products
  sortedAvailable.forEach(product => {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between align-items-center";
    li.innerHTML = `
      ${product.MODELO} <span class="badge bg-primary cursor-pointer" onclick="addProduct(${product.ID_PRODUCTO})"><i class="fas fa-plus"></i></span>
    `;
    availableList.appendChild(li);
  });

  // Render selected products
  sortedSelected.forEach(product => {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between align-items-center bg-light";
    li.innerHTML = `
      ${product.MODELO} <span class="badge bg-danger cursor-pointer" onclick="removeProduct(${product.ID_PRODUCTO})"><i class="fas fa-times"></i></span>
    `;
    selectedList.appendChild(li);
  });
}

function addProduct(productID) {
  const index = availableProducts.findIndex(p => p.ID_PRODUCTO === productID);
  if (index !== -1) {
    selectedProducts.push(availableProducts[index]);
    availableProducts.splice(index, 1);
    renderProductLists();
  }
}

function removeProduct(productID) {
  const index = selectedProducts.findIndex(p => p.ID_PRODUCTO === productID);
  if (index !== -1) {
    availableProducts.push(selectedProducts[index]);
    selectedProducts.splice(index, 1);
    renderProductLists();
  }
}

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
                            <th>No. de pedido</th>
                            <th>Fecha de pedido</th>
                            <th>Fecha de entrega</th>
                            <th>No. de productos</th>
                            <th>Ver productos</th>
                            <th>Editar</th>
                            <th>Eliminar</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            data.forEach(pedido => {
                const productos = Array.isArray(pedido.PRODUCTOS) ? pedido.PRODUCTOS : [];
                const numProductos = productos.length;

                tableHTML += `
                    <tr>
                        <td>${pedido.ID_PEDIDO}</td>
                        <td>${safeText(pedido.FECHA_DE_PEDIDO)}</td>
                        <td>${safeText(pedido.FECHA_DE_ENTREGA)}</td>
                        <td>${numProductos}</td>
                        <td>
                            <button class="btn btn-info btn-sm" onclick="verProductos(${pedido.ID_PEDIDO})">
                                <i class="fas fa-box-open"></i> Ver productos
                            </button>
                        </td>
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
            pedidosCache = data; // Cache for later use (e.g. verProductos modal)

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

function retrieveProductos() {
    return fetch("../PHP/producthandler.php?action=VIEW")
        .then(res => {
            if (!res.ok) throw new Error("No se pudo obtener la lista de productos.");
            return res.json();
        })
        .then(data => Array.isArray(data) ? data : [])
        .catch(err => {
            console.error("Error al recuperar productos:", err);
            Swal.fire("Error", err.message, "error");
            return [];
        });
}

function openAddPedidoModal() {
    const modal = new bootstrap.Modal(document.getElementById('pedidoModal'));
    modal.show();

    document.getElementById('pedidoForm').reset();
    document.getElementById('embeddedProductForm').classList.add('d-none');

    // Clear product arrays for fresh modal state
    availableProducts = [];
    selectedProducts = [];

    // Fetch product list dynamically
    retrieveProductos().then(products => {
        availableProducts = products;
        renderProductLists(); // Refresh UI with both lists
    });
}

function fixFechaPedido() {
  const fechaPedidoInput = document.getElementById('fechaPedido');
  savedFechaPedido = fechaPedidoInput.value || null;
  fechaPedidoInput.value = ''; // visually clears the field while the modal is away
}

document.getElementById('savePedidoBtn').addEventListener('click', function (e) {
  e.preventDefault();

  const isEdit = false; // add edit logic later if needed
  const errors = [];

  const fechaPedido = document.getElementById('fechaPedido').value;
  const fechaEntrega = document.getElementById('fechaEntrega').value;

  // Validación de fechas
  if (!fechaPedido) {
    errors.push("La fecha de pedido es obligatoria.");
  }
  if (fechaEntrega && new Date(fechaEntrega) < new Date(fechaPedido)) {
    errors.push("La fecha de entrega no puede ser anterior a la fecha de pedido.");
  }

  let pedidoPayload = {
    fechaPedido,
    ...(fechaEntrega && { fechaEntrega })
  };

    if (!Array.isArray(selectedProducts) || selectedProducts.length === 0) {
    errors.push("Debe agregar al menos un producto al pedido.");
  } else {
    const selectedIds = selectedProducts.map(p => parseInt(p.ID_PRODUCTO));
    pedidoPayload.productos = selectedIds;
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

  fetch(`../PHP/pedidohandler.php?action=${isEdit ? 'EDIT' : 'ADD'}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pedidoPayload)
  })
    .then(res => res.json())
    .then(response => {
      if (response.success) {
        Swal.fire({
          icon: 'success',
          title: 'Pedido registrado',
          text: 'El pedido fue procesado correctamente.',
          confirmButtonText: 'Cerrar'
        }).then(() => {
          document.getElementById("pedidoForm").reset();
          document.getElementById("productForm")?.reset(); // optional cleanup
          const modalEl = document.getElementById('pedidoModal');
          const modalInstance = bootstrap.Modal.getInstance(modalEl);
          if (modalInstance) modalInstance.hide();
          loadPedidos(); // Refresh your pedidos listing
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

function verProductos(pedidoID) {
    const pedido = pedidosCache.find(p => p.ID_PEDIDO === pedidoID);

    if (!pedido || !Array.isArray(pedido.PRODUCTOS) || pedido.PRODUCTOS.length === 0) {
        alert("Este pedido no tiene productos asociados.");
        return;
    }

    // Build modal HTML
    const modalHTML = `
        <div class="modal fade" id="productosModal" tabindex="-1" aria-labelledby="productosModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header custom-header-bg text-white">
                        <h5 class="modal-title" id="productosModalLabel">Productos del Pedido #${pedidoID}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                    </div>
                    <div class="modal-body">
                        <table id="productosTable" class="table table-bordered table-hover">
                            <thead class="table-dark">
                                <tr>
                                    <th>Marca</th>
                                    <th>Proveedor</th>
                                    <th>Modelo</th>
                                    <th>Precio Distribuidor</th>
                                    <th>Precio de Venta</th>
                                    <th>Número de Serie</th>
                                    <th>Quitar</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${pedido.PRODUCTOS.map(prod => `
                                    <tr class="table-light" data-id="${prod.ID_PRODUCTO}" data-pedido="${pedidoID}">
                                        <td>${safeText(prod.NOMBRE_MARCA)}</td>
                                        <td>${safeText(prod.NOMBRE_PROVEEDOR)}</td>
                                        <td>${safeText(prod.MODELO)}</td>
                                        <td>$${parseFloat(prod.PRECIO_DISTRIBUIDOR).toFixed(2)}</td>
                                        <td>$${parseFloat(prod.PRECIO_DE_VENTA).toFixed(2)}</td>
                                        <td>${safeText(prod.NUMERO_DE_SERIE)}</td>
                                        <td>
                                            <button class="btn btn-sm btn-danger" onclick="quitarProductodePedido(${prod.ID_PRODUCTO}, ${pedidoID})">
                                                <i class="fas fa-times"></i> Quitar
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        <button class="btn btn-success" onclick="agregarProductoAPedido(${pedidoID})">
                            <i class="fas fa-plus"></i> Agregar Producto
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Inject and show the modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modalElement = new bootstrap.Modal(document.getElementById('productosModal'));
    modalElement.show();

setTimeout(() => {
    initializeDataTable("#productosTable");
}, 600);


    // Cleanup on modal close
    document.getElementById('productosModal').addEventListener('hidden.bs.modal', () => {
        document.getElementById('productosModal').remove();
    });
}

function quitarProductodePedido(ID_PRODUCTO, ID_PEDIDO) {
    Swal.fire({
        title: '¿Desea quitar este producto del pedido?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, quitarlo',
        cancelButtonText: 'Cancelar',
        reverseButtons: true
    }).then(result => {
        if (result.isConfirmed) {
            fetch("../PHP/pedidohandler.php?action=REMOVEPRODUCTO", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id_producto: ID_PRODUCTO, id_pedido: ID_PEDIDO })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Remove product row from modal
                    const row = document.querySelector(`#productosTable tr[data-id='${ID_PRODUCTO}']`);
                    if (row) row.remove();

                    // Update pedidosCache
                    const pedido = pedidosCache.find(p => p.ID_PEDIDO === ID_PEDIDO);
                    if (pedido && Array.isArray(pedido.PRODUCTOS)) {
                        pedido.PRODUCTOS = pedido.PRODUCTOS.filter(p => p.ID_PRODUCTO !== ID_PRODUCTO);
                    }

                    // Update the main table count cell
                    const mainTableRows = document.querySelectorAll(`#pedidosTable tbody tr`);
                    mainTableRows.forEach(tr => {
                        const cells = tr.querySelectorAll("td");
                        if (parseInt(cells[0]?.innerText) === ID_PEDIDO) {
                            const countCell = cells[3];
                            const currentCount = parseInt(countCell.innerText) || 0;
                            countCell.innerText = Math.max(currentCount - 1, 0); // Prevent negatives
                        }
                    });

                    Swal.fire({
                        icon: 'success',
                        title: 'Producto quitado del pedido exitosamente',
                        timer: 1500,
                        showConfirmButton: false
                    });
                } else {
                    throw new Error(data.error || "Error desconocido.");
                }
            })
            .catch(err => {
                Swal.fire('Error', err.message, 'error');
            });
        }
    });
}