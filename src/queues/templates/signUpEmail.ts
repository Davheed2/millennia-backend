import { baseTemplate } from './baseTemplate';

export const signUpEmail = (data: { name: string; verificationUrl: string }) => {
	return baseTemplate(
		`<h2>Hi ${data.name},</h2>

    <p>
      Welcome to <strong>Alpsector</strong> we're thrilled to have you onboard!
    </p>

    <p>
      To get started, please verify your email address by clicking the button below:
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
                      <a href="${data.verificationUrl}" style="background-color: #1D4ED8; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: 600;">
                        Verify Your Email
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
      If the button above doesn't work, just copy and paste the link below into your browser:
    </p>

    <p style="word-break: break-all;">
      <a href="${data.verificationUrl}" style="color: #1D4ED8;">${data.verificationUrl}</a>
    </p>

    <p>
      This link is valid for <strong>30 days</strong>. If you didn't sign up for Alpsector, feel free to ignore this email.
    </p>

    <p>Thanks,<br/>The Alpsector Team</p>`
	);
};
