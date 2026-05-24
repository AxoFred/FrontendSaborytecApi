/**
 * Saborytec - Gestión de Pedidos (Lado Vendedor)
 * Autores: FREDY & VICTOR
 */

//const API_URL_PEDIDOS = "https://saborytecapi-production.up.railway.app/api/vendedor/pedidos";
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

                <div id="detalle-productos-pedido" class="detalle-productos-pedido"></div>

                <div id="chat-mensajes-container" class="chat-body"></div>

                <footer class="modal-footer-chat" id="chat-footer-vendedor">
                    <div id="contenedor-accion-pago"></div>
                    <div id="input-wrapper-vendedor" class="input-chat-wrapper">

                        <label for="input-imagen-chat" class="btn-img-chat">
                            <i class='bx bx-image-add'></i>
                        </label>

                        <input 
                            type="file" 
                            id="input-imagen-chat" 
                            accept="image/*"
                            style="display:none;"
                            onchange="enviarImagenAutomatica(event)"
                        >

                        <input 
                            type="text" 
                            id="input-mensaje-vendedor" 
                            placeholder="Escribe un mensaje..."
                        >

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

      const contenedorProductos = document.getElementById("detalle-productos-pedido");

      const productosHTML = pedido.detalles.map(det => {
      const nombre = det.producto?.nombre || "Producto";
      const cantidad = det.cantidad || 1;
      const precioUnitario = det.precio_unitario || 0;
      const subtotal = det.subtotal || (cantidad * precioUnitario);

      return `
        <div class="producto-item-pedido" draggable="false">
            <strong style="font-size:0.7rem; pointer-events:none;">${det.cantidad}x ${det.producto?.nombre}</strong>
            <small style="font-size:0.6rem; opacity:0.7; pointer-events:none;">$${det.precio_unitario} c/u</small>
            <span style="font-size:0.7rem; font-weight:bold; color:#deff9a; pointer-events:none;">$${det.subtotal}</span>
        </div>
    `;
  }).join('');
      
  const totalPedido = pedido.detalles.reduce((acc, det) => acc + (parseFloat(det.subtotal) || 0), 0);
      contenedorProductos.innerHTML = `
          <div class="productos-header">
              <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                  <span><i class='bx bx-shopping-bag'></i> Pedido</span>
                  <span class="total-badge">Total: $${totalPedido.toFixed(2)}</span>
              </div>
          </div>
          <div class="productos-lista-chips">
              ${productosHTML}
          </div>
      `;

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
        //`https://saborytecapi-production.up.railway.app/api/chat/${idPedido}`,
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

          /*if (msj.archivo_path) {
            div.innerHTML += `
                            <div class="comprobante-chat">
                                <img src="https://saborytecapi-production.up.railway.app/storage/${msj.archivo_path}"
                                
                                     style="width:100%; border-radius:10px; margin-bottom:5px; cursor:pointer;" 
                                     onclick="window.open(this.src)">
                            </div>`;
          }*/
         if (msj.archivo_path) {
              div.innerHTML += `
                  <div class="comprobante-chat">
                      <img src="http://saborytecapi.test/storage/${msj.archivo_path}" 
                          class="img-comprobante" 
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

      // 1. Identificamos los estados iniciales (Efectivo = 'pendiente', Transferencia = 'validando')
      const esEstadoInicial = ['pendiente', 'validando'].includes(pedido.estado);

      if (esEstadoInicial) {
          // Si es pendiente, el vendedor solo confirma. Si es validando, se entiende que es transferencia.
          const esEfectivo = pedido.metodo_pago === 'efectivo';
          
          contenedorAccion.innerHTML = `
              <button class="btn-validar-pago-full" onclick="validarPedidoVendedor(${pedido.ID_pedido})">
                  <i class='bx bx-check-shield'></i> ${esEfectivo ? 'CONFIRMAR PEDIDO Y EMPEZAR' : 'VALIDAR COMPROBANTE Y EMPEZAR'}
              </button>`;
      } 
      // 2. Estados donde el pedido ya está en cocina o listo
      else if (['preparacion', 'listo'].includes(pedido.estado)) {
          contenedorAccion.innerHTML = `
              <button class="btn-entregar-pedido-full" onclick="entregarPedidoVendedor(${pedido.ID_pedido})" style="background: #007aff; color: white; width: 100%; padding: 12px; border: none; border-radius: 12px; font-weight: bold; cursor: pointer; margin-bottom: 10px;">
                  <i class='bx bx-package'></i> MARCAR COMO ENTREGADO
              </button>`;
      } 
      // 3. Estados finales bloqueados
      else if (['entregado', 'finalizado', 'cancelado'].includes(pedido.estado)) {
          contenedorAccion.innerHTML = `
              <div style="text-align:center; padding:10px; background: rgba(52, 199, 89, 0.1); border-radius: 10px; color: #34c759; font-weight: bold; margin-bottom:10px;">
                  <i class='bx bx-check-circle'></i> PEDIDO ${pedido.estado.toUpperCase()}
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
      
      const filtrados = estado === "todos"
        ? todosLosPedidos
        : (estado === "validando" 
            // Si el estado es "validando", incluimos tanto "validando" como "pendiente"
            ? todosLosPedidos.filter((p) => p.estado === "validando" || p.estado === "pendiente")
            : todosLosPedidos.filter((p) => p.estado === estado));
            
      renderizarGrid(filtrados);
    };
  });
}

/**
 * Envía un mensaje (con validación de input)
 * //const response = await fetch(`https://saborytecapi-production.up.railway.app/api/vendedor/pedidos/${idPedido}/mensajes`, {
 */
async function enviarMensajeVendedor() {

    const input = document.getElementById("input-mensaje-vendedor");
    const inputImagen = document.getElementById("input-imagen-chat");

    if (input.disabled) return;

    const mensaje = input.value.trim();
    const imagen = inputImagen.files[0];

    const idPedido = document
        .getElementById("chat-orden-id")
        .innerText.replace("ORDEN #", "");

    const token = localStorage.getItem("auth_token");

    // Debe existir texto o imagen
    if (!mensaje && !imagen) return;

    input.disabled = true;

    try {

        const formData = new FormData();

        formData.append("mensaje", mensaje);

        if (imagen) {
            formData.append("archivo", imagen);
        }

        const response = await fetch(
            `http://saborytecapi.test/api/vendedor/pedidos/${idPedido}/mensajes`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
                body: formData,
            }
        );

        const res = await response.json();

        if (response.status === 201) {

            const container = document.getElementById("chat-mensajes-container");

            const div = document.createElement("div");

            div.className = "mensaje-vendedor";

            div.style.cssText = `
                background: #deff9a;
                color: #000;
                align-self: flex-end;
                border-radius: 18px 18px 0 18px;
                margin-left: auto;
                padding: 12px;
                margin-bottom: 10px;
                max-width: 85%;
                font-size: 0.9rem;
            `;

            let contenido = "";

            // Mostrar imagen instantáneamente
            if (imagen) {

                const imageURL = URL.createObjectURL(imagen);

                contenido += `
                    <div class="comprobante-chat">
                        <img 
                            src="${imageURL}" 
                            class="img-comprobante"
                            onclick="window.open(this.src)"
                        >
                    </div>
                `;
            }

            // Mostrar texto
            if (mensaje) {

                contenido += `
                    <span>${mensaje}</span>
                `;
            }

            div.innerHTML = contenido;

            container.appendChild(div);

            container.scrollTop = container.scrollHeight;

            input.value = "";
            inputImagen.value = "";

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
async function enviarImagenAutomatica(event) {

    const archivo = event.target.files[0];

    if (!archivo) return;

    const idPedido = document
        .getElementById("chat-orden-id")
        .innerText.replace("ORDEN #", "");

    const token = localStorage.getItem("auth_token");

    try {

        const formData = new FormData();

        formData.append("archivo", archivo);

        const response = await fetch(
            `http://saborytecapi.test/api/vendedor/pedidos/${idPedido}/mensajes`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
                body: formData,
            }
        );

        if (response.status === 201) {

            const container = document.getElementById("chat-mensajes-container");

            const div = document.createElement("div");

            div.className = "mensaje-vendedor";

            div.style.cssText = `
                background: #deff9a;
                color: #000;
                align-self: flex-end;
                border-radius: 18px 18px 0 18px;
                margin-left: auto;
                padding: 12px;
                margin-bottom: 10px;
                max-width: 85%;
            `;

            const imageURL = URL.createObjectURL(archivo);

            div.innerHTML = `
                <div class="comprobante-chat">
                    <img 
                        src="${imageURL}" 
                        class="img-comprobante"
                        onclick="window.open(this.src)"
                    >
                </div>
            `;

            container.appendChild(div);

            container.scrollTop = container.scrollHeight;
        }

    } catch (error) {

        console.error("Error enviando imagen:", error);

    } finally {

        event.target.value = "";
    }
}

// Globalización
window.enviarImagenAutomatica = enviarImagenAutomatica;
window.enviarMensajeVendedor = enviarMensajeVendedor;
window.mostrarSeccionPedidos = mostrarSeccionPedidos;
window.cerrarModalChat = cerrarModalChat;
window.validarPedidoVendedor = validarPedidoVendedor;
window.entregarPedidoVendedor = entregarPedidoVendedor;