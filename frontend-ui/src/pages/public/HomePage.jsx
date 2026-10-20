import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const problems = [
  {
    title: 'Hidden Underground Leaks',
    text: 'Pipes crack beneath the ground and run unnoticed for days, silently wasting thousands of liters before anyone notices.',
  },
  {
    title: 'Uneven Water Pressure',
    text: 'Homes near the tank get strong flow while families at the end of the line are left with dry taps.',
  },
  {
    title: 'Slow, Guesswork Repairs',
    text: 'Plumbers only hear about breaks after frustrated residents call — then spend hours hunting for the leak’s location.',
  },
];

const processSteps = [
  {
    title: 'Smart Readers Read the Flow',
    text: 'Digital flow sensors at pipe junctions report water velocity every 15 seconds — day and night, continuously.',
  },
  {
    title: 'System Spots Anomalies',
    text: 'Background analyzers compare real-time water draw against normal routines to catch sudden bursts or continuous night flows.',
  },
  {
    title: 'Advises the Right Action',
    text: 'The dashboard shows technicians the exact pipe branch to inspect — avoiding unnecessary digging or guesswork.',
  },
  {
    title: 'Human Fixes & Auto Verification',
    text: 'A plumber repairs the pipe. The system then automatically watches the flow for 15 minutes to verify the leak has stopped.',
  },
];

const features = [
  {
    title: 'Water Flow Monitoring',
    text: 'Real-time, continuous tracking of neighborhood pipe velocity and IoT sensor battery health across all 9 nodes.',
  },
  {
    title: 'Underground Leak Detection',
    text: 'Distinguishes legitimate daytime use (showers, laundry) from continuous underground pipe cracks using flow pattern analysis.',
  },
  {
    title: 'Fair-Share Assessment',
    text: 'Monitors if uphill or terminal homes are being starved of their fair share of community water and flags the deficit.',
  },
  {
    title: 'Root-Cause Analysis',
    text: 'Traces connected pipe branches so downstream homes don’t trigger false alarms when an upstream pipe breaks.',
  },
  {
    title: 'Repair Outcome Verification',
    text: 'Automatically observes the pipe for 15 minutes after a plumber finishes work to verify the leak has completely stopped.',
  },
  {
    title: 'Transparent Reports & History',
    text: 'Generates clean records of water saved, repair response times, and daily community volume for accountability.',
  },
];

function WireframePanel({ className = '', showStats = false }) {
  return (
    <div
      className={`wireframe-panel ${className}`}
      aria-label="Illustration placeholder for AQUILA monitoring dashboard"
    >
      <div className="wireframe-screen">
        <span />
      </div>

      {showStats && (
        <div className="wireframe-stats">
          <div>
            <strong>—</strong>
            <span>Nodes Online</span>
          </div>
          <div>
            <strong>—</strong>
            <span>Update Rate</span>
          </div>
          <div>
            <strong>—</strong>
            <span>Monitoring</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="aquila-home">
      <section className="hero-background" id="home">
        <div className="hero-section">
          <div className="hero-copy">
            <h1>
              Smart, Fair Water <strong>Monitoring</strong> for your <i>community.</i>
            </h1>

            <p className="hero-description">
              The device and dashboard dedicated to making your community's
              water management accessible, smart, and intuitive. Join AQUILA today.
            </p>

            <div className="hero-actions">
              <Link to="/login" className="button button-dark">
                Access Portal <ArrowRight size={16} />
              </Link>

              <a href="#how-it-works" className="button button-light">
                See How it Works
              </a>
            </div>
          </div>

          <WireframePanel className="hero-visual" showStats />
        </div>
      </section>

      <section className="about-section wave-top" id="about">
        <div className="section-heading about-heading">
          <div>
            <h2>AQUILA's Driving Purpose is to address..</h2>
          </div>
        </div>

        <div className="problem-grid">
          {problems.map(({ title, text }) => (
            <article className="problem-card" key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>

        <div className="about-detail-grid">
          <article className="detail-card">
            <div className="detail-title">
              <h3>Purpose Built For</h3>
            </div>

            <ul className="audience-list">
              <li>
                <strong>BAWASA Admins</strong>
                <span>
                  Full network oversight, incident management, and audit
                  reports
                </span>
              </li>
              <li>
                <strong>Community Plumbers</strong>
                <span>Precise location data to find and fix leaks fast</span>
              </li>
              <li>
                <strong>Local Residents</strong>
                <span>
                  Transparent view of your own water usage and connection
                  status
                </span>
              </li>
            </ul>
          </article>

          <article className="detail-card privacy-card">
            <div className="detail-title">
              <h3>RA 10173 COMPLIANT</h3>
            </div>

            <h3 className="privacy-title">Your Privacy Is Protected</h3>

            <p>
              Household water usage data stays private and is never shared
              publicly. Only aggregate network metrics are visible to the
              community.
            </p>

            <p className="privacy-note">
              Compliant with the Republic Act 10173 — Data Privacy Act of
              2012.
            </p>
          </article>
        </div>
      </section>

      <section className="process-background">
        <section className="process-section" id="how-it-works">
          <div className="process-title">
            <div>
              <h2>One centralized system to monitor, maintain, and manage.</h2>
            </div>
          </div>

          <div className="process-content">
            <div className="process-visual">
              <WireframePanel />

              <div className="process-caption">
                <span>THE AQUILA PROCESS</span>
                <strong>MONITOR → ANALYZE → IDENTIFY → VERIFY</strong>
              </div>
            </div>

            <div className="step-list">
              {processSteps.map((step, index) => (
                <article className="step-card" key={step.title}>
                  <div>
                    <h3><b>{step.title}</b></h3>
                    <p><i>{step.text}</i></p>
                  </div>

                  <span className="step-number">
                    0{index + 1}
                  </span>
                </article>
              ))}
            </div>
          </div>
        </section>
      </section>

      <section className="features-section wave-top" id="features">
        <div className="section-heading features-heading">
          <div>
            <h2>AQUILA's Community-Oriented Solutions</h2>
          </div>
        </div>

        <div className="feature-grid">
          {features.map(({ title, text }) => (
            <article className="feature-card" key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>

        <div className="closing-cta">
          <div>
            <h2>Ready to Protect your Community’s Water?</h2>
            <p>
              Log in to the AQUILA admin portal or contact your BAWASA
              representative.
            </p>
          </div>

          <Link to="/login" className="button button-light">
            Access Portal <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </div>
  );
}