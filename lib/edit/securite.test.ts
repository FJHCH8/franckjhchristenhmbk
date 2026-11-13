import assert from "node:assert/strict";
import { freshBucket, noteFail, originAllowed, plainText, readSessionToken, sessionCookie, signSession, sniff, verifyTotp } from "./securite.ts";

const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
const at = 59_000;
const first = verifyTotp(secret, "287082", 0, at);
assert.equal(first.ok, true);
assert.equal(first.step, 1);
const replay = verifyTotp(secret, "287082", first.step, at);
assert.equal(replay.ok, false);
assert.equal(verifyTotp(secret, "000000", 0, at).ok, false);
assert.equal(verifyTotp(secret, "28708", 0, at).ok, false);

const bucket = freshBucket();
const start = 1_000_000;
for (let i = 0; i < 4; i++) noteFail(bucket, start, 5);
assert.equal(bucket.until, 0);
noteFail(bucket, start, 5);
assert.ok(bucket.until >= start + 15 * 60 * 1000);
noteFail(bucket, bucket.until + 1, 5);
noteFail(bucket, bucket.until + 1, 5);
noteFail(bucket, bucket.until + 1, 5);
noteFail(bucket, bucket.until + 1, 5);
noteFail(bucket, bucket.until + 1, 5);
assert.ok(bucket.until >= start + 15 * 60 * 1000 + 30 * 60 * 1000);

assert.equal(plainText("<script>alert(1)</script>Bonjour", 20), "alert(1)Bonjour");
assert.equal(plainText("a<b", 10).includes("<"), false);
assert.equal(sniff(Buffer.from([0xff, 0xd8, 0xff, 0x00]))?.kind, "photo");
assert.equal(sniff(Buffer.from("<html></html>")), null);

const token = signSession({ sid: "abc", iat: 10, exp: 50 }, "session-secret");
assert.deepEqual(readSessionToken(token, "session-secret", 20), { sid: "abc", iat: 10, exp: 50 });
assert.equal(readSessionToken(`${token}x`, "session-secret", 20), null);
assert.equal(readSessionToken(token, "session-secret", 60), null);
const cookie = sessionCookie(token, 100);
assert.match(cookie, /__Host-edition=/);
assert.match(cookie, /HttpOnly/);
assert.match(cookie, /Secure/);
assert.match(cookie, /SameSite=Strict/);
assert.match(cookie, /Path=\//);
assert.equal(originAllowed("https://franckjhchristen.com", "franckjhchristen.com"), true);
assert.equal(originAllowed("https://evil.example", "franckjhchristen.com"), false);
assert.equal(originAllowed(null, "franckjhchristen.com"), false);

console.log("protections ok");
