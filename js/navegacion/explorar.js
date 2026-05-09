/**
 * Explorar.js - Lógica para Catálogo de Productos Saborytec
 * Desarrollado por: FREDY & VICTOR
 */

const API_URL = "http://saborytecapi.test/api/cliente";
const STORAGE_URL = "http://saborytecapi.test/storage/";

// Variable para controlar el retraso de la búsqueda (Debounce)
let timeoutBusqueda;

document.addEventListener("DOMContentLoaded", () => {
    // 1. Verificación de seguridad
    if (!verificarSesion()) return;

    // 2. Carga inicial de datos (Filtros y Productos)
    cargarFiltros();
    cargarProductos();

    // 3. Listener para Búsqueda en Tiempo Real (Nombre/Marca)
    const inputBuscar = document.getElementById('inputBuscar');
    if (inputBuscar) {
        inputBuscar.addEventListener('input', () => {
            clearTimeout(timeoutBusqueda);
            timeoutBusqueda = setTimeout(() => {
                cargarProductos();
            }, 350);
        });
    }

    // --- AGREGADO: Listener para Precio Máximo ---
    const inputPrecioMax = document.getElementById('inputPrecioMax');
    if (inputPrecioMax) {
        inputPrecioMax.addEventListener('input', () => {
            clearTimeout(timeoutBusqueda);
            timeoutBusqueda = setTimeout(() => {
                cargarProductos();
            }, 500);
        });
    }

    // 4. Listener para el formulario (Evitar recarga al presionar Enter)
    const filterForm = document.getElementById('filterForm');
    if (filterForm) {
        filterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            cargarProductos();
        });
    }

    // 5. Listener para botón limpiar
    const btnReset = document.getElementById('btnReset');
    if (btnReset) {
        btnReset.addEventListener('click', limpiarFiltros);
    }

    // 6. Listener para Cerrar Sesión
    const btnLogout = document.querySelector('.cart-btn');
    if (btnLogout) {
        btnLogout.addEventListener('click', manejarSesionExpirada);
    }
});

// --- FUNCIONES DE AUTENTICACIÓN ---

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
    if (!token || token === "null" || token === "undefined") {
        window.location.href = "../index.html";
        return false;
    }
    return true;
}

// --- CARGA DE DATOS (API) ---

async function cargarFiltros() {
    try {
        const response = await fetch(`${API_URL}/filtros-data`, {
            headers: obtenerHeaders()
        });
        
        if (response.status === 401) return manejarSesionExpirada();
        
        const data = await response.json();
        const optCat = document.getElementById('optionsCategoria');
        const optTnd = document.getElementById('optionsTienda');

        if (optCat) {
            let htmlCat = '<div class="st-option" data-value="">Todas las Categorías</div>';
            data.categorias.forEach(c => {
                htmlCat += `<div class="st-option" data-value="${c.ID_categoria}">${c.nombre}</div>`;
            });
            optCat.innerHTML = htmlCat;
        }

        if (optTnd) {
            let htmlTnd = '<div class="st-option" data-value="">Todas las Tiendas</div>';
            data.tiendas.forEach(t => {
                htmlTnd += `<div class="st-option" data-value="${t.ID_tienda}">${t.nombre}</div>`;
            });
            optTnd.innerHTML = htmlTnd;
        }

        asignarEventosSelectores();
    } catch (error) {
        console.error("Error cargando filtros:", error);
    }
}

async function cargarProductos() {
    const grid = document.getElementById('foodGrid');
    if (!grid) return;

    const buscar = document.getElementById('inputBuscar').value;
    const categoria = document.getElementById('hiddenCategoria').value;
    const tienda = document.getElementById('hiddenTienda').value;
    
    // --- AGREGADO: Captura de nuevos filtros ---
    const precioMax = document.getElementById('inputPrecioMax')?.value;
    const disponible = document.getElementById('hiddenDisponible')?.value;

    const btnReset = document.getElementById('btnReset');
    if (btnReset) {
        // Actualizado para mostrar el botón si cualquiera de los 5 filtros tiene valor
        btnReset.style.display = (buscar || categoria || tienda || precioMax || disponible) ? 'inline-block' : 'none';
    }

    try {
        const params = new URLSearchParams();
        if (buscar) params.append('buscar', buscar);
        if (categoria) params.append('categoria', categoria);
        if (tienda) params.append('tienda', tienda);
        
        // --- AGREGADO: Parámetros a la URL ---
        if (precioMax) params.append('precio_max', precioMax);
        if (disponible) params.append('disponible', disponible);

        const response = await fetch(`${API_URL}/explorar?${params.toString()}`, {
            headers: obtenerHeaders()
        });

        if (response.status === 401) return manejarSesionExpirada();
        
        const productos = await response.json();

        if (!productos || productos.length === 0) {
            grid.innerHTML = '<p class="no-results" style="grid-column: 1/-1; text-align: center; color: white; padding: 40px; font-weight: 300;">No se encontraron productos disponibles.</p>';
            return;
        }

        renderizarProductos(productos, grid);
    } catch (error) {
        console.error("Error en cargarProductos:", error);
        grid.innerHTML = '<p class="error-msg" style="grid-column: 1/-1; text-align: center; color: #ff6b6b;">Error de conexión con el servidor.</p>';
    }
}

// --- RENDERIZADO DE UI ---

function renderizarProductos(productos, grid) {
    grid.innerHTML = productos.map(p => {
        const imgPath = p.imagen ? `${STORAGE_URL}productos/${p.imagen}` : '../Assets/img/default-product.png';
        
        return `
            <article class="food-card">
                <div class="food-image-badge">
                    <span class="badge-tipo">${p.nombre_categoria || 'General'}</span>
                    <img src="${imgPath}" alt="${p.nombre}" onerror="this.src='../Assets/img/default-product.png'">
                </div>
                <div class="food-info">
                    <span class="store-name">📍 ${p.nombre_tienda}</span>
                    <h3 class="food-name">${p.nombre}</h3>
                    <p class="food-brand">${p.marca || 'S/M'}</p>
                    <p class="food-desc">${p.descripcion ? p.descripcion.substring(0, 65) + '...' : 'Sin descripción disponible.'}</p>
                    <div class="food-footer">
                        <span class="food-price">$${parseFloat(p.precio).toFixed(2)}</span>
                        <button onclick="agregarAlCarrito(${p.ID_producto})" class="btn-order">
                             <i class="fas fa-plus"></i> Agregar
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join('');
}

// --- ACCIONES DEL CARRITO ---

async function agregarAlCarrito(idProducto) {
    try {
        const response = await fetch(`${API_URL}/carrito/agregar`, {
            method: 'POST',
            headers: obtenerHeaders(),
            body: JSON.stringify({
                ID_producto: idProducto,
                cantidad: 1
            })
        });

        if (response.status === 401) {
            manejarSesionExpirada();
            return;
        }

        const data = await response.json();

        if (response.ok) {
            mostrarNotificacion(data.message || "¡Producto agregado!", "success");
        } else {
            mostrarNotificacion(data.message || "Error al agregar", "error");
        }

    } catch (error) {
        console.error("Error en agregarAlCarrito:", error);
        mostrarNotificacion("Error de conexión con el servidor", "error");
    }
}

function mostrarNotificacion(mensaje, tipo) {
    const notification = document.createElement('div');
    const colorFondo = tipo === 'success' ? '#28a745' : '#dc3545';
    
    notification.style = `
        position: fixed; 
        bottom: 20px; 
        right: 20px; 
        background: ${colorFondo}; 
        color: white; 
        padding: 12px 25px; 
        border-radius: 15px; 
        z-index: 9999; 
        font-family: 'SF Pro Display', sans-serif;
        box-shadow: 0 8px 20px rgba(0,0,0,0.2);
        animation: fadeIn 0.4s ease;
    `;
    
    notification.innerHTML = mensaje;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s ease';
        setTimeout(() => notification.remove(), 500);
    }, 2500);
}

// --- INTERACCIÓN DE INTERFAZ ---

function asignarEventosSelectores() {
    document.querySelectorAll('.st-custom-select').forEach(select => {
        const trigger = select.querySelector('.st-select-trigger');
        const optionsContainer = select.querySelector('.st-custom-options');
        const hiddenInput = select.querySelector('input[type="hidden"]');
        const textLabel = select.querySelector('span');

        if (!trigger || !optionsContainer) return;

        trigger.onclick = (e) => {
            e.stopPropagation();
            document.querySelectorAll('.st-custom-select').forEach(s => {
                if (s !== select) s.classList.remove('open');
            });
            select.classList.toggle('open');
        };

        optionsContainer.onclick = (e) => {
            const option = e.target.closest('.st-option');
            if (option) {
                const val = option.getAttribute('data-value');
                const label = option.innerText;
                
                hiddenInput.value = val;
                textLabel.innerText = label;
                select.classList.remove('open');
                
                cargarProductos(); 
            }
        };
    });
}

function limpiarFiltros() {
    document.getElementById('inputBuscar').value = '';
    document.getElementById('hiddenCategoria').value = '';
    document.getElementById('hiddenTienda').value = '';
    
    // --- AGREGADO: Reset de nuevos filtros ---
    if(document.getElementById('inputPrecioMax')) document.getElementById('inputPrecioMax').value = '';
    if(document.getElementById('hiddenDisponible')) {
        document.getElementById('hiddenDisponible').value = '';
        document.getElementById('textDisponible').innerText = 'Disponibilidad';
    }

    document.getElementById('textCategoria').innerText = 'Categorías';
    document.getElementById('textTienda').innerText = 'Tiendas';
    cargarProductos();
}

function toggleFilters() {
    const panel = document.getElementById('filtersPanel');
    if (panel) panel.classList.toggle('active');
}

function manejarSesionExpirada() {
    localStorage.clear();
    window.location.href = "../index.html";
}

window.onclick = (e) => {
    if (!e.target.closest('.st-custom-select')) {
        document.querySelectorAll('.st-custom-select').forEach(s => s.classList.remove('open'));
    }
};