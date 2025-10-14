from pedidos.models import Pedido
from django.contrib.auth.models import User

# Buscar usuario 'test'
u = User.objects.filter(username='test').first()
print(f'Usuario encontrado: {u}')
if u:
    print(f'  ID: {u.id}')
    print(f'  Email: {u.email}')

# Contar pedidos del usuario
if u:
    pedidos_usuario = Pedido.objects.filter(cliente=u).count()
    print(f'\nPedidos del usuario test: {pedidos_usuario}')

# Total de pedidos
total_pedidos = Pedido.objects.count()
print(f'Total de pedidos en la BD: {total_pedidos}')

# Mostrar últimos 3 pedidos
print('\nÚltimos 3 pedidos:')
for p in Pedido.objects.all().order_by('-id')[:3]:
    print(f'  Pedido #{p.numero_pedido} (ID: {p.id})')
    print(f'    Cliente: {p.cliente}')
    print(f'    Email: {p.email_comprador}')
    print(f'    Método pago: {p.metodo_pago}')
    print(f'    Total: ${p.total}')
    print()
