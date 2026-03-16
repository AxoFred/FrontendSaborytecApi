// ============================================================
// CONTROL DEL PANEL ADMIN
// ============================================================

function mostrarSeccion(seccion){

    const contenedor = document.getElementById("contenido-dinamico");

    if(seccion === "usuarios"){

        obtenerUsuarios(); // llama a la API

    }

    else if(seccion === "tiendas"){

        contenedor.innerHTML = `
            <div class="empty-state">
                <i class='bx bxs-business'></i>
                <p>Módulo de tiendas en desarrollo.</p>
            </div>
        `;

    }

    else if(seccion === "productos"){

        contenedor.innerHTML = `
            <div class="empty-state">
                <i class='bx bxs-box'></i>
                <p>Módulo de productos en desarrollo.</p>
            </div>
        `;

    }

    else if(seccion === "promociones"){

        contenedor.innerHTML = `
            <div class="empty-state">
                <i class='bx bxs-megaphone'></i>
                <p>Módulo de promociones en desarrollo.</p>
            </div>
        `;

    }

    else if(seccion === "reportes"){

        contenedor.innerHTML = `
            <div class="empty-state">
                <i class='bx bxs-bar-chart-alt-2'></i>
                <p>Módulo de reportes en desarrollo.</p>
            </div>
        `;

    }

    else if(seccion === "ayuda"){

        contenedor.innerHTML = `
            <div class="empty-state">
                <i class='bx bxs-help-circle'></i>
                <p>Centro de ayuda próximamente.</p>
            </div>
        `;

    }

}