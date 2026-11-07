import "dotenv/config";
import { randomUUID } from "node:crypto";
import { db } from "./index";
import { disponibilite, pointDeVente } from "./schema";

const points = [
  {
    name: "Tradex Bonamoussadi",
    district: "Bonamoussadi",
    address: "Rond-point Bonamoussadi",
    phone: "+237 6 99 12 34 56",
    brands: ["Tradex"],
    formats: ["12,5 kg"],
    status: "disponible",
    minutesAgo: 15,
  },
  {
    name: "Tradex Akwa",
    district: "Akwa",
    address: "Carrefour Ndobo",
    phone: "+237 6 77 45 88 21",
    brands: ["Tradex"],
    formats: ["12,5 kg", "15 kg"],
    status: "disponible",
    minutesAgo: 8,
  },
  {
    name: "Total Bonapriso",
    district: "Bonapriso",
    address: "Face pharmacie du carrefour",
    phone: "+237 6 55 09 71 03",
    brands: ["Total"],
    formats: ["6 kg", "12,5 kg"],
    status: "a_confirmer",
    minutesAgo: 180,
  },
  {
    name: "SCTM Ndokotti",
    district: "Ndokotti",
    address: "Face station Tradex",
    phone: "+237 6 90 32 10 44",
    brands: ["SCTM"],
    formats: ["15 kg", "6 kg"],
    status: "a_confirmer",
    minutesAgo: 240,
  },
  {
    name: "Bocom Deïdo",
    district: "Deïdo",
    address: "Marché Deïdo",
    phone: "+237 6 98 60 22 17",
    brands: ["Bocom"],
    formats: ["6 kg"],
    status: "indisponible",
    minutesAgo: 360,
  },
] as const;

async function main() {
  const existing = await db
    .select({ id: pointDeVente.id })
    .from(pointDeVente)
    .limit(1);

  if (existing.length > 0) {
    console.log("Des points de vente existent déjà — seed ignoré.");
    return;
  }

  for (const p of points) {
    const pointId = randomUUID();
    await db.insert(pointDeVente).values({
      id: pointId,
      name: p.name,
      district: p.district,
      address: p.address,
      phone: p.phone,
      brands: [...p.brands],
      formats: [...p.formats],
    });
    await db.insert(disponibilite).values({
      id: randomUUID(),
      pointId,
      status: p.status,
      reportedByName: "GazPoint",
      source: "administration",
      createdAt: new Date(Date.now() - p.minutesAgo * 60_000),
    });
  }

  console.log(`${points.length} points de vente créés avec leur premier signalement.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
