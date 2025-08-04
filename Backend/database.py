from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from typing import Generator

# Database configuration - using default PostgreSQL setup on macOS
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://chackoj@localhost:5432/f1_tracks_db"  # Default user is your system username
)

# Create SQLAlchemy engine
engine = create_engine(DATABASE_URL)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class
Base = declarative_base()

def get_db() -> Generator:
    """
    Dependency that creates a database session for each request
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    """
    Create all tables in the database
    """
    from schemas.track import Base
    Base.metadata.create_all(bind=engine) 