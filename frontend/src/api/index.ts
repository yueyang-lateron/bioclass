const API_BASE = '/api';

export interface TaxonNode {
  id: number;
  gbif_id?: number;
  name: string;
  scientific_name?: string;
  rank?: string;
  parent_id?: number;
  depth: number;
  description?: string;
  children_count: number;
  children: TaxonNode[];
}

export interface TaxonDetail {
  id: number;
  gbif_id?: number;
  name: string;
  scientific_name?: string;
  rank?: string;
  parent_id?: number;
  depth: number;
  description?: string;
  path: { id: number; name: string; rank?: string }[];
}

export interface SearchResult {
  id: number;
  name: string;
  scientific_name?: string;
  rank?: string;
  path?: string;
}

export interface SyncStatus {
  status: string;
  last_sync?: string;
  record_count: number;
}

export async function fetchTree(parentId: number | null): Promise<TaxonNode[]> {
  const url = parentId === null
    ? `${API_BASE}/tree`
    : `${API_BASE}/tree?parent_id=${parentId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch tree');
  return res.json();
}

export async function fetchTreeNode(taxonId: number): Promise<TaxonNode> {
  const res = await fetch(`${API_BASE}/tree/${taxonId}`);
  if (!res.ok) throw new Error('Failed to fetch tree node');
  return res.json();
}

export async function searchTaxa(query: string): Promise<SearchResult[]> {
  const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}

export async function getTaxonDetail(taxonId: number): Promise<TaxonDetail> {
  const res = await fetch(`${API_BASE}/taxon/${taxonId}`);
  if (!res.ok) throw new Error('Failed to fetch taxon detail');
  return res.json();
}

export async function getSyncStatus(): Promise<SyncStatus> {
  const res = await fetch(`${API_BASE}/sync/status`);
  if (!res.ok) throw new Error('Failed to fetch sync status');
  return res.json();
}

export async function triggerSync(): Promise<void> {
  await fetch(`${API_BASE}/sync`, { method: 'POST' });
}
