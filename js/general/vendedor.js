/**
 * Saborytec - Control del Panel Vendedor
 * Desarrollado por: FREDY & VICTOR
 */

{
    //const API_BASE = "https://saborytecapi-production.up.railway.app/api";
    const API_BASE = "http://saborytecapi.test/api";

    // ============================================================
    // HELPER PARA PETICIONES (TOKEN BEARER)
    // ============================================================
    async function fetchVendedor(endpoint) {
        const token = localStorage.getItem("auth_token");
        
        if (!token) {
            alert("Sesión expirada. Por favor, inicia sesión de nuevo.");
            window.location.href = "../login.html";
            return null;
        }

        try {
            const response = await fetch(`${API_BASE}/${endpoint}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                }
            });

            if (response.status === 401) {
                console.warn("Token inválido o expirado");
                localStorage.clear();
                window.location.href = "../login.html";
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error("Error API Vendedor:", error);
            return null;
        }
    }

    // ============================================================
    // GESTOR DE NAVEGACIÓN DINÁMICA
    // ============================================================
    window.mostrarSeccion = async function(seccion) {
        const contenedor = document.getElementById("contenido-dinamico");
        if (!contenedor) return;

        // Reiniciar animación fade-in
        contenedor.classList.remove('fade-in');
        void contenedor.offsetWidth; 
        contenedor.classList.add('fade-in');

        switch (seccion) {
            case "tienda":
                contenedor.innerHTML = `
                    <div class="loader-container" style="text-align:center; padding:50px;">
                        <p style="color: var(--text-muted);">Cargando perfil de tu tienda...</p>
                    </div>`;
                
                if (typeof window.obtenerMiTienda === "function") {
                    await window.obtenerMiTienda(); 
                } else {
                    mostrarErrorModulo(contenedor, "Tienda");
                }
                break;

            case "productos":
                if (typeof window.mostrarSeccionProductos === "function") {
                    window.mostrarSeccionProductos(); 
                } else {
                    mostrarErrorModulo(contenedor, "Productos");
                }
                break;

            case "pedidos":
                // Cambiado: Ahora llama al módulo de pedidos que desarrollamos
                if (typeof window.mostrarSeccionPedidos === "function") {
                    window.mostrarSeccionPedidos(); 
                } else {
                    mostrarErrorModulo(contenedor, "Pedidos");
                }
                break;

            case "horarios":
                contenedor.innerHTML = `
                    <div class="loader-container" style="text-align:center; padding:50px;">
                        <i class='bx bx-loader-alt bx-spin' style="font-size: 2rem; color: var(--primary);"></i>
                        <p style="color: var(--text-muted); margin-top: 10px;">Cargando gestión de horarios...</p>
                    </div>`;
                
                if (typeof window.obtenerHorarios === "function") {
                    await window.obtenerHorarios(); 
                } else {
                    mostrarErrorModulo(contenedor, "Horarios");
                }
                break;
                
            case "reportes":
                contenedor.innerHTML = `
                    <div class="loader-container" style="text-align:center; padding:50px;">
                        <i class='bx bx-loader-alt bx-spin' style="font-size: 2rem; color: var(--primary);"></i>
                        <p style="color: var(--text-muted); margin-top: 10px;">Cargando gestión de reportes...</p>
                    </div>`;
                
                if (typeof window.obtenerReportes === "function") {
                    await window.obtenerReportes(); 
                } else {
                    mostrarErrorModulo(contenedor, "Reportes");
                }
                break;

            case "ayuda":
                contenedor.innerHTML = `
                    <div class="empty-state" style="text-align:center; padding:80px; opacity:0.6;">
                        <i class='bx bx-code-alt' style="font-size: 4rem; color: var(--primary);"></i>
                        <h3 style="margin-top:15px;">Módulo en Desarrollo</h3>
                        <p>La sección de ${seccion} estará disponible pronto en Saborytec.</p>
                    </div>`;
                break;

            default:
                contenedor.innerHTML = `<p>Sección no encontrada.</p>`;
        }
    };

    // Función auxiliar para errores de carga de scripts
    function mostrarErrorModulo(contenedor, nombreModulo) {
        console.error(`Error: El script de ${nombreModulo} no se ha detectado.`);
        contenedor.innerHTML = `
            <div style="text-align:center; padding:40px; background: rgba(255,255,255,0.05); border-radius:15px; border: 1px solid rgba(255,255,255,0.1);">
                <i class='bx bx-error-circle' style="font-size: 3rem; color: #ff4d4d;"></i>
                <p style="margin-top:10px; color: #fff;">El módulo de <strong>${nombreModulo}</strong> no está cargado.</p>
                <p style="font-size:0.8rem; color:gray;">Asegúrate de incluir el archivo .js en tu HTML.</p>
                <button onclick="location.reload()" style="margin-top:15px; padding:8px 20px; border-radius:8px; border:none; background:var(--primary); color:white; cursor:pointer;">
                    Reintentar
                </button>
            </div>`;
    }

    // Exponer fetchVendedor al scope global
    window.fetchVendedor = fetchVendedor;
}