# Florería y Vivero Cristina - E-commerce

E-commerce platform for Florería y Vivero Cristina, built with Django and PostgreSQL.

## Features

- **Product Catalog**: Browse products by categories, search, and filters
- **Shopping Cart**: Add/remove items, update quantities
- **User Authentication**: Registration, login, password reset
- **Order Management**: Track order status, order history
- **Responsive Design**: Mobile-friendly interface
- **Secure Payments**: Integration with popular payment gateways
- **Admin Dashboard**: Manage products, orders, and customers
- **Multi-language Support**: Ready for internationalization

## Tech Stack

- **Backend**: Django 5.0+
- **Database**: PostgreSQL
- **Frontend**: HTML5, CSS3, JavaScript, Bootstrap 5
- **Deployment**: Docker, Nginx, Gunicorn
- **Payment**: MercadoPago, PayPal
- **Search**: Django Haystack with Whoosh
- **Caching**: Redis
- **Task Queue**: Celery

## Prerequisites

- Python 3.9+
- PostgreSQL 13+
- Node.js 14+ (for frontend assets)
- Docker (optional)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/floreria-cristina.git
   cd floreria-cristina
   ```

2. **Set up a virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   Create a `.env` file in the project root:
   ```
   DEBUG=True
   SECRET_KEY=your-secret-key
   DATABASE_URL=postgres://user:password@localhost:5432/floreria_cristina
   ALLOWED_HOSTS=localhost,127.0.0.1
   EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
   ```

5. **Run migrations**
   ```bash
   python manage.py migrate
   ```

6. **Create a superuser**
   ```bash
   python manage.py createsuperuser
   ```

7. **Run the development server**
   ```bash
   python manage.py runserver
   ```

## Development with Docker

1. **Build and start containers**
   ```bash
   docker-compose up --build
   ```

2. **Run migrations**
   ```bash
   docker-compose exec web python manage.py migrate
   ```

3. **Create superuser**
   ```bash
   docker-compose exec web python manage.py createsuperuser
   ```

4. **Access the application**
   - Frontend: http://localhost:8000
   - Admin: http://localhost:8000/admin/

## Project Structure

```
floreria_cristina/
├── core/                  # Core app (home, about, contact pages)
├── catalogo/              # Product catalog
├── carrito/               # Shopping cart functionality
├── pedidos/               # Order processing
├── usuarios/              # User authentication and profiles
├── static/                # Static files (CSS, JS, images)
│   ├── css/
│   ├── js/
│   └── img/
├── templates/             # Base templates
│   ├── base.html
│   ├── includes/
│   └── [app_name]/
├── media/                 # User-uploaded files
├── .env.example           # Example environment variables
├── docker-compose.yml     # Docker configuration
├── Dockerfile             # Dockerfile for the web application
├── manage.py              # Django management script
└── requirements.txt       # Python dependencies
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| DEBUG | Enable debug mode | False |
| SECRET_KEY | Django secret key | - |
| DATABASE_URL | Database connection URL | - |
| ALLOWED_HOSTS | Allowed hostnames | [] |
| EMAIL_BACKEND | Email backend | console |
| CELERY_BROKER_URL | Celery broker URL | - |
| CACHE_URL | Cache backend URL | - |
| MERCADOPAGO_ACCESS_TOKEN | MercadoPago access token | - |
| PAYPAL_CLIENT_ID | PayPal client ID | - |
| PAYPAL_SECRET | PayPal secret | - |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

- **Email**: info@floreriacristina.com
- **Website**: https://www.floreriacristina.com
