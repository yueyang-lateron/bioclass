from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import (
    init_db, get_taxon_children, get_taxon_by_id, get_taxon_path,
    search_taxa, get_taxon_count, get_sync_status, log_sync_start, log_sync_finish
)
from app.models import TaxonNode, TaxonDetail, SearchResult, SyncStatus, SyncResponse, TaxonPathItem
from app.scheduler import start_scheduler, trigger_manual_sync
import asyncio


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    # Check if DB is empty, if so trigger initial sync
    if get_taxon_count() == 0:
        asyncio.create_task(run_initial_sync())
    else:
        start_scheduler()
    yield
    # Shutdown handled by the scheduler itself


async def run_initial_sync():
    from app.gbif_fetcher import full_sync
    log_id = log_sync_start()
    try:
        await full_sync()
        count = get_taxon_count()
        log_sync_finish(log_id, count, "success")
        print(f"Initial sync completed: {count} records")
    except Exception as e:
        log_sync_finish(log_id, 0, f"error: {str(e)}")
        print(f"Initial sync failed: {e}")
    finally:
        start_scheduler()


app = FastAPI(title="BioClass API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def build_tree_node(taxon_dict: dict, children: list[dict] = None) -> TaxonNode:
    children = children or []
    return TaxonNode(
        id=taxon_dict["id"],
        gbif_id=taxon_dict.get("gbif_id"),
        name=taxon_dict["name"],
        scientific_name=taxon_dict.get("scientific_name"),
        rank=taxon_dict.get("rank"),
        parent_id=taxon_dict.get("parent_id"),
        depth=taxon_dict.get("depth", 0),
        description=taxon_dict.get("description"),
        children_count=taxon_dict.get("children_count", 0),
        children=[build_tree_node(c) for c in children]
    )


@app.get("/api/tree", response_model=list[TaxonNode])
async def get_tree(parent_id: int = None):
    """Get taxonomy tree nodes. parent_id=None returns root nodes (Kingdoms)"""
    children = get_taxon_children(parent_id)
    return [build_tree_node(c) for c in children]


@app.get("/api/tree/{taxon_id}", response_model=TaxonNode)
async def get_tree_node(taxon_id: int):
    """Get a specific node with its children"""
    taxon = get_taxon_by_id(taxon_id)
    if not taxon:
        raise HTTPException(status_code=404, detail="Taxon not found")

    children = get_taxon_children(taxon_id)
    taxon["children_count"] = len(children)
    return build_tree_node(taxon, children)


@app.get("/api/search", response_model=list[SearchResult])
async def search(q: str):
    """Search for taxa by name"""
    if not q or len(q) < 2:
        return []
    results = search_taxa(q)
    return [SearchResult(
        id=r["id"],
        name=r["name"],
        scientific_name=r.get("scientific_name"),
        rank=r.get("rank"),
        path=r.get("path")
    ) for r in results]


@app.get("/api/taxon/{taxon_id}", response_model=TaxonDetail)
async def get_taxon_detail(taxon_id: int):
    """Get detailed info about a taxon including its full path"""
    taxon = get_taxon_by_id(taxon_id)
    if not taxon:
        raise HTTPException(status_code=404, detail="Taxon not found")

    path_taxa = get_taxon_path(taxon_id)
    path_items = [TaxonPathItem(id=t["id"], name=t["name"], rank=t.get("rank")) for t in path_taxa]

    return TaxonDetail(
        id=taxon["id"],
        gbif_id=taxon.get("gbif_id"),
        name=taxon["name"],
        scientific_name=taxon.get("scientific_name"),
        rank=taxon.get("rank"),
        parent_id=taxon.get("parent_id"),
        depth=taxon.get("depth", 0),
        description=taxon.get("description"),
        path=path_items
    )


@app.post("/api/sync", response_model=SyncResponse)
async def trigger_sync():
    """Manually trigger a data sync"""
    try:
        trigger_manual_sync()
        return SyncResponse(
            status="started",
            message="Sync job has been queued and will run shortly"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/sync/status", response_model=SyncStatus)
async def sync_status():
    """Get the current sync status"""
    status = get_sync_status()
    last_sync = status.get("finished_at") if status.get("finished_at") else None
    return SyncStatus(
        status=status.get("status", "unknown"),
        last_sync=last_sync,
        record_count=status.get("record_count", 0)
    )


@app.get("/api/stats")
async def stats():
    """Get database statistics"""
    return {
        "total_taxa": get_taxon_count(),
        "sync_status": get_sync_status()
    }


@app.get("/api/health")
async def health():
    return {"status": "ok"}
