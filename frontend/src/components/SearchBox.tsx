import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { searchTaxa, SearchResult } from '../api';

interface Props {
  onResultSelect: (result: SearchResult) => void;
}

export default function SearchBox({ onResultSelect }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const data = await searchTaxa(q);
      setResults(data);
      setShowResults(true);
    } catch (e) {
      console.error('Search failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      handleSearch(value);
    }, 300);
  };

  const handleSelect = (result: SearchResult) => {
    setQuery('');
    setShowResults(false);
    setResults([]);
    onResultSelect(result);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className={`
        flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200
        ${showResults && results.length > 0 
          ? 'bg-surface border-primary shadow-[0_0_0_1px_#00D9A5,0_0_20px_rgba(0,217,165,0.15)]' 
          : 'bg-surface/50 border-border hover:border-text-secondary'}
      `}>
        {loading ? (
          <Loader2 className="w-4 h-4 text-text-secondary animate-spin flex-shrink-0" />
        ) : (
          <Search className="w-4 h-4 text-text-secondary flex-shrink-0" />
        )}
        
        <input
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder="搜索生物名称..."
          className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-secondary outline-none"
        />
        
        {query && (
          <button 
            onClick={handleClear}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-xl overflow-hidden shadow-xl z-50 animate-slide-in">
          {results.map((result) => (
            <button
              key={result.id}
              onClick={() => handleSelect(result)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#21262D] transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm text-text-primary truncate">{result.name}</div>
                {result.scientific_name && (
                  <div className="text-xs text-text-secondary italic truncate font-mono">
                    {result.scientific_name}
                  </div>
                )}
              </div>
              {result.rank && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary uppercase flex-shrink-0">
                  {result.rank.substring(0, 3)}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {showResults && query.length >= 2 && results.length === 0 && !loading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-xl p-4 shadow-xl z-50 animate-slide-in">
          <p className="text-sm text-text-secondary text-center">未找到相关生物</p>
        </div>
      )}
    </div>
  );
}
