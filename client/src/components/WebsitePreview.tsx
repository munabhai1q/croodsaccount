import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  X, 
  ExternalLink, 
  RefreshCw, 
  Maximize2, 
  Minimize2, 
  PauseCircle, 
  PlayCircle, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  ArrowLeftCircle, 
  ArrowRightCircle,
  Layout,
  Laptop,
  User
} from "lucide-react";

export type WebsitePosition = 'full' | 'left' | 'right' | 'top' | 'bottom';
export type WebsiteState = 'running' | 'paused' | 'minimized';

export interface OpenWebsite {
  id: string;
  url: string;
  position: WebsitePosition;
  state: WebsiteState;
  title?: string;
}

interface WebsitePreviewProps {
  url: string | null;
  onClose: () => void;
}

export default function WebsitePreview({ url, onClose }: WebsitePreviewProps) {
  const [openWebsites, setOpenWebsites] = useState<OpenWebsite[]>([]);
  const [layout, setLayout] = useState<'grid' | 'stack'>('grid');
  const [showWorkerPanel, setShowWorkerPanel] = useState(false);
  const [workersActive, setWorkersActive] = useState(() => {
    // Load workers state from localStorage on initial render
    const savedState = localStorage.getItem('workersActive');
    return savedState === 'true';
  });
  
  // Load persisted websites from localStorage
  useEffect(() => {
    try {
      const savedWebsites = localStorage.getItem('openWebsites');
      if (savedWebsites) {
        const parsedWebsites = JSON.parse(savedWebsites) as OpenWebsite[];
        // Only load websites that are not minimized to avoid cluttering the screen on load
        setOpenWebsites(parsedWebsites);
      }
    } catch (error) {
      console.error('Failed to load websites from localStorage', error);
    }
  }, []);

  // Initialize with the provided URL when it changes
  useEffect(() => {
    if (url && !openWebsites.some(site => site.url === url)) {
      addWebsite(url);
    }
  }, [url]);
  
  // Add a new website to the display
  const addWebsite = (websiteUrl: string) => {
    const newId = `website-${Date.now()}`;
    setOpenWebsites(prev => [
      ...prev, 
      {
        id: newId,
        url: websiteUrl,
        position: determinePosition(prev.length),
        state: 'running',
        title: websiteUrl
      }
    ]);
  };
  
  // Determine the position for a new website based on current count
  const determinePosition = (count: number): WebsitePosition => {
    switch (count % 4) {
      case 0: return 'left';
      case 1: return 'right';
      case 2: return 'top';
      case 3: return 'bottom';
      default: return 'full';
    }
  };
  
  // Update website position
  const updatePosition = (id: string, position: WebsitePosition) => {
    setOpenWebsites(prev => 
      prev.map(site => 
        site.id === id ? {...site, position} : site
      )
    );
  };
  
  // Update website state (running, paused, minimized)
  const updateState = (id: string, state: WebsiteState) => {
    // Update the state of a website
    setOpenWebsites(prev => 
      prev.map(site => 
        site.id === id ? {...site, state} : site
      )
    );
    
    // Store in localStorage to persist state across tab changes
    setTimeout(() => {
      const websitesToStore = openWebsites.map(site => 
        site.id === id ? {...site, state} : site
      );
      localStorage.setItem('openWebsites', JSON.stringify(websitesToStore));
    }, 100);
  };
  
  // Remove a website from the display
  const removeWebsite = (id: string) => {
    setOpenWebsites(prev => prev.filter(site => site.id !== id));
    
    // If no websites are left, close the entire preview
    if (openWebsites.length <= 1) {
      onClose();
    }
  };
  
  // Generate rainbow-colored bubbles
  const [bubbles, setBubbles] = useState<{id: number; x: number; y: number; size: number; color: string; popped: boolean}[]>([]);
  const [bubblesActive, setBubblesActive] = useState(() => {
    // Load bubbles state from localStorage on initial render
    const savedState = localStorage.getItem('bubblesActive');
    return savedState === 'true';
  });
  
  // Generate a new bubble every second when active
  useEffect(() => {
    if (!bubblesActive) return;
    
    const intervalId = setInterval(() => {
      const newBubble = {
        id: Date.now(),
        x: Math.random() * 100,
        y: 110, // Start below the screen
        size: 20 + Math.random() * 50,
        color: `hsl(${Math.random() * 360}, 80%, 70%)`,
        popped: false
      };
      
      setBubbles(prev => [...prev.slice(-15), newBubble]); // Keep only last 15 bubbles for performance
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [bubblesActive]);
  
  // Animate bubbles moving upward
  useEffect(() => {
    if (!bubblesActive || bubbles.length === 0) return;
    
    const animationId = setInterval(() => {
      setBubbles(prev => 
        prev.map(bubble => ({
          ...bubble,
          y: bubble.y - 1 // Move upward
        })).filter(bubble => bubble.y > -20 && !bubble.popped) // Remove bubbles that are off-screen or popped
      );
    }, 50);
    
    return () => clearInterval(animationId);
  }, [bubblesActive, bubbles.length]);
  
  // Pop a bubble and play sound
  const popBubble = (id: number) => {
    try {
      // Using a simple beep sound that works in all browsers
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = context.createOscillator();
      oscillator.type = 'sine';
      
      // Random frequency for fun bubble sounds
      oscillator.frequency.setValueAtTime(
        300 + Math.random() * 500, 
        context.currentTime
      );
      
      const gainNode = context.createGain();
      gainNode.gain.setValueAtTime(0.1, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.start();
      oscillator.stop(context.currentTime + 0.3);
      
      console.log('Playing bubble pop sound');
    } catch (error) {
      console.error('Audio failed to play:', error);
    }
    
    setBubbles(prev => 
      prev.map(bubble => 
        bubble.id === id ? {...bubble, popped: true} : bubble
      )
    );
  };
  
  // Toggle simulated human workers
  const toggleWorkers = () => {
    const newState = !workersActive;
    setWorkersActive(newState);
    
    // Save worker state to keep it active across tabs
    localStorage.setItem('workersActive', newState ? 'true' : 'false');
    
    // Show toast notification
    const feedback = document.createElement('div');
    feedback.style.position = 'fixed';
    feedback.style.bottom = '20px';
    feedback.style.left = '50%';
    feedback.style.transform = 'translateX(-50%)';
    feedback.style.padding = '10px 20px';
    feedback.style.background = 'rgba(0, 0, 0, 0.8)';
    feedback.style.color = 'white';
    feedback.style.borderRadius = '4px';
    feedback.style.zIndex = '9999';
    feedback.style.textAlign = 'center';
    feedback.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
    
    if (newState) {
      feedback.textContent = '🤖 AI Workers activated! They will interact with your websites.';
    } else {
      feedback.textContent = '🤖 AI Workers deactivated.';
    }
    
    document.body.appendChild(feedback);
    setTimeout(() => {
      feedback.style.opacity = '0';
      feedback.style.transition = 'opacity 0.5s ease';
      setTimeout(() => {
        document.body.removeChild(feedback);
      }, 500);
    }, 3000);
  };
  
  // Simulated workers that perform actions
  useEffect(() => {
    if (!workersActive || openWebsites.length === 0) return;
    
    // Create intervals for each worker action
    const actionIntervals: NodeJS.Timeout[] = [];
    
    // Add visual indicators of workers (animated avatars)
    const workerAvatars: HTMLElement[] = [];
    
    // Create worker avatars
    const createWorkerAvatars = () => {
      const runningWebsites = openWebsites.filter(site => site.state === 'running');
      runningWebsites.forEach(website => {
        const iframe = document.getElementById(website.id) as HTMLIFrameElement;
        if (iframe && iframe.parentElement) {
          // Create worker clicker avatar
          const clickerAvatar = document.createElement('div');
          clickerAvatar.className = 'ai-worker-avatar clicker';
          clickerAvatar.style.position = 'absolute';
          clickerAvatar.style.width = '40px';
          clickerAvatar.style.height = '40px';
          clickerAvatar.style.borderRadius = '50%';
          clickerAvatar.style.backgroundColor = 'rgba(255, 192, 0, 0.8)';
          clickerAvatar.style.boxShadow = '0 0 10px rgba(255, 192, 0, 0.6)';
          clickerAvatar.style.zIndex = '500';
          clickerAvatar.style.display = 'flex';
          clickerAvatar.style.alignItems = 'center';
          clickerAvatar.style.justifyContent = 'center';
          clickerAvatar.style.color = 'white';
          clickerAvatar.style.fontWeight = 'bold';
          clickerAvatar.style.fontSize = '20px';
          clickerAvatar.style.transition = 'all 0.5s ease';
          clickerAvatar.style.cursor = 'pointer';
          clickerAvatar.style.right = '20px';
          clickerAvatar.style.top = '50px';
          clickerAvatar.title = 'AI Clicker Worker';
          clickerAvatar.innerHTML = '🖱️';
          clickerAvatar.dataset.website = website.id;
          
          // Create worker scroller avatar
          const scrollerAvatar = document.createElement('div');
          scrollerAvatar.className = 'ai-worker-avatar scroller';
          scrollerAvatar.style.position = 'absolute';
          scrollerAvatar.style.width = '40px';
          scrollerAvatar.style.height = '40px';
          scrollerAvatar.style.borderRadius = '50%';
          scrollerAvatar.style.backgroundColor = 'rgba(0, 120, 255, 0.8)';
          scrollerAvatar.style.boxShadow = '0 0 10px rgba(0, 120, 255, 0.6)';
          scrollerAvatar.style.zIndex = '500';
          scrollerAvatar.style.display = 'flex';
          scrollerAvatar.style.alignItems = 'center';
          scrollerAvatar.style.justifyContent = 'center';
          scrollerAvatar.style.color = 'white';
          scrollerAvatar.style.fontWeight = 'bold';
          scrollerAvatar.style.fontSize = '20px';
          scrollerAvatar.style.transition = 'all 0.5s ease';
          scrollerAvatar.style.cursor = 'pointer';
          scrollerAvatar.style.right = '70px';
          scrollerAvatar.style.top = '50px';
          scrollerAvatar.title = 'AI Scroll Worker';
          scrollerAvatar.innerHTML = '📜';
          scrollerAvatar.dataset.website = website.id;
          
          // Add avatars to the parent container
          iframe.parentElement.appendChild(clickerAvatar);
          iframe.parentElement.appendChild(scrollerAvatar);
          
          // Store for cleanup
          workerAvatars.push(clickerAvatar);
          workerAvatars.push(scrollerAvatar);
        }
      });
    };
    
    // Initial creation of worker avatars
    createWorkerAvatars();
    
    // Update avatars when websites change
    const intervalId = setInterval(createWorkerAvatars, 2000);
    actionIntervals.push(intervalId);
    
    // Worker 1: Clicks random elements in iframes every 5 seconds
    const clickerInterval = setInterval(() => {
      const runningWebsites = openWebsites.filter(site => site.state === 'running');
      if (runningWebsites.length === 0) return;
      
      const randomSite = runningWebsites[Math.floor(Math.random() * runningWebsites.length)];
      const iframe = document.getElementById(randomSite.id) as HTMLIFrameElement;
      
      // Animate the clicker avatar
      const clickerAvatars = document.querySelectorAll(`.ai-worker-avatar.clicker[data-website="${randomSite.id}"]`);
      clickerAvatars.forEach((avatarEl) => {
        const avatar = avatarEl as HTMLElement;
        // Random position inside the iframe
        const x = Math.random() * 80; // % from left
        const y = Math.random() * 80; // % from top
        
        // Animate transition
        avatar.style.transform = `translate(${-x}%, ${y}%)`;
        avatar.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
        avatar.style.boxShadow = '0 0 15px rgba(255, 0, 0, 0.8)';
        
        // Reset after animation
        setTimeout(() => {
          avatar.style.backgroundColor = 'rgba(255, 192, 0, 0.8)';
          avatar.style.boxShadow = '0 0 10px rgba(255, 192, 0, 0.6)';
        }, 1000);
      });
      
      try {
        if (iframe && iframe.contentWindow) {
          // Get iframe document
          const iframeDoc = iframe.contentWindow.document;
          
          // Find all clickable elements
          const clickableElements = iframeDoc.querySelectorAll('a, button, input[type="button"], input[type="submit"]');
          
          if (clickableElements.length > 0) {
            // Click a random element
            const randomElement = clickableElements[Math.floor(Math.random() * clickableElements.length)];
            (randomElement as HTMLElement).click();
            
            // Show visual feedback
            const feedback = document.createElement('div');
            feedback.style.position = 'absolute';
            feedback.style.top = '50%';
            feedback.style.left = '50%';
            feedback.style.transform = 'translate(-50%, -50%)';
            feedback.style.background = 'rgba(255, 215, 0, 0.3)';
            feedback.style.padding = '1rem';
            feedback.style.borderRadius = '0.5rem';
            feedback.style.color = 'white';
            feedback.style.fontWeight = 'bold';
            feedback.style.zIndex = '9999';
            feedback.textContent = '🤖 AI Worker Clicked!';
            
            iframe.parentElement?.appendChild(feedback);
            
            setTimeout(() => {
              feedback.remove();
            }, 1000);
          }
        }
      } catch (error) {
        console.log('Cannot access iframe content due to same-origin policy restrictions');
      }
    }, 5000);
    
    actionIntervals.push(clickerInterval);
    
    // Worker 2: Scrolls iframes every 3 seconds
    const scrollerInterval = setInterval(() => {
      const runningWebsites = openWebsites.filter(site => site.state === 'running');
      if (runningWebsites.length === 0) return;
      
      const randomSite = runningWebsites[Math.floor(Math.random() * runningWebsites.length)];
      const iframe = document.getElementById(randomSite.id) as HTMLIFrameElement;
      
      // Animate the scroller avatar
      const scrollerAvatars = document.querySelectorAll(`.ai-worker-avatar.scroller[data-website="${randomSite.id}"]`);
      scrollerAvatars.forEach((avatarEl) => {
        const avatar = avatarEl as HTMLElement;
        // Random vertical position inside the iframe
        const y = Math.random() * 80; // % from top
        
        // Animate transition
        avatar.style.transform = `translateY(${y}%)`;
        avatar.style.backgroundColor = 'rgba(0, 255, 120, 0.8)';
        avatar.style.boxShadow = '0 0 15px rgba(0, 255, 120, 0.8)';
        
        // Reset after animation
        setTimeout(() => {
          avatar.style.backgroundColor = 'rgba(0, 120, 255, 0.8)';
          avatar.style.boxShadow = '0 0 10px rgba(0, 120, 255, 0.6)';
        }, 1000);
      });
      
      try {
        if (iframe && iframe.contentWindow) {
          // Scroll randomly
          const scrollY = Math.random() > 0.5 ? 100 : -100;
          iframe.contentWindow.scrollBy(0, scrollY);
          
          // Show visual feedback (only sometimes)
          if (Math.random() > 0.7) {
            const feedback = document.createElement('div');
            feedback.style.position = 'absolute';
            feedback.style.top = '40%';
            feedback.style.right = '10%';
            feedback.style.background = 'rgba(0, 120, 255, 0.3)';
            feedback.style.padding = '0.5rem';
            feedback.style.borderRadius = '0.5rem';
            feedback.style.color = 'white';
            feedback.style.fontWeight = 'bold';
            feedback.style.zIndex = '9999';
            feedback.textContent = `🤖 AI Scrolling ${scrollY > 0 ? '⬇️' : '⬆️'}`;
            
            iframe.parentElement?.appendChild(feedback);
            
            setTimeout(() => {
              feedback.remove();
            }, 800);
          }
        }
      } catch (error) {
        console.log('Cannot access iframe content due to same-origin policy restrictions');
      }
    }, 3000);
    
    actionIntervals.push(scrollerInterval);
    
    // Cleanup function
    return () => {
      actionIntervals.forEach(interval => clearInterval(interval));
      workerAvatars.forEach((avatarEl) => {
        const avatar = avatarEl as HTMLElement;
        if (avatar.parentElement) {
          avatar.parentElement.removeChild(avatar);
        }
      });
      
      // Remove any remaining avatars
      document.querySelectorAll('.ai-worker-avatar').forEach((avatarEl) => {
        const avatar = avatarEl as HTMLElement;
        if (avatar.parentElement) {
          avatar.parentElement.removeChild(avatar);
        }
      });
    };
  }, [workersActive, openWebsites]);
  
  // Calculate grid layout based on website positions and states
  const getGridStyles = () => {
    if (layout === 'stack') {
      return { gridTemplateColumns: '1fr', gridTemplateRows: '1fr' };
    }
    
    const hasLeft = openWebsites.some(site => site.position === 'left' && site.state !== 'minimized');
    const hasRight = openWebsites.some(site => site.position === 'right' && site.state !== 'minimized');
    const hasTop = openWebsites.some(site => site.position === 'top' && site.state !== 'minimized');
    const hasBottom = openWebsites.some(site => site.position === 'bottom' && site.state !== 'minimized');
    
    const columns = `${hasLeft ? '1fr ' : ''}${hasRight ? '1fr' : ''}`;
    const rows = `${hasTop ? '1fr ' : ''}${hasBottom ? '1fr' : ''}`;
    
    return {
      gridTemplateColumns: columns || '1fr',
      gridTemplateRows: rows || '1fr'
    };
  };
  
  // Find the position class for a website in the grid
  const getPositionClass = (position: WebsitePosition, state: WebsiteState) => {
    if (state === 'minimized') return 'opacity-0 absolute top-0 left-0 w-0 h-0 overflow-hidden';
    
    switch(position) {
      case 'left': return 'col-start-1 row-span-full';
      case 'right': return 'col-start-2 row-span-full';
      case 'top': return 'row-start-1 col-span-full';
      case 'bottom': return 'row-start-2 col-span-full';
      case 'full': return 'col-span-full row-span-full';
      default: return '';
    }
  };
  
  // Handle website iframe load
  const handleIframeLoad = (id: string) => {
    console.log(`Website ${id} loaded successfully`);
  };
  
  // Handle website iframe error
  const handleIframeError = (id: string) => {
    console.log(`Website ${id} failed to load`);
  };
  
  // Open URL in a new browser tab
  const openInNewTab = (url: string) => {
    window.open(url, '_blank');
  };
  
  // Render the websites grid
  const renderWebsites = () => {
    const visibleWebsites = openWebsites.filter(site => site.state !== 'minimized');
    
    return visibleWebsites.map(website => (
      <div 
        key={website.id}
        className={`relative border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded shadow-lg 
                   ${getPositionClass(website.position, website.state)}`}
      >
        {/* Website header */}
        <div className="p-2 border-b flex justify-between items-center bg-gradient-to-r from-primary/80 to-amber-500/80 text-white rounded-t-lg">
          <h3 className="text-sm font-medium truncate max-w-[150px]">{website.title || website.url}</h3>
          <div className="flex gap-1">
            {/* Position controls */}
            <div className="flex gap-0.5 mr-2">
              <Button
                size="icon"
                variant="ghost"
                className="h-5 w-5 text-white hover:bg-white/20"
                onClick={() => updatePosition(website.id, 'left')}
                title="Position Left"
              >
                <ArrowLeftCircle className="h-3 w-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-5 w-5 text-white hover:bg-white/20"
                onClick={() => updatePosition(website.id, 'right')}
                title="Position Right"
              >
                <ArrowRightCircle className="h-3 w-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-5 w-5 text-white hover:bg-white/20"
                onClick={() => updatePosition(website.id, 'top')}
                title="Position Top"
              >
                <ArrowUpCircle className="h-3 w-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-5 w-5 text-white hover:bg-white/20"
                onClick={() => updatePosition(website.id, 'bottom')}
                title="Position Bottom"
              >
                <ArrowDownCircle className="h-3 w-3" />
              </Button>
            </div>
            
            {/* State controls */}
            <Button
              size="icon"
              variant="ghost"
              className="h-5 w-5 text-white hover:bg-white/20"
              onClick={() => updatePosition(website.id, 'full')}
              title="Maximize"
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-5 w-5 text-white hover:bg-white/20"
              onClick={() => updateState(website.id, 'minimized')}
              title="Minimize"
            >
              <Minimize2 className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-5 w-5 text-white hover:bg-white/20"
              onClick={() => updateState(website.id, website.state === 'running' ? 'paused' : 'running')}
              title={website.state === 'running' ? 'Pause' : 'Play'}
            >
              {website.state === 'running' ? <PauseCircle className="h-3 w-3" /> : <PlayCircle className="h-3 w-3" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-5 w-5 text-white hover:bg-white/20"
              onClick={() => openInNewTab(website.url)}
              title="Open in Browser"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-5 w-5 text-white hover:bg-white/20"
              onClick={() => removeWebsite(website.id)}
              title="Close"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {/* Website content */}
        <div className="relative w-full h-full">
          {website.state === 'paused' && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-full shadow-lg">
                <PlayCircle className="h-10 w-10 text-primary" />
              </div>
            </div>
          )}
          
          <iframe
            id={website.id}
            src={website.url}
            className="w-full h-full"
            style={{ 
              pointerEvents: website.state === 'running' ? 'auto' : 'none',
              opacity: website.state === 'running' ? 1 : 0.7,
              background: '#ffffff'
            }}
            onLoad={() => handleIframeLoad(website.id)}
            onError={() => handleIframeError(website.id)}
            allowFullScreen={true}
            referrerPolicy="no-referrer"
            title={`Website Preview - ${website.url}`}
          />
        </div>
      </div>
    ));
  };
  
  // Render the minimized websites bar
  const renderMinimizedBar = () => {
    const minimizedWebsites = openWebsites.filter(site => site.state === 'minimized');
    
    if (minimizedWebsites.length === 0) return null;
    
    return (
      <div className="absolute bottom-0 left-0 right-0 bg-gray-100 dark:bg-gray-900 p-2 flex gap-2 overflow-x-auto">
        {minimizedWebsites.map(website => (
          <Button
            key={website.id}
            size="sm"
            variant="outline"
            className="flex items-center gap-1 text-xs"
            onClick={() => updateState(website.id, 'running')}
          >
            <Laptop className="h-3 w-3" />
            {website.url.substring(0, 15)}...
          </Button>
        ))}
      </div>
    );
  };
  
  // If no URL is provided, don't render anything
  if (!url && openWebsites.length === 0) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex flex-col">
      {/* Main toolbar */}
      <div className="p-2 bg-gradient-to-r from-primary to-amber-500 text-white flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-lg">Cartoon Website Viewer</h2>
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/20"
            onClick={() => setLayout(layout === 'grid' ? 'stack' : 'grid')}
          >
            <Layout className="h-4 w-4 mr-1" />
            {layout === 'grid' ? 'Stack View' : 'Grid View'}
          </Button>
        </div>
        
        <div className="flex gap-2">
          {/* Bubbles toggle */}
          <Button
            size="sm"
            variant={bubblesActive ? "default" : "outline"}
            className={`bg-white/20 hover:bg-white/30 text-white ${bubblesActive ? 'border-white' : ''}`}
            onClick={() => {
              const newState = !bubblesActive;
              setBubblesActive(newState);
              localStorage.setItem('bubblesActive', newState ? 'true' : 'false');
            }}
          >
            {bubblesActive ? 'Bubbles On!' : 'Generate Bubbles'}
          </Button>
          
          {/* Workers toggle */}
          <Button
            size="sm"
            variant={workersActive ? "default" : "outline"}
            className={`bg-white/20 hover:bg-white/30 text-white ${workersActive ? 'border-white' : ''}`}
            onClick={toggleWorkers}
          >
            <User className="h-4 w-4 mr-1" />
            {workersActive ? 'Workers Active' : 'Start Workers'}
          </Button>
          
          {/* URL input */}
          <div className="relative w-64">
            <input 
              type="text"
              placeholder="Enter website URL"
              className="w-full py-1 px-2 text-sm text-black rounded border border-white/50 focus:outline-none focus:ring-2 focus:ring-white"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const input = e.currentTarget;
                  let url = input.value;
                  if (!url.startsWith('http')) {
                    url = 'https://' + url;
                  }
                  addWebsite(url);
                  input.value = '';
                }
              }}
            />
          </div>
          
          {/* Close all */}
          <Button
            size="sm"
            variant="destructive"
            className="bg-red-500 hover:bg-red-600"
            onClick={onClose}
          >
            <X className="h-4 w-4 mr-1" />
            Close All
          </Button>
        </div>
      </div>
      
      {/* Websites grid */}
      <div 
        className="flex-1 grid gap-2 p-2 relative overflow-hidden"
        style={getGridStyles()}
      >
        {renderWebsites()}
        
        {/* Floating bubbles */}
        {bubblesActive && bubbles.map((bubble) => (
          <div
            key={bubble.id}
            className="absolute rounded-full cursor-pointer transition-transform"
            style={{
              left: `${bubble.x}%`,
              top: `${bubble.y}%`,
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              background: `radial-gradient(circle at 30% 30%, white, ${bubble.color})`,
              boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
              transform: `scale(${bubble.popped ? 0 : 1})`,
              transition: 'transform 0.2s ease-out',
              opacity: bubble.popped ? 0 : 0.8
            }}
            onClick={() => popBubble(bubble.id)}
          />
        ))}
      </div>
      
      {/* Minimized websites bar */}
      {renderMinimizedBar()}
      
      {/* Worker panel */}
      {showWorkerPanel && (
        <div className="absolute right-4 top-16 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg w-64">
          <h3 className="font-bold mb-2">AI Workers</h3>
          <p className="text-sm mb-4">Workers will simulate human interaction with websites.</p>
          <Button
            className="w-full"
            onClick={() => setShowWorkerPanel(false)}
          >
            Close Panel
          </Button>
        </div>
      )}
    </div>
  );
}
