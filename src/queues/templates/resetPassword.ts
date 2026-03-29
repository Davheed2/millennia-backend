import { baseTemplate } from './baseTemplate';

export const resetPasswordEmail = (data: { name: string }) => {
	return baseTemplate(
		`<h2>Hello, ${data.name}!</h2>
    <p>
      Your password has been successfully reset. You can now log in with your new credentials and continue investing with confidence.
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
                      <a href="https://www.alpsector.com/signin" class="button" style="background-color: #1D4ED8; border-radius: 20px; color: #ffffff; display: inline-block; text-decoration: none; padding: 12px 30px; font-size: 16px;">
                        Sign In
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
      Didn’t request a password reset? Please <a href="https://www.alpsector.com/contact" style="color:#1D4ED8; text-decoration: none;">contact our support team</a> right away to secure your account.
    </p>

    <p>
      Thanks,<br />
      The Alpsector Team
    </p>`
	);
};
