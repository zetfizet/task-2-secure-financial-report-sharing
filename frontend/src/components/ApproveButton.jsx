import { useState } from 'react';
import { accessAPI } from '../services/api';

/**
 * Tombol Approve/Reject Request untuk Organization
 */
export default function ApproveButton({ request, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState(''); // 'approve' or 'reject'
  const [password, setPassword] = useState('');
  const [responseMessage, setResponseMessage] = useState('');

  const handleOpenModal = (actionType) => {
    setAction(actionType);
    setShowModal(true);
    setPassword('');
    setResponseMessage('');
  };

  const handleSubmit = async () => {
    if (action === 'approve' && !password) {
      alert('Password harus diisi untuk approve request');
      return;
    }

    try {
      setLoading(true);
      let response;

      if (action === 'approve') {
        response = await accessAPI.approveRequest(request.id, {
          password,
          responseMessage,
        });
      } else {
        response = await accessAPI.rejectRequest(request.id, {
          responseMessage,
        });
      }

      alert(response.data.message);
      setShowModal(false);
      
      if (onSuccess) {
        onSuccess(response.data.data.accessRequest);
      }
    } catch (error) {
      console.error(`${action} request error:`, error);
      alert(
        error.response?.data?.message ||
          `Gagal ${action === 'approve' ? 'approve' : 'reject'} request`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="action-buttons">
        <button
          onClick={() => handleOpenModal('approve')}
          className="btn btn-success btn-sm"
          disabled={loading || request.status !== 'pending'}
        >
          ✅ Approve
        </button>
        <button
          onClick={() => handleOpenModal('reject')}
          className="btn btn-danger btn-sm"
          disabled={loading || request.status !== 'pending'}
        >
          ❌ Reject
        </button>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {action === 'approve' ? 'Approve' : 'Reject'} Access Request
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="close-btn"
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="request-info">
                <h4>{request.report?.title}</h4>
                <p>
                  <strong>Consultant:</strong> {request.consultant?.name} (
                  {request.consultant?.email})
                </p>
                <p>
                  <strong>Request Message:</strong>
                </p>
                <p className="request-message">{request.requestMessage}</p>
              </div>

              {action === 'approve' && (
                <div className="form-group">
                  <label htmlFor="password">
                    Password Anda <span className="text-danger">*</span>
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password untuk decrypt key"
                    className="form-control"
                  />
                  <small className="form-text">
                    Password diperlukan untuk decrypt AES key
                  </small>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="responseMessage">Response Message (Opsional)</label>
                <textarea
                  id="responseMessage"
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder={
                    action === 'approve'
                      ? 'Pesan untuk consultant (opsional)...'
                      : 'Alasan penolakan (opsional)...'
                  }
                  rows={3}
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
                onClick={handleSubmit}
                className={`btn ${
                  action === 'approve' ? 'btn-success' : 'btn-danger'
                }`}
                disabled={loading || (action === 'approve' && !password)}
              >
                {loading
                  ? 'Processing...'
                  : action === 'approve'
                  ? 'Approve'
                  : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
