import React from 'react';
import { useLang } from '../i18n';

interface DownloadMenuProps {
  data: any; // The JSON data to download (expected to be CategoryDoc)
  filename: string; // The base filename (e.g., category title)
}

const DownloadMenu: React.FC<DownloadMenuProps> = ({ data, filename }) => {
  const { t } = useLang();

  const handleDownload = () => {
    const transformedData: { superPrompt: any[] } = {
      superPrompt: [],
    };

    // Transform existing items
    if (data && data.items && Array.isArray(data.items)) {
      data.items.forEach((item: any) => {
        transformedData.superPrompt.push({
          text: item.use_case,
          prompt: item.superPrompt,
          isVisible: true, // Changed to true
        });
      });
    }

    // Pad with placeholders if less than 50 items
    const targetCount = 50;
    for (let i = transformedData.superPrompt.length + 1; i <= targetCount; i++) {
      transformedData.superPrompt.push({
        text: `SuperPrompt${i.toString().padStart(2, '0')}`,
        prompt: '',
        isVisible: true, // Changed to true
      });
    }

    const jsonString = JSON.stringify(transformedData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`; // Append .json here
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <button onClick={handleDownload}>
      {t('downloadJson')}
    </button>
  );
};

export default DownloadMenu;