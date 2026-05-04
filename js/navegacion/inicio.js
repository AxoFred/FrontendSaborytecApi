const API_URL = "http://saborytecapi.test/api/cliente"; // Añadimos /cliente al final
const STORAGE_URL = "http://saborytecapi.test/storage/";

document.addEventListener("DOMContentLoaded", () => {
    // 1. Verificación de seguridad inmediata
    if (!verificarSesion()) return;

    renderizarBienvenida();
    cargarTiendas();
    cargarProductosDestacados();
});

// Cabeceras con Token Obligatorio
function obtenerHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

function verificarSesion() {
    const token = localStorage.getItem('auth_token');
    if (!token || token === "undefined" || token === "null") {
        console.warn("Acceso denegado: No se encontró token válido.");
        localStorage.clear();
        window.location.href = "../index.html"; // Redirigir al login
        return false;
    }
    return true;
}

function renderizarBienvenida() {
    const userName = localStorage.getItem("user_name") || "Estudiante";
    const welcomeEl = document.getElementById("user-welcome");
    if (welcomeEl) welcomeEl.innerText = `Hola, ${userName}`;
}

// Carga de Tiendas Protegidas
async function cargarTiendas() {
    const grid = document.getElementById("stores-grid");
    if (!grid) return;

    try {
        const response = await fetch(`${API_URL}/tiendas`, {
            method: 'GET',
            headers: obtenerHeaders()
        });

        // Si el servidor rechaza el token (401), la sesión expiró
        if (response.status === 401) {
            manejarSesionExpirada();
            return;
        }

        if (!response.ok) throw new Error("Error en el servidor");
        
        let tiendas = await response.json();
        renderizarTiendas(tiendas, grid);

    } catch (error) {
        console.error("Error cargando tiendas:", error);
        grid.innerHTML = `<p style="color:red">Error de conexión: ${error.message}</p>`;
    }
}

function renderizarTiendas(tiendas, grid) {
    if (!tiendas || tiendas.length === 0) {
        grid.innerHTML = '<p class="text-muted">No hay tiendas disponibles actualmente.</p>';
        return;
    }

    grid.innerHTML = tiendas.map(tienda => {
        const imgPortada = tienda.portada ? STORAGE_URL + tienda.portada : '../Assets/img/default-store.jpg';
        const imgLogo = tienda.logo ? STORAGE_URL + tienda.logo : '../Assets/img/default-logo.png';

        const estaAbierto = tienda.estado === 'activo';

        return `
            <div class="store-card ${!estaAbierto ? 'closed' : ''}" 
                  onclick="window.location.href='explorar.html?tienda=${tienda.ID_tienda}'">
                
                <div class="store-img">
                    <img src="${imgPortada}" class="portada-img" onerror="this.src='../Assets/img/default-store.jpg'">
                    <div class="logo-overlay">
                        <img src="${imgLogo}" onerror="this.src='../Assets/img/default-logo.png'">
                    </div>
                    <span class="store-status ${estaAbierto ? 'status-open' : 'status-closed'}">
                        ${estaAbierto ? 'ABIERTO' : 'CERRADO'}
                    </span>
                </div>

                <div class="store-content">
                    <h4>${tienda.nombre}</h4>
                    <p class="store-desc">${tienda.descripcion || 'Sin descripción disponible.'}</p>
                    
                    <!-- Redes Sociales con Enlaces y Colores -->
                    <div class="store-socials">
                        ${tienda.facebook ? `
                            <a href="${tienda.facebook}" target="_blank" onclick="event.stopPropagation()">
                                <i class='bx bxl-facebook-circle fb'></i>
                            </a>` : ''}
                        ${tienda.instagram ? `
                            <a href="${tienda.instagram}" target="_blank" onclick="event.stopPropagation()">
                                <i class='bx bxl-instagram ig'></i>
                            </a>` : ''}
                        ${tienda.whatsapp ? `
                            <a href="https://wa.me/${tienda.whatsapp}" target="_blank" onclick="event.stopPropagation()">
                                <i class='bx bxl-whatsapp wa'></i>
                            </a>` : ''}
                        ${tienda.tiktok ? `
                            <a href="${tienda.tiktok}" target="_blank" onclick="event.stopPropagation()">
                                <i class='bx bxl-tiktok tk'></i>
                            </a>` : ''}
                    </div>

                    <div class="store-bank-info">
                        <small><strong>Pago:</strong> ${tienda.banco || 'N/A'} - ${tienda.titular_cuenta || ''}</small>
                        <br>
                        <small class="text-muted">CLABE: ${tienda.clabe || 'No disponible'}</small>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Carga de Productos Destacados Protegidos
async function cargarProductosDestacados() {
    const grid = document.getElementById("featured-grid");
    if (!grid) return;

    try {
        const response = await fetch(`${API_URL}/productos/destacados`, {
            method: 'GET',
            headers: obtenerHeaders()
        });
        
        if (response.status === 401) return manejarSesionExpirada();
        if (!response.ok) throw new Error('Error en destacados');
        
        const productos = await response.json();

        grid.innerHTML = productos.map(p => `
            <article class="product-card hot">
                <div class="product-img">
                    <img src="${p.imagen ? STORAGE_URL + 'productos/' + p.imagen : '../Assets/img/default-product.png'}" 
                          onerror="this.src='../Assets/img/default-product.png'">
                </div>
                <div class="product-info">
                    <span class="category">${p.nombre_categoria || 'General'}</span>
                    <h3>${p.nombre}</h3>
                    <span class="price">$${parseFloat(p.precio).toFixed(2)}</span>
                    <button class="add-btn" onclick="window.location.href='detalle.html?id=${p.ID_producto}'">
                        VER DETALLES
                    </button>
                </div>
            </article>
        `).join('');
    } catch (error) {
        grid.innerHTML = '<p class="text-muted">No se pudieron cargar los productos destacados.</p>';
    }
}

// Función central para manejar errores de autenticación
function manejarSesionExpirada() {
    alert("Tu sesión ha expirado o es inválida. Por favor inicia sesión nuevamente.");
    localStorage.clear();
    window.location.href = "../index.html"; 
}

// Logout
const logoutBtn = document.querySelector('.cart-btn'); // O el ID de tu botón de salir
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = "../index.html"; 
    });
}