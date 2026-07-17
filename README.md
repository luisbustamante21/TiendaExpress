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
| **POST** | `/api/auth/login/` | Autentica al usuario y establece las cookies seguras `access_token` y `refresh_token` (HttpOnly). |
| **POST** | `/api/auth/refresh/` | Renueva el token de acceso leyendo la cookie de refresco de forma segura. |
| **POST** | `/api/auth/logout/` | Destruye las cookies de sesión en el navegador. |
| **GET** | `/api/products/` | Obtiene el listado paginado de productos (10 elementos por página). |
| **POST** | `/api/orders/` | Crea un nuevo pedido utilizando Idempotency Keys, valida stock y procesa vía Celery. |
| **GET** | `/api/orders/` | Lista los pedidos del usuario autenticado. Permite filtrar por estado (`?status=PENDING`). |
| **GET** | `/api/orders/{id}/` | Obtiene el detalle específico de un pedido del usuario. |

# 🛠️ Arquitectura, Resiliencia y Seguridad (Implementado)

Para cumplir con estándares de nivel empresarial y resolver vulnerabilidades críticas, el proyecto incluye las siguientes mejoras técnicas listas para evaluación:

### 🔒 Seguridad y Gestión de Estado (Tema 4 y 5)
- **Mitigación XSS:** Se eliminó el almacenamiento de tokens en `localStorage`. La autenticación se maneja estrictamente mediante **Cookies HttpOnly, Secure y SameSite=Lax**. El frontend no tiene acceso por JS a las credenciales.
- **Protección contra Exposición de Datos:** Se sanitizaron los bloques `except` en Django. Ningún error interno (`str(e)`) se envía al cliente en errores 500; se registran localmente en logs estructurados y el usuario recibe un mensaje genérico seguro.

### ⚡ Concurrencia y Resiliencia (Tema 1, 3, 6 y 13)
- **Evitación de Race Conditions:** El backend utiliza `transaction.on_commit()` para asegurar que Celery procese los pagos solo cuando los datos de la orden estén persistidos en la base de datos.
- **Control de Thundering Herd:** El interceptor de Axios implementa una cola de promesas asíncronas y un candado (`isRefreshing`). Si múltiples peticiones fallan por expiración de token al mismo tiempo, solo una viaja al endpoint de `/refresh/` y las demás esperan su resolución.
- **Garantía de Idempotencia:** El frontend genera un `Idempotency-Key` (UUID) único antes de enviar la orden. Si el usuario reintenta la petición por un fallo de red, el backend detecta el duplicado y evita cobros o procesamiento dobles.
- **Consistencia Eventual (Saga Corto):** En caso de que la tarea asíncrona de Celery falle definitivamente al procesar el pago con la pasarela, se ejecuta un flujo de compensación que devuelve el stock reservado a los productos.

### 🚀 Próximos Pasos de Infraestructura (Sugeridos para Roadmap)
- **Dockerización Total:** Mover el servidor de desarrollo de Django y la app de React a contenedores en el `docker-compose.yml` utilizando *multi-stage builds* y usuarios no-root para producción.
- **Proveedores de Identidad (SSO):** Migrar la autenticación local hacia una solución centralizada como Keycloak vía OAuth2/OIDC.

# 📝 Resumen del Desarrollo y Prioridades

Debido al tiempo disponible para la prueba, prioricé la funcionalidad integral y la solidez arquitectónica sobre el diseño estético, asegurando un flujo de trabajo completo de principio a fin.

## Prioridades de Desarrollo
* **Backend:** Implementación de API REST con Django REST Framework y PostgreSQL. *Nota: No creé una tabla de usuarios personalizada; utilicé `auth.User` nativo de Django para agilizar la autenticación.*
* **Asincronía:** Integración de Celery y RabbitMQ para el procesamiento de pedidos en segundo plano.
* **Frontend:** Interfaz funcional conectada a la API que maneja autenticación, navegación paginada y creación de pedidos.

## Mejoras a Futuro
* **UI/UX:** Desarrollo de un diseño visual más moderno y adaptativo (responsive).
* **Testing:** Implementación de pruebas unitarias e integrales (backend y frontend).
* **Feedback en tiempo real:** Implementación de notificaciones o actualizaciones automáticas del estado de los pedidos.
* **Refactorización:** Optimización de componentes del frontend para mayor reutilización y mantenibilidad.