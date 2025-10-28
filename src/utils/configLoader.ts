// Config loader - loads config from the main process
// The main process loads config.xml and exposes it via window.__config

let configCache: any = null;

export function loadConfig(): any {
  // Return cached config if already loaded
  if (configCache !== null) {
    return configCache;
  }
  
  // Wait for config to be injected by main process
  // Check if config was provided by main process
  const config = (window as any).__config;
  
  console.log('loadConfig called. window.__config:', config);
  
  if (config) {
    console.log('Loaded config from main process with keys:', Object.keys(config));
    configCache = config;
    return configCache;
  } else {
    // Config not found
    console.error('Config not loaded by main process. window.__config is:', config);
    throw new Error('config.xml could not be loaded by the main process');
  }
}

