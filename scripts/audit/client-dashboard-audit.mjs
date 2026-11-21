import fs from "node:fs";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import { neon } from "@neondatabase/serverless";
import { hashPassword } from "better-auth/crypto";

const BASE = process.env.AUDIT_BASE || "http://localhost:3000";
const envText = fs.readFileSync(".env", "utf8");

function envValue(key) {
  const match = envText.match(new RegExp(`^${key}=(.*)$`, "m"));
  return match ? match[1].trim().replace(/^["']|["']$/g, "") : null;
}

const databaseUrl = envValue("DATABASE_URL");
if (!databaseUrl) throw new Error("DATABASE_URL missing");

const sql = neon(databaseUrl);
const password = `Audit-${crypto.randomUUID()}A1!`;
const clients = [
  {
    userId: crypto.randomUUID(),
    email: `dashboard-audit-a-${Date.now()}-${crypto.randomUUID().slice(0, 8)}@example.com`,
    name: "Audit Dashboard Client A",
    cookie: "",
  },
  {
    userId: crypto.randomUUID(),
    email: `dashboard-audit-b-${Date.now()}-${crypto.randomUUID().slice(0, 8)}@example.com`,
    name: "Audit Dashboard Client B",
    cookie: "",
  },
];

function cookiesFrom(response) {
  const values = typeof response.headers.getSetCookie === "function"
    ? response.headers.getSetCookie()
    : [];
  return values.map((value) => value.split(";")[0]).filter(Boolean).join("; ");
}

async function request(path, options = {}, client = clients[0]) {
  const response = await fetch(`${BASE}${path}`, {
    redirect: "manual",
    ...options,
    headers: {
      Accept: "application/json",
      ...(client.cookie ? { Cookie: client.cookie } : {}),
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    // La page peut renvoyer du HTML. Le texte brut reste disponible.
  }
  return { status: response.status, location: response.headers.get("location"), body, text };
}

async function createClient(client) {
  const hash = await hashPassword(password);
  await sql.query(
    `insert into "user" (id, name, email, email_verified, role, phone_verified, created_at, updated_at)
     values ($1, $2, $3, true, 'client', false, now(), now())`,
    [client.userId, client.name, client.email],
  );
  await sql.query(
    `insert into "account" (id, account_id, provider_id, user_id, password, created_at, updated_at)
     values ($1, $2, 'credential', $3, $4, now(), now())`,
    [crypto.randomUUID(), client.userId, client.userId, hash],
  );
}

async function signIn(client) {
  const response = await fetch(`${BASE}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify({ email: client.email, password }),
  });
  client.cookie = cookiesFrom(response);
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    // Le message d'erreur HTTP reste disponible dans le texte.
  }
  assert.equal(
    response.status,
    200,
    `sign-in status ${response.status}: ${body?.message || body?.code || text.slice(0, 200)}`,
  );
  assert.ok(client.cookie, "session cookie missing");
}

async function cleanup() {
  for (const client of clients) {
    await sql.query(`delete from traffic_event where user_id = $1`, [client.userId]);
    await sql.query(`delete from "user" where id = $1`, [client.userId]);
  }
}

try {
  for (const client of clients) {
    await createClient(client);
  }

  for (const client of clients) {
    await signIn(client);
    const session = await request("/api/auth/get-session", {}, client);
    assert.equal(session.status, 200);
    assert.equal(session.body?.user?.id, client.userId, "session user mismatch");
    assert.equal(session.body?.user?.role, "client", "session role mismatch");
  }
  console.log("PASS two temporary clients signed in with isolated sessions");

  const pages = [
    "/dashboard/client",
    "/dashboard/profil",
    "/dashboard/recherches",
    "/dashboard/reservations",
    "/dashboard/historique",
    "/dashboard/notifications",
  ];
  for (const path of pages) {
    const response = await request(path, { headers: { Accept: "text/html" } });
    assert.equal(response.status, 200, `${path} status ${response.status} location ${response.location}`);
    assert.equal(response.location, null, `${path} redirected to ${response.location}`);
    console.log(`PASS page ${path} status=200 no_redirect`);
  }

  const profileBefore = await request("/api/user/me");
  assert.equal(profileBefore.status, 200);
  assert.equal(profileBefore.body?.user?.id, clients[0].userId, "profile user mismatch");

  const updatedName = "Audit Dashboard Client Updated";
  const updatedPhone = "+237 699 00 00 01";
  const profileUpdate = await request("/api/user/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: updatedName, phoneNumber: updatedPhone }),
  });
  assert.equal(profileUpdate.status, 200, `profile update failed: ${profileUpdate.text.slice(0, 200)}`);

  const profileAfter = await request("/api/user/me");
  assert.equal(profileAfter.status, 200);
  assert.equal(profileAfter.body?.user?.name, updatedName, "profile name was not persisted");
  assert.equal(profileAfter.body?.user?.phoneNumber, updatedPhone, "profile phone was not persisted");
  console.log("PASS profile name and phone persisted through the real API");

  const secondProfileUpdate = await request(
    "/api/user/profile",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Audit Dashboard Client B Updated" }),
    },
    clients[1],
  );
  assert.equal(secondProfileUpdate.status, 200);
  const firstProfileStillOwned = await request("/api/user/me");
  assert.equal(firstProfileStillOwned.body?.user?.name, updatedName, "profile update leaked across clients");
  console.log("PASS profile updates remain isolated between clients");

  const search = await request("/api/recherche");
  assert.equal(search.status, 200);
  assert.ok(Array.isArray(search.body?.results));
  assert.equal(search.body?.count, search.body?.results?.length, "search count mismatch");
  console.log(`PASS live search endpoint count=${search.body?.count}`);

  const uniqueBrand = `__audit_missing_brand_${crypto.randomUUID()}__`;
  const recordedSearch = await request(
    `/api/recherche?history=1&brand=${encodeURIComponent(uniqueBrand)}&format=__audit_missing_format__&zone=__audit_missing_zone__`,
  );
  assert.equal(recordedSearch.status, 200);
  assert.equal(recordedSearch.body?.count, 0, "missing search should return no result");

  const searches = await request("/api/historique/searches");
  assert.equal(searches.status, 200);
  assert.ok(Array.isArray(searches.body?.searches));
  const recordedItem = searches.body.searches.find((item) => item.brand === uniqueBrand);
  assert.ok(recordedItem, "search was not recorded in the authenticated history");
  assert.equal(recordedItem.resultsCount, 0, "empty search result count was not persisted");

  const storedSearchRows = await sql.query(
    `select metadata
     from traffic_event
     where user_id = $1 and event_type = 'search'
     order by created_at desc
     limit 1`,
    [clients[0].userId],
  );
  assert.equal(storedSearchRows.length, 1, "search event was not persisted in the database");
  const storedMetadata = storedSearchRows[0].metadata;
  assert.equal(storedMetadata.brand, uniqueBrand, "stored search brand mismatch");
  assert.equal(storedMetadata.resultsCount, 0, "stored search result count mismatch");
  console.log("PASS search history persisted in JSONB with the authenticated user identity");

  const secondSearches = await request("/api/historique/searches", {}, clients[1]);
  assert.equal(secondSearches.status, 200);
  assert.ok(
    !secondSearches.body?.searches?.some((item) => item.brand === uniqueBrand),
    "search history leaked across clients",
  );
  console.log("PASS search history remains isolated between clients");

  const historyReservations = await request("/api/historique/reservations");
  assert.equal(historyReservations.status, 200);
  assert.ok(Array.isArray(historyReservations.body?.reservations));
  console.log("PASS reservation history endpoint");

  const reservations = await request("/api/reservation/my?page=1&pageSize=50");
  assert.equal(reservations.status, 200);
  assert.ok(Array.isArray(reservations.body?.reservations));
  console.log("PASS reservations endpoint");

  const notificationTitle = `Audit notification ${crypto.randomUUID()}`;
  const createNotification = await request("/api/notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: clients[0].userId,
      type: "system",
      title: notificationTitle,
      message: "Temporary notification for the client dashboard audit",
    }),
  });
  assert.equal(createNotification.status, 200, `notification creation failed: ${createNotification.text.slice(0, 200)}`);

  const notifications = await request("/api/notifications?archived=false&limit=100");
  assert.equal(notifications.status, 200);
  assert.ok(Array.isArray(notifications.body?.notifications));
  assert.equal(typeof notifications.body?.unreadCount, "number");
  const notification = notifications.body.notifications.find((item) => item.title === notificationTitle);
  assert.ok(notification, "created notification was not returned");
  const notificationId = notification.id;
  console.log("PASS notification created for the authenticated client");

  const markRead = await request("/api/notifications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: notificationId, read: true }),
  });
  assert.equal(markRead.status, 200);
  const readNotifications = await request("/api/notifications?archived=false&read=true&limit=100");
  assert.ok(
    readNotifications.body?.notifications?.some((item) => item.id === notificationId),
    "notification read mutation was not persisted",
  );

  const archiveNotification = await request("/api/notifications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: notificationId, archived: true }),
  });
  assert.equal(archiveNotification.status, 200);
  const archivedNotifications = await request("/api/notifications?archived=true&limit=100");
  assert.ok(
    archivedNotifications.body?.notifications?.some((item) => item.id === notificationId),
    "notification archive mutation was not persisted",
  );
  console.log("PASS notification read and archive mutations persisted");

  const secondNotificationTitle = `Audit bulk notification ${crypto.randomUUID()}`;
  const createSecondNotification = await request("/api/notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: clients[0].userId,
      type: "system",
      title: secondNotificationTitle,
      message: "Temporary notification for the bulk mutation audit",
    }),
  });
  assert.equal(createSecondNotification.status, 200);
  const secondNotifications = await request("/api/notifications?archived=false&limit=100");
  const secondNotification = secondNotifications.body.notifications.find(
    (item) => item.title === secondNotificationTitle,
  );
  assert.ok(secondNotification, "bulk notification was not created");

  const bulkRead = await request("/api/notifications/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "mark-read", ids: [secondNotification.id] }),
  });
  assert.equal(bulkRead.status, 200);
  const bulkReadNotifications = await request("/api/notifications?archived=false&read=true&limit=100");
  assert.ok(
    bulkReadNotifications.body?.notifications?.some((item) => item.id === secondNotification.id),
    "bulk read mutation was not persisted",
  );

  const bulkDelete = await request("/api/notifications/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "delete", ids: [secondNotification.id] }),
  });
  assert.equal(bulkDelete.status, 200);
  const afterBulkDelete = await request("/api/notifications?archived=false&read=true&limit=100");
  assert.ok(
    !afterBulkDelete.body?.notifications?.some((item) => item.id === secondNotification.id),
    "bulk delete did not remove the notification",
  );
  console.log("PASS notification bulk read and delete mutations persisted");

  const secondNotificationsBeforeAttack = await request(
    "/api/notifications?archived=false&limit=100",
    {},
    clients[1],
  );
  assert.equal(secondNotificationsBeforeAttack.status, 200);
  assert.ok(
    !secondNotificationsBeforeAttack.body?.notifications?.some((item) => item.id === notificationId),
    "notification leaked to the second client",
  );

  const crossCreate = await request(
    "/api/notifications",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: clients[0].userId,
        type: "system",
        title: "Forbidden cross client notification",
        message: "This notification must not be created",
      }),
    },
    clients[1],
  );
  assert.equal(crossCreate.status, 403, "cross client notification creation was not forbidden");

  const crossPatch = await request(
    "/api/notifications",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: notificationId, read: false, archived: false }),
    },
    clients[1],
  );
  assert.equal(crossPatch.status, 404, "cross client notification patch was not rejected");

  const crossDelete = await request(
    `/api/notifications/${notificationId}`,
    { method: "DELETE" },
    clients[1],
  );
  assert.equal(crossDelete.status, 404, "cross client notification delete was not rejected");

  const crossBulk = await request(
    "/api/notifications/bulk",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", ids: [notificationId] }),
    },
    clients[1],
  );
  assert.equal(crossBulk.status, 200);
  const firstNotificationsAfterAttack = await request(
    "/api/notifications?archived=true&limit=100",
  );
  assert.ok(
    firstNotificationsAfterAttack.body?.notifications?.some((item) => item.id === notificationId),
    "cross client bulk action changed the first client notification",
  );
  console.log("PASS notification mutations remain isolated between clients");

  const deleteNotification = await request(`/api/notifications/${notificationId}`, {
    method: "DELETE",
  });
  assert.equal(deleteNotification.status, 200);
  const afterDelete = await request("/api/notifications?archived=true&limit=100");
  assert.ok(
    !afterDelete.body?.notifications?.some((item) => item.id === notificationId),
    "notification delete did not remove the notification",
  );
  console.log("PASS notification delete mutation persisted");

  const previousCookie = clients[0].cookie;
  clients[0].cookie = "";
  const anonymousResponse = await request(
    "/dashboard/historique",
    { headers: { Accept: "text/html" } },
    clients[0],
  );
  clients[0].cookie = previousCookie;
  assert.equal(anonymousResponse.status, 307);
  assert.match(anonymousResponse.location || "", /\/connexion/);
  console.log("PASS unauthenticated client page redirects to login");

  console.log("HTTP_AUDIT_PASS");
} finally {
  await cleanup();
}
