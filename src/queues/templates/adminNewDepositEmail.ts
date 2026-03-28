import { baseTemplate } from './baseTemplate';

export const AdminNewDepositEmail = (data: { userName: string; amount: number; reference: string }) => {
	return baseTemplate(
		`
        <div style="color: #51545E; font-size: 16px; line-height: 1.6;">
          <h2 style="color: #10B981; font-size: 24px; font-weight: 600; margin: 0 0 15px;">New Deposit Request</h2>
          <p style="margin: 0 0 20px;">
            A new deposit request has been submitted by <strong style="color: #10B981;">${data.userName}</strong>.
          </p>

          <!-- Deposit Details -->
          <div style="background-color: #F9FAFB; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #6B7280;">User: <strong>${data.userName}</strong></p>
            <p style="margin: 10px 0; font-size: 14px; color: #6B7280;">Amount: <strong>$${data.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></p>
            <p style="margin: 0; font-size: 14px; color: #6B7280;">Reference: <strong>${data.reference}</strong></p>
          </div>

          <!-- Call to Action -->
          <table class="body-action" align="center" width="100%" cellpadding="0" cellspacing="0" style="margin: 25px 0;">
            <tr>
              <td align="center">
                <a href="https://admin.milleniatrades.com/deposits" class="button" style="background-color: #10B981; border-radius: 20px; color: #ffffff; display: inline-block; text-decoration: none; padding: 14px 40px; font-weight: bold; font-size: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  Review Deposit
                </a>
              </td>
            </tr>
          </table>

          <p style="margin: 0 0 20px;">
            Please log in to the admin dashboard to verify the payment proof and approve the transaction.
          </p>

          <p style="margin: 0; font-weight: 500;">
            Best regards,<br />
            System Notification
          </p>
        </div>
        `
	);
};
