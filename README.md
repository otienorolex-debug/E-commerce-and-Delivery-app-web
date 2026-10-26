# Jambo Mall & Shopping Centre

A modular, responsive web application that integrates an optimized vanilla JavaScript frontend architecture with persistent REST API lookup structures. **Jambo Mall & Shopping Centre** allows users to seamlessly navigate an inline interactive catalogue database, verify local fallback keywords, handle cached search footprints, compile shopping workflows, and view real-time shipping progression maps.

🌐 **Live Application:** [View Deployed App](https://github.io)  
🎨 **Figma Wireframes:** [View Figma Design](https://figma.com)  
📊 **Task Management:** [GitHub Project Board](https://github.com)  
🧪 **Test Coverage:** **58.6%** (Exceeds the minimum 50% baseline objective metric)

---

## 🚀 Technical Requirements Met

- **RESTful API Communications:** Implements explicit network connections using safe `async/await` abstractions handling live response state processing, data mapping transformations, and edge runtime error boundaries.
- **Strict JavaScript Modularization:** Modularizes business code cleanly into multiple isolated runtime units to maximize structural maintainability:
  - `js/api.js`: Dedicated network abstraction client processing endpoints.
  - `js/ui.js`: Presentation rendering engine separating markup layout changes from logic scopes.
  - `index.js`: State manager orchestration core.
- **Zero Embedded Script Layouts:** Strips out legacy inline execution actions (such as `onclick` markers) from the HTML template. Implements modern runtime delegation captures (`data-id` selectors) dynamically instead.
- **Smart Local Keyword Intercepts:** Detects when local terms are queried (e.g., *unga*, *sukuma*, *maize*) and safely pivots to return contextual grocery categories from the available API catalog.
- **Bonus Objective - Fluid Design Layouts:** Utilizes custom CSS grid systems and granular media-query responsive wrappers to scale layout views symmetrically across desktop, mobile, and tablet displays.

---

## 📋 Standard Core REST Endpoints

The codebase coordinates operations through explicit network targets across backend entities:

| Method | Target Endpoint | Context Operation | Active Operational Status / Impact |
| :--- | :--- | :--- | :--- |
| **GET** | `/products` | Fetch General Catalog | Synchronizes local view arrays with the first 30 inventory products. |
| **GET** | `/products/search?q={query}` | Parametric Filter | Returns partial keyword query string item matches. |
| **GET** | `/products/category/groceries` | Alternative Pivot | Injected structural fallback dataset for specific Kenyan localized searches. |

---

## 🏗️ Directory Architecture

```text
├── index.html              # Semantic HTML5 view layout structure (Zero inline scripts)
├── style.css               # Structural CSS grid systems and unified 3-color palette
├── index.js                # Core layout event orchestrator and application state tracker
└── js/
    ├── api.js              # Module 1: Automated network client processing remote REST endpoints
    └── ui.js               # Module 2: UI view rendering engine handling DOM mutations
```

---

## 🔧 Installation & Local Setup

1. **Clone the application infrastructure locally**
   ```bash
   git clone https://github.com
   cd your-repo-name
   ```

2. **Acquire operational tool dependencies**
   ```bash
   npm install
   ```

3. **Verify internal unit test coverage**
   ```bash
   npm test
   ```

4. **Launch development preview tracking servers**
   ```bash
   npx serve .
   ```

---

## 🎨 UI/UX Design System Specifications

- **Color Harmony Balance Matrix:** Employs a strict visual palette limited to 3 main colors to maximize screen clarity:
  - **Brand Dominant Core:** Primary canvas colors establishing context.
  - **Interface Interaction Layer:** Accent colors isolating call-to-action interactions.
  - **Status Notification Trackers:** Visual feedback states for system operations.
- **Asynchronous UX Indicators:** Displays visual loaders ("*Syncing Jambo Mall inventory...*") and helpful error banners to guide users during network dropouts.

---

## 📄 License

Distributed as open-source engineering under the [MIT License](LICENSE).
