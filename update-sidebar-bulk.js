// Bulk Sidebar Update Script
// This script updates all HTML pages to use the standardized sidebar

const fs = require('fs');
const path = require('path');

const pagesDirectory = '/workspaces/Hospital-opd/pages';
const backupDirectory = `/workspaces/Hospital-opd/backup_${new Date().toISOString().replace(/[:.]/g, '-')}`;

// Create backup directory
if (!fs.existsSync(backupDirectory)) {
    fs.mkdirSync(backupDirectory, { recursive: true });
}

// Pages to update (excluding sidebar.html)
const pagesToUpdate = [
    'registration.html',
    'ipd.html', 
    'lab.html',
    'cashflow.html',
    'patients.html',
    'doctor-master.html',
    'test-master.html'
];

function updatePage(filename) {
    const filePath = path.join(pagesDirectory, filename);
    const backupPath = path.join(backupDirectory, filename);
    
    if (!fs.existsSync(filePath)) {
        console.log(`Warning: ${filename} not found, skipping...`);
        return;
    }
    
    console.log(`Updating ${filename}...`);
    
    // Create backup
    fs.copyFileSync(filePath, backupPath);
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if already updated
    if (content.includes('sidebar-manager.js')) {
        console.log(`  ${filename} already updated, skipping...`);
        return;
    }
    
    // Remove existing sidebar HTML (everything between sidebar div tags)
    content = content.replace(
        /<div class="sidebar"[\s\S]*?<\/div>(?=\s*<!-- Main|<div class="main|$)/,
        '    <!-- Standardized Sidebar will be loaded here -->'
    );
    
    // Add sidebar CSS if not present
    if (!content.includes('sidebar.css')) {
        content = content.replace(
            /<link rel="stylesheet" href="\.\.\/css\/style\.css">/,
            '<link rel="stylesheet" href="../css/style.css">\n    <link rel="stylesheet" href="../css/sidebar.css">'
        );
    }
    
    // Add sidebar manager script before closing body tag
    if (!content.includes('sidebar-manager.js')) {
        content = content.replace(
            /<\/body>/,
            '    <script src="../js/sidebar-manager.js"></script>\n</body>'
        );
    }
    
    // Write updated content
    fs.writeFileSync(filePath, content);
    console.log(`  ✓ ${filename} updated successfully`);
}

// Update all pages
console.log('Starting sidebar standardization...');
console.log(`Backup directory: ${backupDirectory}`);

pagesToUpdate.forEach(updatePage);

console.log('\nSidebar standardization completed!');
console.log('\nUpdated pages:');
pagesToUpdate.forEach(page => {
    console.log(`  - ${page}`);
});

console.log('\nNext steps:');
console.log('1. Test each page to ensure sidebar loads correctly');
console.log('2. Check that navigation works as expected'); 
console.log('3. Verify mobile responsiveness');
console.log('4. Remove backup files if everything works correctly');
