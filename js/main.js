// Global constants
const UTC_FORMAT = { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false
};

// Initialize main application
document.addEventListener('DOMContentLoaded', function() {
    initializeSidebar();
    updateDateTime();
    setInterval(updateDateTime, 1000);
});

// Update date time display
function updateDateTime() {
    const now = new Date();
    const formatted = now.toLocaleString('en-US', UTC_FORMAT)
        .replace(',', '')
        .replace(/(\d+)\/(\d+)\/(\d+)/, '$3-$1-$2');
    document.getElementById('currentDateTime').textContent = formatted;
}

// Sidebar functionality
function initializeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const toggleBtn = document.getElementById('toggleSidebar');

    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');
    });

    // Active page highlighting
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.dataset.page === currentPage) {
            item.classList.add('active');
        }
    });
}