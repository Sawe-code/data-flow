import { useState, useContext } from "react";
import { DataContext } from "../contexts/DataContext";
import { apiFetch } from "../config/api";

const Upload = () => {
  const {
    setAnalysisResult,
    setLoading,
    setError,
    error,
    loading,
  } = useContext(DataContext);

  const [fileName, setFileName] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [mode, setMode] = useState("file");
  const [dragActive, setDragActive] = useState(false);

  const readResponse = async (response) => {
    const text = await response.text();

    try {
      return text ? JSON.parse(text) : {};
    } catch {
      return {
        error: text || `Request failed with status ${response.status}`,
      };
    }
  };

  const uploadToBackend = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setError("");

      const response = await apiFetch("/upload", {
        method: "POST",
        body: formData,
      });

      const result = await readResponse(response);

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload file");
      }

      setAnalysisResult(result);
    } catch (error) {
      console.error(error);
      setError(error.message || "Failed to upload file");
    } finally {
      setLoading(false);
    }
  };

  const handleFile = (file) => {
    if (!file) return;

    setFileName(file.name);
    uploadToBackend(file);
  };

  const importFromAPI = async (event) => {
    event.preventDefault();

    if (!apiUrl.trim()) {
      setError("Enter an API URL first.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await apiFetch("/import/api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: apiUrl.trim() }),
      });

      const result = await readResponse(response);

      if (!response.ok) {
        throw new Error(result.error || "Failed to import API data");
      }

      setFileName("");
      setAnalysisResult(result);
    } catch (error) {
      console.error(error);
      setError(error.message || "Failed to import API data");
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (
      e.type === "dragenter" ||
      e.type === "dragover"
    ) {
      setDragActive(true);
    } else {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    setDragActive(false);

    if (
      e.dataTransfer.files &&
      e.dataTransfer.files[0]
    ) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <section className="section">
      <div className="container-custom">

        <div className="text-center mb-10">
          <h2>Upload Dataset</h2>

          <p>
            Upload a CSV or Excel file, or import data from an API, and we'll clean and
            analyze it automatically.
          </p>
        </div>

        <div className="card">
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <button
              type="button"
              className={`btn ${mode === "file" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setMode("file")}
            >
              File Upload
            </button>

            <button
              type="button"
              className={`btn ${mode === "api" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setMode("api")}
            >
              API Import
            </button>
          </div>

          {mode === "file" ? (
            <div
              className={`border-2 border-dashed rounded-xl p-10 text-center transition ${
                dragActive
                  ? "border-indigo-500"
                  : ""
              }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".csv,.xlsx"
                className="hidden"
                id="fileUpload"
                onChange={(e) =>
                  handleFile(e.target.files[0])
                }
              />

              <label
                htmlFor="fileUpload"
                className="cursor-pointer"
              >
                <div className="text-5xl mb-4">
                  📂
                </div>

                <h3>
                  Drag & Drop CSV or Excel Here
                </h3>

                <p className="mt-2">
                  {fileName
                    ? fileName
                    : "or click to browse"}
                </p>
              </label>
            </div>
          ) : (
            <form
              className="max-w-3xl mx-auto"
              onSubmit={importFromAPI}
            >
              <label className="block space-y-2">
                <span className="text-sm text-muted">API URL</span>
                <input
                  type="url"
                  className="input"
                  value={apiUrl}
                  onChange={(event) => setApiUrl(event.target.value)}
                  placeholder="https://example.com/data.json"
                />
              </label>

              <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? "Importing..." : "Import API Data"}
                </button>

                <p className="text-sm">
                  Works best with JSON arrays, JSON objects with data/results/items, or CSV APIs.
                </p>
              </div>
            </form>
          )}

          {error && (
            <p className="mt-5 text-center text-red-500">
              {error}
            </p>
          )}

          {loading && (
            <div className="mt-5 text-center">
              Cleaning data...
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Upload;
