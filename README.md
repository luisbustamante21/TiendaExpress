# 📦 TiendaExpress - Fullstack App (Django + React)

Este proyecto contiene el **Backend (Django REST Framework)** y el **Frontend (React)** para **TiendaExpress**.

La aplicación utiliza:

- **PostgreSQL** como base de datos.
- **Celery** junto con **RabbitMQ** para el procesamiento asíncrono de los pedidos.

---

# 🛠️ Requisitos Previos

Asegúrate de tener instalado lo siguiente antes de comenzar:

- Python 3.12+
- Node.js v18+ y npm
- Docker y Docker Compose
- Git

---

# 🚀 Guía de Instalación y Configuración del Backend

Sigue estos pasos en el orden indicado para evitar problemas con la base de datos.

## 1. Preparación de archivos y variables de entorno

Ubícate en la carpeta raíz del backend (donde se encuentra `manage.py`).

Debes tener los siguientes archivos:

- `docker-compose.yml`
- `init_db.sql`

Crea un archivo llamado **`.env`** con el siguiente contenido:

```env
# Seguridad
SECRET_KEY=django-insecure-tu-secret-key-aqui
DEBUG=True

# Base de datos
DB_NAME=tiendaexpress_db
DB_USER=postgres
DB_PASSWORD=adminpassword
DB_HOST=127.0.0.1
DB_PORT=5433

# Celery (RabbitMQ)
CELERY_BROKER_URL=amqp://guest:guest@localhost:5672//
```

---

## 2. Levantar la infraestructura con Docker

Levanta PostgreSQL y RabbitMQ ejecutando:

```bash
docker compose up -d
```

> **Nota**
>
> PostgreSQL quedará expuesto en el puerto **5433**.
>
> RabbitMQ utilizará los puertos **5672** y **15672**.

---

## 3. Crear el entorno virtual e instalar dependencias

### Windows

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### Linux / macOS

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## 4. Configurar la base de datos

> **Importante:** El orden de estos pasos es obligatorio.

### Paso A. Ejecutar las migraciones de Django

Esto crea las tablas nativas de Django (`auth_user`, sesiones, permisos, etc.).

```bash
python manage.py migrate
```

---

### Paso B. Ejecutar el script SQL

Una vez creada la tabla `auth_user`, ejecuta:

```bash
docker exec -i tiendaexpress-db-1 psql -U postgres -d tiendaexpress_db < init_db.sql
```

> **Nota**
>
> Si tu contenedor tiene otro nombre, verifica cuál es con:
>
> ```bash
> docker ps
> ```
>
> y reemplaza `tiendaexpress-db-1` por el nombre correspondiente.

---

### Paso C. Crear un superusuario

```bash
python manage.py createsuperuser
```

Sigue las instrucciones para ingresar:

- Usuario
- Email
- Contraseña

---

# ⚙️ Ejecutar el Backend

Para que todo funcione correctamente debes mantener **dos terminales abiertas**, ambas ubicadas en la carpeta del backend y con el entorno virtual activado.

## Terminal 1 - Worker de Celery

```bash
celery -A core worker --loglevel=info -P gevent
```

Este servicio procesará los pedidos en segundo plano utilizando RabbitMQ.

---

## Terminal 2 - Servidor Django

```bash
python manage.py runserver
```

La API estará disponible en:

```
http://127.0.0.1:8000/
```

---

# 💻 Ejecutar el Frontend (React)

Abre una tercera terminal.

## 1. Ir a la carpeta del frontend

```bash
cd ../frontend
```

> Ajusta la ruta si tu carpeta tiene otro nombre.

---

## 2. Instalar dependencias

Con npm:

```bash
npm install
```

O con Yarn:

```bash
yarn install
```

---

## 3. Ejecutar la aplicación

```bash
npm run dev
```

El frontend estará disponible normalmente en:

```
http://localhost:5173/
```

> **Nota**
>
> El frontend consume la API que se ejecuta en el puerto **8000**.

---

# 🔗 Endpoints principales de la API

## Autenticación

### Login

```http
POST /api/auth/login/
```

Obtiene los tokens JWT (`access` y `refresh`).

---

### Refresh Token

```http
POST /api/auth/refresh/
```

Genera un nuevo token de acceso.

---

## Productos

### Obtener productos

```http
GET /api/products/
```

Retorna el listado paginado de productos.

---

## Pedidos (Orders)

### Crear pedido

```http
POST /api/orders/
```

- Valida el stock.
- Encola el procesamiento mediante Celery.

---

### Listar pedidos

```http
GET /api/orders/
```

Lista los pedidos del usuario autenticado.

Permite filtrar por estado:

```http
GET /api/orders/?status=PENDING
```

---

### Obtener detalle de un pedido

```http
GET /api/orders/{id}/
```

Retorna la información completa de un pedido específico.

---

# 📝 Decisiones de Diseño

Durante el desarrollo de la prueba técnica prioricé la implementación completa de la funcionalidad tanto del **backend** como del **frontend**, procurando que el flujo principal de la aplicación funcionara de principio a fin: autenticación, consulta de productos, creación de pedidos y procesamiento asíncrono mediante Celery.

Debido al tiempo disponible para la realización de la prueba, decidí dedicar un mayor esfuerzo a la arquitectura y la lógica de negocio, dejando en segundo plano aspectos relacionados con el diseño visual de la interfaz. Consideré más importante entregar una aplicación funcional, con una estructura clara y una separación adecuada de responsabilidades, que invertir tiempo en detalles estéticos.

### Prioridades durante el desarrollo

- Implementar correctamente la API REST con Django REST Framework.
- Integrar PostgreSQL como base de datos.
- Procesar pedidos de forma asíncrona utilizando Celery y RabbitMQ.
- Desarrollar un frontend funcional que consumiera correctamente la API.
- Mantener una estructura de código organizada y fácil de mantener.

### ¿Qué mejoraría con más tiempo?

Si dispusiera de más tiempo, realizaría principalmente las siguientes mejoras:

- Mejorar la experiencia de usuario (UI/UX) con un diseño más moderno y responsive.
- Incorporar pruebas unitarias e integrales para backend y frontend.
- Agregar manejo de errores más detallado y mensajes de retroalimentación al usuario.
- Implementar un sistema de notificaciones en tiempo real para reflejar el cambio de estado de los pedidos.
- Optimizar algunos componentes del frontend para mejorar su reutilización y mantenibilidad.
- Añadir documentación automática de la API mediante Swagger/OpenAPI.