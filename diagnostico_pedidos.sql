-- Ver todos los usuarios
SELECT id, username, email FROM auth_user ORDER BY id;

-- Ver todos los pedidos con información del cliente
SELECT 
    p.id, 
    p.numero_pedido, 
    p.cliente_id, 
    u.username as cliente_username,
    p.email_comprador,
    p.nombre_comprador,
    p.anonimo,
    p.medio_pago,
    p.total,
    p.creado
FROM pedidos_pedido p 
LEFT JOIN auth_user u ON p.cliente_id = u.id 
ORDER BY p.id DESC;
