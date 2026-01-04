# Manual de Instalación y Ejecución - TallerMaster Pro

Esta aplicación web utiliza tecnología moderna (Módulos ES6) para funcionar de manera eficiente sin necesidad de un servidor backend complejo. Sin embargo, debido a restricciones de seguridad de los navegadores web (como Chrome, Edge, Firefox), **no se puede abrir directamente haciendo doble clic en el archivo `index.html`**.

Para ejecutar la aplicación correctamente en tu computador, sigue **una** de las siguientes opciones (La opción 1 es la más fácil si ya tienes VS Code).

---

### Opción 1: Usar Visual Studio Code (Recomendado)

Si tienes Visual Studio Code instalado (el editor donde probablemente ves el código):

1. Abre la carpeta del proyecto en Visual Studio Code.
2. Ve a la pestaña de "Extensiones" (cuadradito a la izquierda) o presiona `Ctrl+Shift+X`.
3. Busca una extensión llamada **"Live Server"** (creada por Ritwick Dey) e instálala.
4. Una vez instalada, abre el archivo `index.html` en el editor.
5. Haz clic derecho en cualquier parte del código del archivo `index.html` y selecciona **"Open with Live Server"**.
6. Se abrirá automáticamente tu navegador con la aplicación funcionando al 100%.

---

### Opción 2: Usar Node.js (Para usuarios avanzados)

Si tienes Node.js instalado en tu computador:

1. Abre la terminal (Símbolo del sistema) en la carpeta del proyecto.
2. Ejecuta el siguiente comando para instalar un servidor simple:
   ```bash
   npx serve
   ```
   (Si te pregunta si deseas instalar el paquete `serve`, escribe `y` y presiona Enter).
3. La terminal te mostrará una dirección, usualmente `http://localhost:3000`.
4. Abre esa dirección en tu navegador.

---

### Opción 3: Usar Python (Si no quieres instalar nada extra)

La mayoría de los computadores ya tienen Python instalado.

1. Abre la terminal en la carpeta del proyecto.
2. Ejecuta:
   ```bash
   python -m http.server
   ```
   (o `python3 -m http.server` en Mac/Linux).
3. Abre tu navegador y ve a `http://localhost:8000`.

---

## Nota sobre los Respaldos Automáticos

Cuando guardas una OT, agregas un gasto o editas información, la aplicación descargará automáticamente un archivo llamado `taller_autorespaldo_FECHA.json`.

*   **¿Se sobrescriben?** NO. Por seguridad, el navegador siempre crea un archivo nuevo.
*   **¿Qué hago con tantos archivos?** Puedes borrarlos de tu carpeta "Descargas" regularmente. Solo necesitas el último (el que tenga la fecha más reciente) si necesitas restaurar la información en otro computador.
*   **Para restaurar:** Usa el botón "Restaurar" en el Panel Principal y selecciona tu archivo `.json` más reciente.
