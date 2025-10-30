// Config loader
// Electron: main process injects window.__config
// Web: fetch config.xml and parse <xorkey> into an array

let configCache: any = null;

export function loadConfig(): any {
  // Return cached config if already loaded
  if (configCache !== null) {
    return configCache;
  }
  
  const injected = (window as any).__config;
  if (injected) {
    configCache = injected;
    return configCache;
  }

  // Browser fallback: try to GET /config.xml and parse the xorkey list
  throwIfDOMUnavailable();
  const xhr = new XMLHttpRequest();
  xhr.open('GET', 'config.xml', false);
  try {
    xhr.send(null);
  } catch (e) {
    console.error('Failed to request config.xml:', e);
  }

  if (xhr.status >= 200 && xhr.status < 300 && xhr.responseText) {
    const raw = xhr.responseText;
    const match = raw.match(/<xorkey>\s*([^<]+)\s*<\/xorkey>/i);
    if (match) {
      const hexString = match[1].trim();
      const xorKeyArray = hexString.split(',').map((h) => parseInt(h.trim(), 16));
      configCache = { xorKey: xorKeyArray };
      (window as any).__config = configCache;
      return configCache;
    }
  }

  console.error('config.xml is required but could not be loaded');
  throw new Error('config.xml is required but could not be loaded');
}

function throwIfDOMUnavailable(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('DOM not available');
  }
}

