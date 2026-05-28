# Use slim Python official image
FROM python:3.13-slim

# Set environment system configurations
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies (needed for compiling certain python packages if any)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libc6-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements or setup pip installs
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir \
    django==6.0.5 \
    djangorestframework==3.17.1 \
    djangorestframework-simplejwt==5.5.1 \
    django-cors-headers==4.9.0 \
    daphne==4.2.1 \
    channels==4.3.2 \
    Pillow==12.2.0 \
    psycopg2-binary==2.9.10

# Copy application files
COPY . /app/

# Expose Daphne default port
EXPOSE 8000

# Run database migrations, seed local shops, and start Daphne ASGI server
CMD ["sh", "-c", "python manage.py migrate && python manage.py seed_data && daphne -b 0.0.0.0 -p 8000 geomart.asgi:application"]
