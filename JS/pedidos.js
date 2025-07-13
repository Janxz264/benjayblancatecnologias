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

document.getElementById('savePedidoBtn').addEventListener('click', function (e) {
  e.preventDefault();

  const isEdit = false; // add edit logic later if needed
  const errors = [];

  const fechaPedido = document.getElementById('fechaPedido').value;
  const fechaEntrega = document.getElementById('fechaEntrega').value;
  const addNewProductCheckbox = document.getElementById('addNewProductCheckbox');
  const productoSelect = document.getElementById('productoSelect');

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

  if (addNewProductCheckbox.checked) {
    // Extraer datos del producto nuevo usando misma lógica de addProduct
    const productId = document.getElementById("productId").value;

    const marcaCheckbox = document.getElementById('addNewMarcaCheckbox');
    const proveedorCheckbox = document.getElementById('addNewProveedorCheckbox');
    const garantiaCheckbox = document.getElementById('hasWarrantyCheckbox');

    const marcaSelect = document.getElementById('marcaSelect');
    const newMarcaInput = document.getElementById('newMarcaInput');
    const proveedorSelect = document.getElementById('proveedorSelect');
    const newProveedorInput = document.getElementById('newProveedorInput');

    const modeloInput = document.getElementById('modeloInput');
    const precioDistribuidorInput = document.getElementById('precioDistribuidor');
    const precioVentaInput = document.getElementById('precioVenta');
    const numeroSerieInput = document.getElementById('numeroSerie');

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
    const precioDistribuidor = parseFloat(precioDistribuidorInput.value);
    const precioVenta = parseFloat(precioVentaInput.value);
    const numeroSerie = numeroSerieInput.value.trim();

    if (modelo === "") errors.push("El modelo es obligatorio.");
    if (isNaN(precioDistribuidor) || precioDistribuidor < 0) {
      errors.push("Precio de distribuidor inválido.");
    }
    if (isNaN(precioVenta) || precioVenta < 0) {
      errors.push("Precio de venta inválido.");
    }
    if (numeroSerie === "") errors.push("El número de serie es obligatorio.");

    if (garantiaCheckbox.checked) {
      const fechaInicio = document.getElementById('fechaInicio').value;
      const fechaFin = document.getElementById('fechaFin').value;

      if (!fechaInicio) errors.push("La fecha de inicio de garantía es obligatoria.");
      if (!fechaFin) errors.push("La fecha de fin de garantía es obligatoria.");
      if (fechaInicio && fechaFin && new Date(fechaFin) < new Date(fechaInicio)) {
        errors.push("La fecha de fin no puede ser anterior a la fecha de inicio.");
      }

      pedidoPayload.garantia = true;
      pedidoPayload.fechaInicioGarantia = fechaInicio;
      pedidoPayload.fechaFinGarantia = fechaFin;
    }

    Object.assign(pedidoPayload, {
      ...marcaData,
      ...proveedorData,
      modelo,
      precioDistribuidor,
      precioVenta,
      numeroSerie
    });

  } else {
    if (productoSelect.value === "") {
      errors.push("Debe seleccionar un producto existente.");
    } else {
      pedidoPayload.idProducto = parseInt(productoSelect.value);
    }
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

