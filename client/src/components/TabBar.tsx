import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Tab } from "@shared/schema";

interface TabBarProps {
  tabs: Tab[];
  activeTabId: number;
  onTabChange: (tabId: number) => void;
  isLoading: boolean;
}

export default function TabBar({ tabs, activeTabId, onTabChange, isLoading }: TabBarProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newTabDialogOpen, setNewTabDialogOpen] = useState(false);
  const [newTabName, setNewTabName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddTab = async () => {
    if (!newTabName.trim()) {
      toast({
        title: "Tab name is required",
        description: "Please enter a name for the new tab",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Find the highest order to add new tab after it
      const maxOrder = tabs.length ? Math.max(...tabs.map(tab => tab.order)) : 0;
      
      const response = await apiRequest("POST", "/api/tabs", {
        name: newTabName,
        order: maxOrder + 1
      });
      
      const newTab = await response.json();
      
      toast({
        title: "New tab created",
        description: `The "${newTabName}" tab has been added`,
      });
      
      // Create a default section for the new tab
      await apiRequest("POST", "/api/sections", {
        tabId: newTab.id,
        name: "New Section",
        color: "#FF6B35", // Default color
        order: 1
      });
      
      // Refresh tabs data
      queryClient.invalidateQueries({ queryKey: ['/api/tabs'] });
      
      // Switch to the new tab
      onTabChange(newTab.id);
      
      // Close dialog and reset form
      setNewTabDialogOpen(false);
      setNewTabName("");
    } catch (error) {
      toast({
        title: "Failed to create tab",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="relative z-10 bg-white dark:bg-gray-800 shadow px-4 py-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center space-x-1">
          {isLoading ? (
            <div className="flex items-center h-10 px-4">
              <div className="animate-pulse h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ) : (
            <>
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`tab-animation px-4 py-2 rounded-t-lg font-semibold ${
                    activeTabId === tab.id
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {tab.name}
                </Button>
              ))}
            </>
          )}
          
          {/* Add new tab button */}
          <Button
            onClick={() => setNewTabDialogOpen(true)}
            className="watercolor-effect px-3 py-2 rounded-full font-bold bg-amber-500 text-white shadow-md hover:shadow-lg transition-shadow duration-200"
            style={{
              backgroundImage: `
                radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 40%),
                radial-gradient(circle at 60% 70%, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0) 30%)
              `,
              filter: 'saturate(1.2)',
            }}
          >
            <PlusIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Add New Tab Dialog */}
      <Dialog open={newTabDialogOpen} onOpenChange={setNewTabDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Tab</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="tabName" className="text-right">
                Tab Name
              </label>
              <Input
                id="tabName"
                value={newTabName}
                onChange={(e) => setNewTabName(e.target.value)}
                placeholder="Enter tab name"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewTabDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleAddTab} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Tab"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
