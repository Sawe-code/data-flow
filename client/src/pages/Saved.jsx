import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { DataContext } from "../contexts/DataContext";
import { apiFetch } from "../config/api";

const Saved = () => {
  const { token } = useContext(AuthContext);
  const { setAnalysisResult } = useContext(DataContext);
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnalyses = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await apiFetch("/analysis/all", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load saved analyses");
        }

        setAnalyses(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load saved analyses.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyses();
  }, [token]);

  const formatDate = (value) => {
    if (!value) return "Unknown date";

    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  };

  const downloadCleanedData = (analysis) => {
    const rows = analysis.cleanedData || [];
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
    const fileName = analysis.fileName || "cleaned-data.csv";

    link.href = url;
    link.download = fileName.replace(/\.(csv|xlsx)$/i, "") + "-cleaned.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const openAnalysis = (analysis) => {
    setAnalysisResult(analysis);
    navigate("/");
  };

  return (
    <main className="section">
      <div className="container-custom">
        <div className="mb-8">
          <h1>Saved Analyses</h1>
          <p className="mt-3">
            Your cleaned datasets and quality summaries are stored here.
          </p>
        </div>

        {loading && (
          <div className="card">Loading saved analyses...</div>
        )}

        {!loading && error && (
          <div className="card border-red-500">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {!loading && !error && analyses.length === 0 && (
          <div className="card">
            <h2 className="text-xl">No saved analyses yet</h2>
            <p className="mt-2">
              Upload a CSV, review the results, then save the analysis to see it here.
            </p>
          </div>
        )}

        {!loading && !error && analyses.length > 0 && (
          <div className="grid gap-6">
            {analyses.map((analysis) => {
              const previewRows = analysis.cleanedData?.slice(0, 3) || [];
              const columns = previewRows[0] ? Object.keys(previewRows[0]) : [];
              const insights = Array.isArray(analysis.insights) ? analysis.insights : [];

              return (
                <article key={analysis.id} className="card">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                    <div>
                      <h2 className="text-xl">
                        {analysis.fileName || "Untitled dataset"}
                      </h2>
                      <p className="mt-1">{formatDate(analysis.createdAt)}</p>
                    </div>

                    <div className="flex flex-col items-start lg:items-end gap-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                        <div>
                          <h3>{analysis.totalRows}</h3>
                          <p>Total</p>
                        </div>
                        <div>
                          <h3>{analysis.cleanRows}</h3>
                          <p>Clean</p>
                        </div>
                        <div>
                          <h3>{analysis.invalidRows}</h3>
                          <p>Invalid</p>
                        </div>
                        <div>
                          <h3>{analysis.duplicatesRemoved}</h3>
                          <p>Duplicates</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => openAnalysis(analysis)}
                        >
                          Open Analysis
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => downloadCleanedData(analysis)}
                        >
                          Download CSV
                        </button>
                      </div>
                    </div>
                  </div>

                  {insights.length > 0 && (
                    <div className="mt-6 grid md:grid-cols-3 gap-4">
                      {insights.slice(0, 3).map((insight) => (
                        <div key={insight} className="rounded-lg border border-default p-4">
                          <p className="text-sm leading-relaxed">{insight}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {previewRows.length > 0 && (
                    <div className="mt-6 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr>
                            {columns.map((column) => (
                              <th key={column} className="text-left p-3 border-b">
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewRows.map((row, index) => (
                            <tr key={index}>
                              {columns.map((column) => (
                                <td key={column} className="p-3 border-b">
                                  {row[column]}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};

export default Saved
