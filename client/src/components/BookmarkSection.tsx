import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card,
  CardContent,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { Edit2Icon, Trash2Icon, PlusIcon, ArrowRightIcon, ArrowLeftIcon, BookmarkIcon } from "lucide-react";
import BookmarkCard from "./BookmarkCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { extractDomain, generateTitleFromUrl, getFaviconUrl } from "@/lib/faviconHelper";
import type { Section, Bookmark, InsertBookmark } from "@shared/schema";

interface BookmarkSectionProps {
  section: Section;
  bookmarks: Bookmark[];
  onPreviewWebsite: (url: string) => void;
  autoRunEnabled: boolean;
}

export default function BookmarkSection({ 
  section, 
  bookmarks, 
  onPreviewWebsite,
  autoRunEnabled
}: BookmarkSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [sectionName, setSectionName] = useState(section.name);
  const [sectionColor, setSectionColor] = useState(section.color);
  const [isDeleting, setIsDeleting] = useState(false);
  const [displayedBookmarks, setDisplayedBookmarks] = useState<string[]>([]);
  const [addingBookmarkByDrop, setAddingBookmarkByDrop] = useState(false);
  const [dropUrl, setDropUrl] = useState("");
  const [isScrolling, setIsScrolling] = useState(false);
  const bookmarkContainerRef = useRef<HTMLDivElement>(null);
  
  // Add a bookmark directly from a URL
  const handleAddBookmarkFromUrl = async (url: string) => {
    try {
      // Generate default title from URL
      const title = generateTitleFromUrl(url);
      const favicon = getFaviconUrl(url);
      
      // Create new bookmark
      const newBookmark: InsertBookmark = {
        tabId: section.tabId,
        sectionName: section.name,
        title: title,
        url: url,
        favicon: favicon,
        order: 0 // Default order (will be updated on server)
      };
      
      await apiRequest("POST", "/api/bookmarks", newBookmark);
      
      toast({
        title: "Bookmark Added",
        description: `Added ${title} to ${section.name}`,
      });
      
      // Refresh the bookmarks data
      queryClient.invalidateQueries({ queryKey: ['/api/bookmarks', section.tabId] });
      setAddingBookmarkByDrop(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add bookmark",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      await apiRequest("DELETE", `/api/sections/${section.id}`, undefined);
      toast({
        title: "Section Deleted",
        description: "The section has been removed",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/sections', section.tabId] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete section",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      await apiRequest("PATCH", `/api/sections/${section.id}`, {
        name: sectionName,
        color: sectionColor
      });
      toast({
        title: "Section Updated",
        description: "The section has been updated",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/sections', section.tabId] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update section",
        variant: "destructive",
      });
    } finally {
      setIsEditing(false);
    }
  };

  // Generate fancy gradient style
  const sectionGradientStyle = {
    backgroundImage: `
      linear-gradient(135deg, ${section.color}40 0%, ${section.color}15 100%),
      radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0) 50%),
      radial-gradient(circle at 60% 70%, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 40%)
    `,
    borderColor: section.color,
    filter: 'saturate(1.2)',
  };

  const buttonStyle = {
    backgroundColor: section.color,
    backgroundImage: `
      radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0) 40%)
    `,
  };

  // Setup drag and drop handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    // Get URL from drag data
    const text = e.dataTransfer.getData('text');
    if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
      setDropUrl(text);
      setAddingBookmarkByDrop(true);
    } else {
      toast({
        title: "Invalid URL",
        description: "Please drop a valid URL",
        variant: "destructive",
      });
    }
  };
  
  // Toggle display of a bookmark in the section
  const toggleDisplayBookmark = (url: string) => {
    setDisplayedBookmarks(prev => {
      if (prev.includes(url)) {
        return prev.filter(bookmarkUrl => bookmarkUrl !== url);
      } else {
        return [...prev, url];
      }
    });
  };
  
  // Handle scrolling for bookmarks
  const handleScrollBookmarks = (direction: 'left' | 'right') => {
    if (bookmarkContainerRef.current) {
      const container = bookmarkContainerRef.current;
      const scrollAmount = container.clientWidth / 2;
      
      setIsScrolling(true);
      if (direction === 'left') {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
      
      // Reset scrolling state after animation
      setTimeout(() => setIsScrolling(false), 500);
    }
  };
  
  // Effect to handle many open websites
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Close all displayed bookmarks with Escape key
      if (e.key === 'Escape' && displayedBookmarks.length > 0) {
        setDisplayedBookmarks([]);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [displayedBookmarks]);

  return (
    <section 
      className="mb-8 rounded-lg p-5 border-l-4 shadow-md" 
      style={sectionGradientStyle}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-xl text-gray-800 dark:text-white flex items-center">
          <div className="w-4 h-4 rounded-full mr-2" style={{backgroundColor: section.color}}></div>
          {section.name}
        </h2>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsEditing(true)}
            className="px-4 py-1 rounded-full text-white font-medium text-sm shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
            style={buttonStyle}
          >
            <Edit2Icon className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsDeleting(true)}
            className="rounded-full hover:bg-red-50 hover:text-red-500 hover:border-red-200"
          >
            <Trash2Icon className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Scrollable bookmarks container with arrows */}
      <div className="relative">
        {bookmarks.length > 0 && (
          <>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute left-0 top-1/2 z-10 -translate-y-1/2 h-10 w-10 rounded-full bg-white dark:bg-gray-800 shadow-lg opacity-75 hover:opacity-100 transition-opacity"
              onClick={() => handleScrollBookmarks('left')}
              disabled={isScrolling}
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-0 top-1/2 z-10 -translate-y-1/2 h-10 w-10 rounded-full bg-white dark:bg-gray-800 shadow-lg opacity-75 hover:opacity-100 transition-opacity"
              onClick={() => handleScrollBookmarks('right')}
              disabled={isScrolling}
            >
              <ArrowRightIcon className="h-5 w-5" />
            </Button>
          </>
        )}
        
        <div 
          ref={bookmarkContainerRef}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-x-auto pb-4 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {bookmarks.map((bookmark) => (
            <BookmarkCard 
              key={bookmark.id}
              bookmark={bookmark}
              sectionColor={section.color}
              onPreviewWebsite={(url) => {
                if (autoRunEnabled) {
                  toggleDisplayBookmark(url);
                } else {
                  onPreviewWebsite(url);
                }
              }}
              autoRunEnabled={autoRunEnabled}
            />
          ))}
          
          {bookmarks.length === 0 && (
            <Card className="col-span-full p-6 flex justify-center items-center text-gray-500 bg-white/60 dark:bg-gray-800/60 border-dashed border-2 border-gray-300 dark:border-gray-700">
              <div className="text-center">
                <p className="mb-2">No bookmarks in this section yet.</p>
                <p className="text-sm text-gray-500">Drag and drop URLs here to add bookmarks!</p>
              </div>
            </Card>
          )}
        </div>
      </div>
      
      {/* Multiple website displays */}
      {displayedBookmarks.length > 0 && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-gray-800 dark:text-white">
              Active Websites ({displayedBookmarks.length})
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDisplayedBookmarks([])}
              className="text-xs"
            >
              Close All
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedBookmarks.map((url) => (
              <div key={url} className="relative h-96 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <div className="absolute top-2 right-2 z-10">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-white/80 dark:bg-gray-800/80 shadow-md"
                    onClick={() => toggleDisplayBookmark(url)}
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </div>
                <iframe
                  src={url}
                  title={`Preview of ${url}`}
                  className="w-full h-full border-0"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Section Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Section</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Section Name</label>
              <Input
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
                placeholder="Enter section name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Section Color</label>
              <div className="flex gap-2">
                {['#FF6B35', '#4ECDC4', '#FFD166', '#6BBA75', '#E63946'].map((color) => (
                  <div
                    key={color}
                    className={`h-8 w-8 rounded-full cursor-pointer ${
                      sectionColor === color ? 'ring-2 ring-offset-2 ring-black' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSectionColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Section</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this section? This will remove all bookmarks in this section.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleting(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Drag and Drop URL Confirmation Dialog */}
      <Dialog open={addingBookmarkByDrop} onOpenChange={setAddingBookmarkByDrop}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Bookmark</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">Add this website to your bookmarks?</p>
            <div className="flex items-center p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
              <BookmarkIcon className="h-5 w-5 mr-2 text-gray-500" />
              <span className="text-sm font-medium truncate">{dropUrl}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddingBookmarkByDrop(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleAddBookmarkFromUrl(dropUrl)}>
              Add Bookmark
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
