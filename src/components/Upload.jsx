import { useState, useContext } from "react";
import Papa from "papaparse";
import { DataContext } from "../contexts/DataContext";
import Charts from "./Charts";

const Upload = () => {
  const { setRawData, setCleanedData } = useContext(DataContext);

  const [fileName, setFileName] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [showCharts, setShowCharts] = useState(false);

  const handleFile = (file) => {
    if (!file) return;

    setFileName(file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data;

        setRawData(data);

        // 🔥 CLEAN DATA
        const cleaned = data.map((row) => {
          let newRow = {};
          Object.keys(row).forEach((key) => {
            let value = row[key]?.toString().trim();

            // convert numbers automatically
            if (!isNaN(value) && value !== "") {
              value = Number(value);
            }

            newRow[key] = value;
          });
          return newRow;
        });

        setCleanedData(cleaned);
      },
    });
  };

  /* DRAG EVENTS */

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <main className="section">
      <div className="container-custom space-y-10">

        {/* HEADER */}
        <div className="text-center max-w-2xl mx-auto">
          <h1>
            Upload your <span className="text-gradient">data</span>
          </h1>
          <p className="mt-3">
            Drag & drop your CSV file or click to upload. We’ll clean,
            analyze, and visualize it instantly.
          </p>
        </div>

        {/* UPLOAD CARD */}
        <div
          className={`card flex flex-col items-center justify-center text-center p-10 border-2 border-dashed transition ${
            dragActive ? "border-primary bg-secondary" : ""
          }`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".csv"
            onChange={(e) => handleFile(e.target.files[0])}
            className="hidden"
            id="fileUpload"
          />

          <label htmlFor="fileUpload" className="cursor-pointer">
            <div className="mb-4 text-4xl">📂</div>

            <h3 className="font-semibold">
              {fileName ? "File selected" : "Drag & drop your CSV file"}
            </h3>

            <p className="text-muted mt-2 text-sm">
              {fileName || "or click to browse your files"}
            </p>
          </label>
        </div>

        {/* EMPTY STATE */}
        {!fileName && (
          <div className="text-center text-muted text-sm">
            No data uploaded yet. Your insights will appear here.
          </div>
        )}

        {/* ACTION */}
        {fileName && (
          <div className="card space-y-4 text-center">
            <h3 className="font-semibold">File Ready</h3>

            <p className="text-sm text-muted">
              <strong>{fileName}</strong> uploaded successfully.
            </p>

            <button
              onClick={() => setShowCharts(true)}
              className="btn btn-primary"
            >
              Clean & Analyze →
            </button>
          </div>
        )}

        {/* CHARTS */}
        {showCharts && (
          <div className="space-y-6">
            <h2 className="text-center">
              Your <span className="text-gradient">Insights</span>
            </h2>

            <Charts />
          </div>
        )}

      </div>
    </main>
  );
};

export default Upload;