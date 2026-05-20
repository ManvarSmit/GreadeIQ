import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PerformanceChart = ({ data, height = 250, dataKey = 'value', stroke = '#F59E0B' }) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis dataKey="month" stroke="#64748B" />
        <YAxis stroke="#64748B" />
        <Tooltip />
        <Line 
          type="monotone" 
          dataKey={dataKey} 
          stroke={stroke} 
          strokeWidth={3}
          dot={{ fill: stroke, r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default PerformanceChart;
