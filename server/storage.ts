import { 
  tabs, type Tab, type InsertTab,
  bookmarks, type Bookmark, type InsertBookmark,
  sections, type Section, type InsertSection, 
  settings, type Settings, type InsertSettings
} from "@shared/schema";

export interface IStorage {
  // Tab operations
  getTabs(): Promise<Tab[]>;
  getTab(id: number): Promise<Tab | undefined>;
  createTab(tab: InsertTab): Promise<Tab>;
  updateTab(id: number, tab: Partial<InsertTab>): Promise<Tab | undefined>;
  deleteTab(id: number): Promise<boolean>;

  // Bookmark operations
  getBookmarks(): Promise<Bookmark[]>;
  getBookmarksByTab(tabId: number): Promise<Bookmark[]>;
  getBookmark(id: number): Promise<Bookmark | undefined>;
  createBookmark(bookmark: InsertBookmark): Promise<Bookmark>;
  updateBookmark(id: number, bookmark: Partial<InsertBookmark>): Promise<Bookmark | undefined>;
  deleteBookmark(id: number): Promise<boolean>;

  // Section operations
  getSections(): Promise<Section[]>;
  getSectionsByTab(tabId: number): Promise<Section[]>;
  getSection(id: number): Promise<Section | undefined>;
  createSection(section: InsertSection): Promise<Section>;
  updateSection(id: number, section: Partial<InsertSection>): Promise<Section | undefined>;
  deleteSection(id: number): Promise<boolean>;

  // Settings operations
  getSettings(): Promise<Settings>;
  updateSettings(settings: Partial<InsertSettings>): Promise<Settings>;
}

export class MemStorage implements IStorage {
  private tabs: Map<number, Tab>;
  private bookmarks: Map<number, Bookmark>;
  private sections: Map<number, Section>;
  private settings: Settings;
  private tabIdCounter: number;
  private bookmarkIdCounter: number;
  private sectionIdCounter: number;

  constructor() {
    this.tabs = new Map();
    this.bookmarks = new Map();
    this.sections = new Map();
    this.tabIdCounter = 1;
    this.bookmarkIdCounter = 1;
    this.sectionIdCounter = 1;

    // Initialize with default data
    this.settings = {
      id: 1,
      theme: 'system',
      autoRun: false
    };

    // Initialize with default tabs
    const defaultTabs = [
      { id: this.tabIdCounter++, name: 'Cartoons', order: 1 },
      { id: this.tabIdCounter++, name: 'Animation', order: 2 },
      { id: this.tabIdCounter++, name: 'Editing', order: 3 },
      { id: this.tabIdCounter++, name: 'Color Grading', order: 4 }
    ];
    defaultTabs.forEach(tab => this.tabs.set(tab.id, tab));

    // Initialize with default sections
    const defaultSections = [
      { id: this.sectionIdCounter++, tabId: 1, name: 'Featured Bookmarks', color: '#FF6B35', order: 1 },
      { id: this.sectionIdCounter++, tabId: 2, name: 'Animation Resources', color: '#4ECDC4', order: 1 },
      { id: this.sectionIdCounter++, tabId: 3, name: 'Editing Tools', color: '#FFD166', order: 1 },
      { id: this.sectionIdCounter++, tabId: 4, name: 'Color Grading Tools', color: '#6BBA75', order: 1 }
    ];
    defaultSections.forEach(section => this.sections.set(section.id, section));

    // Initialize with default bookmarks
    const defaultBookmarks = [
      { id: this.bookmarkIdCounter++, tabId: 1, url: 'https://www.google.com', title: 'Google', favicon: 'https://www.google.com/favicon.ico', sectionName: 'Featured Bookmarks', order: 1 },
      { id: this.bookmarkIdCounter++, tabId: 1, url: 'https://www.youtube.com', title: 'YouTube', favicon: 'https://www.youtube.com/favicon.ico', sectionName: 'Featured Bookmarks', order: 2 },
      { id: this.bookmarkIdCounter++, tabId: 1, url: 'https://github.com/dashboard', title: 'GitHub', favicon: 'https://github.com/favicon.ico', sectionName: 'Featured Bookmarks', order: 3 },
      { id: this.bookmarkIdCounter++, tabId: 1, url: 'https://chat.openai.com', title: 'ChatGPT', favicon: 'https://chat.openai.com/favicon.ico', sectionName: 'Featured Bookmarks', order: 4 }
    ];
    defaultBookmarks.forEach(bookmark => this.bookmarks.set(bookmark.id, bookmark));
  }

  // Tab operations
  async getTabs(): Promise<Tab[]> {
    return Array.from(this.tabs.values()).sort((a, b) => a.order - b.order);
  }

  async getTab(id: number): Promise<Tab | undefined> {
    return this.tabs.get(id);
  }

  async createTab(tab: InsertTab): Promise<Tab> {
    const id = this.tabIdCounter++;
    const newTab: Tab = { ...tab, id };
    this.tabs.set(id, newTab);
    return newTab;
  }

  async updateTab(id: number, tab: Partial<InsertTab>): Promise<Tab | undefined> {
    const existingTab = this.tabs.get(id);
    if (!existingTab) return undefined;

    const updatedTab = { ...existingTab, ...tab };
    this.tabs.set(id, updatedTab);
    return updatedTab;
  }

  async deleteTab(id: number): Promise<boolean> {
    // Delete associated bookmarks first
    Array.from(this.bookmarks.values())
      .filter(bookmark => bookmark.tabId === id)
      .forEach(bookmark => this.bookmarks.delete(bookmark.id));

    // Delete associated sections
    Array.from(this.sections.values())
      .filter(section => section.tabId === id)
      .forEach(section => this.sections.delete(section.id));

    return this.tabs.delete(id);
  }

  // Bookmark operations
  async getBookmarks(): Promise<Bookmark[]> {
    return Array.from(this.bookmarks.values());
  }

  async getBookmarksByTab(tabId: number): Promise<Bookmark[]> {
    return Array.from(this.bookmarks.values())
      .filter(bookmark => bookmark.tabId === tabId)
      .sort((a, b) => a.order - b.order);
  }

  async getBookmark(id: number): Promise<Bookmark | undefined> {
    return this.bookmarks.get(id);
  }

  async createBookmark(bookmark: InsertBookmark): Promise<Bookmark> {
    const id = this.bookmarkIdCounter++;
    const newBookmark: Bookmark = { ...bookmark, id };
    this.bookmarks.set(id, newBookmark);
    return newBookmark;
  }

  async updateBookmark(id: number, bookmark: Partial<InsertBookmark>): Promise<Bookmark | undefined> {
    const existingBookmark = this.bookmarks.get(id);
    if (!existingBookmark) return undefined;

    const updatedBookmark = { ...existingBookmark, ...bookmark };
    this.bookmarks.set(id, updatedBookmark);
    return updatedBookmark;
  }

  async deleteBookmark(id: number): Promise<boolean> {
    return this.bookmarks.delete(id);
  }

  // Section operations
  async getSections(): Promise<Section[]> {
    return Array.from(this.sections.values());
  }

  async getSectionsByTab(tabId: number): Promise<Section[]> {
    return Array.from(this.sections.values())
      .filter(section => section.tabId === tabId)
      .sort((a, b) => a.order - b.order);
  }

  async getSection(id: number): Promise<Section | undefined> {
    return this.sections.get(id);
  }

  async createSection(section: InsertSection): Promise<Section> {
    const id = this.sectionIdCounter++;
    const newSection: Section = { ...section, id };
    this.sections.set(id, newSection);
    return newSection;
  }

  async updateSection(id: number, section: Partial<InsertSection>): Promise<Section | undefined> {
    const existingSection = this.sections.get(id);
    if (!existingSection) return undefined;

    const updatedSection = { ...existingSection, ...section };
    this.sections.set(id, updatedSection);
    return updatedSection;
  }

  async deleteSection(id: number): Promise<boolean> {
    return this.sections.delete(id);
  }

  // Settings operations
  async getSettings(): Promise<Settings> {
    return this.settings;
  }

  async updateSettings(settingsUpdate: Partial<InsertSettings>): Promise<Settings> {
    this.settings = { ...this.settings, ...settingsUpdate };
    return this.settings;
  }
}

export const storage = new MemStorage();
