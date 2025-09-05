#!/bin/bash
set -euo pipefail

# Exiled Exchange 2 Auto-Update Script
# This script checks for updates, rebuilds if needed, and runs the app

# Safety checks
if [ "$EUID" -eq 0 ]; then
    echo "Error: This script should not be run as root for security reasons."
    exit 1
fi

# Validate script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ ! -d "$SCRIPT_DIR" ] || [ ! -w "$SCRIPT_DIR" ]; then
    echo "Error: Script directory $SCRIPT_DIR is not accessible or writable."
    exit 1
fi

cd "$SCRIPT_DIR"

# Validate required directories exist
for dir in "main" "renderer"; do
    if [ ! -d "$SCRIPT_DIR/$dir" ]; then
        echo "Error: Required directory $dir not found. Are you in the correct repository?"
        exit 1
    fi
done

LOG_FILE="$SCRIPT_DIR/auto-update.log"
PID_FILE="/tmp/exiled-exchange-2.pid"

# Security configuration - can be overridden by environment variable
# Set EXILED_SANDBOX_ENABLED=true to enable Electron sandbox (more secure but may cause issues)
# Set EXILED_SANDBOX_ENABLED=false to disable Electron sandbox (less secure but more compatible)
SANDBOX_ENABLED="${EXILED_SANDBOX_ENABLED:-true}"

# Cleanup function for graceful shutdown
cleanup() {
    log_message "Script interrupted. Cleaning up..."
    kill_existing
    exit 130
}

# Set up signal handlers for graceful shutdown
trap cleanup INT TERM

# Function to get the latest AppImage path dynamically
get_appimage_path() {
    local appimage_path
    appimage_path=$(ls -v "$SCRIPT_DIR"/main/dist/Exiled\ Exchange\ 2-*.AppImage 2>/dev/null | tail -n 1)
    
    if [ -z "$appimage_path" ]; then
        log_message "Error: No AppImage found in $SCRIPT_DIR/main/dist/"
        log_message "Please run './auto-update.sh force-build' to build the application first."
        return 1
    fi
    
    echo "$appimage_path"
}

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to kill existing instance
kill_existing() {
    if [ -f "$PID_FILE" ]; then
        OLD_PID=$(cat "$PID_FILE")
        if kill -0 "$OLD_PID" 2>/dev/null; then
            log_message "Killing existing instance (PID: $OLD_PID)"
            kill "$OLD_PID"
            sleep 2
        fi
        rm -f "$PID_FILE"
    fi
}

# Function to build the app
build_app() {
    log_message "Building application..."
    
    # Check for required tools
    for cmd in npm node git; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            log_message "Error: Required command '$cmd' not found. Please install it first."
            exit 1
        fi
    done
    
    # Build renderer
    cd "$SCRIPT_DIR/renderer" || { log_message "Failed to enter renderer directory"; exit 1; }
    log_message "Installing renderer dependencies..."
    npm install --silent || { log_message "Failed to install renderer dependencies"; exit 1; }
    npm run make-index-files || { log_message "Failed to make index files"; exit 1; }
    npm run build || { log_message "Failed to build renderer"; exit 1; }
    
    # Build main
    cd "$SCRIPT_DIR/main" || { log_message "Failed to enter main directory"; exit 1; }
    log_message "Installing main dependencies..."
    npm install --silent || { log_message "Failed to install main dependencies"; exit 1; }
    npm run build || { log_message "Failed to build main application"; exit 1; }
    npm run package || { log_message "Failed to package application"; exit 1; }
    
    # Make AppImage executable
    if APPIMAGE_PATH=$(get_appimage_path); then
        chmod +x "$APPIMAGE_PATH" || { log_message "Failed to make AppImage executable"; exit 1; }
        log_message "AppImage created at: $APPIMAGE_PATH"
    else
        log_message "Error: Failed to create AppImage"
        exit 1
    fi
    
    log_message "Build complete"
}

# Function to retry git operations with exponential backoff
retry_git_command() {
    local cmd="$1"
    local max_attempts=3
    local attempt=1
    local delay=1
    
    while [ $attempt -le $max_attempts ]; do
        log_message "Attempting git operation (attempt $attempt/$max_attempts): $cmd"
        
        if eval "$cmd"; then
            return 0
        else
            if [ $attempt -eq $max_attempts ]; then
                log_message "Error: Git operation failed after $max_attempts attempts"
                return 1
            fi
            
            log_message "Git operation failed, retrying in ${delay}s..."
            sleep $delay
            delay=$((delay * 2))  # Exponential backoff
            attempt=$((attempt + 1))
        fi
    done
}

# Function to check for updates
check_and_update() {
    log_message "Checking for updates..."
    
    # Check network connectivity first
    if ! ping -c 1 github.com >/dev/null 2>&1; then
        log_message "Warning: No network connectivity to GitHub. Skipping update check."
        return 1  # No updates
    fi
    
    # Detect default branch with fallback
    DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || echo "master")
    log_message "Using branch: $DEFAULT_BRANCH"
    
    # Fetch latest changes with retry
    if ! retry_git_command "git fetch origin"; then
        log_message "Failed to fetch updates from remote repository"
        return 1  # No updates
    fi
    
    # Check if we're behind
    LOCAL=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
    REMOTE=$(git rev-parse origin/$DEFAULT_BRANCH 2>/dev/null || echo "unknown")
    
    if [ "$LOCAL" = "unknown" ] || [ "$REMOTE" = "unknown" ]; then
        log_message "Error: Could not determine repository state"
        return 1  # No updates
    fi
    
    if [ "$LOCAL" != "$REMOTE" ]; then
        log_message "Updates available. Pulling changes..."
        if retry_git_command "git pull origin $DEFAULT_BRANCH"; then
            # Rebuild the application
            build_app
            return 0  # Updated
        else
            log_message "Failed to pull updates from remote repository"
            return 1  # No updates
        fi
    else
        log_message "Already up to date"
        return 1  # No updates
    fi
}

# Function to run the app
run_app() {
    log_message "Starting Exiled Exchange 2..."
    
    # Kill any existing instance
    kill_existing
    
    # Get current AppImage path
    if APPIMAGE_PATH=$(get_appimage_path); then
        if [ ! -f "$APPIMAGE_PATH" ]; then
            log_message "Error: AppImage file not accessible at $APPIMAGE_PATH"
            exit 1
        fi
        
        # Verify AppImage is executable
        if [ ! -x "$APPIMAGE_PATH" ]; then
            log_message "Making AppImage executable..."
            chmod +x "$APPIMAGE_PATH" || { log_message "Failed to make AppImage executable"; exit 1; }
        fi
    else
        log_message "Error: Could not determine AppImage path"
        exit 1
    fi
    
    # Determine security flags
    local security_flags=""
    if [ "$SANDBOX_ENABLED" = "false" ]; then
        security_flags="--no-sandbox"
        log_message "Running with --no-sandbox flag (less secure, more compatible)"
    else
        log_message "Running with Electron sandbox enabled (more secure)"
    fi
    
    # Run the AppImage in background
    log_message "Launching: $APPIMAGE_PATH $security_flags"
    if [ -n "$security_flags" ]; then
        "$APPIMAGE_PATH" $security_flags &
    else
        "$APPIMAGE_PATH" &
    fi
    APP_PID=$!
    
    # Verify the process started successfully
    sleep 1
    if ! kill -0 "$APP_PID" 2>/dev/null; then
        log_message "Error: Application failed to start"
        exit 1
    fi
    
    echo $APP_PID > "$PID_FILE"
    log_message "Started with PID: $APP_PID"
}

# Main execution
main() {
    case "${1:-}" in
        "check")
            check_and_update
            if [ $? -eq 0 ]; then
                kill_existing
                run_app
            fi
            ;;
        "force-build")
            build_app
            kill_existing
            run_app
            ;;
        "run")
            run_app
            ;;
        "stop")
            kill_existing
            ;;
        "help"|"-h"|"--help")
            echo "Exiled Exchange 2 Auto-Update Script"
            echo ""
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  (no args)    Check for updates and run (default)"
            echo "  check        Only update if new version available"
            echo "  run          Just run the app without updating"
            echo "  stop         Stop the running application"
            echo "  force-build  Force rebuild and run"
            echo "  help         Show this help message"
            echo ""
            echo "Security Configuration:"
            echo "  Set EXILED_SANDBOX_ENABLED=true to enable Electron sandbox (more secure)"
            echo "  Set EXILED_SANDBOX_ENABLED=false to disable sandbox (default, more compatible)"
            echo ""
            echo "Examples:"
            echo "  ./auto-update.sh                           # Check for updates and run"
            echo "  ./auto-update.sh run                       # Run without checking updates"
            echo "  EXILED_SANDBOX_ENABLED=true ./auto-update.sh run  # Run with sandbox enabled"
            ;;
        *)
            # Default: check for updates and run
            check_and_update
            run_app
            ;;
    esac
}

main "$@"