const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[char]));

module.exports = function verificationEmailTemplate(name, link) {
    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Verify your Counsora email</title></head>
<body style="margin:0;padding:0;background-color:#f4f3ff;font-family:Arial,Helvetica,sans-serif;color:#201b3b;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">One last step: verify your email to get started with Counsora.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f3ff;"><tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="560" cellspacing="0" cellpadding="0" style="width:100%;max-width:560px;background-color:#ffffff;border:1px solid #e5e2f5;border-radius:20px;overflow:hidden;">
<tr><td style="height:6px;background-color:#4f46e5;font-size:1px;">&nbsp;</td></tr>
<tr><td align="center" style="padding:32px 28px 24px;">
<img src="cid:counsora-logo" width="64" height="64" alt="Counsora logo" style="display:block;border:0;width:64px;height:64px;">
<p style="margin:12px 0 0;font-size:23px;font-weight:700;letter-spacing:-0.5px;color:#201b3b;">Counsora</p>
</td></tr>
<tr><td style="padding:8px 32px 36px;">
<p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:2px;color:#4f46e5;text-align:center;">WELCOME TO COUNSORA</p>
<h1 style="margin:0 0 24px;font-size:30px;line-height:1.25;text-align:center;color:#201b3b;">Your next step starts here.</h1>
<p style="margin:0 0 12px;font-size:16px;line-height:1.7;">Hi ${escapeHtml(name || "there")},</p>
<p style="margin:0 0 28px;font-size:16px;line-height:1.7;color:#6b6375;">Thanks for joining Counsora. Confirm your email address to activate your account and start exploring opportunities.</p>
<table role="presentation" cellspacing="0" cellpadding="0" align="center"><tr><td align="center" bgcolor="#4f46e5" style="border-radius:10px;mso-padding-alt:16px 32px;">
<a href="${escapeHtml(link)}" style="display:inline-block;padding:16px 32px;border:1px solid #4f46e5;border-radius:10px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;">Verify email</a>
</td></tr></table>
<p style="margin:24px 0 0;font-size:13px;line-height:1.6;text-align:center;color:#6b6375;">This button is valid for 24 hours and can be used once.</p>
</td></tr>
<tr><td style="padding:24px 32px;background-color:#faf9ff;border-top:1px solid #eeeaf8;">
<p style="margin:0;font-size:12px;line-height:1.8;color:#6b6375;text-align:center;">Didn't create a Counsora account? You can safely ignore this email.<br>Sent by Counsora to help you get started.</p>
</td></tr></table>
</td></tr></table></body></html>`;
};
