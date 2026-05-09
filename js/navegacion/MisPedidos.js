/**
 * Saborytec - Gestión de Pedidos (Lado Cliente)
 * Autores: FREDY & VICTOR
 */

const API_BASE = "http://saborytecapi.test/api";
const STORAGE_BASE = "http://saborytecapi.test/storage/";
const token = localStorage.getItem('auth_token');

let currentPedidoId = null;
let chatInterval = null;
let ultimoChatRenderizado = "";

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
            
            const esCerrado = ['entregado', 'finalizado', 'cancelado'].includes(pedido.estado);
            const btnLabel = pedido.estado === 'entregado' ? 'CALIFICAR SERVICIO' : 'CHAT Y COMPROBANTE';
            const btnClass = pedido.estado === 'entregado' ? 'btn-chat entregado' : 'btn-chat';

            card.innerHTML = `
                <div class="card-header">
                    <span class="order-id">#${pedido.ID_pedido}</span>
                    <span class="status-pill ${pedido.estado}">${pedido.estado.toUpperCase()}</span>
                </div>
                <h2 class="tienda-name">${nombreTienda}</h2>
                <div class="order-details">Monto: <b>$${pedido.total}</b> • ${pedido.metodo_pago}</div>
                <button class="${btnClass}" onclick="abrirChatModal(${pedido.ID_pedido}, '${nombreTienda}')">
                    <i class="fas ${pedido.estado === 'entregado' ? 'fa-star' : 'fa-comment-dots'}"></i> ${btnLabel}
                </button>
            `;
            contenedor.appendChild(card);
        });
    } catch (e) { contenedor.innerHTML = "<p>Error al cargar pedidos.</p>"; }
}

// --- LÓGICA DEL CHAT MODAL ---
async function abrirChatModal(idPedido, nombreTienda) {
    currentPedidoId = idPedido;
    
    document.getElementById('chat-tienda-nombre').innerText = nombreTienda;
    document.getElementById('chat-orden-id').innerText = `Orden #${idPedido}`;
    document.getElementById('modal-chat').style.display = 'flex';
    ultimoChatRenderizado = "";
    
    // Reset visual del input
    document.getElementById('input-wrapper-cliente').style.display = 'flex';
    const avisoPrevio = document.getElementById('aviso-bloqueo-cliente');
    if (avisoPrevio) avisoPrevio.remove();

    await cargarMensajes();
    
    if (chatInterval) clearInterval(chatInterval);
    chatInterval = setInterval(cargarMensajes, 5000);
}

function cerrarChatModal() {
    document.getElementById('modal-chat').style.display = 'none';
    if (chatInterval) clearInterval(chatInterval);
}

/**
 * CARGAR MENSAJES Y VERIFICAR ESTADO
 * Usa la ruta index de ChatController que Fredy actualizó con 'estado_pedido'
 */
async function cargarMensajes() {
    if (!currentPedidoId) return;
    try {
        const response = await fetch(`${API_BASE}/cliente/pedidos/${currentPedidoId}/mensajes`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            // 1. Bloqueo de UI si el pedido ya fue cerrado/entregado
            gestionarInterfazBloqueo(data.estado_pedido);

            // 2. Renderizar mensajes solo si hay algo nuevo
            const hashMensajes = JSON.stringify(data.mensajes);
            if (hashMensajes !== ultimoChatRenderizado) {
                ultimoChatRenderizado = hashMensajes;
                renderizarMensajes(data.mensajes);
            }
        }
    } catch (e) { console.error("Error al sincronizar chat:", e); }
}

/**
 * Gestiona si el input debe estar visible o si se muestra el aviso de bloqueo
 */
function gestionarInterfazBloqueo(estado) {
    const inputWrapper = document.getElementById('input-wrapper-cliente'); 
    // Si no tienes modal-footer-chat, usamos el contenedor del modal
    const footer = document.querySelector('.modal-chat-content'); 
    const estadosCierre = ['entregado', 'finalizado', 'cancelado'];

    if (estadosCierre.includes(estado)) {
        if (inputWrapper) inputWrapper.style.display = 'none';
        
        if (!document.getElementById('aviso-bloqueo-cliente')) {
            const aviso = document.createElement('div');
            aviso.id = 'aviso-bloqueo-cliente';
            aviso.className = 'aviso-bloqueo'; // Puedes darle estilos en CSS
            aviso.style.cssText = "width:100%; text-align:center; padding:20px; background:rgba(0,0,0,0.2); border-radius:15px; margin-top:10px;";
            
            if (estado === 'entregado') {
                aviso.innerHTML = `
                    <div style="color: #34c759; font-weight: bold; margin-bottom: 10px;">
                        <i class='fas fa-check-circle'></i> ¡DISFRUTA TU COMIDA!
                    </div>
                    <button class="btn-chat entregado" style="width:100%" onclick="alert('Próximamente calificar')">
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

// --- FUNCIONES DE ENVÍO ---
async function enviarMensaje() {
    const msgInput = document.getElementById('mensaje-texto');
    const fileInput = document.getElementById('input-comprobante');
    
    if (msgInput.disabled || (!msgInput.value.trim() && fileInput.files.length === 0)) return;

    const formData = new FormData();
    formData.append('ID_pedido', currentPedidoId);
    formData.append('mensaje', msgInput.value.trim());
    if (fileInput.files[0]) formData.append('archivo', fileInput.files[0]);

    msgInput.disabled = true; // Bloqueo temporal mientras envía

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

// Exportación global
window.logout = logout;
window.enviarMensaje = enviarMensaje;
window.cerrarChatModal = cerrarChatModal;
window.previewImage = previewImage;
window.cancelarSubida = cancelarSubida;
window.abrirChatModal = abrirChatModal;