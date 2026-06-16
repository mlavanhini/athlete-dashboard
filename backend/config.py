import os
from dataclasses import dataclass, field

@dataclass
class Settings:
    tm_api_url: str = "http://localhost:8000"
    cache_db: str = os.path.join(os.path.dirname(__file__), "cache.db")
    mapping_file: str = os.path.join(os.path.dirname(__file__), "..", "data", "entity_mapping.json")
    cache_ttl_default: int = 86400       # 24h for valuations/profiles
    cache_ttl_short: int = 3600          # 1h for fixtures
    rate_limit_delay: float = 1.0        # 1 req/sec per source
    cors_origins: list = field(default_factory=lambda: ["http://localhost:5173", "http://localhost:3000"])

settings = Settings()
