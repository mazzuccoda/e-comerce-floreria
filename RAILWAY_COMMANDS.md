# 🚂 Comandos para Railway

## 📋 Crear slides del Hero

### Opción 1: Usando el comando de Django
```bash
python manage.py create_hero_slide
```

### Opción 2: Usando el script Python
```bash
python manage.py shell < create_slides.py
```

### Opción 3: Ejecutar migraciones
```bash
python manage.py migrate
```

## 🔧 Cómo ejecutar en Railway:

### Método A: Desde el Dashboard
1. Ve a https://railway.app
2. Selecciona tu proyecto
3. Click en el servicio **backend**
4. Ve a **"Settings"**
5. Busca **"Deploy"** → **"Custom Start Command"**
6. Cambia temporalmente a:
   ```bash
   python manage.py create_hero_slide && gunicorn floreria_cristina.wsgi:application
   ```
7. Guarda y espera el redeploy
8. Después de que cargue, vuelve a cambiar a:
   ```bash
   gunicorn floreria_cristina.wsgi:application
   ```

### Método B: Desde Railway CLI (si lo tienes instalado)
```bash
railway run python manage.py create_hero_slide
```

## 📝 Notas:
- Los slides se crean con las 3 imágenes por defecto de Cloudinary
- Puedes editarlos después desde el admin de Django
- Si quieres agregar videos, edita los slides existentes en lugar de crear nuevos
