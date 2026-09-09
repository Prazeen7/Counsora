const { test } = require("node:test");
const assert = require("node:assert/strict");
const { adminMiddleware, superAdminMiddleware } = require("./src/middleware/adminMiddleware");
const { login, signUp, currentUser } = require("./src/controllers/authController");
const { authMiddleware } = require("./src/middleware/authMiddleware");
const User = require("./src/models/User");
const hashPassword = require("./src/utils/hashPassword");
const jwt = require("jsonwebtoken");

const response = () => ({ statusCode: 200, set() { return this; }, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });

test("admin access admits admins and superadmins, Users access admits only superadmins", () => {
    for (const role of ["admin", "counselor", "superAdmin", "unknown", undefined]) {
        let allowed = false;
        adminMiddleware({ user: { role } }, response(), () => { allowed = true; });
        assert.equal(allowed, ["admin", "superAdmin"].includes(role));
        allowed = false;
        superAdminMiddleware({ user: { role } }, response(), () => { allowed = true; });
        assert.equal(allowed, role === "superAdmin");
    }
});

test("schema accepts all three roles and rejects unknown roles", () => {
    for (const role of ["admin", "counselor", "superAdmin", "unknown"]) {
        const error = new User({ name: "Example", email: "example@example.com", password: "hash", organizationName: "Example", role }).validateSync();
        assert.equal(Boolean(error?.errors.role), role === "unknown");
    }
});

test("public signup cannot provision superadmins", async () => {
    const res = response();
    await signUp({ body: { role: "superAdmin" } }, res);
    assert.equal(res.statusCode, 400);
});

test("a verified superadmin can log in with the correct role", async (t) => {
    const prior = process.env.JWT_SECRET;
    process.env.JWT_SECRET = "role-test-secret";
    t.after(() => { if (prior === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = prior; });
    const account = { _id: "superadmin", email: "example@example.com", role: "superAdmin", isVerified: true, password: await hashPassword("Example!123"), save: async () => {} };
    t.mock.method(User, "findOne", async () => account);
    const res = response();
    await login({ body: { email: account.email, password: "Example!123" } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.user.role, "superAdmin");
    assert.equal(jwt.verify(res.body.token, process.env.JWT_SECRET).sessionToken, account.sessionToken);
});

test("current account returns a database promotion even when the login token has the old role", async (t) => {
    const prior = process.env.JWT_SECRET;
    process.env.JWT_SECRET = "current-role-test-secret";
    t.after(() => { if (prior === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = prior; });
    const token = jwt.sign({ id: "promoted-user", role: "admin", sessionToken: "same-session" }, process.env.JWT_SECRET);
    t.mock.method(User, "findById", async () => ({ _id: "promoted-user", name: "Example", email: "example@example.com", role: "superAdmin", sessionToken: "same-session", isVerified: true, password: "private" }));
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = response();
    let authenticated = false;
    await authMiddleware(req, res, () => { authenticated = true; });
    assert.equal(authenticated, true);
    currentUser(req, res);
    assert.equal(res.body.user.role, "superAdmin");
    assert.equal(res.body.user.password, undefined);
    assert.equal(res.body.user.sessionToken, undefined);
});
