import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InsertTab } from "@shared/schema";

export function useTabs() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTabId, setActiveTabId] = useState<number>(1);

  // Fetch all tabs
  const { 
    data: tabs,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['/api/tabs'],
  });

  // Add a new tab
  const addTab = async (tabData: Omit<InsertTab, 'order'>) => {
    try {
      // Find the highest order to add new tab after it
      const maxOrder = tabs?.length ? Math.max(...tabs.map((tab: any) => tab.order)) : 0;
      
      const response = await apiRequest("POST", "/api/tabs", {
        ...tabData,
        order: maxOrder + 1
      });
      
      const newTab = await response.json();
      
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
      setActiveTabId(newTab.id);
      
      toast({
        title: "New tab created",
        description: `The "${tabData.name}" tab has been added`,
      });
      
      return newTab.id;
    } catch (error) {
      toast({
        title: "Failed to create tab",
        description: "Please try again",
        variant: "destructive",
      });
      return null;
    }
  };

  // Remove a tab
  const removeTab = async (tabId: number) => {
    try {
      await apiRequest("DELETE", `/api/tabs/${tabId}`, undefined);
      
      // Refresh tabs data
      queryClient.invalidateQueries({ queryKey: ['/api/tabs'] });
      
      // If we're removing the active tab, switch to the first tab
      if (activeTabId === tabId && tabs?.length) {
        setActiveTabId(tabs[0].id);
      }
      
      toast({
        title: "Tab removed",
        description: "The tab has been deleted successfully",
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Failed to remove tab",
        description: "Please try again",
        variant: "destructive",
      });
      return false;
    }
  };

  // Update a tab
  const updateTab = async (tabId: number, updates: Partial<InsertTab>) => {
    try {
      await apiRequest("PATCH", `/api/tabs/${tabId}`, updates);
      
      // Refresh tabs data
      queryClient.invalidateQueries({ queryKey: ['/api/tabs'] });
      
      toast({
        title: "Tab updated",
        description: "The tab has been updated successfully",
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Failed to update tab",
        description: "Please try again",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    tabs,
    activeTabId,
    setActiveTabId,
    isLoading,
    isError,
    error,
    addTab,
    removeTab,
    updateTab
  };
}
