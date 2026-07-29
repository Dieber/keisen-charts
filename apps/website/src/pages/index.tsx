import { type ReactNode } from "react";
import BrowserOnly from "@docusaurus/BrowserOnly";
import Link from "@docusaurus/Link";
import Translate, { translate } from "@docusaurus/Translate";
import useBaseUrl from "@docusaurus/useBaseUrl";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";

import styles from "./index.module.css";

const GITHUB_URL = "https://github.com/Dieber/keisen-charts";

const LOCALE_OPTIONS = [
  {
    locale: "zh-Hans",
    labelId: "landing.brand.locale.zhHans",
    label: "Simplified Chinese",
  },
  {
    locale: "en",
    labelId: "landing.brand.locale.en",
    label: "English",
  },
] as const;

function BrandLangMenu(): ReactNode {
  const {
    i18n: { currentLocale, localeConfigs },
  } = useDocusaurusContext();

  return (
    <div className={styles.langMenu}>
      <button
        type="button"
        className={`${styles.brandLink} ${styles.langTrigger}`}
      >
        <Translate id="landing.brand.language">Language</Translate>
      </button>
      <ul className={styles.langList} role="list">
        {LOCALE_OPTIONS.map(({ locale, labelId, label }) => {
          const href = localeConfigs[locale]?.baseUrl ?? "/";
          const isCurrent = currentLocale === locale;
          return (
            <li key={locale}>
              <a
                className={`${styles.brandLink} ${styles.langItem}${
                  isCurrent ? ` ${styles.langItemActive}` : ""
                }`}
                href={href}
                lang={localeConfigs[locale]?.htmlLang}
                hrefLang={localeConfigs[locale]?.htmlLang}
                aria-current={isCurrent ? "page" : undefined}
              >
                <Translate id={labelId}>{label}</Translate>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function BrandHero(): ReactNode {
  const docsUrl = useBaseUrl("/docs/introduction");
  return (
    <header className={styles.brand}>
      <div className={styles.brandGrid} aria-hidden />
      <div className={styles.brandInner}>
        <h1 className={styles.wordmark}>keisen</h1>
        <nav className={styles.brandLinks} aria-label="Keisen">
          <Link className={styles.brandLink} to={docsUrl}>
            <Translate id="landing.brand.doc">Doc</Translate>
          </Link>
          <a
            className={styles.brandLink}
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Translate id="landing.brand.github">GitHub</Translate>
          </a>
          <BrandLangMenu />
        </nav>
      </div>
    </header>
  );
}

function Intro(): ReactNode {
  return (
    <section className={`${styles.section} ${styles.intro}`}>
      <p className={styles.sectionLabel}>
        <Translate id="landing.intro.label">About</Translate>
      </p>
      <h2 className={styles.sectionTitle}>
        <Translate id="landing.intro.title">罫線 — keisen</Translate>
        <span className={styles.introRuby}>
          <Translate id="landing.intro.ruby">けいせん</Translate>
        </span>
      </h2>
      <p className={styles.sectionBody}>
        <Translate id="landing.intro.body">
          Keisen takes its name from the Japanese 罫線 — once the word for
          candlestick charts in financial practice. It brings that craft to the
          modern web: declare charts the way you write components, and let the
          library stay out of the way.
        </Translate>
      </p>
    </section>
  );
}

function Features(): ReactNode {
  return (
    <section className={`${styles.section} ${styles.features}`}>
      <p className={styles.sectionLabel}>
        <Translate id="landing.features.label">Features</Translate>
      </p>
      <h2 className={styles.sectionTitle}>
        <Translate id="landing.features.title">Built to feel light</Translate>
      </h2>
      <ul className={styles.featureList}>
        <li className={styles.featureItem}>
          <h3 className={styles.featureTitle}>
            <Translate id="landing.features.easy.title">Easy hands</Translate>
          </h3>
          <p className={styles.featureBody}>
            <Translate id="landing.features.easy.body">
              If you know React or Vue, you already know Keisen. Children are
              layers; JSX and templates draw what you write. Chart literacy is
              optional — component literacy is enough.
            </Translate>
          </p>
        </li>
        <li className={styles.featureItem}>
          <h3 className={styles.featureTitle}>
            <Translate id="landing.features.ready.title">
              Ready out of the box
            </Translate>
          </h3>
          <p className={styles.featureBody}>
            <Translate id="landing.features.ready.body">
              Pass candlestick data and you have a chart. Themes, resolutions,
              indicators, and drawing tools compose when you need them — not
              before.
            </Translate>
          </p>
        </li>
        <li className={styles.featureItem}>
          <h3 className={styles.featureTitle}>
            <Translate id="landing.features.cross.title">
              Cross-runtime
            </Translate>
          </h3>
          <p className={styles.featureBody}>
            <Translate id="landing.features.cross.body">
              Heavy lifting lives in @keisen-charts/core. Framework bindings
              stay thin. React and Vue ship today; more adapters can follow
              without rewriting the engine.
            </Translate>
          </p>
        </li>
      </ul>
    </section>
  );
}

function SocialProof(): ReactNode {
  return (
    <section className={`${styles.section} ${styles.social}`}>
      <p className={styles.sectionLabel}>
        <Translate id="landing.social.label">Social</Translate>
      </p>
      <h2 className={styles.sectionTitle}>
        <Translate id="landing.social.title">They&apos;re all on it</Translate>
      </h2>
      <p className={styles.sectionBody}>
        <Translate id="landing.social.body">
          Entirely fictional posts from people who definitely exist somewhere.
        </Translate>
      </p>
      <p className={styles.socialHint}>
        <Translate id="landing.social.hint">not real · for the bit</Translate>
      </p>
      <div className={styles.socialStage}>
        <BrowserOnly
          fallback={
            <div className={styles.socialFallback}>
              <Translate id="landing.social.loading">loading…</Translate>
            </div>
          }
        >
          {() => {
            const TweetRing =
              require("@site/src/components/landing/TweetRing").default;
            return <TweetRing />;
          }}
        </BrowserOnly>
      </div>
    </section>
  );
}

function LandingFooter(): ReactNode {
  const docsUrl = useBaseUrl("/docs/introduction");
  const quickStartUrl = useBaseUrl("/docs/quick-start");
  return (
    <footer className={styles.footer}>
      <p className={styles.footerBrand}>keisen</p>
      <nav className={styles.footerLinks} aria-label="Footer">
        <Link className={styles.footerLink} to={docsUrl}>
          <Translate id="landing.footer.docs">Docs</Translate>
        </Link>
        <Link className={styles.footerLink} to={quickStartUrl}>
          <Translate id="landing.footer.quickStart">Quick Start</Translate>
        </Link>
        <a
          className={styles.footerLink}
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Translate id="landing.footer.github">GitHub</Translate>
        </a>
      </nav>
      <p className={styles.footerCopy}>
        <Translate
          id="landing.footer.copy"
          values={{ year: new Date().getFullYear() }}
        >
          {"Copyright © {year} Keisen · MIT"}
        </Translate>
      </p>
    </footer>
  );
}

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout
      noFooter
      wrapperClassName="keisen-landing-wrap"
      title={siteConfig.title}
      description={translate({
        id: "landing.description",
        message:
          "Keisen — modern candlestick chart components for React and Vue",
      })}
    >
      <div className={styles.page}>
        <BrandHero />
        <hr className={styles.divider} />
        <main>
          <Intro />
          <hr className={styles.divider} />
          <Features />
          <hr className={styles.divider} />
          <SocialProof />
        </main>
        <LandingFooter />
      </div>
    </Layout>
  );
}
