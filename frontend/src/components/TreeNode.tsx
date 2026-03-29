import { useState, useEffect } from 'react';
import { ChevronRight, Folder, FolderOpen, Leaf, Flower, CircleDot } from 'lucide-react';
import { TaxonNode, fetchTree } from '../api';

interface Props {
  node: TaxonNode;
  selectedId: number | null;
  highlightedId: number | null;
  expandedNodes: Set<number>;
  onToggle: (nodeId: number) => void;
  onSelect: (node: TaxonNode) => void;
  level: number;
  animationDelay?: number;
}

function getRankIcon(rank?: string) {
  switch (rank?.toUpperCase()) {
    case 'KINGDOM': return <CircleDot className="w-4 h-4 text-primary" />;
    case 'PHYLUM': return <Folder className="w-4 h-4 text-accent" />;
    case 'CLASS': return <FolderOpen className="w-4 h-4 text-yellow-500" />;
    case 'ORDER': return <Folder className="w-4 h-4 text-blue-400" />;
    case 'FAMILY': return <Folder className="w-4 h-4 text-purple-400" />;
    case 'GENUS': return <Flower className="w-4 h-4 text-pink-400" />;
    case 'SPECIES': return <Leaf className="w-4 h-4 text-green-400" />;
    default: return <Leaf className="w-4 h-4 text-text-secondary" />;
  }
}

export default function TreeNode({ node, selectedId, highlightedId, expandedNodes, onToggle, onSelect, level, animationDelay = 0 }: Props) {
  const [children, setChildren] = useState<TaxonNode[]>([]);
  const [loading, setLoading] = useState(false);
  const isExpanded = expandedNodes.has(node.id);
  const isSelected = selectedId === node.id;
  const isHighlighted = highlightedId === node.id;
  const hasChildren = node.children_count > 0;

  useEffect(() => {
    if (isExpanded && children.length === 0 && hasChildren) {
      loadChildren();
    }
  }, [isExpanded]);

  const loadChildren = async () => {
    setLoading(true);
    try {
      const data = await fetchTree(node.id);
      setChildren(data);
    } catch (e) {
      console.error('Failed to load children', e);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(node);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(node.id);
  };

  const indent = level * 16;

  return (
    <div
      className="animate-fade-in"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div
        onClick={handleClick}
        className={`
          group flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-all duration-150
          ${isSelected 
            ? 'bg-secondary border-l-[3px] border-primary' 
            : isHighlighted 
              ? 'bg-highlight/20 border-l-[3px] border-highlight highlight-pulse' 
              : 'hover:bg-[#21262D] border-l-[3px] border-transparent'}
        `}
        style={{ paddingLeft: `${indent + 8}px` }}
      >
        {/* Expand/Collapse Button */}
        <button
          onClick={handleToggle}
          className={`
            w-5 h-5 flex items-center justify-center rounded transition-transform duration-200
            ${hasChildren ? 'opacity-100 hover:bg-white/10' : 'opacity-0'}
            ${isExpanded ? 'rotate-90' : ''}
          `}
        >
          {loading ? (
            <div className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-text-secondary" />
          )}
        </button>

        {/* Icon */}
        <span className="flex-shrink-0">
          {getRankIcon(node.rank)}
        </span>

        {/* Name */}
        <span className={`
          text-sm truncate flex-1
          ${isSelected ? 'text-primary font-medium' : isHighlighted ? 'text-highlight font-medium' : 'text-text-primary'}
        `}>
          {node.name}
        </span>

        {/* Rank Badge */}
        {node.rank && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface text-text-secondary font-mono uppercase">
            {node.rank.substring(0, 3)}
          </span>
        )}

        {/* Children Count */}
        {hasChildren && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary">
            {node.children_count}
          </span>
        )}
      </div>

      {/* Children */}
      {isExpanded && (
        <div className="transition-all duration-200">
          {children.map((child, idx) => (
            <TreeNode
              key={child.id}
              node={child}
              selectedId={selectedId}
              highlightedId={highlightedId}
              expandedNodes={expandedNodes}
              onToggle={onToggle}
              onSelect={onSelect}
              level={level + 1}
              animationDelay={idx * 20}
            />
          ))}
        </div>
      )}
    </div>
  );
}
