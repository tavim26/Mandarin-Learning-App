from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Session


DATABASE_URL: str = "postgresql+psycopg2://postgres:kuso@localhost:5432/text_analysis_database"


engine = create_engine(
    DATABASE_URL,
    echo=True,  # vezi SQL in consola (util pentru debug)
)


SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
