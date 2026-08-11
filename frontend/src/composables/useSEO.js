import { onBeforeUnmount } from 'vue';
import { useSettingsStore } from '../stores/settingsStore';

export function useSEO() {
  const settingsStore = useSettingsStore();

  /**
   * Set basic document title and meta description dynamically
   */
  const setMeta = (title, description, image = '') => {
    const storeName = settingsStore.storeName || 'บ้านเก็บของ';
    const storeDesc = description || settingsStore.storeDescription || '';
    const pageTitle = title ? `${title} | ${storeName}` : (settingsStore.storeOgTitle || storeName);

    document.title = pageTitle;

    const descTag = document.querySelector('meta[name="description"]');
    if (descTag && storeDesc) {
      descTag.setAttribute('content', storeDesc);
    }

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', pageTitle);
    }

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc && storeDesc) {
      ogDesc.setAttribute('content', storeDesc);
    }
  };

  /**
   * Inject JSON-LD Structured Data
   */
  const setStructuredData = (schemaData) => {
    let scriptTag = document.getElementById('dynamic-structured-data');
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'dynamic-structured-data';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(schemaData);
  };

  /**
   * Clean up structured data on unmount to avoid pollution across pages
   */
  onBeforeUnmount(() => {
    const scriptTag = document.getElementById('dynamic-structured-data');
    if (scriptTag) {
      scriptTag.remove();
    }
    if (typeof settingsStore.applySeoToDOM === 'function') {
      settingsStore.applySeoToDOM();
    }
  });

  return {
    setMeta,
    setStructuredData
  };
}
