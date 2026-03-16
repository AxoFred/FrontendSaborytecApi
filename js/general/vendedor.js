// ============================================================
// CONTROL DEL PANEL VENDEDOR
// ============================================================

function mostrarSeccion(seccion){

    const contenedor = document.getElementById("contenido-dinamico");

    if(!contenedor) return;

    // --------------------------------------------------------
    // TIENDA
    // --------------------------------------------------------
    if(seccion === "tienda"){

        contenedor.innerHTML = `
        <div class="empty-state">
            <i class='bx bxs-store'></i>
            <p>Cargando módulo de tienda...</p>
        </div>
    `;

    if(typeof obtenerTienda === "function"){
        obtenerTienda();
    }

    }

    // --------------------------------------------------------
    // PRODUCTOS
    // --------------------------------------------------------
    else if(seccion === "productos"){

        contenedor.innerHTML = `
            <div class="empty-state">
                <i class='bx bxs-box'></i>
                <p>Módulo de productos en desarrollo.</p>
            </div>
        `;

    }

    // --------------------------------------------------------
    // PEDIDOS
    // --------------------------------------------------------
    else if(seccion === "pedidos"){

        contenedor.innerHTML = `
            <div class="empty-state">
                <i class='bx bxs-receipt'></i>
                <p>Módulo de pedidos en desarrollo.</p>
            </div>
        `;

    }

    // --------------------------------------------------------
    // HORARIOS
    // --------------------------------------------------------
    else if(seccion === "horarios"){

        contenedor.innerHTML = `
            <div class="empty-state">
                <i class='bx bxs-time'></i>
                <p>Cargando módulo de horarios...</p>
            </div>
        `;

        // Llama al módulo horarios.js
        if(typeof obtenerHorarios === "function"){
            obtenerHorarios();
        }

    }
    // --------------------------------------------------------
    // REPORTES
    // --------------------------------------------------------
    else if(seccion === "reportes"){

        contenedor.innerHTML = `
            <div class="empty-state">
                <i class='bx bxs-bar-chart-alt-2'></i>
                <p>Módulo de reportes en desarrollo.</p>
            </div>
        `;

    }

    // --------------------------------------------------------
    // AYUDA
    // --------------------------------------------------------
    else if(seccion === "ayuda"){

        contenedor.innerHTML = `
            <div class="empty-state">
                <i class='bx bxs-help-circle'></i>
                <p>Centro de ayuda próximamente.</p>
            </div>
        `;

    }

}