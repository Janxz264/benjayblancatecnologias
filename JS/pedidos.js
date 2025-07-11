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