function loadStates(selectedState = null) {
    fetch("../PHP/getStates.php")
        .then(response => response.json())
        .then(states => {
            const stateSelect = document.getElementById("state"); // Ensure correct ID
            stateSelect.innerHTML = ""; // Clear previous options

            states.forEach(state => {
                let option = new Option(state.NOMBRE, state.ID_ESTADO);
                stateSelect.add(option);
                if (selectedState && state.ID_ESTADO == selectedState) {
                    option.selected = true; // Preselect state if editing
                }
            });
        })
        .catch(error => console.error("Error loading states:", error));
}

function loadMunicipios(stateId, selectedMunicipio) {
    fetch(`../PHP/getMunicipios.php?stateId=${stateId}`)
        .then(response => response.json())
        .then(municipios => {
            const municipioSelect = document.getElementById("municipio");
            municipioSelect.innerHTML = ""; // Clear previous options

            municipios.forEach(municipio => {
                let option = new Option(municipio.NOMBRE, municipio.ID_MUNICIPIO);
                municipioSelect.add(option);
                if (municipio.ID_MUNICIPIO == selectedMunicipio) option.selected = true;
            });
        });
}

function loadStates() {
    fetch("../PHP/getStates.php")
        .then(response => response.json())
        .then(states => {
            const stateSelect = document.getElementById("state");
            stateSelect.innerHTML = ""; // Clear previous options

            states.forEach(state => {
                let option = new Option(state.NOMBRE, state.ID_ESTADO);
                stateSelect.add(option);

                // Automatically select "Tabasco"
                if (state.NOMBRE === "Tabasco") {
                    option.selected = true;
                }
            });

            // Now that "Tabasco" is selected, load its municipios
            populateMunicipios();
        })
        .catch(error => console.error("Error loading states:", error));
}

function populateMunicipios() {
    let stateId = document.getElementById("state").value;

    fetch(`../PHP/getMunicipios.php?stateId=${stateId}`)
        .then(response => response.json())
        .then(municipios => {
            const municipioSelect = document.getElementById("municipio");
            municipioSelect.innerHTML = ""; // Clear previous options

            let defaultMunicipio = null;

            municipios.forEach(municipio => {
                let option = new Option(municipio.NOMBRE, municipio.ID_MUNICIPIO);
                municipioSelect.add(option);

                // If state is "Tabasco", default to "Centro"; otherwise, let users pick freely
                if (document.getElementById("state").selectedOptions[0].text === "Tabasco" && municipio.NOMBRE === "Centro") {
                    defaultMunicipio = option;
                }
            });

            if (defaultMunicipio) {
                defaultMunicipio.selected = true;
            }
        })
        .catch(error => console.error("Error loading municipios:", error));
}