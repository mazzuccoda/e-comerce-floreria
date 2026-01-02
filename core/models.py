from datetime import date

from django.db import models


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
