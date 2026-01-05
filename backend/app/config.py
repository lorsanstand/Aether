from typing import Literal, List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    COMPANY_NAME: str

    MODE: Literal["DEV", "TEST", "PROD"]
    LOG_LEVEL: Literal["ERROR", "WARNING", "INFO", "DEBUG"]

    HOST: str
    PORT: int
    WORKERS: int
    URL: str

    CORS_ORIGINS: List[str] = ["*"]
    CORS_HEADERS: List[str] = ["*"]
    CORS_METHODS: List[str] = ["*"]

    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    SMTP_SERVER: str
    SMTP_PORT: int
    SMTP_EMAIL: str
    SMTP_PASS: str
    
    DB_HOST: str
    DB_PORT: int
    DB_PASS: str
    DB_USER: str
    DB_NAME: str

    @property
    def DATABASE_URL(self):
        return f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASS}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6397
    REDIS_PASS: str = ""
    REDIS_DB: int = 0

    @property
    def REDIS_URL(self):
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

    RMQ_HOST: str
    RMQ_USER: str
    RMQ_PASS: str
    RMQ_PORT: int

    @property
    def RABBITMQ_URL(self) -> str:
        return f"amqp://{self.RMQ_USER}:{self.RMQ_PASS}@{self.RMQ_HOST}:{self.RMQ_PORT}//"

    model_config = SettingsConfigDict(env_file=".env", extra="allow")


settings: Settings = Settings()