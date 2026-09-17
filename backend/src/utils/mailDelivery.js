const nodemailer = require("nodemailer");
const { setTimeout: delay } = require("node:timers/promises");

function retryable(error) {
    if (error.code === "EAUTH") return false;
    if (error.responseCode) return error.responseCode >= 400 && error.responseCode < 500;
    return ["ETIMEDOUT", "ECONNECTION", "ECONNRESET", "ECONNREFUSED", "EAI_AGAIN", "ESOCKET"].includes(error.code);
}

async function sendMail(message, { wait = delay } = {}) {
    const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
    const port = Number(process.env.SMTP_PORT || 587);
    // Reuse the message (and verification link) across temporary delivery failures.
    for (let attempt = 1; attempt <= 3; attempt++) {
        const transport = nodemailer.createTransport({
            host: SMTP_HOST, port, secure: port === 465,
            ...(SMTP_USER && { auth: { user: SMTP_USER, pass: SMTP_PASS } }),
            dnsTimeout: 10000, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
        });
        try {
            return await transport.sendMail(message);
        } catch (error) {
            if (attempt === 3 || !retryable(error)) throw error;
            console.warn("Retrying temporary email delivery failure", {
                attempt, code: error.code, command: error.command, responseCode: error.responseCode,
            });
        } finally {
            transport.close();
        }
        await wait(attempt * 1000);
    }
}

module.exports = { sendMail };
