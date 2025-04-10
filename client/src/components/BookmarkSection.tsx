import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card,
  CardContent,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { Edit2Icon, Trash2Icon } from "lucide-react";
import BookmarkCard from "./BookmarkCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Section, Bookmark } from "@shared/schema";

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

  // Generate watercolor effect style
  const watercolorStyle = {
    backgroundImage: `
      radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 40%),
      radial-gradient(circle at 60% 70%, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0) 30%)
    `,
    filter: 'saturate(1.2)',
    backgroundColor: section.color,
  };

  return (
    <section className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-xl text-gray-800 dark:text-white">{section.name}</h2>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsEditing(true)}
            className="watercolor-effect px-3 py-1 rounded-full text-white font-medium text-sm shadow-md hover:shadow-lg transition-shadow duration-200"
            style={watercolorStyle}
          >
            Manage
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsDeleting(true)}
            className="rounded-full"
          >
            <Trash2Icon className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {bookmarks.map((bookmark) => (
          <BookmarkCard 
            key={bookmark.id}
            bookmark={bookmark}
            sectionColor={section.color}
            onPreviewWebsite={onPreviewWebsite}
            autoRunEnabled={autoRunEnabled}
          />
        ))}
        
        {bookmarks.length === 0 && (
          <Card className="col-span-full p-6 flex justify-center items-center text-gray-500 bg-gray-100 dark:bg-gray-800 border-dashed border-2">
            <p>No bookmarks in this section yet. Add your first bookmark!</p>
          </Card>
        )}
      </div>

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
    </section>
  );
}
