import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, ExternalLink, RefreshCw } from "lucide-react";

interface WebsitePreviewProps {
  url: string;
  onClose: () => void;
}

export default function WebsitePreview({ url, onClose }: WebsitePreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const handleIframeLoad = () => {
    setIsLoading(false);
  };
  
  const handleIframeError = () => {
    setIsLoading(false);
    setError("Failed to load website. It might be restricted from embedding.");
  };
  
  const handleRefresh = () => {
    setIsLoading(true);
    setError(null);
    
    // Force iframe refresh by recreating it
    const iframe = document.getElementById('website-preview') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = url;
    }
  };
  
  const openInNewTab = () => {
    window.open(url, '_blank');
  };
  
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-7xl h-[85vh] flex flex-col shadow-2xl">
        <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-primary/80 to-secondary/80 text-white rounded-t-lg">
          <h3 className="text-lg font-medium truncate max-w-md">{url}</h3>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleRefresh}
              disabled={isLoading}
              className="bg-white/20 hover:bg-white/30 text-white"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={openInNewTab}
              className="bg-white/20 hover:bg-white/30 text-white"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Open in Tab
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 text-center">
              <p className="text-red-500 text-lg mb-6">{error}</p>
              <div className="flex gap-4">
                <Button onClick={handleRefresh} className="px-6 py-2 bg-primary hover:bg-primary/90">
                  <RefreshCw className="h-5 w-5 mr-2" /> Try Again
                </Button>
                <Button variant="outline" onClick={openInNewTab} className="px-6 py-2">
                  <ExternalLink className="h-5 w-5 mr-2" /> Open in Browser
                </Button>
              </div>
            </div>
          )}
          
          <iframe
            id="website-preview"
            src={url}
            className="w-full h-full"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            title="Website Preview"
          />
        </div>
      </div>
    </div>
  );
}
