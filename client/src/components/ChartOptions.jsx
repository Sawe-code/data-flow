import { useContext, useMemo, useState } from "react";
import { DataContext } from "../contexts/DataContext";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const ChartOptions = () => {
  const { analysisResult } = useContext(DataContext);
  const rows = useMemo(() => analysisResult?.cleanedData || [], [analysisResult]);
  const profiles = useMemo(() => analysisResult?.columnProfiles || [], [analysisResult]);

  const categoryColumns = profiles.filter((profile) => ["text", "date", "boolean"].includes(profile.type));
  const numericColumns = profiles.filter((profile) => profile.type === "number");

  const [chartType, setChartType] = useState("bar");
  const [xColumn, setXColumn] = useState(categoryColumns[0]?.name || "");
  const [yColumn, setYColumn] = useState(numericColumns[0]?.name || "");
  const [metric, setMetric] = useState(numericColumns[0] ? "sum" : "count");

  const chartRows = useMemo(() => {
    if (!xColumn || rows.length === 0) return [];

    const grouped = new Map();

    rows.forEach((row) => {
      const groupName = row[xColumn] || "N/A";
      const current = grouped.get(groupName) || { name: groupName, total: 0, count: 0 };
      const value = Number(row[yColumn]);

      current.count += 1;
      if (!Number.isNaN(value)) {
        current.total += value;
      }

      grouped.set(groupName, current);
    });

    return Array.from(grouped.values())
      .map((item) => ({
        name: item.name,
        value: metric === "average" && item.count > 0
          ? Number((item.total / item.count).toFixed(2))
          : metric === "count"
            ? item.count
            : Number(item.total.toFixed(2)),
      }))
      .sort((a, b) => {
        if (chartType === "line") return String(a.name).localeCompare(String(b.name));
        return b.value - a.value;
      })
      .slice(0, 12);
  }, [chartType, metric, rows, xColumn, yColumn]);

  if (!analysisResult || rows.length === 0 || categoryColumns.length === 0) {
    return null;
  }

  const canUseNumericMetric = numericColumns.length > 0;
  const metricOptions = canUseNumericMetric
    ? [
        { label: "Sum", value: "sum" },
        { label: "Average", value: "average" },
        { label: "Count", value: "count" },
      ]
    : [{ label: "Count", value: "count" }];

  return (
    <section className="pb-12">
      <div className="container-custom">
        <div className="card">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-6">
            <div>
              <h2>Chart Options</h2>
              <p className="mt-2">
                Choose how this dataset should be represented.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full lg:w-auto">
              <label className="space-y-2">
                <span className="text-sm text-muted">Chart</span>
                <select
                  className="input"
                  value={chartType}
                  onChange={(event) => setChartType(event.target.value)}
                >
                  <option value="bar">Bar</option>
                  <option value="line">Line</option>
                  <option value="pie">Pie</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm text-muted">X-Axis</span>
                <select
                  className="input"
                  value={xColumn}
                  onChange={(event) => setXColumn(event.target.value)}
                >
                  {categoryColumns.map((profile) => (
                    <option key={profile.name} value={profile.name}>
                      {profile.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm text-muted">Y-Axis</span>
                <select
                  className="input"
                  value={yColumn}
                  disabled={!canUseNumericMetric || metric === "count"}
                  onChange={(event) => setYColumn(event.target.value)}
                >
                  {numericColumns.map((profile) => (
                    <option key={profile.name} value={profile.name}>
                      {profile.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm text-muted">Metric</span>
                <select
                  className="input"
                  value={metric}
                  onChange={(event) => setMetric(event.target.value)}
                >
                  {metricOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "line" ? (
                <LineChart data={chartRows}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              ) : chartType === "pie" ? (
                <PieChart>
                  <Pie data={chartRows} dataKey="value" nameKey="name" outerRadius={130} label>
                    {chartRows.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              ) : (
                <BarChart data={chartRows}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#4f46e5" radius={[8, 8, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChartOptions;
