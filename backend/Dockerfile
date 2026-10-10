FROM python:3.12-slim

# System deps needed by web3/eth libs and psycopg binary
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libssl-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /srv

COPY requirements.txt .

# Install deps — psycopg[binary] replaces asyncpg for the async postgres driver
RUN pip install --no-cache-dir \
    "psycopg[binary,pool]>=3.1.0" \
    -r requirements.txt

COPY . .

# Non-root user for security
RUN useradd -m appuser && chown -R appuser /srv
USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "1", \
     "--timeout-keep-alive", "30", \
     "--log-level", "info"]