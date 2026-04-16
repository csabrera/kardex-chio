#!/usr/bin/env python3
import os
from urllib.parse import urlparse
import psycopg2

# Leer DATABASE_URL de ambiente
DATABASE_URL = os.environ.get("DATABASE_URL")

if not DATABASE_URL:
    print("ERROR: DATABASE_URL not found in environment")
    exit(1)

# Parsear DATABASE_URL
parsed = urlparse(DATABASE_URL)
DB_CONFIG = {
    "host": parsed.hostname,
    "port": parsed.port or 5432,
    "user": parsed.username,
    "password": parsed.password,
    "dbname": parsed.path.lstrip('/'),
}

print(f"Connecting to {DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['dbname']}")

try:
    conn = psycopg2.connect(**DB_CONFIG)
    conn.set_client_encoding("UTF8")
    print("[OK] Connected to Railway PostgreSQL")
except Exception as e:
    print(f"[ERROR] {e}")
    exit(1)

try:
    cur = conn.cursor()

    # Leer SQL del archivo
    with open("export_datos.sql", "r", encoding="utf-8") as f:
        sql_content = f.read()

    print(f"Loaded {len(sql_content)} bytes from export_datos.sql")

    # Ejecutar SQL
    print("\nExecuting SQL...")
    cur.execute(sql_content)
    conn.commit()

    print("[OK] Data imported to Railway PostgreSQL")

    # Verificar
    cur.execute("SELECT COUNT(*) FROM recursos")
    recursos = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM equipos")
    equipos = cur.fetchone()[0]

    print(f"\nVerification:")
    print(f"  Recursos: {recursos}")
    print(f"  Equipos: {equipos}")

except Exception as e:
    conn.rollback()
    print(f"[ERROR] {e}")
    import traceback
    traceback.print_exc()
    exit(1)
finally:
    conn.close()
