import { useEffect, useMemo, useState } from 'react';
import { api } from '@appdeploy/client';
import { legacyQuotes } from './legacyQuotes';
import {
  ArrowDownToLine,
  Bookmark,
  Check,
  ChevronDown,
  Copy,
  Heart,
  History,
  Image as ImageIcon,
  Menu,
  MessageCircle,
  Moon,
  Plus,
  Search,
  Sparkles,
  Star,
  WandSparkles,
  X,
  Zap,
} from 'lucide-react';

type Quote = { id: string; text: string; author: string; category: string; citation?: string; year?: string };
type View = 'discover' | 'saved' | 'studio';

const categories = [
  'Motivation',
  'Success',
  'Life',
  'Love',
  'Wisdom',
  'Friendship',
  'Business',
  'Leadership',
  'Education',
  'Discipline',
  'Faith',
  'Confidence',
  'Happiness',
  'Personal Growth',
];
const starterQuotes: Quote[] = [
  {
    id: 'q1',
    text: 'Small steps taken consistently can lead to extraordinary places.',
    author: 'Quotify Original',
    category: 'Motivation',
  },
  {
    id: 'q2',
    text: 'Your future is shaped by what you choose to practice today.',
    author: 'Quotify Original',
    category: 'Success',
  },
  {
    id: 'q3',
    text: 'Make room for the life you are still learning to imagine.',
    author: 'Quotify Original',
    category: 'Life',
  },
];
const readSaved = (): Quote[] => {
  try {
    return JSON.parse(localStorage.getItem('quotify-saved') || '[]') as Quote[];
  } catch {
    return [];
  }
};

function App() {
  const [view, setView] = useState<View>('discover');
  const [category, setCategory] = useState('Motivation');
  const [topic, setTopic] = useState('');
  const [length, setLength] = useState('Any length');
  const [quotes, setQuotes] = useState<Quote[]>(starterQuotes);
  const [saved, setSaved] = useState<Quote[]>(readSaved);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [activeQuote, setActiveQuote] = useState<Quote>(starterQuotes[0]);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [design, setDesign] = useState('midnight');
  const [textColor, setTextColor] = useState('#f4f7ff');
  const [fontSize, setFontSize] = useState(30);
  const [authorVisible, setAuthorVisible] = useState(true);
  const [classicSearch, setClassicSearch] = useState('');

  useEffect(() => {
    localStorage.setItem('quotify-saved', JSON.stringify(saved));
  }, [saved]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 2400);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const toggleSave = (quote: Quote) => {
    const exists = saved.some(item => item.id === quote.id);
    setSaved(current =>
      exists
        ? current.filter(item => item.id !== quote.id)
        : [quote, ...current]
    );
    setNotice(
      exists ? 'Removed from your collection' : 'Saved to your collection'
    );
  };
  const isSaved = (quote: Quote) => saved.some(item => item.id === quote.id);

  const generate = async () => {
    if (topic.trim().length > 100) {
      setError('Keep your topic under 100 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/api/quotes/generate', {
        category,
        topic: topic.trim(),
        length,
      });
      const items = response.data?.quotes as
        | Array<{ text: string; author?: string }>
        | undefined;
      if (!Array.isArray(items) || items.length === 0)
        throw new Error('The generator returned no quotes. Please try again.');
      const generated = items
        .slice(0, 4)
        .map((item, index) => ({
          id: crypto.randomUUID(),
          text: String(item.text || '').trim(),
          author: String(item.author || 'Quotify Original').trim(),
          category,
        }))
        .filter(item => item.text);
      if (!generated.length)
        throw new Error('No usable quotes were returned. Please try again.');
      setQuotes(generated);
      setActiveQuote(generated[0]);
      setView('discover');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not generate quotes. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const copyQuote = async (quote: Quote) => {
    try {
      const credit = [quote.author, quote.citation, quote.year].filter(Boolean).join(' · ');
      await navigator.clipboard.writeText('“' + quote.text + '” — ' + credit);
      setNotice('Quote copied');
    } catch {
      setNotice('Copy is unavailable in this browser');
    }
  };

  const downloadDesign = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const gradients: Record<string, [string, string]> = {
      midnight: ['#07111f', '#123c59'],
      violet: ['#211338', '#6b45a1'],
      sunrise: ['#512b32', '#d58a55'],
      forest: ['#0c2925', '#35705d'],
    };
    const [a, b] = gradients[design] || gradients.midnight;
    const gradient = ctx.createLinearGradient(0, 0, 1080, 1350);
    gradient.addColorStop(0, a);
    gradient.addColorStop(1, b);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1350);
    ctx.fillStyle = 'rgba(255,255,255,.08)';
    ctx.beginPath();
    ctx.arc(920, 180, 280, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7de8ef';
    ctx.font = '600 28px Arial';
    ctx.fillText('✦ QUOTIFY', 100, 145);
    ctx.fillStyle = textColor;
    ctx.font = '500 ' + fontSize * 2 + 'px Georgia';
    const words = activeQuote.text.split(' ');
    const lines: string[] = [];
    let line = '';
    words.forEach(word => {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > 850 && line) {
        lines.push(line);
        line = word;
      } else line = test;
    });
    if (line) lines.push(line);
    const lineHeight = fontSize * 2.7;
    let y = (1350 - lines.length * lineHeight) / 2;
    lines.forEach(row => {
      ctx.fillText(row, 100, y);
      y += lineHeight;
    });
    if (authorVisible) {
      ctx.fillStyle = 'rgba(255,255,255,.72)';
      ctx.font = '32px Arial';
      ctx.fillText('— ' + activeQuote.author, 100, Math.min(y + 70, 1190));
    }
    ctx.fillStyle = 'rgba(255,255,255,.48)';
    ctx.font = '22px Arial';
    ctx.fillText('WORDS TO KEEP. IDEAS TO LIVE.', 100, 1270);
    const link = document.createElement('a');
    link.download = 'quotify-quote.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    setNotice('Your quote design is downloading');
  };

  const visibleQuotes = useMemo(
    () => (view === 'saved' ? saved : quotes),
    [view, saved, quotes]
  );
  const filteredClassicQuotes = useMemo(() => {
    const query = classicSearch.trim().toLowerCase();
    if (!query) return legacyQuotes;
    return legacyQuotes.filter(quote =>
      [quote.text, quote.author, quote.citation, quote.year]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [classicSearch]);

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <header className="topbar">
        <button
          className="brand"
          onClick={() => setView('discover')}
          aria-label="Quotify home"
        >
          <span className="brand-mark">
            <Sparkles size={19} />
          </span>
          <span>
            quotify<span className="brand-dot">.</span>
          </span>
        </button>
        <nav className={mobileMenu ? 'nav-links nav-open' : 'nav-links'}>
          <button
            className={view === 'discover' ? 'nav-link active' : 'nav-link'}
            onClick={() => {
              setView('discover');
              setMobileMenu(false);
            }}
          >
            Discover
          </button>
          <button
            className={view === 'saved' ? 'nav-link active' : 'nav-link'}
            onClick={() => {
              setView('saved');
              setMobileMenu(false);
            }}
          >
            My collection <span className="count">{saved.length}</span>
          </button>
          <button
            className={view === 'studio' ? 'nav-link active' : 'nav-link'}
            onClick={() => {
              setView('studio');
              setMobileMenu(false);
            }}
          >
            Design studio
          </button>
        </nav>
        <div className="top-actions">
          <span className="status-pill">
            <span /> AI is ready
          </span>
          <button
            className="icon-button mobile-toggle"
            onClick={() => setMobileMenu(!mobileMenu)}
            aria-label="Toggle navigation"
          >
            {mobileMenu ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <main className="main-content">
        <section className="welcome-row">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-line" /> YOUR DAILY DOSE OF PERSPECTIVE
            </div>
            <h1>
              Words that move you<span>.</span>
            </h1>
            <p className="subheading">
              Find the words. Feel the shift. Make them yours.
            </p>
          </div>
          <div className="date-chip">
            <Zap size={15} /> A little inspiration goes a long way
          </div>
        </section>

        {view === 'discover' && (
          <>
            <section className="generator-panel glass-panel">
              <div className="panel-heading">
                <div>
                  <span className="mini-label">THE QUOTE ENGINE</span>
                  <h2>What speaks to you today?</h2>
                  <p>Choose a feeling or follow a thought somewhere new.</p>
                </div>
                <div className="sparkle-orb">
                  <WandSparkles size={22} />
                </div>
              </div>
              <div className="field-label">EXPLORE A CATEGORY</div>
              <div className="category-list">
                {categories.map(item => (
                  <button
                    key={item}
                    className={
                      category === item
                        ? 'category-chip selected'
                        : 'category-chip'
                    }
                    onClick={() => setCategory(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div className="generator-controls">
                <label className="topic-field">
                  <Search size={18} />
                  <input
                    value={topic}
                    onChange={event => setTopic(event.target.value)}
                    onKeyDown={event => {
                      if (event.key === 'Enter') void generate();
                    }}
                    placeholder="Or enter a topic, feeling, or idea..."
                    maxLength={100}
                  />
                  <span>{topic.length}/100</span>
                </label>
                <label className="length-select">
                  <span>LENGTH</span>
                  <select
                    value={length}
                    onChange={event => setLength(event.target.value)}
                  >
                    <option>Any length</option>
                    <option>Short and punchy</option>
                    <option>Thoughtful and detailed</option>
                  </select>
                  <ChevronDown size={15} />
                </label>
                <button
                  className="generate-button"
                  onClick={() => void generate()}
                  disabled={loading}
                >
                  <Sparkles size={17} />
                  {loading ? 'Creating...' : 'Generate quotes'}
                </button>
              </div>
              {error && (
                <div className="error-message" role="alert">
                  {error}
                </div>
              )}
              <div className="panel-foot">
                <span>
                  <span className="tiny-pulse" /> Original ideas, made with AI
                </span>
                <span>Made for your next chapter</span>
              </div>
            </section>

            <section className="results-section">
              <div className="section-heading">
                <div>
                  <span className="mini-label">FRESH PERSPECTIVES</span>
                  <h2>
                    {topic
                      ? 'Inspired by “' + topic + '”'
                      : category + ' quotes'}
                  </h2>
                </div>
                <span className="result-count">{quotes.length} QUOTES</span>
              </div>
              <div className="quote-grid">
                {visibleQuotes.map((quote, index) => (
                  <article className="quote-card glass-panel" key={quote.id}>
                    <div className="quote-card-top">
                      <span className="quote-number">0{index + 1}</span>
                      <span className="quote-category">{quote.category}</span>
                    </div>
                    <div className="quote-glyph">“</div>
                    <p className="quote-text">{quote.text}</p>
                    <div className="quote-card-bottom">
                      <span className="quote-author">— {quote.author}{quote.citation ? ' · ' + quote.citation : ''}{quote.year ? ' · ' + quote.year : ''}</span>
                      <div className="quote-actions">
                        <button
                          title="Copy quote"
                          onClick={() => void copyQuote(quote)}
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          title={
                            isSaved(quote) ? 'Remove from saved' : 'Save quote'
                          }
                          className={isSaved(quote) ? 'is-favourite' : ''}
                          onClick={() => toggleSave(quote)}
                        >
                          <Heart
                            size={17}
                            fill={isSaved(quote) ? 'currentColor' : 'none'}
                          />
                        </button>
                        <button
                          title="Design this quote"
                          onClick={() => {
                            setActiveQuote(quote);
                            setView('studio');
                          }}
                        >
                          <ImageIcon size={17} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              <button
                className="more-button"
                onClick={() => void generate()}
                disabled={loading}
              >
                <WandSparkles size={16} />{' '}
                {loading ? 'Creating...' : 'Generate another set'}
              </button>
            </section>

            <section className="archive-section">
              <div className="section-heading archive-heading">
                <div>
                  <span className="mini-label">YOUR UPLOADED COLLECTION</span>
                  <h2>Classic quote archive<span>.</span></h2>
                  <p className="section-subtitle">All 37 quotes from your original script, including their source, citation and year details.</p>
                </div>
                <span className="result-count">{filteredClassicQuotes.length} / {legacyQuotes.length} QUOTES</span>
              </div>
              <label className="archive-search">
                <Search size={17} />
                <input value={classicSearch} onChange={event => setClassicSearch(event.target.value)} placeholder="Search quotes, authors or book titles..." aria-label="Search classic quotes" />
                {classicSearch && <button type="button" onClick={() => setClassicSearch('')} aria-label="Clear search"><X size={15} /></button>}
              </label>
              {filteredClassicQuotes.length ? (
                <div className="quote-grid archive-grid">
                  {filteredClassicQuotes.map((quote, index) => (
                    <article className="quote-card glass-panel archive-card" key={quote.id}>
                      <div className="quote-card-top">
                        <span className="quote-number">C{String(index + 1).padStart(2, '0')}</span>
                        <span className="quote-category">CLASSIC</span>
                      </div>
                      <div className="quote-glyph">“</div>
                      <p className="quote-text">{quote.text}</p>
                      <div className="quote-card-bottom">
                        <span className="quote-author">— {quote.author}{quote.citation ? ' · ' + quote.citation : ''}{quote.year ? ' · ' + quote.year : ''}</span>
                        <div className="quote-actions">
                          <button title="Copy quote" onClick={() => void copyQuote(quote)}><Copy size={16} /></button>
                          <button title={isSaved(quote) ? 'Remove from saved' : 'Save quote'} className={isSaved(quote) ? 'is-favourite' : ''} onClick={() => toggleSave(quote)}><Heart size={17} fill={isSaved(quote) ? 'currentColor' : 'none'} /></button>
                          <button title="Design this quote" onClick={() => { setActiveQuote(quote); setView('studio'); }}><ImageIcon size={17} /></button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : <div className="archive-empty">No classic quotes match that search.</div>}
            </section>
          </>
        )}

        {view === 'saved' && (
          <section className="results-section view-section">
            <div className="section-heading">
              <div>
                <span className="mini-label">YOUR PERSONAL LIBRARY</span>
                <h2>
                  Words worth keeping<span>.</span>
                </h2>
                <p className="section-subtitle">
                  Your favourite thoughts, all in one place.
                </p>
              </div>
              <span className="result-count">{saved.length} SAVED</span>
            </div>
            {saved.length ? (
              <div className="quote-grid">
                {saved.map((quote, index) => (
                  <article className="quote-card glass-panel" key={quote.id}>
                    <div className="quote-card-top">
                      <span className="quote-number">0{index + 1}</span>
                      <span className="quote-category">{quote.category}</span>
                    </div>
                    <div className="quote-glyph">“</div>
                    <p className="quote-text">{quote.text}</p>
                    <div className="quote-card-bottom">
                      <span className="quote-author">— {quote.author}{quote.citation ? ' · ' + quote.citation : ''}{quote.year ? ' · ' + quote.year : ''}</span>
                      <div className="quote-actions">
                        <button
                          onClick={() => void copyQuote(quote)}
                          title="Copy"
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          className="is-favourite"
                          onClick={() => toggleSave(quote)}
                          title="Remove"
                        >
                          <Heart size={17} fill="currentColor" />
                        </button>
                        <button
                          onClick={() => {
                            setActiveQuote(quote);
                            setView('studio');
                          }}
                          title="Design"
                        >
                          <ImageIcon size={17} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  <Bookmark size={25} />
                </div>
                <h3>Your collection starts here</h3>
                <p>
                  Save quotes that resonate with you and they’ll be waiting
                  here.
                </p>
                <button
                  className="generate-button"
                  onClick={() => setView('discover')}
                >
                  Explore quotes
                </button>
              </div>
            )}
          </section>
        )}

        {view === 'studio' && (
          <section className="studio-section view-section">
            <div className="section-heading">
              <div>
                <span className="mini-label">CREATIVE PLAYGROUND</span>
                <h2>
                  Give your words a canvas<span>.</span>
                </h2>
                <p className="section-subtitle">
                  Turn a thought into something worth sharing.
                </p>
              </div>
              <span className="result-count">DESIGN STUDIO</span>
            </div>
            <div className="studio-layout">
              <div className={'poster-preview poster-' + design}>
                <div className="poster-brand">
                  <Sparkles size={16} /> QUOTIFY
                </div>
                <div
                  className="poster-copy"
                  style={{ color: textColor, fontSize: fontSize }}
                >
                  {activeQuote.text}
                </div>
                {authorVisible && (
                  <div className="poster-author">— {activeQuote.author}{activeQuote.citation ? ' · ' + activeQuote.citation : ''}{activeQuote.year ? ' · ' + activeQuote.year : ''}</div>
                )}
                <div className="poster-footer">
                  WORDS TO KEEP. IDEAS TO LIVE.
                </div>
              </div>
              <div className="studio-controls glass-panel">
                <div className="control-heading">
                  <h3>Make it yours</h3>
                  <span>LIVE EDITOR</span>
                </div>
                <label className="control-label">BACKGROUND STYLE</label>
                <div className="theme-options">
                  {['midnight', 'violet', 'sunrise', 'forest'].map(item => (
                    <button
                      key={item}
                      className={
                        'theme-swatch swatch-' +
                        item +
                        (design === item ? ' chosen' : '')
                      }
                      onClick={() => setDesign(item)}
                      aria-label={item}
                    />
                  ))}
                </div>
                <label className="control-label">TEXT COLOUR</label>
                <div className="color-options">
                  {['#f4f7ff', '#7de8ef', '#f6d59a', '#f2a8c8'].map(color => (
                    <button
                      key={color}
                      className={
                        'color-swatch' + (textColor === color ? ' chosen' : '')
                      }
                      style={{ background: color }}
                      onClick={() => setTextColor(color)}
                      aria-label={'Text colour ' + color}
                    />
                  ))}
                </div>
                <label className="control-label">
                  TEXT SIZE <span>{fontSize}px</span>
                </label>
                <input
                  className="size-slider"
                  type="range"
                  min="20"
                  max="42"
                  value={fontSize}
                  onChange={event => setFontSize(Number(event.target.value))}
                />
                <label className="check-control">
                  <input
                    type="checkbox"
                    checked={authorVisible}
                    onChange={event => setAuthorVisible(event.target.checked)}
                  />{' '}
                  Show author credit
                </label>
                <button
                  className="generate-button export-button"
                  onClick={() => void downloadDesign()}
                >
                  <ArrowDownToLine size={17} /> Download PNG
                </button>
                <button
                  className="secondary-button"
                  onClick={() => setView('discover')}
                >
                  Choose another quote
                </button>
              </div>
            </div>
          </section>
        )}
      </main>
      <footer className="footer">
        <div className="footer-brand">
          <span className="brand-mark">
            <Sparkles size={16} />
          </span>{' '}
          quotify<span className="brand-dot">.</span>
        </div>
        <span>Make words matter.</span>
        <span>© 2026 QUOTIFY</span>
      </footer>
      {notice && (
        <div className="toast">
          <Check size={16} />
          {notice}
        </div>
      )}
    </div>
  );
}

export default App;
