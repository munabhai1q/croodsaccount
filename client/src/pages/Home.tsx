import { useEffect, useState, useRef } from "react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import TabBar from "@/components/TabBar";
import SearchBar from "@/components/SearchBar";
import BookmarkSection from "@/components/BookmarkSection";
import AddBookmarkDialog from "@/components/AddBookmarkDialog";
import WebsitePreview from "@/components/WebsitePreview";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { PlusIcon, BookmarkIcon, Music, Bot, User } from "lucide-react";
import type { Tab, Bookmark, Section } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const [activeTabId, setActiveTabId] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [addingBookmark, setAddingBookmark] = useState<boolean>(false);
  const [autoRunEnabled, setAutoRunEnabled] = useState<boolean>(false);
  const [previewWebsite, setPreviewWebsite] = useState<string | null>(null);
  
  // State for musical bubbles
  const [bubblesActive, setBubblesActive] = useState<boolean>(false);
  const [bubbles, setBubbles] = useState<{id: number; x: number; y: number; size: number; color: string; popped: boolean}[]>([]);
  
  // State for AI workers
  const [workersActive, setWorkersActive] = useState<boolean>(false);
  
  // Generate musical bubbles
  useEffect(() => {
    if (!bubblesActive) return;
    
    const intervalId = setInterval(() => {
      const newBubble = {
        id: Date.now(),
        x: Math.random() * 100,
        y: 110, // Start below the screen
        size: 20 + Math.random() * 50,
        color: `hsl(${Math.random() * 360}, 80%, 70%)`,
        popped: false
      };
      
      setBubbles(prev => [...prev.slice(-15), newBubble]); // Keep only last 15 bubbles for performance
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [bubblesActive]);
  
  // Animate bubbles moving upward
  useEffect(() => {
    if (!bubblesActive || bubbles.length === 0) return;
    
    const animationId = setInterval(() => {
      setBubbles(prev => 
        prev.map(bubble => ({
          ...bubble,
          y: bubble.y - 1 // Move upward
        })).filter(bubble => bubble.y > -20 && !bubble.popped) // Remove bubbles that are off-screen or popped
      );
    }, 50);
    
    return () => clearInterval(animationId);
  }, [bubblesActive, bubbles.length]);
  
  // Pop a bubble and play sound
  const popBubble = (id: number) => {
    // Play pop sound
    const audio = new Audio();
    audio.src = `data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAAeAAA7mgBVVVVVVVVVVVVVVVVVVVWqqqqqqqqqqqqqqqqqqqrV1dXV1dXV1dXV1dXV1dXq6urq6urq6urq6urq6ur///////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAcaAAAAAAAAO5qoCXgWAAAAAP/7kGQAD/AAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=`;
    audio.play();
    
    setBubbles(prev => 
      prev.map(bubble => 
        bubble.id === id ? {...bubble, popped: true} : bubble
      )
    );
  };

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
    if (settings && typeof settings === 'object' && 'autoRun' in settings) {
      setAutoRunEnabled(!!settings.autoRun);
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

  // Get the active tab for background image
  const activeTab = tabs && Array.isArray(tabs) ? tabs.find((tab: Tab) => tab.id === activeTabId) : undefined;
  const backgroundImage = activeTab?.backgroundImage || "/attached_assets/10825231.jpg";

  return (
    <div className="h-full flex flex-col">
      {/* Background image overlay */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-25 z-0" 
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      
      {/* Musical bubbles */}
      {bubblesActive && bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="fixed rounded-full cursor-pointer transition-transform z-[15]"
          style={{
            left: `${bubble.x}%`,
            top: `${bubble.y}%`,
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            background: `radial-gradient(circle at 30% 30%, white, ${bubble.color})`,
            boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
            transform: `scale(${bubble.popped ? 0 : 1})`,
            transition: 'transform 0.2s ease-out',
            opacity: bubble.popped ? 0 : 0.8
          }}
          onClick={() => popBubble(bubble.id)}
        />
      ))}
      
      {/* New cartoon theme banner at the very top */}
      <div className="relative bg-gradient-to-r from-primary to-amber-500 py-2 text-white text-center z-10">
        <div className="container mx-auto px-4 flex items-center justify-center">
          <img 
            src="/attached_assets/10825231.jpg" 
            alt="The Croods" 
            className="h-8 w-8 rounded-full mr-2 object-cover border-2 border-white"
          />
          <span className="font-bold">Welcome to The Croods Cartoon Bookmarker!</span>
        </div>
      </div>
      
      <header className="relative z-10 bg-white dark:bg-gray-800 shadow-md px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <img 
            src="/attached_assets/10825231.jpg" 
            alt="Cartoon Bookmarker" 
            className="w-10 h-10 rounded-full object-cover"
          />
          <h1 className="font-bold text-2xl text-primary">Cartoon Bookmarker</h1>
        </div>
        
        <div className="flex space-x-3 items-center">
          {/* Musical Bubbles button */}
          <Button 
            variant={bubblesActive ? "default" : "outline"}
            size="sm" 
            className="flex items-center gap-1"
            onClick={() => setBubblesActive(!bubblesActive)}
          >
            <Music className="h-4 w-4" />
            <span className="text-xs">Bubbles</span>
          </Button>
          
          {/* AI Workers button */}
          <Button 
            variant={workersActive ? "default" : "outline"}
            size="sm" 
            className="flex items-center gap-1"
            onClick={() => setWorkersActive(!workersActive)}
          >
            <User className="h-4 w-4" />
            <span className="text-xs">Workers</span>
          </Button>
          
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

            {/* Add new section button - with lightning/mirror design */}
            <div className="flex justify-center my-8">
              <Button
                onClick={addNewSection}
                className="px-8 py-6 rounded-full text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #000000 0%, #e50000 50%, #000000 100%)',
                  border: '2px solid #0077ff',
                }}
              >
                {/* Lightning effect overlay */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full opacity-30" 
                    style={{
                      backgroundImage: 'linear-gradient(45deg, transparent 25%, #0077ff 25%, #0077ff 50%, transparent 50%, transparent 75%, #0077ff 75%, #0077ff 100%)',
                      backgroundSize: '10px 10px',
                      animation: 'moveBackground 3s linear infinite',
                    }}
                  ></div>
                  <div className="absolute top-0 left-0 w-full h-full opacity-40"
                    style={{
                      background: 'radial-gradient(circle, rgba(255,255,255,0.8) 5%, rgba(0,119,255,0.4) 30%, transparent 70%)',
                      transform: 'translateX(-50%)',
                      animation: 'flashLight 5s ease-in-out infinite',
                    }}
                  ></div>
                </div>

                {/* Main content */}
                <div className="relative z-10 flex items-center">
                  <PlusIcon className="mr-2 h-6 w-6" /> Add New Section
                </div>
              </Button>
            </div>
            
            {/* Add CSS animations */}
            <style
              dangerouslySetInnerHTML={{
                __html: `
                  @keyframes moveBackground {
                    0% { background-position: 0 0; }
                    100% { background-position: 50px 50px; }
                  }
                  
                  @keyframes flashLight {
                    0%, 100% { transform: translateX(-50%) translateY(-50%) scale(1); opacity: 0.4; }
                    50% { transform: translateX(100%) translateY(50%) scale(1.5); opacity: 0.6; }
                  }
                `
              }}
            />
          </>
        )}
      </main>

      {/* Floating action button to add bookmark */}
      <div className="fixed bottom-6 right-6 z-20">
        <Button
          onClick={() => setAddingBookmark(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-primary to-amber-500 text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110"
          style={{
            backgroundImage: `
              linear-gradient(135deg, #F9A826 0%, #FFD166 100%),
              radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 40%)
            `,
          }}
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
