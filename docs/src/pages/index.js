import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/intro">
            📖 Get Started
          </Link>
          <Link
            className="button button--outline button--secondary button--lg"
            href="https://github.com/giulio-leone/wpdash">
            ⭐ GitHub
          </Link>
        </div>
        <div className={styles.warning}>
          ⚠️ <strong>Experimental software</strong> — use in production at your own risk.
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  return (
    <Layout description="Centralized WordPress monitoring and maintenance dashboard">
      <HomepageHeader />
      <main>
        <section className={styles.features}>
          <div className="container">
            <div className="row">
              {[
                { icon: '🖥️', title: 'Multi-site overview', desc: 'Monitor all your WordPress installations from a single interface.' },
                { icon: '🔌', title: 'Plugin management', desc: 'Activate, deactivate, update, and install plugins remotely.' },
                { icon: '🔒', title: 'Security audit', desc: 'Core file integrity check against official WordPress checksums.' },
                { icon: '🩺', title: 'Site health', desc: 'WP/PHP/DB versions, active theme, plugin counts at a glance.' },
                { icon: '🐳', title: 'Docker-ready', desc: 'Production and development Docker Compose configs included.' },
                { icon: '📖', title: 'REST API', desc: 'Secure token-based REST API via the WP Dash Bridge plugin.' },
              ].map(({ icon, title, desc }) => (
                <div key={title} className={clsx('col col--4', styles.feature)}>
                  <div className={styles.featureIcon}>{icon}</div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
