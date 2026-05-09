/**
 * Saborytec - Gestión de Pedidos (Lado Vendedor)
 * Autores: FREDY & VICTOR
 */

const API_URL_PEDIDOS = "http://saborytecapi.test/api/vendedor/pedidos";
let todosLosPedidos = [];

/**
 * Función principal para renderizar la sección
 */
async function mostrarSeccionPedidos() {
  const contenedor = document.getElementById("contenido-dinamico");

  contenedor.innerHTML = `
        <div class="seccion-pedidos fade-in">
            <div class="header-seccion">
                <h2 class="subtitulo2">Gestión de <span>Pedidos</span></h2>
                <div class="filtros-container">
                    <button class="btn-filtro active" data-estado="todos">Todos</button>
                    <button class="btn-filtro" data-estado="validando">Por Validar</button>
                    <button class="btn-filtro" data-estado="preparacion">En Preparación / Listos</button>
                    <button class="btn-filtro" data-estado="entregado">Entregados</button>
                </div>
            </div>
            <div id="grid-pedidos" class="pedidos-grid">
                <div class="loader-p" style="text-align:center; padding:40px;">
                    <i class='bx bx-loader-alt bx-spin' style="font-size: 2rem; color: var(--primary);"></i>
                    <p>Sincronizando con Saborytec...</p>
                </div>
            </div>
        </div>

        <div id="modal-chat-vendedor" class="modal-premium" style="display:none;">
            <div class="modal-content-chat">
                <header class="modal-header-chat">
                    <div class="user-info-chat">
                        <h3 id="chat-cliente-nombre">Nombre Cliente</h3>
                        <span id="chat-orden-id">ORDEN #000</span>
                    </div>
                    <button class="btn-close-modal" onclick="cerrarModalChat()">
                        <i class='bx bx-x'></i>
                    </button>
                </header>

                <div id="chat-mensajes-container" class="chat-body"></div>

                <footer class="modal-footer-chat" id="chat-footer-vendedor">
                    <div id="contenedor-accion-pago"></div>
                    <div id="input-wrapper-vendedor" class="input-chat-wrapper">
                        <input type="text" id="input-mensaje-vendedor" placeholder="Escribe un mensaje...">
                        <button onclick="enviarMensajeVendedor()" class="btn-send-chat">
                            <i class='bx bxs-send'></i>
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    `;

  configurarFiltros();
  await fetchPedidosVendedor();
}

/**
 * Obtiene los datos de la API
 */
async function fetchPedidosVendedor() {
  const grid = document.getElementById("grid-pedidos");
  const token = localStorage.getItem("auth_token");

  try {
    const response = await fetch(API_URL_PEDIDOS, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    const data = await response.json();
    todosLosPedidos = Array.isArray(data) ? data : [];
    renderizarGrid(todosLosPedidos);
  } catch (error) {
    console.error("Error en Saborytec API:", error);
    grid.innerHTML = `<p class="error-msg">Error de conexión con el servidor.</p>`;
  }
}

/**
 * Renderiza las tarjetas
 */
function renderizarGrid(pedidos) {
  const grid = document.getElementById("grid-pedidos");
  if (pedidos.length === 0) {
    grid.innerHTML = `<div class="empty-state-pedidos" style="grid-column: 1/-1; text-align:center; padding:50px; opacity:0.5;">
            <i class='bx bx-receipt' style="font-size: 3rem;"></i>
            <p>No hay pedidos en esta categoría.</p>
        </div>`;
    return;
  }

  grid.innerHTML = "";

  pedidos.forEach((pedido) => {
    const card = document.createElement("div");
    card.className = `pedido-card ${pedido.estado}`;

    const nombreCliente = pedido.usuario
      ? pedido.usuario.name || pedido.usuario.nombre || "Estudiante"
      : "Cliente Saborytec";

    let textoEstado = "";
    let btnTexto = "ABRIR CHAT";

    if (pedido.estado === "validando") {
      textoEstado = "PAGO POR VALIDAR";
      btnTexto = "VER COMPROBANTE";
    } else if (pedido.estado === "preparacion" || pedido.estado === "listo") {
      const requiereCocina = pedido.detalles.some(
        (d) =>
          d.producto &&
          d.producto.ID_categoria !== 1 &&
          d.producto.ID_categoria !== 2,
      );
      textoEstado = requiereCocina ? "EN PREPARACIÓN" : "LISTO PARA ENTREGA";
      btnTexto = "GESTIONAR ENTREGA";
    } else {
      const labels = {
        entregado: "ENTREGADO",
        finalizado: "FINALIZADO",
        cancelado: "CANCELADO",
      };
      textoEstado = labels[pedido.estado] || pedido.estado.toUpperCase();
    }

    card.innerHTML = `
            <div class="pedido-header">
                <span class="id-orden">ORDEN #${pedido.ID_pedido}</span>
                <span class="status-badge">${textoEstado}</span>
            </div>
            <div class="pedido-body">
                <h3 class="cliente-nombre"><i class='bx bxs-user-pin'></i> ${nombreCliente}</h3>
                <div class="info-pago">
                    <p class="total">Total: <strong>$${pedido.total}</strong></p>
                    <p class="metodo"><i class='bx bx-credit-card'></i> ${pedido.metodo_pago}</p>
                </div>
            </div>
            <div class="pedido-footer">
                <button class="btn-accion-chat" onclick="abrirChatVendedor(${pedido.ID_pedido})">
                    <i class='bx bx-message-rounded-dots'></i> ${btnTexto}
                </button>
            </div>
        `;
    grid.appendChild(card);
  });
}

let intervaloChatVendedor = null;
let pedidoActualChat = null;

/**
 * MODAL: Abre y carga el detalle/comprobante
 */
async function abrirChatVendedor(idPedido) {
  const modal = document.getElementById("modal-chat-vendedor");
  const token = localStorage.getItem("auth_token");
  const chatBody = document.getElementById("chat-mensajes-container");
  const inputWrapper = document.getElementById("input-wrapper-vendedor");

  pedidoActualChat = idPedido;

  modal.style.display = "flex";
  chatBody.innerHTML = '<p class="loading-chat">Cargando conversación...</p>';

  async function cargarMensajesChat() {
    try {
      const resPedido = await fetch(`${API_URL_PEDIDOS}/${idPedido}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const pedido = await resPedido.json();

      document.getElementById("chat-cliente-nombre").innerText = pedido.usuario
        ? pedido.usuario.name || pedido.usuario.nombre
        : "Cliente";

      document.getElementById("chat-orden-id").innerText =
        `ORDEN #${pedido.ID_pedido}`;

      // --- PUNTO DE CIERRE: Bloqueo visual de input ---
      if (['entregado', 'finalizado', 'cancelado'].includes(pedido.estado)) {
        inputWrapper.style.display = "none";
      } else {
        inputWrapper.style.display = "flex";
      }

      const resChat = await fetch(
        `http://saborytecapi.test/api/chat/${idPedido}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );

      const chatData = await resChat.json();

      const actualScroll = chatBody.scrollTop + chatBody.offsetHeight;
      const isAtBottom = actualScroll >= chatBody.scrollHeight - 50;

      chatBody.innerHTML = "";

      if (chatData.mensajes && chatData.mensajes.length > 0) {
        chatData.mensajes.forEach((msj) => {
          const div = document.createElement("div");
          const esVendedor = msj.es_de_tienda == 1 || msj.es_de_tienda === true;

          div.className = esVendedor ? "mensaje-vendedor" : "mensaje-cliente";

          div.style.cssText = esVendedor
            ? "background: #deff9a; color: #000; align-self: flex-end; border-radius: 18px 18px 0 18px; margin-left: auto; padding: 12px; margin-bottom: 10px; max-width: 85%;"
            : "background: rgba(255,255,255,0.1); color: #fff; align-self: flex-start; border-radius: 18px 18px 18px 0; margin-right: auto; padding: 12px; margin-bottom: 10px; max-width: 85%;";

          if (msj.archivo_path) {
            div.innerHTML += `
                            <div class="comprobante-chat">
                                <img src="http://saborytecapi.test/storage/${msj.archivo_path}" 
                                     style="width:100%; border-radius:10px; margin-bottom:5px; cursor:pointer;" 
                                     onclick="window.open(this.src)">
                            </div>`;
          }

          if (msj.mensaje) {
            const hora = new Date(msj.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            div.innerHTML += `
                <div style="display:flex; flex-direction:column;">
                    <span>${msj.mensaje}</span>
                    <small style="margin-top:6px; font-size:0.70rem; opacity:0.7; align-self:flex-end;">
                        ${hora}
                    </small>
                </div>`;
          }

          chatBody.appendChild(div);
        });
      } else {
        chatBody.innerHTML = '<p class="no-msg">No hay mensajes aún.</p>';
      }

      if (isAtBottom) {
        chatBody.scrollTop = chatBody.scrollHeight;
      }

      // --- LÓGICA DINÁMICA DE BOTONES ---
      const contenedorAccion = document.getElementById("contenedor-accion-pago");

      if (pedido.estado === "validando") {
        contenedorAccion.innerHTML = `
                    <button class="btn-validar-pago-full" onclick="validarPedidoVendedor(${pedido.ID_pedido})">
                        <i class='bx bx-check-shield'></i> CONFIRMAR PAGO Y EMPEZAR
                    </button>`;
      } else if (pedido.estado === "preparacion" || pedido.estado === "listo") {
        contenedorAccion.innerHTML = `
                    <button class="btn-entregar-pedido-full" onclick="entregarPedidoVendedor(${pedido.ID_pedido})" style="background: #007aff; color: white; width: 100%; padding: 12px; border: none; border-radius: 12px; font-weight: bold; cursor: pointer; margin-bottom: 10px;">
                        <i class='bx bx-package'></i> MARCAR COMO ENTREGADO
                    </button>`;
      } else if (pedido.estado === "entregado") {
        contenedorAccion.innerHTML = `
                    <div style="text-align:center; padding:10px; background: rgba(52, 199, 89, 0.1); border-radius: 10px; color: #34c759; font-weight: bold; margin-bottom:10px;">
                        <i class='bx bx-check-circle'></i> PEDIDO ENTREGADO - CHAT CERRADO
                    </div>`;
      } else {
        contenedorAccion.innerHTML = "";
      }

    } catch (error) {
      console.error("Error al cargar detalle del chat:", error);
      chatBody.innerHTML = '<p class="error-msg">Error al cargar la conversación.</p>';
    }
  }

  await cargarMensajesChat();

  if (intervaloChatVendedor) clearInterval(intervaloChatVendedor);
  intervaloChatVendedor = setInterval(() => {
    if (pedidoActualChat === idPedido) cargarMensajesChat();
  }, 5000);
}

function cerrarModalChat() {
  document.getElementById("modal-chat-vendedor").style.display = "none";
  if (intervaloChatVendedor) {
    clearInterval(intervaloChatVendedor);
    intervaloChatVendedor = null;
  }
  pedidoActualChat = null;
}

/**
 * Lógica para validar el pago
 */
async function validarPedidoVendedor(id) {
  if (!confirm("¿Confirmas que el comprobante es válido?")) return;
  const token = localStorage.getItem("auth_token");
  try {
    const response = await fetch(`${API_URL_PEDIDOS}/${id}/estado`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ estado: "preparacion" }),
    });

    if (response.ok) {
        fetchPedidosVendedor();
    }
  } catch (e) {
    alert("Error al validar");
  }
}

/**
 * Lógica para entregar pedido (Punto de Cierre Seguro)
 */
async function entregarPedidoVendedor(id) {
    if (!confirm("¿Confirmas que el pedido ya fue entregado? Se cerrará el chat.")) return;
    const token = localStorage.getItem("auth_token");
    try {
        const response = await fetch(`${API_URL_PEDIDOS}/${id}/estado`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ estado: "entregado" }),
        });

        if (response.ok) {
            // Actualización inmediata del UI
            fetchPedidosVendedor();
            // El intervalo del chat se encargará de ocultar el input en el siguiente ciclo
        }
    } catch (e) {
        alert("Error al procesar la entrega");
    }
}

function configurarFiltros() {
  const botones = document.querySelectorAll(".btn-filtro");
  botones.forEach((btn) => {
    btn.onclick = () => {
      botones.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const estado = btn.getAttribute("data-estado");
      const filtrados =
        estado === "todos"
          ? todosLosPedidos
          : todosLosPedidos.filter((p) => p.estado === estado);
      renderizarGrid(filtrados);
    };
  });
}

/**
 * Envía un mensaje (con validación de input)
 */
async function enviarMensajeVendedor() {
  const input = document.getElementById("input-mensaje-vendedor");
  if (input.disabled) return; // Evitar envíos si el chat ya está bloqueado

  const mensaje = input.value.trim();
  const idPedido = document.getElementById("chat-orden-id").innerText.replace("ORDEN #", "");
  const token = localStorage.getItem("auth_token");

  if (!mensaje) return;
  input.disabled = true;

  try {
    const response = await fetch(`http://saborytecapi.test/api/vendedor/pedidos/${idPedido}/mensajes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ mensaje: mensaje }),
      },
    );

    const res = await response.json();

    if (response.status === 201) {
      const container = document.getElementById("chat-mensajes-container");
      const div = document.createElement("div");
      div.className = "mensaje-vendedor";
      div.style.cssText = "background: #deff9a; color: #000; align-self: flex-end; border-radius: 18px 18px 0 18px; margin-left: auto; padding: 12px; margin-bottom: 10px; max-width: 85%; font-size: 0.9rem;";
      div.innerHTML = `<span>${mensaje}</span>`;
      container.appendChild(div);
      container.scrollTop = container.scrollHeight;
      input.value = "";
    } else if (response.status === 403) {
        alert("El chat ya está cerrado para este pedido.");
        input.parentElement.style.display = "none";
    }
  } catch (error) {
    console.error("Error de conexión:", error);
  } finally {
    input.disabled = false;
    input.focus();
  }
}

// Globalización
window.enviarMensajeVendedor = enviarMensajeVendedor;
window.mostrarSeccionPedidos = mostrarSeccionPedidos;
window.cerrarModalChat = cerrarModalChat;
window.validarPedidoVendedor = validarPedidoVendedor;
window.entregarPedidoVendedor = entregarPedidoVendedor;