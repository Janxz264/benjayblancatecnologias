const mantenimientoLink = document.getElementById("mantenimientoLink");

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
        const fecha = fechaRaw ? formatDateDMY(fechaRaw) : "No registrada";
        let estado = "❌ No registrada";
        let accionBtn = `<button class="btn btn-sm btn-success" onclick="agregarFechaMantto(${item.producto_id})">
                          <i class="fas fa-plus"></i> Agregar fecha</button>`;
        let realizadoHTML = "";

        if (fechaRaw) {
          const fechaMantto = new Date(fechaRaw);
          const isToday = fechaMantto.toDateString() === hoy.toDateString();
          const isPast = fechaMantto < hoy;
          const hecho = item.mantenimiento_hecho;

          estado = hecho
            ? "✅ Completado"
            : isPast
              ? "⚠️ Vencido"
              : "🕒 Pendiente";

          accionBtn = `<button class="btn btn-sm btn-primary" onclick="editarFechaMantto(${item.producto_id})">
                          <i class="fas fa-edit"></i> Editar fecha</button>`;

          if (isToday && !hecho) {
            realizadoHTML = `<input type="checkbox" onchange="confirmarTerminarMantto(${item.producto_id})" id="hechoCheckbox_${item.producto_id}" />`;
          } else if (isPast) {
            realizadoHTML = hecho
              ? `<i class="fas fa-check-circle text-success"></i>`
              : `<i class="fas fa-times-circle text-danger"></i>`;
          } else {
            realizadoHTML = `<input type="checkbox" disabled />`;
          }
        }

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
