/**
 * Extracts the base URL from a website URL
 */
export function getBaseUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    return `${parsedUrl.protocol}//${parsedUrl.hostname}`;
  } catch (error) {
    console.error("Invalid URL:", url);
    return url;
  }
}

/**
 * Gets the favicon URL for a website
 */
export function getFaviconUrl(url: string): string {
  const baseUrl = getBaseUrl(url);
  return `${baseUrl}/favicon.ico`;
}

/**
 * Gets a larger icon for a website (when available)
 */
export function getLargeIconUrl(url: string): string {
  const baseUrl = getBaseUrl(url);
  return `${baseUrl}/apple-touch-icon.png`;
}

/**
 * Extracts the domain name from a URL for display purposes
 */
export function extractDomain(url: string): string {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname;
  } catch (error) {
    console.error("Invalid URL:", url);
    return url;
  }
}

/**
 * Generates a title from a URL if no title is provided
 */
export function generateTitleFromUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    // Remove www. prefix if present
    let domain = parsedUrl.hostname.replace(/^www\./, '');
    // Convert to title case and remove TLD
    return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
  } catch (error) {
    console.error("Invalid URL:", url);
    return "Website";
  }
}
