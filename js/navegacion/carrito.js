/**
 * Saborytec | Gestión de Carrito Multitienda
 * Desarrollado por Fredy & Victor
 */

// 1. CONFIGURACIÓN GLOBAL
const API_URL = "http://saborytecapi.test/api/cliente";
const BACKEND_URL = "http://saborytecapi.test"; 
const RUTA_DEFAULT = "../assets/imagenes/carrito.png"; 

let esPrimeraCarga = true;

// 2. INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', () => {
    inicializarCarrito();
});

// 3. FUNCIÓN PRINCIPAL
async function inicializarCarrito() {
    const container = document.getElementById('carritos-container');
    const emptyState = document.getElementById('carrito-vacio');

    try {
        const response = await fetch(`${API_URL}/carrito/ver`, {
            method: 'GET',
            headers: obtenerHeaders() 
        });

        if (response.status === 401) {
            return manejarSesionExpirada();
        }

        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            if (container) container.style.display = 'none';
            if (emptyState) emptyState.style.display = 'flex';
            return;
        }

        const carritosAgrupados = agruparPorTienda(data);
        renderizarInterfaz(carritosAgrupados, container);
        
        if (emptyState) emptyState.style.display = 'none';
        if (container) container.style.display = 'grid';

        esPrimeraCarga = false;

    } catch (error) {
        console.error("Error Saborytec:", error);
    }
}

// 4. AGRUPAR
function agruparPorTienda(items) {
    return items.reduce((acc, item) => {
        const idTienda = item.ID_tienda;
        if (!acc[idTienda]) {
            acc[idTienda] = {
                nombre: item.nombre_tienda || "Tienda Universitaria",
                productos: []
            };
        }
        acc[idTienda].productos.push(item);
        return acc;
    }, {});
}

// 5. RENDER
function renderizarInterfaz(agrupados, container) {
    if (!container) return;
    container.innerHTML = ''; 

    Object.keys(agrupados).forEach(tiendaId => {
        const tienda = agrupados[tiendaId];
        let totalTienda = 0;

        const tiendaSection = document.createElement('section');
        
        tiendaSection.className = esPrimeraCarga 
            ? 'tienda-card animate-slide-up' 
            : 'tienda-card';

        const productosHTML = tienda.productos.map(p => {
            const subtotal = p.precio * p.cantidad;
            totalTienda += subtotal;

            const urlImagen = p.imagen ? p.imagen : RUTA_DEFAULT;

            return `
                <div class="item-fila" data-id="${p.ID_carrito}" data-precio="${p.precio}">
                    <div class="item-img-container">
                        <img src="${urlImagen}" 
                             alt="${p.nombre_producto}"
                             onerror="this.src='${RUTA_DEFAULT}';">
                    </div>
                    <div class="item-detalles">
                        <h3 class="item-titulo">${p.nombre_producto}</h3>
                        <p class="item-meta">$${p.precio} c/u</p>
                        <div class="item-subtotal" id="subtotal-${p.ID_carrito}">
                            $${subtotal.toFixed(2)}
                        </div>
                    </div>
                    
                    <div class="item-acciones">
                        <div class="control-cantidad">
                            <button onclick="cambiarCantidad(${p.ID_carrito}, 'restar')">
                                <i class="fas fa-minus"></i>
                            </button>

                            <span id="cantidad-${p.ID_carrito}">
                                ${p.cantidad}
                            </span>

                            <button onclick="cambiarCantidad(${p.ID_carrito}, 'sumar')">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>

                        <button class="btn-eliminar" onclick="eliminarDelCarrito(${p.ID_carrito})">
                            <i class="far fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        tiendaSection.innerHTML = `
            <div class="tienda-header">
                <div class="tienda-info">
                    <i class="fas fa-shopping-bag"></i>
                    <h2>${tienda.nombre}</h2>
                </div>
                <span class="badge-items">${tienda.productos.length} productos</span>
            </div>

            <div class="tienda-cuerpo">${productosHTML}</div>

            <div class="tienda-footer">
                <div class="total-container">
                    <span>Total a pagar:</span>
                    <span class="total-monto" id="total-${tiendaId}">$${totalTienda.toFixed(2)}</span>
                </div>

                <button class="btn-checkout" onclick="procederPago(${tiendaId})">
                    PAGAR AHORA <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        `;

        container.appendChild(tiendaSection);
    });
}

// 6. CAMBIAR CANTIDAD (ARREGLADO)
async function cambiarCantidad(idCarrito, accion) {

    const cantidadSpan = document.getElementById(`cantidad-${idCarrito}`);
    const subtotalDiv = document.getElementById(`subtotal-${idCarrito}`);

    if (!cantidadSpan) return;

    let cantidadActual = parseInt(cantidadSpan.textContent);

    let nuevaCantidad = accion === 'sumar'
        ? cantidadActual + 1
        : cantidadActual - 1;

    if (nuevaCantidad < 1) {
        return eliminarDelCarrito(idCarrito);
    }

    
    cantidadSpan.textContent = nuevaCantidad;

    // actualizar subtotal
    const item = cantidadSpan.closest('.item-fila');
    const precio = item ? Number(item.dataset.precio) : 0;

    if (subtotalDiv && precio) {
        subtotalDiv.textContent = `$${(precio * nuevaCantidad).toFixed(2)}`;
    }

    
    const tiendaSection = cantidadSpan.closest('.tienda-card');
    const totalSpan = tiendaSection.querySelector('.total-monto');

    let nuevoTotal = 0;

    // recorrer todos los subtotales de esa tienda
    tiendaSection.querySelectorAll('.item-subtotal').forEach(el => {
        const valor = parseFloat(el.textContent.replace(/[^0-9.]/g, ''));
        if (!isNaN(valor)) {
            nuevoTotal += valor;
        }
    });

    if (totalSpan) {
        totalSpan.textContent = `$${nuevoTotal.toFixed(2)}`;
    }

    try {
        const response = await fetch(`${API_URL}/carrito/actualizar/${idCarrito}`, {
            method: 'PUT',
            headers: obtenerHeaders(),
            body: JSON.stringify({ cantidad: nuevaCantidad })
        });

        if (!response.ok) throw new Error();

    } catch (e) {
        console.error("Error:", e);
        inicializarCarrito(); // fallback
    }
}

// 7. ELIMINAR
async function eliminarDelCarrito(idCarrito) {
    if(!confirm("¿Deseas quitar este producto de tu carrito?")) return;
    
    try {
        const res = await fetch(`${API_URL}/carrito/eliminar/${idCarrito}`, {
            method: 'DELETE',
            headers: obtenerHeaders()
        });
        
        if(res.ok) {
            inicializarCarrito(); 
        }

    } catch (e) {
        console.error("Error al eliminar:", e);
    }
}

// 8. UTILIDADES
function obtenerHeaders() {
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
    };
} 

function manejarSesionExpirada() {
    localStorage.clear();
    alert("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
    window.location.href = 'login.html';
}

function procederPago(idTienda) {
    localStorage.setItem('tienda_a_pagar', idTienda);
    window.location.href = `pago.html?id_tienda=${idTienda}`;
}

function cerrarSesion() {
    // limpiar tokens (igual que tu sistema)
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token');

    // opcional pero recomendable
    localStorage.clear();

    // redirigir al login
    window.location.href = 'login.html';
}