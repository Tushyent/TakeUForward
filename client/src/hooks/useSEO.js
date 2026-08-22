import { useEffect } from 'react';

/**
 * Custom React hook for dynamic SEO, title, meta description, keywords, and canonical URL management.
 * 
 * @param {Object} options
 * @param {string} options.title - Dynamic page title
 * @param {string} [options.description] - Dynamic meta description
 * @param {string} [options.keywords] - Comma-separated dynamic keywords
 * @param {string} [options.canonical] - Dynamic canonical URL
 * @param {string} [options.ogImage] - Dynamic OpenGraph image URL
 */
export function useSEO({ title, description, keywords, canonical, ogImage, structuredData }) {
  const serializedData = structuredData ? JSON.stringify(structuredData) : '';

  useEffect(() => {
    // 1. Update document title
    if (title) {
      document.title = title.includes('TakeUForward') ? title : `${title} - TakeUForward SSN`;
    }

    // Helper function to update or create meta tags
    const setMetaTag = (selector, propertyName, propertyValue, content) => {
      if (!content) return;
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(propertyName, propertyValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 2. Update Meta Description
    setMetaTag('meta[name="description"]', 'name', 'description', description);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);

    // 3. Update Title Tags
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', title);
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', title);

    // 4. Update Keywords
    setMetaTag('meta[name="keywords"]', 'name', 'keywords', keywords);

    // 5. Update OG Image
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', ogImage);
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', ogImage);

    // 6. Update Canonical Link
    if (canonical) {
      let canonicalElement = document.querySelector('link[rel="canonical"]');
      if (!canonicalElement) {
        canonicalElement = document.createElement('link');
        canonicalElement.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalElement);
      }
      canonicalElement.setAttribute('href', canonical);
    }

    // 7. Update Dynamic JSON-LD Structured Data
    if (serializedData) {
      const existingData = document.getElementById('seo-structured-data');
      if (existingData) {
        existingData.remove();
      }
      const ldJsonElement = document.createElement('script');
      ldJsonElement.setAttribute('type', 'application/ld+json');
      ldJsonElement.setAttribute('id', 'seo-structured-data');
      ldJsonElement.textContent = serializedData;
      document.head.appendChild(ldJsonElement);
    }

    return () => {
      // Clean up dynamic structured data
      const existingData = document.getElementById('seo-structured-data');
      if (existingData) {
        existingData.remove();
      }
    };
  }, [title, description, keywords, canonical, ogImage, serializedData]);
}

export default useSEO;
