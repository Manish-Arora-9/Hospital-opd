from dotenv import load_dotenv
import os
import psycopg2

load_dotenv()  # Load environment variables

with open("schema_postgres.sql", "r") as f:
    schema_sql = f.read()

conn = psycopg2.connect(
    host=os.getenv("PGHOST"),
    port=os.getenv("PGPORT"),
    dbname=os.getenv("PGDATABASE"),
    user=os.getenv("PGUSER"),
    password=os.getenv("PGPASSWORD"),
    sslmode=os.getenv("PGSSLMODE", "require")
)
cur = conn.cursor()
cur.execute(schema_sql)
conn.commit()
print("All tables created successfully!")
cur.close()
conn.close()