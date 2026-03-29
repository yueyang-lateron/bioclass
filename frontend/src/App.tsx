import { useState, useEffect, useCallback } from 'react';
import TaxonomyTree from './components/TaxonomyTree';
import SearchBox from './components/SearchBox';
import DetailCard from './components/DetailCard';
import { TaxonNode, TaxonDetail, SearchResult, getSyncStatus } from './api';
import { Leaf, RefreshCw, Database } from 'lucide-react';

function App() {
  const [roots, setRoots] = useState<TaxonNode[]>([]);
  const [selectedTaxon, setSelectedTaxon] = useState<TaxonDetail | null>(null);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<{ record_count: number; last_sync?: string }>({ record_count: 0 });
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadInitialData();
    loadSyncStatus();
  }, []);

  const loadSyncStatus = async () => {
    try {
      const status = await getSyncStatus();
      setSyncStatus(status);
    } catch (e) {
      console.error('Failed to load sync status', e);
    }
  };

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tree');
      const data = await res.json();
      setRoots(data);
    } catch (e) {
      console.error('Failed to load tree', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = useCallback(async (taxon: TaxonNode | SearchResult) => {
    try {
      const res = await fetch(`/api/taxon/${taxon.id}`);
      const detail = await res.json();
      setSelectedTaxon(detail);
    } catch (e) {
      console.error('Failed to load detail', e);
    }
  }, []);

  const handleSearchResult = useCallback((result: SearchResult) => {
    setHighlightedId(result.id);
    handleSelect(result);
    
    // Expand path to this node
    if (result.path) {
      const pathIds = result.path.split('/').map(Number).filter(Boolean);
      setExpandedNodes(prev => new Set([...prev, ...pathIds]));
    }
    
    // Clear highlight after 3s
    setTimeout(() => setHighlightedId(null), 3000);
  }, [handleSelect]);

  const toggleNode = useCallback((nodeId: number) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur border-b border-border">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Leaf className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-xl text-text-primary">BioClass</h1>
              <p className="text-xs text-text-secondary">生物分类浏览器</p>
            </div>
          </div>
          
          <div className="flex-1 max-w-xl">
            <SearchBox onResultSelect={handleSearchResult} />
          </div>
          
          <div className="flex items-center gap-3 text-sm text-text-secondary">
            <div className="flex items-center gap-1.5">
              <Database className="w-4 h-4" />
              <span>{syncStatus.record_count.toLocaleString()} 条记录</span>
            </div>
            {syncStatus.last_sync && (
              <div className="flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4" />
                <span>{new Date(syncStatus.last_sync).toLocaleDateString('zh-CN')}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto p-4 flex gap-4" style={{ minHeight: 'calc(100vh - 72px)' }}>
        {/* Tree Panel */}
        <div className="w-2/5 bg-surface rounded-xl border border-border overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-border bg-bg/50">
            <h2 className="font-heading font-semibold text-text-primary">生物分类树</h2>
            <p className="text-xs text-text-secondary mt-0.5">点击节点展开 · 点击生物查看详情</p>
          </div>
          <div className="flex-1 overflow-auto p-2">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <TaxonomyTree
                nodes={roots}
                selectedId={selectedTaxon?.id ?? null}
                highlightedId={highlightedId}
                expandedNodes={expandedNodes}
                onToggle={toggleNode}
                onSelect={handleSelect}
                level={0}
              />
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="w-3/5">
          <DetailCard taxon={selectedTaxon} />
        </div>
      </main>
    </div>
  );
}

export default App;
