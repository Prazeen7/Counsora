const MailComposer = require('nodemailer/lib/mail-composer');

function validateGmailConfig() {
    for (const key of ['GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REFRESH_TOKEN']) {
        if (!process.env[key]?.trim()) throw Object.assign(new Error(`Missing ${key}`), { code: 'EMAIL_CONFIG' });
    }
}

async function googleRequest(url, options) {
    let response;
    try {
        response = await fetch(url, { ...options, signal: AbortSignal.timeout(15000) });
    } catch {
        throw Object.assign(new Error('Google email service connection failed'), { code: 'GMAIL_NETWORK', retryable: true });
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        // Never propagate Google's response body: it can contain private information.
        throw Object.assign(new Error('Google email service rejected the request'), {
            code: response.status === 401 || data.error === 'invalid_grant' ? 'GMAIL_AUTH' : 'GMAIL_API',
            responseCode: response.status,
            retryable: response.status === 429 || response.status >= 500,
        });
    }
    return data;
}

async function sendGmail(message, { wait }) {
    validateGmailConfig();
    // Compose once so retries retain MIME boundaries, attachments, and message ID.
    const raw = (await new MailComposer(message).compile().build()).toString('base64url');
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const token = await googleRequest('https://oauth2.googleapis.com/token', {
                method: 'POST',
                body: new URLSearchParams({
                    client_id: process.env.GMAIL_CLIENT_ID,
                    client_secret: process.env.GMAIL_CLIENT_SECRET,
                    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
                    grant_type: 'refresh_token',
                }),
            });
            if (!token.access_token) throw Object.assign(new Error('Google did not return an access token'), { code: 'GMAIL_AUTH' });
            const sent = await googleRequest('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ raw }),
            });
            if (!sent.id) throw Object.assign(new Error('Google did not confirm message acceptance'), { code: 'GMAIL_API' });
            return { messageId: sent.id };
        } catch (error) {
            if (!error.retryable || attempt === 3) throw error;
            console.warn('Retrying temporary Gmail API failure', { attempt, code: error.code, responseCode: error.responseCode });
            await wait(attempt * 1000);
        }
    }
}

module.exports = { sendGmail, validateGmailConfig };
