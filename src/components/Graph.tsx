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
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 700 });
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const currentIndexRef = useRef<number>(0);
  const onCompleteRef = useRef(onAnimationComplete);

  const calculateDimensions = useCallback(() => {
    if (!containerRef.current) return;
    
    const containerWidth = containerRef.current.clientWidth;
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
      const size = Math.min(500, containerWidth);
      setDimensions({ width: size, height: size });
    } else {
      const maxWidth = Math.min(900, containerWidth);
      const aspectRatio = 700 / 900;
      setDimensions({ 
        width: maxWidth,
        height: Math.round(maxWidth * aspectRatio)
      });
    }
  }, []);

  useEffect(() => {
    calculateDimensions();
    const handleResize = () => {
      calculateDimensions();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateDimensions]);

  useEffect(() => {
    onCompleteRef.current = onAnimationComplete;
  }, [onAnimationComplete]);

  const clearAnimation = useCallback(() => {
    if (animationRef.current) {
      clearInterval(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  const setInitialNodeColors = useCallback(() => {
    if (!gRef.current) return;
    const g = d3.select(gRef.current);
  
    g.selectAll('circle')
      .attr('fill', function(this: SVGCircleElement) {
        const label = d3.select(this).attr('data-label');
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

    g.selectAll('line')
      .attr('stroke', 'black')
      .attr('stroke-width', 1);
  }, [startNode, goalNode, clearAnimation]);

  const initializeZoom = useCallback(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = svg.select('g');

    const zoom = d3.zoom()
      .extent([[0, 0], [dimensions.width, dimensions.height]])
      .scaleExtent([1, 8])
      .on('zoom', ({ transform }: { transform: d3.ZoomTransform }) => {
        g.attr('transform', transform);
      });

    svg.call(zoom as any);
  }, [dimensions]);

  const drawGraph = useCallback(() => {
    if (!svgRef.current || !data?.nodes?.length || !gRef.current) return;

    const g = d3.select(gRef.current);
    g.selectAll('*').remove();

    // Scale node positions based on current dimensions
    const xScale = d3.scaleLinear()
      .domain([0, 900])
      .range([30, dimensions.width - 30]);
    
    const yScale = d3.scaleLinear()
      .domain([0, 700])
      .range([30, dimensions.height - 30]);

    // Draw links with scaled positions
    data.links.forEach(({ source, target, distance }) => {
      const sourceNode = data.nodes[source];
      const targetNode = data.nodes[target];
      
      const scaledSourceX = xScale(sourceNode.x);
      const scaledSourceY = yScale(sourceNode.y);
      const scaledTargetX = xScale(targetNode.x);
      const scaledTargetY = yScale(targetNode.y);
      
      const centerX = (scaledSourceX + scaledTargetX) / 2;
      const centerY = (scaledSourceY + scaledTargetY) / 2;

      g.append('line')
        .attr('id', `line-${source}-${target}`)
        .attr('class', 'link')
        .attr('x1', scaledSourceX)
        .attr('y1', scaledSourceY)
        .attr('x2', scaledTargetX)
        .attr('y2', scaledTargetY)
        .attr('stroke', 'black')
        .attr('stroke-width', 1);

      g.append('text')
        .attr('x', centerX)
        .attr('y', centerY)
        .attr('dy', '.35em')
        .attr('text-anchor', 'middle')
        .attr('class', 'distance-label')
        .style('font-size', `${dimensions.width <= 500 ? '10px' : '12px'}`)
        .text(Math.round(distance));
    });

    // Draw nodes with scaled positions
    data.nodes.forEach(({ x, y, label, index }) => {
      const scaledX = xScale(x);
      const scaledY = yScale(y);
      const nodeRadius = dimensions.width <= 500 ? 15 : 20;

      g.append('circle')
        .attr('id', `circle-${index}`)
        .attr('cx', scaledX)
        .attr('cy', scaledY)
        .attr('r', nodeRadius)
        .attr('fill', 'white')
        .attr('stroke', 'black')
        .attr('data-label', label)
        .attr('fill', label === startNode ? 'red' : label === goalNode ? 'green' : 'white');

      g.append('text')
        .attr('x', scaledX)
        .attr('y', scaledY)
        .attr('dy', '.35em')
        .attr('text-anchor', 'middle')
        .attr('class', 'node-label')
        .style('font-size', `${dimensions.width <= 500 ? '12px' : '14px'}`)
        .text(label);
    });
  }, [data, startNode, goalNode, dimensions]);

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
            .attr('stroke-width', dimensions.width <= 500 ? 5 : 10);

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

    if (!animationRef.current) {
      animationRef.current = setInterval(animate, speed);
    }
  
    return () => clearAnimation();
  }, [paths, data.nodes, speed, algorithm, dimensions, isPaused, clearAnimation, setInitialNodeColors]);

  React.useImperativeHandle(ref, () => ({
    togglePause: () => {
      setIsPaused(!isPaused);
      if (isPaused) {
        if (!animationRef.current) {
          startAnimation();
        }
      } else {
        clearAnimation();
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
  }, [drawGraph, dimensions]);

  useEffect(() => {
    startAnimation();
    return () => clearAnimation();
  }, [startAnimation]);

  useEffect(() => {
    return () => clearAnimation();
  }, [clearAnimation]);

  return (
    <div ref={containerRef} className="w-full space-y-4">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{
          border: '1px solid #ccc',
          borderRadius: '4px',
          background: '#fff'
        }}
      />
      {currentStep && (
        <div className="p-4 rounded text-white">
          <p className="font-mono text-sm md:text-base">{currentStep}</p>
          {isComplete && (
            <p className="font-mono text-sm md:text-base text-green-400">
              Goal reached!
            </p>
          )}
        </div>
      )}
    </div>
  );
});

export default Graph;