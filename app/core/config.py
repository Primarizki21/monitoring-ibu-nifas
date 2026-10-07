from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Sistem Monitoring Kesehatan Ibu Nifas Surabaya"
    app_env: str = "development"
    debug: bool = True
    port: int = 8000

    # Database
    database_url: str = "postgresql+psycopg://nifas_user:nifas_secret_password@localhost:5432/nifas_db"
    sqlite_fallback_url: str = "sqlite:///./nifas_dev.db"

    # Meta WhatsApp Cloud API
    meta_wa_api_url: str = "https://graph.facebook.com/v20.0"
    meta_wa_phone_number_id: str = "100000000000001"
    meta_wa_access_token: str = "dev_token_placeholder"
    meta_wa_verify_token: str = "surabaya_nifas_webhook_verify_secret"

    # Scheduler & Delivery Engine
    enable_scheduler: bool = True
    scheduler_hour_wib: int = 8
    scheduler_minute_wib: int = 0
    rate_limit_messages_per_second: int = 10

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
