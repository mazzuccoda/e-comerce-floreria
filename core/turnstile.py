"""Verificación de Cloudflare Turnstile: prueba de que confirmó una persona.

Sin `TURNSTILE_SECRET_KEY` cargada la verificación se saltea y queda un aviso en
el log: el canal público queda apoyado sólo en el límite por IP hasta que se
carguen las claves.
"""
import logging

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
TIMEOUT = 8


def configurado() -> bool:
    return bool(getattr(settings, 'TURNSTILE_SECRET_KEY', ''))


def verificar(token: str, remote_ip: str = '') -> bool:
    if not configurado():
        logger.warning('TURNSTILE sin configurar: la confirmación no verifica que sea una persona')
        return True

    if not token:
        return False

    datos = {'secret': settings.TURNSTILE_SECRET_KEY, 'response': token}
    if remote_ip:
        datos['remoteip'] = remote_ip

    try:
        respuesta = requests.post(VERIFY_URL, data=datos, timeout=TIMEOUT)
        return bool(respuesta.json().get('success'))
    except Exception as exc:
        logger.warning('TURNSTILE no se pudo verificar: %s', exc)
        return False
