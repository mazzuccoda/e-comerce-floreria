"""
Script para inicializar el sistema de zonas de envío
Ejecutar con: python manage.py shell < setup_shipping_zones.py
O: python setup_shipping_zones.py
"""

import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'floreria_cristina.settings')
django.setup()

from pedidos.models import ShippingConfig, ShippingZone, ShippingPricingRule
from decimal import Decimal

def setup_shipping_system():
    print("🚀 Iniciando configuración del sistema de zonas de envío...")
    
    # 1. Crear configuración general
    print("\n📍 Creando configuración general...")
    config, created = ShippingConfig.objects.get_or_create(
        id=1,
        defaults={
            'store_name': 'Florería y Vivero Cristina',
            'store_address': 'Av. Solano Vera 480, Yerba Buena, Tucumán',
            'store_lat': Decimal('-26.816700'),
            'store_lng': Decimal('-65.316700'),
            'max_distance_express_km': Decimal('10.00'),
            'max_distance_programado_km': Decimal('25.00'),
            'use_distance_matrix': True
        }
    )
    
    if created:
        print(f"✅ Configuración creada: {config}")
    else:
        print(f"ℹ️  Configuración ya existe: {config}")
    
    # 2. Crear zonas Express
    print("\n🚀 Creando zonas Express...")
    
    express_zones = [
        {
            'zone_name': 'Yerba Buena',
            'min_distance_km': Decimal('0'),
            'max_distance_km': Decimal('5'),
            'base_price': Decimal('10000'),
            'price_per_km': Decimal('0'),
            'zone_order': 1
        },
        {
            'zone_name': 'San Miguel Centro',
            'min_distance_km': Decimal('5'),
            'max_distance_km': Decimal('10'),
            'base_price': Decimal('15000'),
            'price_per_km': Decimal('0'),
            'zone_order': 2
        },
        {
            'zone_name': 'San Miguel Extendido',
            'min_distance_km': Decimal('10'),
            'max_distance_km': Decimal('15'),
            'base_price': Decimal('20000'),
            'price_per_km': Decimal('0'),
            'zone_order': 3
        },
    ]
    
    for zone_data in express_zones:
        zone, created = ShippingZone.objects.get_or_create(
            shipping_method='express',
            zone_order=zone_data['zone_order'],
            defaults=zone_data
        )
        if created:
            print(f"  ✅ {zone}")
        else:
            print(f"  ℹ️  Ya existe: {zone}")
    
    # 3. Crear zonas Programado
    print("\n📅 Creando zonas Programado...")
    
    programado_zones = [
        {
            'zone_name': 'Yerba Buena',
            'min_distance_km': Decimal('0'),
            'max_distance_km': Decimal('5'),
            'base_price': Decimal('5000'),
            'price_per_km': Decimal('0'),
            'zone_order': 1
        },
        {
            'zone_name': 'San Miguel Centro',
            'min_distance_km': Decimal('5'),
            'max_distance_km': Decimal('10'),
            'base_price': Decimal('7000'),
            'price_per_km': Decimal('0'),
            'zone_order': 2
        },
        {
            'zone_name': 'San Miguel Extendido',
            'min_distance_km': Decimal('10'),
            'max_distance_km': Decimal('15'),
            'base_price': Decimal('10000'),
            'price_per_km': Decimal('0'),
            'zone_order': 3
        },
        {
            'zone_name': 'Gran Tucumán',
            'min_distance_km': Decimal('15'),
            'max_distance_km': Decimal('25'),
            'base_price': Decimal('15000'),
            'price_per_km': Decimal('0'),
            'zone_order': 4
        },
    ]
    
    for zone_data in programado_zones:
        zone, created = ShippingZone.objects.get_or_create(
            shipping_method='programado',
            zone_order=zone_data['zone_order'],
            defaults=zone_data
        )
        if created:
            print(f"  ✅ {zone}")
        else:
            print(f"  ℹ️  Ya existe: {zone}")
    
    # 4. Crear reglas de envío gratis
    print("\n🎁 Creando reglas de envío gratis...")
    
    rules = [
        {
            'shipping_method': 'programado',
            'rule_type': 'tiered',
            'free_shipping_threshold': Decimal('50000'),
            'minimum_charge': Decimal('5000')
        },
        {
            'shipping_method': 'express',
            'rule_type': 'tiered',
            'free_shipping_threshold': Decimal('80000'),
            'minimum_charge': Decimal('10000')
        },
    ]
    
    for rule_data in rules:
        rule, created = ShippingPricingRule.objects.get_or_create(
            shipping_method=rule_data['shipping_method'],
            rule_type=rule_data['rule_type'],
            defaults=rule_data
        )
        if created:
            print(f"  ✅ {rule}")
        else:
            print(f"  ℹ️  Ya existe: {rule}")
    
    # 5. Resumen
    print("\n" + "="*60)
    print("✅ CONFIGURACIÓN COMPLETADA")
    print("="*60)
    print(f"\n📍 Ubicación: {config.store_address}")
    print(f"   Coordenadas: ({config.store_lat}, {config.store_lng})")
    print(f"\n🚀 Express: {ShippingZone.objects.filter(shipping_method='express', is_active=True).count()} zonas")
    print(f"📅 Programado: {ShippingZone.objects.filter(shipping_method='programado', is_active=True).count()} zonas")
    print(f"🎁 Reglas de envío gratis: {ShippingPricingRule.objects.filter(is_active=True).count()}")
    
    print("\n📊 Zonas Express:")
    for zone in ShippingZone.objects.filter(shipping_method='express', is_active=True).order_by('zone_order'):
        print(f"   • {zone.zone_name}: {zone.min_distance_km}-{zone.max_distance_km} km → ${zone.base_price}")
    
    print("\n📊 Zonas Programado:")
    for zone in ShippingZone.objects.filter(shipping_method='programado', is_active=True).order_by('zone_order'):
        print(f"   • {zone.zone_name}: {zone.min_distance_km}-{zone.max_distance_km} km → ${zone.base_price}")
    
    print("\n🎁 Envío gratis:")
    for rule in ShippingPricingRule.objects.filter(is_active=True):
        if rule.free_shipping_threshold:
            print(f"   • {rule.get_shipping_method_display()}: Compras > ${rule.free_shipping_threshold}")
    
    print("\n" + "="*60)
    print("🎉 ¡Sistema listo para usar!")
    print("="*60)
    print("\n📝 Próximos pasos:")
    print("   1. Ejecutar migraciones: python manage.py makemigrations && python manage.py migrate")
    print("   2. Probar endpoints:")
    print("      GET  /api/pedidos/shipping/config/")
    print("      GET  /api/pedidos/shipping/zones/express/")
    print("      POST /api/pedidos/shipping/calculate/")
    print("\n")

if __name__ == '__main__':
    setup_shipping_system()
