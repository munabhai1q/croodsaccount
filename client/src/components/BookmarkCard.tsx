import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { ExternalLinkIcon, Edit2Icon, Trash2Icon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Bookmark } from "@shared/schema";

interface BookmarkCardProps {
  bookmark: Bookmark;
  sectionColor: string;
  onPreviewWebsite: (url: string) => void;
  autoRunEnabled: boolean;
}

export default function BookmarkCard({ 
  bookmark, 
  sectionColor,
  onPreviewWebsite,
  autoRunEnabled
}: BookmarkCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [bookmarkTitle, setBookmarkTitle] = useState(bookmark.title);
  const [bookmarkUrl, setBookmarkUrl] = useState(bookmark.url);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenBookmark = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    // Always prevent default behavior to show in the app
    e.preventDefault();
    onPreviewWebsite(bookmark.url);
  };

  const handleDelete = async () => {
    try {
      await apiRequest("DELETE", `/api/bookmarks/${bookmark.id}`, undefined);
      toast({
        title: "Bookmark Deleted",
        description: "The bookmark has been removed",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bookmarks', bookmark.tabId] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete bookmark",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      await apiRequest("PATCH", `/api/bookmarks/${bookmark.id}`, {
        title: bookmarkTitle,
        url: bookmarkUrl
      });
      toast({
        title: "Bookmark Updated",
        description: "The bookmark has been updated",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bookmarks', bookmark.tabId] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update bookmark",
        variant: "destructive",
      });
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <>
      <div className="group relative">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleOpenBookmark}
          className="bookmark-card block p-4 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-xl dark:text-white border-l-4 transition-all duration-200 hover:scale-105"
          style={{ 
            borderLeftColor: sectionColor,
            backgroundImage: `linear-gradient(to right, ${sectionColor}10, transparent)`
          }}
        >
          <div className="flex items-center mb-2">
            <img 
              src={typeof bookmark.favicon === 'string' ? bookmark.favicon : ''}
              alt={bookmark.title} 
              className="w-6 h-6 mr-2"
              onError={(e) => {
                // If favicon fails, replace with a generic icon
                e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z'%3E%3C/path%3E%3C/svg%3E";
              }}
            />
            <h3 className="font-semibold">{bookmark.title}</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{bookmark.url}</p>
        </a>

        {/* Overlay buttons on hover */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 rounded-full"
            onClick={() => setIsEditing(true)}
          >
            <Edit2Icon className="h-4 w-4" />
          </Button>
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 rounded-full"
            onClick={() => setIsDeleting(true)}
          >
            <Trash2Icon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Edit Bookmark Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Bookmark</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={bookmarkTitle}
                onChange={(e) => setBookmarkTitle(e.target.value)}
                placeholder="Enter bookmark title"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">URL</label>
              <Input
                value={bookmarkUrl}
                onChange={(e) => setBookmarkUrl(e.target.value)}
                placeholder="Enter website URL"
              />
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
            <DialogTitle>Delete Bookmark</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this bookmark?</p>
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
    </>
  );
}
