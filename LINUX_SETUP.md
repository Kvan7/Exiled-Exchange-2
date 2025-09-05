# Exiled Exchange 2 - Linux Setup Guide

This guide provides detailed instructions for setting up and running Exiled Exchange 2 on Linux (Ubuntu/Debian-based distributions).

## Table of Contents
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Building from Source](#building-from-source)
- [Running the Application](#running-the-application)
- [Auto-Update Setup](#auto-update-setup)
- [Troubleshooting](#troubleshooting)
- [Usage](#usage)

## Prerequisites

### Required Software
```bash
# Install Node.js (v18 or higher)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Git
sudo apt-get install -y git

# Install build essentials
sudo apt-get install -y build-essential
```

### Path of Exile 2 Settings
- **IMPORTANT**: Path of Exile 2 must run in **Windowed Fullscreen** or **Windowed** mode
- The game will NOT work with Exclusive Fullscreen mode

## Installation

### 1. Clone the Repository
```bash
cd ~
git clone https://github.com/Kvan7/Exiled-Exchange-2.git
cd Exiled-Exchange-2
```

### 2. Quick Setup Script
For a quick automated setup, we've created scripts that handle everything:

```bash
# Make scripts executable
chmod +x auto-update.sh setup-auto-update.sh

# Run initial build and start
./auto-update.sh
```

## Building from Source

### Manual Build Process

#### 1. Install Dependencies and Build Renderer
```bash
cd renderer
npm install
npm run make-index-files
npm run build
```

#### 2. Install Dependencies and Build Main Application
```bash
cd ../main
npm install
npm run build
```

#### 3. Package the Application
```bash
npm run package
```

This creates an AppImage in `main/dist/` directory.

## Running the Application

### Method 1: Using the Auto-Update Script (Recommended)
```bash
./auto-update.sh run
```

### Method 2: Direct AppImage Execution
```bash
# Navigate to main/dist directory
cd main/dist
chmod +x "Exiled Exchange 2-*.AppImage"
./"Exiled Exchange 2-*.AppImage" --no-sandbox
```

### Method 3: Development Mode
```bash
# Terminal 1 - Run renderer
cd renderer
npm run dev

# Terminal 2 - Run main application
cd main
npm run dev
```

## Auto-Update Setup

### Enable Automatic Updates
The auto-update system will check for git updates and rebuild the application automatically.

```bash
# One-time setup
./setup-auto-update.sh
```

This will:
- Set up a cron job to check for updates every 6 hours
- Configure the application to auto-start on system boot
- Create a system tray icon for easy access

### Auto-Update Commands
```bash
# Check for updates and run if available
./auto-update.sh check

# Force rebuild and run
./auto-update.sh force-build

# Stop the application
./auto-update.sh stop

# Just run without checking updates
./auto-update.sh run
```

### Auto-Start on Boot
The setup script creates a desktop entry in `~/.config/autostart/` that will:
- Start Exiled Exchange 2 when you log into your desktop
- Check for updates before starting
- Run in the system tray

## Troubleshooting

### Electron Sandbox Error
If you encounter this error:
```
The SUID sandbox helper binary was found, but is not configured correctly
```

**Solution 1: Run with --no-sandbox flag (Recommended for personal use)**
```bash
./auto-update.sh run  # Already includes --no-sandbox
```

**Solution 2: Fix sandbox permissions (More secure)**
```bash
sudo chown root:root main/node_modules/electron/dist/chrome-sandbox
sudo chmod 4755 main/node_modules/electron/dist/chrome-sandbox
```

### Application Not Detecting Path of Exile 2

1. **Check Window Mode**: Ensure PoE2 is in Windowed or Windowed Fullscreen mode
2. **Restart the Game**: Close PoE2 completely and restart it after starting Exiled Exchange 2
3. **Check Process**: Verify Exiled Exchange 2 is running:
   ```bash
   ps aux | grep "Exiled Exchange"
   ```

### Build Errors

If you encounter build errors:
```bash
# Clean install
rm -rf renderer/node_modules main/node_modules
rm -rf renderer/dist main/dist
./auto-update.sh force-build
```

## Usage

### Keyboard Shortcuts (Default)
- **Alt+D** - Price check item under cursor
- **Alt+Q** - Quick search
- **Alt+W** - Open main window
- **Alt+Space** - Hide all overlays
- **Shift+Space** - Show/hide overlay (configurable)

### System Tray
Right-click the system tray icon to:
- Access Settings/League configuration
- Open in browser
- Open config folder
- Quit the application

### Configuration
- Settings are stored in: `~/.config/exiled-exchange-2/apt-data/`
- First launch creates default configuration
- Use in-game overlay (Shift+Space) to access settings

## File Structure

```
Exiled-Exchange-2/
├── auto-update.sh          # Main automation script
├── setup-auto-update.sh    # One-time setup script
├── renderer/               # Frontend Vue.js application
│   ├── src/
│   ├── dist/              # Built frontend files
│   └── package.json
├── main/                  # Electron main process
│   ├── src/
│   ├── dist/              # Built application and AppImage
│   └── package.json
└── LINUX_SETUP.md         # This file
```

## Logs and Debugging

### Application Logs
```bash
# View auto-update logs
tail -f ~/Exiled-Exchange-2/auto-update.log

# View application logs
~/.config/exiled-exchange-2/logs/
```

### Debug Mode
To run in debug mode with console output:
```bash
cd main
npm run dev
```

## Security Considerations

- The `--no-sandbox` flag is used to bypass Electron sandbox restrictions on Linux
- This is generally safe for personal use but not recommended for distributed applications
- For maximum security, fix the sandbox permissions instead (see Troubleshooting)

## Contributing

When contributing to the Linux setup:
1. Test on Ubuntu 20.04 LTS or newer
2. Ensure scripts are POSIX-compliant
3. Document any distribution-specific requirements

## Support

For Linux-specific issues:
1. Check the [FAQ](https://kvan7.github.io/Exiled-Exchange-2/faq)
2. Open an issue on [GitHub](https://github.com/Kvan7/Exiled-Exchange-2/issues) with "Linux" label
3. Include your distribution, kernel version, and error logs

---

*Note: This guide is for Ubuntu/Debian-based distributions. Other distributions may require slight modifications to package installation commands.*
## Linux Shortcuts Troubleshooting (Issue #513)

If keyboard shortcuts (Alt+D, Alt+W, etc.) don't work on Linux:

### Solution 1: Permissions Fix
```bash
# Grant input permissions
sudo usermod -a -G input $USER
sudo chmod +r /dev/input/event*
# Logout and login again
```

### Solution 2: X11 Environment
```bash
# Ensure X11 environment is properly set
export DISPLAY=:0
# Then restart the application
./auto-update.sh stop
./auto-update.sh run
```

### Solution 3: Alternative Launch
```bash
# Run with additional X11 permissions
xhost +local:
./auto-update.sh run
```

### Solution 4: Wayland Compatibility
```bash
# For Wayland users, force X11 mode
export GDK_BACKEND=x11
export QT_QPA_PLATFORM=xcb
./auto-update.sh run
```

If shortcuts still don't work, the issue may be related to system security policies or desktop environment conflicts.
