const patientsProductsLink = document.getElementById("patientsProductsLink");
if (patientsProductsLink) {
    patientsProductsLink.addEventListener("click", function (event) {
        event.preventDefault();
        loadPatientsProducts();
    });
} else {
    console.error("Error: Element #patientsProductsLink not found.");
}

function loadPatientsProducts(){
    alert("ME FALTA PROGRAMAR AQUÍ TODAVÍA, EN CONSTRUCCIÓN...");
}