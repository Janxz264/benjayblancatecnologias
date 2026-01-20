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
        // Fetch product list dynamically
        retrieveProductos().then(products => {
            availableProducts = products;
        });
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

    showSpinner("Cargando pedidos...");

    fetch("../PHP/pedidohandler.php?action=VIEW")
        .then(response => response.json())
        .then(data => {
            hideSpinner();

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
                            <th><i class="fas fa-flag"></i> Estatus</th>
                            <th>No. de productos</th>
                            <th>Ver productos</th>
                            <th>Editar</th>
                            <th>Eliminar</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            function parseFechaDDMMYYYY(fechaStr) {
                const [dia, mes, año] = fechaStr.split('/');
                return new Date(Date.UTC(año, mes - 1, dia));
            }

            data.forEach(pedido => {
                const entregaDate = parseFechaDDMMYYYY(pedido.FECHA_DE_ENTREGA);
                const now = new Date();
                const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

                let estatusText = "";
                let estatusIcon = "";

                if (entregaDate.getTime() === todayUTC.getTime()) {
                    estatusText = "Llega hoy";
                    estatusIcon = '<i class="fas fa-truck-moving text-success"></i>';
                } else if (entregaDate > todayUTC) {
                    estatusText = "Por entregar";
                    estatusIcon = '<i class="fas fa-clock text-warning"></i>';
                } else {
                    estatusText = "Entregado";
                    estatusIcon = '<i class="fas fa-check-circle text-muted"></i>';
                }

                const isEditable = estatusText === "Por entregar";
                const productos = Array.isArray(pedido.PRODUCTOS) ? pedido.PRODUCTOS : [];
                const numProductos = productos.length;

                tableHTML += `
                    <tr>
                        <td>${pedido.ID_PEDIDO}</td>
                        <td>${safeText(pedido.FECHA_DE_PEDIDO)}</td>
                        <td>${safeText(pedido.FECHA_DE_ENTREGA)}</td>
                        <td>${estatusIcon} ${estatusText}</td>
                        <td>${numProductos}</td>
                        <td>
                            <button class="btn btn-info btn-sm" onclick="verProductos(${pedido.ID_PEDIDO}, ${isEditable})">
                                <i class="fas fa-box-open"></i> Ver productos
                            </button>
                        </td>
                        <td>
                            ${isEditable ? `
                                <button class="btn btn-primary btn-sm" onclick="editPedido(${pedido.ID_PEDIDO})">
                                    <i class="fas fa-edit"></i> Editar
                                </button>` : '<span class="text-muted"><i class="fas fa-ban"></i></span>'}
                        </td>
                        <td>
                            ${isEditable ? `
                                <button class="btn btn-danger btn-sm" onclick="deletePedido(${pedido.ID_PEDIDO})">
                                    <i class="fas fa-trash"></i> Eliminar
                                </button>` : '<span class="text-muted"><i class="fas fa-ban"></i></span>'}
                        </td>
                    </tr>
                `;
            });

            tableHTML += `</tbody></table>`;
            container.innerHTML += tableHTML;
            pedidosCache = data;

            $('#pedidosTable').DataTable().destroy();
            initializeDataTable("#pedidosTable");
        })
        .catch(error => {
            hideSpinner();
            console.error("Error fetching pedidos:", error);
            container.innerHTML += "<p class='text-danger'>Error al obtener datos de pedidos.</p>";
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
    if (!result.isConfirmed) return;

    showSpinner("Eliminando pedido...");

    fetch(`../PHP/pedidohandler.php?action=REMOVE`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: id_pedido })
    })
      .then(res => res.json())
      .then(response => {
        hideSpinner();

        if (response.success) {
          Swal.fire({
            icon: 'success',
            title: 'Pedido eliminado',
            text: 'El pedido fue eliminado correctamente.',
            confirmButtonText: 'Cerrar'
          });
          loadPedidos();
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
        hideSpinner();
        console.error("Error al eliminar pedido:", error);
        Swal.fire({
          icon: 'error',
          title: 'Error de red',
          text: 'No se pudo contactar al servidor.',
          confirmButtonText: 'Cerrar'
        });
      });
  });
}

function retrieveProductos() {
    return fetch("../PHP/producthandler.php?action=VIEWAVAILABLE")
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

  showSpinner("Cargando productos disponibles...");

  retrieveProductos()
    .then(products => {
      availableProducts = products;
      renderProductLists(); // Refresh UI with both lists
    })
    .finally(() => {
      hideSpinner();
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
  
  // Only validate fechaEntrega if it has a value
  if (fechaEntrega && fechaPedido && new Date(fechaEntrega) < new Date(fechaPedido)) {
    errors.push("La fecha de entrega no puede ser anterior a la fecha de pedido.");
  }

  let pedidoPayload = {
    fechaPedido,
    ...(fechaEntrega && { fechaEntrega }) // fechaEntrega is only included if it has a value
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

  showSpinner("Guardando pedido...");

  fetch(`../PHP/pedidohandler.php?action=${isEdit ? 'EDIT' : 'ADD'}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pedidoPayload)
  })
    .then(res => res.json())
    .then(response => {
      hideSpinner();

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
          cleanUpModals();
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
      hideSpinner();
      console.error("Error en la solicitud:", err);
      Swal.fire({
        icon: 'error',
        title: 'Error de red',
        text: 'No se pudo enviar el formulario. Intenta nuevamente.',
        confirmButtonText: 'Cerrar'
      });
    });
});

function verProductos(pedidoID, isEditable) {
    const pedido = pedidosCache.find(p => p.ID_PEDIDO === pedidoID);

    if (!pedido || !Array.isArray(pedido.PRODUCTOS) || pedido.PRODUCTOS.length === 0) {
        alert("Este pedido no tiene productos asociados.");
        return;
    }

    let totalDistribuidor = 0;
    let totalVenta = 0;

    pedido.PRODUCTOS.forEach(prod => {
        totalDistribuidor += parseFloat(prod.PRECIO_DISTRIBUIDOR);
        totalVenta += parseFloat(prod.PRECIO_DE_VENTA);
    });

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
                                    ${isEditable ? `<th>Quitar</th>` : ``}
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
                                        ${isEditable ? `
                                            <td><button class="btn btn-sm btn-danger" onclick="quitarProductodePedido(${prod.ID_PRODUCTO}, ${pedidoID})">
                                                <i class="fas fa-times"></i> Quitar
                                            </button></td>` :
                                            ''
                                        }
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                              <tr class="table-info fw-bold">
                                <td colspan="3" class="text-center">TOTAL</td>
                                <td id="totalDistribuidor" class="text-center">$0.00</td>
                                <td id="totalVenta" class="text-center">$0.00</td>
                                <td></td>
                              </tr>
                            </tfoot>
                        </table>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        ${isEditable ? `
                          <button class="btn btn-success" onclick="agregarProductoAPedido(${pedidoID})">
                              <i class="fas fa-plus"></i> Agregar Producto
                          </button>` :
                          ''
                      }
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

        document.getElementById('totalDistribuidor').textContent = `$${totalDistribuidor.toFixed(2)}`;
        document.getElementById('totalVenta').textContent = `$${totalVenta.toFixed(2)}`;
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
    if (!result.isConfirmed) return;

    showSpinner("Quitando producto del pedido...");

    fetch("../PHP/pedidohandler.php?action=REMOVEPRODUCTO", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_producto: ID_PRODUCTO, id_pedido: ID_PEDIDO })
    })
      .then(response => response.json())
      .then(data => {
        hideSpinner();

        if (!data.success) throw new Error(data.error || "Error desconocido.");

        // Remove product row from modal
        const row = document.querySelector(`#productosTable tr[data-id='${ID_PRODUCTO}']`);
        if (row) row.remove();

        // Update pedidosCache
        const pedido = pedidosCache.find(p => p.ID_PEDIDO === ID_PEDIDO);
        if (pedido && Array.isArray(pedido.PRODUCTOS)) {
          pedido.PRODUCTOS = pedido.PRODUCTOS.filter(p => p.ID_PRODUCTO !== ID_PRODUCTO);
        }

        // Recalcular totales
        actualizarTotales(ID_PEDIDO);

        loadPedidos();

        Swal.fire({
          icon: 'success',
          title: 'Producto quitado del pedido exitosamente',
          timer: 1500,
          showConfirmButton: false
        });
      })
      .catch(err => {
        hideSpinner();
        console.error("Error al quitar producto del pedido:", err);
        Swal.fire('Error', err.message, 'error');
      });
  });
}

function editPedido(ID_PEDIDO) {
  const pedido = pedidosCache.find(p => p.ID_PEDIDO === ID_PEDIDO);
  if (!pedido) {
    Swal.fire("Error", "Pedido no encontrado en memoria.", "error");
    return;
  }

  const fechaPedidoFormatted = convertToDateInputFormat(pedido.FECHA_DE_PEDIDO);
  const fechaEntregaFormatted = convertToDateInputFormat(pedido.FECHA_DE_ENTREGA);

  document.getElementById("edit_fechaPedido").value = fechaPedidoFormatted || "";
  document.getElementById("edit_fechaEntrega").value = fechaEntregaFormatted || "";

  document.getElementById("id_pedido_editar").setAttribute("value",ID_PEDIDO);

  const modal = new bootstrap.Modal(document.getElementById("editPedidoModal"));
  modal.show();
}

function convertToDateInputFormat(dateStr) {
  // Expects input like "16/07/2025"
  const [day, month, year] = dateStr.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function editarPedido() {
  const fechaPedido = document.getElementById("edit_fechaPedido").value;
  const fechaEntrega = document.getElementById("edit_fechaEntrega").value;
  const ID_PEDIDO = document.getElementById("id_pedido_editar").value;
  let errors = [];

  if (!fechaPedido) {
    errors.push("La fecha de pedido es obligatoria.");
  }

  if (fechaEntrega && new Date(fechaEntrega) < new Date(fechaPedido)) {
    errors.push("La fecha de entrega no puede ser anterior a la fecha de pedido.");
  }

  if (errors.length > 0) {
    Swal.fire({
      icon: 'warning',
      title: 'Errores de validación',
      html: `<ul style='text-align:left;'>${errors.map(e => `<li>${e}</li>`).join('')}</ul>`,
      confirmButtonText: 'Corregir'
    });
    return;
  }

  const payload = {
    idPedido: ID_PEDIDO,
    fechaPedido,
    fechaEntrega
  };

  showSpinner("Actualizando pedido...");

  fetch("../PHP/pedidohandler.php?action=EDIT", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(response => {
      hideSpinner();

      if (response.success) {
        Swal.fire({
          icon: "success",
          title: "Pedido actualizado",
          text: "Las fechas fueron modificadas exitosamente.",
          confirmButtonText: "Cerrar"
        }).then(() => {
          const modalEl = document.getElementById("editPedidoModal");
          const modalInstance = bootstrap.Modal.getInstance(modalEl);
          if (modalInstance) modalInstance.hide();

          loadPedidos();
        });
      } else {
        throw new Error(response.error || "Error desconocido.");
      }
    })
    .catch(err => {
      hideSpinner();
      console.error("Error en editarPedido:", err);
      Swal.fire("Error", err.message, "error");
    });
}

function agregarProductoAPedido(ID_PEDIDO) {

  const pedido = pedidosCache.find(p => p.ID_PEDIDO === ID_PEDIDO);
  if (!pedido) {
    Swal.fire("Error", "Pedido no encontrado en caché.", "error");
    return;
  }

  // Get already-added product IDs
  const existingIds = pedido.PRODUCTOS.map(p => p.ID_PRODUCTO);

  // Filter out already-selected products
  const filteredAvailable = availableProducts.filter(p => !existingIds.includes(p.ID_PRODUCTO));

  if (filteredAvailable.length === 0) {
    Swal.fire("Info", "No hay productos disponibles para agregar a este pedido.", "info");
    return;
  }

  // Build a simple select modal
  let optionsHTML = filteredAvailable.map(p => `
    <option value="${p.ID_PRODUCTO}">
      ${p.NOMBRE_MARCA} - ${p.MODELO} - $${parseFloat(p.PRECIO_DE_VENTA).toFixed(2)}
    </option>
  `).join('');

  const modalHTML = `
    <div class="modal fade" id="addProductToPedidoModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header custom-header-bg text-white">
            <h5 class="modal-title">Agregar Producto al Pedido #${ID_PEDIDO}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
          </div>
          <div class="modal-body">
            <select id="productSelectForPedido" class="form-select">
              <option value="">-- Seleccione un producto --</option>
              ${optionsHTML}
            </select>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button class="btn btn-primary" onclick="confirmAddProduct(${ID_PEDIDO})">Agregar</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);
  const modal = new bootstrap.Modal(document.getElementById("addProductToPedidoModal"));
  modal.show();

  // Cleanup on close
  document.getElementById("addProductToPedidoModal").addEventListener("hidden.bs.modal", () => {
    document.getElementById("addProductToPedidoModal").remove();
  });
}

function confirmAddProduct(ID_PEDIDO) {
  const select = document.getElementById("productSelectForPedido");
  const selectedId = parseInt(select.value);

  if (!selectedId) {
    Swal.fire("Advertencia", "Seleccione un producto válido.", "warning");
    return;
  }

  const payload = { idPedido: ID_PEDIDO, idProducto: selectedId };

  showSpinner("Agregando producto al pedido...");

  fetch("../PHP/pedidohandler.php?action=EDITADD", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(response => {
      hideSpinner();

      if (!response.success) throw new Error(response.error || "Error inesperado.");

      Swal.fire("Éxito", "Producto agregado al pedido.", "success");

      // Add row to productosTable
      const producto = availableProducts.find(p => p.ID_PRODUCTO === selectedId);
      const rowHTML = `
        <tr class="table-light odd" data-id="${producto.ID_PRODUCTO}" data-pedido="${ID_PEDIDO}">
          <td class="sorting_1">${producto.NOMBRE_MARCA}</td>
          <td>${producto.NOMBRE_PROVEEDOR}</td>
          <td>${producto.MODELO}</td>
          <td>$${parseFloat(producto.PRECIO_DISTRIBUIDOR).toFixed(2)}</td>
          <td>$${parseFloat(producto.PRECIO_DE_VENTA).toFixed(2)}</td>
          <td>${producto.NUMERO_DE_SERIE}</td>
          <td>
            <button class="btn btn-sm btn-danger" onclick="quitarProductodePedido(${producto.ID_PRODUCTO}, ${ID_PEDIDO})">
              <i class="fas fa-times"></i> Quitar
            </button>
          </td>
        </tr>
      `;

      const tbody = document.querySelector("#productosTable tbody");
      if (tbody) tbody.insertAdjacentHTML("beforeend", rowHTML);

      // Update cache
      const pedido = pedidosCache.find(p => p.ID_PEDIDO === ID_PEDIDO);
      if (pedido) pedido.PRODUCTOS.push(producto);

      // Recalcular totales
      actualizarTotales(ID_PEDIDO);

      // ✅ Refresh pedidos table to update product count and status
      loadPedidos();

      // Close modal
      const modalEl = document.getElementById("addProductToPedidoModal");
      const modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (modalInstance) modalInstance.hide();
    })
    .catch(err => {
      hideSpinner();
      console.error("Error al agregar producto al pedido:", err);
      Swal.fire("Error", err.message, "error");
    });
}

function actualizarTotales(pedidoID) {
    const pedido = pedidosCache.find(p => p.ID_PEDIDO === pedidoID);
    if (!pedido) return;

    let totalDistribuidor = 0;
    let totalVenta = 0;

    pedido.PRODUCTOS.forEach(prod => {
        totalDistribuidor += parseFloat(prod.PRECIO_DISTRIBUIDOR);
        totalVenta += parseFloat(prod.PRECIO_DE_VENTA);
    });

    const distCell = document.getElementById('totalDistribuidor');
    const ventaCell = document.getElementById('totalVenta');
    if (distCell) distCell.textContent = `$${totalDistribuidor.toFixed(2)}`;
    if (ventaCell) ventaCell.textContent = `$${totalVenta.toFixed(2)}`;
}

window.addEventListener("productoGuardado", function (e) {
    retrieveProductos().then(productList => {
        const selectedIds = selectedProducts.map(p => p.ID_PRODUCTO);
        availableProducts = productList.filter(p => !selectedIds.includes(p.ID_PRODUCTO));
        renderProductLists();
    });
});