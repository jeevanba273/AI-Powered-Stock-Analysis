import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Newspaper, Sparkles, ExternalLink } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';

interface NewsArticle {
  title: string;
  summary?: string;
  url?: string;
  image_url?: string;
  pub_date?: string;
  source?: string;
  topics?: string[];
}

const CATEGORIES = [
  { key: 'stock_market', label: 'Stocks' },
  { key: 'mutual_funds', label: 'Mutual Funds' },
  { key: 'ipo', label: 'IPO' },
  { key: 'investing', label: 'Investing' },
  { key: 'economy', label: 'Economy' },
  { key: 'commodities', label: 'Commodities' },
];

const News: React.FC = () => {
  const navigate = useNavigate();
  const handleSelectStock = (ticker: string) => navigate(`/stock/${ticker}`);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [aiNews, setAiNews] = useState<NewsArticle[]>([]);
  const [aiCategory, setAiCategory] = useState('stock_market');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/proxy/dev/news?page_no=1&size=20`)
      .then(r => r.json())
      .then(data => {
        setNews(Array.isArray(data) ? data : []);
        setPage(1);
      })
      .catch(err => console.error('[News] Fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch(`/api/proxy/dev/ai_news?category=${aiCategory}`)
      .then(r => r.json())
      .then(data => {
        const articles = data?.articles || (Array.isArray(data) ? data : []);
        setAiNews(articles.map((a: any) => ({
          title: a.headline || a.title || '',
          summary: a.summary || '',
          url: a.url || '',
          pub_date: a.published_at || a.pub_date || '',
          source: a.source || '',
          topics: a.topics || [],
        })));
      })
      .catch(err => console.error('[AI News] Fetch error:', err));
  }, [aiCategory]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(`/api/proxy/dev/news?page_no=${nextPage}&size=20`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setNews(prev => [...prev, ...data]);
        setPage(nextPage);
      }
    } catch (err) {
      console.error('[News] Load more error:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const formatDate = (d: string | undefined) => {
    if (!d) return '';
    try {
      return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return d;
    }
  };

  const NewsCard: React.FC<{ article: NewsArticle }> = ({ article }) => (
    <div
      className="ns-card"
      style={{ padding: 16, cursor: article.url ? 'pointer' : 'default', transition: 'transform 0.15s ease' }}
      onClick={() => article.url && window.open(article.url, '_blank')}
      onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.4, marginBottom: 6 }}>{article.title}</div>
          {article.summary && (
            <p style={{ fontSize: 12, color: 'var(--ns-text-3)', lineHeight: 1.5, marginBottom: 8 }}>
              {article.summary.length > 150 ? article.summary.slice(0, 150) + '...' : article.summary}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10.5, color: 'var(--ns-text-4)' }}>
            {article.source && <span style={{ fontWeight: 600 }}>{article.source}</span>}
            {article.pub_date && <span>{formatDate(article.pub_date)}</span>}
            {article.url && <ExternalLink size={10} />}
          </div>
          {article.topics && article.topics.length > 0 && (
            <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
              {article.topics.slice(0, 3).map((topic, i) => (
                <span key={i} style={{
                  fontSize: 10, padding: '2px 8px', borderRadius: 99,
                  background: 'var(--ns-accent-soft)', color: 'var(--ns-accent)', fontWeight: 600
                }}>{topic}</span>
              ))}
            </div>
          )}
        </div>
        {article.image_url && (
          <img
            src={article.image_url}
            alt=""
            style={{ width: 80, height: 60, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        )}
      </div>
    </div>
  );

  return (
    <div className="ns-app">
      <Sidebar activeStock="" onSelectStock={handleSelectStock} />
      <main className="ns-main">
        <TopBar onSelectStock={handleSelectStock} />
        <div className="ns-content">
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="ns-fade-up">
        <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>News Feed</h1>
        <p style={{ fontSize: 13, color: 'var(--ns-text-3)', marginTop: 4 }}>Market news and AI-curated insights</p>
      </div>

      {/* AI-Curated News */}
      <div className="ns-card" style={{ padding: 18 }}>
        <div className="ns-card-header">
          <div className="ns-card-title"><Sparkles size={14} style={{ color: 'var(--ns-accent)' }} /> AI-Curated Insights</div>
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setAiCategory(cat.key)}
              style={{
                padding: '5px 12px', borderRadius: 8, fontSize: 11.5, fontWeight: 600,
                cursor: 'pointer', border: '1px solid var(--ns-border)', fontFamily: 'inherit',
                background: aiCategory === cat.key ? 'var(--ns-accent-soft)' : 'var(--ns-surface)',
                color: aiCategory === cat.key ? 'var(--ns-accent)' : 'var(--ns-text-3)',
                transition: 'all 0.15s ease'
              }}
            >{cat.label}</button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {aiNews.slice(0, 6).map((article, i) => (
            <NewsCard key={i} article={article} />
          ))}
        </div>
        {aiNews.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--ns-text-3)', fontSize: 13 }}>
            Loading AI-curated news...
          </div>
        )}
      </div>

      {/* Market News */}
      <div>
        <div className="ns-card-header" style={{ marginBottom: 12, padding: '0 2px' }}>
          <div className="ns-card-title"><Newspaper size={14} /> Market News</div>
          <div style={{ fontSize: 10.5, color: 'var(--ns-text-4)' }}>{news.length} articles</div>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="ns-card" style={{ padding: 16 }}>
                <div className="ns-skeleton" style={{ width: '90%', height: 14 }} />
                <div className="ns-skeleton" style={{ width: '70%', height: 12, marginTop: 8 }} />
                <div className="ns-skeleton" style={{ width: '40%', height: 10, marginTop: 8 }} />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
              {news.map((article, i) => (
                <NewsCard key={i} article={article} />
              ))}
            </div>
            {news.length > 0 && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <button className="ns-ai-cta" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? 'Loading...' : 'Load More News'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
        </div>
      </main>
    </div>
  );
};

export default News;
