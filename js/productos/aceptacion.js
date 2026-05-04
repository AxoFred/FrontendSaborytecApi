/**
 * Saborytec - Gestión de Productos Pendientes (Admin)
 * Desarrollado por: FREDY & VICTOR
 */

{
    let productosGlobal = [];

    window.mostrarSeccionPendientes = function() {
        const cont = document.getElementById("contenido-dinamico");
        if (!cont) return;

        cont.innerHTML = `
            <div class="modulo-header fade-in-row">
                <div class="text-left">
                    <h3 class='modulo-titulo'>Gestión de Productos Pendientes</h3>
                    <p class="modulo-desc">Filtra por nombre, categoría o tienda para gestionar las solicitudes.</p>
                </div>
            </div>

            <!-- BARRA DE FILTROS -->
            <div class="filtros-container fade-in-row">
                <div class="filter-group">
                    <label class="filter-label">Buscar Producto</label>
                    <input type="text" id="filter-nombre" class="filter-input" placeholder="Nombre o marca..." oninput="filtrarProductos()">
                </div>
                
                <div class="filter-group">
                    <label class="filter-label">Estado</label>
                    <select id="filter-estado" class="filter-input" onchange="filtrarProductos()">
                        <option value="">Todos</option>
                        <option value="pendiente" selected>Pendiente</option>
                        <option value="aprobado">Aprobado</option>
                        <option value="rechazado">Rechazado</option>
                    </select>
                </div>

                <div class="filter-group">
                    <label class="filter-label">Categoría</label>
                    <select id="filter-categoria" class="filter-input" onchange="filtrarProductos()">
                        <option value="">Todas las categorías</option>
                    </select>
                </div>

                <div class="filter-group">
                    <label class="filter-label">Tienda</label>
                    <select id="filter-tienda" class="filter-input" onchange="filtrarProductos()">
                        <option value="">Todas las tiendas</option>
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
                            <th>Estado</th>
                            <th>Categoría</th>
                            <th>Tienda</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="productos-tbody">
                        <tr><td colspan="9" style="text-align:center; padding:40px;">Cargando productos...</td></tr>
                    </tbody>
                </table>
            </div>
        `;

        cargarProductosPendientes();
    };

    async function cargarProductosPendientes() {
        try {
            const respuesta = await fetchAdmin("admin/productos/pendientes");
            if (!respuesta) return; 

            productosGlobal = Array.isArray(respuesta) ? respuesta : (respuesta.data || []);
            
            poblarSelectoresDinamicos();
            window.filtrarProductos(); 
        } catch (error) {
            console.error("Error:", error);
            const tbody = document.getElementById("productos-tbody");
            if(tbody) tbody.innerHTML = `<tr><td colspan="9">Error al conectar con la API</td></tr>`;
        }
    }

    function poblarSelectoresDinamicos() {
        const selectCat = document.getElementById("filter-categoria");
        const selectTienda = document.getElementById("filter-tienda");
        if(!selectCat || !selectTienda) return;

        const categorias = [...new Set(productosGlobal.map(p => p.nombre_categoria).filter(Boolean))];
        const tiendas = [...new Set(productosGlobal.map(p => p.nombre_tienda).filter(Boolean))];

        selectCat.innerHTML = '<option value="">Todas las categorías</option>';
        selectTienda.innerHTML = '<option value="">Todas las tiendas</option>';

        categorias.sort().forEach(cat => {
            selectCat.innerHTML += `<option value="${cat.toLowerCase()}">${cat}</option>`;
        });

        tiendas.sort().forEach(t => {
            selectTienda.innerHTML += `<option value="${t.toLowerCase()}">${t}</option>`;
        });
    }

    window.filtrarProductos = function() {
        const nombreVal = document.getElementById("filter-nombre").value.toLowerCase();
        const estadoVal = document.getElementById("filter-estado").value.toLowerCase();
        const catVal = document.getElementById("filter-categoria").value.toLowerCase();
        const tiendaVal = document.getElementById("filter-tienda").value.toLowerCase();

        const filtrados = productosGlobal.filter(p => {
            const matchNombre = (p.nombre || "").toLowerCase().includes(nombreVal) || 
                                (p.marca || "").toLowerCase().includes(nombreVal);
            const matchEstado = estadoVal === "" || (p.estado || "").toLowerCase() === estadoVal;
            const matchCat    = catVal === "" || (p.nombre_categoria || '').toLowerCase() === catVal;
            const matchTienda = tiendaVal === "" || (p.nombre_tienda || '').toLowerCase() === tiendaVal;
            
            return matchNombre && matchEstado && matchCat && matchTienda;
        });

        renderProductosPendientes(filtrados);
    };

    function renderProductosPendientes(data) {
        const tbody = document.getElementById("productos-tbody");
        if (!tbody) return;

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:40px; opacity:0.5;">No se encontraron resultados</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(p => {
            const estado = (p.estado || "pendiente").toLowerCase();
            return `
                <tr id="producto-${p.ID_producto}" class="fade-in-row">
                    <td>
                        ${p.imagen 
                            ? `<img src="http://saborytecapi.test/storage/productos/${p.imagen}" width="45" height="45" style="border-radius:8px; object-fit: cover;" alt="P">`
                            : '<span class="tag-vacio">N/A</span>'}
                    </td>
                    <td><strong>${p.nombre}</strong></td>
                    <td>${p.marca || '-'}</td>
                    <td class="text-ellipsis"><small title="${p.descripcion || ''}">${p.descripcion || '-'}</small></td>
                    <td><span style="color: var(--primary); font-weight: 800;">$${parseFloat(p.precio).toFixed(2)}</span></td>
                    <td><span class="rol-badge status-${estado}">${p.estado}</span></td>
                    <td>${p.nombre_categoria ?? 'N/A'}</td>
                    <td>${p.nombre_tienda ?? 'N/A'}</td>
                    <td>
                        <div class="acciones-flex">
                            <button class="btn-tabla aceptar" onclick="procesarAccionProducto('aprobar', ${p.ID_producto})" title="Aprobar">✔</button>
                            <button class="btn-tabla rechazar" onclick="procesarAccionProducto('rechazar', ${p.ID_producto})" title="Rechazar">✖</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    window.procesarAccionProducto = async function(tipo, id) {
        const nuevoEstado = tipo === 'aprobar' ? 'aprobado' : 'rechazado';
        const mensaje = tipo === 'aprobar' ? '¿Aprobar este producto?' : '¿Rechazar este producto?';
        
        if (!confirm(mensaje)) return;

        try {
            const result = await fetchAdmin(`admin/productos/${id}/${tipo}`, "POST");
            
            if (result && (result.success || result.ID_producto)) {
                const index = productosGlobal.findIndex(p => p.ID_producto == id);
                if (index !== -1) {
                    productosGlobal[index].estado = nuevoEstado;
                }

                window.filtrarProductos(); 
                alert(`Producto ${nuevoEstado} correctamente.`);
            }
        } catch (e) { 
            console.error("Error:", e);
            alert("No se pudo actualizar el estado.");
        }
    };
}