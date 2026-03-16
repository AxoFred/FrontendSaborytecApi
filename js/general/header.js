    document.addEventListener("DOMContentLoaded", function(){

    fetch("header.html")
        .then(response => response.text())
        .then(data => {

            const contenedor = document.getElementById("header-container");

            if(contenedor){
                contenedor.innerHTML = data;
            }

        })
        .catch(error => {
            console.error("Error cargando header:", error);
        });

});