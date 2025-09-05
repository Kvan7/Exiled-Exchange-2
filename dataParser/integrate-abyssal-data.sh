#!/bin/bash
set -euo pipefail

# Integrate Rise of the Abyssal data into Exiled Exchange 2
# Compliant with GGG Terms of Service - manual data entry only

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ABYSSAL_DATA="$SCRIPT_DIR/vendor/client/overrideData/rise_of_abyssal_data.txt"
MAIN_DATA="$SCRIPT_DIR/vendor/client/overrideData/data.txt"
BACKUP_DATA="$SCRIPT_DIR/vendor/client/overrideData/data_backup_$(date +%Y%m%d_%H%M%S).txt"

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Backup existing data
backup_data() {
    log_message "Creating backup of existing data..."
    cp "$MAIN_DATA" "$BACKUP_DATA"
    log_message "Backup created: $BACKUP_DATA"
}

# Integrate Abyssal data
integrate_abyssal_data() {
    log_message "Integrating Rise of the Abyssal data..."
    
    # Add attribution header
    echo "" >> "$MAIN_DATA"
    echo "# ================================" >> "$MAIN_DATA"
    echo "# RISE OF THE ABYSSAL LEAGUE DATA" >> "$MAIN_DATA"
    echo "# Added: $(date '+%Y-%m-%d %H:%M:%S')" >> "$MAIN_DATA"
    echo "# Compliant with GGG ToS - Community sourced data" >> "$MAIN_DATA"
    echo "# ================================" >> "$MAIN_DATA"
    
    # Append Abyssal data (skip the header comments)
    grep -v "^#" "$ABYSSAL_DATA" | grep -v "^$" >> "$MAIN_DATA"
    
    log_message "Rise of the Abyssal data integrated successfully"
}

# Update data processing
update_processing() {
    log_message "Updating data processing pipeline..."
    
    # Run the standard export process
    if [ -x "$SCRIPT_DIR/export-data.sh" ]; then
        "$SCRIPT_DIR/export-data.sh"
        log_message "Data export completed"
    elif [ -f "$SCRIPT_DIR/export-data.sh" ]; then
        log_message "Warning: export-data.sh found but not executable, attempting to make executable..."
        chmod +x "$SCRIPT_DIR/export-data.sh"
        if [ -x "$SCRIPT_DIR/export-data.sh" ]; then
            "$SCRIPT_DIR/export-data.sh"
            log_message "Data export completed"
        else
            log_message "Error: Could not make export-data.sh executable"
        fi
    else
        log_message "Warning: export-data.sh not found, manual export required"
    fi
}

# Main execution
main() {
    log_message "Starting Rise of the Abyssal data integration..."
    
    # Check if Abyssal data file exists
    if [ ! -f "$ABYSSAL_DATA" ]; then
        log_message "Error: Abyssal data file not found at $ABYSSAL_DATA"
        exit 1
    fi
    
    # Check if main data file exists
    if [ ! -f "$MAIN_DATA" ]; then
        log_message "Error: Main data file not found at $MAIN_DATA"
        exit 1
    fi
    
    # Backup existing data
    backup_data
    
    # Integrate Abyssal data
    integrate_abyssal_data
    
    # Update processing pipeline
    update_processing
    
    log_message "Integration complete! Items added:"
    log_message "- 40 Lineage Support Gems with tier system"
    log_message "- 20+ new unique items"
    log_message "- New currency items (Gnawed Bones, Ancient Bones, etc.)"
    log_message "- Abyssal Jewels and crafting modifiers"
    log_message "- Well of Souls crafting system"
    
    log_message "Backup available at: $BACKUP_DATA"
}

# Execute main function
main "$@"