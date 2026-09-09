const { test } = require("node:test");
const assert = require("node:assert/strict");
const User = require("./src/models/User");
const { verifyEmail, login, verificationStatus, updateVerificationEmail } = require("./src/controllers/authController");
const hashPassword = require("./src/utils/hashPassword");
const { hashToken, sendVerificationEmail } = require("./src/utils/emailVerification");
const nodemailer = require("nodemailer");
const template = require("./src/utils/verificationEmailTemplate");
const jwt = require("jsonwebtoken");

function mockEmail(t) {
    for (const [key, value] of Object.entries({ JWT_SECRET: "verification-test-secret", SMTP_HOST: "smtp.example.com", EMAIL_FROM: "sender@example.com", FRONTEND_URL: "http://localhost:5173" })) {
        const previous = process.env[key];
        process.env[key] = value;
        t.after(() => { if (previous === undefined) delete process.env[key]; else process.env[key] = previous; });
    }
}

function response() {
    return { statusCode: 200, set() { return this; }, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
}

test("verification page only accepts an unused, unexpired token for an unverified account", async (t) => {
    t.mock.method(User, "exists", async (filter) => {
        assert.equal(filter.isVerified, false);
        assert.equal(filter.verificationTokenHash, hashToken("c".repeat(64)));
        assert.ok(filter.verificationTokenExpiresAt.$gt instanceof Date);
        return null;
    });
    const res = response();
    await verificationStatus({ body: { token: "c".repeat(64) } }, res);
    assert.equal(res.body.valid, false);
});

test("verification defaults to false", () => {
    assert.equal(new User().isVerified, false);
});

test("rejects malformed verification tokens without accessing the database", async () => {
    const res = response();
    await verifyEmail({ body: { token: "bad" } }, res);
    assert.equal(res.statusCode, 400);
});

test("verification hashes the token and atomically consumes an unexpired token", async (t) => {
    mockEmail(t);
    const token = "a".repeat(64);
    t.mock.method(User, "findOneAndUpdate", async (filter, update) => {
        assert.equal(filter.verificationTokenHash, hashToken(token));
        assert.equal(filter.isVerified, false);
        assert.ok(filter.verificationTokenExpiresAt.$gt instanceof Date);
        assert.equal(update.$set.isVerified, true);
        assert.ok(Object.hasOwn(update.$unset, "verificationTokenHash"));
        assert.match(update.$set.sessionToken, /^[a-f0-9]{64}$/);
        assert.equal(update.$set.verificationLoginSession, update.$set.sessionToken);
        return { _id: "test-user", email: "person@example.com", role: "counselor", ...update.$set };
    });
    const res = response();
    await verifyEmail({ body: { token } }, res);
    assert.equal(res.body.isVerified, true);
    const claims = jwt.verify(res.body.token, process.env.JWT_SECRET);
    assert.equal(claims.id, "test-user");
    assert.match(claims.sessionToken, /^[a-f0-9]{64}$/);
    assert.equal(res.body.user.role, "counselor");
});

test("expired or consumed links cannot verify an account", async (t) => {
    t.mock.method(User, "findOneAndUpdate", async () => null);
    const res = response();
    await verifyEmail({ body: { token: "b".repeat(64) } }, res);
    assert.equal(res.statusCode, 400);
});

test("unverified users cannot create login sessions", async (t) => {
    mockEmail(t);
    let delivered = false;
    t.mock.method(User, "findOneAndUpdate", async () => ({}));
    t.mock.method(nodemailer, "createTransport", () => ({
        sendMail: async (mail) => {
            delivered = true;
            assert.match(mail.html, /Verify email<\/a>/);
            assert.match(mail.html, /cid:counsora-logo/);
            assert.equal(mail.attachments[0].cid, "counsora-logo");
        }, close() {},
    }));
    t.mock.method(User, "findOne", async () => ({ _id: "test-user", password: await hashPassword("Example!123"), isVerified: false }));
    const res = response();
    await login({ body: { email: "person@example.com", password: "Example!123" } }, res);
    assert.equal(res.statusCode, 403);
    assert.equal(res.body.code, "EMAIL_NOT_VERIFIED");
    assert.equal(res.body.token, undefined);
    assert.equal(delivered, true);
    assert.equal(res.body.emailSent, true);
    assert.equal(jwt.verify(res.body.verificationStatusToken, process.env.JWT_SECRET).purpose, "verification-status");
});

test("waiting page detects verification from the database using its scoped status token", async (t) => {
    mockEmail(t);
    const statusToken = jwt.sign({ id: "test-user", purpose: "verification-status" }, process.env.JWT_SECRET, { expiresIn: "1h" });
    let verified = false;
    t.mock.method(User, "findById", async (id) => {
        assert.equal(id, "test-user");
        return { _id: id, isVerified: verified, role: "admin", sessionToken: "verification-session", verificationLoginSession: "verification-session" };
    });
    const pending = response();
    await verificationStatus({ body: { statusToken } }, pending);
    assert.equal(pending.body.isVerified, false);
    assert.equal(pending.body.token, undefined);
    verified = true;
    const completed = response();
    await verificationStatus({ body: { statusToken } }, completed);
    assert.equal(completed.body.isVerified, true);
    assert.equal(jwt.verify(completed.body.token, process.env.JWT_SECRET).sessionToken, "verification-session");
    assert.equal(completed.body.user.role, "admin");
});

test("verification status cannot recover a session replaced by a later login", async (t) => {
    mockEmail(t);
    t.mock.method(User, "findById", async () => ({ isVerified: true, sessionToken: "new-login", verificationLoginSession: "old-verification" }));
    const statusToken = jwt.sign({ id: "test-user", purpose: "verification-status" }, process.env.JWT_SECRET);
    const res = response();
    await verificationStatus({ body: { statusToken } }, res);
    assert.equal(res.body.isVerified, true);
    assert.equal(res.body.token, undefined);
});

test("status polling rejects tokens without the verification purpose", async (t) => {
    mockEmail(t);
    const statusToken = jwt.sign({ id: "test-user" }, process.env.JWT_SECRET);
    const res = response();
    await verificationStatus({ body: { statusToken } }, res);
    assert.equal(res.statusCode, 400);
});

test("recent requests do not send duplicate emails", async (t) => {
    mockEmail(t);
    t.mock.method(User, "findOneAndUpdate", async () => null);
    t.mock.method(nodemailer, "createTransport", () => { throw new Error("Should not send"); });
    assert.deepEqual(await sendVerificationEmail({ _id: "user" }), { sent: false });
});

test("failed delivery releases its own token and cooldown", async (t) => {
    mockEmail(t);
    t.mock.method(User, "findOneAndUpdate", async () => ({}));
    let released = false;
    t.mock.method(User, "updateOne", async (filter, update) => {
        assert.match(filter.verificationTokenHash, /^[a-f0-9]{64}$/);
        assert.ok(Object.hasOwn(update.$unset, "verificationEmailSentAt"));
        released = true;
    });
    t.mock.method(nodemailer, "createTransport", () => ({ sendMail: async () => { throw new Error("SMTP failed"); }, close() {} }));
    await assert.rejects(sendVerificationEmail({ _id: "user" }), /SMTP failed/);
    assert.equal(released, true);
});

test("email template escapes names and renders the link as a button", () => {
    const html = template('<script>alert("x")</script>', "https://example.com/verify-email#token=abc");
    assert.ok(!html.includes("<script>"));
    assert.match(html, /href="https:\/\/example.com\/verify-email#token=abc"/);
    assert.ok(!html.includes(">https://example.com"));
});

test("email correction saves the normalized address, invalidates old links and delivers to the new address", async (t) => {
    mockEmail(t);
    const statusToken = jwt.sign({ id: "test-user", purpose: "verification-status" }, process.env.JWT_SECRET);
    t.mock.method(User, "findById", async () => ({ _id: "test-user", email: "old@example.com", isVerified: false }));
    let updates = 0;
    t.mock.method(User, "findOneAndUpdate", async (filter, update) => {
        updates++;
        if (updates === 1) {
            assert.equal(filter._id, "test-user");
            assert.equal(filter.isVerified, false);
            assert.equal(update.$set.email, "new@example.com");
            assert.ok(Object.hasOwn(update.$unset, "verificationTokenHash"));
        } else {
            assert.equal(filter.email, "new@example.com");
        }
        return { _id: "test-user", email: "new@example.com", isVerified: false };
    });
    t.mock.method(nodemailer, "createTransport", () => ({ sendMail: async (mail) => assert.equal(mail.to, "new@example.com"), close() {} }));
    const res = response();
    await updateVerificationEmail({ body: { email: " New@Example.com ", statusToken } }, res);
    assert.equal(res.body.email, "new@example.com");
    assert.equal(res.body.emailSent, true);
});

test("verified accounts cannot edit their email with an old verification session", async (t) => {
    mockEmail(t);
    const statusToken = jwt.sign({ id: "test-user", purpose: "verification-status" }, process.env.JWT_SECRET);
    t.mock.method(User, "findById", async () => ({ isVerified: true }));
    const res = response();
    await updateVerificationEmail({ body: { email: "new@example.com", statusToken } }, res);
    assert.equal(res.statusCode, 409);
});

test("email correction rejects another account's registered address", async (t) => {
    mockEmail(t);
    const statusToken = jwt.sign({ id: "test-user", purpose: "verification-status" }, process.env.JWT_SECRET);
    t.mock.method(User, "findById", async () => ({ email: "old@example.com", isVerified: false }));
    t.mock.method(User, "findOneAndUpdate", async () => { throw Object.assign(new Error("duplicate"), { code: 11000 }); });
    const res = response();
    await updateVerificationEmail({ body: { email: "taken@example.com", statusToken } }, res);
    assert.equal(res.statusCode, 409);
    assert.match(res.body.error, /already registered/);
});

test("email correction requires a valid verification session", async () => {
    const res = response();
    await updateVerificationEmail({ body: { email: "new@example.com", statusToken: "invalid" } }, res);
    assert.equal(res.statusCode, 400);
});
