from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "mysql+pymysql://root:readlog@localhost:3306/readlog"
    REDIS_URL: str = "redis://localhost:6379/0"
    ALADIN_API_KEY: str = ""
    SECRET_KEY: str = "change-me"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
