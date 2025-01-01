import React, { useState } from 'react';
import { SearchAlgorithm } from '../types/graph';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface ControlsProps {
  onSearch: (algorithm: SearchAlgorithm, startNode: string, goalNode: string) => void;
  onGenerate: (nodeCount: number) => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  isSearching: boolean;
}

export const Controls: React.FC<ControlsProps> = ({
  onSearch,
  onGenerate,
  speed,
  onSpeedChange,
  isSearching
}) => {
  const [startNode, setStartNode] = useState('');
  const [goalNode, setGoalNode] = useState('');
  const [algorithm, setAlgorithm] = useState<SearchAlgorithm>('dfs');
  const [nodeCount, setNodeCount] = useState<number>(8);

  const handleSearch = () => {
    if (!startNode || !goalNode) {
      alert('Please enter both start and goal nodes');
      return;
    }
    onSearch(algorithm, startNode.toUpperCase(), goalNode.toUpperCase());
  };

  const handleGenerate = () => {
    if (nodeCount < 2 || nodeCount > 26) {
      alert('Please enter a number between 2 and 26');
      return;
    }
    onGenerate(nodeCount);
    // Reset nodes after generating new graph
    setStartNode('');
    setGoalNode('');
  };

  return (
    <Card className="w-full">
      <CardContent className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label htmlFor="algorithm">Algorithm</Label>
          <Select 
            value={algorithm} 
            onValueChange={(value: SearchAlgorithm) => setAlgorithm(value)}
          >
            <SelectTrigger id="algorithm">
              <SelectValue placeholder="Select algorithm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dfs">Depth-First Search</SelectItem>
              <SelectItem value="bfs">Breadth-First Search</SelectItem>
              <SelectItem value="hill-climb">Hill Climbing</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="speed">Animation Speed</Label>
          <Slider
            id="speed"
            min={100}
            max={2000}
            step={100}
            value={[2100 - speed]}
            onValueChange={(value) => onSpeedChange(2100 - value[0])}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="startNode">Start Node</Label>
          <Input
            id="startNode"
            value={startNode}
            onChange={(e) => setStartNode(e.target.value.toUpperCase())}
            placeholder="Enter start node"
            maxLength={1}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="goalNode">Goal Node</Label>
          <Input
            id="goalNode"
            value={goalNode}
            onChange={(e) => setGoalNode(e.target.value.toUpperCase())}
            placeholder="Enter goal node"
            maxLength={1}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nodeCount">Node Count</Label>
          <Input
            id="nodeCount"
            type="number"
            value={nodeCount}
            onChange={(e) => setNodeCount(parseInt(e.target.value))}
            min={2}
            max={26}
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
            onClick={handleSearch}
            disabled={isSearching || !startNode || !goalNode}
          >
            Run Search
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};