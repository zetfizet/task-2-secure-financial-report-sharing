import { useState, useEffect } from 'react';
import { reportAPI, accessAPI } from '../services/api';
import ApproveButton from './ApproveButton';
import { showSuccess, showError, showWarning, showInfo } from './Notificationcontainer';

export default function OrganizationDashboard() {
  const [reports, setReports] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('reports');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    password: '',
    file: null,
  });
  const [selectedReport, setSelectedReport] = useState(null);
  const [decryptPassword, setDecryptPassword] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'reports') {
        const response = await reportAPI.getReports();
        setReports(response.data.data.reports);
      } else {
        const response = await accessAPI.getAccessRequests();
        setAccessRequests(response.data.data.accessRequests);
      }
    } catch (error) {
      console.error('Load data error:', error);
      showError('Failed to load data. Please refresh the page.', 'Load Error');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadReport = async (e) => {
    e.preventDefault();
    
    if (!uploadForm.title || !uploadForm.file || !uploadForm.password) {
      showWarning('Please fill in all required fields: title, file, and password.', 'Missing Fields');
      return;
    }

    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description);
      formData.append('password', uploadForm.password);
      formData.append('file', uploadForm.file);
      
      const response = await reportAPI.uploadReport(formData);
      showSuccess(`File "${uploadForm.title}" has been encrypted and uploaded successfully!`, 'Upload Complete');
      setShowUploadModal(false);
      setUploadForm({ title: '', description: '', password: '', file: null });
      loadData();
    } catch (error) {
      console.error('Upload error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to upload file';
      showError(errorMsg, 'Upload Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showError('File size exceeds 10MB limit. Please choose a smaller file.', 'File Too Large');
        e.target.value = '';
        return;
      }
      setUploadForm({ ...uploadForm, file });
      showInfo(`File "${file.name}" selected (${(file.size / 1024).toFixed(2)} KB)`, 'File Selected');
    }
  };

  const handleDecryptReport = async (report) => {
    if (!decryptPassword) {
      showWarning('Please enter your password to decrypt the file.', 'Password Required');
      return;
    }

    try {
      setLoading(true);
      const response = await reportAPI.decryptReport(report.id, decryptPassword);
      
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = report.fileName || 'decrypted-file';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showSuccess(`File "${report.fileName}" has been decrypted and downloaded!`, 'Download Complete');
      setDecryptPassword('');
      setSelectedReport(null);
    } catch (error) {
      console.error('Decrypt error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to decrypt file';
      showError(errorMsg, 'Decryption Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>📊 Organization Dashboard</h2>
        <p style={{ opacity: 0.95, marginTop: '0.75rem', fontSize: '1.05rem' }}>
          Manage encrypted files and approve access requests
        </p>
        <div className="header-actions">
          <button 
            onClick={() => setShowUploadModal(true)} 
            className="btn btn-primary"
            style={{ marginTop: '1.5rem' }}
          >
            ➕ Upload New File
          </button>
        </div>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'reports' ? 'active' : ''}`} 
          onClick={() => setActiveTab('reports')}
        >
          📄 My Files ({reports.length})
        </button>
        <button 
          className={`tab ${activeTab === 'requests' ? 'active' : ''}`} 
          onClick={() => setActiveTab('requests')}
        >
          📋 Access Requests ({accessRequests.filter(r => r.status === 'pending').length})
        </button>
      </div>

      {loading && <div className="loading">⏳ Loading data...</div>}

      {activeTab === 'reports' && !loading && (
        <div className="reports-list">
          {reports.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>📭</div>
              <p>No files uploaded yet</p>
              <button 
                onClick={() => setShowUploadModal(true)} 
                className="btn btn-primary"
                style={{ marginTop: '1.5rem' }}
              >
                ➕ Upload Your First File
              </button>
            </div>
          ) : (
            reports.map((report) => (
              <div key={report.id} className="card">
                <h3>📄 {report.title}</h3>
                {report.description && <p>{report.description}</p>}
                <div className="card-meta">
                  <span>📎 {report.fileName}</span>
                  <span>📦 {(report.fileSize / 1024).toFixed(2)} KB</span>
                  <span>📅 {new Date(report.createdAt).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}</span>
                </div>
                <div className="decrypt-section">
                  {selectedReport?.id === report.id ? (
                    <div className="form-group">
                      <label>🔐 Enter Password to Decrypt & Download</label>
                      <input 
                        type="password" 
                        value={decryptPassword} 
                        onChange={(e) => setDecryptPassword(e.target.value)} 
                        placeholder="Your password" 
                        className="form-control"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleDecryptReport(report);
                          }
                        }}
                      />
                      <div className="btn-group">
                        <button 
                          onClick={() => handleDecryptReport(report)} 
                          className="btn btn-primary btn-sm" 
                          disabled={loading || !decryptPassword}
                        >
                          {loading ? '⏳ Decrypting...' : '🔓 Download File'}
                        </button>
                        <button 
                          onClick={() => { 
                            setSelectedReport(null); 
                            setDecryptPassword('');
                          }} 
                          className="btn btn-secondary btn-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setSelectedReport(report)} 
                      className="btn btn-success btn-sm"
                    >
                      📥 Decrypt & Download
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'requests' && !loading && (
        <div className="requests-list">
          {accessRequests.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>📪</div>
              <p>No access requests yet</p>
            </div>
          ) : (
            accessRequests.map((request) => (
              <div key={request.id} className="card">
                <div className="request-header">
                  <div>
                    <h3>📄 {request.report?.title}</h3>
                    <p className="text-sm" style={{ color: '#64748b', marginTop: '0.5rem', fontWeight: 600 }}>
                      👤 Consultant: <strong>{request.consultant?.name}</strong>
                    </p>
                  </div>
                  <span className={`badge badge-${request.status}`}>
                    {request.status === 'pending' && '⏳ '}
                    {request.status === 'approved' && '✅ '}
                    {request.status === 'rejected' && '❌ '}
                    {request.status.toUpperCase()}
                  </span>
                </div>
                <div className="request-body">
                  <p style={{ fontWeight: 700, marginBottom: '0.5rem' }}>💬 Request Message:</p>
                  <p className="request-message">{request.requestMessage}</p>
                  {request.responseMessage && (
                    <>
                      <p style={{ marginTop: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                        📝 Your Response:
                      </p>
                      <p className="request-message" style={{ 
                        borderLeftColor: request.status === 'approved' ? '#10b981' : '#f43f5e'
                      }}>
                        {request.responseMessage}
                      </p>
                    </>
                  )}
                </div>
                <div className="card-meta">
                  <span>📅 Requested: {new Date(request.requestedAt).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                  {request.respondedAt && (
                    <span>✅ Responded: {new Date(request.respondedAt).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  )}
                </div>
                {request.status === 'pending' && (
                  <div className="card-actions">
                    <ApproveButton request={request} onSuccess={loadData} />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔐 Upload & Encrypt File</h3>
              <button onClick={() => setShowUploadModal(false)} className="close-btn">✕</button>
            </div>
            <form onSubmit={handleUploadReport}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="title">
                    📝 Title <span className="text-danger">*</span>
                  </label>
                  <input 
                    type="text" 
                    id="title" 
                    value={uploadForm.title} 
                    onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })} 
                    placeholder="e.g., Q4 Financial Report 2024" 
                    className="form-control" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="description">📄 Description</label>
                  <textarea 
                    id="description" 
                    value={uploadForm.description} 
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })} 
                    placeholder="Optional description" 
                    rows={3} 
                    className="form-control" 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="file">
                    📎 File <span className="text-danger">*</span>
                  </label>
                  <input 
                    type="file" 
                    id="file" 
                    onChange={handleFileChange} 
                    className="form-control" 
                    required 
                  />
                  {uploadForm.file && (
                    <small className="form-text" style={{ color: '#10b981', fontWeight: 700 }}>
                      ✅ {uploadForm.file.name} ({(uploadForm.file.size / 1024).toFixed(2)} KB)
                    </small>
                  )}
                  <small className="form-text">
                    📌 Supported: PDF, DOC, XLS, Images, Videos, etc. • Maximum: 10MB
                  </small>
                </div>
                <div className="form-group">
                  <label htmlFor="password">
                    🔑 Your Password <span className="text-danger">*</span>
                  </label>
                  <input 
                    type="password" 
                    id="password" 
                    value={uploadForm.password} 
                    onChange={(e) => setUploadForm({ ...uploadForm, password: e.target.value })} 
                    placeholder="Enter your password" 
                    className="form-control" 
                    required 
                  />
                  <small className="form-text">
                    🔒 Password is required to encrypt the file with your private key
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  onClick={() => setShowUploadModal(false)} 
                  className="btn btn-secondary" 
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={loading || !uploadForm.file}
                >
                  {loading ? '⏳ Uploading...' : '🔐 Upload & Encrypt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}