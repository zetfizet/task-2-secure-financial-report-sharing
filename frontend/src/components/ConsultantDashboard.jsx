import { useState, useEffect } from 'react';
import { reportAPI, accessAPI } from '../services/api';
import AccessRequestButton from './AccessRequestButton';
import { showSuccess, showError, showWarning, showInfo } from './Notificationcontainer';

export default function ConsultantDashboard() {
  const [reports, setReports] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reports');
  const [decryptPassword, setDecryptPassword] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);

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

  const handleDecryptReport = async (request) => {
    if (!decryptPassword) {
      showWarning('Please enter your password to decrypt the file.', 'Password Required');
      return;
    }

    try {
      setLoading(true);
      const response = await accessAPI.decryptReport(request.id, decryptPassword);
      
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = request.report?.fileName || 'decrypted-file';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showSuccess(
        `File "${request.report?.fileName}" has been decrypted and downloaded!`, 
        'Download Complete'
      );
      setDecryptPassword('');
      setSelectedRequest(null);
    } catch (error) {
      console.error('Decrypt error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to decrypt report';
      showError(errorMsg, 'Decryption Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSuccess = () => {
    showSuccess('Access request sent successfully! Wait for organization approval.', 'Request Sent');
    setActiveTab('requests');
    loadData();
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { icon: '⏳', color: '#fef3c7', textColor: '#92400e', text: 'PENDING' },
      approved: { icon: '✅', color: '#d1fae5', textColor: '#065f46', text: 'APPROVED' },
      rejected: { icon: '❌', color: '#fee2e2', textColor: '#991b1b', text: 'REJECTED' }
    };
    return badges[status] || badges.pending;
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>👤 Consultant Dashboard</h2>
        <p style={{ opacity: 0.95, marginTop: '0.75rem', fontSize: '1.05rem' }}>
          Browse files, request access, and download approved files
        </p>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          📄 Available Files ({reports.length})
        </button>
        <button
          className={`tab ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          📋 My Requests ({accessRequests.length})
        </button>
      </div>

      {loading && <div className="loading">⏳ Loading data...</div>}

      {activeTab === 'reports' && !loading && (
        <div className="reports-list">
          {reports.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>📭</div>
              <p>No files available</p>
              <small style={{ color: '#64748b', marginTop: '0.75rem', display: 'block', fontWeight: 600 }}>
                Contact organizations to get file access
              </small>
            </div>
          ) : (
            reports.map((report) => (
              <div key={report.id} className="card">
                <h3>📄 {report.title}</h3>
                {report.description && <p>{report.description}</p>}
                <div className="card-meta">
                  <span>🏢 Organization: <strong>{report.organization?.name}</strong></span>
                  <span>📎 {report.fileName}</span>
                  <span>📦 {(report.fileSize / 1024).toFixed(2)} KB</span>
                  <span>📅 {new Date(report.createdAt).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}</span>
                </div>
                <div className="card-actions">
                  <AccessRequestButton
                    report={report}
                    onSuccess={handleRequestSuccess}
                  />
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
              <p>No requests yet</p>
              <small style={{ color: '#64748b', marginTop: '0.75rem', display: 'block', fontWeight: 600 }}>
                Request access to files in "Available Files" tab
              </small>
            </div>
          ) : (
            accessRequests.map((request) => {
              const badge = getStatusBadge(request.status);
              
              return (
                <div key={request.id} className="card">
                  <div className="request-header">
                    <div>
                      <h3>📄 {request.report?.title}</h3>
                      <p className="text-sm" style={{ color: '#64748b', marginTop: '0.5rem', fontWeight: 600 }}>
                        🏢 Organization: <strong>{request.organization?.name}</strong>
                      </p>
                    </div>
                    <span className={`badge badge-${request.status}`}>
                      {badge.icon} {badge.text}
                    </span>
                  </div>
                  
                  <div className="request-body">
                    <p style={{ fontWeight: 700, marginBottom: '0.5rem' }}>💬 Your Request Message:</p>
                    <p className="request-message">{request.requestMessage}</p>
                    
                    {request.responseMessage && (
                      <>
                        <p style={{ marginTop: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                          {request.status === 'approved' ? '✅ Approval Message:' : '❌ Rejection Message:'}
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
                      <span>
                        {request.status === 'approved' ? '✅' : '❌'} Responded: {new Date(request.respondedAt).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    )}
                  </div>

                  {request.status === 'approved' && (
                    <div className="decrypt-section">
                      {selectedRequest?.id === request.id ? (
                        <div className="form-group">
                          <label>🔐 Enter Password to Decrypt File</label>
                          <input
                            type="password"
                            value={decryptPassword}
                            onChange={(e) => setDecryptPassword(e.target.value)}
                            placeholder="Your password"
                            className="form-control"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleDecryptReport(request);
                              }
                            }}
                          />
                          <div className="btn-group">
                            <button
                              onClick={() => handleDecryptReport(request)}
                              className="btn btn-primary btn-sm"
                              disabled={loading || !decryptPassword}
                            >
                              {loading ? '⏳ Decrypting...' : '🔓 Decrypt & Download'}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRequest(null);
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
                          onClick={() => setSelectedRequest(request)}
                          className="btn btn-success btn-sm"
                        >
                          🔓 View & Download File
                        </button>
                      )}
                    </div>
                  )}

                  {request.status === 'pending' && (
                    <div style={{
                      marginTop: '1.25rem',
                      padding: '1.25rem',
                      background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%)',
                      borderRadius: '0.75rem',
                      borderLeft: '4px solid #f59e0b'
                    }}>
                      <p style={{ color: '#92400e', margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
                        ⏳ <strong>Waiting for approval</strong> from organization
                      </p>
                    </div>
                  )}

                  {request.status === 'rejected' && (
                    <div style={{
                      marginTop: '1.25rem',
                      padding: '1.25rem',
                      background: 'linear-gradient(135deg, rgba(254, 226, 226, 0.5) 0%, rgba(252, 165, 165, 0.3) 100%)',
                      borderRadius: '0.75rem',
                      borderLeft: '4px solid #f43f5e'
                    }}>
                      <p style={{ color: '#991b1b', margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
                        ❌ <strong>Request rejected</strong> by organization
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}