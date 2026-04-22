import { Link } from "react-router-dom";
import "./Home.css";

export default function Home() {
  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero-copy">
          <p className="home-eyebrow">Welcome to Wolf Peach</p>
          <h1 className="home-title">Garden Guidebook</h1>
          <p className="home-subtitle">
            Explore vegetables, plan your garden, and grow with confidence.
          </p>

          <div className="home-actions">
            <Link to="/my-garden" className="home-btn home-btn-primary">
              My Garden
            </Link>
            <Link to="/catalog" className="home-btn home-btn-secondary">
              Field Guide
            </Link>
          </div>
        </div>

        <aside className="home-guide-card">
          <h2>Reading a Plant Card</h2>

          <div className="guide-row">
            <div>
              <h3>Days to maturity</h3>
              <p>Weeks from sowing to first harvest</p>
            </div>
            <span className="guide-pill">75 days</span>
          </div>

          <div className="guide-row">
            <div>
              <h3>Sunlight</h3>
              <p>Daily light the plant requires</p>
            </div>
            <div className="guide-pill-group">
              <span className="guide-pill orange">Full sun</span>
              <span className="guide-pill amber">Part shade</span>
              <span className="guide-pill gold">Shade</span>
            </div>
          </div>

          <div className="guide-row">
            <div>
              <h3>Difficulty</h3>
              <p>Care and pest management needed</p>
            </div>
            <div className="guide-pill-group">
              <span className="guide-pill purple">Easy</span>
              <span className="guide-pill yellow">Moderate</span>
              <span className="guide-pill red">Hard</span>
            </div>
          </div>

          <div className="guide-row">
            <div>
              <h3>Season type</h3>
              <p>Preferred temperature range to thrive</p>
            </div>
            <div className="guide-pill-group">
              <span className="guide-pill teal">Cool season</span>
              <span className="guide-pill mint">Warm season</span>
            </div>
          </div>

          <div className="guide-row">
            <div>
              <h3>Growth habit</h3>
              <p>Continuous fruiting vs. single flush</p>
            </div>
            <div className="guide-pill-group">
              <span className="guide-pill cyan">Indeterminate</span>
              <span className="guide-pill blue">Determinate</span>
            </div>
          </div>

          <div className="guide-row">
            <div>
              <h3>Live status</h3>
              <p>Updated from your frost zone</p>
            </div>
            <div className="guide-pill-group">
              <span className="guide-pill sky">Plant Now</span>
              <span className="guide-pill green">In Season</span>
            </div>
          </div>
        </aside>
      </section>

      <section className="home-features">
        <article className="feature-card">
          <h3>Catalog</h3>
          <p>Browse vegetables with filters, quick stats, and easy comparisons.</p>
          <Link to="/catalog" className="feature-link">
            Explore Catalog
          </Link>
        </article>

        <article className="feature-card">
          <h3>My Garden</h3>
          <p>Save favorite plants and build your own growing list in one place.</p>
          <Link to="/my-garden" className="feature-link">
            View My Garden
          </Link>
        </article>

        <article className="feature-card">
          <h3>Companion Planting</h3>
          <p>See which vegetables grow well together and which should stay apart.</p>
          <Link to="/companion-planting" className="feature-link">
            Open Guide
          </Link>
        </article>

        <article className="feature-card">
          <h3>Seasonal Calendar</h3>
          <p>Plan what to plant and when based on the growing season.</p>
          <Link to="/seasonal-calendar" className="feature-link">
            View Calendar
          </Link>
        </article>
      </section>
    </main>
  );
}

