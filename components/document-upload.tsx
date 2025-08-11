'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, Check, X, Loader2 } from 'lucide-react';

interface Document {
  id: string;
  name: string;
  type: string;
  status: 'pending' | 'uploaded' | 'verified' | 'rejected';
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
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files: FileList) => {
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
  };

  const removeDocument = (docId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== docId));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Document Verification</h3>

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="sr-only"
          onChange={handleChange}
          accept="image/*,.pdf,.doc,.docx"
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer flex flex-col items-center"
        >
          <Upload className="w-12 h-12 text-gray-400 mb-3" />
          <p className="text-sm text-gray-700 font-medium">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-gray-500 mt-1">
            PDF, PNG, JPG, DOC up to 10MB
          </p>
        </label>
      </div>

      {/* Uploaded Documents */}
      {documents.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Uploaded Documents</h4>
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                  <p className="text-xs text-gray-500">
                    {doc.status === 'pending' && 'Uploading...'}
                    {doc.status === 'uploaded' && 'Uploaded successfully'}
                    {doc.status === 'verified' && 'Verified'}
                    {doc.status === 'rejected' && `Rejected: ${doc.notes}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {doc.id === uploading && (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                )}
                {doc.status === 'uploaded' && (
                  <Check className="w-4 h-4 text-green-600" />
                )}
                {doc.status === 'rejected' && (
                  <X className="w-4 h-4 text-red-600" />
                )}
                <button
                  onClick={() => removeDocument(doc.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Required Documents Checklist */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Required Documents</h4>
        <div className="space-y-2">
          {REQUIRED_DOCUMENTS.map((req) => {
            const hasDoc = documents.some(
              doc => doc.status === 'uploaded' || doc.status === 'verified'
            );
            return (
              <div key={req.id} className="flex items-start gap-3">
                <div className={`mt-0.5 w-4 h-4 rounded-full border-2 ${
                  hasDoc ? 'bg-green-500 border-green-500' : 'border-gray-300'
                }`}>
                  {hasDoc && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{req.label}</p>
                  <p className="text-xs text-gray-500">{req.types}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}