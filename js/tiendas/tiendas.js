/**
 * Saborytec - Gestión de Perfil de Tienda
 * Desarrollado por: FREDY 
 */

{
    const API_TIENDAS_URL = "https://saborytecapi-production.up.railway.app/api/tiendas"; 
    //const API_TIENDAS_URL = "http://saborytecapi.test/api/tiendas";
    let tiendaData = null; 

    const getAuthHeaders = (isMultipart = false) => {
        const headers = {
            "Authorization": `Bearer ${localStorage.getItem("auth_token")}`, 
            "Accept": "application/json"
        };
        if (!isMultipart) {
            headers["Content-Type"] = "application/json";
        }
        return headers;
    };

    // ============================================================
    // CARGA DE DATOS DESDE EL BACKEND
    // ============================================================

    async function obtenerMiTienda() {
        const contenedor = document.getElementById("contenido-dinamico");
        
        try {
            const response = await fetch(API_TIENDAS_URL, {
                method: "GET",
                headers: getAuthHeaders()
            });

            if (response.status === 401) {
                window.location.href = "../login.html";
                return;
            }

            const respuesta = await response.json();

            if (respuesta.success && respuesta.data) {
                tiendaData = respuesta.data;
            } else {
                tiendaData = {}; 
            }

            renderFormularioTienda();

        } catch (error) {
            console.error("Error al cargar tienda:", error);
            contenedor.innerHTML = `
                <div class="empty-state">
                    <i class='bx bx-error-circle'></i>
                    <p>Error al conectar con el servidor de Saborytec.</p>
                </div>`;
        }
    }

    // ============================================================
    // RENDERIZADO DEL FORMULARIO
    // ============================================================

    function renderFormularioTienda() {
        const t = tiendaData || {};
        
        const estaPendiente = t.aprobacion === 'pendiente';
        const btnDisabled = estaPendiente ? 'disabled' : '';

        const baseStorage = "https://saborytecapi-production.up.railway.app/storage/";
        //const baseStorage = "http://saborytecapi.test/storage/";
        
        const urlPortada = t.portada 
            ? `${baseStorage}${t.portada}` 
            : 'https://placehold.co/400x150?text=Sin+Portada';

        const urlLogo = t.logo 
            ? `${baseStorage}${t.logo}` 
            : 'https://placehold.co/80x80?text=Logo';

        let alertaEstado = '';
        if (t.aprobacion === 'pendiente') {
            alertaEstado = `<div class="alerta-warning">Tu tienda está en revisión por el administrador.</div>`;
        } else if (t.aprobacion === 'rechazada') {
            alertaEstado = `<div class="alerta-error">Tienda rechazada. Por favor, corrige los datos y reenvía.</div>`;
        } else if (t.aprobacion === 'aprobada') {
            alertaEstado = `<div class="alerta-success">Tu tienda está activa y visible.</div>`;
        }

        document.getElementById("contenido-dinamico").innerHTML = `
            ${alertaEstado}
            <form id="formTienda" class="tienda-form" enctype="multipart/form-data">
                
                <div class="tienda-header">
                    
                    <div class="tienda-portada" id="previewPortada" style="background-image:url('${urlPortada}')">
                        <input type="file" name="portada" id="inputPortada" class="tienda-file" accept="image/*">
                        <span class="edit-hint"><i class='bx bx-camera'></i> Cambiar Portada</span>
                    </div>

                    <div class="tienda-logo" id="previewLogo" style="background-image:url('${urlLogo}')">
                        <input type="file" name="logo" id="inputLogo" class="tienda-file" accept="image/*">
                        <span class="edit-hint"><i class='bx bx-image-add'></i></span>
                    </div>
                </div>

                <div class="tienda-grid-2">
                    <div class="tienda-campo">
                        <label class="tienda-label">Nombre del Negocio</label>
                        <input type="text" name="nombre" value="${t.nombre || ''}" required placeholder="Ej. Sabores de mi tierra">
                    </div>

                    <div class="tienda-campo">
                        <label class="tienda-label">Visibilidad</label>
                        <select name="estado">
                            <option value="activo" ${t.estado === 'activo' ? 'selected' : ''}>Abierto</option>
                            <option value="inactivo" ${t.estado === 'inactivo' ? 'selected' : ''}>Cerrado</option>
                        </select>
                    </div>
                </div>

                <div class="tienda-campo tienda-full">
                    <label class="tienda-label">Descripción</label>
                    <textarea class="tienda-textarea" name="descripcion" placeholder="Cuéntanos sobre tus productos...">${t.descripcion || ''}</textarea>
                </div>

                <h3 class="tienda-titulo-bloque">Redes Sociales</h3>
                <div class="tienda-grid-2">
                    <input type="text" name="facebook" placeholder="Facebook URL" value="${t.facebook || ''}">
                    <input type="text" name="instagram" placeholder="Instagram Usuario" value="${t.instagram || ''}">
                    <input type="text" name="whatsapp" placeholder="WhatsApp (10 dígitos)" value="${t.whatsapp || ''}">
                    <input type="text" name="tiktok" placeholder="TikTok Usuario" value="${t.tiktok || ''}">
                </div>

                <h3 class="tienda-titulo-bloque">Información Bancaria</h3>
                <div class="tienda-grid-3">
                    <input type="text" name="banco" placeholder="Banco" value="${t.banco || ''}">
                    <input type="text" name="clabe" placeholder="CLABE (18 dígitos)" value="${t.clabe || ''}" maxlength="18">
                    <input type="text" name="titular_cuenta" placeholder="Nombre del titular" value="${t.titular_cuenta || ''}">
                </div>
                
                <button type="submit" class="tienda-btn-guardar" id="btnGuardarTienda" ${btnDisabled}>
                    ${estaPendiente ? 'Esperando Aprobación...' : (t.ID_tienda ? 'Actualizar Información' : 'Registrar Mi Tienda')}
                </button>
                
            </form>
        `;

        inicializarEventosForm();
    }

    // ============================================================
    // EVENTOS Y ENVÍO
    // ============================================================

    function inicializarEventosForm() {
        const form = document.getElementById("formTienda");
        if (!form) return;

        const setupPreview = (inputId, previewId) => {
            const input = document.getElementById(inputId);
            const preview = document.getElementById(previewId);
            if (input && preview) {
                input.addEventListener("change", function() {
                    const file = this.files[0];
                    if (file) {
                        preview.style.backgroundImage = `url('${URL.createObjectURL(file)}')`;
                    }
                });
            }
        };

        setupPreview("inputLogo", "previewLogo");
        setupPreview("inputPortada", "previewPortada");

        form.addEventListener("submit", async function(e) {
            e.preventDefault();

            const btn = document.getElementById("btnGuardarTienda");
            btn.innerText = "Procesando...";
            btn.disabled = true;

            const formData = new FormData(form);

            try {
                const response = await fetch(API_TIENDAS_URL, {
                    method: "POST",
                    headers: getAuthHeaders(true),
                    body: formData
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Error al guardar la tienda");
                }

                alert("Información guardada. Entrará en revisión por el administrador.");
                obtenerMiTienda();

            } catch (error) {
                alert("Atención: " + error.message);
            } finally {
                btn.disabled = false;
                btn.innerText = "Actualizar Información";
            }
        });
    }

    window.obtenerMiTienda = obtenerMiTienda;
}