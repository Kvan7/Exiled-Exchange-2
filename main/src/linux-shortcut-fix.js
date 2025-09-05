// Linux-specific shortcut fixes for Issue #513
// Ensures proper keyboard hook initialization on Linux

const { app } = require('electron');

// Linux-specific uIOhook initialization
if (process.platform === 'linux') {
  // Ensure proper permissions and initialization
  process.env.DISPLAY = process.env.DISPLAY || ':0';
  
  try {
    // Add delay for Linux X11 initialization with fallback
    const uiohookModule = require('uiohook-napi');
    if (uiohookModule && uiohookModule.uIOhook && uiohookModule.uIOhook.start) {
      const originalStart = uiohookModule.uIOhook.start;
      uiohookModule.uIOhook.start = function() {
        setTimeout(() => {
          try {
            originalStart.call(this);
            console.log('Linux shortcuts initialized successfully');
          } catch (error) {
            console.error('Linux shortcuts initialization failed:', error);
            console.log('Running without sandbox may be required for shortcuts on Linux');
            // Fallback: attempt original function without delay
            try {
              originalStart.call(this);
              console.log('Linux shortcuts fallback initialization succeeded');
            } catch (fallbackError) {
              console.error('Linux shortcuts fallback also failed:', fallbackError);
            }
          }
        }, 1000); // 1 second delay for Linux
      };
    } else {
      console.warn('uiohook-napi module not available or incomplete - shortcuts may not work');
    }
  } catch (moduleError) {
    console.error('Failed to load uiohook-napi module:', moduleError);
    console.log('Shortcuts will not be available on this Linux system');
  }
}

module.exports = {};
