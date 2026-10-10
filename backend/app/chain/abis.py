"""Hand-written ABIs — keep in sync with contracts/src/*.sol."""


def _fn(name, inputs, outputs=(), mutability="view"):
    return {"type": "function", "name": name, "stateMutability": mutability,
            "inputs":  [{"name": n, "type": t} for n, t in inputs],
            "outputs": [{"name": n, "type": t} for n, t in outputs]}


def _ev(name, params):
    return {"type": "event", "name": name, "anonymous": False,
            "inputs": [{"name": n, "type": t, "indexed": i} for n, t, i in params]}


# ─────────────────────────────────────────────────────────────────────────────
# BCLRewards — ERC-1155 soulbound milestone tokens
# ─────────────────────────────────────────────────────────────────────────────

REWARDS_ABI = [
    # milestone registry
    _fn("registerMilestone",
        [("tokenId","uint256"),("milestoneType","uint256"),("name","string"),("metadataURI","string")],
        mutability="nonpayable"),
    _fn("registerMilestoneBatch",
        [("tokenIds","uint256[]"),("milestoneTypes","uint256[]"),("names","string[]"),("metadataURIs","string[]")],
        mutability="nonpayable"),
    _fn("updateMilestone",
        [("tokenId","uint256"),("name","string"),("metadataURI","string")],
        mutability="nonpayable"),
    _fn("getMilestone",
        [("tokenId","uint256")],
        [("milestoneType","uint256"),("name","string"),("metadataURI","string"),("exists","bool")]),

    # whitelist flow
    _fn("addToWhitelist",      [("wallet","address"),("tokenId","uint256")], mutability="nonpayable"),
    _fn("addToWhitelistBatch", [("wallets","address[]"),("tokenIds","uint256[]")], mutability="nonpayable"),
    _fn("revokeWhitelist",     [("wallet","address"),("tokenId","uint256")], mutability="nonpayable"),
    _fn("claim",               [("tokenId","uint256")], mutability="nonpayable"),

    # admin mint
    _fn("adminMint",      [("to","address"),("tokenId","uint256")], mutability="nonpayable"),
    _fn("adminMintBatch", [("to","address"),("tokenIds","uint256[]")], mutability="nonpayable"),

    # views
    _fn("hasClaimed",     [("wallet","address"),("tokenId","uint256")], [("","bool")]),
    _fn("isWhitelisted",  [("wallet","address"),("tokenId","uint256")], [("","bool")]),
    _fn("balanceOf",      [("account","address"),("id","uint256")],     [("","uint256")]),
    _fn("uri",            [("tokenId","uint256")],                      [("","string")]),

    # constants (useful for sanity checks)
    _fn("MT_LEVEL",          [], [("","uint256")]),
    _fn("MT_TASK",           [], [("","uint256")]),
    _fn("MT_STREAK",         [], [("","uint256")]),
    _fn("MT_COMMUNITY",      [], [("","uint256")]),
    _fn("LEVEL_OFFSET",      [], [("","uint256")]),
    _fn("TASK_OFFSET",       [], [("","uint256")]),
    _fn("STREAK_OFFSET",     [], [("","uint256")]),
    _fn("COMMUNITY_OFFSET",  [], [("","uint256")]),

    # events
    _ev("MilestoneRegistered", [("tokenId","uint256",True),("milestoneType","uint256",True),("name","string",False)]),
    _ev("Whitelisted",    [("wallet","address",True),("tokenId","uint256",True)]),
    _ev("WhitelistRevoked",[("wallet","address",True),("tokenId","uint256",True)]),
    _ev("Claimed",        [("wallet","address",True),("tokenId","uint256",True)]),
    _ev("AdminMinted",    [("to","address",True),    ("tokenId","uint256",True)]),
]

# ─────────────────────────────────────────────────────────────────────────────
# BCLRegistry — .bcl domain registry
# ─────────────────────────────────────────────────────────────────────────────

REGISTRY_ABI = [
    _fn("available",    [("label","string")], [("","bool")]),
    _fn("pricePerYear", [], [("","uint256")]),
    _fn("quote",        [("numYears","uint256")], [("","uint256")]),
    _fn("recordOf",     [("label","string")],
        [("owner","address"),("expiresAt","uint64"),("resolverData","string")]),
    _ev("NameRegistered",
        [("node","bytes32",True),("label","string",False),("owner","address",True),
         ("expiresAt","uint64",False),("cost","uint256",False)]),
    _ev("NameRenewed",
        [("node","bytes32",True),("label","string",False),("newExpiresAt","uint64",False),("cost","uint256",False)]),
    _ev("NameTransferred",
        [("node","bytes32",True),("label","string",False),("from","address",True),("to","address",True)]),
    _ev("ResolverUpdated",
        [("node","bytes32",True),("label","string",False),("data","string",False)]),
    _ev("NameReleased",
        [("node","bytes32",True),("label","string",False),("owner","address",True)]),
]

ERC20_ABI = [_fn("balanceOf", [("owner","address")], [("","uint256")])]

# ─────────────────────────────────────────────────────────────────────────────
# BCLToken — ERC-20 utility token
# ─────────────────────────────────────────────────────────────────────────────

BCL_TOKEN_ABI = [
    _fn("balanceOf",    [("owner","address")],           [("","uint256")]),
    _fn("totalSupply",  [],                               [("","uint256")]),
    _fn("maxSupply",    [],                               [("","uint256")]),
    _fn("allowance",    [("owner","address"),("spender","address")], [("","uint256")]),
    _fn("decimals",     [],                               [("","uint8")]),
    _fn("symbol",       [],                               [("","string")]),
    _fn("mint",         [("to","address"),("amount","uint256")], mutability="nonpayable"),
    _fn("transfer",     [("to","address"),("amount","uint256")], [("","bool")], mutability="nonpayable"),
    _fn("approve",      [("spender","address"),("amount","uint256")], [("","bool")], mutability="nonpayable"),
    _fn("transferFrom", [("from","address"),("to","address"),("amount","uint256")], [("","bool")], mutability="nonpayable"),
    _ev("Transfer",  [("from","address",True),("to","address",True),("value","uint256",False)]),
    _ev("Approval",  [("owner","address",True),("spender","address",True),("value","uint256",False)]),
]

# ─────────────────────────────────────────────────────────────────────────────
# BCLNameNFT — ERC-721 ENS-style name registry (paid in BCL tokens)
# ─────────────────────────────────────────────────────────────────────────────

NAME_NFT_ABI = [
    # views
    _fn("available",      [("label","string")],         [("","bool")]),
    _fn("ownerOfLabel",   [("label","string")],         [("","address")]),
    _fn("resolve",        [("label","string")],
        [("owner","address"),("data","string"),("expiresAt","uint64")]),
    _fn("recordOf",       [("label","string")],
        [("owner","address"),("expiresAt","uint64"),("resolverData","string")]),
    _fn("quote",          [("numYears","uint256")],     [("","uint256")]),
    _fn("pricePerYear",   [],                           [("","uint256")]),
    _fn("tokenIdOf",      [("label","string")],         [("","uint256")]),
    _fn("labelOf",        [("tokenId","uint256")],      [("","string")]),
    _fn("tokenURI",       [("tokenId","uint256")],      [("","string")]),
    _fn("ownerOf",        [("tokenId","uint256")],      [("","address")]),
    _fn("balanceOf",      [("owner","address")],        [("","uint256")]),
    _fn("isValidLabel",   [("label","string")],         [("","bool")]),
    _fn("reserved",       [("labelHash","bytes32")],    [("","bool")]),

    # user writes
    _fn("register",       [("label","string"),("numYears","uint256")],                              mutability="nonpayable"),
    _fn("registerWithPermit",
        [("label","string"),("numYears","uint256"),("deadline","uint256"),
         ("v","uint8"),("r","bytes32"),("s","bytes32")],                                            mutability="nonpayable"),
    _fn("renew",          [("label","string"),("numYears","uint256")],                              mutability="nonpayable"),
    _fn("setResolverData",[("label","string"),("data","string")],                                   mutability="nonpayable"),
    _fn("burnExpired",    [("label","string")],                                                     mutability="nonpayable"),
    _fn("transferFrom",   [("from","address"),("to","address"),("tokenId","uint256")],              mutability="nonpayable"),
    _fn("safeTransferFrom",
        [("from","address"),("to","address"),("tokenId","uint256")],                                mutability="nonpayable"),

    # admin / relayer writes
    _fn("adminRegister",   [("label","string"),("to","address"),("numYears","uint256")],            mutability="nonpayable"),
    _fn("relayerRegister", [("label","string"),("to","address"),("numYears","uint256")],            mutability="nonpayable"),
    _fn("setReserved",     [("labels","string[]"),("isReserved","bool")],                           mutability="nonpayable"),
    _fn("setPricePerYear", [("newPrice","uint256")],                                                mutability="nonpayable"),
    _fn("setTreasury",     [("newTreasury","address")],                                             mutability="nonpayable"),

    # events
    _ev("NameRegistered",
        [("tokenId","uint256",True),("labelHash","bytes32",True),("label","string",False),
         ("owner","address",True),("expiresAt","uint64",False),("cost","uint256",False)]),
    _ev("NameRenewed",
        [("tokenId","uint256",True),("label","string",False),
         ("newExpiresAt","uint64",False),("cost","uint256",False)]),
    _ev("Transfer",
        [("from","address",True),("to","address",True),("tokenId","uint256",True)]),
    _ev("ResolverUpdated",
        [("tokenId","uint256",True),("label","string",False),("data","string",False)]),
    _ev("NameExpiredBurned",
        [("tokenId","uint256",True),("label","string",False)]),
]
