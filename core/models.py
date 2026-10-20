from datetime import date, time

from django.db import models


class Translation(models.Model):
    source_text = models.TextField()
    source_lang = models.CharField(max_length=5, default='es')
    target_lang = models.CharField(max_length=5)
    translated_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('source_text', 'source_lang', 'target_lang')
        indexes = [
            models.Index(fields=['source_text', 'target_lang']),
        ]
        verbose_name = 'Traducción'
        verbose_name_plural = 'Traducciones'

    def __str__(self):
        return f'{self.source_text[:50]} -> {self.translated_text[:50]}'


class SiteSettings(models.Model):
    vacation_enabled = models.BooleanField(default=False)
    vacation_from = models.DateField(default=date(2026, 1, 1))
    vacation_until = models.DateField(default=date(2026, 1, 31))
    reopen_date = models.DateField(default=date(2026, 2, 1))
    vacation_message = models.TextField(
        default='Cerrado por vacaciones. Tomamos pedidos a partir del 01/02.',
        blank=True,
    )

    class Meta:
        verbose_name = 'Configuración del sitio'
        verbose_name_plural = 'Configuración del sitio'

    def __str__(self):
        return 'Configuración del sitio'

    @classmethod
    def get_solo(cls):
        obj = cls.objects.first()
        if obj:
            return obj
        return cls.objects.create()

    def is_vacation_active(self, today: date | None = None) -> bool:
        if not self.vacation_enabled:
            return False

        if today is None:
            today = date.today()

        if self.vacation_from and today < self.vacation_from:
            return False

        if self.vacation_until and today > self.vacation_until:
            return False

        return True

    def min_delivery_date(self, today: date | None = None) -> date:
        if today is None:
            today = date.today()

        if self.is_vacation_active(today=today) and self.reopen_date:
            return self.reopen_date

        return today


DIAS_SEMANA = (
    (0, 'Lunes'),
    (1, 'Martes'),
    (2, 'Miércoles'),
    (3, 'Jueves'),
    (4, 'Viernes'),
    (5, 'Sábado'),
    (6, 'Domingo'),
)


class HorarioSemanal(models.Model):
    """Cómo atiende el local cada día de la semana (lo normal, sin excepciones)."""

    dia = models.PositiveSmallIntegerField(
        choices=DIAS_SEMANA, unique=True,
        help_text='0 = lunes … 6 = domingo',
    )
    abierto = models.BooleanField(default=True)
    apertura = models.TimeField(default=time(9, 0))
    cierre = models.TimeField(default=time(21, 0))
    hora_corte = models.TimeField(
        default=time(17, 0),
        help_text='Hasta qué hora se toman pedidos para entregar ese mismo día.',
    )
    acepta_retiro = models.BooleanField(default=True)
    acepta_envio = models.BooleanField(default=True)

    class Meta:
        ordering = ['dia']
        verbose_name = 'Horario semanal'
        verbose_name_plural = 'Horario semanal'

    def __str__(self):
        if not self.abierto:
            return f'{self.get_dia_display()}: cerrado'
        return f'{self.get_dia_display()}: {self.apertura:%H:%M} a {self.cierre:%H:%M}'


class DiaEspecial(models.Model):
    """Una fecha puntual que pisa al horario semanal (feriado, medio día, cierre)."""

    fecha = models.DateField(unique=True)
    abierto = models.BooleanField(
        default=True, help_text='Desmarcá para cerrar ese día.',
    )
    apertura = models.TimeField(default=time(9, 0))
    cierre = models.TimeField(default=time(21, 0))
    hora_corte = models.TimeField(default=time(17, 0))
    acepta_retiro = models.BooleanField(default=True)
    acepta_envio = models.BooleanField(default=True)
    mensaje = models.CharField(
        max_length=200, blank=True,
        help_text='Se muestra en el checkout y se publica para los asistentes de IA.',
    )
    creado = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['fecha']
        verbose_name = 'Día especial'
        verbose_name_plural = 'Días especiales'

    def __str__(self):
        if not self.abierto:
            return f'{self.fecha:%d/%m/%Y}: cerrado'
        return f'{self.fecha:%d/%m/%Y}: {self.apertura:%H:%M}-{self.cierre:%H:%M}'
