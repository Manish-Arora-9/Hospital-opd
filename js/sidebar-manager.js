// Sidebar Integration Module
// This module handles the standardized sidebar functionality across all pages

class SidebarManager {
    constructor() {
        this.currentPage = this.getCurrentPageName();
        this.sidebarSections = new Map();
        this.init();
    }

    getCurrentPageName() {
        const path = window.location.pathname;
        const filename = path.split('/').pop();
        return filename.replace('.html', '') || 'index';
    }

    async init() {
        // Check if sidebar already exists in HTML
        const existingSidebar = document.getElementById('sidebar');
        if (existingSidebar) {
            // Use existing sidebar, just initialize functionality
            this.setupEventListeners();
            this.initializeSections();
            this.setActivePage();
            this.loadSidebarState();
            this.adjustMainContent();
        } else {
            // Load sidebar from external file
            await this.loadSidebar();
            this.setupEventListeners();
            this.initializeSections();
            this.setActivePage();
            this.loadSidebarState();
        }
    }

    async loadSidebar() {
        try {
            // Try multiple potential paths for the sidebar
            const possiblePaths = [
                './sidebar.html',           // Same directory
                '../pages/sidebar.html',    // From js folder to pages
                './pages/sidebar.html',     // From root to pages
                '/pages/sidebar.html'       // Absolute path from root
            ];
            
            let sidebarContent = null;
            
            for (const path of possiblePaths) {
                try {
                    const response = await fetch(path);
                    if (response.ok) {
                        sidebarContent = await response.text();
                        break;
                    }
                } catch (e) {
                    // Continue to next path
                }
            }
            
            if (sidebarContent) {
                this.insertSidebar(sidebarContent);
            } else {
                throw new Error('Sidebar not found in any expected location');
            }
        } catch (error) {
            console.error('Failed to load sidebar:', error);
            this.createFallbackSidebar();
        }
    }

    insertSidebar(html) {
        // Check if sidebar already exists
        if (document.getElementById('sidebar')) {
            return;
        }

        // Create sidebar container
        const sidebarContainer = document.createElement('div');
        sidebarContainer.innerHTML = html;
        
        // Insert at the beginning of body
        document.body.insertBefore(sidebarContainer.firstElementChild, document.body.firstChild);
        
        // Ensure main content has proper margin
        this.adjustMainContent();
        
        // Setup event listeners after sidebar is inserted
        this.setupEventListeners();
        this.initializeSections();
    }

    createFallbackSidebar() {
        if (document.getElementById('sidebar')) {
            return;
        }

        const fallbackSidebar = `
            <div class="sidebar" id="sidebar">
                <button id="toggleSidebar" class="toggle-btn">
                    <i class="fas fa-bars"></i>
                </button>
                <div class="sidebar-header">
                    <h2>BTL</h2>
                    <p class="h2">Charitale Hospital</p>
                </div>
                <nav class="sidebar-nav">
                    <!-- Main Section -->
                    <div class="nav-section" data-section="main">
                        <h3 class="nav-section-header">
                            <i class="fas fa-chevron-down section-toggle"></i>
                            Main
                        </h3>
                        <div class="nav-section-content">
                            <a href="../index.html" class="nav-item" data-page="index">
                                <i class="fas fa-home"></i>
                                <span>Dashboard</span>
                            </a>
                        </div>
                    </div>

                    <!-- Patient Care Section -->
                    <div class="nav-section" data-section="patient-care">
                        <h3 class="nav-section-header">
                            <i class="fas fa-chevron-down section-toggle"></i>
                            Patient Care
                        </h3>
                        <div class="nav-section-content">
                            <a href="registration.html" class="nav-item" data-page="registration">
                                <i class="fas fa-user-plus"></i>
                                <span>Registration</span>
                            </a>
                            <a href="opd.html" class="nav-item" data-page="opd">
                                <i class="fas fa-stethoscope"></i>
                                <span>OPD</span>
                            </a>
                            <a href="ipd.html" class="nav-item" data-page="ipd">
                                <i class="fas fa-bed"></i>
                                <span>IPD</span>
                            </a>
                            <a href="patients.html" class="nav-item" data-page="patients">
                                <i class="fas fa-users"></i>
                                <span>Patient List</span>
                            </a>
                        </div>
                    </div>

                    <!-- Services Section -->
                    <div class="nav-section" data-section="services">
                        <h3 class="nav-section-header">
                            <i class="fas fa-chevron-down section-toggle"></i>
                            Services
                        </h3>
                        <div class="nav-section-content">
                            <a href="lab.html" class="nav-item" data-page="lab">
                                <i class="fas fa-flask"></i>
                                <span>Lab Tests</span>
                            </a>
                        </div>
                    </div>

                    <!-- Masters Section -->
                    <div class="nav-section" data-section="masters">
                        <h3 class="nav-section-header">
                            <i class="fas fa-chevron-down section-toggle"></i>
                            Masters
                        </h3>
                        <div class="nav-section-content">
                            <a href="patient-master.html" class="nav-item" data-page="patient-master">
                                <i class="fas fa-users"></i>
                                <span>Patient Master</span>
                            </a>
                            <a href="doctor-master.html" class="nav-item" data-page="doctor-master">
                                <i class="fas fa-user-md"></i>
                                <span>Doctor Master</span>
                            </a>
                            <a href="staff-master-page.html" class="nav-item" data-page="staff-master-page">
                                <i class="fas fa-user-md"></i>
                                <span>staff master/span>
                            </a>
                            <a href="test-master.html" class="nav-item" data-page="test-master">
                                <i class="fas fa-vial"></i>
                                <span>Test Master</span>
                            </a>
                        </div>
                    </div>

                    <!-- Finance Section -->
                    <div class="nav-section" data-section="finance">
                        <h3 class="nav-section-header">
                            <i class="fas fa-chevron-down section-toggle"></i>
                            Finance
                        </h3>
                        <div class="nav-section-content">
                            <a href="cashflow.html" class="nav-item" data-page="cashflow">
                                <i class="fas fa-money-bill-wave"></i>
                                <span>Cash Flow</span>
                            </a>
                        </div>
                    </div>

                    <!-- Reports Section -->
                    <div class="nav-section" data-section="reports">
                        <h3 class="nav-section-header">
                            <i class="fas fa-chevron-down section-toggle"></i>
                            Reports
                        </h3>
                        <div class="nav-section-content">
                            <a href="analytics.html" class="nav-item" data-page="analytics">
                                <i class="fas fa-chart-bar"></i>
                                <span>Analytics</span>
                            </a>
                        </div>
                    </div>
                </nav>
            </div>
        `;
        
        const container = document.createElement('div');
        container.innerHTML = fallbackSidebar;
        document.body.insertBefore(container.firstElementChild, document.body.firstChild);
        this.adjustMainContent();
        
        // Setup event listeners after sidebar is inserted
        this.setupEventListeners();
        this.initializeSections();
    }

    adjustMainContent() {
        const mainContent = document.querySelector('.main-content') || 
                           document.querySelector('#mainContent') || 
                           document.querySelector('main') ||
                           document.querySelector('.content');
        
        if (mainContent) {
            mainContent.style.marginLeft = '280px';
            mainContent.style.transition = 'margin-left 0.3s ease';
        }
    }

    setupEventListeners() {
        // Remove any existing listeners first to prevent duplicates
        document.querySelectorAll('.nav-section-header').forEach(header => {
            const newHeader = header.cloneNode(true);
            header.parentNode.replaceChild(newHeader, header);
        });

        // Toggle sidebar button
        const toggleBtn = document.getElementById('toggleSidebar');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleSidebar());
        }

        // Mobile menu button
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => this.toggleSidebar());
        }

        // Remove any existing onclick handlers and add proper event listeners
        document.querySelectorAll('.nav-section-header').forEach(header => {
            // Remove the inline onclick attribute to avoid conflicts
            header.removeAttribute('onclick');
            
            // Add event listener for section toggling
            header.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const section = header.closest('.nav-section');
                if (section) {
                    const sectionName = section.dataset.section;
                    if (sectionName) {
                        this.toggleSection(sectionName);
                    }
                }
            });
            
            // Add cursor pointer style
            header.style.cursor = 'pointer';
        });

        // Close sidebar on mobile when clicking outside
        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('sidebar');
            const isMobile = window.innerWidth <= 768;
            
            if (isMobile && sidebar && !sidebar.contains(e.target) && 
                !e.target.closest('#mobileMenuBtn') && !e.target.closest('#toggleSidebar')) {
                sidebar.classList.remove('active');
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
    }

    initializeSections() {
        const sections = document.querySelectorAll('.nav-section');
        
        sections.forEach(section => {
            const sectionName = section.dataset.section;
            const header = section.querySelector('.nav-section-header');
            const content = section.querySelector('.nav-section-content');
            
            if (sectionName && header && content) {
                this.sidebarSections.set(sectionName, {
                    element: section,
                    header: header,
                    content: content,
                    isExpanded: false
                });
            }
        });
    }

    toggleSection(sectionName) {
        const section = this.sidebarSections.get(sectionName);
        if (!section) {
            return;
        }

        const isExpanded = section.content.classList.contains('expanded');
        const toggle = section.header.querySelector('.section-toggle');

        if (isExpanded) {
            section.content.classList.remove('expanded');
            if (toggle) toggle.style.transform = 'rotate(0deg)';
            section.isExpanded = false;
        } else {
            section.content.classList.add('expanded');
            if (toggle) toggle.style.transform = 'rotate(180deg)';
            section.isExpanded = true;
        }

        this.saveSidebarState();
    }

    setActivePage() {
        // Remove active class from all nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        // Add active class to current page
        const activeItem = document.querySelector(`[data-page="${this.currentPage}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
            
            // Expand the section containing the active item
            const section = activeItem.closest('.nav-section');
            if (section) {
                const sectionName = section.dataset.section;
                const sectionData = this.sidebarSections.get(sectionName);
                if (sectionData && !sectionData.isExpanded) {
                    this.toggleSection(sectionName);
                }
            }
        }
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.querySelector('.main-content') || 
                           document.querySelector('#mainContent');
        
        if (sidebar) {
            const isMobile = window.innerWidth <= 768;
            
            if (isMobile) {
                sidebar.classList.toggle('active');
            } else {
                const isCollapsed = sidebar.classList.contains('collapsed');
                
                if (isCollapsed) {
                    sidebar.classList.remove('collapsed');
                    if (mainContent) {
                        mainContent.style.marginLeft = '280px';
                    }
                } else {
                    sidebar.classList.add('collapsed');
                    if (mainContent) {
                        mainContent.style.marginLeft = '60px';
                    }
                }
            }
        }
    }

    handleResize() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.querySelector('.main-content') || 
                           document.querySelector('#mainContent');
        const isMobile = window.innerWidth <= 768;

        if (sidebar && mainContent) {
            if (isMobile) {
                sidebar.classList.remove('collapsed');
                mainContent.style.marginLeft = '0';
            } else {
                const isCollapsed = sidebar.classList.contains('collapsed');
                mainContent.style.marginLeft = isCollapsed ? '60px' : '280px';
            }
        }
    }

    saveSidebarState() {
        const state = {};
        this.sidebarSections.forEach((section, name) => {
            state[name] = section.isExpanded;
        });
        localStorage.setItem('sidebarState', JSON.stringify(state));
    }

    loadSidebarState() {
        try {
            const savedState = localStorage.getItem('sidebarState');
            if (savedState) {
                const state = JSON.parse(savedState);
                Object.entries(state).forEach(([sectionName, isExpanded]) => {
                    const section = this.sidebarSections.get(sectionName);
                    if (section && isExpanded && !section.isExpanded) {
                        this.toggleSection(sectionName);
                    }
                });
            } else {
                // Default: expand the section containing the current page
                this.expandCurrentPageSection();
            }
        } catch (error) {
            console.error('Failed to load sidebar state:', error);
            this.expandCurrentPageSection();
        }
    }

    expandCurrentPageSection() {
        const activeItem = document.querySelector(`[data-page="${this.currentPage}"]`);
        if (activeItem) {
            const section = activeItem.closest('.nav-section');
            if (section) {
                const sectionName = section.dataset.section;
                this.toggleSection(sectionName);
            }
        }
    }
}

// Auto-initialize sidebar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if sidebar manager doesn't already exist
    if (!window.sidebarManager) {
        window.sidebarManager = new SidebarManager();
    }
    
    // Set up the global toggleSection function after DOM is ready
    // This ensures it's set after all scripts have loaded
    setTimeout(() => {
        window.toggleSection = function(sectionName) {
            if (window.sidebarManager) {
                window.sidebarManager.toggleSection(sectionName);
            } else {
                // Fallback if sidebarManager not ready yet
                console.warn('SidebarManager not initialized yet');
            }
        };
    }, 10);
});

// Export for manual initialization if needed
window.SidebarManager = SidebarManager;
