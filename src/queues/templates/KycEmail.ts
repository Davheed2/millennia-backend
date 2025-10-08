import { baseTemplate } from './baseTemplate';

export const KycEmail = (data: { name: string; status: 'approved' | 'rejected' }) => {
	const isApproved = data.status === 'approved';

	return baseTemplate(
		`<h2>Hello, ${data.name}!</h2>
    <p>
      ${
				isApproved
					? 'Congratulations! Your KYC verification has been successfully approved. You can now fully access all features on our platform.'
					: 'Unfortunately, your KYC verification has been rejected. Please review the submitted information and try again.'
			}
    </p>

    <table class="body-action" align="center" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td align="center">
                <table border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td>
                      <a href="https://www.milleniatrades.com/${isApproved ? 'dashboard' : 'kyc'}" class="button" style="background-color: #1D4ED8; border-radius: 20px; color: #ffffff; display: inline-block; text-decoration: none; padding: 12px 30px; font-size: 16px;">
                        ${isApproved ? 'Go to Dashboard' : 'Retry KYC'}
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p>
      ${
				isApproved
					? 'Thank you for completing your KYC process. We’re excited to have you on board!'
					: 'If you have any questions or need assistance, please <a href="https://www.milleniatrades.com/contact" style="color:#1D4ED8; text-decoration: none;">contact our support team</a>.'
			}
    </p>

    <p>
      Thanks,<br />
      The Millennia Trades Team
    </p>`
	);
};
