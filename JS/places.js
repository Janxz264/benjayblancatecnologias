function loadStates(selectedStateId = null) {
    return fetch("../PHP/getStates.php")
        .then(response => response.json())
        .then(states => {
            const stateSelect = document.getElementById("state");
            stateSelect.innerHTML = ""; // Limpiar opciones anteriores

            states.forEach(state => {
                let option = new Option(state.NOMBRE, state.ID_ESTADO);
                stateSelect.add(option);

                if (selectedStateId && state.ID_ESTADO == selectedStateId) {
                    option.selected = true;
                } else if (!selectedStateId && state.NOMBRE === "Tabasco") {
                    option.selected = true;
                }
            });

            // Una vez seleccionado el estado, cargar municipios
            const selectedId = selectedStateId || stateSelect.value;
            return loadMunicipios(selectedId);
        })
        .catch(error => console.error("Error al cargar estados:", error));
}

function loadMunicipios(stateId, selectedMunicipio = null) {
    return fetch(`../PHP/getMunicipios.php?stateId=${stateId}`)
        .then(response => response.json())
        .then(municipios => {
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
        .catch(error => console.error("Error al cargar municipios:", error));
}

document.getElementById("state").addEventListener("change", function () {
    const selectedState = this.value;
    if (selectedState) {
        loadMunicipios(selectedState);
    } else {
        document.getElementById("municipio").innerHTML = "<option>Seleccione un estado primero</option>";
    }
});