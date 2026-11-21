import assert from "node:assert/strict"
import { webcrypto } from "node:crypto"
import { betterAuth } from "better-auth"
import { memoryAdapter } from "better-auth/adapters/memory"
import { validateNewPassword } from "@/lib/password-policy"
import {
  getPasswordResetTokenIdentifiers,
  normalizePasswordResetToken,
} from "@/lib/password-reset"
import {
  AUTH_ROLE_ADDITIONAL_FIELD,
  AUTH_ROLES,
  ROLE_DASHBOARD_PATHS,
  evaluateAccountAccess,
  getOtpSendPublicResponse,
  isSameAdminEmail,
  resolveDashboardAccess,
  resolveResultsAccess,
  shouldClearCollaboratorPermissions,
  type AuthRole,
} from "@/lib/auth-routing"
import {
  GOOGLE_SOCIAL_PROVIDER_POLICY,
  SOCIAL_SIGNUP_INTENT_COOKIE,
  SOCIAL_SIGNUP_ROLE_CONTEXT_KEY,
  createSocialSignupBeforeHook,
  createSocialSignupIntent,
  getServerTrustedSocialSignupRole,
  getSocialSignupRoleFromServerContext,
  resolveSocialSignupIntent,
  verifySocialSignupIntent,
} from "@/lib/auth-social-intent"

if (!globalThis.crypto) {
  Object.defineProperty(globalThis, "crypto", {
    value: webcrypto,
    configurable: true,
  })
}

type MemoryRow = Record<string, unknown> & {
  id: string
  email?: string
  role?: string
  emailVerified?: boolean
  isActive?: boolean
  mustChangePassword?: boolean
}

type MemoryDatabase = Record<string, MemoryRow[]>

const memoryDb: MemoryDatabase = {
  user: [],
  account: [],
  session: [],
  verification: [],
  rateLimit: [],
}

const PASSWORD = "MotDePasseSolide123!"
const BASE_URL = "http://localhost:3000"

const testAuth = betterAuth({
  baseURL: BASE_URL,
  secret: "gazpoints-auth-routing-tests-secret-only",
  database: memoryAdapter(memoryDb),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      role: AUTH_ROLE_ADDITIONAL_FIELD,
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
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user: Record<string, unknown>) => ({
          data: {
            ...user,
            role: "client",
            isActive: true,
            mustChangePassword: false,
          },
        }),
      },
      update: {
        before: async (data: Record<string, unknown>) => {
          const safeData = { ...data }
          delete safeData.role
          return { data: safeData }
        },
      },
    },
    session: {
      create: {
        before: async (session: Record<string, unknown>) => {
          const account = memoryDb.user.find(
            (row) => row.id === session.userId
          )
          if (!account || account.isActive === false) {
            throw new Error("Ce compte a été désactivé. Contactez le support.")
          }
          if (account.emailVerified !== true) {
            throw new Error(
              "Veuillez vérifier votre adresse email avant de vous connecter."
            )
          }
          if (
            typeof account.role !== "string" ||
            !(AUTH_ROLES as readonly string[]).includes(account.role)
          ) {
            throw new Error("Ce compte ne possède aucun rôle valide.")
          }
          return true
        },
      },
    },
  },
})

function getErrorDetails(error: unknown) {
  if (!error || typeof error !== "object") {
    return { code: "", message: String(error ?? "") }
  }

  const value = error as {
    code?: unknown
    status?: unknown
    statusCode?: unknown
    message?: unknown
    body?: { code?: unknown }
  }

  return {
    code:
      typeof value.code === "string"
        ? value.code
        : typeof value.body?.code === "string"
          ? value.body.code
          : "",
    status:
      typeof value.status === "number"
        ? value.status
        : typeof value.statusCode === "number"
          ? value.statusCode
          : 0,
    message: typeof value.message === "string" ? value.message : "",
  }
}

async function expectRejected(
  action: () => Promise<unknown>,
  expectedCode: string
) {
  try {
    await action()
    assert.fail(`L'action aurait dû échouer avec le code ${expectedCode}`)
  } catch (error) {
    const details = getErrorDetails(error)
    assert.equal(
      details.code,
      expectedCode,
      `Code d'erreur inattendu: ${details.code || details.message}`
    )
  }
}

function findUser(email: string) {
  return memoryDb.user.find((row) => row.email === email)
}

async function createVerifiedUser(
  email: string,
  role: AuthRole,
  options: { mustChangePassword?: boolean } = {}
) {
  const created = await testAuth.api.signUpEmail({
    body: {
      name: `Utilisateur ${role}`,
      email,
      password: PASSWORD,
    },
  })

  const account = findUser(email)
  assert.ok(account, `Le compte ${email} doit être créé`)
  account.emailVerified = true
  account.role = role
  account.isActive = true
  account.mustChangePassword = options.mustChangePassword ?? false

  return { created, account }
}

async function signIn(email: string) {
  return testAuth.api.signInEmail({
    body: { email, password: PASSWORD },
    returnHeaders: true,
  })
}

async function testFourRoleDestinations() {
  for (const role of AUTH_ROLES) {
    const email = `${role}@example.test`
    const { account } = await createVerifiedUser(email, role)

    const access = evaluateAccountAccess({
      id: account.id,
      role: account.role ?? null,
      emailVerified: account.emailVerified === true,
      isActive: account.isActive !== false,
      mustChangePassword: account.mustChangePassword === true,
    })

    assert.equal(access.status, "ready")
    assert.equal(access.role, role)
    assert.equal(access.redirectTo, ROLE_DASHBOARD_PATHS[role])

    const signInResult = await signIn(email)
    assert.equal(signInResult.response.user.role, role)
  }
}

async function testWrongCredentialsDoNotCreateUsers() {
  const email = "mauvais-identifiants@example.test"
  await createVerifiedUser(email, "client")
  const countBefore = memoryDb.user.length

  await expectRejected(
    () =>
      testAuth.api.signInEmail({
        body: { email, password: "MotDePasseFaux123!" },
      }),
    "INVALID_EMAIL_OR_PASSWORD"
  )

  assert.equal(memoryDb.user.length, countBefore)

  const unknownEmail = "compte-inconnu@example.test"
  await expectRejected(
    () =>
      testAuth.api.signInEmail({
        body: { email: unknownEmail, password: PASSWORD },
      }),
    "INVALID_EMAIL_OR_PASSWORD"
  )

  assert.equal(memoryDb.user.length, countBefore)
  assert.equal(findUser(unknownEmail), undefined)
}

async function testUnverifiedAccountCannotSignIn() {
  const email = "non-verifie@example.test"
  await testAuth.api.signUpEmail({
    body: {
      name: "Compte non vérifié",
      email,
      password: PASSWORD,
    },
  })

  const account = findUser(email)
  assert.ok(account)
  assert.equal(account.emailVerified, false)

  await expectRejected(
    () => signIn(email),
    "EMAIL_NOT_VERIFIED"
  )
}

async function testPublicSignupsCannotChooseStaffRole() {
  const email = "promotion@example.test"
  const result = await (
    testAuth.api.signUpEmail as unknown as (
      input: Record<string, unknown>
    ) => Promise<{ user: { role?: string } }>
  )({
    body: {
      name: "Promotion interdite",
      email,
      password: PASSWORD,
      role: "admin",
    },
  })

  assert.equal(result.user.role, "client")
  const account = findUser(email)
  assert.ok(account)
  assert.equal(account.role, "client")
}

async function testClientAndVendorSignupRoles() {
  const clientEmail = "client-signup@example.test"
  const client = await testAuth.api.signUpEmail({
    body: {
      name: "Client",
      email: clientEmail,
      password: PASSWORD,
    },
  })
  assert.equal(client.user.role, "client")

  const vendorEmail = "vendor-signup@example.test"
  const vendor = await testAuth.api.signUpEmail({
    body: {
      name: "Vendeur",
      email: vendorEmail,
      password: PASSWORD,
    },
  })
  assert.equal(vendor.user.role, "client")

  const vendorAccount = findUser(vendorEmail)
  assert.ok(vendorAccount)
  vendorAccount.role = "vendor"

  const vendorAccess = evaluateAccountAccess({
    id: vendorAccount.id,
    role: vendorAccount.role,
    emailVerified: false,
    isActive: true,
  })
  assert.equal(vendorAccess.status, "unverified")

  vendorAccount.emailVerified = true
  const verifiedVendorAccess = evaluateAccountAccess({
    id: vendorAccount.id,
    role: vendorAccount.role,
    emailVerified: true,
    isActive: true,
  })
  assert.equal(verifiedVendorAccess.status, "ready")
  assert.equal(verifiedVendorAccess.role, "vendor")
  assert.equal(verifiedVendorAccess.redirectTo, "/dashboard/vendeur")
}

async function testProfileUpdateCannotPromoteRole() {
  const email = "update-role@example.test"
  await createVerifiedUser(email, "client")
  const signInResult = await signIn(email)
  const setCookie = signInResult.headers.get("set-cookie")
  assert.ok(setCookie)
  const sessionCookie = setCookie.split(";")[0]
  const authHeaders = new Headers({ cookie: sessionCookie })

  await expectRejected(
    () =>
      (
        testAuth.api.updateUser as unknown as (
          input: Record<string, unknown>
        ) => Promise<unknown>
      )({
        body: { role: "admin" },
        headers: authHeaders,
      }),
    "FIELD_NOT_ALLOWED"
  )

  const account = findUser(email)
  assert.ok(account)
  assert.equal(account.role, "client")
}

async function testDashboardAccessMatrix() {
  const dashboardPaths = Object.values(ROLE_DASHBOARD_PATHS)

  for (const role of AUTH_ROLES) {
    for (const targetPath of dashboardPaths) {
      const decision = resolveDashboardAccess(targetPath, role)
      const expectedAllowed =
        targetPath === ROLE_DASHBOARD_PATHS[role] ||
        (role === "collaborateur" && targetPath === "/dashboard/admin")

      assert.equal(
        decision.allowed,
        expectedAllowed,
        `${role} vers ${targetPath}`
      )
      if (!expectedAllowed) {
        assert.equal(decision.redirectTo, ROLE_DASHBOARD_PATHS[role])
      }
    }
  }

  assert.equal(
    resolveDashboardAccess("/dashboard/admin", "client").redirectTo,
    "/dashboard/client"
  )
  assert.equal(
    resolveDashboardAccess("/dashboard/client", "vendor").redirectTo,
    "/dashboard/vendeur"
  )
  assert.equal(
    resolveDashboardAccess("/dashboard/client", "admin").redirectTo,
    "/dashboard/admin"
  )
  assert.equal(
    resolveDashboardAccess("/dashboard/collaborateur", "collaborateur")
      .allowed,
    true
  )
}

async function testInvalidRoleAndInactiveAccountsAreBlocked() {
  const invalidRoleEmail = "invalid-role@example.test"
  const { account } = await createVerifiedUser(invalidRoleEmail, "client")
  account.role = "unknown-role"
  const sessionCountBefore = memoryDb.session.length

  let invalidRoleRejected = false
  try {
    await signIn(invalidRoleEmail)
  } catch {
    invalidRoleRejected = true
  }
  assert.equal(invalidRoleRejected, true)
  assert.equal(memoryDb.session.length, sessionCountBefore)

  const inactiveEmail = "inactive@example.test"
  const { account: inactiveAccount } = await createVerifiedUser(
    inactiveEmail,
    "client"
  )
  inactiveAccount.isActive = false

  let inactiveRejected = false
  try {
    await signIn(inactiveEmail)
  } catch {
    inactiveRejected = true
  }
  assert.equal(inactiveRejected, true)
  assert.equal(memoryDb.session.length, sessionCountBefore)

  assert.equal(
    evaluateAccountAccess({
      id: "invalid-role",
      role: "unknown-role",
      emailVerified: true,
      isActive: true,
    }).status,
    "invalid_role"
  )
  assert.equal(
    evaluateAccountAccess({
      id: "inactive",
      role: "client",
      emailVerified: true,
      isActive: false,
    }).status,
    "inactive"
  )
}

async function testPasswordResetTokenSafety() {
  const token = "123e4567-e89b-42d3-a456-426614174000"

  assert.equal(normalizePasswordResetToken(token), token)
  assert.equal(normalizePasswordResetToken("not-a-token"), null)

  const identifiers = getPasswordResetTokenIdentifiers(token)
  assert.equal(identifiers.length, 2)
  assert.match(identifiers[0], /^password-reset-[a-f0-9]{64}$/)
  assert.notEqual(identifiers[0], `password-reset-${token}`)
  assert.equal(identifiers[1], `password-reset-${token}`)
}

async function testSharedPasswordPolicy() {
  assert.equal(validateNewPassword(""), "Le mot de passe est requis.")
  assert.equal(
    validateNewPassword("court"),
    "Le mot de passe doit contenir au moins 8 caractères."
  )
  assert.equal(validateNewPassword("MotDePasseSolide123!"), null)
}

async function testTemporaryCollaboratorPasswordBlocksDashboards() {
  const decision = resolveDashboardAccess(
    "/dashboard/admin",
    "collaborateur",
    true
  )
  assert.equal(decision.allowed, false)
  assert.equal(decision.redirectTo, "/mot-de-passe-temporaire")
}

async function testResultsAccessByRole() {
  // Tout compte authentifié peut accéder à sa page de résultats dans son dashboard
  assert.deepEqual(resolveResultsAccess("client"), { allowed: true })
  assert.deepEqual(resolveResultsAccess("vendor"), { allowed: true })
  assert.deepEqual(resolveResultsAccess("admin"), { allowed: true })
  assert.deepEqual(resolveResultsAccess("collaborateur"), { allowed: true })
  // Aucun compte → redirection vers dashboard client
  assert.deepEqual(resolveResultsAccess(undefined), {
    allowed: false,
    redirectTo: "/dashboard/client",
  })

  // resolveClientResultsAccess est conservé pour rétrocompatibilité
  assert.deepEqual(resolveClientResultsAccess("client"), { allowed: true })
  assert.deepEqual(resolveClientResultsAccess("vendor"), {
    allowed: false,
    redirectTo: "/dashboard/vendeur",
  })
  assert.deepEqual(resolveClientResultsAccess("admin"), {
    allowed: false,
    redirectTo: "/dashboard/admin",
  })
  assert.deepEqual(resolveClientResultsAccess("collaborateur"), {
    allowed: false,
    redirectTo: "/dashboard/collaborateur",
  })
  assert.deepEqual(resolveClientResultsAccess(undefined), {
    allowed: false,
    redirectTo: "/dashboard/client",
  })
}

async function testAdminCannotReplaceEmailDirectly() {
  assert.equal(
    isSameAdminEmail("client@example.test", "client@example.test"),
    true
  )
  assert.equal(
    isSameAdminEmail("client@example.test", "CLIENT@example.test"),
    true
  )
  assert.equal(
    isSameAdminEmail("client@example.test", "attacker@example.test"),
    false
  )
  assert.equal(isSameAdminEmail("client@example.test", 42), false)
}

async function testCollaboratorPermissionsAreClearedOnDemotion() {
  assert.equal(
    shouldClearCollaboratorPermissions("collaborateur", "client"),
    true
  )
  assert.equal(
    shouldClearCollaboratorPermissions("collaborateur", "vendor"),
    true
  )
  assert.equal(
    shouldClearCollaboratorPermissions("collaborateur", "admin"),
    true
  )
  assert.equal(
    shouldClearCollaboratorPermissions("client", "collaborateur"),
    false
  )
  assert.equal(
    shouldClearCollaboratorPermissions("collaborateur", "collaborateur"),
    false
  )
}

async function testOtpResponseDoesNotRevealAccountState() {
  const unknown = getOtpSendPublicResponse("unknown")
  const verified = getOtpSendPublicResponse("already_verified")
  const cooldown = getOtpSendPublicResponse("cooldown")
  const sent = getOtpSendPublicResponse("sent")

  assert.deepEqual(unknown, verified)
  assert.deepEqual(unknown, cooldown)
  assert.deepEqual(unknown, sent)
  assert.equal(unknown.status, 200)
  assert.deepEqual(unknown.body, { ok: true })
}

async function testSocialSignupRequiresServerIntent() {
  const secret = "gazpoints-social-signup-test-secret-only"
  const now = Date.now()
  const clientToken = createSocialSignupIntent("client", now, secret)
  const vendorToken = createSocialSignupIntent("vendor", now, secret)
  const cookieHeader = `${SOCIAL_SIGNUP_INTENT_COOKIE}=${encodeURIComponent(
    clientToken
  )}`

  assert.equal(GOOGLE_SOCIAL_PROVIDER_POLICY.disableImplicitSignUp, true)
  assert.equal(verifySocialSignupIntent(clientToken, now, secret)?.role, "client")
  assert.equal(
    verifySocialSignupIntent(
      clientToken,
      now + 5 * 60 * 1000 + 1,
      secret
    ),
    null
  )

  assert.equal(
    resolveSocialSignupIntent({
      requestedSignUp: true,
      provider: "google",
      cookieHeader,
      now,
      secret,
    })?.role,
    "client"
  )
  assert.equal(
    resolveSocialSignupIntent({
      requestedSignUp: false,
      provider: "google",
      cookieHeader,
      now,
      secret,
    }),
    null
  )
  assert.equal(
    resolveSocialSignupIntent({
      requestedSignUp: true,
      provider: "other",
      cookieHeader,
      now,
      secret,
    }),
    null
  )
  assert.equal(
    resolveSocialSignupIntent({
      requestedSignUp: true,
      provider: "google",
      cookieHeader: `${SOCIAL_SIGNUP_INTENT_COOKIE}=invalid`,
      now,
      secret,
    }),
    null
  )

  const [payload, signature] = vendorToken.split(".")
  const tamperedToken = `${payload.slice(0, -1)}${
    payload.endsWith("A") ? "B" : "A"
  }.${signature}`
  assert.equal(
    verifySocialSignupIntent(tamperedToken, now, secret),
    null
  )

  assert.equal(
    getSocialSignupRoleFromServerContext({
      [SOCIAL_SIGNUP_ROLE_CONTEXT_KEY]: "vendor",
    }),
    "vendor"
  )
  assert.equal(
    getSocialSignupRoleFromServerContext({
      [SOCIAL_SIGNUP_ROLE_CONTEXT_KEY]: "admin",
    }),
    null
  )
}

async function testGoogleCallbackRequiresServerIntent() {
  const socialDb: MemoryDatabase = {
    user: [],
    account: [],
    session: [],
    verification: [],
    rateLimit: [],
  }
  const secret = "gazpoints-google-callback-test-secret-only"
  const socialAuth = betterAuth({
    baseURL: BASE_URL,
    secret,
    database: memoryAdapter(socialDb),
    socialProviders: {
      google: {
        clientId: "test-client-id",
        clientSecret: "test-client-secret",
        disableImplicitSignUp: true,
        getUserInfo: async (tokens) => {
          const code = (tokens.accessToken ?? "").replace("test-access:", "")
          const email = `social-${code}@example.test`
          return {
            user: {
              name: "Utilisateur Google",
              email,
              emailVerified: true,
            },
            data: {
              aud: "test-audience",
              azp: "test-authorized-party",
              email,
              email_verified: true,
              exp: Math.floor(Date.now() / 1000) + 3600,
              family_name: "Google",
              given_name: "Utilisateur",
              iat: Math.floor(Date.now() / 1000),
              iss: "https://accounts.google.com",
              jti: `test-${code}`,
              locale: "fr",
              name: "Utilisateur Google",
              nbf: Math.floor(Date.now() / 1000),
              picture: "https://example.test/avatar.png",
              sub: `google-${code}`,
            },
          }
        },
      },
    },
    hooks: {
      before: createSocialSignupBeforeHook(secret),
    },
    user: {
      additionalFields: {
        role: AUTH_ROLE_ADDITIONAL_FIELD,
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user: Record<string, unknown>) => ({
            data: {
              ...user,
              role: await getServerTrustedSocialSignupRole(),
            },
          }),
        },
      },
    },
  })

  const context = await socialAuth.$context
  const google = context.socialProviders.find(
    (provider) => provider.id === "google"
  )
  assert.ok(google)
  google.validateAuthorizationCode = async ({ code }) => ({
    accessToken: `test-access:${code}`,
    tokenType: "Bearer",
  })

  async function runGoogleFlow(
    intentRole: "client" | "vendor" | null,
    code: string
  ) {
    const intent = intentRole
      ? createSocialSignupIntent(intentRole, Date.now(), secret)
      : null
    const signIn = await socialAuth.api.signInSocial({
      body: {
        provider: "google",
        callbackURL: "/api/auth/role-redirect",
        requestSignUp: true,
      },
      headers: new Headers({
        cookie: intent
          ? `${SOCIAL_SIGNUP_INTENT_COOKIE}=${encodeURIComponent(intent)}`
          : "",
      }),
      returnHeaders: true,
    })

    const authorizationUrlValue = signIn.response.url
    assert.ok(authorizationUrlValue)
    const authorizationUrl = new URL(authorizationUrlValue)
    const state = authorizationUrl.searchParams.get("state")
    assert.ok(state)
    const stateCookie = signIn.headers.get("set-cookie")?.split(";")[0]
    assert.ok(stateCookie)

    try {
      await socialAuth.api.callbackOAuth({
        params: { id: "google" },
        query: { state, code },
        headers: new Headers({ cookie: stateCookie }),
      })
      return {
        location: null,
        hasSessionCookie: false,
      }
    } catch (error) {
      const typed = error as {
        statusCode?: number
        headers?: Headers
      }
      return {
        location: typed.headers?.get("location") ?? null,
        hasSessionCookie:
          typed.headers
            ?.getSetCookie()
            .some((cookie) =>
              cookie.startsWith("better-auth.session_token=")
            ) ?? false,
      }
    }
  }

  const withoutIntent = await runGoogleFlow(null, "without-intent")
  assert.match(withoutIntent.location ?? "", /error=signup_disabled/)
  assert.equal(withoutIntent.hasSessionCookie, false)
  assert.equal(socialDb.user.length, 0)

  const client = await runGoogleFlow("client", "client")
  assert.equal(client.location, "/api/auth/role-redirect")
  assert.equal(client.hasSessionCookie, true)
  assert.equal(socialDb.user.length, 1)
  assert.equal(socialDb.user[0].role, "client")
  assert.equal(socialDb.user[0].email, "social-client@example.test")

  const vendor = await runGoogleFlow("vendor", "vendor")
  assert.equal(vendor.location, "/api/auth/role-redirect")
  assert.equal(vendor.hasSessionCookie, true)
  assert.equal(socialDb.user.length, 2)
  assert.equal(socialDb.user[1].role, "vendor")
  assert.equal(socialDb.user[1].email, "social-vendor@example.test")

  // Un compte Google déjà créé doit pouvoir se connecter sans intention
  // d'inscription. L'absence d'intention ne doit jamais modifier son rôle.
  const existingAccount = await runGoogleFlow(null, "client")
  assert.equal(existingAccount.location, "/api/auth/role-redirect")
  assert.equal(existingAccount.hasSessionCookie, true)
  assert.equal(socialDb.user.length, 2)
  assert.equal(socialDb.user[0].role, "client")
}

async function main() {
  await testFourRoleDestinations()
  await testWrongCredentialsDoNotCreateUsers()
  await testUnverifiedAccountCannotSignIn()
  await testPublicSignupsCannotChooseStaffRole()
  await testClientAndVendorSignupRoles()
  await testProfileUpdateCannotPromoteRole()
  await testDashboardAccessMatrix()
  await testInvalidRoleAndInactiveAccountsAreBlocked()
  await testPasswordResetTokenSafety()
  await testSharedPasswordPolicy()
  await testTemporaryCollaboratorPasswordBlocksDashboards()
  await testClientResultsPageIsClientOnly()
  await testAdminCannotReplaceEmailDirectly()
  await testCollaboratorPermissionsAreClearedOnDemotion()
  await testOtpResponseDoesNotRevealAccountState()
  await testSocialSignupRequiresServerIntent()
  await testGoogleCallbackRequiresServerIntent()

  console.log("Auth routing tests: 17 scenarios passed")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
