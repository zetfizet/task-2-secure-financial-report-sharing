import { useState } from 'react';
import { accessAPI } from '../services/api';

/**
 * Tombol Request Access untuk Consultant
 */
export default function AccessRequestButton({ report, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [showModal, setShowModal] = useState(false);

  const handleRequestAccess = async () => {
    if (!requestMessage.trim()) {
      alert('Silakan masukkan pesan request');
      return;
    }

    try {
      setLoading(true);
      const response = await accessAPI.requestAccess({
        reportId: report.id,
        requestMessage,
      });

      alert(response.data.message);
      setShowModal(false);
      setRequestMessage('');
      
      if (onSuccess) {
        onSuccess(response.data.data.accessRequest);
      }
    } catch (error) {
      console.error('Request access error:', error);
      alert(
        error.response?.data?.message || 'Gagal mengirim request akses'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="btn btn-primary"
        disabled={loading}
      >
        📨 Request Access
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Request Access ke Report</h3>
              <button
                onClick={() => setShowModal(false)}
                className="close-btn"
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="report-info">
                <h4>{report.title}</h4>
                <p>{report.description}</p>
                <p className="text-sm">
                  Organization: {report.organization?.name}
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="requestMessage">Pesan Request</label>
                <textarea
                  id="requestMessage"
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder="Tuliskan alasan Anda meminta akses ke report ini..."
                  rows={4}
                  className="form-control"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-secondary"
                disabled={loading}
              >
                Batal
              </button>
              <button
                onClick={handleRequestAccess}
                className="btn btn-primary"
                disabled={loading || !requestMessage.trim()}
              >
                {loading ? 'Mengirim...' : 'Kirim Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
