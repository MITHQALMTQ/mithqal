"use client";

import { useState, useEffect } from "react";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; filename?: string; size?: number; message?: string; error?: string } | null>(null);
  const [files, setFiles] = useState<{ name: string; size: number; modified: string }[]>([]);

  const fetchFiles = async () => {
    try {
      const res = await fetch("/api/upload");
      const data = await res.json();
      if (data.ok) setFiles(data.files || []);
    } catch {}
  };

  useEffect(() => { fetchFiles(); }, []);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      setResult(data);
      if (data.ok) {
        setFile(null);
        fetchFiles();
      }
    } catch (err) {
      setResult({ ok: false, error: err instanceof Error ? err.message : "upload failed" });
    } finally {
      setUploading(false);
    }
  };

  const fmtSize = (b: number) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Upload File to Sandbox</h1>
          <p className="text-sm text-muted-foreground">
            Files are saved to <code className="px-1 py-0.5 bg-muted rounded text-xs">/home/z/my-project/upload/</code>
            <br />The agent can read them immediately after upload.
          </p>
        </div>

        <div className="border-2 border-dashed border-border rounded-lg p-8 space-y-4">
          <input
            type="file"
            onChange={(e) => { setFile(e.target.files?.[0] || null); setResult(null); }}
            className="w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
            disabled={uploading}
          />
          {file && (
            <div className="text-sm text-muted-foreground">
              Selected: <span className="font-medium text-foreground">{file.name}</span> ({fmtSize(file.size)})
            </div>
          )}
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full py-2 px-4 rounded bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>

        {result && (
          <div className={`p-4 rounded text-sm ${result.ok ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-red-500/10 text-red-700 dark:text-red-400"}`}>
            {result.ok ? (
              <div>
                <div className="font-medium">✓ {result.message}</div>
                <div className="mt-1 text-xs opacity-80">Filename: {result.filename} · Size: {fmtSize(result.size || 0)}</div>
              </div>
            ) : (
              <div className="font-medium">✗ {result.error}</div>
            )}
          </div>
        )}

        {files.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-foreground">Files in upload directory ({files.length})</h2>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {files.map((f) => (
                <div key={f.name} className="flex justify-between items-center text-xs px-3 py-2 bg-muted/50 rounded">
                  <span className="font-mono text-foreground truncate">{f.name}</span>
                  <span className="text-muted-foreground ml-2 shrink-0">{fmtSize(f.size)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
