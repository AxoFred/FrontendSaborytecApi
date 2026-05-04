/**
 * Saborytec - Control del Panel Vendedor
 * Desarrollado por: FREDY & VICTOR
 */

{
    const API_BASE = "http://saborytecapi.test/api";

    // ============================================================
    // HELPER PARA PETICIONES (TOKEN BEARER)
    // ============================================================
    async function fetchVendedor(endpoint) {
        // Sincronizado con la llave 'auth_token' usada en el resto del proyecto
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

        // Limpiar clases de animación previas si fuera necesario
        contenedor.classList.remove('fade-in');
        void contenedor.offsetWidth; // Trigger reflow para reiniciar animación
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
                contenedor.innerHTML = `
                    <div class="empty-state" style="text-align:center; padding:80px; opacity:0.6;">
                        <i class='bx bxs-receipt' style="font-size: 4rem; color: var(--primary);"></i>
                        <h3 style="margin-top:15px;">Módulo de Pedidos</h3>
                        <p>Esta sección está actualmente en desarrollo para Saborytec.</p>
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
            <div style="text-align:center; padding:40px; background: var(--bg-card); border-radius:15px; border: 1px solid var(--border-color);">
                <i class='bx bx-error-circle' style="font-size: 3rem; color: var(--danger);"></i>
                <p style="margin-top:10px; color: var(--text-main);">El módulo de <strong>${nombreModulo}</strong> no está disponible o no se cargó correctamente.</p>
                <button onclick="location.reload()" style="margin-top:15px; padding:8px 20px; border-radius:8px; border:none; background:var(--primary); color:white; cursor:pointer;">
                    Reintentar
                </button>
            </div>`;
    }

    // Exponer fetchVendedor al scope global por si otros scripts lo necesitan
    window.fetchVendedor = fetchVendedor;
}