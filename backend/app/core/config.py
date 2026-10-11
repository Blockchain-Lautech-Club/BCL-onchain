from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

# Valid mint strategies
MINT_STRATEGY_WHITELIST   = "whitelist"    # relayer whitelists; user claims
MINT_STRATEGY_ADMIN_MINT  = "admin_mint"   # relayer mints directly (pays gas)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "development"
    database_url: str = "postgresql+asyncpg://bcl:bcl@localhost:5432/bcl"

    # Sessions
    jwt_secret: str          = "dev-only-change-me"
    jwt_ttl_seconds: int     = 60 * 60 * 24
    cookie_name: str         = "bcl_session"
    cookie_secure: bool      = True
    cors_origins: str        = "http://localhost:3000"
    auth_domain: str         = "localhost:3000"
    auth_uri: str            = "http://localhost:3000"
    nonce_ttl_seconds: int   = 300
    bootstrap_admin_wallets: str = ""

    # Chain
    chain_id: int            = 44787          # Celo Alfajores testnet; override for mainnet
    rpc_url: str             = "https://alfajores-forno.celo-testnet.org"
    explorer_url: str        = "https://alfajores.celoscan.io"
    rewards_contract_address: str  = "0x0000000000000000000000000000000000000000"
    registry_contract_address: str = "0x0000000000000000000000000000000000000000"
    bcl_token_address: str         = "0x0000000000000000000000000000000000000000"
    name_nft_address: str          = "0x0000000000000000000000000000000000000000"
    required_confirmations: int    = 3
    indexer_start_block: int       = 0
    indexer_batch_size: int        = 2000
    indexer_poll_seconds: int      = 6
    reconcile_every_seconds: int   = 600

    # Mint worker
    relayer_private_key: str = ""
    # "whitelist" = relayer whitelists on-chain, user calls claim(); gas-free for platform
    # "admin_mint" = relayer mints directly; platform pays gas, user gets token instantly
    mint_strategy: str       = MINT_STRATEGY_WHITELIST
    mint_poll_seconds: int   = 5
    mint_max_retries: int    = 5
    mint_pending_timeout_seconds: int = 900

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def bootstrap_admins(self) -> set[str]:
        return {w.strip().lower() for w in self.bootstrap_admin_wallets.split(",") if w.strip()}

    def explorer_tx_url(self, tx_hash: str | None) -> str | None:
        if not tx_hash or not self.explorer_url:
            return None
        return f"{self.explorer_url.rstrip('/')}/tx/{tx_hash}"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
