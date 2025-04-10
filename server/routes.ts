import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import express from "express";
import { z } from "zod";
import { insertTabSchema, insertBookmarkSchema, insertSectionSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // API prefix
  const api = express.Router();
  app.use("/api", api);

  // Tabs Endpoints
  api.get("/tabs", async (req, res) => {
    const tabs = await storage.getTabs();
    res.json(tabs);
  });

  api.get("/tabs/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const tab = await storage.getTab(id);
    if (!tab) {
      return res.status(404).json({ message: "Tab not found" });
    }
    res.json(tab);
  });

  api.post("/tabs", async (req, res) => {
    try {
      const tabData = insertTabSchema.parse(req.body);
      const tab = await storage.createTab(tabData);
      res.status(201).json(tab);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid tab data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create tab" });
    }
  });

  api.patch("/tabs/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    try {
      const tabData = insertTabSchema.partial().parse(req.body);
      const tab = await storage.updateTab(id, tabData);
      if (!tab) {
        return res.status(404).json({ message: "Tab not found" });
      }
      res.json(tab);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid tab data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update tab" });
    }
  });

  api.delete("/tabs/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const success = await storage.deleteTab(id);
    if (!success) {
      return res.status(404).json({ message: "Tab not found" });
    }
    res.status(204).end();
  });

  // Bookmarks Endpoints
  api.get("/bookmarks", async (req, res) => {
    const tabId = req.query.tabId ? parseInt(req.query.tabId as string) : undefined;
    
    if (tabId) {
      if (isNaN(tabId)) {
        return res.status(400).json({ message: "Invalid tabId format" });
      }
      const bookmarks = await storage.getBookmarksByTab(tabId);
      return res.json(bookmarks);
    }
    
    const bookmarks = await storage.getBookmarks();
    res.json(bookmarks);
  });

  api.get("/bookmarks/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const bookmark = await storage.getBookmark(id);
    if (!bookmark) {
      return res.status(404).json({ message: "Bookmark not found" });
    }
    res.json(bookmark);
  });

  api.post("/bookmarks", async (req, res) => {
    try {
      const bookmarkData = insertBookmarkSchema.parse(req.body);
      const bookmark = await storage.createBookmark(bookmarkData);
      res.status(201).json(bookmark);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid bookmark data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create bookmark" });
    }
  });

  api.patch("/bookmarks/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    try {
      const bookmarkData = insertBookmarkSchema.partial().parse(req.body);
      const bookmark = await storage.updateBookmark(id, bookmarkData);
      if (!bookmark) {
        return res.status(404).json({ message: "Bookmark not found" });
      }
      res.json(bookmark);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid bookmark data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update bookmark" });
    }
  });

  api.delete("/bookmarks/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const success = await storage.deleteBookmark(id);
    if (!success) {
      return res.status(404).json({ message: "Bookmark not found" });
    }
    res.status(204).end();
  });

  // Sections Endpoints
  api.get("/sections", async (req, res) => {
    const tabId = req.query.tabId ? parseInt(req.query.tabId as string) : undefined;
    
    if (tabId) {
      if (isNaN(tabId)) {
        return res.status(400).json({ message: "Invalid tabId format" });
      }
      const sections = await storage.getSectionsByTab(tabId);
      return res.json(sections);
    }
    
    const sections = await storage.getSections();
    res.json(sections);
  });

  api.get("/sections/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const section = await storage.getSection(id);
    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }
    res.json(section);
  });

  api.post("/sections", async (req, res) => {
    try {
      const sectionData = insertSectionSchema.parse(req.body);
      const section = await storage.createSection(sectionData);
      res.status(201).json(section);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid section data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create section" });
    }
  });

  api.patch("/sections/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    try {
      const sectionData = insertSectionSchema.partial().parse(req.body);
      const section = await storage.updateSection(id, sectionData);
      if (!section) {
        return res.status(404).json({ message: "Section not found" });
      }
      res.json(section);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid section data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update section" });
    }
  });

  api.delete("/sections/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const success = await storage.deleteSection(id);
    if (!success) {
      return res.status(404).json({ message: "Section not found" });
    }
    res.status(204).end();
  });

  // Settings Endpoints
  api.get("/settings", async (req, res) => {
    const settings = await storage.getSettings();
    res.json(settings);
  });

  api.patch("/settings", async (req, res) => {
    try {
      const settings = await storage.updateSettings(req.body);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
