```markdown
# Hospital OPD Management System

This repository contains a complete Hospital OPD Management System with modules for patient registration, OPD, appointments, laboratory, IPD management (with detailed bed visualization and discharge process), cash flow management, and reports & analytics.

## Project Structure

##
Hospital-opd/
├── css/
│   ├── style.css               # Common styles for the entire application
│   ├── ipd.css                 # Styles for IPD management page and modals
│   ├── cashflow.css            # Styles for Cash Flow Management
│   ├── lab.css                 # Styles for Laboratory Management
│   └── bed-visualization.css   # Styles for the interactive bed visualization in IPD
├── js/
│   ├── main.js                 # Main JavaScript file (sidebar, header, global utilities)
│   ├── registration.js         # Patient Registration module scripts
│   ├── patients.js             # OPD Patient List & related functionalities
│   ├── lab.js                  # Laboratory Management module scripts
│   ├── cashflow.js             # Cash Flow Management scripts (income, expense, charts)
│   ├── ipd.js                  # IPD Management scripts: admissions, bed management, patient view
│   ├── ipd-billing.js          # Detailed Billing Module for IPD (charges, payments, final bill)
│   ├── ipd-discharge.js        # Discharge Process scripts for updating status and printing summaries
│   └── bed-visualization.js    # Script for interactive ward bed visualization (hover details, status updates)
├── pages/
│   ├── index.html              # Main landing page with sidebar navigation
│   ├── dashboard.html          # Dashboard page (overview, stats)
│   ├── registration.html       # Patient Registration page
│   ├── opd.html                # Outpatient (OPD) module page
│   ├── appointments.html       # Appointment Scheduling page
│   ├── lab.html                # Laboratory Management page
│   ├── ipd.html                # IPD Management page (integrated with bed visualization)
│   ├── cashflow.html           # Cash Flow Management page
│   └── reports.html            # Reports & Analytics page
└── README.md                   # This README file with project details and hosting instructions


## Hosting Instructions

1. **Requirements**
   - A web server or hosting platform capable of serving static files.
   - Options include:
     - [Apache HTTP Server](https://httpd.apache.org/)
     - [Nginx](https://www.nginx.com/)
     - [Node.js http-server](https://www.npmjs.com/package/http-server)
     - Hosting platforms like [GitHub Pages](https://pages.github.com/), [Netlify](https://www.netlify.com/), or [Vercel](https://vercel.com/).

2. **Setup**
   - Clone or download this repository into your web server's root directory.
   - Preserve the folder structure as shown above, ensuring that relative paths for CSS, JavaScript, and page links work correctly.

3. **Running Locally via Node.js**
   - Install [Node.js](https://nodejs.org/) if not already installed.
   - Open your terminal or command prompt.
   - Navigate to the project directory:
     ```
     cd path/to/Hospital-opd
     ```
   - Install http-server (globally or locally):
     ```
     npm install -g http-server
     ```
   - Start the server:
     ```
     http-server -c-1
     ```
   - Open your browser and go to the URL provided by the http-server (usually `http://localhost:8080`).

4. **Deploying on GitHub Pages**
   - Push the repository to GitHub.
   - Go to the repository settings.
   - Scroll down to the **GitHub Pages** section.
   - Set the source to the root (or /docs directory if you prefer).
   - Save and access your hosted site via the URL provided.

5. **Notes**
   - All internal links in HTML pages (CSS and JavaScript file references) are relative. Ensure they remain intact when deploying.
   - If using client-side routing, configure your server to serve `index.html` as a fallback.
   - Check the browser console for any resource loading errors and adjust file paths accordingly.

## Overview

The system includes the following main modules:

- **Patient Registration:** Manage patient details and generate unique UHIDs.
- **OPD Module:** Register and track outpatient information.
- **Appointments:** Schedule, view, and manage appointments.
- **Laboratory Management:** Request lab tests, select tests from a categorized catalog with dynamic pricing, and record results.
- **IPD Management:** 
  - **Admissions:** Admit patients, select appropriate beds, and integrate with bed management.  
  - **Bed Visualization:** Interactive ward-wise display of beds, using color codes (red for occupied, green for available). Hovering over an occupied bed shows basic details about the occupant and their IPD details.
  - **Billing:** Detailed billing module to calculate charges, track payments, and generate final summaries.
  - **Discharge Process:** Process patient discharge, update bed status, and print a detailed discharge summary including billing information.
- **Cash Flow Management:** Track income and expenses with charts and summary cards.
- **Reports & Analytics:** Generate and view reports across the system.

By following these instructions and examining the file structure, you can deploy and further develop the Hospital OPD Management System.
