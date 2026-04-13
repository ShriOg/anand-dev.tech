export default function Home() {
  return (
    <>
      <section className="hero-section">
          <h1 className="hero-title">
              <span className="title-line">Welcome to</span>
              <span className="title-brand">anand.dev</span>
          </h1>
          <p className="hero-subtitle">Building Systems. Not Just Websites.</p>
      </section>

      <section className="cards-section">
          <div className="cards-container">
              <a href="webos/" className="feature-card" data-card="webos">
                  <div className="card-glow"></div>
                  <div className="card-content">
                      <div className="card-icon">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                              <line x1="8" y1="21" x2="16" y2="21"></line>
                              <line x1="12" y1="17" x2="12" y2="21"></line>
                          </svg>
                      </div>
                      <h2 className="card-title">Web OS</h2>
                      <p className="card-description">A complete operating system in your browser. Files, apps, AI integration.</p>
                      <div className="card-arrow">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="5" y1="12" x2="19" y2="12"></line>
                              <polyline points="12 5 19 12 12 19"></polyline>
                          </svg>
                      </div>
                  </div>
              </a>

              <a href="DomainBattle/" className="feature-card" data-card="battle">
                  <div className="card-glow"></div>
                  <div className="card-content">
                      <div className="card-icon">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                              <path d="M2 12h20"></path>
                          </svg>
                      </div>
                      <h2 className="card-title">Domain Battle</h2>
                      <p className="card-description">Real-time multiplayer territory conquest game. Strategy meets speed.</p>
                      <div className="card-arrow">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="5" y1="12" x2="19" y2="12"></line>
                              <polyline points="12 5 19 12 12 19"></polyline>
                          </svg>
                      </div>
                  </div>
              </a>

              <a href="Portfolio/" className="feature-card" data-card="portfolio">
                  <div className="card-glow"></div>
                  <div className="card-content">
                      <div className="card-icon">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                          </svg>
                      </div>
                      <h2 className="card-title">Portfolio</h2>
                      <p className="card-description">Deep dive into projects, case studies, and experimental work.</p>
                      <div className="card-arrow">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="5" y1="12" x2="19" y2="12"></line>
                              <polyline points="12 5 19 12 12 19"></polyline>
                          </svg>
                      </div>
                  </div>
              </a>
          </div>
      </section>
    </>
  );
}
