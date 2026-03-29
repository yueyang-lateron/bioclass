import sqlite3
import threading
from contextlib import contextmanager
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "bioclass.db"

_local = threading.local()


def get_conn() -> sqlite3.Connection:
    if not hasattr(_local, "conn"):
        _local.conn = sqlite3.connect(DB_PATH, check_same_thread=False)
        _local.conn.row_factory = sqlite3.Row
    return _local.conn


@contextmanager
def get_cursor():
    conn = get_conn()
    try:
        yield conn.cursor()
        conn.commit()
    except Exception:
        conn.rollback()
        raise


def init_db():
    conn = get_conn()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS taxon (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            gbif_id INTEGER UNIQUE,
            name TEXT NOT NULL,
            scientific_name TEXT,
            rank TEXT,
            parent_id INTEGER REFERENCES taxon(id),
            path TEXT,
            depth INTEGER DEFAULT 0,
            description TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_parent ON taxon(parent_id);
        CREATE INDEX IF NOT EXISTS idx_name ON taxon(name);
        CREATE INDEX IF NOT EXISTS idx_rank ON taxon(rank);
        CREATE INDEX IF NOT EXISTS idx_sci_name ON taxon(scientific_name);

        CREATE TABLE IF NOT EXISTS sync_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            finished_at TIMESTAMP,
            record_count INTEGER DEFAULT 0,
            status TEXT DEFAULT 'running'
        );
    """)
    conn.commit()


def insert_taxon(gbif_id: int, name: str, scientific_name: str | None, rank: str | None,
                 parent_id: int | None, path: str | None, depth: int, description: str | None = None):
    with get_cursor() as c:
        c.execute("""
            INSERT OR REPLACE INTO taxon 
            (gbif_id, name, scientific_name, rank, parent_id, path, depth, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (gbif_id, name, scientific_name, rank, parent_id, path, depth, description))


def get_taxon_children(taxon_id: int | None):
    """Get root if taxon_id is None, otherwise get children of that taxon"""
    with get_cursor() as c:
        if taxon_id is None:
            c.execute("""
                SELECT id, gbif_id, name, scientific_name, rank, parent_id, depth, description,
                       (SELECT COUNT(*) FROM taxon t2 WHERE t2.parent_id = t.id) as children_count
                FROM taxon t
                WHERE parent_id IS NULL AND rank IN ('KINGDOM', 'PHYLUM', 'CLASS')
                ORDER BY rank, name
            """)
        else:
            c.execute("""
                SELECT id, gbif_id, name, scientific_name, rank, parent_id, depth, description,
                       (SELECT COUNT(*) FROM taxon t2 WHERE t2.parent_id = t.id) as children_count
                FROM taxon t
                WHERE parent_id = ?
                ORDER BY rank, name
            """, (taxon_id,))
        return [dict(row) for row in c.fetchall()]


def get_taxon_by_id(taxon_id: int):
    with get_cursor() as c:
        c.execute("""
            SELECT id, gbif_id, name, scientific_name, rank, parent_id, path, depth, description
            FROM taxon WHERE id = ?
        """, (taxon_id,))
        row = c.fetchone()
        return dict(row) if row else None


def search_taxa(query: str, limit: int = 20):
    with get_cursor() as c:
        pattern = f"{query}%"
        c.execute("""
            SELECT id, name, scientific_name, rank, path, parent_id
            FROM taxon
            WHERE name LIKE ? OR scientific_name LIKE ?
            ORDER BY 
                CASE WHEN name LIKE ? THEN 0 ELSE 1 END,
                length(name)
            LIMIT ?
        """, (pattern, pattern, pattern, limit))
        return [dict(row) for row in c.fetchall()]


def get_taxon_path(taxon_id: int):
    """Get full path from root to this taxon"""
    path_taxa = []
    current_id = taxon_id
    while current_id:
        taxon = get_taxon_by_id(current_id)
        if not taxon:
            break
        path_taxa.insert(0, taxon)
        current_id = taxon.get("parent_id")
    return path_taxa


def get_taxon_count():
    with get_cursor() as c:
        c.execute("SELECT COUNT(*) as count FROM taxon")
        return c.fetchone()["count"]


def get_sync_status():
    with get_cursor() as c:
        c.execute("""
            SELECT status, finished_at, record_count 
            FROM sync_log 
            ORDER BY id DESC LIMIT 1
        """)
        row = c.fetchone()
        if row:
            return dict(row)
        return {"status": "never", "record_count": 0}


def log_sync_start():
    with get_cursor() as c:
        c.execute("""
            INSERT INTO sync_log (status) VALUES ('running')
        """)
        return c.lastrowid


def log_sync_finish(log_id: int, record_count: int, status: str = "success"):
    with get_cursor() as c:
        c.execute("""
            UPDATE sync_log 
            SET finished_at = CURRENT_TIMESTAMP, 
                record_count = ?, 
                status = ?
            WHERE id = ?
        """, (record_count, status, log_id))
