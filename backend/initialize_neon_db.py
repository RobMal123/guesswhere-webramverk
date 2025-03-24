import os
import psycopg2
from dotenv import load_dotenv


def initialize_neon_database():
    """Initialize the Neon database with schema from init.sql"""
    load_dotenv()

    # Use Neon database credentials from .env
    PGHOST = os.getenv("PGHOST")
    PGDATABASE = os.getenv("PGDATABASE")
    PGUSER = os.getenv("PGUSER")
    PGPASSWORD = os.getenv("PGPASSWORD")

    # Path to SQL init file
    sql_file_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "database",
        "init.sql",
    )

    # Read SQL file
    with open(sql_file_path, "r") as file:
        sql_commands = file.read()

    # Connect to the database
    try:
        conn = psycopg2.connect(
            host=PGHOST,
            dbname=PGDATABASE,
            user=PGUSER,
            password=PGPASSWORD,
            sslmode="require",
        )
        conn.autocommit = True
        cursor = conn.cursor()

        # Execute SQL commands
        print("Initializing database schema...")
        cursor.execute(sql_commands)
        print("Database initialization completed successfully!")

        # Verify tables were created
        cursor.execute(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
        )
        tables = cursor.fetchall()
        print(f"Tables created: {', '.join([table[0] for table in tables])}")

        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"Error initializing database: {e}")
        return False


if __name__ == "__main__":
    initialize_neon_database()
