const mantenimientoLink = document.getElementById("mantenimientoLink");

const mantenimientoPastLink = document.getElementById("mantenimientoPastLink");

if (mantenimientoPastLink) {
    mantenimientoPastLink.addEventListener("click", function (event) {
        event.preventDefault();
        loadPastMaintenances();
    });
} else {
    console.error("Error: Element #mantenimientoPastLink not found.");
}

if (mantenimientoLink) {
    mantenimientoLink.addEventListener("click", function (event) {
        event.preventDefault();
        loadMaintenances();
    });
} else {
    console.error("Error: Element #mantenimientoLink not found.");
}

function loadMaintenances() {
  document.getElementById("mainTitle").innerText = "Gestor de mantenimiento de productos";
  const container = document.getElementById("mainContainer");
  container.innerHTML = ``;

  fetch("../PHP/maintenancehandler.php?action=VIEW")
    .then(response => response.json())
    .then(data => {
      if (!data || data.length === 0) {
        container.innerHTML += "<h1>No hay registros de mantenimiento disponibles.</h1>";
        return;
      }

      let tableHTML = `
        <table id="maintenanceTable" class="table table-bordered table-striped">
          <thead class="thead-dark">
            <tr>
              <th>Marca</th>
              <th>Proveedor</th>
              <th>Modelo</th>
              <th>Fecha de Mantenimiento</th>
              <th>Estado</th>
              <th>Acción</th>
              <th>Realizado</th>
            </tr>
          </thead>
          <tbody>
      `;

      const hoy = new Date();

      data.forEach(item => {
        const fechaRaw = item.mantenimiento_fecha;
        const hecho = item.mantenimiento_hecho ?? false;
        const fecha = fechaRaw ? formatDateDMY(fechaRaw) : "No registrada";
        const fechaMantto = fechaRaw ? new Date(`${fechaRaw}T00:00:00`) : null;

        const isSameDay = (a, b) =>
          a?.getFullYear() === b.getFullYear() &&
          a?.getMonth() === b.getMonth() &&
          a?.getDate() === b.getDate();

        const isToday = isSameDay(fechaMantto, hoy);
        const isFuture = fechaMantto && fechaMantto > hoy;

        let estado = "🕒 Pendiente";
        if (!fechaMantto) estado = "❌ Sin fecha registrada";


        // Only include future or today entries not marked as done
        if ((!fechaMantto || isToday || isFuture) && !hecho) {
          let accionBtn = "";
        if (!hecho) {
        if (!fechaMantto) {
            accionBtn = `<button class="btn btn-sm btn-success" onclick="agregarFechaMantto(${item.producto_id})">
                        <i class="fas fa-plus"></i> Agregar fecha</button>`;
        } else {
            accionBtn = `<button class="btn btn-sm btn-primary" onclick="editarFechaMantto(${item.producto_id})">
                        <i class="fas fa-edit"></i> Editar fecha</button>`;
        }
        }
          let realizadoHTML = isToday
            ? `<button class="btn btn-sm btn-success" onclick="confirmarTerminarMantto(${item.producto_id})">
                 <i class="fas fa-check"></i> Finalizar</button>`
            : `<button class="btn btn-sm btn-secondary" disabled>
                 <i class="fas fa-lock"></i></button>`;

          tableHTML += `
            <tr>
              <td>${safeText(item.marca_nombre)}</td>
              <td>${safeText(item.proveedor_nombre)}</td>
              <td>${safeText(item.producto_modelo)}</td>
              <td>${fecha}</td>
              <td>${estado}</td>
              <td>${accionBtn}</td>
              <td class="text-center">${realizadoHTML}</td>
            </tr>
          `;
        }
      });

      tableHTML += `</tbody></table>`;
      container.innerHTML += tableHTML;

      $('#maintenanceTable').DataTable().destroy();
      initializeDataTable("#maintenanceTable");
    })
    .catch(error => {
      console.error("Error fetching maintenance data:", error);
      container.innerHTML += "<p>Error al obtener datos de mantenimiento.</p>";
    });
}

function loadPastMaintenances() {
  document.getElementById("mainTitle").innerText = "Historial de mantenimientos anteriores";
  const container = document.getElementById("mainContainer");
  container.innerHTML = ``;

  fetch("../PHP/maintenancehandler.php?action=VIEWPAST")
    .then(response => response.json())
    .then(data => {
      if (!data || data.length === 0) {
        container.innerHTML += "<h1>No hay registros anteriores de mantenimiento.</h1>";
        return;
      }

      let tableHTML = `
        <table id="pastMaintenanceTable" class="table table-bordered table-striped">
          <thead class="thead-dark">
            <tr>
              <th>Marca</th>
              <th>Proveedor</th>
              <th>Modelo</th>
              <th>Fecha de Mantenimiento</th>
              <th>Estado</th>
              <th>Realizado</th>
            </tr>
          </thead>
          <tbody>
      `;

      data.forEach(item => {
        const fecha = item.mantenimiento_fecha ? formatDateDMY(item.mantenimiento_fecha) : "No registrada";
        const hecho = item.mantenimiento_hecho ?? false;

        const estado = hecho
          ? "Realizado"
          : "No realizado";

        const realizadoHTML = hecho
          ? `<i class="fas fa-check-circle text-success"></i>`
          : `<i class="fas fa-times-circle text-danger"></i>`;

        tableHTML += `
          <tr>
            <td>${safeText(item.marca_nombre)}</td>
            <td>${safeText(item.proveedor_nombre)}</td>
            <td>${safeText(item.producto_modelo)}</td>
            <td>${fecha}</td>
            <td>${estado}</td>
            <td class="text-center">${realizadoHTML}</td>
          </tr>
        `;
      });

      tableHTML += `</tbody></table>`;
      container.innerHTML += tableHTML;

      $('#pastMaintenanceTable').DataTable().destroy();
      initializeDataTable("#pastMaintenanceTable");
    })
    .catch(error => {
      console.error("Error fetching past maintenance data:", error);
      container.innerHTML += "<p>Error al obtener mantenimientos pasados.</p>";
    });
}

function confirmarTerminarMantto(ID_PRODUCTO) {
  Swal.fire({
    title: "¿Confirmar mantenimiento realizado?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Sí, marcar como hecho",
    cancelButtonText: "Cancelar"
  }).then(result => {
    if (!result.isConfirmed) return;

    fetch("../PHP/maintenancehandler.php?action=FINISHMANTTO", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idProducto: ID_PRODUCTO })
    })
      .then(res => res.json())
      .then(response => {
        if (!response.success) throw new Error(response.error || "Error inesperado.");
        Swal.fire("Éxito", "El mantenimiento se realizó correctamente.", "success");
        loadMaintenances();
      })
      .catch(error => {
        console.error("Error al finalizar mantenimiento:", error);
        Swal.fire("Error", error.message, "error");
      });
  });
}

function agregarFechaMantto(ID_PRODUCTO) {
  const modalHTML = `
    <div class="modal fade" id="manttoFechaModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-success text-white">
            <h5 class="modal-title">Agregar fecha de mantenimiento</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
          </div>
          <div class="modal-body">
            <input type="date" id="manttoFechaInput" class="form-control" />
          </div>
          <div class="modal-footer">
            <button class="btn btn-success" onclick="confirmarAgregarFechaMantto(${ID_PRODUCTO})">Guardar</button>
            <button class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", modalHTML);
  const modal = new bootstrap.Modal(document.getElementById("manttoFechaModal"));
  modal.show();

  document.getElementById("manttoFechaModal").addEventListener("hidden.bs.modal", () => {
    document.getElementById("manttoFechaModal").remove();
  });
}

function confirmarAgregarFechaMantto(ID_PRODUCTO) {
  const fecha = document.getElementById("manttoFechaInput").value;
  if (!fecha) {
    Swal.fire("Error", "Debe seleccionar una fecha válida.", "error");
    return;
  }

  fetch("../PHP/maintenancehandler.php?action=ADDFECHA", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idProducto: ID_PRODUCTO, fecha })
  })
    .then(res => res.json())
    .then(response => {
      if (!response.success) throw new Error(response.error || "Error al guardar fecha.");
      Swal.fire("Éxito", "Fecha agregada correctamente.", "success");
      loadMaintenances();
    })
    .catch(err => {
      console.error("Agregar fecha error:", err);
      Swal.fire("Error", err.message, "error");
    });
}

function editarFechaMantto(ID_PRODUCTO) {
  const cachedFecha = document.querySelector(`#hechoCheckbox_${ID_PRODUCTO}`)?.getAttribute("data-fecha");
  const fechaBase = cachedFecha || ""; // fallback to empty if not cached

  const modalHTML = `
    <div class="modal fade" id="editFechaModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">Editar fecha de mantenimiento</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
          </div>
          <div class="modal-body">
            <input type="date" id="editFechaInput" class="form-control" value="${fechaBase}" />
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" onclick="confirmarEditarFechaMantto(${ID_PRODUCTO})">Actualizar</button>
            <button class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", modalHTML);
  const modal = new bootstrap.Modal(document.getElementById("editFechaModal"));
  modal.show();

  document.getElementById("editFechaModal").addEventListener("hidden.bs.modal", () => {
    document.getElementById("editFechaModal").remove();
  });
}

function confirmarEditarFechaMantto(ID_PRODUCTO) {
  const fecha = document.getElementById("editFechaInput").value;
  if (!fecha) {
    Swal.fire("Error", "Debe seleccionar una fecha válida.", "error");
    return;
  }

  fetch("../PHP/maintenancehandler.php?action=EDITFECHA", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idProducto: ID_PRODUCTO, fecha })
  })
    .then(res => res.json())
    .then(response => {
      if (!response.success) throw new Error(response.error || "Error al actualizar fecha.");
      Swal.fire("Éxito", "Fecha actualizada correctamente.", "success");
      loadMaintenances();
    })
    .catch(err => {
      console.error("Editar fecha error:", err);
      Swal.fire("Error", err.message, "error");
    });
}

function confirmarTerminarMantto(ID_PRODUCTO) {
  Swal.fire({
    title: "¿Está seguro de que desea marcar como realizado el mantenimiento de este producto?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, confirmar",
    cancelButtonText: "Cancelar"
  }).then(result => {
    if (!result.isConfirmed) return;

    fetch("../PHP/maintenancehandler.php?action=TERMINARMANTTO", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idProducto: ID_PRODUCTO })
    })
      .then(res => res.json())
      .then(response => {
        if (!response.success) throw new Error(response.error || "Error al actualizar estado.");
        Swal.fire("Éxito", "El mantenimiento se realizó correctamente.", "success");
        loadMaintenances();
      })
      .catch(err => {
        console.error("Confirmar terminación error:", err);
        Swal.fire("Error", err.message, "error");
      });
  });
}
