import { baseTemplate } from './baseTemplate';

export const loginEmail = (data: { name: string; time: string }) => {
  return baseTemplate(
    `<h2>Hello, ${data.name}!</h2>

    <p>
      We detected a new sign-in to your <strong>Millennia Trades</strong> account on <strong>${data.time}</strong>.
    </p>

    <p>
      If this was you, there's nothing more to do. But if this login seems unfamiliar, please update your password immediately or contact our support team.
    </p>

    <p>
      Your account’s safety is our top priority and we’re always here to help you stay secure.
    </p>

    <p>Thank you,<br />The Millennia Trades Team</p>`
  );
};
