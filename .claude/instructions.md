# Widget Editor+ Application Structure & Developer Guidelines

This document provides context on the architecture, structure, and build commands for **Widget Editor+** so future AI assistant sessions can onboard instantly without having to reverse-engineer the project.

---

## 1. Project Overview & Technology Stack

- **Name**: Widget Editor+
- **Scope**: ServiceNow Global Scope (`d65bb60783e7321070b8b5dfeeaad36b`)
- **Core Technology**:
  - **ServiceNow Fluent SDK** (`@servicenow/sdk`): Code-first application development framework for ServiceNow.
  - **AngularJS 1.5.11**: Embedded client-side framework used within the UI Pages.
  - **Monaco Editor**: Powering the side-by-side diff comparisons and code editing panes.
  - **TypeScript**: Used for writing Fluent metadata definitions and server-side components.

---

## 2. Directory Structure

- `src/`
  - `fluent/`
    - `generated/`
      - `other/`
        - `sys-ui-page/`: **Core UI Pages (Main Application Frontends)**
          - `sys_ui_page_8b2e70458373fe1070b8b5dfeeaad35e.now.ts`: The main **Widget Editor+** application (`widget_editor.do`). Contains the AngularJS structure, CSS styling, and client-side logic for the multi-pane editor.
          - `sys_ui_page_51ec3d258363b61070b8b5dfeeaad36b.now.ts`: The **Widget Editor Diff Viewer** (`widget_editor_diff.do`). Renders the side-by-side Monaco diff comparison, scroll visibility indicators, and reversion controls.
        - `sp-widget/`: Portal widget definitions.
      - `client-development/`: Client-side ServiceNow metadata (e.g. Client Scripts, UI Scripts).
      - `server-development/`: Server-side ServiceNow metadata (e.g. Script Includes, Business Rules).
      - `security/`: Access Control Lists (ACLs) and security configurations.
      - `properties/`: System properties.
      - `user-interface/`: UI Actions, UI Policies, etc.
  - `server/`
    - Contains server-side JS/TS source scripts (e.g. `script.ts`).
- `now.config.json`
  - Defines the ServiceNow application scope, Scope ID, and server tsconfig path.
- `tsconfig.json`, `src/tsconfig.client.json`, `src/tsconfig.server.json`
  - TypeScript compilation and editor configurations.

---

## 3. Key Commands & Workflow

All commands must be executed in the repository root:

| Command | Action | Description |
| :--- | :--- | :--- |
| `npm run build` | `now-sdk build` | Compiles the Fluent files in `src/` into ServiceNow metadata files (XML update sets) under `dist/`. |
| `npm run deploy` | `now-sdk install` | Installs/deploys the built update set directly to the configured ServiceNow instance. |
| `npm run transform` | `now-sdk transform` | Executes the Fluent code transformation logic. |
| `npm run types` | `now-sdk dependencies` | Pulls down table/metadata typings from the ServiceNow instance. |

---

## 4. Development & Styling Guidelines

- **Editing UI Pages**:
  - The UI pages (`sys_ui_page_*.now.ts`) contain embedded HTML templates within the `html` template string property of the `UiPage({...})` call.
  - Client-side controllers and styles are inline inside `<style>` and `<script>` blocks in the HTML template.
- **Styling**:
  - Maintain a premium, modern design aesthetic using ServiceNow design tokens (e.g. `var(--now-color_...)`).
- **Compilation Check**:
  - Always run `npm run build` after editing fluent files to check for compilation/validation issues.
