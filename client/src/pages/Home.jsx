import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { DataContext } from "../contexts/DataContext";
import { AuthContext } from "../contexts/AuthContext";
import { apiFetch } from "../config/api";


import StatsCards from "../components/StatsCards";
import ChartOptions from "../components/ChartOptions";
import Charts from "../components/Charts";
import CleanedTable from "../components/CleanedTable";
import InvalidTable from "../components/InvalidTable";
import HeroTransition from "../components/HeroTransition";

const Home = () => {
  const { analysisResult } = useContext(DataContext);
  const { isLoggedIn, token } = useContext(AuthContext);
  const [saveStatus, setSaveStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const downloadCleanedData = () => {
    const rows = analysisResult?.cleanedData || [];
    if (rows.length === 0) return;

    const columns = Object.keys(rows[0]);
    const escapeCell = (value) => {
      const text = String(value ?? "");
      if (/[",\n]/.test(text)) {
        return `"${text.replaceAll('"', '""')}"`;
      }
      return text;
    };

    const csv = [
      columns.map(escapeCell).join(","),
      ...rows.map((row) => columns.map((column) => escapeCell(row[column])).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const fileName = analysisResult.fileName || "cleaned-data.csv";

    link.href = url;
    link.download = fileName.replace(/\.csv$/i, "") + "-cleaned.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const saveAnalysis = async () => {
    if (!analysisResult || !token) return;

    setSaving(true);
    setSaveStatus("");

    try {
      const response = await apiFetch("/analysis/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(analysisResult),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save analysis");
      }

      setSaveStatus("Analysis saved.");
    } catch (error) {
      console.error(error);
      setSaveStatus(error.message || "Failed to save analysis.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <HeroTransition />

      {analysisResult && (
        <>
          <StatsCards />

          <section className="pb-6">
            <div className="container-custom flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl">Keep this analysis</h2>
                <p className="mt-1">
                  Save the cleaned result to your account and revisit it later.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                {saveStatus && (
                  <p className="text-sm text-muted">{saveStatus}</p>
                )}

                <button
                  type="button"
                  onClick={downloadCleanedData}
                  className="btn btn-secondary"
                >
                  Download CSV
                </button>

                {isLoggedIn ? (
                  <button
                    type="button"
                    onClick={saveAnalysis}
                    disabled={saving}
                    className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "Saving..." : "Save Analysis"}
                  </button>
                ) : (
                  <Link to="/login" className="btn btn-primary">
                    Login to Save
                  </Link>
                )}
              </div>
            </div>
          </section>

          <ChartOptions key={`${analysisResult.fileName}-${analysisResult.totalRows}-${analysisResult.cleanRows}`} />
          <Charts />
          <CleanedTable />
          <InvalidTable />
        </>
      )}
    </>
  );
};

export default Home;
