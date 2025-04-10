import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Tab Schema
export const tabs = pgTable("tabs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  order: integer("order").notNull(),
  backgroundImage: text("background_image"),
  autoSwitch: boolean("auto_switch").default(false),
});

export const insertTabSchema = createInsertSchema(tabs).pick({
  name: true,
  order: true,
  backgroundImage: true,
  autoSwitch: true,
});

// Bookmark Schema
export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  tabId: integer("tab_id").notNull(),
  url: text("url").notNull(),
  title: text("title").notNull(),
  favicon: text("favicon"),
  sectionName: text("section_name").notNull(),
  order: integer("order").notNull(),
});

export const insertBookmarkSchema = createInsertSchema(bookmarks).pick({
  tabId: true,
  url: true,
  title: true,
  favicon: true,
  sectionName: true,
  order: true,
});

// Section Schema
export const sections = pgTable("sections", {
  id: serial("id").primaryKey(),
  tabId: integer("tab_id").notNull(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  order: integer("order").notNull(),
});

export const insertSectionSchema = createInsertSchema(sections).pick({
  tabId: true,
  name: true,
  color: true,
  order: true,
});

// Settings Schema
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  theme: text("theme").notNull().default("system"),
  autoRun: boolean("auto_run").notNull().default(false),
});

export const insertSettingsSchema = createInsertSchema(settings).pick({
  theme: true,
  autoRun: true,
});

// Type definitions
export type Tab = typeof tabs.$inferSelect;
export type InsertTab = z.infer<typeof insertTabSchema>;

export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;

export type Section = typeof sections.$inferSelect;
export type InsertSection = z.infer<typeof insertSectionSchema>;

export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
