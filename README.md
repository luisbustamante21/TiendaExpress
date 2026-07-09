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

Levanta PostgreSQL y RabbitMQ desde la carpeta TiendaExpress/ ejecutando:

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

| Método | Endpoint | Descripción |
|---------|----------|-------------|
| **POST** | `/api/auth/login/` | Autentica al usuario y retorna los tokens JWT (`access` y `refresh`). |
| **POST** | `/api/auth/refresh/` | Genera un nuevo token de acceso a partir del `refresh token`. |
| **GET** | `/api/products/` | Obtiene el listado paginado de productos (10 elementos por página). |
| **POST** | `/api/orders/` | Crea un nuevo pedido, valida el stock disponible y envía el procesamiento de forma asíncrona mediante Celery. |
| **GET** | `/api/orders/` | Lista únicamente los pedidos del usuario autenticado. Permite filtrar por estado utilizando el parámetro `?status=PENDING`. |
| **GET** | `/api/orders/{id}/` | Obtiene el detalle de un pedido específico perteneciente al usuario autenticado. |

# 📝 Resumen del Desarrollo y Prioridades

Durante el desarrollo, prioricé la funcionalidad de extremo a extremo (E2E) y la solidez arquitectónica sobre el diseño estético. El objetivo fue asegurar un flujo completo, limpio y escalable.

## Prioridades durante el desarrollo

* **Backend & Base de Datos:** API robusta con Django REST Framework y PostgreSQL. **Nota:** No se implementó una tabla de usuarios personalizada; se utilizó el modelo nativo `auth.User` de Django para gestionar la autenticación de forma segura y eficiente.
* **Procesamiento Asíncrono:** Implementación de Celery y RabbitMQ para gestionar el ciclo de vida de los pedidos sin bloqueos.
* **Frontend:** Interfaz funcional integrada con la API, gestionando autenticación, paginación de productos y creación de pedidos.

## ¿Qué mejoraría con más tiempo?

* **UI/UX:** Diseño visual moderno, profesional y *responsive*.
* **Testing:** Implementación de suite de pruebas unitarias e integrales para backend y frontend.
* **Experiencia de usuario:** Notificaciones en tiempo real para el estado de los pedidos y mensajes de error más detallados.
* **Documentación:** Generación automática de documentación de API mediante Swagger/OpenAPI.