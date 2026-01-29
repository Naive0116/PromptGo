import { Outlet, Link } from 'react-router-dom';
import { useLang } from './i18n';
import LanguageSwitcher from './components/LanguageSwitcher';
import { useEffect } from 'react';
// import './App.css'; // Remove this import

function App() {
  const { t } = useLang();

  // Update document title based on language
  useEffect(() => {
    document.title = t('appTitle');
  }, [t]);

  return (
    <>
      <header className="app-header">
        <nav className="app-nav">
          <Link to="/" className="app-title-link">
            <h1>{t('appTitle')}</h1>
          </Link>
          <div className="header-actions">
            <a 
              href="https://chromewebstore.google.com/detail/chatgpt-prompt-assistant/biohjdkjclhempinkjfnjenpldjnkcfn"
              target="_blank"
              rel="noopener noreferrer"
              className="chrome-extension-link"
            >
              <button className="extension-button">
                <span className="chrome-icon">🧩</span>
                {t('chromeExtension')}
              </button>
            </a>
            <Link to="/teaching">
              <button className="teaching-button">{t('teachingPageTitle')}</button>
            </Link>
            <LanguageSwitcher />
          </div>
        </nav>
      </header>
      <main className="app-main">
        <Outlet /> {/* This is where the routed components will render */}
      </main>
    </>
  );
}

export default App;