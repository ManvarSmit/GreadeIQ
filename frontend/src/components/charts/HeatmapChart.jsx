import Card from '../ui/Card';

const HeatmapChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <p className="text-center text-secondary-500">No data available</p>
      </Card>
    );
  }

  // Get unique subjects and departments
  const subjects = [...new Set(data.map(d => d.subject))];
  const departments = [...new Set(data.map(d => d.department))];

  // Create matrix
  const matrix = {};
  data.forEach(item => {
    const key = `${item.subject}|${item.department}`;
    matrix[key] = item;
  });

  // Get color based on failure rate
  const getColor = (failureRate) => {
    if (failureRate >= 30) return 'bg-red-500';
    if (failureRate >= 20) return 'bg-orange-500';
    if (failureRate >= 10) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getTextColor = (failureRate) => {
    if (failureRate >= 10) return 'text-white';
    return 'text-white';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border border-secondary-200 bg-secondary-50 p-3 text-left text-sm font-semibold">
              Subject
            </th>
            {departments.map(dept => (
              <th
                key={dept}
                className="border border-secondary-200 bg-secondary-50 p-3 text-center text-sm font-semibold"
              >
                {dept}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {subjects.map(subject => (
            <tr key={subject}>
              <td className="border border-secondary-200 bg-secondary-50 p-3 text-sm font-medium">
                {subject}
              </td>
              {departments.map(dept => {
                const key = `${subject}|${dept}`;
                const item = matrix[key];
                
                if (!item) {
                  return (
                    <td
                      key={dept}
                      className="border border-dark-border bg-dark-surface p-3 text-center shadow-lg"
                    >
                      <span className="text-xs text-secondary-400">N/A</span>
                    </td>
                  );
                }

                return (
                  <td
                    key={dept}
                    className="border border-secondary-200 p-0"
                  >
                    <div
                      className={`${getColor(item.failureRate)} ${getTextColor(item.failureRate)} p-3 text-center transition-all duration-200 hover:opacity-80 cursor-pointer`}
                      title={`${item.subject} - ${item.department}\nFailure Rate: ${item.failureRate}%\nAvg Marks: ${item.avgMarks}\nTotal Students: ${item.total}`}
                    >
                      <div className="text-sm font-bold">{item.failureRate}%</div>
                      <div className="text-xs opacity-90">{item.failures}/{item.total}</div>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>{'< 10%'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span>10-20%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-500 rounded"></div>
          <span>20-30%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>{'≥ 30%'}</span>
        </div>
      </div>
    </div>
  );
};

export default HeatmapChart;
