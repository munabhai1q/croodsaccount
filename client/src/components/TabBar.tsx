import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon, ImageIcon, ClockIcon, EditIcon, CheckIcon, X, ChevronUp, ChevronDown } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  
  // Edit tab state
  const [isEditingTab, setIsEditingTab] = useState(false);
  const [editTabId, setEditTabId] = useState<number | null>(null);
  const [editTabName, setEditTabName] = useState("");
  const [editTabBackground, setEditTabBackground] = useState("");
  const [editTabAutoSwitch, setEditTabAutoSwitch] = useState(false);
  
  // Auto switching
  const [autoSwitchEnabled, setAutoSwitchEnabled] = useState(false);
  const autoSwitchTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Find active tab
  const activeTab = tabs.find(tab => tab.id === activeTabId);
  
  // Handle auto tab switching
  useEffect(() => {
    // Clear existing timer
    if (autoSwitchTimerRef.current) {
      clearInterval(autoSwitchTimerRef.current);
      autoSwitchTimerRef.current = null;
    }
    
    // Start new timer if auto-switch is enabled
    if (autoSwitchEnabled && tabs.length > 1) {
      autoSwitchTimerRef.current = setInterval(() => {
        // Find current tab index
        const currentIndex = tabs.findIndex(tab => tab.id === activeTabId);
        // Calculate next tab index (cycle through tabs)
        const nextIndex = (currentIndex + 1) % tabs.length;
        // Change to next tab
        onTabChange(tabs[nextIndex].id);
      }, 10000); // Switch every 10 seconds
    }
    
    // Cleanup timer on unmount
    return () => {
      if (autoSwitchTimerRef.current) {
        clearInterval(autoSwitchTimerRef.current);
      }
    };
  }, [autoSwitchEnabled, activeTabId, tabs, onTabChange]);
  
  // Start editing a tab
  const handleEditTab = (tab: Tab) => {
    setEditTabId(tab.id);
    setEditTabName(tab.name);
    setEditTabBackground(tab.backgroundImage || "");
    setEditTabAutoSwitch(tab.autoSwitch || false);
    setIsEditingTab(true);
  };
  
  // Save tab edit
  const handleSaveTabEdit = async () => {
    if (!editTabId) return;
    
    try {
      setIsSubmitting(true);
      
      await apiRequest("PATCH", `/api/tabs/${editTabId}`, {
        name: editTabName,
        backgroundImage: editTabBackground,
        autoSwitch: editTabAutoSwitch
      });
      
      toast({
        title: "Tab updated",
        description: "The tab settings have been saved",
      });
      
      // Refresh tabs data
      queryClient.invalidateQueries({ queryKey: ['/api/tabs'] });
      
      // Close dialog and reset form
      setIsEditingTab(false);
      setEditTabId(null);
    } catch (error) {
      toast({
        title: "Failed to update tab",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
                <div key={tab.id} className="relative group">
                  <Button
                    onClick={() => onTabChange(tab.id)}
                    className={`tab-animation px-4 py-2 rounded-t-lg font-semibold ${
                      activeTabId === tab.id
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {tab.name}
                    {tab.autoSwitch && (
                      <span className="ml-1 text-xs">
                        <ClockIcon className="inline h-3 w-3" />
                      </span>
                    )}
                  </Button>
                  
                  {/* Edit button appears on hover */}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-white dark:bg-gray-700 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditTab(tab);
                    }}
                  >
                    <EditIcon className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              
              {/* Auto switcher button */}
              <div className="ml-4 flex items-center space-x-2">
                <Button
                  size="sm"
                  variant={autoSwitchEnabled ? "default" : "outline"}
                  className="h-8 rounded-full flex items-center space-x-1 px-3 text-xs"
                  onClick={() => setAutoSwitchEnabled(!autoSwitchEnabled)}
                >
                  <ClockIcon className="h-3.5 w-3.5 mr-1" />
                  {autoSwitchEnabled ? "Auto-Switch On" : "Auto-Switch Off"}
                </Button>
              </div>
            </>
          )}
          
          {/* Add new tab button */}
          <Button
            onClick={() => setNewTabDialogOpen(true)}
            className="ml-auto watercolor-effect px-3 py-2 rounded-full font-bold bg-amber-500 text-white shadow-md hover:shadow-lg transition-shadow duration-200"
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
      
      {/* Edit Tab Dialog */}
      <Dialog open={isEditingTab} onOpenChange={setIsEditingTab}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Tab</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="editTabName" className="text-right">
                Tab Name
              </label>
              <Input
                id="editTabName"
                value={editTabName}
                onChange={(e) => setEditTabName(e.target.value)}
                placeholder="Enter tab name"
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="editTabBackground" className="text-right">
                Background Image URL
              </label>
              <Input
                id="editTabBackground"
                value={editTabBackground}
                onChange={(e) => setEditTabBackground(e.target.value)}
                placeholder="Enter image URL or leave empty"
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="editTabAutoSwitch" className="text-right">
                Auto Switch
              </label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch
                  id="editTabAutoSwitch"
                  checked={editTabAutoSwitch}
                  onCheckedChange={setEditTabAutoSwitch}
                />
                <Label htmlFor="editTabAutoSwitch">
                  {editTabAutoSwitch ? "Enabled" : "Disabled"}
                </Label>
              </div>
            </div>
            
            {/* Preview background image if URL is provided */}
            {editTabBackground && (
              <div className="mt-2">
                <p className="text-sm font-medium mb-2">Background Preview:</p>
                <div className="relative w-full h-24 bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden">
                  <div 
                    className="absolute inset-0 bg-center bg-cover" 
                    style={{ 
                      backgroundImage: `url(${editTabBackground})`,
                      opacity: 0.5
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-bold text-xl">{editTabName}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingTab(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTabEdit} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
