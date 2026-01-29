import React, { useEffect, useState } from 'react';
import { useLang } from '../i18n';
import { fetchData } from '../lib/data';
import { Link } from 'react-router-dom';
import TagChip from '../components/TagChip';

interface PromptDoc {
  title: string;
  page_url: string;
  tags: string[];
}

interface PromptData {
  [key: string]: PromptDoc;
}

const Home: React.FC = () => {
  const { t, lang } = useLang();
  const [promptData, setPromptData] = useState<PromptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dataSourceUrl = "https://academy.openai.com/public/tags/prompt-packs-6849a0f98c613939acef841c";

  useEffect(() => {
    const getPromptData = async () => {
      try {
        setLoading(true);
        const data = await fetchData<PromptData>('prompt', lang);
        setPromptData(data);
      } catch (err) {
        setError('Failed to load prompt data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    getPromptData();
  }, [lang]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!promptData || Object.keys(promptData).length === 0) return <div>{t('empty')}</div>;

  return (
    <div className="home-page">
      {/* 移除分類標題，只保留頁面內容 */}
      <div className="grid-container">
        {Object.entries(promptData).map(([key, doc], index) => {
          const filteredTags = doc.tags.filter(tag => !['WORK USERS', 'PROMPT PACKS'].includes(tag));

          return (
            <div 
              key={key} 
              className="card category-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="card-content">
                <h3>{doc.title}</h3>
                {filteredTags.length > 0 && (
                  <div className="tags-container">
                    {filteredTags.slice(0, 3).map(tag => (
                      <TagChip key={tag} tag={tag} />
                    ))}
                    {filteredTags.length > 3 && (
                      <span className="tag-more">+{filteredTags.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
              <Link to={`/c/${key}`} className="card-link">
                <button>{t('enter')}</button>
              </Link>
            </div>
          );
        })}
      </div>
      <div className="data-source-footer">
        <a href={dataSourceUrl} target="_blank" rel="noopener noreferrer" className="data-source-link">
          {t('dataSource')}
        </a>
      </div>
    </div>
  );
};

export default Home;
