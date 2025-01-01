// src/types/graph.ts

export interface Node {
    index: number;
    x: number;
    y: number;
    label: string;
    isStartNode: boolean;
    isGoalNode: boolean;
    links: number;
  }
  
  export interface Link {
    source: number;
    target: number;
    distance: number;
  }
  
  export interface GraphData {
    nodes: Node[];
    links: Link[];
    startNodeLabel: string;
    goalNodeLabel: string;
  }
  
  export interface IterationCounts {
    enqueues: number;
    extensions: number;
    queue_size: number;
    path_nodes: number;
    path_cost: number;
    [key: string]: number; // Index signature for compatibility with Record<string, number>
  }
  
  export interface SearchResult {
    visited_labels: string[];
    paths: [string, string][];
    iteration_counts: IterationCounts;
  }
  
  export type SearchAlgorithm = 'dfs' | 'bfs' | 'hill_climb';