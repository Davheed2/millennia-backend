import { baseTemplate } from './baseTemplate';

export const forgotPasswordEmail = (data: { name: string; resetLink: string }) => {
	return baseTemplate(
		`<h2>Hello, ${data.name}!</h2>
    <p>
      We received a request to reset your password for your <strong>Alpsector</strong> account.
      Click the button below to choose a new password:
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
                      <a href="${data.resetLink}" class="button" style="background-color: rgb(112, 232, 224); border-radius: 20px; color: #163300; display: inline-block; text-decoration: none; padding: 12px 30px; font-size: 16px;">
                        Reset Password
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
      This link will expire in <strong>15 minutes</strong>. If you didn’t request this password reset, you can safely ignore this message or <a href="https://alpsector.org/support" style="color: rgb(112, 232, 204); text-decoration: none;">contact support</a> immediately.
    </p>

    <p>Thank you,<br />The Alpsector Team</p>`
	);
};
