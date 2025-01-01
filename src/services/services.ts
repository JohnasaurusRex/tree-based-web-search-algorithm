// src/services/api.ts
import { GraphData, SearchResult, SearchAlgorithm } from '../types/graph';

const API_BASE_URL = 'https://tree-based-search-algorithm.vercel.app/api';

export const fetchGraphData = async (): Promise<GraphData> => {
  const response = await fetch(`${API_BASE_URL}/graph_data`);
  if (!response.ok) throw new Error('Failed to fetch graph data');
  return response.json();
};

export const resetGraph = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/reset_graph`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to reset graph');
    }
    return await response.json();
  } catch (error) {
    console.error('Error resetting graph:', error);
    throw error;
  }
};

export const generateNodes = async (nodeCount: number): Promise<GraphData> => {
  const response = await fetch(`${API_BASE_URL}/generate_nodes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ node_count: nodeCount }),
  });
  if (!response.ok) throw new Error('Failed to generate nodes');
  return response.json();
};

export const runSearch = async (
  algorithm: SearchAlgorithm,
  startLabel: string,
  goalLabel: string
): Promise<SearchResult> => {
  const response = await fetch(`${API_BASE_URL}/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      algorithm,
      start_label: startLabel,
      goal_label: goalLabel,
    }),
  });
  if (!response.ok) throw new Error('Search failed');
  return response.json();
};