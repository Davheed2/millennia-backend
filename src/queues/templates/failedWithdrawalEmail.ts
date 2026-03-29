import { baseTemplate } from './baseTemplate';

export const WithdrawalFailedEmail = (data: { name: string; amount: number; reference: string }) => {
	return baseTemplate(
		`
        <div style="color: #51545E; font-size: 16px; line-height: 1.6;">
          <h2 style="color: #1D4ED8; font-size: 24px; font-weight: 600; margin: 0 0 15px;">Hello, ${data.name}!</h2>
          <p style="margin: 0 0 20px;">
            We're sorry to inform you that your withdrawal of <strong style="color: #1D4ED8;">$${data.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> with reference number <strong style="color: #1D4ED8;">${data.reference}</strong> could not be processed.
          </p>

          <!-- Withdrawal Details -->
          <div style="background-color: #F9FAFB; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #6B7280;">Withdrawal Amount: <strong>$${data.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></p>
            <p style="margin: 10px 0 0; font-size: 14px; color: #6B7280;">Reference Number: <strong>${data.reference}</strong></p>
          </div>

          <!-- Call to Action -->
          <table class="body-action" align="center" width="100%" cellpadding="0" cellspacing="0" style="margin: 25px 0;">
            <tr>
              <td align="center">
                <a href="https://www.alpsector.com/support" class="button" style="background-color: #1D4ED8; border-radius: 20px; color: #ffffff; display: inline-block; text-decoration: none; padding: 14px 40px; font-weight: bold; font-size: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  Contact Support
                </a>
              </td>
            </tr>
          </table>

          <p style="margin: 0 0 20px;">
            Please review the details and try again, or contact our <a href="https://www.alpsector.com/contact" style="color: #3B82F6; text-decoration: none; font-weight: 500;">Support Center</a> for assistance.
          </p>

          <p style="margin: 0; font-weight: 500;">
            Best regards,<br />
            The Alpsector Team
          </p>
        </div>
        `
	);
};
