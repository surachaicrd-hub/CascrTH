import { onBeforeUnmount, watch } from 'vue';
import { useSettingsStore } from '../stores/settingsStore';

export function useSEO() {
  const settingsStore = useSettingsStore();
  let lastMetaOptions = null;

  const helperSetMetaTag = (selector, attrName, attrValue, content) => {
    let el = document.querySelector(selector);
    if (!el && content) {
      el = document.createElement('meta');
      el.setAttribute(attrName, attrValue);
      document.head.appendChild(el);
    }
    if (el) {
      if (content) {
        el.setAttribute('content', content);
      } else {
        el.remove();
      }
    }
  };

  const helperSetLinkTag = (rel, href) => {
    let el = document.querySelector(`link[rel="${rel}"]`);
    if (!el && href) {
      el = document.createElement('link');
      el.setAttribute('rel', rel);
      document.head.appendChild(el);
    }
    if (el) {
      if (href) {
        el.setAttribute('href', href);
      } else {
        el.remove();
      }
    }
  };

  /**
   * Set document meta tags dynamically
   */
  const setMeta = (options = {}) => {
    lastMetaOptions = options;
    const titleVal = typeof options === 'string' ? options : options.title;
    const descVal = typeof options === 'string' ? '' : options.description;
    const imageVal = typeof options === 'string' ? '' : options.image;
    const keywordsVal = options.keywords || settingsStore.storeKeywords || '';
    const llmContextVal = options.llmContext || settingsStore.storeDefaultLlmContext || '';
    const typeVal = options.type || 'website';
    const canonicalVal = options.canonicalUrl || (typeof window !== 'undefined' ? window.location.href : '');

    const storeName = settingsStore.storeName || '';
    const storeDesc = descVal || settingsStore.storeDescription || '';
    const pageTitle = titleVal ? (storeName ? `${titleVal} | ${storeName}` : titleVal) : (settingsStore.storeOgTitle || storeName || '');
    const finalImage = imageVal ? (imageVal.startsWith('http') ? imageVal : `${window.location.origin}${imageVal}`) : `${window.location.origin}/og-image.jpg`;

    // 1. Document Title
    if (pageTitle) {
      document.title = pageTitle;
    }

    // 2. Standard Meta
    helperSetMetaTag('meta[name="title"]', 'name', 'title', pageTitle);
    helperSetMetaTag('meta[name="description"]', 'name', 'description', storeDesc);
    helperSetMetaTag('meta[name="keywords"]', 'name', 'keywords', keywordsVal);
    helperSetMetaTag('meta[name="llm-context"]', 'name', 'llm-context', llmContextVal);
    helperSetMetaTag('meta[name="ai-content-type"]', 'name', 'ai-content-type', 'e-commerce, product-catalog, technical-knowledge');

    // 3. Open Graph / Social Media
    helperSetMetaTag('meta[property="og:type"]', 'property', 'og:type', typeVal);
    helperSetMetaTag('meta[property="og:url"]', 'property', 'og:url', canonicalVal);
    helperSetMetaTag('meta[property="og:title"]', 'property', 'og:title', pageTitle);
    helperSetMetaTag('meta[property="og:description"]', 'property', 'og:description', storeDesc);
    helperSetMetaTag('meta[property="og:image"]', 'property', 'og:image', finalImage);
    helperSetMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', storeName);
    helperSetMetaTag('meta[property="og:locale"]', 'property', 'og:locale', 'th_TH');

    // 4. Twitter Cards
    helperSetMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    helperSetMetaTag('meta[name="twitter:url"]', 'name', 'twitter:url', canonicalVal);
    helperSetMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', pageTitle);
    helperSetMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', storeDesc);
    helperSetMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', finalImage);

    // 5. Canonical Link
    helperSetLinkTag('canonical', canonicalVal);
  };

  // Reactively re-apply meta when settings load from API
  const stopWatch = watch(
    [() => settingsStore.storeName, () => settingsStore.storeDescription, () => settingsStore.storeOgTitle, () => settingsStore.storeKeywords],
    () => {
      if (lastMetaOptions) {
        setMeta(lastMetaOptions);
      }
    }
  );

  /**
   * Inject JSON-LD Structured Data
   */
  const setStructuredData = (schemaData, scriptId = 'dynamic-structured-data') => {
    if (!schemaData) return;
    let scriptTag = document.getElementById(scriptId);
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = scriptId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = typeof schemaData === 'string' ? schemaData : JSON.stringify(schemaData);
  };

  /**
   * Remove structured data tag by ID
   */
  const removeStructuredData = (scriptId = 'dynamic-structured-data') => {
    const scriptTag = document.getElementById(scriptId);
    if (scriptTag) {
      scriptTag.remove();
    }
  };

  /**
   * Clean up structured data on unmount
   */
  onBeforeUnmount(() => {
    removeStructuredData('dynamic-structured-data');
    removeStructuredData('dynamic-breadcrumb-data');
    removeStructuredData('dynamic-faq-data');
  });

  return {
    setMeta,
    setStructuredData,
    removeStructuredData
  };
}
