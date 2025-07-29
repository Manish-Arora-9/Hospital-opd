#!/bin/bash

# Script to update all HTML pages to use the standardized sidebar
# This script removes old sidebar code and integrates the new sidebar manager

echo "Starting sidebar standardization process..."

# List of pages to update (excluding sidebar.html itself)
pages=(
    "registration.html"
    "ipd.html"
    "lab.html"
    "cashflow.html"
    "patients.html"
    "patient-master.html"
    "doctor-master.html"
    "test-master.html"
)

# Directory path
pages_dir="/workspaces/Hospital-opd/pages"

# Backup directory
backup_dir="/workspaces/Hospital-opd/backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$backup_dir"

echo "Creating backup in $backup_dir..."

# Function to update a single page
update_page() {
    local page=$1
    local page_path="$pages_dir/$page"
    
    if [ ! -f "$page_path" ]; then
        echo "Warning: $page not found, skipping..."
        return
    fi
    
    echo "Updating $page..."
    
    # Create backup
    cp "$page_path" "$backup_dir/"
    
    # Get the page name for CSS and JS references
    local page_name=$(basename "$page" .html)
    
    # Read the current file
    local content=$(cat "$page_path")
    
    # Check if already using sidebar manager
    if grep -q "sidebar-manager.js" "$page_path"; then
        echo "  $page already uses sidebar manager, skipping..."
        return
    fi
    
    # Create temporary file for processing
    local temp_file=$(mktemp)
    
    # Process the file with sed to remove old sidebar and add new structure
    sed '
    # Remove existing sidebar div and its content
    /<div class="sidebar"/,/<\/div>/d
    
    # Add sidebar CSS if not present
    /<link rel="stylesheet" href="\.\.\/css\/style\.css">/a\
    <link rel="stylesheet" href="../css/sidebar.css">
    
    # Add sidebar manager script before closing body tag
    /<\/body>/i\
    <script src="../js/sidebar-manager.js"></script>
    ' "$page_path" > "$temp_file"
    
    # Move temp file back to original
    mv "$temp_file" "$page_path"
    
    echo "  ✓ $page updated successfully"
}

# Update each page
for page in "${pages[@]}"; do
    update_page "$page"
done

echo ""
echo "Sidebar standardization completed!"
echo "Backup created in: $backup_dir"
echo ""
echo "Next steps:"
echo "1. Test each page to ensure sidebar loads correctly"
echo "2. Check that navigation works as expected"
echo "3. Verify mobile responsiveness"
echo "4. Update any custom sidebar styling if needed"
