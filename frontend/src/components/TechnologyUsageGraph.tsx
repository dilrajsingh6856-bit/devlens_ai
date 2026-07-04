import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Repository {
  language: string | null;
  [key: string]: any;
}

interface TechnologyUsageGraphProps {
  repos: Repository[];
}

export const TechnologyUsageGraph: React.FC<TechnologyUsageGraphProps> = ({ repos }) => {
  // Extract language counts
  const langCounts: Record<string, number> = {};
  repos.forEach((r) => {
    const lang = r.language;
    if (lang) {
      langCounts[lang] = (langCounts[lang] || 0) + 1;
    }
  });

  // Convert to chart array and sort descending
  const data = Object.entries(langCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // top 5 languages

  const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-zinc-500">
        No languages detected in repositories.
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
        >
          <XAxis type="number" stroke="#71717a" fontSize={10} hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            stroke="#a1a1aa" 
            fontSize={11} 
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
            labelStyle={{ color: '#ffffff', fontWeight: 600 }}
            itemStyle={{ color: '#a78bfa' }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={14}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
