import os
from celery import Celery

# Establece el módulo de configuración de Django por defecto para Celery
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

app = Celery('core')

# Carga la configuración desde settings.py usando el prefijo CELERY_
app.config_from_object('django.conf:settings', namespace='CELERY')

# Descubre tareas automáticamente en tus aplicaciones (como tu archivo api/tasks.py)
app.autodiscover_tasks()