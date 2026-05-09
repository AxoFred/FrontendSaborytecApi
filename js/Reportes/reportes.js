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
        // Validación y conversión de datos del resumen
        const ingresos = data.resumen && data.resumen.ingresos_hoy ? parseFloat(data.resumen.ingresos_hoy) : 0;
        const pedidos = data.resumen && data.resumen.pedidos_hoy ? parseInt(data.resumen.pedidos_hoy) : 0;
        const top_productos = data.top_productos || [];

        // Formateador de moneda para México ($0.00)
        const formatoMoneda = new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
        });

        contenedor.innerHTML = `
            <div class="reportes-container fade-in">
                <div class="header-seccion">
                    <h2><i class='bx bx-bar-chart-alt-2'></i> Rendimiento de Hoy</h2>
                    <p>Visualiza el flujo de ventas y productos estrella.</p>
                </div>

                <div class="stats-grid">
                    <!-- Tarjeta de Ingresos -->
                    <div class="stat-card premium-shadow">
                        <div class="stat-icon" style="background: rgba(40, 167, 69, 0.1); color: #28a745;">
                            <i class='bx bx-dollar-circle'></i>
                        </div>
                        <div class="stat-info">
                            <span class="stat-label">Ventas Netas (Hoy)</span>
                            <h3 class="stat-value">${formatoMoneda.format(ingresos)}</h3>
                        </div>
                    </div>

                    <!-- Tarjeta de Pedidos -->
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
                    <!-- Gráfica Semanal -->
                    <div class="reporte-box premium-shadow">
                        <div class="box-header">
                            <h3><i class='bx bx-trending-up'></i> Histórico 7 Días</h3>
                        </div>
                        <div class="canvas-container" style="position: relative; height:250px; width:100%">
                            <canvas id="graficaVentasSemanal"></canvas>
                        </div>
                    </div>

                    <!-- Ranking de Productos -->
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

    function inicializarGraficaVentas(datosSemana) {
    const canvas = document.getElementById('graficaVentasSemanal');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Mapeo de datos: Fecha (Eje X) y Monto (Eje Y)
    const labels = datosSemana.map(d => {
        // Forzamos la interpretación de la fecha local para evitar desfases
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
                borderColor: '#007aff', // Azul Apple/Premium
                backgroundColor: 'rgba(0, 122, 255, 0.1)',
                borderWidth: 3,
                tension: 0.4, // Curva suave
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
            plugins: {
                legend: { display: false } // Ocultamos leyenda para diseño limpio
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    grid: { color: '#f0f0f2' },
                    ticks: { 
                        callback: value => '$' + value // Formato moneda en eje Y
                    }
                },
                x: { grid: { display: false } }
            }
        }
    });
}
})();