from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Local dev: sqlite. Production: postgresql://user:pass@host:5432/dbname
    database_url: str = "sqlite:///./attendance.db"
    secret_key: str = "change-me-in-production-use-long-random-string"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24
    admin_username: str = "admin"
    admin_password: str = "admin123"
    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"
    attendance_threshold_pct: float = 75.0
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"


settings = Settings()
