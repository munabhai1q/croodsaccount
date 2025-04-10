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
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl h-[80vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-medium truncate max-w-md">{url}</h3>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={openInNewTab}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Open
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <div className="flex gap-2">
                <Button onClick={handleRefresh}>Try Again</Button>
                <Button variant="outline" onClick={openInNewTab}>Open in New Tab</Button>
              </div>
            </div>
          )}
          
          <iframe
            id="website-preview"
            src={url}
            className="w-full h-full"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            sandbox="allow-scripts allow-same-origin allow-forms"
            title="Website Preview"
          />
        </div>
      </div>
    </div>
  );
}
