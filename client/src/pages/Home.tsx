import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import TabBar from "@/components/TabBar";
import SearchBar from "@/components/SearchBar";
import BookmarkSection from "@/components/BookmarkSection";
import AddBookmarkDialog from "@/components/AddBookmarkDialog";
import WebsitePreview from "@/components/WebsitePreview";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { PlusIcon, BookmarkIcon } from "lucide-react";
import type { Tab, Bookmark, Section } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const [activeTabId, setActiveTabId] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [addingBookmark, setAddingBookmark] = useState<boolean>(false);
  const [autoRunEnabled, setAutoRunEnabled] = useState<boolean>(false);
  const [previewWebsite, setPreviewWebsite] = useState<string | null>(null);

  // Fetch settings
  const { data: settings } = useQuery({
    queryKey: ['/api/settings'],
  });

  // Fetch tabs
  const { data: tabs, isLoading: tabsLoading } = useQuery({
    queryKey: ['/api/tabs'],
  });

  // Fetch sections for active tab
  const { data: sections, isLoading: sectionsLoading } = useQuery({
    queryKey: ['/api/sections', activeTabId],
    queryFn: async () => {
      const res = await fetch(`/api/sections?tabId=${activeTabId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch sections");
      return res.json();
    },
  });

  // Fetch bookmarks for active tab
  const { data: bookmarks, isLoading: bookmarksLoading } = useQuery({
    queryKey: ['/api/bookmarks', activeTabId],
    queryFn: async () => {
      const res = await fetch(`/api/bookmarks?tabId=${activeTabId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch bookmarks");
      return res.json();
    },
  });

  // Set auto-run from settings
  useEffect(() => {
    if (settings) {
      setAutoRunEnabled(settings.autoRun);
    }
  }, [settings]);

  // Toggle auto-run
  const toggleAutoRun = async () => {
    const newValue = !autoRunEnabled;
    setAutoRunEnabled(newValue);
    try {
      await apiRequest("PATCH", "/api/settings", { autoRun: newValue });
      toast({
        title: newValue ? "Auto-run enabled" : "Auto-run disabled",
        description: newValue 
          ? "Bookmarks will open automatically when clicked" 
          : "Bookmarks will not open automatically",
      });
    } catch (error) {
      toast({
        title: "Failed to update settings",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  // Handle search query
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Add a new section
  const addNewSection = async () => {
    try {
      // Find the highest order to add new section after it
      const maxOrder = sections?.length 
        ? Math.max(...sections.map((s: Section) => s.order)) 
        : 0;
      
      // Generate a random color from our palette
      const colors = ['#FF6B35', '#4ECDC4', '#FFD166', '#6BBA75'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      await apiRequest("POST", "/api/sections", {
        tabId: activeTabId,
        name: "New Section",
        color: randomColor,
        order: maxOrder + 1
      });
      
      toast({
        title: "New section added",
        description: "Your new section has been created",
      });
      
      // Refresh the sections data
      await queryClient.invalidateQueries({ queryKey: ['/api/sections', activeTabId] });
    } catch (error) {
      toast({
        title: "Failed to add section",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  // Filter bookmarks based on search query
  const filteredBookmarks = searchQuery && bookmarks
    ? bookmarks.filter((bookmark: Bookmark) => 
        bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bookmark.url.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : bookmarks;

  // Group bookmarks by section
  const bookmarksBySection = filteredBookmarks
    ? filteredBookmarks.reduce((acc: Record<string, Bookmark[]>, bookmark: Bookmark) => {
        if (!acc[bookmark.sectionName]) {
          acc[bookmark.sectionName] = [];
        }
        acc[bookmark.sectionName].push(bookmark);
        return acc;
      }, {})
    : {};

  return (
    <div className="h-full flex flex-col">
      <header className="relative z-10 bg-white dark:bg-gray-800 shadow-md px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <img 
            src="/attached_assets/10825231.jpg" 
            alt="Cartoon Bookmarker" 
            className="w-10 h-10 rounded-full object-cover"
          />
          <h1 className="font-bold text-2xl text-primary">Cartoon Bookmarker</h1>
        </div>
        
        <div className="flex space-x-4 items-center">
          <ThemeToggle />
          
          {/* Auto-run toggle */}
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center space-x-2"
            onClick={toggleAutoRun}
          >
            <span className="text-sm">Auto</span>
            <div className="relative w-8 h-4 bg-gray-300 dark:bg-gray-600 rounded-full">
              <div 
                className={`absolute top-0 w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                  autoRunEnabled 
                    ? 'bg-primary translate-x-4' 
                    : 'bg-white translate-x-0'
                }`}
              />
            </div>
          </Button>
        </div>
      </header>

      {/* Tab navigation */}
      <TabBar 
        tabs={tabs || []} 
        activeTabId={activeTabId} 
        onTabChange={setActiveTabId} 
        isLoading={tabsLoading}
      />

      {/* Search bar */}
      <SearchBar onSearch={handleSearch} />

      {/* Main content area with bookmark sections */}
      <main className="flex-1 overflow-y-auto p-6 relative z-10">
        {sectionsLoading || bookmarksLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Map sections to bookmark sections */}
            {sections?.map((section: Section) => (
              <BookmarkSection
                key={section.id}
                section={section}
                bookmarks={bookmarksBySection[section.name] || []}
                onPreviewWebsite={setPreviewWebsite}
                autoRunEnabled={autoRunEnabled}
              />
            ))}

            {/* Add new section button */}
            <div className="flex justify-center my-8">
              <Button
                onClick={addNewSection}
                className="watercolor-effect px-6 py-6 rounded-full bg-gradient-to-r from-primary to-secondary text-white font-bold text-lg shadow-lg hover:shadow-xl transition-shadow duration-200"
              >
                <PlusIcon className="mr-2 h-5 w-5" /> Add New Section
              </Button>
            </div>
          </>
        )}
      </main>

      {/* Floating action button to add bookmark */}
      <div className="fixed bottom-6 right-6 z-20">
        <Button
          onClick={() => setAddingBookmark(true)}
          className="w-14 h-14 rounded-full bg-primary text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 hover:bg-opacity-90 hover:scale-105"
        >
          <BookmarkIcon className="h-6 w-6" />
        </Button>
      </div>

      {/* Add bookmark dialog */}
      <AddBookmarkDialog
        open={addingBookmark}
        onOpenChange={setAddingBookmark}
        tabId={activeTabId}
        sections={sections || []}
      />

      {/* Website preview */}
      {previewWebsite && (
        <WebsitePreview
          url={previewWebsite}
          onClose={() => setPreviewWebsite(null)}
        />
      )}
    </div>
  );
}
