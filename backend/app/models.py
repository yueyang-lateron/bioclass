from pydantic import BaseModel
from typing import Optional


class TaxonNode(BaseModel):
    id: int
    gbif_id: Optional[int] = None
    name: str
    scientific_name: Optional[str] = None
    rank: Optional[str] = None
    parent_id: Optional[int] = None
    depth: int = 0
    description: Optional[str] = None
    children_count: int = 0
    children: list["TaxonNode"] = []


class TaxonDetail(BaseModel):
    id: int
    gbif_id: Optional[int] = None
    name: str
    scientific_name: Optional[str] = None
    rank: Optional[str] = None
    parent_id: Optional[int] = None
    depth: int = 0
    description: Optional[str] = None
    path: list["TaxonPathItem"] = []


class TaxonPathItem(BaseModel):
    id: int
    name: str
    rank: Optional[str] = None


class SearchResult(BaseModel):
    id: int
    name: str
    scientific_name: Optional[str] = None
    rank: Optional[str] = None
    path: Optional[str] = None


class SyncStatus(BaseModel):
    status: str
    last_sync: Optional[str] = None
    record_count: int


class SyncResponse(BaseModel):
    status: str
    message: str
    record_count: int = 0
