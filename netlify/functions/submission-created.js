// Netlify background function: fires automatically when a Netlify form is
// submitted. Forwards preorder emails to the Substack publication so the
// subscriber is added in the background, transparently to the user.
//
// Substack will still send its own double opt-in confirmation email — there
// is no documented way to bypass that.

const SUBSTACK_URL = 'https://newversionbydobry.substack.com/api/v1/free';
const SITE_URL = 'https://www.doronichev.com/book';

exports.handler = async (event) => {
  let payload;
  try {
    payload = JSON.parse(event.body).payload;
  } catch (err) {
    console.error('submission-created: invalid body', err);
    return { statusCode: 400, body: 'invalid body' };
  }

  if (payload?.form_name !== 'preorder') {
    return { statusCode: 200, body: 'skipped: not preorder form' };
  }

  const email = payload?.data?.email;
  if (!email) {
    return { statusCode: 200, body: 'skipped: no email' };
  }

  const body = new URLSearchParams({
    email,
    source: 'embed',
    first_url: SITE_URL,
    current_url: SITE_URL,
  });

  try {
    const res = await fetch(SUBSTACK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    const text = await res.text();
    console.log(`Substack subscribe ${email}: ${res.status} ${text.slice(0, 200)}`);
    return { statusCode: 200, body: 'ok' };
  } catch (err) {
    console.error('Substack subscribe failed:', err);
    return { statusCode: 500, body: 'error' };
  }
};
