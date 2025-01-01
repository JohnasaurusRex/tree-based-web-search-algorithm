import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Graph, GraphRef } from './components/Graph'
import { GraphData, SearchResult, SearchAlgorithm } from './types/graph'
import { fetchGraphData, generateNodes, runSearch, resetGraph } from './services/services'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeProvider } from "./components/theme-provider"
import { ModeToggle } from "./components/mode-toggle"
import { Play, Pause } from "lucide-react"

export const App: React.FC = () => {
  const graphRef = useRef<GraphRef>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [speed, setSpeed] = useState(1000)
  const [algorithm, setAlgorithm] = useState<SearchAlgorithm>('dfs')
  const [startNode, setStartNode] = useState('')
  const [goalNode, setGoalNode] = useState('')
  const [nodeCount, setNodeCount] = useState(8)  // Changed default to 8 to match initial graph
  const [isPaused, setIsPaused] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  
  const handleAnimationComplete = useCallback(() => {
    setIsSearching(false);
  }, []);

  const handleReset = async () => {
    resetSearch();
    try {
      const data = await resetGraph();
      setGraphData(data);
      // Reset to initial values
      setStartNode(data.nodes[0].label);
      setGoalNode(data.nodes[data.nodes.length - 1].label);
      setNodeCount(data.nodes.length);
    } catch (error) {
      console.error('Failed to reset graph:', error);
    }
  };

  // Modified useEffect to set initial node values based on graph data
  useEffect(() => {
    const initializeGraph = async () => {
      try {
        // Try to get data from localStorage first
        const savedData = localStorage.getItem('graphData');
        let data;
        
        if (savedData) {
          data = JSON.parse(savedData);
        } else {
          // If no saved data, fetch initial data
          data = await fetchGraphData();
          // Save to localStorage
          localStorage.setItem('graphData', JSON.stringify(data));
        }
        
        setGraphData(data);
        
        // Set initial start and goal nodes
        if (data?.nodes?.length >= 2) {
          setStartNode(data.nodes[0].label);
          setGoalNode(data.nodes[data.nodes.length - 1].label);
          setNodeCount(data.nodes.length);
        }
      } catch (error) {
        console.error('Failed to initialize graph:', error);
      }
    };

    initializeGraph();
  }, [])

  const resetSearch = () => {
    setSearchResult(null);
    setIsPaused(false);
    setIsSearching(false);
    if (graphRef.current) {
      graphRef.current.resetVisualization?.();
    }
  };

  const handleSearch = async () => {
    resetSearch();
    setIsSearching(true);
    
    try {
      const result = await runSearch(algorithm, startNode, goalNode);
      setSearchResult(result);
    } catch (error) {
      console.error('Search failed:', error);
      setIsSearching(false);
    }
  };

  const handleGenerate = async () => {
    resetSearch();
    try {
      const newGraph = await generateNodes(nodeCount);
      setGraphData(newGraph);
      // Save to localStorage
      localStorage.setItem('graphData', JSON.stringify(newGraph));
      
      // Set default start and goal nodes for the new graph
      if (newGraph?.nodes?.length >= 2) {
        setStartNode(newGraph.nodes[0].label);
        setGoalNode(newGraph.nodes[newGraph.nodes.length - 1].label);
      } else {
        setStartNode('');
        setGoalNode('');
      }
    } catch (error) {
      console.error('Failed to generate new graph:', error);
    }
  };

  const handlePauseToggle = () => {
    if (graphRef.current) {
      graphRef.current.togglePause();
      setIsPaused(!isPaused);
    }
  };

  if (!graphData) return <div className="flex items-center justify-center h-screen">Loading...</div>

  return (
    <ThemeProvider defaultTheme="system" storageKey="graph-search-theme">
      <div className="container mx-auto p-4 min-h-screen bg-background text-foreground overflow-y-auto">
      <div className="flex justify-end mb-4">
          <ModeToggle />
        </div>
        <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-6rem)]">
          <Card className="flex-1 dark:bg-gray-800 overflow-y-auto">
            <CardHeader>
              <CardTitle>Graph Search Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              <Graph
                ref={graphRef}
                data={graphData}
                visitedLabels={searchResult?.visited_labels ?? []}
                paths={searchResult?.paths ?? []}
                speed={speed}
                algorithm={algorithm}
                startNode={startNode}
                goalNode={goalNode}
                iterationCounts={searchResult?.iteration_counts}
                onAnimationComplete={handleAnimationComplete} 
              />
            </CardContent>
          </Card>
          <Card className="lg:w-1/3 dark:bg-gray-800 overflow-y-auto">
            <CardHeader>
              <CardTitle>Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="algorithm">Algorithm</Label>
                <Select 
                  value={algorithm} 
                  onValueChange={(value: SearchAlgorithm) => {
                    setAlgorithm(value);
                    resetSearch();
                  }}
                >
                  <SelectTrigger id="algorithm">
                    <SelectValue placeholder="Select algorithm" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dfs">Depth-First Search</SelectItem>
                    <SelectItem value="bfs">Breadth-First Search</SelectItem>
                    <SelectItem value="hill_climb">Hill-Climb Search</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="speed">Speed</Label>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePauseToggle}
                    disabled={!isSearching} 
                  >
                    {isPaused ? (
                      <Play className="h-4 w-4" />
                    ) : (
                      <Pause className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Slider
                  id="speed"
                  min={100}
                  max={2000}
                  step={100}
                  value={[2100 - speed]}
                  onValueChange={(value) => setSpeed(2100 - value[0])}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startNode">Start Node</Label>
                <Input
                  id="startNode"
                  value={startNode}
                  onChange={(e) => setStartNode(e.target.value)}
                  placeholder="Enter start node"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goalNode">Goal Node</Label>
                <Input
                  id="goalNode"
                  value={goalNode}
                  onChange={(e) => setGoalNode(e.target.value)}
                  placeholder="Enter goal node"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nodeCount">Node Count</Label>
                <Input
                  id="nodeCount"
                  type="number"
                  value={nodeCount}
                  onChange={(e) => setNodeCount(parseInt(e.target.value))}
                  min={1}
                  max={100}
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Button 
                  onClick={handleGenerate}
                  disabled={isSearching}
                >
                  Generate New Graph
                </Button>
                <Button 
                  onClick={handleReset}
                  disabled={isSearching}
                >
                  Back to Initial Graph
                </Button>
                <Button 
                  onClick={handleSearch}
                  disabled={isSearching || !startNode || !goalNode}
                >
                  Run Search
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default App;