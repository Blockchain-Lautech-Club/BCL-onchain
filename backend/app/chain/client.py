from web3 import AsyncWeb3
from web3.contract import AsyncContract

from app.core.config import settings
from app.chain.abis import BCL_TOKEN_ABI, ERC721_ABI, NAME_NFT_ABI, REGISTRY_ABI

def get_w3() -> AsyncWeb3:
    return AsyncWeb3(AsyncWeb3.AsyncHTTPProvider(settings.rpc_url))


def checksum(address: str) -> str:
    return AsyncWeb3.to_checksum_address(address)


def to_hex(value: bytes) -> str:
    return AsyncWeb3.to_hex(value)


def rewards_contract(w3: AsyncWeb3) -> AsyncContract:
    return w3.eth.contract(
        address=checksum(settings.rewards_contract_address),
        abi=REWARDS_ABI,
    )

def erc721_contract(address: str) -> AsyncContract:
    w3 = get_w3()
    return w3.eth.contract(
        address=checksum(address),
        abi=ERC721_ABI,
    )
    
def registry_contract(w3: AsyncWeb3) -> AsyncContract:
    return w3.eth.contract(
        address=checksum(settings.registry_contract_address),
        abi=REGISTRY_ABI,
    )


def bcl_token_contract(w3: AsyncWeb3) -> AsyncContract:
    return w3.eth.contract(
        address=checksum(settings.bcl_token_address),
        abi=BCL_TOKEN_ABI,
    )


def name_nft_contract(w3: AsyncWeb3) -> AsyncContract:
    return w3.eth.contract(
        address=checksum(settings.name_nft_address),
        abi=NAME_NFT_ABI,
    )
