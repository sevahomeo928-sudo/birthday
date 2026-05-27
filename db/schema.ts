import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const siteConfig = pgTable("site_config", {
  id: serial().primaryKey(),
  person: text().notNull(),
  senders: text().notNull(),
  theme: text().notNull().default("classic"),
  updatedAt: timestamp("updated_at").defaultNow(),
});
