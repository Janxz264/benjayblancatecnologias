function loadStates(selectedStateId = null) {
    blockUI("Cargando estados...");
    showSpinner("Cargando estados...");

    const stateSelect = document.getElementById("state");
    stateSelect.removeEventListener("change", onStateChange); // Desactivar temporalmente

    return fetch("../PHP/getStates.php")
        .then(response => response.json())
        .then(states => {
            hideSpinner();
            unblockUI();

            stateSelect.innerHTML = "";

            states.forEach(state => {
                let option = new Option(state.NOMBRE, state.ID_ESTADO);
                stateSelect.add(option);

                if (selectedStateId && state.ID_ESTADO == selectedStateId) {
                    option.selected = true;
                } else if (!selectedStateId && state.NOMBRE === "Tabasco") {
                    option.selected = true;
                }
            });

            const selectedId = selectedStateId || stateSelect.value;
            return loadMunicipios(selectedId);
        })
        .then(() => {
            stateSelect.addEventListener("change", onStateChange); //Reactivar después de todo
        })
        .catch(error => {
            hideSpinner();
            unblockUI();
            console.error("Error al cargar estados:", error);
            stateSelect.addEventListener("change", onStateChange); //Asegurar reactivación incluso en error
        });
}

function loadMunicipios(stateId, selectedMunicipio = null) {
    blockUI("Cargando municipios...");
    showSpinner("Cargando municipios...");

    return fetch(`../PHP/getMunicipios.php?stateId=${stateId}`)
        .then(response => response.json())
        .then(municipios => {
            hideSpinner();
            unblockUI();

            const municipioSelect = document.getElementById("municipio");
            municipioSelect.innerHTML = ""; // Limpiar opciones anteriores

            municipios.forEach(municipio => {
                let option = new Option(municipio.NOMBRE, municipio.ID_MUNICIPIO);
                municipioSelect.add(option);
                if (selectedMunicipio && municipio.ID_MUNICIPIO == selectedMunicipio) {
                    option.selected = true;
                }
            });

            // Valor por defecto si es Tabasco
            const stateSelect = document.getElementById("state");
            const selectedStateText = stateSelect.selectedOptions[0]?.text;
            if (!selectedMunicipio && selectedStateText === "Tabasco") {
                const centroOption = Array.from(municipioSelect.options).find(opt => opt.text === "Centro");
                if (centroOption) centroOption.selected = true;
            }
        })
        .catch(error => {
            hideSpinner();
            unblockUI();
            console.error("Error al cargar municipios:", error);
        });
}

function onStateChange() {
    const selectedState = document.getElementById("state").value;
    if (selectedState) {
        loadMunicipios(selectedState);
    } else {
        document.getElementById("municipio").innerHTML = "<option>Seleccione un estado primero</option>";
    }
}