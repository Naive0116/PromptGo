from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import NullPool
from sqlalchemy import text

from ..config import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.database_url,
    echo=False,
    future=True,
    poolclass=NullPool,
    connect_args={
        "timeout": 30,
        "check_same_thread": False,
    },
)

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

Base = declarative_base()


async def get_db():
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    async with engine.begin() as conn:
        await conn.execute(text("PRAGMA journal_mode=WAL"))
        await conn.execute(text("PRAGMA synchronous=NORMAL"))
        await conn.execute(text("PRAGMA busy_timeout=30000"))
        await conn.run_sync(Base.metadata.create_all)
        # SQLite 自动迁移：检查并添加缺失的列
        await conn.run_sync(_migrate_add_missing_columns)


def _migrate_add_missing_columns(connection):
    """检查并添加缺失的数据库列（SQLite 迁移）"""
    from sqlalchemy import text, inspect
    
    inspector = inspect(connection)
    
    # 检查 conversations 表是否存在
    if 'conversations' in inspector.get_table_names():
        columns = [col['name'] for col in inspector.get_columns('conversations')]
        
        # 如果缺少 base_url 列，添加它
        if 'base_url' not in columns:
            connection.execute(text('ALTER TABLE conversations ADD COLUMN base_url TEXT'))
            print("Migration: Added 'base_url' column to conversations table")
