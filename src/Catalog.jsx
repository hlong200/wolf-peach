import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Button } from 'react-bootstrap';
import { FilterProvider } from "./lib/FilterProvider";
import FilterableGrid from "./FilterableGrid";
import WelcomeModal from './WelcomeModal';
import './Catalog.css';

const B = ({ bg, children }) => (
  <span className="legend-pill" style={{ backgroundColor: bg }}>{children}</span>
);

const LEGEND = [
  {
    pills: <><B bg="#28a745">75 days</B></>,
    label: 'Days to maturity',
    desc: 'Weeks from sowing to first harvest',
  },
  {
    pills: <><B bg="#fd7e14">Full sun</B><B bg="#fd7e14">Part shade</B><B bg="#fd7e14">Shade</B></>,
    label: 'Sunlight',
    desc: 'Daily light the plant requires',
  },
  {
    pills: <><B bg="#6f42c1">Easy</B><B bg="#e6a817">Moderate</B><B bg="#dc3545">Hard</B></>,
    label: 'Difficulty',
    desc: 'Care and pest management needed',
  },
  {
    pills: <><B bg="#20c997">Cool season</B><B bg="#20c997">Warm season</B></>,
    label: 'Season type',
    desc: 'Preferred temperature range to thrive',
  },
  {
    pills: <><B bg="#17a2b8">Indeterminate</B><B bg="#17a2b8">Determinate</B></>,
    label: 'Growth habit',
    desc: 'Continuous fruiting vs. single flush',
  },
  {
    pills: <><B bg="#0dcaf0">Plant Now</B><B bg="#198754">In Season</B></>,
    label: 'Live status',
    desc: 'Updated from your frost zone',
  },
];

export default function Catalog() {
  const navigate = useNavigate();
  const [showGuide, setShowGuide] = useState(false);

  return (
    <FilterProvider>
      <>
        <section className="py-3 py-md-5">
          <Row className="align-items-center mx-0 g-3">

            <Col md={7}>
              <h1 className="fs-2 fs-md-1 fw-bold">Wolf Peach Garden Guidebook</h1>
              <p className="lead">
                Explore vegetables, plan your garden, and grow with confidence.
              </p>
              <div className="d-flex gap-3">
                <Button variant="primary" onClick={() => navigate('/garden')}>My Garden</Button>
                <Button variant="outline-secondary" onClick={() => setShowGuide(true)}>Field Guide</Button>
              </div>
            </Col>

            {/* Badge legend — desktop only */}
            <Col md={5} className="d-none d-md-block">
              <div className="catalog-legend">
                <div className="catalog-legend-title">Reading a plant card</div>
                {LEGEND.map(({ pills, label, desc }) => (
                  <div key={label} className="catalog-legend-row">
                    <div className="catalog-legend-text">
                      <span className="catalog-legend-label">{label}</span>
                      <span className="catalog-legend-desc">{desc}</span>
                    </div>
                    <div className="catalog-legend-pills">{pills}</div>
                  </div>
                ))}
              </div>
            </Col>
          </Row>
        </section>

        <FilterableGrid />

        <WelcomeModal forceShow={showGuide} onHide={() => setShowGuide(false)} />
      </>
    </FilterProvider>
  );
}
