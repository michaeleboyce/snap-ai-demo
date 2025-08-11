'use client';

import { useState, useCallback } from 'react';
import { Upload, X, CheckCircle, AlertCircle, FileText } from 'lucide-react';

interface Document {
  id: string;
  name: string;
  type: string;
  status: 'pending' | 'uploaded' | 'rejected';
  url?: string;
  notes?: string;
}

interface DocumentUploadProps {
  sessionId: string;
  onDocumentUpload?: (doc: Document) => void;
}

const REQUIRED_DOCUMENTS = [
  { id: 'income', label: 'Proof of Income', types: 'Pay stubs, employment letter, benefit statements' },
  { id: 'identity', label: 'Photo ID', types: 'Driver\'s license, state ID, passport' },
  { id: 'residence', label: 'Proof of Residence', types: 'Utility bill, lease agreement, mail' },
  { id: 'household', label: 'Household Composition', types: 'Birth certificates, school enrollment' },
  { id: 'expenses', label: 'Expense Documentation', types: 'Rent receipts, medical bills, childcare costs' },
];

export default function DocumentUpload({ sessionId, onDocumentUpload }: DocumentUploadProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = useCallback(async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    const docId = `doc_${Date.now()}`;
    const newDoc: Document = {
      id: docId,
      name: file.name,
      type: file.type,
      status: 'pending',
    };

    setDocuments(prev => [...prev, newDoc]);
    setUploading(docId);

    // Simulate upload (in real app, upload to S3 or storage service)
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sessionId', sessionId);
      formData.append('documentId', docId);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update document status
      setDocuments(prev =>
        prev.map(doc =>
          doc.id === docId
            ? { ...doc, status: 'uploaded', url: URL.createObjectURL(file) }
            : doc
        )
      );

      if (onDocumentUpload) {
        onDocumentUpload({ ...newDoc, status: 'uploaded' });
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setDocuments(prev =>
        prev.map(doc =>
          doc.id === docId
            ? { ...doc, status: 'rejected', notes: 'Upload failed' }
            : doc
        )
      );
    } finally {
      setUploading(null);
    }
  }, [sessionId, onDocumentUpload]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const removeDocument = (docId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== docId));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-900/5 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Document Upload</h2>
      
      {/* Required Documents List */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Required Documents</h3>
        <div className="space-y-2">
          {REQUIRED_DOCUMENTS.map(doc => (
            <div key={doc.id} className="flex items-start gap-2 text-sm">
              <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <span className="font-medium text-gray-900">{doc.label}</span>
                <p className="text-gray-500 text-xs">{doc.types}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Zone */}
      <form
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="document-upload"
          className="hidden"
          multiple
          onChange={handleChange}
          accept="image/*,.pdf,.doc,.docx"
        />
        
        <label
          htmlFor="document-upload"
          className="flex flex-col items-center justify-center cursor-pointer"
        >
          <Upload className="w-10 h-10 text-gray-400 mb-3" />
          <p className="text-sm text-gray-700 font-medium">
            Drop files here or click to upload
          </p>
          <p className="text-xs text-gray-500 mt-1">
            PDF, JPG, PNG up to 10MB
          </p>
        </label>
      </form>

      {/* Uploaded Documents */}
      {documents.length > 0 && (
        <div className="mt-6 space-y-2">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Uploaded Documents</h3>
          {documents.map(doc => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                {uploading === doc.id ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-600" />
                ) : doc.status === 'uploaded' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : doc.status === 'rejected' ? (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                ) : (
                  <FileText className="w-5 h-5 text-gray-400" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                  {doc.notes && (
                    <p className="text-xs text-red-600">{doc.notes}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => removeDocument(doc.id)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}