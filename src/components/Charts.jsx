import { useContext, useMemo, useState, useEffect } from "react";
import { DataContext } from "../contexts/DataContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

const Charts = () => {
  const { cleanedData } = useContext(DataContext);

  if (!cleanedData.length) {
    return <p>No data available</p>;
  }

  const keys = Object.keys(cleanedData[0]);

  const numericColumns = useMemo(
    () =>
      keys.filter((key) =>
        cleanedData.every((row) => typeof row[key] === "number")
      ),
    [cleanedData, keys]
  );

  const categoryColumns = useMemo(
    () =>
      keys.filter((key) =>
        cleanedData.some((row) => typeof row[key] !== "number")
      ),
    [cleanedData, keys]
  );

  const [categoryKey, setCategoryKey] = useState("");
  const [valueKey, setValueKey] = useState("");

  useEffect(() => {
    if (categoryColumns.length) setCategoryKey(categoryColumns[0]);
    if (numericColumns.length) setValueKey(numericColumns[0]);
  }, [cleanedData]);

  const COLORS = ["#6366f1", "#06b6d4", "#22c55e", "#f59e0b"];

  return (
    <div className="space-y-8">

      {/* SELECTORS */}
      <div className="card space-y-4">
        <h3>Select Data</h3>

        <div className="flex flex-col md:flex-row gap-4">
          <select
            value={categoryKey}
            onChange={(e) => setCategoryKey(e.target.value)}
            className="input"
          >
            {categoryColumns.map((col) => (
              <option key={col}>{col}</option>
            ))}
          </select>

          <select
            value={valueKey}
            onChange={(e) => setValueKey(e.target.value)}
            className="input"
          >
            {numericColumns.map((col) => (
              <option key={col}>{col}</option>
            ))}
          </select>
        </div>
      </div>

      {/* BAR */}
      <div className="card">
        <h3>Bar Chart</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={cleanedData}>
            <XAxis dataKey={categoryKey} />
            <YAxis />
            <Tooltip />
            <Bar dataKey={valueKey} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* LINE */}
      <div className="card">
        <h3>Line Chart</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={cleanedData}>
            <XAxis dataKey={categoryKey} />
            <YAxis />
            <Tooltip />
            <Line dataKey={valueKey} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* PIE */}
      <div className="card">
        <h3>Pie Chart</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={cleanedData}
              dataKey={valueKey}
              nameKey={categoryKey}
              outerRadius={80}
            >
              {cleanedData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};

export default Charts;