import { useCallback, useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { DataContext } from "../contexts/DataContext";
import { apiFetch } from "../config/api";
import { FileUp, FolderOpen } from "lucide-react";
import { motion } from "framer-motion";
import { Database, Link2 } from "lucide-react";

const defaultDatabaseSetup = {
  name: "",
  driver: "postgres",
  host: "",
  port: "5432",
  databaseName: "",
  username: "",
  password: "",
};

const Upload = () => {
  const {
    setAnalysisResult,
    setLoading,
    setError,
    error,
    loading,
  } = useContext(DataContext);
  const { isLoggedIn, token } = useContext(AuthContext);

  const [fileName, setFileName] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [mode, setMode] = useState("file");
  const [dragActive, setDragActive] = useState(false);
  const [databaseSetups, setDatabaseSetups] = useState([]);
  const [databaseTables, setDatabaseTables] = useState([]);
  const [selectedSetupId, setSelectedSetupId] = useState("");
  const [selectedTable, setSelectedTable] = useState("");
  const [setupForm, setSetupForm] = useState(defaultDatabaseSetup);
  const [setupStatus, setSetupStatus] = useState("");

  const readResponse = useCallback(async (response) => {
    const text = await response.text();

    try {
      return text ? JSON.parse(text) : {};
    } catch {
      return {
        error: text || `Request failed with status ${response.status}`,
      };
    }
  }, []);

  const authHeaders = useCallback((extraHeaders = {}) => ({
    ...extraHeaders,
    Authorization: `Bearer ${token}`,
  }), [token]);

  const loadDatabaseSetups = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError("");

      const response = await apiFetch("/database-connections", {
        headers: authHeaders(),
      });
      const result = await readResponse(response);

      if (!response.ok) {
        throw new Error(result.error || "Failed to load database setups");
      }

      const setups = Array.isArray(result) ? result : [];
      setDatabaseSetups(setups);
      setSelectedSetupId((current) => current || String(setups[0]?.id || ""));
    } catch (error) {
      console.error(error);
      setError(error.message || "Failed to load database setups");
    } finally {
      setLoading(false);
    }
  }, [authHeaders, readResponse, setError, setLoading, token]);

  const loadDatabaseTables = useCallback(async (setupId) => {
    if (!setupId || !token) return;

    try {
      setLoading(true);
      setError("");

      const response = await apiFetch(`/database-connections/${setupId}/tables`, {
        headers: authHeaders(),
      });
      const result = await readResponse(response);

      if (!response.ok) {
        throw new Error(result.error || "Failed to load database tables");
      }

      const tables = Array.isArray(result.tables) ? result.tables : [];
      setDatabaseTables(tables);
      setSelectedTable(tables[0] || "");
    } catch (error) {
      console.error(error);
      setDatabaseTables([]);
      setSelectedTable("");
      setError(error.message || "Failed to load database tables");
    } finally {
      setLoading(false);
    }
  }, [authHeaders, readResponse, setError, setLoading, token]);

  useEffect(() => {
    if (mode === "database" && isLoggedIn && databaseSetups.length === 0) {
      loadDatabaseSetups();
    }
  }, [databaseSetups.length, isLoggedIn, loadDatabaseSetups, mode]);

  useEffect(() => {
    if (mode === "database" && selectedSetupId) {
      loadDatabaseTables(selectedSetupId);
    }
  }, [loadDatabaseTables, mode, selectedSetupId]);

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

  const saveDatabaseSetup = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");
      setSetupStatus("");

      const response = await apiFetch("/database-connections", {
        method: "POST",
        headers: authHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(setupForm),
      });
      const result = await readResponse(response);

      if (!response.ok) {
        throw new Error(result.error || "Failed to save database setup");
      }

      setSetupStatus("Database setup saved.");
      setSetupForm({
        ...defaultDatabaseSetup,
        driver: setupForm.driver,
        port: setupForm.driver === "mysql" ? "3306" : "5432",
      });
      await loadDatabaseSetups();
      setSelectedSetupId(String(result.id || ""));
    } catch (error) {
      console.error(error);
      setError(error.message || "Failed to save database setup");
    } finally {
      setLoading(false);
    }
  };

  const importFromDatabase = async (event) => {
    event.preventDefault();

    if (!selectedSetupId || !selectedTable) {
      setError("Select a saved database setup and table first.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await apiFetch(`/database-connections/${selectedSetupId}/import`, {
        method: "POST",
        headers: authHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ table: selectedTable }),
      });
      const result = await readResponse(response);

      if (!response.ok) {
        throw new Error(result.error || "Failed to import database table");
      }

      setFileName("");
      setAnalysisResult(result);
    } catch (error) {
      console.error(error);
      setError(error.message || "Failed to import database table");
    } finally {
      setLoading(false);
    }
  };

  const updateSetupForm = (field, value) => {
    setSetupForm((current) => {
      const next = { ...current, [field]: value };

      if (field === "driver") {
        next.port = value === "mysql" ? "3306" : value === "postgres" ? "5432" : "";
      }

      return next;
    });
  };

  const handleDrag = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setDragActive(event.type === "dragenter" || event.type === "dragover");
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setDragActive(false);

    if (event.dataTransfer.files?.[0]) {
      handleFile(event.dataTransfer.files[0]);
    }
  };

  const isServerDatabase = setupForm.driver !== "sqlite";

  return (
    <section className="section">
      <div className="container-custom">
        <div className="text-center mb-10">
          <h2>Upload Dataset</h2>
          <p>
            Upload a CSV or Excel file, import data from an API, or connect a saved
            database setup and we'll clean and analyze it automatically.
          </p>
        </div>

        <div className="card">
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <button
              type="button"
              className={`btn ${mode === "file" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setMode("file")}
            >
              <FileUp size={18} />
              <span>File Upload</span>
            </button>

            <button
              type="button"
              className={`btn ${mode === "api" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setMode("api")}
            >
              API Import
            </button>

            <button
              type="button"
              className={`btn ${mode === "database" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setMode("database")}
            >
              Database
            </button>
          </div>

          {mode === "file" ? (
            <div
              className={`border-2 border-dashed rounded-xl p-10 text-center transition ${dragActive ? "border-indigo-500" : ""
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
                onChange={(event) => handleFile(event.target.files[0])}
              />

              <label htmlFor="fileUpload" className="cursor-pointer">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex justify-center mb-4">
                  <FolderOpen
                    size={90}
                    className="text-yellow-400"
                    strokeWidth={2}
                  />
                </motion.div>

                <h3>Drag & Drop CSV or Excel Here</h3>
                <p className="mt-2">
                  {fileName ? fileName : "or click to browse"}
                </p>
              </label>
            </div>
          ) : mode === "api" ? (
            <form className="max-w-3xl mx-auto" onSubmit={importFromAPI}>
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
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Importing..." : "Import API Data"}
                </button>
                <p className="text-sm">
                  Works best with JSON arrays, JSON objects with data/results/items, or CSV APIs.
                </p>
              </div>
            </form>
          ) : !isLoggedIn ? (
            <div className="max-w-3xl mx-auto text-center">
              <h3>Login required</h3>
              <p className="mt-2">
                Database setups are saved to your account, so login before connecting a database.
              </p>
            </div>
          ) : (
            <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8">
              <form className="space-y-4" onSubmit={saveDatabaseSetup}>
                <div>
                  <h3>Save Database Setup</h3>
                  <p className="mt-1">
                    Store the connection details once, then reuse them for chart imports.
                  </p>
                </div>

                <label className="block space-y-2">
                  <span className="text-sm text-muted">Connection Name</span>
                  <input
                    className="input"
                    value={setupForm.name}
                    onChange={(event) => updateSetupForm("name", event.target.value)}
                    placeholder="Sales database"
                  />
                </label>

                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="block space-y-2">
                    <span className="text-sm text-muted">Database Type</span>
                    <select
                      className="input"
                      value={setupForm.driver}
                      onChange={(event) => updateSetupForm("driver", event.target.value)}
                    >
                      <option value="postgres">PostgreSQL</option>
                      <option value="mysql">MySQL</option>
                      <option value="sqlite">SQLite</option>
                    </select>
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm text-muted">
                      {setupForm.driver === "sqlite" ? "Database File Path" : "Database Name"}
                    </span>
                    <input
                      className="input"
                      value={setupForm.databaseName}
                      onChange={(event) => updateSetupForm("databaseName", event.target.value)}
                      placeholder={setupForm.driver === "sqlite" ? "data-pilot.db" : "analytics_db"}
                    />
                  </label>
                </div>

                {isServerDatabase && (
                  <>
                    <div className="grid sm:grid-cols-[1fr_120px] gap-4">
                      <label className="block space-y-2">
                        <span className="text-sm text-muted">Server URL / Host</span>
                        <input
                          className="input"
                          value={setupForm.host}
                          onChange={(event) => updateSetupForm("host", event.target.value)}
                          placeholder="localhost"
                        />
                      </label>

                      <label className="block space-y-2">
                        <span className="text-sm text-muted">Port</span>
                        <input
                          className="input"
                          value={setupForm.port}
                          onChange={(event) => updateSetupForm("port", event.target.value)}
                          placeholder="5432"
                        />
                      </label>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <label className="block space-y-2">
                        <span className="text-sm text-muted">Username</span>
                        <input
                          className="input"
                          value={setupForm.username}
                          onChange={(event) => updateSetupForm("username", event.target.value)}
                          placeholder="database user"
                        />
                      </label>

                      <label className="block space-y-2">
                        <span className="text-sm text-muted">Password</span>
                        <input
                          type="password"
                          className="input"
                          value={setupForm.password}
                          onChange={(event) => updateSetupForm("password", event.target.value)}
                          placeholder="database password"
                        />
                      </label>
                    </div>
                  </>
                )}

                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Saving..." : "Save Setup"}
                </button>

                {setupStatus && <p className="text-sm">{setupStatus}</p>}
              </form>

              <form className="space-y-4" onSubmit={importFromDatabase}>
                <div>
                  <h3>Import From Saved Setup</h3>
                  <p className="mt-1">
                    Choose a saved connection, select a table, and visualize its rows.
                  </p>
                </div>

                <label className="block space-y-2">
                  <span className="text-sm text-muted">Saved Setup</span>
                  <select
                    className="input"
                    value={selectedSetupId}
                    onChange={(event) => setSelectedSetupId(event.target.value)}
                    disabled={databaseSetups.length === 0}
                  >
                    {databaseSetups.length === 0 ? (
                      <option value="">No saved setups yet</option>
                    ) : (
                      databaseSetups.map((setup) => (
                        <option key={setup.id} value={setup.id}>
                          {setup.name} ({setup.driver})
                        </option>
                      ))
                    )}
                  </select>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm text-muted">Table</span>
                  <select
                    className="input"
                    value={selectedTable}
                    onChange={(event) => setSelectedTable(event.target.value)}
                    disabled={databaseTables.length === 0}
                  >
                    {databaseTables.length === 0 ? (
                      <option value="">No tables loaded</option>
                    ) : (
                      databaseTables.map((table) => (
                        <option key={table} value={table}>
                          {table}
                        </option>
                      ))
                    )}
                  </select>
                </label>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || !selectedSetupId || !selectedTable}
                  >
                    {loading ? "Importing..." : "Import Table"}
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => selectedSetupId && loadDatabaseTables(selectedSetupId)}
                    disabled={loading || !selectedSetupId}
                  >
                    Refresh Tables
                  </button>
                </div>
              </form>
            </div>
          )}

          {error && (
            <p className="mt-5 text-center text-red-500">
              {error}
            </p>
          )}

          {loading && (
            <div className="mt-5 text-center">
              Working...
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Upload;
