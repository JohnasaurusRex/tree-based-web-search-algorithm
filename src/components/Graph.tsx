import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as d3 from 'd3';
import { GraphData } from '../types/graph';

interface GraphProps {
  data: GraphData;
  visitedLabels: string[];
  paths: [string, string][];
  speed?: number;
  algorithm?: string;
  startNode?: string;
  goalNode?: string;
  iterationCounts?: Record<string, number>;
  onAnimationComplete?: () => void;
}

export interface GraphRef {
  togglePause: () => void;
  resetVisualization: () => void;
  onComplete?: () => void;
}

export const Graph = React.forwardRef<GraphRef, GraphProps>(({
  data,
  paths,
  speed = 1000,
  algorithm = 'dfs',
  startNode,
  goalNode,
  iterationCounts,
  onAnimationComplete
}, ref) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const currentIndexRef = useRef<number>(0);
  const onCompleteRef = useRef(onAnimationComplete);

  useEffect(() => {
    onCompleteRef.current = onAnimationComplete;
  }, [onAnimationComplete]);

  const width = 900;
  const height = 700;

  const clearAnimation = useCallback(() => {
    if (animationRef.current) {
      clearInterval(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  const setInitialNodeColors = useCallback(() => {
    if (!gRef.current) return;
    const g = d3.select(gRef.current);
  
    // Reset all circles to white first
    g.selectAll('circle')
      .attr('fill', function(this: SVGCircleElement) {
        const label = d3.select(this).attr('data-label');
        // Preserve visited node colors for nodes that have been visited
        const nodeIndex = currentIndexRef.current;
        const hasBeenVisited = paths.slice(0, nodeIndex).some(([_, target]) => target === label);
        
        if (label === startNode) return 'red';
        if (label === goalNode) return 'green';
        if (hasBeenVisited) return 'red';
        return 'white';
      });
  }, [startNode, goalNode, paths]);

  const resetVisualization = useCallback(() => {
    if (!gRef.current) return;
    clearAnimation();
    currentIndexRef.current = 0;
    setCurrentStep(null);
    setIsComplete(false);
    setIsPaused(false);
    
    const g = d3.select(gRef.current);
  
    // Reset all circles
    g.selectAll('circle')
      .attr('fill', 'white')
      .filter(function (this: SVGCircleElement) {
        const label = d3.select(this).attr('data-label');
        return label === startNode || label === goalNode;
      })
      .attr('fill', function (this: SVGCircleElement) {
        const label = d3.select(this).attr('data-label');
        if (label === startNode) return 'red';
        if (label === goalNode) return 'green';
        return 'white';
      });

    // Reset all lines
    g.selectAll('line')
      .attr('stroke', 'black')
      .attr('stroke-width', 1);
  }, [startNode, goalNode, clearAnimation]);

  const initializeZoom = useCallback(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = svg.select('g');

    const zoom = d3.zoom()
      .extent([[0, 0], [width, height]])
      .scaleExtent([1, 8])
      .on('zoom', ({ transform }: { transform: d3.ZoomTransform }) => {
        g.attr('transform', transform);
      });

    svg.call(zoom as any);
  }, [width, height]);

  const drawGraph = useCallback(() => {
    if (!svgRef.current || !data?.nodes?.length || !gRef.current) return;

    const g = d3.select(gRef.current);
    g.selectAll('*').remove();

    // Draw links with distance labels
    data.links.forEach(({ source, target, distance }) => {
      const sourceNode = data.nodes[source];
      const targetNode = data.nodes[target];
      
      const centerX = (sourceNode.x + targetNode.x) / 2;
      const centerY = (sourceNode.y + targetNode.y) / 2;

      g.append('line')
        .attr('id', `line-${source}-${target}`)
        .attr('class', 'link')
        .attr('x1', sourceNode.x)
        .attr('y1', sourceNode.y)
        .attr('x2', targetNode.x)
        .attr('y2', targetNode.y)
        .attr('stroke', 'black')
        .attr('stroke-width', 1);

      g.append('text')
        .attr('x', centerX)
        .attr('y', centerY)
        .attr('dy', '.35em')
        .attr('text-anchor', 'middle')
        .attr('class', 'distance-label')
        .text(Math.round(distance));
    });

    // Draw nodes with labels
    data.nodes.forEach(({ x, y, label, index }) => {
      g.append('circle')
        .attr('id', `circle-${index}`)
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 20)
        .attr('fill', 'white')
        .attr('stroke', 'black')
        .attr('data-label', label)
        .attr('fill', label === startNode ? 'red' : label === goalNode ? 'green' : 'white');

      g.append('text')
        .attr('x', x)
        .attr('y', y)
        .attr('dy', '.35em')
        .attr('text-anchor', 'middle')
        .attr('class', 'node-label')
        .text(label);
    });
  }, [data, startNode, goalNode]);

  const startAnimation = useCallback(() => {
    if (!gRef.current || !paths.length) return;

    if (currentIndexRef.current === 0) {
        setInitialNodeColors();
      }

    const g = d3.select(gRef.current);
  
    const animate = () => {
      if (isPaused) return;
  
      const currentPath = paths[currentIndexRef.current];
      if (currentPath) {
        const [sourceLabel, targetLabel] = currentPath;
        const sourceNode = data.nodes.find(node => node.label === sourceLabel);
        const targetNode = data.nodes.find(node => node.label === targetLabel);

        if (sourceNode && targetNode) {
          if (algorithm !== 'bfs') {
            const repeatedPathIndex = paths.slice(0, currentIndexRef.current)
              .findIndex(path => path[0] === sourceLabel);

            if (repeatedPathIndex !== -1) {
              const [prevSource, prevTarget] = paths[repeatedPathIndex];
              const prevSourceNode = data.nodes.find(node => node.label === prevSource);
              const prevTargetNode = data.nodes.find(node => node.label === prevTarget);

              if (prevSourceNode && prevTargetNode) {
                g.select(`#line-${prevSourceNode.index}-${prevTargetNode.index}`)
                  .attr('stroke', 'black')
                  .attr('stroke-width', 1);
              }
            }
          }

          g.select(`#line-${sourceNode.index}-${targetNode.index}`)
            .attr('stroke', 'red')
            .attr('stroke-width', 10);

          g.select(`#circle-${targetNode.index}`)
            .attr('fill', 'red');

          setCurrentStep(`From Node: ${sourceLabel} to Node: ${targetLabel}`);
        }
      }

      if (currentIndexRef.current >= paths.length - 1) {
        setIsComplete(true);
        clearAnimation();
        if (onCompleteRef.current) {
          onCompleteRef.current();
        }
        return;
      }

      currentIndexRef.current++;
    };
  
    // Only start new animation if not currently running
    if (!animationRef.current) {
      animationRef.current = setInterval(animate, speed);
    }
  
    return () => clearAnimation();
  }, [paths, data.nodes, speed, algorithm, resetVisualization, setInitialNodeColors, isPaused, clearAnimation]);

  // Expose methods via ref
  React.useImperativeHandle(ref, () => ({
    togglePause: () => {
      setIsPaused(!isPaused);
      if (isPaused) {
        // If we're unpausing, restart the animation interval
        if (!animationRef.current) {
          startAnimation();
        }
      } else {
        // If we're pausing, just clear the interval
        if (animationRef.current) {
          clearInterval(animationRef.current);
          animationRef.current = null;
        }
      }
    },
    resetVisualization: () => {
        clearAnimation();
        currentIndexRef.current = 0;
        setCurrentStep(null);
        setIsComplete(false);
        setIsPaused(false);
        setInitialNodeColors();
        
        const g = d3.select(gRef.current);
        
        // Reset all lines and circles
        g.selectAll('line')
          .attr('stroke', 'black')
          .attr('stroke-width', 1);
  
        g.selectAll('circle')
          .attr('fill', 'white')
          .filter(function (this: SVGCircleElement) {
            const label = d3.select(this).attr('data-label');
            return label === startNode || label === goalNode;
          })
          .attr('fill', function (this: SVGCircleElement) {
            const label = d3.select(this).attr('data-label');
            if (label === startNode) return 'red';
            if (label === goalNode) return 'green';
            return 'white';
          });
      }
    }));

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    
    const g = svg.append('g');
    gRef.current = g.node();
    
    initializeZoom();
  }, [initializeZoom]);

  useEffect(() => {
    drawGraph();
  }, [drawGraph]);

  useEffect(() => {
    startAnimation();
    return () => clearAnimation();
  }, [startAnimation]);

  useEffect(() => {
    return () => clearAnimation();
  }, [clearAnimation]);

  return (
    <div className="space-y-4">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{
          border: '1px solid #ccc',
          borderRadius: '4px',
          background: '#fff'
        }}
      />
      {currentStep && (
        <div className="p-4 bg-gray-800 rounded text-white">
          <p className="font-mono">{currentStep}</p>
          {isComplete && <p className="font-mono text-green-400">Goal reached!</p>}
        </div>
      )}
      {isComplete && iterationCounts && (
        <table className="min-w-full border-collapse border">
          <thead>
            <tr>
              <th className="border p-2">Parameter</th>
              <th className="border p-2">Value</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(iterationCounts).map(([param, value]) => (
              <tr key={param}>
                <td className="border p-2">
                  {param.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </td>
                <td className="border p-2">
                  {param === 'path_cost' ? Math.round(value) : value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
});

export default Graph;