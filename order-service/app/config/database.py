from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from app.config.logger import logger
import os

# Load environment variables from the .env file
load_dotenv()

# -- Build the connection URL ------------------------
# Format: mysql+pymysql://user:password@host/database
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "ecommerce_orders")

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"

# -- Create the Engine ----------------------------
# The engine is SQLAlchemy's equivalent of mysql2's connection pool
engine = create_engine(
    DATABASE_URL,
    pool_size=10,           # Maximum number of connections in the pool
    pool_pre_ping=True,     # Test connection before using them
    echo=False,             # Set to True to log all SQL queries (useful for debugging)
)

# -- Session Factory ------------------------------
# A session is how we interact with the database
# Like a single database connection in mysql2
SessionLocal = sessionmaker(autocommit=False, autoFlush=False, bind=engine)

# -- Base Class -----------------------------------
# All our database models will inherit from this
# It's what tells SQLAlchemy "this class represents a database table"
Base = declarative_base()

# -- Dependency -----------------------------------
# This function is used by FastAPI to provide a database session
# to  each request and automatically close it when done
def get_db():
    db = sessionLocal()
    try:
        yield db # Provide the session to the route handler
    finally:
        db.close() # Always close the session when the request is done

# -- Test Connection -------------------------------
def test_connection():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        logger.info("MySQL database connected successfully")
    except Exception as e:
        logger.error(f"Failed to connect to MySQL: {e}")
        raise e