# Widget Editor+ Application Structure & Developer Guidelines

This document provides context on the architecture, structure, and build commands for **Widget Editor+** so future AI assistant sessions can onboard instantly without having to reverse-engineer the project.

---

## 1. Project Overview & Technology Stack

- **Name**: Widget Editor+
- **Scope**: ServiceNow Global Scope (`d65bb60783e7321070b8b5dfeeaad36b`)
- **Core Technology**:
  - **ServiceNow Fluent SDK** (`@servicenow/sdk`): Code-first application development framework for ServiceNow.
  - **AngularJS 1.5.11**: Embedded client-side framework used within UI Pages and Service Portal widgets.
  - **Monaco Editor**: Powering side-by-side diff comparisons and multi-pane code editing.
  - **TypeScript**: Used for writing Fluent metadata definitions and server-side components.

---

## 2. Directory Structure

- `src/`
  - `fluent/`
    - `generated/`
      - `other/`
        - `sys-ui-page/`: **Core UI Pages (Main Application Frontends)**
          - `sys_ui_page_8b2e70458373fe1070b8b5dfeeaad35e.now.ts`: Main **Widget Editor+** application (`widget_editor.do`). Contains AngularJS structure, CSS styling, and multi-pane editor logic.
          - `sys_ui_page_51ec3d258363b61070b8b5dfeeaad36b.now.ts`: **Widget Editor Diff Viewer** (`widget_editor_diff.do`). Renders side-by-side Monaco diff comparison, scroll visibility indicators, and reversion controls.
        - `sp-widget/`: Portal widget definitions.
          - `sp_widget_widget_editor_debug_menu/`: Service Portal right-click debug menu widget (`template.html`, `client_script.js`, `server_script.js`, `link-script.js`, `style.scss`). Uses HTML5 `<dialog>` element for preferences modal.
      - `client-development/`: Client-side ServiceNow metadata (Client Scripts, UI Scripts).
        - `ui-script/`: Modular Monaco UI Scripts (`monaco_plus_core`, `monaco_plus_bootstrap`, `monaco_language_client`, `monaco_language_server`, `monaco_language_html`, `monaco_language_css`, `monaco_code_actions`, `monaco_custom_code_actions`).
      - `server-development/`: Server-side ServiceNow metadata (Script Includes, Business Rules).
      - `security/`: Access Control Lists (ACLs) and security configurations.
      - `properties/`: System properties (`monaco.plus.*`).
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
| `npm run build` | `now-sdk build` | Compiles Fluent files in `src/` into ServiceNow metadata files (XML update sets) under `dist/`. |
| `npm run deploy` | `now-sdk install` | Installs/deploys the built update set directly to the configured ServiceNow instance. |
| `npm run transform` | `now-sdk transform` | Executes Fluent code transformation logic. |
| `npm run types` | `now-sdk dependencies` | Pulls down table/metadata typings from the ServiceNow instance. |

---

## 4. Critical Developer Guidelines & Gotchas

### Backtick Escaping in `.now.ts` UI Scripts
- **CRITICAL GOTCHA**: In `.now.ts` files, UI script payloads are wrapped in template literal strings (`script: \`...\``).
- When writing JSDoc comments, string arrays, or markdown documentation that contain backticks inside `.now.ts` script strings, **a single backslash (`\``) gets stripped by TypeScript during `now-sdk build`**, outputting raw unescaped backticks into the generated JS file. In the browser, unescaped backticks break string/comment syntax and cause runtime JS errors.
- **RULE**: Always use **TRIPLE backslashes** (`\\\``) before backticks inside `.now.ts` `script: \`...\`` template literals whenever the backtick must be preserved as an escaped backtick (`\``) in the compiled output.

### Debug Menu & Preferences Persistence
- Debug menu preferences are managed by `sp_widget_widget_editor_debug_menu`.
- Preferences are saved immediately to `localStorage` (`we_debug_menu_prefs`) for immediate session updates, and synchronized to the server via `sys_user_preference` (`monaco_plus.user_prefs`).
- Note: When calling `$scope.server.get` to save preferences, pass the object directly rather than a stringified JSON string to avoid double-encoding issues on the server.

### Editing UI Pages
- The UI pages (`sys_ui_page_*.now.ts`) contain embedded HTML templates within the `html` template string property of the `UiPage({...})` call.
- Client-side controllers and styles are inline inside `<style>` and `<script>` blocks in the HTML template.

### Compilation Verification
- Always run `npm run build` after editing Fluent files to verify that `now-sdk build` succeeds and check the XML outputs in `dist/app/update/`.
