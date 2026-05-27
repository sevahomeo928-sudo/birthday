import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { siteConfig } from "../../db/schema.js";

const DEFAULT_PERSON = {
  name: "Chotu",
  roastMessage:
    "Abe nalle, ek aur saal barbaad kar diya tune. Zindagi mein kuch dhang ka kaam kar le ab. Chal koi na, tu jaisa bhi hai mera bhai hai. Happy Birthday! 🎉 Party de chup chap.",
  birthDate: "March 14th",
};

const DEFAULT_SENDERS = [
  {
    id: "1",
    name: "Ashish",
    message: 'sudo make-wish --name=friend --force\nconsole.log("Happy Bday bhai");',
    special: "CS",
  },
  {
    id: "2",
    name: "Aditya",
    message: "Bhai tu sudhrega nahi na? Happy Birthday! Ghoomne chalte hain.",
    special: "None",
  },
  {
    id: "3",
    name: "Rohit",
    message: "Aaj toh naha leta gadhe! Chal khush reh, Happy bday.",
    special: "None",
  },
];

export default async (req: Request) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (req.method === "GET") {
    const rows = await db.select().from(siteConfig).limit(1);
    if (rows.length === 0) {
      return Response.json(
        {
          person: DEFAULT_PERSON,
          senders: DEFAULT_SENDERS,
          theme: "classic",
        },
        { headers }
      );
    }
    const row = rows[0];
    return Response.json(
      {
        person: JSON.parse(row.person),
        senders: JSON.parse(row.senders),
        theme: row.theme,
      },
      { headers }
    );
  }

  if (req.method === "PUT") {
    const body = await req.json();
    const personJson = JSON.stringify(body.person);
    const sendersJson = JSON.stringify(body.senders);
    const theme = body.theme || "classic";

    const existing = await db.select().from(siteConfig).limit(1);
    if (existing.length === 0) {
      await db.insert(siteConfig).values({
        person: personJson,
        senders: sendersJson,
        theme,
      });
    } else {
      const { eq } = await import("drizzle-orm");
      await db
        .update(siteConfig)
        .set({ person: personJson, senders: sendersJson, theme, updatedAt: new Date() })
        .where(eq(siteConfig.id, existing[0].id));
    }

    return Response.json({ ok: true }, { headers });
  }

  return new Response("Method not allowed", { status: 405, headers });
};

export const config: Config = {
  path: "/api/config",
};
