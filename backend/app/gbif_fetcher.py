import httpx
import asyncio
from app.database import insert_taxon, get_taxon_by_id, init_db

GBIF_API = "https://api.gbif.org/v1"

# GBIF backbone taxonomy keys
ANIMALIA_KEY = 1
PLANTAE_KEY = 6
FUNGI_KEY = 5

MAX_DEPTH = 6  # KINGDOM=1, PHYLUM=2, CLASS=3, ORDER=4, FAMILY=5, GENUS=6


async def fetch_json(url: str) -> dict | None:
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            resp = await client.get(url)
            if resp.status_code == 200:
                return resp.json()
        except Exception:
            pass
    return None


async def fetch_taxon(gbif_id: int) -> dict | None:
    url = f"{GBIF_API}/species/{gbif_id}"
    data = await fetch_json(url)
    return data.get("results", [None])[0] if data else None


async def fetch_child_taxa(gbif_id: int, rank_filter: str | None = None) -> list[dict]:
    url = f"{GBIF_API}/species/{gbif_id}/children"
    params = {"limit": 100}
    if rank_filter:
        params["rank"] = rank_filter
    data = await fetch_json(url)
    if data and "results" in data:
        return data["results"]
    return []


def rank_to_depth(rank: str) -> int:
    rank_map = {
        "KINGDOM": 1, "PHYLUM": 2, "CLASS": 3, "ORDER": 4,
        "FAMILY": 5, "GENUS": 6, "SPECIES": 7, "SUBSPECIES": 8
    }
    return rank_map.get(rank.upper(), 0)


def is_valid_rank(rank: str | None) -> bool:
    if not rank:
        return False
    return rank.upper() in ("KINGDOM", "PHYLUM", "CLASS", "ORDER", "FAMILY", "GENUS", "SPECIES")


def build_path(parent_path: str | None, parent_id: int) -> str:
    if parent_path:
        return f"{parent_path}/{parent_id}"
    return str(parent_id)


async def sync_taxon(gbif_id: int, parent_id: int | None, parent_path: str | None, depth: int):
    """Recursively sync a taxon and its children from GBIF"""
    if depth > MAX_DEPTH:
        return

    taxon_data = await fetch_taxon(gbif_id)
    if not taxon_data:
        return

    name = taxon_data.get("vernacularName") or taxon_data.get("canonicalName", f"GBIF:{gbif_id}")
    scientific_name = taxon_data.get("scientificName")
    rank = taxon_data.get("rank")
    taxon_key = taxon_data.get("key")

    if not is_valid_rank(rank) and depth > 1:
        return

    # Insert into DB
    path = build_path(parent_path, gbif_id)
    insert_taxon(
        gbif_id=taxon_key,
        name=name,
        scientific_name=scientific_name,
        rank=rank,
        parent_id=parent_id,
        path=path,
        depth=depth,
        description=taxon_data.get("description")
    )

    if depth >= MAX_DEPTH:
        return

    # Fetch and sync children
    children = await fetch_child_taxa(gbif_id)
    tasks = []
    for child in children:
        child_key = child.get("key")
        child_rank = child.get("rank")
        if child_key and is_valid_rank(child_rank):
            tasks.append(sync_taxon(child_key, taxon_key, path, depth + 1))

    if tasks:
        await asyncio.gather(*tasks, return_exceptions=True)


async def full_sync():
    """Perform full sync from GBIF backbone taxonomy"""
    init_db()

    roots = [
        (ANIMALIA_KEY, "Animalia", None),
        (PLANTAE_KEY, "Plantae", None),
        (FUNGI_KEY, "Fungi", None),
    ]

    for gbif_id, name, _ in roots:
        try:
            await sync_taxon(gbif_id, None, None, 1)
        except Exception as e:
            print(f"Error syncing {name}: {e}")


if __name__ == "__main__":
    asyncio.run(full_sync())
