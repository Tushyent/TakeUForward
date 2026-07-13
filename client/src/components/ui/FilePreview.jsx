import React, { useState } from 'react';
import { ExternalLink, X, Maximize2, FileText, Download } from 'lucide-react';

const FilePreview = ({ fileUrl, fileName, fileType }) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (!fileUrl) return null;

  // Infer basic type from URL extension or MIME
  const isImage = fileType?.startsWith('image/') || fileUrl.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i);
  const isPdf = fileType === 'application/pdf' || fileUrl.match(/\.(pdf)($|\?)/i);

  const renderInlinePreview = () => {
    if (isImage) {
      return (
        <div style={{ position: 'relative', width: '100%', maxWidth: '300px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', cursor: 'zoom-in', backgroundColor: 'var(--bg-main)' }} onClick={() => setIsLightboxOpen(true)}>
          <img src={fileUrl} alt={fileName || 'Preview'} style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(0,0,0,0.5)', color: '#fff', borderRadius: '50%', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Maximize2 size={14} />
          </div>
        </div>
      );
    }
    
    if (isPdf) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--bg-main)' }}>
          <FileText size={24} color="var(--primary)" />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontWeight: 500, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fileName || 'PDF Document'}</div>
            <a href={fileUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none' }}>Open in new tab <ExternalLink size={12} style={{ display: 'inline', verticalAlign: 'middle' }}/></a>
          </div>
        </div>
      );
    }

    // Fallback for docs, zip, etc.
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--bg-main)' }}>
        <Download size={24} color="var(--text-muted)" />
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontWeight: 500, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fileName || 'Download File'}</div>
          <a href={fileUrl} download style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none' }}>Download</a>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderInlinePreview()}

      {/* Lightbox for Images */}
      {isLightboxOpen && isImage && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            backdropFilter: 'blur(5px)'
          }}
          onClick={() => setIsLightboxOpen(false)}
        >
          <div 
            style={{ position: 'absolute', top: 20, right: 20, cursor: 'pointer', color: '#fff', padding: 8, background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}
            onClick={() => setIsLightboxOpen(false)}
          >
            <X size={24} />
          </div>
          <img 
            src={fileUrl} 
            alt={fileName || 'Fullscreen preview'} 
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '4px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} 
            onClick={e => e.stopPropagation()} 
          />
          <a 
            href={fileUrl} 
            target="_blank" 
            rel="noreferrer"
            onClick={e => e.stopPropagation()}
            style={{ position: 'absolute', bottom: 20, right: 20, color: '#fff', textDecoration: 'none', background: 'var(--primary)', padding: '8px 16px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem' }}
          >
            <ExternalLink size={16} /> Open Original
          </a>
        </div>
      )}
    </>
  );
};

export default FilePreview;
