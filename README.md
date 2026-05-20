# Simulador de Rutas Colombia Comparte
### Modelo de Cadenas de Markov · Flask · Canvas 2D

Panel interactivo que combina **simulación numérica masiva** con una **visualización animada de flujos de usuarios** sobre un grafo de 34 estados, todo en un diseño dark premium.

---

## 📁 Estructura del Proyecto

```
TrabajoFinalSimulacion/
│
├── app.py                  # Servidor Flask: rutas, API y lógica de simulación Markov
├── requirements.txt        # Dependencias Python (Flask, pandas, numpy, gunicorn)
├── runtime.txt             # Versión de Python para despliegue en Render
├── .gitignore              # Archivos excluidos del repositorio
├── README.md               # Este archivo
│
├── notebooks/              # Cuadernos Jupyter de investigación y prototipado
│   ├── Colombia_Comparte_v2.ipynb          # Versión visual animada (Canvas)
│   └── Simulacion_de_Colombia_Comparte.ipynb  # Versión original análisis Markov
│
├── templates/
│   └── index.html          # Plantilla principal de la app (HTML único)
│
└── static/
    ├── css/
    │   └── style.css       # Sistema de diseño dark premium completo
    └── js/
        ├── main.js         # Lógica del dashboard: tab switching, simulación masiva, tablas
        └── flow_map.js     # Simulador visual interactivo: canvas, nodos, animaciones
```

---

## 🚀 Cómo ejecutar localmente

```bash
# 1. Instalar dependencias
pip install -r requirements.txt

# 2. Iniciar el servidor
python app.py

# 3. Abrir en el navegador
# http://127.0.0.1:5000/
```

---

## 🧩 Módulos del Sistema

### `app.py`
- Define los **34 estados** del recorrido de usuario en Colombia Comparte
- Calcula la **matriz de conteos** y la **matriz de probabilidades de transición**
- Expone dos endpoints REST:
  - `GET /api/data` — devuelve estados, recorridos base y matrices
  - `POST /api/simulate` — ejecuta simulación masiva de N usuarios

### `static/js/main.js`
- Sistema de **navegación por pestañas** del sidebar
- Renderizado de tablas de estados, recorridos y matrices
- Ejecución de simulación masiva y visualización de resultados con Chart.js

### `static/js/flow_map.js`
- Renderizado del **canvas interactivo** con los 34 nodos conectados
- Animación **paso a paso** de recorridos usando las probabilidades Markov
- Simulaciones individuales y en lote con KPIs en tiempo real
- Tooltip interactivo sobre cada nodo con estadísticas acumuladas

---

## 🌐 Despliegue en Render

Ver las instrucciones detalladas al final del archivo `README.md` original o seguir estos pasos rápidos:
1. Subir el repositorio a GitHub (sin la carpeta `notebooks/` si se prefiere)
2. Conectar el repositorio en [render.com](https://render.com/)
3. Configurar:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app`
   - **Instance Type:** Free
