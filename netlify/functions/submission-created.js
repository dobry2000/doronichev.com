// Netlify background function: fires automatically when a Netlify form is
// submitted. Forwards preorder emails to the Substack publication so the
// subscriber is added in the background, transparently to the user.
//
// Substack will still send its own double opt-in confirmation email — there
// is no documented way to bypass that.

const SUBSTACK_ORIGIN = 'https://newversionbydobry.substack.com';
const SUBSTACK_URL = `${SUBSTACK_ORIGIN}/api/v1/free`;
const SUBSTACK_EMBED = `${SUBSTACK_ORIGIN}/embed`;
const SITE_URL = 'https://www.doronichev.com/book';

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

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
    first_url: SITE_URL,
    first_referrer: '',
    current_url: SUBSTACK_EMBED,
    current_referrer: SITE_URL,
    referral_code: '',
    source: 'embed',
  });

  try {
    const res = await fetch(SUBSTACK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': BROWSER_UA,
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': SUBSTACK_ORIGIN,
        'Referer': `${SUBSTACK_EMBED}`,
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
      },
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
