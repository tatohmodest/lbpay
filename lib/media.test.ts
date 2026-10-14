import test from "node:test";
import assert from "node:assert/strict";
import { mediaKey, mediaSrc } from "./media";

const R2 = "https://pub-98c2191bb9e1446f9eafa841d5d5be11.r2.dev";

test("our R2 photos are served through /api/media", () => {
  assert.equal(mediaSrc(`${R2}/kyc/usr_1/front-1.jpg`), "/api/media/kyc/usr_1/front-1.jpg");
  assert.equal(mediaSrc(`${R2}/links/usr_1/a.jpg`), "/api/media/links/usr_1/a.jpg");
  assert.equal(mediaSrc("/api/media/avatars/usr_1/a.jpg"), "/api/media/avatars/usr_1/a.jpg");
});

test("everything else is left alone", () => {
  const cloud = "https://res.cloudinary.com/demo/image/upload/v1/a.jpg";
  assert.equal(mediaSrc(cloud), cloud);
  assert.equal(mediaSrc("/illustrations/empty-wallet.webp"), "/illustrations/empty-wallet.webp");
  assert.equal(mediaSrc(undefined), undefined);
});

test("only known folders, no path tricks", () => {
  assert.equal(mediaKey(`${R2}/secrets/x.jpg`), null);
  assert.equal(mediaKey("/api/media/links/../kyc/x.jpg"), null);
  assert.equal(mediaKey("https://evil.example/links/x.jpg"), null);
});
