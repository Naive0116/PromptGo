// In-memory cache for fetched data
const dataCache = new Map<string, any>();

// Get base URL from Vite config
const BASE_URL = import.meta.env.BASE_URL;

/**
 * Resolves the data path for prompt.json or category JSON files.
 * @param type - "prompt" or "category"
 * @param options - { lang, key? }
 * @returns The relative path to the JSON file.
 */
export const resolveDataPath = (type: 'prompt' | 'category', { lang, key }: { lang: string; key?: string }): string => {
  if (type === 'prompt') {
    return `${BASE_URL}data/${lang}/prompt.json`;
  }
  if (type === 'category' && key) {
    return `${BASE_URL}data/${lang}/${key}.json`;
  }
  throw new Error('Invalid data path resolution parameters.');
};

/**
 * Fetches JSON data with a fallback mechanism.
 * Tries paths in order, returns the first successful JSON.
 * Caches successful fetches.
 * @param paths - An array of paths to try.
 * @returns The fetched JSON data.
 */
export const fetchWithFallback = async <T>(paths: string[]): Promise<T> => {
  for (const path of paths) {
    const cacheKey = path; // Use path as cache key
    if (dataCache.has(cacheKey)) {
      return dataCache.get(cacheKey) as T;
    }

    try {
      const response = await fetch(path);
      if (response.ok) {
        const data = await response.json();
        dataCache.set(cacheKey, data);
        return data as T;
      }
    } catch (error) {
      console.warn(`Failed to fetch from ${path}:`, error);
    }
  }
  throw new Error(`Failed to fetch data from all provided paths: ${paths.join(', ')}`);
};

/**
 * Fetches data for a specific type and language, with English fallback.
 * @param type - "prompt" or "category"
 * @param lang - The primary language to try.
 * @param key - Optional key for category files.
 * @returns The fetched JSON data.
 */
export const fetchData = async <T>(type: 'prompt' | 'category', lang: string, key?: string): Promise<T> => {
  const primaryPath = resolveDataPath(type, { lang, key });
  const fallbackPath = resolveDataPath(type, { lang: 'en', key }); // Always fallback to English

  // Try primary language first, then English fallback
  return fetchWithFallback<T>([primaryPath, fallbackPath]);
};
