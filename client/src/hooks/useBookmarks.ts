import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getFaviconUrl, generateTitleFromUrl } from "@/lib/faviconHelper";
import { useToast } from "@/hooks/use-toast";
import type { Bookmark, InsertBookmark } from "@shared/schema";

export function useBookmarks(tabId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch bookmarks for the active tab
  const { 
    data: bookmarks,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['/api/bookmarks', tabId],
    queryFn: async () => {
      const res = await fetch(`/api/bookmarks?tabId=${tabId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch bookmarks");
      return res.json();
    },
  });

  // Add a new bookmark
  const addBookmark = async (bookmarkData: Omit<InsertBookmark, 'favicon' | 'order'>) => {
    try {
      // Count existing bookmarks in this section to determine order
      const res = await fetch(`/api/bookmarks?tabId=${tabId}`);
      const existingBookmarks = await res.json();
      const sectionBookmarks = existingBookmarks.filter(
        (b: Bookmark) => b.sectionName === bookmarkData.sectionName
      );
      const order = sectionBookmarks.length + 1;

      // Ensure URL has a protocol
      let url = bookmarkData.url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`;
      }

      await apiRequest("POST", "/api/bookmarks", {
        ...bookmarkData,
        url,
        favicon: getFaviconUrl(url),
        order
      });

      // Refresh bookmarks
      queryClient.invalidateQueries({ queryKey: ['/api/bookmarks', tabId] });

      toast({
        title: "Bookmark added",
        description: "The website has been bookmarked successfully",
      });

      return true;
    } catch (error) {
      toast({
        title: "Failed to add bookmark",
        description: "Please check the URL and try again",
        variant: "destructive",
      });
      return false;
    }
  };

  // Remove a bookmark
  const removeBookmark = async (bookmarkId: number) => {
    try {
      await apiRequest("DELETE", `/api/bookmarks/${bookmarkId}`, undefined);
      
      // Refresh bookmarks
      queryClient.invalidateQueries({ queryKey: ['/api/bookmarks', tabId] });
      
      toast({
        title: "Bookmark removed",
        description: "The bookmark has been deleted successfully",
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Failed to remove bookmark",
        description: "Please try again",
        variant: "destructive",
      });
      return false;
    }
  };

  // Update a bookmark
  const updateBookmark = async (bookmarkId: number, updates: Partial<InsertBookmark>) => {
    try {
      await apiRequest("PATCH", `/api/bookmarks/${bookmarkId}`, updates);
      
      // Refresh bookmarks
      queryClient.invalidateQueries({ queryKey: ['/api/bookmarks', tabId] });
      
      toast({
        title: "Bookmark updated",
        description: "The bookmark has been updated successfully",
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Failed to update bookmark",
        description: "Please try again",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    bookmarks,
    isLoading,
    isError,
    error,
    addBookmark,
    removeBookmark,
    updateBookmark
  };
}
