import { useState } from "react";
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getFaviconUrl, generateTitleFromUrl } from "@/lib/faviconHelper";
import type { Section } from "@shared/schema";

interface AddBookmarkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tabId: number;
  sections: Section[];
}

export default function AddBookmarkDialog({ 
  open, 
  onOpenChange,
  tabId,
  sections 
}: AddBookmarkDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setUrl("");
      setTitle("");
      setSelectedSectionId("");
    }
    onOpenChange(open);
  };

  // Autofill title when URL is entered and focus moves away
  const handleUrlBlur = () => {
    if (url && !title) {
      setTitle(generateTitleFromUrl(url));
    }
  };

  const handleSubmit = async () => {
    if (!url) {
      toast({
        title: "URL is required",
        description: "Please enter a website URL",
        variant: "destructive",
      });
      return;
    }

    if (!selectedSectionId) {
      toast({
        title: "Section is required",
        description: "Please select a section for this bookmark",
        variant: "destructive",
      });
      return;
    }

    // Prepend https:// if protocol is missing
    let processedUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      processedUrl = `https://${url}`;
    }

    const selectedSection = sections.find(s => s.id.toString() === selectedSectionId);
    if (!selectedSection) return;

    try {
      setIsSubmitting(true);

      // Count existing bookmarks in this section to determine order
      const res = await fetch(`/api/bookmarks?tabId=${tabId}`);
      const existingBookmarks = await res.json();
      const sectionBookmarks = existingBookmarks.filter(
        (b: any) => b.sectionName === selectedSection.name
      );
      const order = sectionBookmarks.length + 1;

      await apiRequest("POST", "/api/bookmarks", {
        tabId,
        url: processedUrl,
        title: title || generateTitleFromUrl(processedUrl),
        favicon: getFaviconUrl(processedUrl),
        sectionName: selectedSection.name,
        order
      });

      toast({
        title: "Bookmark added",
        description: "The website has been bookmarked successfully",
      });

      // Refresh bookmarks
      queryClient.invalidateQueries({ queryKey: ['/api/bookmarks', tabId] });
      handleOpenChange(false);
    } catch (error) {
      toast({
        title: "Failed to add bookmark",
        description: "Please check the URL and try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Bookmark</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="url" className="text-right">
              URL
            </Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={handleUrlBlur}
              placeholder="https://example.com"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Website Title"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="section" className="text-right">
              Section
            </Label>
            <Select
              value={selectedSectionId}
              onValueChange={setSelectedSectionId}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a section" />
              </SelectTrigger>
              <SelectContent>
                {sections.map((section) => (
                  <SelectItem key={section.id} value={section.id.toString()}>
                    {section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Bookmark"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
