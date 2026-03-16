function cargarVista(vista) {
    fetch(vista)
        .then(response => response.text())
        .then(html => {
            const container = document.getElementById('contenido');
            container.innerHTML = html;
            // execute any scripts contained in the loaded html
            const scripts = container.querySelectorAll('script');
            scripts.forEach(oldScript => {
                const newScript = document.createElement('script');
                if (oldScript.src) {
                    newScript.src = oldScript.src;
                } else {
                    newScript.textContent = oldScript.textContent;
                }
                document.body.appendChild(newScript);
            });
        })
        .catch(error => {
            console.error('Error al cargar la vista:', error);
        });
}