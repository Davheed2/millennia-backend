import type { BroadcastEmailData } from '@/common/interfaces';
import { baseTemplate } from './baseTemplate';

export const BroadcastEmail = (data: BroadcastEmailData): string => {
	const { title, content } = data;

	// Convert newlines to paragraphs for proper HTML rendering
	const contentHtml = content
		.split('\n')
		.filter((line) => line.trim())
		.map((line) => `<p style="margin: 0 0 12px 0; font-size: 15px; line-height: 1.7; color: #374151;">${line}</p>`)
		.join('');

	const template = `
    <!-- Announcement Banner -->
    <div style="
      background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
      border-radius: 10px;
      padding: 20px 24px;
      margin-bottom: 28px;
      text-align: center;
    ">
      <p style="
        margin: 0 0 6px 0;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 2px;
        text-transform: uppercase;
        color: #70e8cc;
      ">Platform Announcement</p>
      <p style="margin: 0; font-size: 13px; color: rgba(255,255,255,0.6);">
        From the SyntrixTrade Team
      </p>
    </div>

    <!-- Title -->
    <h1 style="
      margin: 0 0 20px 0;
      font-size: 24px;
      font-weight: 700;
      line-height: 1.3;
      color: #0f172a;
    ">${title}</h1>

    <!-- Divider -->
    <div style="
      height: 3px;
      background: linear-gradient(90deg, #70e8cc, transparent);
      border-radius: 2px;
      margin-bottom: 24px;
    "></div>

    <!-- Content -->
    <div style="margin-bottom: 28px;">
      ${contentHtml}
    </div>

    <!-- Footer note -->
    <div style="
      background-color: #f8fafc;
      border-left: 4px solid #70e8cc;
      border-radius: 0 8px 8px 0;
      padding: 16px 20px;
      margin-top: 12px;
    ">
      <p style="
        margin: 0;
        font-size: 13px;
        color: #64748b;
        line-height: 1.6;
      ">
        This is an official announcement from SyntrixTrade. If you have questions or concerns, please contact our support team through the platform.
      </p>
    </div>
  `;

	return baseTemplate(template);
};
