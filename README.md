# Widget Editor+

Widget Editor+ is an enhanced Service Portal widget editor for ServiceNow. It integrates Microsoft Monaco Editor and adds developer productivity tools including server-side and client-side IntelliSense, version comparison, per-field saving, and an improved right-click debug menu for Service Portal pages.

> **Native Platform Dependencies Only**: Widget Editor+ uses no external third-party libraries. All capabilities rely exclusively on libraries and frameworks already natively available within the ServiceNow platform (such as Microsoft Monaco Editor, AngularJS, jQuery, Bootstrap, and standard ServiceNow platform APIs).

---

## Table of Contents
- [Features](#features)
  - [Monaco Editor Engine](#monaco-editor-engine)
  - [Editor & Collaboration Capabilities](#editor--collaboration-capabilities)
  - [Right-Click Debug Menu](#right-click-debug-menu)
- [Building and Installation](#building-and-installation)
  - [Prerequisites](#prerequisites)
  - [Build Process](#build-process)
  - [Deployment / Installation](#deployment--installation)
- [Configuration](#configuration)
  - [System Properties](#system-properties)
  - [UI Scripts](#ui-scripts)
  - [User Preferences](#user-preferences)
- [AI Disclosure](#ai-disclosure)

---

## Features

### Monaco Editor Engine
- **Rich Code Editor**: Powered by the Monaco Editor engine across HTML, CSS/SCSS, Client Controller, Server Script, Link Function, Option Schema, and Provider sub-editors.
- **ServiceNow Client & Server IntelliSense**:
  - Auto-completions and hover documentation for ServiceNow client APIs (`g_form`, `g_user`, `spUtil`, AngularJS services `$scope`, `$http`, `$q`, `$timeout`, `$interval`, `$location`).
  - Auto-completions for server-side APIs (`GlideRecord`, `GlideRecordSecure`, `$sp`).
  - Live Script Include dot-walk completions and JSDoc type inference.
  - Live GlideRecord field name completions based on database schema queries.
- **Language Support**:
  - HTML Monarch tokenizer with AngularJS directive completions (`ng-app`, `ng-repeat`, `ng-model`, `sp-widget`, etc.).
  - SCSS/CSS completion providers with CSS/SCSS variable suggestions and `px` to `rem` code actions.
  - Extensible custom code actions framework for editor refactoring tools.

### Editor & Collaboration Capabilities
- **Per-Field Saving**: Save individual widget fields (such as Server Script or HTML Template) without needing to save the entire widget record.
- **Version History & Diff Comparison**: Compare current code against previous versions side-by-side using the Monaco diff viewer.
- **Real-Time User Presence**: Displays active co-authors currently inspecting or editing the same widget.
- **Angular Template & Provider Management**: Integrated interface for managing attached Angular templates and Script Includes / Providers directly from the editor.

### Right-Click Debug Menu
Widget Editor+ includes a Service Portal debug menu widget (`sp_widget_widget_editor_debug_menu`) that integrates into Service Portal pages to provide developer diagnostics and quick navigation via Ctrl + Right-Click or context menu interaction.

#### Debug Menu Capabilities
- **Navigation Shortcuts**:
  - Open widgets directly in Widget Editor+, Service Portal Widget Editor, Form Modal, or Platform record view.
  - Quick links to Instance Options, Page in Designer, and Page in Page Editor.
  - Open backend database record for pages or widgets with `table` and `sys_id` parameters.
- **Widget Diagnostics & Customisation**:
  - Display widget load timing metrics.
  - Highlight customised vs. out-of-box widget status.
  - Inline editing for container background properties.
  - Inspect and edit Widget Options Schema.
  - Scope toggles for embedded/nested widgets.
- **Developer Console Integration**:
  - Log `$scope`, `$scope.data`, or `$rootScope` directly to the browser console.
  - Log embedded widget `$scope` when right-clicking nested widgets.
  - Expose `$scope` and `$rootScope` globally on the `window` object for debugging in the browser console.
- **User Preferences**:
  - Preferences modal built using HTML5 `<dialog>` elements.
  - Preferences persist locally in `localStorage` and synchronise across devices via user preference records (`monaco_plus.user_prefs`).

---

## Building and Installation

### Prerequisites
- Node.js (v18 or higher recommended)
- ServiceNow SDK (`@servicenow/sdk`)

### Build Process
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Build the project using the ServiceNow SDK:
   ```bash
   npm run build
   ```
   This executes `now-sdk build`, compiling the Fluent TypeScript definitions under `src/fluent/` into update set XML files inside the `dist/app/` directory.

### Deployment / Installation
Deploy the application scope directly to a target ServiceNow instance:
```bash
npm run deploy
```
This executes `now-sdk install` to transmit and install the scope on the configured ServiceNow target instance.

---

## Configuration

### System Properties
Widget Editor+ is configured through system properties (`sys_properties`) defined under the `monaco.plus.*` namespace:

| Property Name | Default Value | Description |
|---|---|---|
| `monaco.plus.widget.fields` | *(empty)* | Comma-separated list of additional fields on `sp_widget` to display inside Widget Editor+. |
| `monaco.plus.css.variables` | `{ "example-variable": "#a4c5ea" }` | JSON string of CSS custom property name-value pairs offered as autocompletion suggestions. |
| `monaco.plus.scss.variables` | `{ "$breakpoint-xs": "480px", ... }` | JSON string of SCSS variable name-value pairs offered as autocompletion suggestions. |
| `monaco.plus.widget.deprecated` | `descriptionLIKEdeprecated` | Encoded query string evaluated against `sp_widget`. If true, flags the widget as deprecated in the editor interface. |
| `monaco.plus.widget.related_list_exclusions` | *(empty)* | Comma-separated list of `sys_ui_related_list_entry.related_list` values to exclude from widget editor related lists. |

### UI Scripts
Editor features and language services are modularised across several ServiceNow UI Scripts (`sys_ui_script`):

| UI Script Name | Description |
|---|---|
| `monaco_plus_core` | Core Monaco enhancement engine. Handles live Script Include IntelliSense, GlideRecord field completions, JSDoc hover resolution, and property suggestions. |
| `monaco_plus_bootstrap` | Bootstraps and upgrades Monaco Editor instances on target ServiceNow pages. |
| `monaco_language_client` | Client-side TypeScript ambient declaration library (`MONACO_LANGUAGE_CLIENT_DTS`) covering AngularJS (`$scope`, `$http`, `$q`), `g_form`, `g_user`, `spUtil`, `$sp`, and jQuery. |
| `monaco_language_server` | Server-side TypeScript ambient declaration library (`MONACO_LANGUAGE_SERVER_DTS`) covering server APIs including `GlideRecord`, `GlideRecordSecure`, and `$sp`. |
| `monaco_language_html` | Monarch tokenizer and directive autocompletion provider for HTML and AngularJS directives (`ng-*`, `sp-widget`, etc.). |
| `monaco_language_css` | Completion provider for CSS/SCSS at-rules (`@media`, `@font-face`, `@keyframes`) and style descriptors. |
| `monaco_code_actions` | Built-in code action provider for JavaScript (JSDoc generation) and SCSS (`px` to `rem` conversion). |
| `monaco_custom_code_actions` | Extension point for users to provide custom per-language code actions. |

### User Preferences
Preferences configured via the Debug Menu modal are stored in `localStorage` under `we_debug_menu_prefs` and synchronised to the ServiceNow server as a `sys_user_preference` record named `monaco_plus.user_prefs`.

---

## AI Disclosure

This project was developed using Claude and Gemini.
