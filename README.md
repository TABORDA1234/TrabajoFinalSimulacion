# Guía Paso a Paso para Desplegar el Simulador en Render (Vía GitHub)

Este documento te guiará desde cero para publicar tu simulador en internet de manera gratuita usando **GitHub** y **Render**. No se asume conocimiento previo, así que sigue las instrucciones al pie de la letra.

---

## PARTE 1: Subir tu código a GitHub

GitHub es una plataforma donde guardarás tu código en la nube de forma segura.

### 1. Crear tu cuenta (Si no tienes una)
1. Ve a [github.com](https://github.com/) en tu navegador.
2. Haz clic en **"Sign up"** en la esquina superior derecha.
3. Sigue las instrucciones para crear una cuenta (necesitarás un correo electrónico y crear una contraseña).
4. Verifica tu cuenta con el correo que te enviarán.

### 2. Crear un nuevo "Repositorio" (Tu carpeta en la nube)
1. Inicia sesión en GitHub.
2. En la esquina superior derecha, haz clic en el botón con el signo **`+`** y selecciona **"New repository"**.
3. Rellena los datos así:
   - **Repository name**: Ponle un nombre sin espacios, por ejemplo: `simulador-rutas`
   - **Description**: (Opcional) "Simulador de usuario con Cadenas de Markov"
   - Marca la opción **"Public"** (Público).
   - **NO** marques la casilla "Add a README file" (déjala vacía).
4. Haz clic en el botón verde **"Create repository"**.

### 3. Subir tus archivos directamente desde el navegador (La forma más fácil)
1. En la pantalla que aparece tras crear el repositorio, busca un texto azul que dice **"uploading an existing file"** (debajo de *"...or create a new repository on the command line"*). Haz clic ahí.
2. Verás una pantalla para arrastrar archivos.
3. Abre la carpeta de tu proyecto en tu computadora (`c:\Users\TABORDA\Documents\PROGRAMAS 6\SIMULACION\Proyecto integrador`).
4. Selecciona y arrastra al navegador **todos** estos archivos y carpetas:
   - La carpeta `templates` (completa)
   - La carpeta `static` (completa)
   - El archivo `app.py`
   - El archivo `requirements.txt`
   - El archivo `.gitignore` (si está visible)
   - *Nota: NO subas la carpeta `venv` ni `__pycache__`.*
5. Espera a que la barra de progreso de todos los archivos llegue al final.
6. Abajo, en "Commit changes", haz clic en el botón verde **"Commit changes"**. Espera unos segundos a que procese. 
¡Felicidades! Tu código ya está en GitHub.

---

## PARTE 2: Desplegar en Render

Render es el servidor que tomará tu código desde GitHub y lo pondrá a funcionar como una página web pública.

### 1. Crear cuenta en Render conectada a GitHub
1. Ve a [render.com](https://render.com/) en otra pestaña.
2. Haz clic en **"Get Started"** (arriba a la derecha).
3. Selecciona la opción **"GitHub"** (botón negro). 
4. Autoriza a Render para que pueda leer tus repositorios de GitHub siguiendo las ventanas emergentes que aparezcan.

### 2. Crear el Servicio Web
1. Una vez dentro de Render, verás un panel de control (Dashboard).
2. Haz clic en el botón **"New +"** (arriba a la derecha) y selecciona **"Web Service"**.
3. En la siguiente pantalla, elige **"Build and deploy from a Git repository"** y dale a "Next".
4. Verás una lista con tus repositorios. Busca el que creaste (`simulador-rutas`) y haz clic en **"Connect"** a la derecha.

### 3. Configurar el Despliegue (¡Muy Importante!)
Aparecerá un formulario largo. Llena estrictamente esta información:

- **Name**: El nombre público de tu web (ej. `simulador-colombia-comparte`). Esto definirá la URL de tu página.
- **Region**: Deja la que esté por defecto (generalmente Oregon o Frankfurt).
- **Branch**: Déjalo en `main` (o `master`).
- **Runtime**: Render debería detectar automáticamente que es Python. Déjalo en **Python 3**.
- **Build Command**: Aquí Render debe instalar tus dependencias. Escribe o asegúrate de que diga exactamente esto:
  `pip install -r requirements.txt`
- **Start Command**: Aquí le decimos cómo arrancar la aplicación. Escribe exactamente esto:
  `gunicorn app:app`
- **Instance Type**: Asegúrate de que esté seleccionada la opción **"Free"** ($0/month).

### 4. ¡A Desplegar!
1. Ve hasta abajo y haz clic en el botón **"Create Web Service"**.
2. Verás una pantalla negra simulando una terminal (logs) que empezará a moverse. Render está descargando y configurando tu servidor de forma automática.
3. Este proceso tomará entre 2 y 5 minutos.
4. Cuando termine, verás un mensaje verde que dice **"Live"** o "Your service is live 🎉".
5. Arriba a la izquierda, debajo del nombre de tu proyecto, verás una URL (por ejemplo: `https://simulador-colombia-comparte.onrender.com`).
6. **¡Haz clic en esa URL y disfruta de tu simulador en internet!**

*Recuerda:* Al usar la versión gratuita, si la página pasa 15 minutos sin que nadie entre, se "dormirá". Cuando vuelvas a entrar, la pantalla se quedará cargando unos 40 segundos mientras el servidor despierta, y luego volverá a la normalidad.
