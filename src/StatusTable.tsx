import React from 'react';

interface StatusTableProps {
  iterationCounts?: Record<string, number>;
}

export const StatusTable: React.FC<StatusTableProps> = ({ iterationCounts }) => {
  if (!iterationCounts) return null;

  return (
    <table className="min-w-full border-collapse border">
      <thead>
        <tr>
          <th className="border p-2">Parameter</th>
          <th className="border p-2">Value</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(iterationCounts).map(([param, value]) => {
          const formattedParam = param
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          const formattedValue = param === 'path_cost' ? Math.round(value) : value;
          
          return (
            <tr key={param}>
              <td className="border p-2">{formattedParam}</td>
              <td className="border p-2">{formattedValue}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};