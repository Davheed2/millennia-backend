import { baseTemplate } from './baseTemplate';

export const AdminNewMessageEmail = (data: { name: string }) => {
	return baseTemplate(
		`<h2>New Message Received</h2>
    <p>
      A new message has been sent by <strong>${data.name}</strong> on Millennia Trades.
    </p>

    <p>
      To view and respond to the message, click the button below:
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
                      <a href="https://www.millenniatrades.com/admin/messages" class="button" style="background-color: #1D4ED8; border-radius: 20px; color: #ffffff; display: inline-block; text-decoration: none; padding: 12px 30px; font-size: 16px;">
                        View in Admin Panel
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
      Please ensure timely follow-up if the message requires assistance or support.
    </p>

    <p>
      Thanks,<br />
      The Millennia Trades System
    </p>`
	);
};
