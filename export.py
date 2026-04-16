import psycopg2

conn = psycopg2.connect(
    host="localhost",
    port=5433,
    user="kardexchio",
    password="kardexchio_2026",
    dbname="kardexchio"
)
cur = conn.cursor()

cur.execute("SELECT codigo, nombre, categoria_id, unidad_medida_id FROM recursos ORDER BY id")
recursos = cur.fetchall()

cur.execute("SELECT nombre, categoria_id, unidad_medida_id, estado FROM equipos ORDER BY id")
equipos = cur.fetchall()

conn.close()

sql = "-- KardexChio Data\n\n"
sql += "-- RECURSOS\n"
for codigo, nombre, cat_id, unit_id in recursos:
    sql += f"INSERT INTO recursos (codigo, nombre, categoria_id, unidad_medida_id, activo) VALUES ('{codigo}', '{nombre.replace(chr(39), chr(39)+chr(39))}', {cat_id}, {unit_id}, true);\n"

sql += "\n-- EQUIPOS\n"
for nombre, cat_id, unit_id, estado in equipos:
    sql += f"INSERT INTO equipos (nombre, categoria_id, unidad_medida_id, estado, activo) VALUES ('{nombre.replace(chr(39), chr(39)+chr(39))}', {cat_id}, {unit_id}, '{estado}', true);\n"

with open("export_datos.sql", "w", encoding="utf-8") as f:
    f.write(sql)

print("[OK] Exported to export_datos.sql")
print(f"Recursos: {len(recursos)}")
print(f"Equipos: {len(equipos)}")
