"""
Comando para inicializar la configuración de shipping zones
"""
from django.core.management.base import BaseCommand
from pedidos.models import ShippingConfig, ShippingZone
from decimal import Decimal


class Command(BaseCommand):
    help = 'Inicializa la configuración de shipping zones con datos por defecto'

    def handle(self, *args, **options):
        self.stdout.write('🚀 Inicializando configuración de shipping zones...')
        
        # Crear o actualizar configuración principal
        config, created = ShippingConfig.objects.get_or_create(
            id=1,
            defaults={
                'store_name': 'Florería Cristina',
                'store_address': 'Av. Solano Vera 480, Yerba Buena, Tucumán',
                'store_lat': Decimal('-26.8167'),
                'store_lng': Decimal('-65.3167'),
                'max_distance_express_km': Decimal('5.00'),
                'max_distance_programado_km': Decimal('11.00'),
                'use_distance_matrix': True,
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS('✅ Configuración creada'))
        else:
            self.stdout.write(self.style.WARNING('⚠️  Configuración ya existía'))
        
        self.stdout.write(f'   Store: {config.store_name}')
        self.stdout.write(f'   Location: ({config.store_lat}, {config.store_lng})')
        self.stdout.write(f'   Express max: {config.max_distance_express_km} km')
        self.stdout.write(f'   Programado max: {config.max_distance_programado_km} km')
        
        # Crear zonas Express
        self.stdout.write('\n📍 Creando zonas Express...')
        express_zones = [
            {
                'zone_name': 'Yerba Buena Centro',
                'min_distance_km': Decimal('0'),
                'max_distance_km': Decimal('3'),
                'base_price': Decimal('5000.00'),
                'price_per_km': Decimal('0'),
                'zone_order': 1,
            },
            {
                'zone_name': 'Yerba Buena Extendido',
                'min_distance_km': Decimal('3'),
                'max_distance_km': Decimal('5'),
                'base_price': Decimal('7000.00'),
                'price_per_km': Decimal('500.00'),
                'zone_order': 2,
            },
        ]
        
        for zone_data in express_zones:
            zone, created = ShippingZone.objects.get_or_create(
                shipping_method='express',
                zone_order=zone_data['zone_order'],
                defaults=zone_data
            )
            status = '✅ Creada' if created else '⚠️  Ya existía'
            self.stdout.write(f'   {status}: {zone.zone_name} ({zone.min_distance_km}-{zone.max_distance_km} km)')
        
        # Crear zonas Programado
        self.stdout.write('\n📍 Creando zonas Programado...')
        programado_zones = [
            {
                'zone_name': 'Yerba Buena',
                'min_distance_km': Decimal('0'),
                'max_distance_km': Decimal('5'),
                'base_price': Decimal('5000.00'),
                'price_per_km': Decimal('0'),
                'zone_order': 1,
            },
            {
                'zone_name': 'San Miguel Centro',
                'min_distance_km': Decimal('5'),
                'max_distance_km': Decimal('8'),
                'base_price': Decimal('7000.00'),
                'price_per_km': Decimal('500.00'),
                'zone_order': 2,
            },
            {
                'zone_name': 'San Miguel Extendido',
                'min_distance_km': Decimal('8'),
                'max_distance_km': Decimal('11'),
                'base_price': Decimal('10000.00'),
                'price_per_km': Decimal('800.00'),
                'zone_order': 3,
            },
        ]
        
        for zone_data in programado_zones:
            zone, created = ShippingZone.objects.get_or_create(
                shipping_method='programado',
                zone_order=zone_data['zone_order'],
                defaults=zone_data
            )
            status = '✅ Creada' if created else '⚠️  Ya existía'
            self.stdout.write(f'   {status}: {zone.zone_name} ({zone.min_distance_km}-{zone.max_distance_km} km)')
        
        self.stdout.write(self.style.SUCCESS('\n✅ Inicialización completada!'))
        self.stdout.write('\n📊 Resumen:')
        self.stdout.write(f'   Zonas Express: {ShippingZone.objects.filter(shipping_method="express").count()}')
        self.stdout.write(f'   Zonas Programado: {ShippingZone.objects.filter(shipping_method="programado").count()}')
