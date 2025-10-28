const { app, BrowserWindow } = require('electron');
const path = require('path');

// Suppress GPU process errors and improve stability
app.commandLine.appendSwitch('--disable-gpu-sandbox');
app.commandLine.appendSwitch('--disable-gpu-process-crash-limit');
app.commandLine.appendSwitch('--disable-gpu-compositing');
app.commandLine.appendSwitch('--disable-gpu-rasterization');
app.commandLine.appendSwitch('--disable-background-timer-throttling');
app.commandLine.appendSwitch('--disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('--disable-renderer-backgrounding');
app.commandLine.appendSwitch('--disable-web-security');
app.commandLine.appendSwitch('--disable-features', 'VizDisplayCompositor');

// Handle GPU process crashes gracefully
app.on('gpu-process-crashed', (event, killed) => {
  console.log('GPU process crashed, killed:', killed);
});

// Suppress console errors for GPU issues
process.on('uncaughtException', (error) => {
  if (error.message && (
    error.message.includes('gpu_process_host') ||
    error.message.includes('command_buffer_proxy_impl') ||
    error.message.includes('GPU process exited unexpectedly')
  )) {
    console.log('Suppressed GPU process error:', error.message);
    return;
  }
  console.error('Uncaught Exception:', error);
});

// Suppress specific GPU error messages
const originalConsoleError = console.error;
console.error = (...args) => {
  const message = args.join(' ');
  if (message.includes('gpu_process_host.cc') || 
      message.includes('command_buffer_proxy_impl.cc') ||
      message.includes('GPU process exited unexpectedly')) {
    return; // Suppress these specific errors
  }
  originalConsoleError.apply(console, args);
};

function createWindow() {
  const isDevelopment = !app.isPackaged;
  
  // Get app path - this will be the path to the app.asar in production
  const appPath = isDevelopment ? __dirname : path.dirname(__dirname);
  
  // Get app path and load config
  const isDev = !app.isPackaged;
  let config = null;
  let configPath = null;
  
  console.log('=== Config Loading Debug ===');
  console.log('isPackaged:', app.isPackaged);
  console.log('process.execPath:', process.execPath);
  console.log('__dirname:', __dirname);
  console.log('appPath:', appPath);
  
         try {
           const fs = require('fs');
           
           if (isDev) {
             // In development: look in project root (same directory as main.js)
             configPath = path.join(__dirname, 'config.xml');
           } else {
             // In production: load from next to the executable (external, user-editable)
             // Use PORTABLE_EXECUTABLE_DIR for portable apps (electron-builder sets this)
             let configDir;
             if (process.env.PORTABLE_EXECUTABLE_DIR) {
               // Portable app - use the directory provided by electron-builder
               configDir = process.env.PORTABLE_EXECUTABLE_DIR;
               console.log('Detected portable app, using PORTABLE_EXECUTABLE_DIR:', configDir);
             } else {
               // Regular installation - use the executable directory
               const exePath = app.getPath('exe');
               configDir = path.dirname(exePath);
               console.log('Regular installation, using exe directory:', configDir);
             }
             configPath = path.join(configDir, 'config.xml');
             console.log('Looking for config next to executable:', configPath);
           }
           
           console.log('Final config path:', configPath);
           
           const exists = fs.existsSync(configPath);
           console.log('Config exists on disk:', exists);
           if (exists) {
             const resolved = fs.realpathSync.native ? fs.realpathSync.native(configPath) : fs.realpathSync(configPath);
             console.log('Resolved config real path:', resolved);
             const raw = fs.readFileSync(configPath, 'utf8');
             
             // Parse XML and extract XOR key
             const xorkeyMatch = raw.match(/<xorkey>\s*([^<]+)\s*<\/xorkey>/);
             if (xorkeyMatch) {
               const hexString = xorkeyMatch[1].trim();
               // Split by comma and convert hex literals to decimal numbers
               const xorKeyArray = hexString.split(',').map(hex => parseInt(hex.trim(), 16));
               
               config = {
                 xorKey: xorKeyArray,
                 description: 'XOR Key Configuration',
                 note: 'Loaded from XML config file'
               };
               
               console.log('✓ Config loaded successfully from:', resolved, 'with XOR key length:', xorKeyArray.length);
             } else {
               console.log('✗ No <xorkey> tag found in XML config');
             }
           } else {
             console.log('✗ Config file does not exist at:', configPath);
           }
         } catch (error) {
           console.error('Failed to load config.xml:', error);
         }
  console.log('==========================');

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // Don't show until ready to prevent flash
    autoHideMenuBar: !isDevelopment, // Hide menu bar in production (release)
    backgroundColor: '#1e1e1e', // Match's app's dark theme
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,  // Disable for now to allow accessing window
      devTools: true // Enable DevTools for debugging
    }
  });

  // Show window only after content is loaded
  win.webContents.once('did-finish-load', () => {
    win.show();
    setTimeout(() => {
      if (config) {
        win.webContents.executeJavaScript(`
          window.__appPath = ${JSON.stringify(appPath)};
          window.__config = ${JSON.stringify(config)};
          
          // Dispatch event to notify that config is ready
          window.dispatchEvent(new Event('config-loaded'));
        `);
      } else {
        win.webContents.executeJavaScript(`
          window.__appPath = ${JSON.stringify(appPath)};
          window.__config = null;
          
          // Dispatch event to notify that config failed
          window.dispatchEvent(new Event('config-failed'));
        `);
      }
    }, 100);
    
    // Maximize the window after showing
    win.maximize();
  });

  if (!isDevelopment) {
    // Remove menu entirely in production
    win.removeMenu();
    
    // Block common DevTools shortcuts (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U)
    win.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F12' || // F12 key
          (input.key === 'I' && input.control && input.shift) || // Ctrl+Shift+I
          (input.key === 'J' && input.control && input.shift) || // Ctrl+Shift+J
          (input.key === 'U' && input.control)) { // Ctrl+U
        event.preventDefault();
      }
    });
  }

  win.loadFile('dist/index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
