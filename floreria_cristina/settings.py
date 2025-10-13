"""
Django settings for floreria_cristina project.
Generado con ajustes para deploy en Railway (DATABASE_URL, hosts por env, etc).
"""

from pathlib import Path
import os
import environ

# =============================================================================
# ENV / Paths
# =============================================================================
BASE_DIR = Path(__file__).resolve().parent.parent

# Inicializar variables de entorno
env = environ.Env()
# En Railway no hay .env: esto solo corre en local si existe
if os.path.exists(BASE_DIR / ".env"):
    env.read_env(BASE_DIR / ".env")

# =============================================================================
# Seguridad / Modo
# =============================================================================
# ¡En prod, seteá SECRET_KEY por variable!
SECRET_KEY = env("SECRET_KEY", default="django-insecure-dev-key")
DEBUG = env.bool("DEBUG", default=False)

ALLOWED_HOSTS = [
    "localhost",
    "127.0.0.1",
    "web",
    "testserver",
    *env.list("ALLOWED_HOSTS", default=[]),
]

# Confianza detrás de proxy (Railway / Nginx)
USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# =============================================================================
# CORS / CSRF
# =============================================================================
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost",
]
CORS_ALLOW_CREDENTIALS = True
CORS_URLS_REGEX = r"^/api/.*$"

CORS_ALLOW_HEADERS = [
    "accept", "accept-encoding", "authorization", "content-type", "dnt", "origin",
    "user-agent", "x-csrftoken", "x-requested-with", "x-http-method-override",
    "cache-control", "pragma",
]
CORS_ALLOW_METHODS = ["DELETE", "GET", "OPTIONS", "PATCH", "POST", "PUT"]

CSRF_TRUSTED_ORIGINS = env.list(
    "CSRF_TRUSTED_ORIGINS",
    default=[
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://web:8000",
        "http://localhost",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
)

# Rutas exentas de CSRF (tu lista original)
CSRF_EXEMPT_URLS = [
    r"^/api/carrito/.*",
    r"^/api/usuarios/.*",
    r"^/api/pedidos/.*",
    r"^/api/catalogo/.*",
]

# Cookies (modo dev por defecto)
CSRF_COOKIE_SECURE = False
CSRF_COOKIE_HTTPONLY = False
CSRF_USE_SESSIONS = False

SESSION_COOKIE_SAMESITE = None
SESSION_COOKIE_SECURE = False
SESSION_COOKIE_HTTPONLY = True
SESSION_ENGINE = "django.contrib.sessions.backends.db"
SESSION_COOKIE_NAME = "sessionid"
SESSION_SAVE_EVERY_REQUEST = True

# =============================================================================
# REST Framework
# =============================================================================
REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",
    ],
    "UNAUTHENTICATED_USER": None,
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
}

# =============================================================================
# Apps
# =============================================================================
DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sites",
]

THIRD_PARTY_APPS = [
    "corsheaders",
    "rest_framework",
    "rest_framework.authtoken",
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "compressor",
    "debug_toolbar",
    "django_celery_beat",
]

LOCAL_APPS = [
    "core",
    "catalogo",
    "carrito",
    "pedidos",
    "usuarios",
    "notificaciones",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS + [
    "crispy_forms",
    "crispy_bootstrap5",
    "widget_tweaks",
    "allauth.socialaccount.providers.google",
    "allauth.socialaccount.providers.facebook",
]

# =============================================================================
# Auth / Allauth
# =============================================================================
AUTHENTICATION_BACKENDS = (
    "django.contrib.auth.backends.ModelBackend",
    "allauth.account.auth_backends.AuthenticationBackend",
)

SITE_ID = 1
LOGIN_REDIRECT_URL = "/"
ACCOUNT_LOGOUT_REDIRECT_URL = "/"
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_AUTHENTICATION_METHOD = "email"
ACCOUNT_EMAIL_VERIFICATION = "mandatory"
ACCOUNT_SESSION_REMEMBER = True

# =============================================================================
# Middleware / URLs / Templates / WSGI
# =============================================================================
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "allauth.account.middleware.AccountMiddleware",
]

ROOT_URLCONF = "floreria_cristina.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                "core.admin_context.admin_stats",
            ],
        },
    },
]

WSGI_APPLICATION = "floreria_cristina.wsgi.application"

# =============================================================================
# Base de datos: Railway (DATABASE_URL) o local
# =============================================================================
# Si existe DATABASE_URL en env, úsalo; si no, caé al perfil local (HOST='db')
DATABASE_URL = env("DATABASE_URL", default=None)

if DATABASE_URL:
    # Import condicional para evitar error en build si aún no está instalado
    import dj_database_url
    DATABASES = {"default": dj_database_url.parse(DATABASE_URL, conn_max_age=600)}
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": env("POSTGRES_DB", default="floreria_cristina_dev"),
            "USER": env("POSTGRES_USER", default="floradmin"),
            "PASSWORD": env("POSTGRES_PASSWORD", default="florpassword"),
            "HOST": "db",
            "PORT": "5432",
            "CONN_MAX_AGE": 0,
            "OPTIONS": {
                "connect_timeout": 30,
                "application_name": "floreria_cristina_dev",
                "options": "-c statement_timeout=30000",
            },
        }
    }
    # Deshabilitar cursores del lado del servidor (tu ajuste original)
    DATABASES["default"]["DISABLE_SERVER_SIDE_CURSORS"] = True

# =============================================================================
# Password validators
# =============================================================================
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# =============================================================================
# I18N
# =============================================================================
LANGUAGE_CODE = "es-ar"
TIME_ZONE = "America/Argentina/Buenos_Aires"
USE_I18N = True
USE_TZ = True

# =============================================================================
# Emails
# =============================================================================
EMAIL_BACKEND = env(
    "EMAIL_BACKEND",
    default="django.core.mail.backends.console.EmailBackend",
)
EMAIL_HOST = env("EMAIL_HOST", default="smtp.gmail.com")
EMAIL_PORT = env.int("EMAIL_PORT", default=587)
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=True)
EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="no-responder@floreriacristina.com")
SERVER_EMAIL = DEFAULT_FROM_EMAIL

# =============================================================================
# Twilio
# =============================================================================
TWILIO_ACCOUNT_SID = env("TWILIO_ACCOUNT_SID", default="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
TWILIO_AUTH_TOKEN = env("TWILIO_AUTH_TOKEN", default="your_auth_token")
TWILIO_WHATSAPP_NUMBER = env("TWILIO_WHATSAPP_NUMBER", default="+14155238886")
TWILIO_SMS_NUMBER = env("TWILIO_SMS_NUMBER", default="")

# =============================================================================
# Mercado Pago
# =============================================================================
MERCADOPAGO = {
    "ACCESS_TOKEN": os.getenv("MP_ACCESS_TOKEN", "TEST-1234567890123456-123456-1234567890abcdef1234567890abcdef123456"),
    "PUBLIC_KEY": os.getenv("MP_PUBLIC_KEY", "TEST-12345678-1234-1234-1234-123456789012"),
    "AUTO_RETURN": "approved",
    "SANDBOX": True,
}

# =============================================================================
# Static / Media / Compressor
# =============================================================================
STATIC_URL = "/static/"
STATICFILES_DIRS = [os.path.join(BASE_DIR, "static")]
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")

STATICFILES_FINDERS = [
    "django.contrib.staticfiles.finders.FileSystemFinder",
    "django.contrib.staticfiles.finders.AppDirectoriesFinder",
    "compressor.finders.CompressorFinder",
]

COMPRESS_ENABLED = True
COMPRESS_URL = STATIC_URL
COMPRESS_ROOT = STATIC_ROOT
COMPRESS_PRECOMPILERS = (("text/x-scss", "django_libsass.SassCompiler"),)

MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "media")

# =============================================================================
# Crispy Forms
# =============================================================================
CRISPY_ALLOWED_TEMPLATE_PACKS = "bootstrap5"
CRISPY_TEMPLATE_PACK = "bootstrap5"

# =============================================================================
# Otros
# =============================================================================
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

INTERNAL_IPS = ["127.0.0.1"]

# Carrito / sesiones
CART_SESSION_ID = "carrito"
SESSION_SERIALIZER = "floreria_cristina.session_serializer.CustomJSONSerializer"

# =============================================================================
# Celery
# =============================================================================
CELERY_BROKER_URL = "redis://redis:6379/0"
CELERY_RESULT_BACKEND = "redis://redis:6379/0"
CELERY_ACCEPT_CONTENT = ["application/json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE
CELERY_BEAT_SCHEDULER = "django_celery_beat.schedulers:DatabaseScheduler"

# =============================================================================
# Social providers
# =============================================================================
SOCIALACCOUNT_PROVIDERS = {
    "google": {
        "SCOPE": ["profile", "email"],
        "AUTH_PARAMS": {"access_type": "online"},
    },
    "facebook": {
        "METHOD": "oauth2",
        "SCOPE": ["email", "public_profile"],
        "AUTH_PARAMS": {"auth_type": "reauthenticate"},
        "FIELDS": ["id", "email", "name"],
    },
}
