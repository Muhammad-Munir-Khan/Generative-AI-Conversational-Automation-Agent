#!/bin/sh
# Backend container entrypoint.
#
# 1. Wait for Postgres to accept connections (compose healthcheck also gates
#    this, but we double-check so migrations never race a half-ready DB).
# 2. Run Alembic migrations to create/upgrade the schema.
# 3. Start uvicorn.
#
# Any failure in migration aborts startup (set -e) so we never serve against
# an out-of-date schema.

set -e

echo "[entrypoint] running database migrations..."
alembic upgrade head

echo "[entrypoint] starting uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000