import { baseTemplate } from './baseTemplate';

export const NewMessageEmail = (data: { name: string }) => {
	return baseTemplate(
		`<h2>Hello, ${data.name}!</h2>
    <p>
      You have received a new message on Alpsector.
    </p>

    <p>
      To view and respond to the message, please click the button below:
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
                      <a href="https://www.alpsector.com/dashboard/support-chat" class="button" style="background-color: #1D4ED8; border-radius: 20px; color: #ffffff; display: inline-block; text-decoration: none; padding: 12px 30px; font-size: 16px;">
                        View Message
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
      If you have any questions or need help, feel free to <a href="https://www.alpsector.com/contact" style="color:#1D4ED8; text-decoration: none;">contact our support team</a>.
    </p>

    <p>
      Thanks,<br />
      The Alpsector Team
    </p>`
	);
};
