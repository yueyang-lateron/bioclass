import TreeNode from './TreeNode';
import { TaxonNode } from '../api';

interface Props {
  nodes: TaxonNode[];
  selectedId: number | null;
  highlightedId: number | null;
  expandedNodes: Set<number>;
  onToggle: (nodeId: number) => void;
  onSelect: (node: TaxonNode) => void;
  level: number;
}

export default function TaxonomyTree({ nodes, selectedId, highlightedId, expandedNodes, onToggle, onSelect, level }: Props) {
  if (nodes.length === 0 && level === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-text-secondary">
        <p className="text-sm">暂无分类数据</p>
        <p className="text-xs mt-1">请等待数据同步完成</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {nodes.map((node, index) => (
        <TreeNode
          key={node.id}
          node={node}
          selectedId={selectedId}
          highlightedId={highlightedId}
          expandedNodes={expandedNodes}
          onToggle={onToggle}
          onSelect={onSelect}
          level={level}
          animationDelay={index * 30}
        />
      ))}
    </div>
  );
}
