/**
 * Saborytec - Módulo de Reportes Globales (Administrador)
 * Desarrollado por: FREDY & VICTOR
 */

(function() {
    const API_ADMIN_REPORTES = "reportes/admin/general";
    let datosAdminGlobal = null;

    window.obtenerReportesAdmin = async function() {
        const contenedor = document.getElementById("contenido-dinamico");
        
        contenedor.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 400px; color: #86868b;">
                <i class='bx bx-analyse bx-spin' style='font-size: 3.5rem; margin-bottom: 15px; color: #007aff;'></i>
                <p style="font-weight: 500; letter-spacing: 0.5px;">Consolidando métricas globales de Saborytec...</p>
            </div>`;
        
        try {
            const response = await window.fetchAdmin(API_ADMIN_REPORTES);
            
            if (!response || response.error) {
                contenedor.innerHTML = `
                    <div class="error-container fade-in" style="text-align: center; padding: 60px; background: white; border-radius: 20px; margin: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
                        <i class='bx bx-shield-x' style='font-size: 5rem; color: #ff3b30;'></i>
                        <h3 style="margin-top: 20px; color: #1d1d1f;">Acceso Restringido</h3>
                        <p style="color: #86868b; max-width: 300px; margin: 10px auto;">${response ? response.mensaje : 'Error de comunicación con el servidor de Saborytec.'}</p>
                    </div>`;
                return;
            }

            datosAdminGlobal = response;
            renderizarInterfazAdmin(contenedor, response);
            
            if (typeof Chart !== 'undefined' && response.comparativa_vendedores) {
                setTimeout(() => inicializarGraficaAdmin(response.comparativa_vendedores), 150);
            }

        } catch (error) {
            console.error("Error crítico en Panel Admin:", error);
            contenedor.innerHTML = `
                <div style="text-align:center; padding:50px; color: #86868b;">
                    <i class='bx bx-error-circle' style="font-size: 3rem; color: #ff9500;"></i>
                    <p>Error en la conexión institucional ITSSMT.</p>
                </div>`;
        }
    };

    function renderizarInterfazAdmin(contenedor, data) {
        const ingresos = parseFloat(data.ingresos_totales) || 0;
        const formatoMoneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

        contenedor.innerHTML = `
            <div class="reportes-container fade-in" id="admin-reporte-root" style="padding: 10px;">
                <div class="header-seccion" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                    <div>
                        <h2 style="font-weight: 700; color: #ffffff; font-size: 1.8rem;"><i class='bx bx-stats' style="color: #007aff;"></i> Panel Institucional</h2>
                        <p style="color: #ffffff; font-size: 0.95rem;">Resumen maestro de operaciones Saborytec.</p>
                    </div>
                    <button onclick="exportarPDFAdmin()" class="btn-pdf-download" style="background: #1d1d1f; color: white; border: none; padding: 12px 24px; border-radius: 12px; cursor: pointer; display: flex; align-items: center; gap: 10px; font-weight: 600;">
                        <i class='bx bxs-file-pdf'></i> Generar Reporte PDF
                    </button>
                </div>

                <div class="stats-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px;">
                    <div class="stat-card" style="background: white; padding: 25px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.03); border: 1px solid #f2f2f7;">
                        <span style="color: #86868b; font-size: 0.8rem; font-weight: 700; text-transform: uppercase;">Ingresos Totales</span>
                        <h3 style="font-size: 2rem; color: #1d1d1f; margin: 10px 0;">${formatoMoneda.format(ingresos)}</h3>
                        <div style="color: #28a745; font-size: 0.85rem; font-weight: 600;"><i class='bx bx-trending-up'></i> Ventas Confirmadas</div>
                    </div>
                    <div class="stat-card" style="background: white; padding: 25px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.03); border: 1px solid #f2f2f7;">
                        <span style="color: #86868b; font-size: 0.8rem; font-weight: 700; text-transform: uppercase;">Puntos de Venta</span>
                        <h3 style="font-size: 2rem; color: #007aff; margin: 10px 0;">${data.total_vendedores || 0}</h3>
                        <p style="color: #86868b; font-size: 0.85rem;">Vendedores ITSSMT</p>
                    </div>
                    <div class="stat-card" style="background: white; padding: 25px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.03); border: 1px solid #f2f2f7;">
                        <span style="color: #86868b; font-size: 0.8rem; font-weight: 700; text-transform: uppercase;">Catálogo General</span>
                        <h3 style="font-size: 2rem; color: #ff9500; margin: 10px 0;">${data.total_productos || 0}</h3>
                        <p style="color: #86868b; font-size: 0.85rem;">Productos registrados</p>
                    </div>
                </div>

                <div class="reportes-detalles" style="display: grid; grid-template-columns: 1.8fr 1.2fr; gap: 25px;">
                    <div class="reporte-box" style="background: white; padding: 30px; border-radius: 22px; box-shadow: 0 10px 30px rgba(0,0,0,0.04);">
                        <h3 style="margin-bottom: 25px; font-size: 1.15rem; color: #1d1d1f; font-weight: 600;"><i class='bx bx-chart' style="color: #007aff;"></i> Ventas por Establecimiento</h3>
                        <div style="height: 320px;"><canvas id="graficaComparativaAdmin"></canvas></div>
                    </div>

                    <div class="reporte-box" style="background: white; padding: 30px; border-radius: 22px; box-shadow: 0 10px 30px rgba(0,0,0,0.04);">
                        <h3 style="margin-bottom: 25px; font-size: 1.15rem; color: #1d1d1f; font-weight: 600;"><i class='bx bx-medal' style="color: #ff9500;"></i> Top Vendedores</h3>
                        <div class="admin-ranking-list">
                            ${data.comparativa_vendedores && data.comparativa_vendedores.length > 0 ? 
                                data.comparativa_vendedores.slice(0, 6).map((v, i) => `
                                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid #f2f2f7;">
                                        <div style="display: flex; align-items: center; gap: 12px;">
                                            <span style="width: 28px; height: 28px; background: ${i === 0 ? '#ff950020' : '#f2f2f7'}; color: ${i === 0 ? '#ff9500' : '#86868b'}; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 800;">${i+1}</span>
                                            <span style="font-size: 0.95rem; color: #1d1d1f; font-weight: 500;">${v.nombre_vendedor}</span>
                                        </div>
                                        <span style="font-weight: 700; color: #1d1d1f;">${formatoMoneda.format(v.total_ventas)}</span>
                                    </div>
                                `).join('') : '<p style="color:#86868b; text-align:center;">Sin datos disponibles.</p>'
                            }
                        </div>
                    </div>
                </div>
            </div>`;
    }

    function inicializarGraficaAdmin(datos) {
        const ctx = document.getElementById('graficaComparativaAdmin').getContext('2d');
        if (window.chartAdminInstance) window.chartAdminInstance.destroy();

        window.chartAdminInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: datos.map(v => v.nombre_vendedor),
                datasets: [{
                    label: 'Ventas ($)',
                    data: datos.map(v => parseFloat(v.total_ventas)),
                    backgroundColor: 'rgba(0, 122, 255, 0.8)',
                    borderRadius: 8,
                    barThickness: 30
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }
        });
    }

    window.exportarPDFAdmin = function() {
        if (!datosAdminGlobal) return;
        const data = datosAdminGlobal;
        const tempDiv = document.createElement('div');
        tempDiv.style.padding = "40px";
        
        // Estilo del reporte para el PDF
        tempDiv.innerHTML = `
            <div style="border-bottom: 3px solid #007aff; padding-bottom: 20px; margin-bottom: 30px;">
                <h1 style="margin: 0; color: #1d1d1f;">SABORYTEC <span style="font-weight: 300;">ITSSMT</span></h1>
                <p style="color: #86868b;">Reporte Administrativo - ${new Date().toLocaleDateString()}</p>
            </div>
            <div style="margin-bottom: 30px;">
                <h3>Resumen General</h3>
                <p><strong>Ingresos Consolidados:</strong> $${parseFloat(data.ingresos_totales).toLocaleString()} MXN</p>
                <p><strong>Total de Vendedores:</strong> ${data.total_vendedores}</p>
                <p><strong>Productos en Sistema:</strong> ${data.total_productos}</p>
            </div>
            <table style="width: 100%; border-collapse: collapse;">
                <tr style="background: #1d1d1f; color: white;">
                    <th style="padding: 10px; text-align: left;">Vendedor</th>
                    <th style="padding: 10px; text-align: right;">Total Ventas</th>
                </tr>
                ${data.comparativa_vendedores.map(v => `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px;">${v.nombre_vendedor}</td>
                        <td style="padding: 10px; text-align: right;">$${parseFloat(v.total_ventas).toLocaleString()}</td>
                    </tr>
                `).join('')}
            </table>
            <div style="margin-top: 50px; text-align: center; color: #86868b; font-size: 12px;">
                Desarrollado por: FREDY & VICTOR - Saborytec 2026
            </div>
        `;

        const opt = {
            margin: 10,
            filename: `Saborytec_Reporte_Admin.pdf`,
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(tempDiv).save();
    };
})();