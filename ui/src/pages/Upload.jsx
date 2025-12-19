import React, { useState, useEffect } from 'react';
import { Upload as UploadIcon, CheckCircle, AlertCircle, FileText, Clock, Database, Trash2 } from 'lucide-react';
import { uploadFile, getUploads, deleteUpload } from '../services/auth';

export default function Upload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState('');
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [postUploadRetries, setPostUploadRetries] = useState(0);

  // Fetch uploads from API
  const fetchUploads = async () => {
    try {
      const data = await getUploads();
      setUploads(data);
      setLastSync(new Date());
    } catch (err) {
      console.error('Error fetching uploads:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchUploads();
  }, []);

  // Auto-refresh: faster after upload, slower in idle
  useEffect(() => {
    let interval;
    
    if (postUploadRetries > 0 && postUploadRetries <= 5) {
      // Fast refresh after upload (1 second for 5 attempts)
      interval = setInterval(() => {
        fetchUploads();
        setPostUploadRetries(prev => prev - 1);
      }, 1000);
    } else {
      // Normal refresh every 10 seconds
      interval = setInterval(() => {
        fetchUploads();
      }, 10000);
    }

    return () => clearInterval(interval);
  }, [postUploadRetries]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadResult(null);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Veuillez sélectionner un fichier');
      return;
    }

    setUploading(true);
    setError('');
    setUploadResult(null);

    try {
      const result = await uploadFile(selectedFile, 'pingcastle');
      setUploadResult(result);
      
      // Trigger fast refresh (5 attempts at 1 second interval)
      setPostUploadRetries(5);
      
      // Refresh upload list immediately
      await fetchUploads();
      
      setSelectedFile(null);
      // Reset file input
      const fileInput = document.getElementById('file-input');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.xml')) {
      setSelectedFile(droppedFile);
      setUploadResult(null);
      setError('');
    } else {
      setError('Veuillez déposer un fichier XML');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDelete = async (s3Key, filename) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${filename}" ?`)) {
      return;
    }

    setDeleting(s3Key);
    try {
      await deleteUpload(s3Key);
      // Refresh upload list immediately
      await fetchUploads();
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.message || 'Erreur lors de la suppression');
      setTimeout(() => setError(''), 5000);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-3 gap-6">
        {/* Liste des uploads (centre - 2 colonnes) */}
        <div className="col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Database size={24} className="text-indigo-600" />
              Historique des uploads
            </h3>
            {lastSync && (
              <span className="text-xs text-slate-500">
                Dernière synchro: {lastSync.toLocaleTimeString('fr-CA')}
              </span>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8 text-slate-600">
              <Clock size={32} className="mx-auto mb-2 animate-spin" />
              <p>Chargement...</p>
            </div>
          ) : uploads.length === 0 ? (
            <div className="text-center py-8 text-slate-600 bg-white border border-slate-200 rounded-lg">
              <FileText size={32} className="mx-auto mb-2 text-slate-400" />
              <p>Aucun upload pour le moment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {uploads.map((upload) => {
                const uploadDate = new Date(upload.uploadedAt);
                const displayDate = uploadDate.toLocaleString('fr-CA');
                
                return (
                  <div
                    key={upload.id}
                    className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <FileText className="text-blue-600 mt-1" size={20} />
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-800">{upload.filename}</h4>
                          <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              {displayDate}
                            </span>
                            {upload.status === 'processed' && upload.findings > 0 && (
                              <span className="flex items-center gap-1 text-green-600">
                                <CheckCircle size={14} />
                                {upload.findings} findings
                              </span>
                            )}
                            {upload.status === 'processing' && (
                              <span className="flex items-center gap-1 text-orange-600">
                                <Clock size={14} />
                                En traitement...
                              </span>
                            )}
                            {upload.status === 'uploaded' && (
                              <span className="flex items-center gap-1 text-blue-600">
                                <CheckCircle size={14} />
                                Uploadé - En attente de traitement
                              </span>
                            )}
                            {upload.status === 'uploading' && (
                              <span className="flex items-center gap-1 text-orange-600 animate-pulse">
                                <UploadIcon size={14} />
                                Upload en cours...
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            upload.status === 'processed'
                              ? 'bg-green-100 text-green-700'
                              : upload.status === 'uploaded'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          {upload.status === 'processed' ? 'Traité' : 
                           upload.status === 'uploaded' ? 'Uploadé' :
                           upload.status === 'uploading' ? 'Upload...' : 'En cours'}
                        </span>
                        <button
                          onClick={() => handleDelete(upload.s3Key, upload.filename)}
                          disabled={deleting === upload.s3Key}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Supprimer ce fichier"
                        >
                          {deleting === upload.s3Key ? (
                            <Clock size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section Upload (droite - 1 colonne) */}
        <div className="col-span-1">
          <div className="bg-white border border-slate-200 rounded-lg p-6 sticky top-4">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <UploadIcon size={20} className="text-indigo-600" />
              Upload Scan
            </h3>

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50 transition-colors cursor-pointer"
            >
              <input
                id="file-input"
                type="file"
                accept=".xml"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label htmlFor="file-input" className="cursor-pointer">
                <UploadIcon size={32} className="mx-auto mb-3 text-slate-400" />
                <p className="text-sm text-slate-600 mb-1">
                  Cliquez ou glissez un fichier
                </p>
                <p className="text-xs text-slate-500">Format: XML PingCastle</p>
              </label>
            </div>

            {selectedFile && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <FileText size={16} className="text-blue-600" />
                  <span className="font-medium text-blue-800">{selectedFile.name}</span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className={`w-full mt-4 py-3 rounded-lg font-medium transition-colors ${
                !selectedFile || uploading
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {uploading ? 'Upload en cours...' : 'Uploader le fichier'}
            </button>

            {uploadResult && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle size={16} />
                  <span className="text-sm font-medium">Upload réussi!</span>
                </div>
                <p className="text-xs text-green-600 mt-1">Clé S3: {uploadResult.s3Key}</p>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle size={16} />
                  <span className="text-sm font-medium">{error}</span>
                </div>
              </div>
            )}

            <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> Les fichiers sont automatiquement traités.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
