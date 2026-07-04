import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface SkillRadarChartProps {
  portfolioScore: number;
  readinessScore: number;
  hasTestingWeakness: boolean;
  hasReadmeWeakness: boolean;
}

export const SkillRadarChart: React.FC<SkillRadarChartProps> = ({
  portfolioScore,
  readinessScore,
  hasTestingWeakness,
  hasReadmeWeakness,
}) => {
  // Compute realistic scores based on AI metrics
  const testingScore = hasTestingWeakness ? 35 : 80;
  const docScore = hasReadmeWeakness ? 40 : 85;
  const qualityScore = portfolioScore;
  const gitScore = Math.max(50, readinessScore - 10);
  const architectureScore = Math.max(45, portfolioScore - 5);

  const data = [
    { subject: 'Code Quality', value: qualityScore, fullMark: 100 },
    { subject: 'Testing', value: testingScore, fullMark: 100 },
    { subject: 'Documentation', value: docScore, fullMark: 100 },
    { subject: 'Git Activity', value: gitScore, fullMark: 100 },
    { subject: 'Architecture', value: architectureScore, fullMark: 100 },
  ];

  return (
    <div className="w-full h-64 flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#27272a" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 500 }}
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 100]} 
            tick={{ fill: '#71717a', fontSize: 8 }}
            stroke="#27272a"
          />
          <Radar
            name="Skills"
            dataKey="value"
            stroke="#8b5cf6"
            fill="#8b5cf6"
            fillOpacity={0.25}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
