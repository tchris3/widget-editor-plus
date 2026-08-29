# Widget Editor+

Widget Editor+ is a development and diagnostics suite for ServiceNow Service Portal developers. It replaces the standard widget editor with one built around the Microsoft Monaco Editor and ServiceNow-specific IntelliSense, alongside dedicated tools for version diffing (**Compare+**), runtime portal diagnostics (**Debug Context Menu**), and AI context extraction (**Widget Editor+ Assistant**).

> **Zero External Dependencies**: Built entirely with native ServiceNow platform capabilities. All editor functionality, language tooling, and diagnostics rely strictly on libraries already present within the ServiceNow platform (Monaco Editor, AngularJS, Bootstrap, and standard ServiceNow client/server APIs).

---

## Table of Contents
- [Core Components](#core-components)
  - [1. Widget Editor+](#1-widget-editor)
  - [2. Compare+](#2-compare)
  - [3. Debug Context Menu](#3-debug-context-menu)
  - [4. Widget Editor+ Assistant](#4-widget-editor-assistant)
- [Installation & Deployment](#installation--deployment)
  - [Prerequisites](#prerequisites)
  - [Build with ServiceNow SDK](#build-with-servicenow-sdk)
  - [Direct Deployment](#direct-deployment)
- [End-to-End Testing](#end-to-end-testing)
- [Configuration](#configuration)
  - [System Properties](#system-properties)
  - [UI Scripts Reference](#ui-scripts-reference)
  - [User Preferences](#user-preferences)
- [AI Disclosure](#ai-disclosure)

---

## Core Components

| Component | Purpose |
|---|---|
| **Widget Editor+** | Monaco-powered IDE for Service Portal widgets, with ServiceNow client/server IntelliSense |
| **Compare+** | Side-by-side Monaco diff viewer, including a condition-builder diff |
| **Debug Context Menu** | Runtime diagnostics overlay on live Service Portal pages |
| **Widget Editor+ Assistant** | AI-ready XML context bundle exporter and dependency traversal engine |

---

### 1. Widget Editor+

A full-featured IDE for Service Portal widgets that replaces the standard editor experience with rich language intelligence and developer conveniences.

- **Monaco Multi-Pane Editor**: Edit HTML Templates, CSS/SCSS, Client Controllers, Server Scripts, Link Functions, Option Schemas, and Demo Data within high-performance Monaco editor panes.
- **Intelligent ServiceNow IntelliSense**:
  - **Client-Side Autocomplete**: Full autocompletion and hover documentation for `g_form`, `g_user`, `spUtil`, and AngularJS core services (`$scope`, `$http`, `$q`, `$timeout`, `$interval`, `$location`).
  - **Dynamic Controller Injection**: Injected AngularJS dependencies in `api.controller` are resolved and typed dynamically by parameter name in any order.
  - **Server-Side Autocomplete**: Comprehensive API completions for `GlideRecord`, `GlideRecordSecure`, and `$sp`.
  - **Table Schema & Inheritance Completion**: Field autocompletions recursively traverse extended table hierarchies (e.g. `incident` inheriting from `task`).
  - **Script Include Dot-Walking**: Live dot-walk autocompletion and JSDoc type inference across Script Includes, including PrototypeJS methods and `this.property` assignments.
  - **Native JSDoc `@typedef` Support**: Type inference and code completion for custom widget data models defined via JSDoc annotations.
  - **HTML Class-Name Completion**: `class="..."` completions sourced from the user's chosen portal/theme's own compiled CSS bundles, cached client-side and refreshed only when a bundle's `Last-Modified` header changes.
  - **Angular Provider Directive IntelliSense**: `data-<prop>` completions, hover docs, and AngularJS expression validation for a linked directive's `scope` bindings, parsed from the provider's own script (JSDoc comments above each scope property become the hover documentation).
- **AngularJS Expression Validation & Highlighting**:
  - Real-time syntax checking on `{{ }}` interpolations and `ng-*` directive expressions using AngularJS `$parse`.
  - Rich token syntax highlighting for embedded Angular expressions within HTML templates.
- **Productivity & Safety Tools**:
  - **Per-Field Saving**: Save individual widget scripts (e.g. only the Server Script) independently without updating unchanged fields.
  - **Angular Provider Scaffolding**: Automatically inserts boilerplate starter code when creating Directives, Factories, or Services.
  - **Demo Data Editor**: Built-in JSON editor modal with real-time JSON syntax validation.
  - **Real-Time Presence**: Live indicators showing other developers currently viewing or editing the same widget.
  - **SN Utils Integration**: Direct "Open in VS Code" button integration for users with the SN Utils browser extension.
  - **Fast Navigation**: Infinite-scrolling widget picker with search match highlighting and recent widget history.

---

### 2. Compare+

A purpose-built version comparison and merge inspection tool (`widget_editor_diff.do`) available directly within the editor, via the Debug Context Menu, or as a list action on `sys_update_version` records.

- **Monaco Code Diff Viewer**: Side-by-side Monaco diff inspection across all widget fields with synchronised scrolling and line-change badges.
- **Visual Condition Builder Diff**: Side-by-side comparison for encoded condition queries, resolving raw query strings into human-readable field labels and condition statements.
- **Display Value Resolution**: Automatically resolves reference values and `glide_list` fields into human-readable display values with sys_id tooltips.
- **Composite-Key Target Support**: Accurately resolves version targets from XML update payloads for composite-keyed records (e.g. `sys_dictionary`).

---

### 3. Debug Context Menu

A non-intrusive runtime diagnostic popover (`sp_widget_widget_editor_debug_menu`) embedded directly into Service Portal pages, accessible via **Ctrl + Right-Click** on any widget instance.

- **Hierarchy & Navigation**:
  - **Widget Hierarchy**: Drill down through nested and embedded widget trees to pinpoint child components.
  - **Quick Editor Switching**: Seamlessly jump to Widget Editor+, ServiceNow Widget Editor, Compare+, Page in Designer, Page Editor, or the backend platform record.
  - **Portal Navigation**: Smart URL resolution for opening widgets in their parent portal pages with interactive parameter prompts for widgets that read URL query strings (`$sp.getParameter`).
- **Runtime Performance & Diagnostics**:
  - **Generation-Time Indicators**: Visual latency indicators showing server generation time on widget rows with instant hover tooltips.
  - **Console Debugging**: Log widget `$scope`, `$scope.data`, or `$rootScope` directly to the browser console, or expose `$scope` globally on `window` for live debugging.
  - **Instance Customisation Checks**: Visual indicators highlighting whether an instance is customized or out-of-the-box, with inline editing for container background properties and options schemas.
- **User Preference Controls**: Three-state toggle (**Enhanced / Standard / Off**) configurable from within the Widget Editor+ User Preferences modal.

---

### 4. Widget Editor+ Assistant

An AI context bundle exporter (`widget_editor_assistant.do`) available as a standalone tool and embedded directly within Widget Editor+. It solves the challenge of exporting complex, interconnected ServiceNow application records into structured XML context for Large Language Models (ChatGPT, Claude, Gemini, Copilot).

- **Automated Dependency Detection**:
  - **Service Portal Pages (`sp_page`)**: Traverses complete page layout trees (`sp_container` → `sp_row` → `sp_column` → `sp_instance` → `sp_widget`).
  - **Widgets (`sp_widget`)**: Scans scripts and templates for referenced Script Includes, Tables, Angular Templates (`sp_ng_template`), Angular Providers (`sp_angular_provider`), and embedded directives (`<sp-widget>`).
  - **Server-Side Scripts**: Unified dependency resolution across Script Includes, Business Rules, Fix Scripts, and Scheduled Script Executions.
  - **Record Producers (`sc_cat_item_producer`)**: Detects catalog variables (`item_option_new`), catalog UI policies, catalog client scripts, and target table definitions.
  - **Notifications (`sysevent_email_action`)**: Identifies `${mail_script:Name}` tags and resolves referenced Mail Scripts (`sys_script_email`).
  - **Tables (`sys_db_object`)**: Scans dictionary reference fields to resolve related table schemas (`?SCHEMA`).
- **Extensible Relationship Engine**: Admin-configurable relationship rules defined through `monaco.plus.assistant.table_config.<table>` system properties.
- **Favourites & Bundles**: Save and group frequently referenced record sets with user preference persistence and JSON export/import.
- **Live Token Estimation**: Real-time token count estimation based on payload size with progress animations.
- **Security Guardrails**: Table search blocklists, credential table withholding, and automated password redaction.

---

## Installation & Deployment

### Prerequisites
- Node.js (v18 or higher recommended)
- ServiceNow SDK (`@servicenow/sdk`)
- A ServiceNow instance to deploy to

### Build with ServiceNow SDK
1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/tchris3/widget-editor-plus.git
   cd widget-editor-plus
   npm install
   ```
2. Build the Fluent source definitions into update set XML:
   ```bash
   npm run build
   ```
   The compiled metadata is output to the `dist/app/` directory.

### Direct Deployment
Deploy the application directly to your configured ServiceNow instance:
```bash
npm run deploy
```
*(This executes `now-sdk install` to authenticate and apply the application package to the target instance).*

Alternatively, deploy the retrieved update set XML artifact located in the latest [GitHub Release](https://github.com/tchris3/widget-editor-plus/releases) via **System Update Sets → Retrieved Update Sets**.

---

## End-to-End Testing

Widget Editor+ features a comprehensive Playwright test suite validating editor features, language services, and context menus against a live ServiceNow instance.

1. Create a local `.env` configuration:
   ```bash
   cp .env.example .env
   ```
2. Set your instance credentials:
   ```env
   SN_INSTANCE_URL=https://devXXXXX.service-now.com
   SN_USERNAME=admin
   SN_PASSWORD=your_pdi_password
   SN_PORTAL_SUFFIX=sp
   ```
3. Install browser binaries and run the tests:
   ```bash
   npx playwright install
   npm run test:e2e        # Headless mode
   npm run test:e2e:ui     # Interactive UI runner
   ```

*Note: Test fixtures automatically seed and tear down necessary test records via the ServiceNow Table API.*

---

## Configuration

### System Properties
All system properties are managed under the `monaco.plus.*` namespace:

| Property Name | Default | Description |
|---|---|---|
| `monaco.plus.record_limit` | `500` | Page size for record pickers (widgets, versions, providers, dependencies) with infinite scroll. |
| `monaco.plus.widget.fields` | *(empty)* | Comma-separated list of additional fields on `sp_widget` to display inside Widget Editor+. |
| `monaco.plus.widget.deprecated` | `descriptionLIKEdeprecated` | Encoded query string evaluated against `sp_widget` to flag widgets as deprecated. |
| `monaco.plus.widget.related_list_exclusions` | *(empty)* | Comma-separated list of `sys_ui_related_list_entry.related_list` values to exclude from related lists. |
| `monaco.plus.css.variables` | `{ "example-variable": "#a4c5ea" }` | JSON string of CSS custom property name-value pairs for autocomplete suggestions. |
| `monaco.plus.scss.variables` | `{ "$breakpoint-xs": "480px", ... }` | JSON string of SCSS variable name-value pairs for autocomplete suggestions. |
| `monaco.plus.assistant.export_blocklist_tables` | *(credential & audit tables)* | Comma-separated table names excluded from Assistant search, browsing, and XML export. |
| `monaco.plus.assistant.export_blocklist_prefixes` | `pwd,sys_activity,sys_amb,...` | Comma-separated table prefixes excluded from Assistant search, browsing, and XML export. |
| `monaco.plus.assistant.table_config.<table_name>` | *(JSON rule configs)* | Declarative relationship rules for Assistant dependency detection per table (e.g. `sp_page`, `sp_widget`, `sc_cat_item_producer`, `sysevent_email_action`). |

### UI Scripts Reference

| UI Script | Purpose |
|---|---|
| `monaco_plus_core` | Core engine. Manages Script Include IntelliSense, GlideRecord field completions, JSDoc hovers, and property suggestions. |
| `monaco_plus_bootstrap` | Initialises and upgrades Monaco Editor instances on target ServiceNow pages. |
| `monaco_language_client` | Client-side TypeScript ambient declarations covering AngularJS, `g_form`, `g_user`, `spUtil`, `$sp`, and jQuery. |
| `monaco_language_server` | Server-side TypeScript ambient declarations covering `GlideRecord`, `GlideRecordSecure`, and `$sp`. |
| `monaco_language_html` | Monarch tokenizer and directive autocompletion provider for HTML and AngularJS directives (`ng-*`, `sp-widget`, etc.). |
| `monaco_language_css` | Completion provider for CSS/SCSS at-rules and style descriptors. |
| `monaco_code_actions` | Built-in code actions for JavaScript (JSDoc generation) and SCSS (`px` to `rem` conversion). |
| `monaco_custom_code_actions` | Extension point for custom per-language code actions. |

#### Embedding Monaco on Any Form Field

`monaco_plus_bootstrap` isn't limited to Widget Editor+ itself — add it as a UI Script dependency on an `onLoad` Client Script for any table/field to mount a full Monaco editor in place of the native textarea, in whatever language you choose:

```javascript
function onLoad() {
    if (typeof SNMonacoPlusBootstrap === 'undefined') {
        return;
    }
    SNMonacoPlusBootstrap.upgradeEditor({
        gForm: g_form,
        field: 'my_json_field',
        language: 'json',
        editorOptions: {
            minimap: { enabled: true },
            tabSize: 4,
        },
    });
}
```

- `field` / `language` — the form field to mount on, and the Monaco language id (`json`, `javascript`, `css`, `scss`, `html`, etc.).
- `editorOptions` — any [`IStandaloneEditorConstructionOptions`](https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor_editor_api.editor.IStandaloneEditorConstructionOptions.html) accepted by `monaco.editor.create()`, applied before the editor is created and taking precedence over the user's synced editor preferences.
- `onEditorReady(editor)` — optional callback given the created Monaco editor instance for further customisation.

The bootstrap script lazy-loads `monaco_plus_core` on demand, so completions/IntelliSense for the chosen `language` come free without any additional wiring.

### User Preferences
User preferences (including editor themes, Assistant visibility, and Debug Menu settings) persist in `localStorage` and synchronise to the ServiceNow instance as `sys_user_preference` records under `monaco_plus.user_prefs`.

---

## AI Disclosure

This project was developed using Claude and Gemini.
