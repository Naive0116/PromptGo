import React, { useState } from 'react';
import { useLang } from '../i18n';

interface CopyButtonProps {
  textToCopy: string;
  label?: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ textToCopy, label }) => {
  const { t } = useLang();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <button 
      onClick={handleCopy} 
      aria-live="polite"
      aria-label={copied ? t('copied') : (label || t('copy'))}
      title={copied ? t('copied') : (label || t('copy'))}
      className={`copy-button ${copied ? 'copied' : ''}`}
    >
      {copied ? (
        <span className="check-icon">✓</span>
      ) : (
        <>
          <span className="copy-icon">📋</span>
          {label && <span className="copy-label">{label}</span>}
        </>
      )}
    </button>
  );
};

export default CopyButton;
