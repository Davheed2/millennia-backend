import { baseTemplate } from './baseTemplate';

export const welcomeEmail = (data: { name: string }) => {
  return baseTemplate(
    `<h2>Hi ${data.name},</h2>

    <p>
      Welcome to <strong>Millennia Trades</strong> — your modern investing platform built for everyone.
    </p>

    <p>
      You’re now part of a growing community that’s using smart, data-driven strategies to grow their wealth with confidence.
    </p>

    <p>
      <strong>Why Millennia Trades?</strong><br/>
      📈 Personalized strategies, low fees, and intuitive tools that work for beginners and experts alike.
    </p>

    <h3>💼 Here’s what you can look forward to:</h3>
    <ul>
      <li>Build a diversified portfolio with <strong>stocks, bonds, and ETFs</strong></li>
      <li>Track your performance with <strong>real-time insights and growth analytics</strong></li>
      <li>Enjoy <strong>secure, guided investing</strong> tailored to your goals</li>
    </ul>

    <p>
      Whether you’re saving for your future or investing for financial freedom, we’re here to help you take the next step with confidence.
    </p>

    <p>
      Simple. Smart. Secure. That’s investing the Millennia way.
    </p>

    <hr style="margin: 24px 0;" />

    <h3>🔒 Your security matters:</h3>
    <ul>
      <li>We use bank-grade encryption to keep your data safe</li>
      <li>Two-factor authentication available for extra protection</li>
      <li>Your info stays private — always</li>
    </ul>

    <p>Want to learn more?</p>
    <p>
      <a href="https://www.milleniatrades.com/privacy" style="color: #1D4ED8; font-weight: bold;">Check out our privacy policy →</a>
    </p>

    <hr style="margin: 24px 0;" />

    <p>
      We’re excited to help you reach your investing goals.<br />
      <strong>Let’s build your future, together.</strong><br />
      – The Millennia Trades Team
    </p>`
  );
};
