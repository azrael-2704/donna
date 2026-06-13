'use client';

import styles from './page.module.css';
import Link from 'next/link';

export default function SettingsPage() {
  return (
    <div className={styles.shell}>
      <header className={styles.topBar}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link href="/" style={{ color: 'var(--donna-text-muted)', fontSize: '1.2rem' }}>←</Link>
          <span className={styles.title}>Settings</span>
        </div>
      </header>

      <section className={styles.contentArea}>
        
        {/* Profile */}
        <div>
          <h2 className={styles.sectionTitle}>Profile</h2>
          <div className={styles.profileCard}>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Display Name</label>
              <input type="text" className={styles.inputField} value="AM" disabled />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Email</label>
              <input type="email" className={styles.inputField} value="am@example.com" disabled />
            </div>
          </div>
        </div>

        {/* Integrations */}
        <div>
          <h2 className={styles.sectionTitle}>Integrations</h2>
          <div className={styles.integrationsGrid}>
            <div className={styles.integrationCard}>
              <div className={styles.integrationInfo}>
                <div className={styles.integrationIcon}>📅</div>
                <div>
                  <div className={styles.integrationName}>Google Calendar</div>
                  <div className={styles.integrationStatus}>Not connected</div>
                </div>
              </div>
              <button className={styles.connectBtn}>Connect</button>
            </div>
            
            <div className={styles.integrationCard}>
              <div className={styles.integrationInfo}>
                <div className={styles.integrationIcon}>📞</div>
                <div>
                  <div className={styles.integrationName}>Twilio (SMS/Voice)</div>
                  <div className={styles.integrationStatus}>Connected</div>
                </div>
              </div>
              <button className={`${styles.connectBtn} ${styles.connected}`}>Active</button>
            </div>

            <div className={styles.integrationCard}>
              <div className={styles.integrationInfo}>
                <div className={styles.integrationIcon}>💬</div>
                <div>
                  <div className={styles.integrationName}>WhatsApp</div>
                  <div className={styles.integrationStatus}>Connected</div>
                </div>
              </div>
              <button className={`${styles.connectBtn} ${styles.connected}`}>Active</button>
            </div>
          </div>
        </div>

        {/* Subscription */}
        <div>
          <h2 className={styles.sectionTitle}>Subscription</h2>
          <div className={styles.pricingGrid}>
            {/* Free Tier */}
            <div className={styles.pricingCard}>
              <div>
                <div className={styles.tierName}>FREE</div>
                <div className={styles.tierPrice}>₹0<span className={styles.tierPeriod}>/mo</span></div>
              </div>
              <div className={styles.featureList}>
                <div className={styles.featureItem}>
                  <span className={styles.featureIcon}>✓</span>
                  <span>Voice & Text Chat</span>
                </div>
                <div className={styles.featureItem}>
                  <span className={styles.featureIcon}>✓</span>
                  <span>Up to 3 Active Scripts</span>
                </div>
                <div className={styles.featureItem}>
                  <span className={styles.featureIcon}>✓</span>
                  <span>Basic Memory</span>
                </div>
                <div className={styles.featureItem}>
                  <span className={styles.featureIcon}>✓</span>
                  <span>Community Support</span>
                </div>
              </div>
              <button className={`${styles.pricingBtn} ${styles.pricingBtnFree}`}>Current Plan</button>
            </div>

            {/* Pro Tier */}
            <div className={`${styles.pricingCard} ${styles.pricingCardPro}`}>
              <div>
                <div className={styles.tierName}>PRO</div>
                <div className={styles.tierPrice}>₹999<span className={styles.tierPeriod}>/mo</span></div>
              </div>
              <div className={styles.featureList}>
                <div className={styles.featureItem}>
                  <span className={styles.featureIcon}>✓</span>
                  <span>Unlimited Scripts</span>
                </div>
                <div className={styles.featureItem}>
                  <span className={styles.featureIcon}>✓</span>
                  <span>Browser Automation Agent</span>
                </div>
                <div className={styles.featureItem}>
                  <span className={styles.featureIcon}>✓</span>
                  <span>WhatsApp & SMS Delivery</span>
                </div>
                <div className={styles.featureItem}>
                  <span className={styles.featureIcon}>✓</span>
                  <span>Premium TTS Voices (ElevenLabs)</span>
                </div>
                <div className={styles.featureItem}>
                  <span className={styles.featureIcon}>✓</span>
                  <span>Priority Support</span>
                </div>
              </div>
              <button className={`${styles.pricingBtn} ${styles.pricingBtnPro}`}>Upgrade to Pro</button>
            </div>
          </div>
        </div>
        
      </section>
    </div>
  );
}
