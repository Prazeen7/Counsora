import { test } from "node:test";
import assert from "node:assert/strict";
import { hasVerifiedSession } from "./authAccess.js";

for (const role of ["admin", "counselor", "superAdmin"]) {
    test(`${role}: cached login cannot grant access without boolean verification`, () => {
        for (const isVerified of [false, undefined, null, "false", "true", 1]) {
            assert.equal(hasVerifiedSession(true, { role, isVerified }), false);
        }
        assert.equal(hasVerifiedSession(true, { role, isVerified: true }), true);
        assert.equal(hasVerifiedSession(false, { role, isVerified: true }), false);
    });
}

test("missing users and unsupported roles are denied", () => {
    assert.equal(hasVerifiedSession(true, null), false);
    assert.equal(hasVerifiedSession(true, { role: "unknown", isVerified: true }), false);
});
