import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLang } from '../i18n';
import { fetchData } from '../lib/data';
import Toolbar from '../components/Toolbar';
import CopyButton from '../components/CopyButton';
// import TagChip from '../components/TagChip'; // Remove TagChip import

interface Item {
  use_case: string;
  prompt: string;
  superPrompt: string;
  chatgpt_url: string;
}

interface CategoryDoc {
  title: string;
  page_url: string;
  tags: string[];
  items: Item[];
  scraped_at: string;
}

const Category: React.FC = () => {
  const { key } = useParams<{ key: string }>();
  const { t, lang } = useLang();
  const [categoryData, setCategoryData] = useState<CategoryDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [searchTerm, setSearchTerm] = useState<string>(''); // Remove searchTerm state

  useEffect(() => {
    const getCategoryData = async () => {
      if (!key) {
        setError('Category key is missing.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await fetchData<CategoryDoc>('category', lang, key);
        setCategoryData(data);
      } catch (err) {
        setError(`Failed to load category data for ${key}.`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    getCategoryData();
  }, [key, lang]);

  // Remove filteredItems logic as search is removed
  const displayedItems = categoryData?.items || [];

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!categoryData) return <div>{t('empty')}</div>;

  return (
    <div className="category-page">
      <Toolbar
        title={categoryData.title}
        itemCount={displayedItems.length}
        dataToDownload={categoryData}
        downloadFilename={categoryData.title}
      />

      {displayedItems.length === 0 ? (
        <div className="empty-state">{t('empty')}</div>
      ) : (
        <div className="prompts-grid">
          {displayedItems.map((item, index) => (
            <div 
              key={index} 
              className="card prompt-card"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="card-header">
                <h4>{item.use_case}</h4>
              </div>
              <div className="card-body">
                <p className="prompt-text">{item.prompt}</p>
              </div>
              <div className="card-actions">
                {item.chatgpt_url && (
                  <a href={ 'https://chatgpt.com/?prompt=' + item.prompt} target="_blank" rel="noopener noreferrer" className="action-link">
                    <button className="btn-primary">{t('openInChatGPT')}</button>
                  </a>
                )}
                <div className="copy-buttons">
                  <CopyButton textToCopy={item.use_case} label={t('useCase')} />
                  <CopyButton textToCopy={item.prompt} label={t('prompt')} />
                  {item.superPrompt && (
                    <CopyButton textToCopy={item.superPrompt} label={t('superPrompt')} />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Category;
