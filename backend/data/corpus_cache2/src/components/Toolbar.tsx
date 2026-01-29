import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../i18n';
import DownloadMenu from './DownloadMenu'; // Assuming DownloadMenu is created

interface ToolbarProps {
  title: string;
  itemCount?: number;
  dataToDownload?: any;
  downloadFilename?: string;
  disableCopy?: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({ title, itemCount, dataToDownload, downloadFilename, disableCopy }) => {
  const { t } = useLang();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleBack = () => {
    navigate(-1);
  };

  const handleCopyTitle = async () => {
    try {
      await navigator.clipboard.writeText(title);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (err) {
      console.error('Failed to copy title: ', err);
    }
  };

  return (
    <div className="toolbar">
      <button onClick={handleBack} className="back-button">
        <span className="back-icon">←</span>
        {t('back')}
      </button>
      <div className="toolbar-title-group">
        {disableCopy ? (
          <h2>
            {title}
          </h2>
        ) : (
          <h2 
            onClick={handleCopyTitle} 
            className={`clickable-title ${copied ? 'copied' : ''}`}
            title={copied ? t('copied') : t('copy')}
          >
            {title} <span className="copy-icon">{copied ? '✓' : '📋'}</span>
          </h2>
        )}
        {itemCount !== undefined && (
          <span className="count-badge">{itemCount}</span>
        )}
      </div>
      {dataToDownload && downloadFilename && (
        <DownloadMenu data={dataToDownload} filename={downloadFilename} />
      )}
    </div>
  );
};

export default Toolbar;
