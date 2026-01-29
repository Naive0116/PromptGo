import React from 'react';
import { useLang } from '../i18n';

const LanguageSwitcher: React.FC = () => {
  const { lang, setLang } = useLang();

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'zh-TW', label: '繁體中文' }
  ];

  return (
    <div className="language-switcher">
      <div className="language-buttons">
        {languages.map((language) => (
          <button
            key={language.code}
            onClick={() => setLang(language.code)}
            className={`language-button ${lang === language.code ? 'active' : ''}`}
            aria-label={`Switch to ${language.label}`}
          >
            <span className="language-label">{language.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSwitcher;