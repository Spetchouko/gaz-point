/* Signe un token de session avec le secret Better Auth (format cookie). */
require("dotenv").config();
const crypto = require("crypto");

const token = process.argv[2];
if (!token) { console.error("usage: node _diag_signcookie.cjs <token>"); process.exit(1); }

const secret = process.env.BETTER_AUTH_SECRET;
if (!secret) { console.error("BETTER_AUTH_SECRET manquant"); process.exit(1); }

const signature = crypto.createHmac("sha256", secret).update(token).digest("base64");
const cookieValue = encodeURIComponent(`${token}.${signature}`);
console.log("COOKIE=better-auth.session_token=" + cookieValue);
