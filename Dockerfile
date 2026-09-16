FROM node:20-bookworm-slim AS frontend-builder

WORKDIR /app/frontend_v5

COPY frontend_v5/package.json frontend_v5/package-lock.json ./
RUN npm ci

COPY frontend_v5/ ./
RUN npm run build


FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=scorpion.settings \
    DJANGO_INTERNAL_URL=http://127.0.0.1:8000 \
    PORT=8080 \
    NODE_ENV=production

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       build-essential \
       libpq-dev \
       nodejs \
       npm \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app/

COPY --from=frontend-builder /app/frontend_v5/.next /app/frontend_v5/.next
COPY --from=frontend-builder /app/frontend_v5/node_modules /app/frontend_v5/node_modules

EXPOSE 8080

CMD ["sh", "-c", "python manage.py migrate && python manage.py create_render_superuser && python manage.py collectstatic --noinput && gunicorn scorpion.wsgi:application --bind 127.0.0.1:8000 --workers 1 --threads 2 --timeout 120 --max-requests 300 --max-requests-jitter 30 & echo 'Waiting for Django...'; until python -c \"import socket; s=socket.socket(); s.settimeout(1); s.connect(('127.0.0.1',8000)); s.close()\" 2>/dev/null; do sleep 1; done; echo 'Django ready - starting Next.js'; cd /app/frontend_v5 && exec npm start -- --hostname 0.0.0.0 --port ${PORT}"]