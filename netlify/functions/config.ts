import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { siteConfig } from "../../db/schema.js";

const DEFAULT_PERSON = {
  name: "Chotu",
  roastMessage: "Abe nalle, ek aur saal barbaad kar diya tune. Zindagi mein kuch dhang ka kaam kar le ab. Chal koi na, tu jaisa bhi hai mera bhai hai. Happy Birthday! 🎉 Party de chup chap.",
  birthDate: "March 14th",
};

const DEFAULT_SENDERS = [
  { id: "1", name: "Ashish", message: 'sudo make-wish --name=friend --force\nconsole.log("Happy Bday bhai");', special: "CS" },
  { id: "2", name: "Aditya", message: "Bhai tu sudhrega nahi na? Happy Birthday! Ghoomne chalte hain.", special: "None" },
  { id: "3", name: "Rohit", message: "Aaj toh naha leta gadhe! Chal khush reh, Happy bday.", special: "None" },
];

const DEFAULT_POLAROIDS = [
  { id: "p1", url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=400&fit=crop", caption: "Birthday Fun", roastBack: "" },
  { id: "p2", url: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=400&h=400&fit=crop", caption: "Party Time", roastBack: "" },
  { id: "p3", url: "https://images.unsplash.com/photo-1576607552471-f6cc9ef0d473?w=400&h=400&fit=crop", caption: "Happy Moments", roastBack: "" },
];

const DEFAULT_COURT = {
  charges: [
    { id: "c1", year: "2022", crime: "Pizza khake bill se bhaag gaya", evidence: "Teeno gawahon ne dekha, CCTV footage bhi hai", severity: "Heinous" },
    { id: "c2", year: "2021", crime: 'Group project mein "10 minute mein aata hoon" bolke 3 ghante baad aaya', evidence: "WhatsApp read receipts pe blue tick the", severity: "Serious" },
    { id: "c3", year: "2023", crime: "Doston ki photo Instagram pe bina permission ke post kar diya", evidence: "Screenshot saved hai aaj bhi", severity: "Minor" },
    { id: "c4", year: "2020", crime: "Cinema mein popcorn khatam hone ke baad dosto ka khata raha", evidence: "3 gawah aur ek khali tub", severity: "Heinous" },
  ],
  members: [
    { role: "Judge",          name: "Hon. Justice Bade Bhai", verdict: "Dost rehne ki saza — life imprisonment! 😂" },
    { role: "Sarkari Vakeel", name: "Adv. Ashish",            verdict: "Mulzim clearly guilty hai, milord!" },
    { role: "Bachav Vakeel",  name: "Adv. Rohit",             verdict: "Mera client bewakoof hai, par dil ka achha hai." },
    { role: "Gawah",          name: "Aditya",                 verdict: "Maine apni aankho se dekha tha, milord. 100%." },
  ],
};

export default async (req: Request) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });

  if (req.method === "GET") {
    const rows = await db.select().from(siteConfig).limit(1);
    if (rows.length === 0) {
      return Response.json({ person: DEFAULT_PERSON, senders: DEFAULT_SENDERS, theme: "classic", polaroids: DEFAULT_POLAROIDS, court: DEFAULT_COURT }, { headers });
    }
    const row = rows[0];
    return Response.json({
      person:   JSON.parse(row.person),
      senders:  JSON.parse(row.senders),
      theme:    row.theme,
      polaroids: row.polaroids ? JSON.parse(row.polaroids) : DEFAULT_POLAROIDS,
      court:    row.court && row.court !== '{}' ? JSON.parse(row.court) : DEFAULT_COURT,
    }, { headers });
  }

  if (req.method === "PUT") {
    const body = await req.json();
    const personJson   = JSON.stringify(body.person);
    const sendersJson  = JSON.stringify(body.senders);
    const polaroidsJson = JSON.stringify(body.polaroids || []);
    const courtJson    = JSON.stringify(body.court || DEFAULT_COURT);
    const theme        = body.theme || "classic";

    const existing = await db.select().from(siteConfig).limit(1);
    if (existing.length === 0) {
      await db.insert(siteConfig).values({ person: personJson, senders: sendersJson, theme, polaroids: polaroidsJson, court: courtJson });
    } else {
      const { eq } = await import("drizzle-orm");
      await db.update(siteConfig)
        .set({ person: personJson, senders: sendersJson, theme, polaroids: polaroidsJson, court: courtJson, updatedAt: new Date() })
        .where(eq(siteConfig.id, existing[0].id));
    }
    return Response.json({ ok: true }, { headers });
  }

  return new Response("Method not allowed", { status: 405, headers });
};

export const config: Config = { path: "/api/config" };
