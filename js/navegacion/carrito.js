/**
 * Saborytec | Gestión de Carrito Multitienda
 * Desarrollado por Fredy
 */

// 1. CONFIGURACIÓN GLOBAL
//const API_URL = "https://saborytecapi-production.up.railway.app/api/cliente";
//const BACKEND_URL = "https://saborytecapi-production.up.railway.app";

const API_URL = "http://saborytecapi.test/api/cliente";
const BACKEND_URL = "http://saborytecapi.test";

const RUTA_DEFAULT = "../assets/imagenes/carrito.png";

let esPrimeraCarga = true;
let tiendaSeleccionadaId = null; // <-- Agregado para el flujo de pago
let datosCarritoGlobal = []; // <-- Variable para guardar los datos y extraer info bancaria

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
        datosCarritoGlobal = data; // <-- Guardamos la data aquí sin modificar el flujo

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

function getImageUrl(imagen) {
    if (!imagen) return RUTA_DEFAULT;

    if (imagen.startsWith('http://') || imagen.startsWith('https://')) {
        return imagen;
    }

    const clean = imagen
        .replace(/^\/+/, '')
        .replace(/^views\//, '')
        .replace(/^storage\/productos\//, '')
        .replace(/^productos\//, '');

    return `${BACKEND_URL}/storage/productos/${clean}`;
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
            const subtotal = Number(p.precio) * Number(p.cantidad);
            totalTienda += subtotal;

            const urlImagen = getImageUrl(p.imagen);

            return `
                <div class="item-fila" data-id="${p.ID_carrito}" data-precio="${p.precio}">
                    <div class="item-img-container">
                        <img 
                            src="${urlImagen}" 
                            alt="${p.nombre_producto}"
                            onerror="this.src='${RUTA_DEFAULT}'"
                        >
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
                            <button onclick="cambiarCantidad(${p.ID_carrito}, 'restar')">-</button>
                            <span id="cantidad-${p.ID_carrito}">${p.cantidad}</span>
                            <button onclick="cambiarCantidad(${p.ID_carrito}, 'sumar')">+</button>
                        </div>
                        <button class="btn-eliminar" onclick="eliminarDelCarrito(${p.ID_carrito})">
                            🗑
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        tiendaSection.innerHTML = `
            <div class="tienda-header">
                <div class="tienda-info">
                    <h2>${tienda.nombre}</h2>
                </div>
                <span>${tienda.productos.length} productos</span>
            </div>

            <div class="tienda-cuerpo">
                ${productosHTML}
            </div>

            <div class="tienda-footer" style="padding: 20px; border-top: 1px solid rgba(255,255,255,0.05);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <span style="color: #888; font-size: 0.9rem;">Subtotal</span>
                    <strong style="font-size: 1.2rem;">Total: <span class="total-monto">$${totalTienda.toFixed(2)}</span></strong>
                </div>
                
                <button onclick="procederPago(${tiendaId})" style="
                    width: 100%;
                    background: #376072;
                    color: white;
                    border: none;
                    padding: 15px;
                    border-radius: 14px;
                    font-weight: 700;
                    cursor: pointer;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                ">
                    Confirmar Pedido
                </button>
            </div>
        `;

        container.appendChild(tiendaSection);
    });
}

// 6. CAMBIAR CANTIDAD
async function cambiarCantidad(idCarrito, accion) {
    const cantidadSpan = document.getElementById(`cantidad-${idCarrito}`);
    const subtotalDiv = document.getElementById(`subtotal-${idCarrito}`);

    if (!cantidadSpan) return;

    let cantidadActual = parseInt(cantidadSpan.textContent);
    let nuevaCantidad = accion === 'sumar' ? cantidadActual + 1 : cantidadActual - 1;

    if (nuevaCantidad < 1) {
        return eliminarDelCarrito(idCarrito);
    }

    cantidadSpan.textContent = nuevaCantidad;
    const item = cantidadSpan.closest('.item-fila');
    const precio = item ? Number(item.dataset.precio) : 0;

    if (subtotalDiv) {
        subtotalDiv.textContent = `$${(precio * nuevaCantidad).toFixed(2)}`;
    }

    const tiendaSection = cantidadSpan.closest('.tienda-card');
    const totalSpan = tiendaSection.querySelector('.total-monto');

    let nuevoTotal = 0;
    tiendaSection.querySelectorAll('.item-subtotal').forEach(el => {
        const valor = parseFloat(el.textContent.replace(/[^0-9.]/g, ''));
        if (!isNaN(valor)) nuevoTotal += valor;
    });

    if (totalSpan) {
        totalSpan.textContent = `$${nuevoTotal.toFixed(2)}`;
    }

    try {
        await fetch(`${API_URL}/carrito/actualizar/${idCarrito}`, {
            method: 'PUT',
            headers: obtenerHeaders(),
            body: JSON.stringify({ cantidad: nuevaCantidad })
        });
    } catch (e) {
        console.error("Error:", e);
        inicializarCarrito();
    }
}

// 7. ELIMINAR
async function eliminarDelCarrito(idCarrito) {
    if (!confirm("¿Deseas quitar este producto de tu carrito?")) return;

    try {
        const res = await fetch(`${API_URL}/carrito/eliminar/${idCarrito}`, {
            method: 'DELETE',
            headers: obtenerHeaders()
        });

        if (res.ok) {
            inicializarCarrito();
        }
    } catch (e) {
        console.error("Error al eliminar:", e);
    }
}

// 8. UTILIDADES Y LÓGICA DE PAGO (Aquí agregamos lo nuevo)
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

/** * NUEVAS FUNCIONES PARA EL FLUJO DE PAGO REAL
 */

function procederPago(idTienda) {
    tiendaSeleccionadaId = idTienda;
    localStorage.setItem('tienda_a_pagar', idTienda);

    // --- LÓGICA DE DATOS BANCARIOS DINÁMICOS ---
    const infoTienda = datosCarritoGlobal.find(item => item.ID_tienda == idTienda);
    if (infoTienda) {
        document.getElementById('txt-banco').innerText = infoTienda.banco || "No disponible";
        document.getElementById('txt-titular').innerText = infoTienda.titular_cuenta || "No disponible";
        document.getElementById('txt-clabe').innerText = infoTienda.clabe || "No disponible";
    }
    // ------------------------------------------
    
    const modal = document.getElementById('modal-pago');
    if(modal) modal.classList.add('active');
}

function cerrarModal() {
    const modal = document.getElementById('modal-pago');
    if(modal) modal.classList.remove('active');
}

function toggleMetodoPago(metodo) {
    const infoBanco = document.getElementById('info-bancaria');
    if (!infoBanco) return;
    infoBanco.style.display = (metodo === 'transferencia') ? 'block' : 'none';
}

async function finalizarPedido() {
    const metodoInput = document.querySelector('input[name="metodo"]:checked');
    if (!metodoInput) return alert("Selecciona un método de pago");

    const metodo = metodoInput.value;
    const btn = document.querySelector('.btn-finalizar');
    
    if(btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span> Procesando...';
    }

    try {
        const response = await fetch(`${API_URL}/pedidos/crear`, {
            method: 'POST',
            headers: obtenerHeaders(),
            body: JSON.stringify({
                id_tienda: tiendaSeleccionadaId,
                metodo_pago: metodo
            })
        });

        if (response.ok) {
            window.location.href = 'MisPedidos.html';
        } else {
            const errorData = await response.json();
            alert(errorData.message || "Error al procesar el pedido.");
            if(btn) {
                btn.disabled = false;
                btn.textContent = "Confirmar y Finalizar";
            }
        }
    } catch (error) {
        console.error("Error Saborytec:", error);
        alert("Error de conexión con el servidor.");
        if(btn) {
            btn.disabled = false;
            btn.textContent = "Confirmar y Finalizar";
        }
    }
}

function cerrarSesion() {
    localStorage.clear();
    window.location.href = 'login.html';
}