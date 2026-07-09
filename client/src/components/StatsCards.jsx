import { useContext } from "react";
import { DataContext } from "../contexts/DataContext";

const StatsCards = () => {
  const { analysisResult } =
    useContext(DataContext);

  if (!analysisResult) return null;

  const profiles = analysisResult.columnProfiles || [];
  const numericColumns = profiles.filter((column) => column.type === "number").length;
  const dateColumns = profiles.filter((column) => column.type === "date").length;

  const stats = [
    {
      title: "Total Rows",
      value: analysisResult.totalRows,
    },
    {
      title: "Clean Rows",
      value: analysisResult.cleanRows,
    },
    {
      title: "Invalid Rows",
      value: analysisResult.invalidRows,
    },
    {
      title: "Duplicates Removed",
      value:
        analysisResult.duplicatesRemoved,
    },
    {
      title: "Detected Columns",
      value: profiles.length,
    },
    {
      title: "Numeric Columns",
      value: numericColumns,
    },
    {
      title: "Date Columns",
      value: dateColumns,
    },
  ];

  return (
    <section className="pt-0 pb-16">
      <div className="container-custom grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((item) => (
          <div
            key={item.title}
            className="card"
          >
            <h2 className="text-3xl">{item.value ?? 0}</h2>

            <p>{item.title}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default StatsCards;
