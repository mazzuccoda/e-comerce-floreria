from .cart import Cart

def total_carrito(request):
    try:
        cart = Cart(request)
        total = cart.get_total_price()
        return {'total_carrito': float(total)}
    except Exception:
        # En caso de error, retornar 0
        return {'total_carrito': 0.0}
