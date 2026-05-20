import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AttendanceChart = ({ data, height = 250 }) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis dataKey="month" stroke="#64748B" />
        <YAxis stroke="#64748B" />
        <Tooltip />
        <Line 
          type="monotone" 
          dataKey="attendance" 
          stroke="#4F46E5" 
          strokeWidth={3}
          dot={{ fill: '#4F46E5', r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default AttendanceChart;
