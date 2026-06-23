import { onBeforeUnmount } from 'vue';
import { useSettingsStore } from '../stores/settingsStore';

export function useSEO() {
  const settingsStore = useSettingsStore();

  /**
   * Set basic document title and meta description dynamically
   */
  const setMeta = (title, description, image = '') => {
    const storeName = settingsStore.storeName || 'STORAGE HOUSE';
    document.title = title ? `${title} | ${storeName}` : `${storeName} — บ้านเก็บของสำเร็จรูป ตู้เก็บของกลางแจ้ง โกดังเก็บของ คุณภาพพรีเมียม`;

    const descTag = document.querySelector('meta[name="description"]');
    if (descTag && description) {
      descTag.setAttribute('content', description);
    }

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle && title) {
      ogTitle.setAttribute('content', title);
    }

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc && description) {
      ogDesc.setAttribute('content', description);
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
    // Restore default title when leaving component (optional but good practice)
    const storeName = settingsStore.storeName || 'STORAGE HOUSE';
    document.title = `${storeName} — บ้านเก็บของสำเร็จรูป ตู้เก็บของกลางแจ้ง โกดังเก็บของ คุณภาพพรีเมียม`;
  });

  return {
    setMeta,
    setStructuredData
  };
}
