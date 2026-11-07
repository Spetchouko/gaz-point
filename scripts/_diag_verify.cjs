/* Vérifie notre signature HMAC contre better-call verifySignature. */
require("dotenv").config();
const { createHmac } = require("crypto");
const { getWebcryptoSubtle } = require("@better-auth/utils");
// Note: exécuter avec node >= 20 depuis .nvm (node_modules ESM).

const token = process.argv[2] || "diag-test-session-x";
const secret = process.env.BETTER_AUTH_SECRET;
if (!secret) { console.error("BETTER_AUTH_SECRET manquant"); process.exit(1); }

async function main() {
  const signature = createHmac("sha256", secret).update(token).digest("base64");
  console.log("signature node:", signature, "len:", signature.length);

  // Vérification avec la même lib que better-call
  const key = await getWebcryptoSubtle().importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: { name: "SHA-256" } },
    false,
    ["verify"]
  );
  const sigBin = Buffer.from(signature, "base64");
  const ok = await getWebcryptoSubtle().verify({ name: "HMAC", hash: "SHA-256" }, key, sigBin, new TextEncoder().encode(token));
  console.log("verify (better-call impl):", ok);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
