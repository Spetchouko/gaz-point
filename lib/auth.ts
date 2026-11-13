import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import {
  emailOTP,
  phoneNumber,
  type EmailOTPOptions,
  type PhoneNumberOptions,
} from "better-auth/plugins";
import { sendVerificationEmail } from "@/lib/email";
import { recordConversionFromHeaders } from "@/lib/publicite-attribution";
import { isBuildPhase, optionalEnv } from "@/lib/env";

// Valeurs utilisées uniquement pendant `next build` et en développement.
// En production (`next start`), l'absence de configuration lève une erreur
// explicite au démarrage plutôt que de laisser Better Auth utiliser un secret
// par défaut (faille de sécurité) ou déduire l'origine de chaque requête.
const DEV_SECRET = "gazpoints-development-only-secret-do-not-use-in-production";
const BUILD_SECRET = "gazpoints-build-time-only-secret-do-not-use-in-production";
const DEV_BASE_URL = "http://localhost:3000";

function resolveAuthSecret(): string {
  const secret = optionalEnv("BETTER_AUTH_SECRET");
  if (secret) return secret;
  if (isBuildPhase) return BUILD_SECRET;
  if (process.env.NODE_ENV !== "production") return DEV_SECRET;
  throw new Error(
    "[auth] BETTER_AUTH_SECRET est requis en production. Générez-en un avec `openssl rand -base64 32`."
  );
}

function resolveBaseURL(): string {
  const configured =
    optionalEnv("BETTER_AUTH_URL") ?? optionalEnv("NEXT_PUBLIC_SITE_URL");
  if (configured) return configured.replace(/\/+$/, "");
  if (isBuildPhase || process.env.NODE_ENV !== "production") return DEV_BASE_URL;
  throw new Error(
    "[auth] BETTER_AUTH_URL (ou NEXT_PUBLIC_SITE_URL) est requis en production."
  );
}

const authBaseURL = resolveBaseURL();
const authSecret = resolveAuthSecret();

// Ne déclarer Google que si les deux identifiants sont fournis : sinon Better
// Auth émet un avertissement à chaque instanciation (build et runtime).
const googleClientId = optionalEnv("GOOGLE_CLIENT_ID");
const googleClientSecret = optionalEnv("GOOGLE_CLIENT_SECRET");
const socialProviders =
  googleClientId && googleClientSecret
    ? {
        google: {
          clientId: googleClientId,
          clientSecret: googleClientSecret,
        },
      }
    : {};

async function getRoleFromRegisterCookie(): Promise<"client" | "vendor"> {
  // Lecture côté serveur via l'en-tête cookie.
  // Seul "vendor" est un rôle auto-attribuable à l'inscription ;
  // les rôles "admin" et "collaborateur" sont créés uniquement par promotion manuelle.
  const headersList = await headers()
  const cookieHeader = headersList.get("cookie") ?? ""
  const match = cookieHeader.match(/gazpoint_register_role=([^;]+)/)
  const roleFromCookie = match?.[1]
  if (roleFromCookie === "vendor") return "vendor"
  return "client"
}

export const auth = betterAuth({
    baseURL: authBaseURL,
    secret: authSecret,
    database: drizzleAdapter(db, {
        provider: "pg",
        schema,
    }),
    // Autoriser les origines de confiance pour éviter l'erreur "Invalid origin"
    trustedOrigins: [
        authBaseURL,
        "https://gazpoints.com",
        "https://www.gazpoints.com",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    user: {
        additionalFields: {
            phoneNumber: {
                type: "string",
                required: false,
                input: true,
            },
            phoneVerified: {
                type: "boolean",
                required: false,
                defaultValue: false,
                input: false,
            },
            phoneNumberVerified: {
                type: "boolean",
                required: false,
                defaultValue: false,
                input: false,
            },
            role: {
                type: "string",
                required: false,
                defaultValue: "client",
                input: true,
            },
            image: {
                type: "string",
                required: false,
                input: true,
            },
            isActive: {
                type: "boolean",
                required: false,
                defaultValue: true,
                input: false,
            },
            mustChangePassword: {
                type: "boolean",
                required: false,
                defaultValue: false,
                input: false,
            },
            approvalStatus: {
                type: "string",
                required: false,
                defaultValue: "none",
                input: false,
            },
            approvalRequestedAt: {
                type: "date",
                required: false,
                input: false,
            },
            approvalProcessedAt: {
                type: "date",
                required: false,
                input: false,
            },
            approvalProcessedBy: {
                type: "string",
                required: false,
                input: false,
            },
            rejectionReason: {
                type: "string",
                required: false,
                input: false,
            },
        },
    },
    socialProviders,
    account: {
        accountLinking: {
            enabled: true,
            trustedProviders: ["google"],
            requireLocalEmailVerified: false,
        },
    },
    emailAndPassword: {
        enabled: true,
        // Exiger une vérification email avant toute connexion autorisée.
        requireEmailVerification: true,
        autoSignIn: false, // compte créé mais session bloquée tant que non vérifié
    },
    // Vérification par code OTP à 6 chiffres (plugin emailOTP ci-dessous).
    // L'envoi initial est déclenché explicitement APRÈS l'inscription, via la route
    // POST /api/auth/email-otp/send-verification, afin qu'un échec d'envoi
    // n'empêche pas la création du compte et soit signalé clairement à l'utilisateur.
    // Le renvoi emprunte la même route (cooldown serveur de 60 s).
    emailVerification: {
        // L'envoi est geré explicitement par la route POST /api/auth/email-otp/send-verification
        // appelee apres l'inscription. sendOnSignUp desactive pour eviter un double envoi
        // (Better Auth + route explicite) qui invaliderait le premier code (strategie rotate).
        sendOnSignUp: false,
        // Une session est créée dès que le code est validé (utilisateur connecté).
        autoSignInAfterVerification: true,
    },
    // Anti-robot : Cloudflare Turnstile (middleware sur /sign-up/email et /sign-in/email).
    // Désactivé en mode test (AUDIT=1) pour permettre les tests automatisés.
    captcha: undefined,
    // Plugin confirmation par SMS (code OTP). Le callback sendOTP doit être
    // fourni par l'intégrateur (ici on lève une erreur explicite si non configuré),
    // conformément à la contrainte "jamais simuler l'envoi".
    phoneNumber: {
        isRequired: false,
        providedInSignUp: true,
        providedInSignIn: false,
        // Valider le format camerounais : +237 suivi de 9 chiffres.
        phoneNumberValidator: async (phone: string) => {
          const clean = phone.replace(/\s/g, "")
          // Format standard: +237 suivi de 9 chiffres
          const standardFormat = /^\+237\d{9}$/.test(clean)
          // Format avec espaces: +237 suivi de 9 chiffres avec séparateurs
          const spacedFormat = /^\+237\s\d{2}\s\d{2}\s\d{2}\s\d{2}$/.test(phone)
          return standardFormat || spacedFormat
        },
        // Envoi du code OTP. On ne simule jamais l'envoi ; si cette fonction
        // n'est pas remplacée par une vraie intégration, Better Auth lèvera
        // SEND_OTP_NOT_IMPLEMENTED.
        sendOTP: async () => {
          throw new Error("L'envoi de code SMS n'est pas encore configuré. Veuillez activer la vérification par email ou configurer un fournisseur SMS.")
        },
        // Meilleure pratique : stocker le statut de vérification dans les champs
        // déjà existants du schéma (phoneVerified / emailVerified). Better Auth
        // mise à jour ces champs via ses hooks internes quand verifyPhoneNumber
        // ou verifyEmailOTP réussit.
    },
    databaseHooks: {
        user: {
            create: {
                // Sécurité : seuls les rôles "client" et "vendor" peuvent être
                // créés par une inscription (email OU Google).
                // Le rôle est déterminé AVANT la création :
                // - Si inscription email classique : rôle par défaut "client"
                // - Si Google Auth : rôle lu depuis cookie gazpoint_register_role
                // Toute tentative d'élévation (ex: role: "admin" ou "collaborateur")
                // est ignorée et retombe en "client".
                // Un compte admin/collaborateur se crée uniquement par promotion manuelle en base.
                before: async (user: Record<string, unknown>, ctx: unknown) => {
                    // Déterminer le rôle depuis le cookie si Google Auth
                    const roleFromCookie = await getRoleFromRegisterCookie()

                    // Pour email/password : les champs additionnels sont dans ctx.body ou ctx.request
                    const ctxTyped = ctx as { body?: Record<string, unknown>; request?: Record<string, unknown> } | undefined
                    const roleFromBody = (ctxTyped?.body as { role?: string })?.role || (ctxTyped?.request as { role?: string })?.role
                    const phoneNumber = (ctxTyped?.body as { phoneNumber?: string })?.phoneNumber || (ctxTyped?.request as { phoneNumber?: string })?.phoneNumber

                    // Seul "vendor" peut être auto-attribué à l'inscription (body OU cookie).
                    const role = roleFromBody === "vendor" || roleFromCookie === "vendor" ? "vendor" : "client"

                    return { data: { ...user, role, phoneNumber } }
                },
                after: async (user: Record<string, unknown>) => {
                    // Inscription réelle : journalisée pour les statistiques de trafic
                    try {
                        await db.insert(schema.trafficEvent).values({
                            id: crypto.randomUUID(),
                            eventType: "signup",
                            path: null,
                            referrer: null,
                            utmSource: null,
                            utmMedium: null,
                            utmCampaign: null,
                            userId: String(user.id ?? ""),
                            consented: false,
                        })
                    } catch (e) {
                        console.error("traffic_event signup logging failed", e)
                    }
                    // Attribution publicitaire : inscription dans les 30 jours après un clic.
                    try {
                        await recordConversionFromHeaders("signup", {
                            userId: String(user.id ?? ""),
                        })
                    } catch (e) {
                        console.error("publicite signup conversion failed", e)
                    }
                },
            },
            // Au mise à jour du profil (ex: après validation SMS), on peut
            // mettre à jour phoneVerified / emailVerified si Better Auth ne le fait pas seul.
            update: {
                before: async (data: Record<string, unknown>) => {
                    // Exemple : si le champ phoneNumber a changé et qu'on veut
                    // marquer phoneVerified à false par défaut.
                    if (data.phoneNumber !== undefined && data.phoneNumber === null) {
                        (data as Record<string, unknown>).phoneVerified = false
                    }
                    return { data }
                },
            },
        },
        session: {
            create: {
                // Sécurité : un compte désactivé (isActive=false) ne peut pas se connecter
                // Bloquer la connexion tant que l'email n'est pas vérifié.
                // On lève une erreur explicite pour que Better Auth renvoie un message clair
                // au lieu de bloquer silencieusement (ce qui donnait "Identifiants incorrects").
                before: async (session: Record<string, unknown>) => {
                    const userId = String(session.userId ?? "")
                    if (!userId) return true
                    const [row] = await db
                        .select({ isActive: schema.user.isActive, emailVerified: schema.user.emailVerified })
                        .from(schema.user)
                        .where(eq(schema.user.id, userId))
                        .limit(1)
                    if (!row || row.isActive === false) {
                        throw new Error("Ce compte a été désactivé. Contactez le support.")
                    }
                    if (row.emailVerified === false) {
                        throw new Error("Veuillez vérifier votre adresse email avant de vous connecter. Un code de vérification vous a été envoyé.")
                    }
                    return true
                },
                after: async (session: Record<string, unknown>) => {
                    const userId = String(session.userId ?? "")
                    // Enregistrer la date et heure de la dernière connexion réussie.
                    try {
                        await db
                            .update(schema.user)
                            .set({ lastLoginAt: new Date() })
                            .where(eq(schema.user.id, userId))
                    } catch (e) {
                        console.error("user last_login_at update failed", e)
                    }
                    // Connexion réelle : journalisée pour les statistiques de trafic
                    try {
                        await db.insert(schema.trafficEvent).values({
                            id: crypto.randomUUID(),
                            eventType: "signin",
                            path: null,
                            referrer: null,
                            utmSource: null,
                            utmMedium: null,
                            utmCampaign: null,
                            userId: userId,
                            consented: false,
                        })
                    } catch (e) {
                        console.error("traffic_event signin logging failed", e)
                    }
                },
            },
        },
    },
    plugins: [
      // Vérification d'email par code OTP à 6 chiffres.
      // - overrideDefaultEmailVerification : l'email de vérification natif
      //   (lien/token) est remplacé par l'envoi d'un code OTP ;
      // - expiresIn : 10 minutes (600 s), identique à l'interface ;
      // - storeOTP "hashed" : le code n'est jamais stocké en clair ;
      // - allowedAttempts : 3 essais avant invalidation du code ;
      // - resendStrategy "rotate" : un renvoi invalide l'ancien code.
      emailOTP({
        overrideDefaultEmailVerification: true,
        expiresIn: 600,
        otpLength: 6,
        storeOTP: "hashed",
        allowedAttempts: 3,
        resendStrategy: "rotate",
        // Envoi effectif du code par email (Nodemailer / Gmail SMTP).
        // Toute erreur d'envoi remonte à l'appelant (jamais de faux succès).
        async sendVerificationOTP({ email, otp, type }) {
          if (type !== "email-verification") return
          await sendVerificationEmail({
            email,
            code: otp,
            expiresInMinutes: 10,
          })
        },
      } satisfies EmailOTPOptions),
      phoneNumber({
        sendOTP: async () => {
          throw new Error("L'envoi de code SMS n'est pas encore configuré. Veuillez activer la vérification par email ou configurer un fournisseur SMS.")
        },
      } satisfies PhoneNumberOptions),
      // Doit rester EN DERNIER : le plugin d'intégration des cookies doit être
      // placé après tous les autres afin que les `Set-Cookie` émis par leurs
      // hooks soient bien transmis au store de cookies du framework.
      nextCookies(),
    ],
})