/**
 * Saborytec - Gestión de Pedidos (Lado Cliente)
 * Autores: FREDY
 */

//const API_BASE = "https://saborytecapi-production.up.railway.app/api";
//const STORAGE_BASE = "https://saborytecapi-production.up.railway.app/storage/";

const API_BASE = "http://saborytecapi.test/api";
const STORAGE_BASE = "http://saborytecapi.test/storage/";

const token = localStorage.getItem('auth_token');

let currentPedidoId = null;
let chatInterval = null;
let ultimoChatRenderizado = "";
let ratingSeleccionado = 0; // Para el sistema de estrellas
let esActualizacion = false; // Nueva bandera interna

document.addEventListener('DOMContentLoaded', () => {
    if (!token) { window.location.href = 'login.html'; return; }
    fetchMisPedidos();
});

// --- LÓGICA DE PEDIDOS ---
async function fetchMisPedidos() {
    const contenedor = document.getElementById('contenedor-pedidos');
    try {
        const response = await fetch(`${API_BASE}/cliente/pedidos/mis-pedidos`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        const pedidos = await response.json();
        contenedor.innerHTML = '';

        if (pedidos.length === 0) {
            contenedor.innerHTML = '<p style="text-align:center; opacity:0.6; padding:20px;">No tienes pedidos activos.</p>';
            return;
        }

        pedidos.forEach(pedido => {
            const nombreTienda = pedido.tienda ? pedido.tienda.nombre : 'Tienda Saborytec';
            const card = document.createElement('div');
            card.className = 'card-pedido';
            
            const esEntregado = pedido.estado === 'entregado';
            // CAMBIO: Si el pedido ya tiene calificación, cambiamos el texto
            const btnLabel = esEntregado ? (pedido.calificacion ? 'ACTUALIZAR CALIFICACIÓN' : 'CALIFICAR SERVICIO') : 'CHAT Y COMPROBANTE';
            const btnClass = esEntregado ? 'btn-chat entregado' : 'btn-chat';
            
            // CAMBIO: Pasamos el objeto calificacion si existe
            const califData = pedido.calificacion ? JSON.stringify(pedido.calificacion).replace(/"/g, "'") : 'null';
            const funcionClick = esEntregado 
                ? `abrirModalCalificacion(${pedido.ID_pedido}, ${califData})` 
                : `abrirChatModal(${pedido.ID_pedido}, '${nombreTienda}')`;

            card.innerHTML = `
                <div class="card-header">
                    <span class="order-id">#${pedido.ID_pedido}</span>
                    <span class="status-pill ${pedido.estado}">${pedido.estado.toUpperCase()}</span>
                </div>
                <h2 class="tienda-name">${nombreTienda}</h2>
                <div class="order-details">Monto: <b>$${pedido.total}</b> • ${pedido.metodo_pago}</div>
                <button class="${btnClass}" onclick="${funcionClick}">
                    <i class="fas ${esEntregado ? 'fa-star' : 'fa-comment-dots'}"></i> ${btnLabel}
                </button>
            `;
            contenedor.appendChild(card);
        });
    } catch (e) { contenedor.innerHTML = "<p>Error al cargar pedidos.</p>"; }
}

// --- LÓGICA DEL CHAT MODAL ---
async function abrirChatModal(idPedido, nombreTienda) {
    currentPedidoId = idPedido;
    // BLOQUEA EL SCROLL DEL BODY
    document.body.style.overflow = 'hidden';

    document.getElementById('chat-tienda-nombre').innerText = nombreTienda;
    document.getElementById('chat-orden-id').innerText = `Orden #${idPedido}`;
    document.getElementById('modal-chat').style.display = 'flex';
    ultimoChatRenderizado = "";
    
    document.getElementById('input-wrapper-cliente').style.display = 'flex';
    const avisoPrevio = document.getElementById('aviso-bloqueo-cliente');
    if (avisoPrevio) avisoPrevio.remove();

    await cargarMensajes();
    
    if (chatInterval) clearInterval(chatInterval);
    chatInterval = setInterval(cargarMensajes, 5000);
}

function cerrarChatModal() {
    document.getElementById('modal-chat').style.display = 'none';
    // RESTAURA EL SCROLL NORMAL DEL HTML
    document.body.style.overflow = '';
    if (chatInterval) clearInterval(chatInterval);
}

async function cargarMensajes() {
    if (!currentPedidoId) return;
    try {
        const response = await fetch(`${API_BASE}/cliente/pedidos/${currentPedidoId}/mensajes`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            gestionarInterfazBloqueo(data.estado_pedido);

            const hashMensajes = JSON.stringify(data.mensajes);
            if (hashMensajes !== ultimoChatRenderizado) {
                ultimoChatRenderizado = hashMensajes;
                renderizarMensajes(data.mensajes);
            }
        }
    } catch (e) { console.error("Error al sincronizar chat:", e); }
}

function gestionarInterfazBloqueo(estado) {
    const inputWrapper = document.getElementById('input-wrapper-cliente'); 
    const footer = document.querySelector('.modal-chat-content'); 
    const estadosCierre = ['entregado', 'finalizado', 'cancelado'];

    if (estadosCierre.includes(estado)) {
        if (inputWrapper) inputWrapper.style.display = 'none';
        
        if (!document.getElementById('aviso-bloqueo-cliente')) {
            const aviso = document.createElement('div');
            aviso.id = 'aviso-bloqueo-cliente';
            aviso.className = 'aviso-bloqueo'; 
            aviso.style.cssText = "width:100%; text-align:center; padding:20px; background:rgba(0,0,0,0.2); border-radius:15px; margin-top:10px;";
            
            if (estado === 'entregado') {
                aviso.innerHTML = `
                    <div style="color: #34c759; font-weight: bold; margin-bottom: 10px;">
                        <i class='fas fa-check-circle'></i> ¡DISFRUTA TU COMIDA!
                    </div>
                    <button class="btn-chat entregado" style="width:100%" onclick="abrirModalCalificacion(${currentPedidoId})">
                        CALIFICAR SERVICIO
                    </button>`;
            } else {
                aviso.innerHTML = `<span style="color:#ff3b30;"><i class='fas fa-lock'></i> Orden finalizada (${estado})</span>`;
            }
            footer.appendChild(aviso);
        }
    } else {
        if (inputWrapper) inputWrapper.style.display = 'flex';
        const aviso = document.getElementById('aviso-bloqueo-cliente');
        if (aviso) aviso.remove();
    }
}

function renderizarMensajes(mensajes) {
    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML = "";
    
    if (mensajes.length === 0) {
        chatBox.innerHTML = '<p style="text-align:center; opacity:0.4; margin-top:20px;">No hay mensajes. ¡Saluda al vendedor!</p>';
        return;
    }

    mensajes.forEach(msg => {
        const div = document.createElement('div');
        div.className = `message ${msg.es_de_tienda ? 'in' : 'out'}`;
        
        let contenido = msg.tipo === 'imagen' 
            ? `<img src="${STORAGE_BASE}${msg.archivo_path}" class="img-msg" onclick="window.open(this.src)" style="max-width:200px; border-radius:10px; cursor:pointer;">` 
            : `<span>${msg.mensaje}</span>`;
        
        const hora = new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        div.innerHTML = `
            <div class="bubble">
                ${contenido}
                <small class="chat-time" style="display:block; font-size:0.7rem; opacity:0.6; margin-top:4px; text-align:right;">${hora}</small>
            </div>`;
        chatBox.appendChild(div);
    });
    chatBox.scrollTop = chatBox.scrollHeight;
}

// --- LÓGICA DE CALIFICACIÓN ---
function abrirModalCalificacion(idPedido, califObj = null) {
    currentPedidoId = idPedido;
    esActualizacion = !!califObj; // Si llega objeto, es actualización
    
    cerrarChatModal(); 
    document.getElementById('modal-calificacion').style.display = 'flex';
    
    if (esActualizacion) {
        document.getElementById('comentario-calificacion').value = califObj.comentario || "";
        setRating(califObj.puntuacion);
    } else {
        document.getElementById('comentario-calificacion').value = "";
        setRating(0);
    }
}

function cerrarModalCalificacion() {
    document.getElementById('modal-calificacion').style.display = 'none';
     document.body.style.overflow = '';
}

function setRating(n) {
    ratingSeleccionado = n;
    const estrellas = document.querySelectorAll('.star');
    estrellas.forEach((s, index) => {
        if (index < n) {
            s.classList.replace('far', 'fas');
            s.style.color = "#ffcc00";
        } else {
            s.classList.replace('fas', 'far');
            s.style.color = "#666";
        }
    });
}

async function enviarCalificacion() {
    if (ratingSeleccionado === 0) {
        alert("Por favor, selecciona una puntuación.");
        return;
    }

    const comentario = document.getElementById('comentario-calificacion').value.trim();
    // CAMBIO: Definir método y URL dinámicamente
    const method = esActualizacion ? 'PUT' : 'POST';
    const url = esActualizacion ? `${API_BASE}/cliente/calificaciones/${currentPedidoId}` : `${API_BASE}/cliente/calificaciones`;

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                ID_pedido: currentPedidoId,
                puntuacion: ratingSeleccionado,
                comentario: comentario
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert(esActualizacion ? "¡Calificación actualizada con éxito!" : "¡Gracias por calificar tu pedido!");
            cerrarModalCalificacion();
            fetchMisPedidos(); 
        } else {
            alert(data.message || "Error al calificar.");
        }
    } catch (e) {
        console.error(e);
        alert("Error de conexión al calificar.");
    }
}

// --- FUNCIONES DE ENVÍO ---
async function enviarMensaje() {
    const msgInput = document.getElementById('mensaje-texto');
    const fileInput = document.getElementById('input-comprobante');
    
    if (msgInput.disabled || (!msgInput.value.trim() && fileInput.files.length === 0)) return;

    const formData = new FormData();
    formData.append('ID_pedido', currentPedidoId);
    formData.append('mensaje', msgInput.value.trim());
    if (fileInput.files[0]) formData.append('archivo', fileInput.files[0]);

    msgInput.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/cliente/pedidos/mensajes`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (response.ok) {
            msgInput.value = "";
            cancelarSubida();
            cargarMensajes();
        } else if (response.status === 403) {
            alert("El chat se ha cerrado recientemente.");
            cargarMensajes();
        }
    } catch (e) { console.error("Error de conexión al enviar:", e); }
    finally { msgInput.disabled = false; msgInput.focus(); }
}

function previewImage(e) {
    if (!e.target.files[0]) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        document.getElementById('image-preview').src = ev.target.result;
        document.getElementById('image-preview-container').style.display = 'block';
    }
    reader.readAsDataURL(e.target.files[0]);
}

function cancelarSubida() {
    document.getElementById('input-comprobante').value = "";
    document.getElementById('image-preview-container').style.display = 'none';
}

function logout() {
    localStorage.removeItem('auth_token');
    window.location.href = 'login.html'; 
}

window.logout = logout;
window.enviarMensaje = enviarMensaje;
window.cerrarChatModal = cerrarChatModal;
window.previewImage = previewImage;
window.cancelarSubida = cancelarSubida;
window.abrirChatModal = abrirChatModal;
window.abrirModalCalificacion = abrirModalCalificacion;
window.cerrarModalCalificacion = cerrarModalCalificacion;
window.setRating = setRating;
window.enviarCalificacion = enviarCalificacion;