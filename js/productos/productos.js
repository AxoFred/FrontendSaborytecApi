/**
 * Saborytec - Gestión de Productos (Vendedor)
 * Desarrollado por: FREDY 
 */

{
    const API_BASE_PROD = "https://saborytecapi-production.up.railway.app/api";
    const STORAGE_URL = "https://saborytecapi-production.up.railway.app/storage/productos/"; 
    //const API_BASE_PROD = "http://saborytecapi.test/api";
    //const STORAGE_URL = "http://saborytecapi.test/storage/productos/"; 

    let productosGlobal = [];

    // --- Configuración de Peticiones ---
    const getHeaders = (json = false) => {
        const headers = {
            'Authorization': `Bearer ${localStorage.getItem("auth_token")}`,
            'Accept': 'application/json'
        };
        if (json) headers['Content-Type'] = 'application/json';
        return headers;
    };

    // --- Utilidades de Interfaz ---
    window.openModal = (id) => document.getElementById(id)?.classList.add("show");
    window.closeModal = (id) => document.getElementById(id)?.classList.remove("show");

    // ==========================================
    // 1. RENDERIZADO DE LA INTERFAZ
    // ==========================================
    window.mostrarSeccionProductos = async function() {
        const cont = document.getElementById("contenido-dinamico");
        if (!cont) return;

        cont.innerHTML = `
            <div class="modulo-header fade-in-row">
                <div class="text-left">
                    <h3 class='modulo-titulo'>Mis Productos</h3>
                    <p class="modulo-desc">Gestiona tu catálogo y consulta el estado de aprobación.</p>
                </div>
                <button class="btn-azul" onclick="prepararModal()">➕ Agregar Producto</button>
            </div>

            <div class="filtros-container fade-in-row">
                <div class="filter-group">
                    <label class="filter-label">Nombre / Marca</label>
                    <input type="text" id="filter-nombre" class="filter-input" placeholder="Buscar..." oninput="filtrarMisProductos()">
                </div>
                <div class="filter-group">
                    <label class="filter-label">Estado</label>
                    <select id="filter-estado" class="filter-input" onchange="filtrarMisProductos()">
                        <option value="">Todos los estados</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="aprobado">Aprobado</option>
                        <option value="rechazado">Rechazado</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label class="filter-label">Categoría</label>
                    <select id="filter-categoria" class="filter-input" onchange="filtrarMisProductos()">
                        <option value="">Todas las categorías</option>
                    </select>
                </div>
            </div>

            <div class="tabla-contenedor fade-in-row">
                <table class="tabla-admin">
                    <thead>
                        <tr>
                            <th>Imagen</th>
                            <th>Nombre</th>
                            <th>Marca</th>
                            <th>Descripción</th>
                            <th>Precio</th>
                            <th>Categoría</th>
                            <th>Estado</th>
                            <th>Disponibilidad</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="productos-tbody">
                        <tr><td colspan="9" style="text-align:center; padding:40px;">Cargando inventario...</td></tr>
                    </tbody>
                </table>
            </div>

            <div class="modal" id="modalProduct">${renderFormHTML()}</div>
        `;

        // Carga inicial de datos
        await Promise.all([window.cargarProductos(), cargarSelectsData()]);
    };

    // ==========================================
    // 2. LÓGICA DE DATOS Y FILTRADO
    // ==========================================
    window.cargarProductos = async function() {
        try {
            const res = await fetch(`${API_BASE_PROD}/productos`, { headers: getHeaders() });
            const data = await res.json();
            productosGlobal = Array.isArray(data) ? data : (data.data || []);
            
            // Poblar filtro de categorías dinámicamente
            const cats = [...new Set(productosGlobal.map(p => p.nombre_categoria).filter(Boolean))];
            const selectCat = document.getElementById("filter-categoria");
            if(selectCat) {
                selectCat.innerHTML = '<option value="">Todas las categorías</option>' + 
                    cats.sort().map(c => `<option value="${c.toLowerCase()}">${c}</option>`).join('');
            }

            renderProductos(productosGlobal);
        } catch (error) {
            console.error("Error al cargar productos:", error);
        }
    };

    window.filtrarMisProductos = function() {
        const v = (id) => document.getElementById(id).value.toLowerCase().trim();
        const [nombreVal, estadoVal, catVal] = [v("filter-nombre"), v("filter-estado"), v("filter-categoria")];

        const filtrados = productosGlobal.filter(p => {
            const pNombre = (p.nombre || "").toLowerCase();
            const pMarca  = (p.marca || "").toLowerCase();
            const pEstado = (p.estado || "pendiente").toLowerCase().trim();
            const pCat    = (p.nombre_categoria || "").toLowerCase();

            const matchNombre = !nombreVal || (pNombre.includes(nombreVal) || pMarca.includes(nombreVal));
            const matchEstado = !estadoVal || pEstado === estadoVal;
            const matchCat    = !catVal    || pCat === catVal;

            return matchNombre && matchEstado && matchCat;
        });

        renderProductos(filtrados);
    };

    function renderProductos(data) {
        const tbody = document.getElementById("productos-tbody");
        if (!tbody) return;

        tbody.innerHTML = data.length ? data.map(p => {
            const estadoReal = (p.estado || 'Pendiente');
            const esAprobado = estadoReal.toLowerCase() === 'aprobado';
            const urlImg = (() => {
                if (!p.imagen) return 'https://placehold.co/45x45?text=Sin+Foto';

                if (p.imagen.startsWith('http')) return p.imagen;

                return `${STORAGE_URL}${p.imagen.replace(/^\/+/, '')}`;
            })();
            
            return `
                <tr>
                    <td><img src="${urlImg}" width="45" height="45" style="border-radius:8px; object-fit:cover;"></td>
                    <td><strong>${p.nombre}</strong></td>
                    <td>${p.marca || '-'}</td>
                    <td class="text-ellipsis">${p.descripcion || '-'}</td>
                    <td style="color:var(--primary); font-weight:800;">$${parseFloat(p.precio).toFixed(2)}</td>
                    <td>${p.nombre_categoria || 'General'}</td>
                    <td><span class="rol-badge status-${estadoReal.toLowerCase().trim()}">${estadoReal}</span></td>
                    <td>
                        <label class="switch">
                            <input type="checkbox" ${parseInt(p.disponible) === 1 ? 'checked' : ''} ${!esAprobado ? 'disabled' : ''} 
                                onchange="apiAction('toggle', ${p.ID_producto}, this.checked)">
                            <span class="slider"></span>
                        </label>
                    </td>
                    <td>
                        <div class="acciones-flex">
                            <button onclick="prepararModal(${p.ID_producto})" class="btn-tabla" title="Editar">✏️</button>
                            <button onclick="apiAction('delete', ${p.ID_producto})" class="btn-tabla rechazar" title="Eliminar">🗑️</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('') : '<tr><td colspan="9" style="text-align:center; padding:20px;">No se encontraron productos.</td></tr>';
    }

    // ==========================================
    // 3. MODALES Y FORMULARIOS
    // ==========================================
    function renderFormHTML() {
        return `
        <div class="modal-content">
            <h2 id="modalTitle" style="color:white; margin-bottom:15px;"></h2>
            <form id="formProduct">
                <input type="hidden" name="ID_producto">
                
                <label>Imagen del Producto:</label>
                <input type="file" name="imagen" accept="image/*" class="filter-input" style="padding:10px;">
                
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                    <div><label>Nombre*:</label><input type="text" name="nombre" class="filter-input" required></div>
                    <div><label>Marca:</label><input type="text" name="marca" class="filter-input"></div>
                </div>

                <label>Descripción:</label>
                <textarea name="descripcion" rows="2" class="filter-input"></textarea>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                    <div><label>Precio*:</label><input type="number" name="precio" step="0.01" class="filter-input" required></div>
                    <div><label>Categoría*:</label><select name="ID_categoria" id="select-cat-form" class="filter-input" required></select></div>
                </div>

                <label>Tienda:</label>
                <select name="ID_tienda" id="select-tienda-form" class="filter-input" required readonly></select>

                <div style="margin-top:20px; display:flex; gap:10px;">
                    <button type="submit" class="btn-azul" style="flex:1;">Guardar Cambios</button>
                    <button type="button" class="btn-gris" onclick="closeModal('modalProduct')" style="flex:1;">Cancelar</button>
                </div>
            </form>
        </div>`;
    }

    window.prepararModal = function(id = null) {
        const form = document.getElementById("formProduct");
        form.reset();
        
        const titleEl = document.getElementById("modalTitle");
        const idInput = form.querySelector('[name="ID_producto"]');
        
        if (id) {
            titleEl.innerText = "Editar Producto";
            idInput.value = id;
            const p = productosGlobal.find(prod => prod.ID_producto == id);
            if (p) {
                Object.keys(p).forEach(key => {
                    if(form[key] && key !== 'imagen') form[key].value = p[key];
                });
            }
        } else {
            titleEl.innerText = "Nuevo Producto";
            idInput.value = "";
        }

        form.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const isEdit = !!idInput.value;
            
            if (isEdit) formData.append('_method', 'PUT'); 
            
            const url = isEdit ? `${API_BASE_PROD}/productos/${idInput.value}` : `${API_BASE_PROD}/productos`;
            
            try {
                const res = await fetch(url, {
                    method: "POST", 
                    headers: getHeaders(),
                    body: formData
                });
                if (res.ok) {
                    closeModal('modalProduct');
                    window.cargarProductos();
                } else {
                    const err = await res.json();
                    alert("Error: " + (err.error || "No se pudo guardar"));
                }
            } catch (error) {
                alert("Error de conexión");
            }
        };

        window.openModal('modalProduct');
    };

    // ==========================================
    // 4. ACCIONES API
    // ==========================================
    async function cargarSelectsData() {
        try {
            const [resCat, resTienda] = await Promise.all([
                fetch(`${API_BASE_PROD}/categorias`, { headers: getHeaders() }),
                fetch(`${API_BASE_PROD}/vendedor/tienda`, { headers: getHeaders() })
            ]);
            
            const cats = await resCat.json();
            const tiendaJson = await resTienda.json();

            const catSelect = document.getElementById('select-cat-form');
            if(catSelect) {
                catSelect.innerHTML = '<option value="">Seleccionar categoría...</option>' + 
                    cats.map(c => `<option value="${c.ID_categoria}">${c.nombre}</option>`).join('');
            }

            const tiendaSelect = document.getElementById('select-tienda-form');
            if(tiendaSelect && tiendaJson.data) {
                tiendaSelect.innerHTML = `<option value="${tiendaJson.data.ID_tienda}">${tiendaJson.data.nombre}</option>`;
            }
        } catch (e) { console.error("Error cargando catálogos", e); }
    }

    window.apiAction = async (action, id, value = null) => {
        if (action === 'delete' && !confirm("¿Estás seguro de eliminar este producto?")) return;

        const config = {
            delete: { url: `${API_BASE_PROD}/productos/${id}`, method: 'DELETE', body: null },
            toggle: { url: `${API_BASE_PROD}/productos/${id}/disponibilidad`, method: 'POST', body: JSON.stringify({ disponible: value ? 1 : 0 }) }
        }[action];

        try {
            const res = await fetch(config.url, {
                method: config.method,
                headers: getHeaders(action === 'toggle'),
                body: config.body
            });

            if (res.ok && action === 'delete') window.cargarProductos();
        } catch (error) {
            console.error("Error en acción:", action, error);
            if (action === 'toggle') window.cargarProductos(); 
        }
    };
}