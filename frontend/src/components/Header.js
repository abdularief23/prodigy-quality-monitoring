import React, { useRef } from 'react';

export default function Header({ onRefresh, onExcelUpload, uploading, analyzing }) {
  const fileInputRef = useRef(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      {/* Logo & Title */}
      <div>
        <h1 style={{ margin: '0 0 5px 0', fontSize: '28px' }}>⚙️ Prodigy</h1>
        <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
          AI-Powered Production Problem Detection System
        </p>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {/* Excel Upload Button */}
        <button
          onClick={handleUploadClick}
          disabled={uploading || analyzing}
          style={{
            background: uploading || analyzing ? '#999' : '#10b981',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: uploading || analyzing ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {uploading ? '⏳ Uploading...' : analyzing ? '🔍 Analyzing...' : '📤 Upload Excel'}
        </button>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={onExcelUpload}
          style={{ display: 'none' }}
          disabled={uploading || analyzing}
        />

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={uploading || analyzing}
          style={{
            background: uploading || analyzing ? '#999' : '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: uploading || analyzing ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          🔄 Refresh
        </button>
      </div>
    </div>
  );
}