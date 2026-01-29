import React from 'react';
import { useLang } from '../i18n';
import Toolbar from '../components/Toolbar';

const Teaching: React.FC = () => {
  const { t, lang } = useLang();
  
  // Different video IDs for different languages
  const videoIds = {
    'zh-TW': 'plKUBosprDw', // Placeholder for Chinese video
    'en': 'gn-ulmpToao'     // Placeholder for English video
  };
  
  const youtubeVideoId = videoIds[lang as keyof typeof videoIds] || videoIds['zh-TW'];

  return (
    <div>
      <Toolbar title={t('teachingPageTitle')} disableCopy={true} />
      {/* Removed h1 and p tags */}
      {/* <h1>{t('teachingPageTitle')}</h1> */}
      {/* <p>How to use this application. Watch the video below:</p> */}
      <div className="video-container">
        <iframe
          width="560"
          height="315"
          src={`https://www.youtube.com/embed/${youtubeVideoId}`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
};

export default Teaching;