import { TaxonDetail } from '../api';
import { Leaf, TreePine, ChevronRight, Info } from 'lucide-react';

interface Props {
  taxon: TaxonDetail | null;
}

function getRankLabel(rank?: string): string {
  const map: Record<string, string> = {
    KINGDOM: '界',
    PHYLUM: '门',
    CLASS: '纲',
    ORDER: '目',
    FAMILY: '科',
    GENUS: '属',
    SPECIES: '种',
  };
  return map[rank?.toUpperCase() ?? ''] ?? rank ?? '';
}

function getRankColor(rank?: string): string {
  const map: Record<string, string> = {
    KINGDOM: 'text-primary',
    PHYLUM: 'text-accent',
    CLASS: 'text-yellow-500',
    ORDER: 'text-blue-400',
    FAMILY: 'text-purple-400',
    GENUS: 'text-pink-400',
    SPECIES: 'text-green-400',
  };
  return map[rank?.toUpperCase() ?? ''] ?? 'text-text-secondary';
}

export default function DetailCard({ taxon }: Props) {
  if (!taxon) {
    return (
      <div className="h-full bg-surface rounded-xl border border-border flex flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Leaf className="w-8 h-8 text-primary" />
        </div>
        <h3 className="font-heading font-semibold text-lg text-text-primary mb-2">
          选择一个生物
        </h3>
        <p className="text-sm text-text-secondary max-w-xs">
          在左侧分类树中点击任意生物，或使用搜索框查找，即可查看其详细信息和完整分类路径。
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-secondary/30 to-transparent">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Leaf className="w-7 h-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-heading font-bold text-2xl text-text-primary truncate">
              {taxon.name}
            </h2>
            {taxon.scientific_name && (
              <p className="text-base text-text-secondary italic font-mono mt-1">
                {taxon.scientific_name}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className={`
                text-xs px-2 py-0.5 rounded-full font-medium
                ${getRankColor(taxon.rank).replace('text-', 'bg-')}/20
                ${getRankColor(taxon.rank)}
              `}>
                {getRankLabel(taxon.rank)}
              </span>
              {taxon.gbif_id && (
                <span className="text-xs text-text-secondary">
                  GBIF: {taxon.gbif_id}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Classification Path */}
        <div>
          <h3 className="font-heading font-semibold text-sm text-text-secondary mb-3 flex items-center gap-2">
            <TreePine className="w-4 h-4" />
            分类路径
          </h3>
          <div className="bg-bg rounded-xl p-4">
            <div className="flex flex-wrap items-center gap-1">
              {taxon.path.map((item, index) => (
                <span key={item.id} className="flex items-center">
                  {index > 0 && (
                    <ChevronRight className="w-3.5 h-3.5 text-text-secondary mx-1" />
                  )}
                  <span className={`
                    text-sm px-2 py-1 rounded-lg
                    ${index === taxon.path.length - 1 
                      ? 'bg-primary/20 text-primary font-medium' 
                      : 'text-text-primary hover:bg-[#21262D]'}
                  `}>
                    {item.name}
                  </span>
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 pt-3 border-t border-border text-xs text-text-secondary">
              {taxon.path.map((item) => (
                <span key={item.id} className={getRankColor(item.rank)}>
                  {item.name} <span className="opacity-60">({getRankLabel(item.rank)})</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Description */}
        {taxon.description && (
          <div>
            <h3 className="font-heading font-semibold text-sm text-text-secondary mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" />
              描述
            </h3>
            <div className="bg-bg rounded-xl p-4">
              <p className="text-sm text-text-primary leading-relaxed">
                {taxon.description}
              </p>
            </div>
          </div>
        )}

        {/* Quick Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-bg rounded-xl p-4">
            <div className="text-xs text-text-secondary mb-1">分类层级</div>
            <div className={`font-heading font-semibold ${getRankColor(taxon.rank)}`}>
              {getRankLabel(taxon.rank)}
            </div>
          </div>
          <div className="bg-bg rounded-xl p-4">
            <div className="text-xs text-text-secondary mb-1">深度</div>
            <div className="font-heading font-semibold text-text-primary">
              第 {taxon.depth} 级
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
