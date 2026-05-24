/**
 * Saborytec - Módulo de Reportes para Vendedores
 * Desarrollado por: FREDY & VICTOR
 */

(function() {
    const API_REPORTES = "reportes/vendedor";

    window.obtenerReportes = async function() {
        const contenedor = document.getElementById("contenido-dinamico");
        
        // Efecto de carga inicial con spinner de Boxicons
        contenedor.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; color: #86868b;">
                <i class='bx bx-loader-alt bx-spin' style='font-size: 3rem; margin-bottom: 10px;'></i>
                <p>Calculando estadísticas de Saborytec...</p>
            </div>`;
        
        try {
            const response = await window.fetchVendedor(API_REPORTES);
            
            if (!response || response.error) {
                console.error("Error en API:", response ? response.mensaje : "Sin respuesta");
                contenedor.innerHTML = `
                    <div class="error-container fade-in" style="text-align: center; padding: 50px;">
                        <i class='bx bx-error-circle' style='font-size: 4rem; color: #ff3b30;'></i>
                        <p style="margin-top: 15px; color: #1d1d1f; font-weight: 600;">No se pudieron cargar los datos.</p>
                        <p style="color: #86868b;">${response ? response.mensaje : 'Error de conexión'}</p>
                    </div>`;
                return;
            }

            // Guardamos la respuesta para el PDF
            window.datosReporte = response;

            renderizarInterfazReportes(contenedor, response);
            
            // Inicializar Chart.js si hay datos en la semana
            if (typeof Chart !== 'undefined' && response.grafica_semanal && response.grafica_semanal.length > 0) {
                inicializarGraficaVentas(response.grafica_semanal);
            }

        } catch (error) {
            console.error("Error crítico:", error);
            contenedor.innerHTML = `<div class="error-msg">Error crítico al conectar con el servidor.</div>`;
        }
    };

    function renderizarInterfazReportes(contenedor, data) {
        const ingresos = data.resumen && data.resumen.ingresos_hoy ? parseFloat(data.resumen.ingresos_hoy) : 0;
        const pedidos = data.resumen && data.resumen.pedidos_hoy ? parseInt(data.resumen.pedidos_hoy) : 0;
        const top_productos = data.top_productos || [];

        const formatoMoneda = new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
        });

        contenedor.innerHTML = `
            <div class="reportes-container fade-in">
                <div class="header-seccion" style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h2><i class='bx bx-bar-chart-alt-2'></i> Rendimiento de Hoy</h2>
                        <p>Visualiza el flujo de ventas y productos estrella.</p>
                    </div>
                    <button onclick="window.generarReportePDF()" style="background: #007aff; color: white; border: none; padding: 10px 15px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                        <i class='bx bxs-file-pdf'></i> Exportar PDF
                    </button>
                </div>

                <div class="stats-grid">
                    <div class="stat-card premium-shadow">
                        <div class="stat-icon" style="background: rgba(40, 167, 69, 0.1); color: #28a745;">
                            <i class='bx bx-dollar-circle'></i>
                        </div>
                        <div class="stat-info">
                            <span class="stat-label">Ventas Netas (Hoy)</span>
                            <h3 class="stat-value">${formatoMoneda.format(ingresos)}</h3>
                        </div>
                    </div>
                    <div class="stat-card premium-shadow">
                        <div class="stat-icon" style="background: rgba(0, 122, 255, 0.1); color: #007aff;">
                            <i class='bx bx-shopping-bag'></i>
                        </div>
                        <div class="stat-info">
                            <span class="stat-label">Total Pedidos (Hoy)</span>
                            <h3 class="stat-value">${pedidos} <small style="font-size: 0.9rem; font-weight: normal; color: #86868b;">órdenes</small></h3>
                        </div>
                    </div>
                </div>

                <div class="reportes-detalles">
                    <div class="reporte-box premium-shadow">
                        <div class="box-header">
                            <h3><i class='bx bx-trending-up'></i> Histórico 7 Días</h3>
                        </div>
                        <div class="canvas-container" style="position: relative; height:250px; width:100%">
                            <canvas id="graficaVentasSemanal"></canvas>
                        </div>
                    </div>
                    <div class="reporte-box premium-shadow">
                        <div class="box-header">
                            <h3><i class='bx bx-medal'></i> Más Vendidos</h3>
                        </div>
                        <div class="top-list">
                            ${top_productos.length > 0 ? top_productos.map((prod, index) => `
                                <div class="top-item">
                                    <span class="rank">#${index + 1}</span>
                                    <div class="prod-name">
                                        <strong>${prod.nombre_producto}</strong>
                                        <span>${prod.total_vendido} piezas vendidas</span>
                                    </div>
                                </div>
                            `).join('') : '<div class="empty-msg"><i class="bx bx-info-circle"></i> No hay ventas confirmadas hoy</div>'}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    window.generarReportePDF = function() {
        const data = window.datosReporte;
        
        // Validación de seguridad para evitar errores si no hay datos cargados
        if (!data) {
            alert("No hay datos disponibles para exportar. Por favor, espera a que carguen.");
            return;
        }

        // Definimos el contenido HTML
        const contenidoHTML = `
            <div style="padding: 40px; font-family: sans-serif;">
                <h1 style="color: #007aff;">Reporte Saborytec</h1>
                <p>Fecha: ${new Date().toLocaleDateString()}</p>
                <h3>Resumen de hoy</h3>
                <p>Ingresos: $${parseFloat(data.resumen.ingresos_hoy).toFixed(2)}</p>
                <p>Pedidos: ${data.resumen.pedidos_hoy}</p>
                <h3>Top Productos</h3>
                <table style="width:100%; border-collapse: collapse;">
                    <thead><tr style="background:#eee;"><th style="padding:10px; text-align:left;">Producto</th><th style="padding:10px; text-align:left;">Ventas</th></tr></thead>
                    <tbody>${data.top_productos.map(p => `<tr><td style="padding:10px; border-bottom:1px solid #ccc;">${p.nombre_producto}</td><td style="padding:10px; border-bottom:1px solid #ccc;">${p.total_vendido}</td></tr>`).join('')}</tbody>
                </table>
            </div>
        `;

        // Aplicamos el timer para asegurar la estabilidad del renderizado
        setTimeout(() => {
            html2pdf()
                .from(contenidoHTML)
                .set({
                    margin: 0.5,
                    filename: 'Reporte_Saborytec.pdf',
                    html2canvas: { scale: 2 },
                    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
                })
                .save();
        }, 500); // 500ms de espera es suficiente para que el navegador procese el bloque HTML
    };

    function inicializarGraficaVentas(datosSemana) {
        const canvas = document.getElementById('graficaVentasSemanal');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const labels = datosSemana.map(d => {
            const [anio, mes, dia] = d.fecha.split('-');
            const fechaObj = new Date(anio, mes - 1, dia); 
            return fechaObj.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' });
        });
        const valores = datosSemana.map(d => parseFloat(d.total));

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Ventas Diarias',
                    data: valores,
                    borderColor: '#007aff',
                    backgroundColor: 'rgba(0, 122, 255, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 5,
                    pointBackgroundColor: '#007aff',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#f0f0f2' }, ticks: { callback: value => '$' + value } },
                    x: { grid: { display: false } }
                }
            }
        });
    }
})();