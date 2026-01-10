FROM python:3.13.7-bookworm

WORKDIR /app

RUN pip install --no-cache-dir poetry

COPY pyproject.toml poetry.lock ./

RUN poetry config virtualenvs.create false && \
    poetry install --no-interaction --no-ansi --no-root

COPY app/ ./app
COPY alembic.ini .
COPY scripts ./scripts

RUN chmod +x /app/scripts/prestart.sh

CMD ["python", "-m", "app.main"]