import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { nextCookies } from "better-auth/next-js";
import {
  emailOTP,
  phoneNumber,
  type EmailOTPOptions,
  type PhoneNumberOptions,
} from "better-auth/plugins";
import { sendVerificationEmail } from "@/lib/email";
import { recordConversionFromHeaders } from "@/lib/publicite-attribution";
import { isBuildPhase, optionalEnv } from "@/lib/env";
import { resolveAuthSecret } from "@/lib/auth-secret";
import {
  createSocialSignupBeforeHook,
  getServerTrustedSocialSignupRole,
  GOOGLE_SOCIAL_PROVIDER_POLICY,
} from "@/lib/auth-social-intent";
import { createNotification, buildNotificationLink } from "@/lib/notifications";
import {
    AUTH_ROLE_ADDITIONAL_FIELD,
    isAuthRole,
    normalizePublicSignupRole,
} from "@/lib/auth-routing";
import { withTransientRetry } from "@/lib/transient-retry";

/**
 * Wrapper avec timeout pour chaque tentative de requête DB.
 */
async function withTimeoutPerAttempt<T>(
  operation: () => Promise<T>,
  ms: number
): Promise<T> {
  return Promise.race([
    operation(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout après ${ms}ms`)), ms)
    ),
  ])
}

const DEV_BASE_URL = "http://localhost:3000";

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
          ...GOOGLE_SOCIAL_PROVIDER_POLICY,
        },
      }
    : {};

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
            role: AUTH_ROLE_ADDITIONAL_FIELD,
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
        minPasswordLength: 8,
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
    hooks: {
        before: createSocialSignupBeforeHook(),
    },
    databaseHooks: {
        user: {
            create: {
                // Sécurité : une inscription publique ne peut créer que les
                // rôles "client" ou "vendor". Le corps HTTP ne peut pas fournir
                // de rôle. Pour Google, le rôle "vendor" vient uniquement de
                // l'intention d'inscription vérifiée et signée par le serveur,
                // puis transportée dans l'état OAuth de Better Auth. Les rôles
                // "admin" et "collaborateur" restent hors du parcours public.
                before: async (user: Record<string, unknown>, ctx: unknown) => {
                    const ctxTyped = ctx as {
                        body?: Record<string, unknown>
                        request?: Record<string, unknown>
                    } | undefined
                    const phoneNumber =
                        (ctxTyped?.body as { phoneNumber?: string })?.phoneNumber ||
                        (ctxTyped?.request as { phoneNumber?: string })?.phoneNumber
                    const role = normalizePublicSignupRole(
                        await getServerTrustedSocialSignupRole()
                    )

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
                    
                    // Notifier les administrateurs de la nouvelle inscription
                    try {
                        const admins = await db
                          .select({ id: schema.user.id })
                          .from(schema.user)
                          .where(eq(schema.user.role, "admin"))
                          .limit(10)

                        for (const admin of admins) {
                          await createNotification({
                            userId: admin.id,
                            type: "admin",
                            title: "Nouvel utilisateur inscrit",
                            message: `Un nouvel utilisateur (${user.name ?? user.email}) s'est inscrit sur la plateforme.`,
                            link: buildNotificationLink("admin", String(user.id ?? ""), "admin"),
                          })
                        }
                    } catch {
                      // Ignorer les erreurs de notification
                    }
                },
            },
            // Au mise à jour du profil (ex: après validation SMS), on peut
            // mettre à jour phoneVerified / emailVerified si Better Auth ne le fait pas seul.
            update: {
                before: async (data: Record<string, unknown>) => {
                    // Le rôle n'est jamais modifié par une mise à jour de profil.
                    // Seules les APIs administratives écrivent ce champ en base.
                    delete data.role

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
                    // Timeout court (3s) et une seule tentative pour respecter le budget Vercel (10s total).
                    // Une requête SELECT by PK doit prendre < 100ms sur connexion saine.
                    const row = await withTransientRetry(async () =>
                      withTimeoutPerAttempt(
                        () =>
                          db
                            .select({
                              isActive: schema.user.isActive,
                              emailVerified: schema.user.emailVerified,
                              role: schema.user.role,
                            })
                            .from(schema.user)
                            .where(eq(schema.user.id, userId))
                            .limit(1),
                        3000
                      ),
                      { attempts: 1, delayMs: 0 }
                    )
                    const result = row?.[0]
                    if (!result || result.isActive === false) {
                        throw new Error("Ce compte a été désactivé. Contactez le support.")
                    }
                    if (result.emailVerified === false) {
                        throw new Error("Veuillez vérifier votre adresse email avant de vous connecter. Un code de vérification vous a été envoyé.")
                    }
                    if (!isAuthRole(result.role)) {
                        throw new Error("Ce compte ne possède aucun rôle valide. Contactez le support.")
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