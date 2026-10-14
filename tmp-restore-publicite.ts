import "dotenv/config";
import { db } from "@/db";
import { publicite } from "@/db/schema";
import { eq } from "drizzle-orm";

const ROW = {
  id: "1eba0686-18d8-45af-81d0-9d501a6f2278",
  title: "Salle à Mangé 4 Pls Ouverte",
  description:
    "Malheureusement nous ne pouvons pas vérifier cette informations en ce moment",
  image: "(image téléchargée)",
  price: 12000,
  priceLabel: "slode",
  location: "Douala Akwa",
  phone: "+237659169960",
  linkUrl: "https://petchcrea.com/under-desk-storage/",
  slot: "home_hero",
  status: "active",
  startAt: new Date("2026-10-13T19:05:00.000Z"),
  endAt: new Date("2026-10-13T19:15:00.000Z"),
  createdAt: new Date("2026-10-13T17:57:33.621Z"),
  updatedAt: new Date("2026-10-13T19:02:45.563Z"),
};

async function main() {
  const existing = await db
    .select()
    .from(publicite)
    .where(eq(publicite.id, ROW.id));

  if (existing.length > 0) {
    console.log("ALREADY_PRESENT");
  } else {
    await db.insert(publicite).values(ROW);
    console.log("INSERTED");
  }

  const back = await db
    .select()
    .from(publicite)
    .where(eq(publicite.id, ROW.id));
  const r = back[0];
  if (!r) {
    console.log("RESTORE_FAILED: row not found after insert");
    process.exit(1);
  }

  const checks: Array<[string, string, string]> = [
    ["id", r.id, ROW.id],
    ["title", r.title, ROW.title],
    ["description", r.description, ROW.description],
    ["image", r.image, ROW.image],
    ["price", String(r.price), String(ROW.price)],
    ["priceLabel", r.priceLabel, ROW.priceLabel],
    ["location", r.location, ROW.location],
    ["phone", r.phone, ROW.phone],
    ["linkUrl", r.linkUrl, ROW.linkUrl],
    ["slot", r.slot, ROW.slot],
    ["status", r.status, ROW.status],
    ["startAt", r.startAt?.toISOString(), ROW.startAt.toISOString()],
    ["endAt", r.endAt?.toISOString(), ROW.endAt.toISOString()],
    ["createdAt", r.createdAt?.toISOString(), ROW.createdAt.toISOString()],
    ["updatedAt", r.updatedAt?.toISOString(), ROW.updatedAt.toISOString()],
  ];

  let ok = true;
  for (const [k, got, want] of checks) {
    const pass = got === want;
    if (!pass) ok = false;
    console.log(
      `${pass ? "PASS" : "FAIL"} ${k}: got=${JSON.stringify(got)} want=${JSON.stringify(want)}`
    );
  }
  console.log(ok ? "RESTORE_OK" : "RESTORE_MISMATCH");
  process.exit(ok ? 0 : 2);
}

main().catch(e => {
  console.error("ERROR", e);
  process.exit(1);
});