import { useContext } from "react";
import { DataContext } from "../contexts/DataContext";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const COLORS = [
  "#4f46e5",
  "#06b6d4",
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
];

const Charts = () => {
  const { analysisResult } = useContext(DataContext);

  if (!analysisResult) return null;

  const profiles = analysisResult.columnProfiles || [];
  const chartData = analysisResult.chartData || {};
  const insights = analysisResult.insights || [];
  const trendData = chartData.trend || [];
  const comparisonData = chartData.comparison || [];
  const frequencyData = chartData.frequency || [];
  const missingData = (chartData.missingValues || []).filter((item) => item.value > 0);

  const pieData = [
    {
      name: "Clean Rows",
      value: analysisResult.cleanRows || 0,
    },
    {
      name: "Invalid Rows",
      value: analysisResult.invalidRows || 0,
    },
    {
      name: "Duplicates",
      value: analysisResult.duplicatesRemoved || 0,
    },
  ].filter((item) => item.value > 0);

  const numberProfiles = profiles.filter((profile) => profile.numeric);
  const textProfiles = profiles.filter((profile) => profile.text?.mostCommon?.length);

  return (
    <section className="section">
      <div className="container-custom">
        <div className="mb-8 text-center">
          <h2>
            Data <span className="text-gradient">Insights</span>
          </h2>

          <p className="mt-2">
            Visual summary of your uploaded dataset.
          </p>
        </div>

        {insights.length > 0 && (
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {insights.slice(0, 3).map((insight) => (
              <div key={insight} className="card">
                <p className="text-sm leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="card">
            <h3 className="mb-6">
              Dataset Breakdown
            </h3>

            <div className="h-[350px]">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    outerRadius={120}
                    label
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={
                          COLORS[
                            index %
                              COLORS.length
                          ]
                        }
                      />
                    ))}
                  </Pie>

                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {trendData.length > 0 && (
            <div className="card">
              <h3 className="mb-6">Trend Over Time</h3>

              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#06b6d4"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {comparisonData.length > 0 && (
            <div className="card">
              <h3 className="mb-6">Comparison</h3>

              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#4f46e5" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {frequencyData.length > 0 && (
            <div className="card">
              <h3 className="mb-6">Category Frequency</h3>

              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={frequencyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {missingData.length > 0 && (
            <div className="card">
              <h3 className="mb-6">Missing Values</h3>

              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={missingData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {numberProfiles.length > 0 && (
          <div className="mt-8 grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {numberProfiles.map((profile) => (
              <div key={profile.name} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3>{profile.name}</h3>
                    <p className="mt-1">Numeric summary</p>
                  </div>
                  <span className="badge">number</span>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-5">
                  <div>
                    <p>Min</p>
                    <h3>{profile.numeric.min}</h3>
                  </div>
                  <div>
                    <p>Max</p>
                    <h3>{profile.numeric.max}</h3>
                  </div>
                  <div>
                    <p>Average</p>
                    <h3>{profile.numeric.average}</h3>
                  </div>
                  <div>
                    <p>Total</p>
                    <h3>{profile.numeric.total}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {textProfiles.length > 0 && (
          <div className="mt-8 grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {textProfiles.slice(0, 6).map((profile) => (
              <div key={profile.name} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3>{profile.name}</h3>
                    <p className="mt-1">{profile.uniqueCount} unique values</p>
                  </div>
                  <span className="badge">{profile.type}</span>
                </div>

                <div className="mt-5 space-y-3">
                  {profile.text.mostCommon.slice(0, 4).map((item) => (
                    <div key={item.name} className="flex items-center justify-between gap-4">
                      <span className="text-sm">{item.name}</span>
                      <span className="badge">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Charts;
