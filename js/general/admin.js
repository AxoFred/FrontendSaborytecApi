// ============================================================
// CONTROL DEL PANEL ADMIN - SABORYTEC API (SINCRONIZADO)
// ============================================================

const API_BASE = "https://saborytecapi-production.up.railway.app/api";
//const API_BASE = "http://saborytecapi.test/api";


// Helper universal para peticiones (GET, POST, etc.)
async function fetchAdmin(endpoint, method = "GET", body = null) {
    // CORRECCIÓN CLAVE: Cambiamos "token" por "auth_token"
    const token = localStorage.getItem("auth_token"); 
    
    if (!token) {
        console.warn("No se encontró auth_token. Redirigiendo...");
        window.location.href = "../index.html"; // Ajustado a tu ruta de login
        return null;
    }

    const config = {
        method: method,
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
    };

    if (body) config.body = JSON.stringify(body);

    try {
        const response = await fetch(`${API_BASE}/${endpoint}`, config);

        if (response.status === 401) {
            console.error("Token rechazado por el servidor.");
            localStorage.clear();
            window.location.href = "../index.html";
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error("Error API Admin:", error);
        return null;
    }
}

async function mostrarSeccion(seccion) {
    const contenedor = document.getElementById("contenido-dinamico");
    if (!contenedor) return;

    if (seccion === "usuarios") {
        contenedor.innerHTML = `<p>Cargando usuarios...</p>`;
        const respuesta = await fetchAdmin("usuarios");
        if (respuesta && typeof obtenerUsuarios === "function") {
            obtenerUsuarios(Array.isArray(respuesta) ? respuesta : (respuesta.data || []));
        }
    } 
    else if (seccion === "tiendas") {
        if (typeof cargarTiendasPendientes === "function") {
            cargarTiendasPendientes(); 
        }
    } 
    else if (seccion === "productos") {
        if (typeof mostrarSeccionPendientes === "function") {
            mostrarSeccionPendientes(); 
        } else {
            contenedor.innerHTML = `<p style="color:red;">Error: Módulo de productos no cargado.</p>`;
        }
    }
    // --- NUEVA SECCIÓN DE REPORTES ---
    else if (seccion === "reportes") {
        if (typeof obtenerReportesAdmin === "function") {
            obtenerReportesAdmin();
        } else {
            contenedor.innerHTML = `<p style="color:red;">Error: Módulo de reportes administrativos no cargado.</p>`;
        }
    }
    // Manejo de secciones no definidas
    else {
        contenedor.innerHTML = `
            <div style="text-align: center; padding: 50px; color: #86868b;">
                <i class='bx bx-info-circle' style="font-size: 3rem;"></i>
                <p>La sección <strong>${seccion}</strong> aún está en desarrollo.</p>
            </div>`;
    }
    
}

window.mostrarSeccion = mostrarSeccion;
window.fetchAdmin = fetchAdmin;