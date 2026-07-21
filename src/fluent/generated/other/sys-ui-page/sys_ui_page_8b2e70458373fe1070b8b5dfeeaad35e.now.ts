import { UiPage } from '@servicenow/sdk/core'

UiPage({
    $id: Now.ID['8b2e70458373fe1070b8b5dfeeaad35e'],
    category: 'htmleditor',
    endpoint: 'widget_editor.do',
    description: `Full-featured editor for Service Portal widgets. Supports editing of HTML template, CSS, server script, client script, link function, and option schema in a multi-pane layout. Includes support for editing script includes, Angular providers, and AngularJS templates.

Features version history, side-by-side diff comparison, related lists, and user preferences. Enforces read-only mode for protected widgets and displays volatility risk warnings for files subject to future platform updates.`,
    html: `<?xml version="1.0" encoding="utf-8" ?>
<j:jelly trim="false" xmlns:j="jelly:core" xmlns:g="glide" xmlns:j2="null" xmlns:g2="null">
    <!-- Ensure the ServiceNow header frame is present; redirect if accessed directly -->
    <script>
        (function() {
            if (window.top === window) {
                var page = window.location.pathname.substring(1) + window.location.search + window.location.hash;
                window.location.replace('/now/nav/ui/classic/params/target/' + encodeURIComponent(page));
            }
        })();
    </script>
	<g:requires name="scripts/snc-code-editor/monaco.bundle.min.jsx" params="sysparm_substitute=false" />
	<g:requires name="monaco_plus_bootstrap.jsdbx" params="sysparm_substitute=false" />

    <g:requires name="scripts/angular_1.5.11/angular.min.js" position="last" />
    <g:requires name="scripts/js_includes_amb.jsx" params="sysparm_substitute=false" />

    <!-- Page config injected from URL parameters -->
    <script>
        var _weConfigParams = new URLSearchParams(window.location.search);
        window.WE_CONFIG = {
            sys_id: _weConfigParams.get('widget_id') || '',
            version_id: _weConfigParams.get('version_id') || '',
            widgetPageSysId: '8b2e70458373fe1070b8b5dfeeaad35e',
            diffPageSysId: '51ec3d258363b61070b8b5dfeeaad36b',
            siteTitle: '\${gs.getProperty("glide.product.name", "ServiceNow")}',
            buildName: '\${gs.getProperty("com.glide.embedded_help.version")}'
        };
    </script>

    <style>
        :root { --we-unsaved-color: var(--now-color_alert--high-2, (221, 145, 34)); }

        /* Reset */
        *,
        *::before,
        *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        html {
            font-size: 16px; /* anchor 1rem = 16px regardless of platform override */
        }

        html,
        body {
            height: 100%;
            overflow: hidden;
            font-family: -apple-system, 'Segoe UI', 'Inter', sans-serif;
            background: rgb(var(--now-color_background--primary));
            color: rgb(var(--now-color_text--primary));
            padding: 0 !important;
            margin: 0;
        }

        input,
        select,
        button,
        textarea {
            font-family: inherit;
            font-size: inherit;
        }

        [ng-cloak],
        .ng-cloak {
            display: none !important;
        }

        /* App shell */
        .we-app {
            display: flex;
            flex-direction: column;
            height: 99vh;
        }

        /* Generic alert bars */
        .we-alert-bar {
            padding: 0.625rem 0.875rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 0.375rem;
            flex-shrink: 0;
            border-bottom: var(--now-alert--border-width, var(--now-messaging--border-width)) solid;
            background: rgb(var(--now-alert--info--background-color, var(--now-color_alert--info-0)));
            border-color: rgb(var(--now-alert--info--border-color, var(--now-color_alert--info-1)));
            color: rgb(var(--now-color_text--secondary));
        }

        .we-alert-bar strong { color: inherit; }
        .we-alert-bar--critical {
            background: rgb(var(--now-alert--critical--background-color));
            border-color: rgb(var(--now-alert--critical--border-color));
            color: rgb(var(--now-color_text--secondary));
        }
        .we-alert-bar--warning {
            background: rgb(var(--now-alert--warning--background-color));
            border-color: rgb(var(--now-alert--warning--border-color, var(--now-color_alert--warning-1)));
            color: rgb(var(--now-color_text--secondary));
        }

        .we-alert-bar-link {
            color: inherit;
            text-decoration: underline;
            cursor: pointer;
            margin-left: 0.25rem;
        }
        .we-alert-bar-link:hover { text-decoration: none; }

        /* Version banner */
        .we-version-banner {
            padding: 0.625rem 0.75rem;
            text-align: center;
        }

        /* Header */
        .we-header {
            background: rgb(var(--now-color_background--tertiary));
            border-bottom: 1px solid rgba(var(--now-color--neutral-0), 0.08);
            padding: 0.375rem 0.75rem;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 0.5rem;
        }

        .we-header-group {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            flex-wrap: wrap;
        }

        /* Save status + action buttons: one cluster that keeps the buttons
           intact and lets the status text wrap in place first; the whole
           cluster only drops to row 2 when there's no room even for that. */
        .we-header-actions {
            flex-wrap: nowrap;
            flex: 1 1 12rem;
            max-width: max-content;
            min-width: min-content;
            margin-left: auto;
        }
        .we-header-actions > button,
        .we-header-actions > .we-presence,
        .we-header-actions > .we-dropdown {
            flex-shrink: 0;
        }

        .we-header-sep {
            width: 1px;
            height: 1.375rem;
            background: rgba(var(--now-color--neutral-0), 0.1);
        }

        .we-spacer {
            flex: 1;
        }

        /* Field container */
        .we-field {
            display: flex;
            flex-direction: column;
            gap: 0.125rem;
        }

        .we-field label {
            display: inline-flex;
            align-items: center;
            font-size: var(--now-font-size--xs) !important;
            text-transform: uppercase;
            letter-spacing: 0.6px !important;
            color: rgba(var(--now-color_text--primary), 0.45) !important;
            line-height: 1 !important;
        }

        .we-field input[type="text"],
        .we-field input[type="number"] {
            padding: 0.1875rem 0.375rem;
            height: 1.5rem;
        }

        .we-field input[readonly],
        .we-field input:disabled {
            opacity: 0.5;
            cursor: default;
        }

        .we-field-roles {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.25rem;
        }

        .we-field-public {
            align-self: start;
            margin-top: 0.125rem;
         }

        .we-field-public .checkbox-label {
            display: flex;
            flex-direction: column-reverse;
            gap: 0.375rem;
        }

        /* Checkbox toggle */
        .we-toggle {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.125rem;
        }

        .we-toggle .input-group-checkbox {
            margin: 0;
        }

        .we-toggle-inline {
            flex-direction: row;
            align-items: center;
            gap: 0.25rem;
            color: rgb(var(--now-color_text--tertiary));
            cursor: pointer;
        }

        .checkbox-label {
            cursor: pointer;
        }

        /* Pane ID status / error (footer) */
        .we-pane-id-status { color: rgba(var(--now-color_text--primary), 0.45); }
        .we-pane-id-error { color: rgb(var(--now-alert--critical--color, var(--now-color_alert--critical-3))); }
        .we-pane-type-select { padding: 0.125rem 0.25rem; height: 1.625rem; cursor: pointer; }
        .we-pane-type-select:disabled { opacity: 0.5; cursor: default; }

        /* Dropdown divider */
        .we-dropdown-divider { border-top: 1px solid rgba(var(--now-color--neutral-0), 0.08); margin: 0.1875rem 0; }

        /* Popovers (description, roles) */
        .we-field-with-popover { position: relative; }
        .we-field-label-row { display: flex; align-items: center; gap: 0.1875rem; margin-block-end: 2px; min-height: 1rem; }

        #widget-name, #widget-id { field-sizing: content; min-width: 5rem; max-width: 13rem; }
        .we-field-label-row label { margin: 0; }

        .we-info-icon { cursor: pointer; color: rgba(var(--now-color_text--primary), 0.35); line-height: 1; user-select: none; font-style: normal; display: inline-flex; align-items: center; }
        .we-info-icon svg { width: 1em; height: 1em; fill: currentColor; display: block; }
        .we-info-icon:hover { color: rgb(var(--now-color--primary-2)); }
        .we-popover {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            position: absolute; top: 100%; left: 0; margin-top: 0.25rem;
            background: rgb(var(--now-color_background--secondary));
            border: 1px solid rgba(var(--now-color--neutral-0), 0.15);
            border-radius: var(--now-modal--border-radius);
            box-shadow: 0 6px 24px rgba(0,0,0,0.35);
            z-index: 500;
            padding: 0.5rem;
            min-width: 12.5rem;
        }
        .we-desc-textarea { resize: none; width: 29.375rem; overflow: hidden; min-height: 3.375rem; max-width: 80vw; }
        .we-widget-origin { display: block; margin-top: 0.625rem; color: rgba(var(--now-color_text--primary), 0.4); font-size: var(--now-font-size--sm); cursor: help; }
        .we-roles-count {
            cursor: pointer;
            background: rgba(var(--now-color--primary-1), 0.15);
            color: rgb(var(--now-color--primary-2));
            border-radius: var(--now-badge--border-radius);
            padding: 0.25em 0.5em;
            line-height: 1em;
            user-select: none;
        }
        .we-roles-count:hover { background: rgba(var(--now-color--primary-1), 0.3); }
        .we-roles-count--active { background: rgb(var(--now-button--primary--background-color)); color: rgb(var(--now-button--primary--color)); font-weight: 600; }
        .we-roles-count--active:hover { background: rgba(var(--now-button--primary--background-color), 0.85); }
        .we-roles-popover .we-roles-wrap { min-width: unset; max-width: unset; width: 100%; box-sizing: border-box; }

        /* Select2 v3 overrides in roles popover */
        .we-roles-popover .select2-container { width: 100% !important; }
        .we-roles-popover .select2-choices {
            background: rgb(var(--now-color_background--tertiary)) !important;
            border: 1px solid rgba(var(--now-color--neutral-0), 0.15) !important;
            border-radius: var(--now-form-field--border-radius) !important;
            min-height: 1.875rem;
            box-shadow: none !important;
        }
        .we-roles-popover .select2-search-choice {
            display: inline-flex;
            align-items: center;
            padding: 0.375rem 0.5rem;

            background: rgba(var(--now-color--primary-1), 0.3) !important;
            color: rgb(var(--now-color--primary-2)) !important;
            border: none !important;
            border-radius: var(--now-badge--border-radius) !important;
            box-shadow: none !important;
            
        }
        .we-roles-popover .select2-search-choice-close { opacity: 0.7; position: static; margin-left: 0.3125rem; }
        .we-roles-popover .select2-search-choice-close:hover { opacity: 1; }
        .we-roles-popover .select2-container-multi.select2-container-active .select2-choices {
            background: rgb(var(--now-color_background--tertiary)) !important;
            border-color: rgb(var(--now-color--primary-2)) !important;
            box-shadow: none !important;
        }
        .we-roles-popover .select2-input,
        .we-roles-popover .select2-input:focus {
            background: rgb(var(--now-color_background--tertiary)) !important;
            color: rgb(var(--now-color_text--secondary)) !important;
            box-shadow: none !important;
        }

        /* Select2 v3 dropdown — appended to body, must be scoped globally */
        .select2-drop {
            background: rgb(var(--now-color_background--tertiary, 237 237 237)) !important;
            border: 1px solid rgba(var(--now-color--neutral-0, 0 0 0), 0.15) !important;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45) !important;
            color: rgb(var(--now-color_text--primary, 29 29 29)) !important;
        }
        .select2-drop .select2-results { background: transparent !important; }
        .select2-drop .select2-result-label { color: rgb(var(--now-color_text--primary, 29 29 29)) !important; }
        .select2-drop .select2-result.select2-highlighted .select2-result-label {
            background: rgba(var(--now-color--primary-1, 0 118 204), 0.2) !important;
            color: rgb(var(--now-color_text--primary, 29 29 29)) !important;
        }
        .select2-drop .select2-searching,
        .select2-drop .select2-no-results {
            background: transparent !important;
            color: rgb(var(--now-color_text--secondary, 82 82 82)) !important;
        }
        .select2-drop .select2-search input {
            background: rgb(var(--now-color_background--tertiary, 237 237 237)) !important;
            background-image: none !important;
            border: 1px solid rgba(var(--now-color--neutral-0, 0 0 0), 0.15) !important;
            color: rgb(var(--now-color_text--primary, 29 29 29)) !important;
            box-shadow: none !important;
        }
        .select2-drop .select2-search.select2-search-field-active input,
        .select2-drop .select2-search input.select2-active {
            background-color: rgb(var(--now-color_background--tertiary, 237 237 237)) !important;
        }
        /* Override the inline multi-select search spinner — SN's rule uses !important so we
           need higher specificity + !important to override the white background. */
        .we-roles-popover .select2-container-multi .select2-choices .select2-search-field input.select2-active {
            background-color: rgb(var(--now-color_background--tertiary, 237 237 237)) !important;
            background-image: none !important;
        }

        /* Option schema modal */
        .we-option-schema-editor { height: 25rem; border: 1px solid rgba(var(--now-color--neutral-0), 0.1); overflow: hidden; }

        /* XML modal */
        .we-xml-editor { height: 32.5rem; border: 1px solid rgba(var(--now-color--neutral-0), 0.1); overflow: hidden; }

        /* Link provider modal list */
        .we-link-list { 
            height: min(25rem, 75vh);
            overflow-y: auto;
            border-width: 1px;
            border-style: solid;
            border-color: rgb(var(--now-form-field--border-color, var(--now-color_border--primary, var(--now-color--neutral-7))));
            border-top-left-radius: var(--now-form-field--border-radius);
            border-bottom-left-radius: var(--now-form-field--border-radius);
        }
        .we-link-item {
            padding: 0.5rem 0.75rem;
            cursor: pointer;
            display: flex;
            align-items: center;
        }
        .we-link-item > span:first-child {
            flex: 1 1 auto;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .we-link-item .we-dropdown-ext-link { margin-left: auto; }
        .we-link-item:hover { background: rgb(var(--now-dropdown-list_search--background-color--hover)); }
        .we-link-item + .we-link-item { border-top: 1px solid rgba(var(--now-color--neutral-0), 0.08); }
        .we-link-id { color: rgb(var(--now-color_text--secondary)); }


        /* User Preferences modal drag-and-drop */
        .we-modal-option { display: flex; align-items: center; gap: 0.375rem; padding: 0.1875rem 0; }
        .we-pref-editor-row { border-radius: var(--now-modal--border-radius); padding: 0.25rem; transition: background 0.1s; }
        .we-pref-editor-row.we-pref-drag-over { background: rgba(var(--now-color--primary-1), 0.12); box-shadow: inset 0 2px 0 rgb(var(--now-color--primary-2)); }
        .we-pref-drag-handle {
            color: rgba(var(--now-color_text--primary), 0.3);
            cursor: grab;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            padding: 0 0.125rem;
            user-select: none;
        }
        .we-pref-drag-handle:hover { color: rgb(var(--now-color_text--tertiary)); }
        .we-pref-drag-handle:active { cursor: grabbing; }

        /* Roles chip input */
        .we-roles-wrap {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 0.1875rem;
            background: rgb(var(--now-color_background--tertiary));
            border: 1px solid rgba(var(--now-color--neutral-0), 0.12);
            border-radius: var(--now-form-field--border-radius);
            padding: 0.125rem 0.25rem;
            min-width: 8.75rem;
            max-width: 13.75rem;
            min-height: 1.5rem;
            cursor: text;
            position: relative;
        }

        .we-roles-wrap:focus-within {
            border-color: rgb(var(--now-color--primary-2));
        }

        .we-role-chip {
            background: rgba(var(--now-color--primary-1), 0.3);
            color: rgb(var(--now-color--primary-2));
            padding: 0.0625rem 0.3125rem;
            border-radius: var(--now-badge--border-radius);
            display: flex;
            align-items: center;
            gap: 0.1875rem;
            white-space: nowrap;
        }

        .we-role-chip-x {
            cursor: pointer;
            opacity: 0.7;
            line-height: 1;
        }

        .we-role-chip-x:hover {
            opacity: 1;
        }

        .we-input-invalid {
            border-color: rgb(var(--now-alert--critical--color, var(--now-color_alert--critical-3))) !important;
            box-shadow: 0 0 0 1px rgb(var(--now-alert--critical--color, var(--now-color_alert--critical-3))) !important;
        }

        .we-roles-input {
            background: transparent;
            border: none;
            color: rgb(var(--now-color_text--secondary));
            outline: none;
            min-width: 3.75rem;
            flex: 1;
        }

        /* Autocomplete */
        .we-autocomplete {
            position: fixed;
            background: rgb(var(--now-color_background--tertiary));
            border: 1px solid rgba(var(--now-color--neutral-0), 0.12);
            max-height: 10rem;
            overflow-y: auto;
            z-index: 850;
            min-width: 9.375rem;
            border-radius: var(--now-modal--border-radius);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
        }

        .we-autocomplete-item {
            padding: 0.3125rem 0.625rem;
            cursor: pointer;
        }

        .we-autocomplete-item:hover,
        .we-autocomplete-item.active {
            background: rgba(var(--now-color--primary-1), 0.25);
        }

        /* Presence */
        .we-presence {
            display: flex;
            gap: 0.25rem;
            align-items: center;
        }

        .we-avatar {
            width: 2rem;
            height: 2rem;
            border-radius: 50%;
            background: rgba(var(--now-color--primary-1), 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: rgb(var(--now-color--neutral-0));
            border: 2px solid rgba(var(--now-color--neutral-0), 1);
            border-radius: 50%;
            cursor: default;
            user-select: none;
            position: relative;
        }

        .we-avatar-tooltip {
            display: none;
            position: absolute;
            bottom: calc(100% + 0.4375rem);
            left: 50%;
            transform: translateX(-50%);
            background: rgb(var(--now-color_background--tertiary));
            border: 1px solid rgba(var(--now-color--neutral-0), 0.12);
            border-radius: var(--now-tooltip--border-radius);
            padding: 0.375rem 0.625rem;
            white-space: nowrap;
            z-index: 900;
            pointer-events: none;
            box-shadow: 0 6px 20px rgba(0,0,0,0.7);
        }
        .we-avatar-tooltip::after {
            content: '';
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            border: 5px solid transparent;
            border-top-color: rgba(var(--now-color--neutral-0), 0.12);
        }
        .we-avatar:hover .we-avatar-tooltip { display: block; }
        .we-avatar-tooltip-name {
            font-weight: 600;
            color: rgb(var(--now-color_text--primary));
            margin-bottom: 0.25rem;
        }
        .we-avatar-tooltip-item {
            color: rgb(var(--now-color_text--tertiary));
            padding: 0.0625rem 0;
        }

        /* Buttons — sizing/layout supplement over Bootstrap btn btn-default */
        .we-btn {
            height: 1.625rem;
            padding: 0.25rem 0.6875rem;
            white-space: nowrap;
            display: inline-flex !important;
            align-items: center;
            gap: 0.25rem;
            line-height: 1;
        }


        .we-btn:disabled,
        .we-btn[disabled] {
            opacity: 0.4;
            cursor: default;
            pointer-events: none;
        }

        /* Icon-only pane buttons override Bootstrap defaults */
        .we-pane-icon-btn.btn {
            background-color: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        /* Dropdowns */
        .we-dropdown {
            position: relative;
        }

        .btn:has(.caret) { display: inline-flex; align-items: center; gap: 0.25rem; }
        .caret { transition: transform 0.2s ease; flex-shrink: 0; }
        .we-caret--open { transform: scaleY(-1); }

        .we-dropdown-menu {
            position: absolute;
            top: calc(100% + 0.1875rem);
            left: 0;
            background: rgb(var(--now-color_background--secondary));
            border: 1px solid rgba(var(--now-color--neutral-0), 0.1);
            min-width: 14.5rem;
            max-height: 70vh;
            overflow-y: auto;
            z-index: 700;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.65);
            border-radius: var(--now-modal--border-radius);
        }


        .we-dropdown-menu-providers {
            width: 17.5rem;
        }

        .we-dropdown-menu-providers button.we-dropdown-unlink-btn {
            min-height: auto;
        }

        .we-dropdown-item {
            padding: 0.5rem 0.75rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            gap: 0.125rem;
            scroll-snap-align: start;
        }

        .we-dropdown-item + .we-dropdown-item {
            border-top: 1px solid rgba(var(--now-color--neutral-0), 0.08);
        }

        .we-dropdown-item:hover {
            background: rgb(var(--now-dropdown-list_search--background-color--hover));
        }
        .we-dropdown-item:focus,
        .we-compact-submenu-trigger:focus {
            outline: 2px solid rgba(var(--now-color--primary-2), 0.65);
            outline-offset: -2px;
        }
        .we-dropdown-item:focus:not(:focus-visible),
        .we-compact-submenu-trigger:focus:not(:focus-visible) {
            outline: none;
        }

        .we-dropdown-item-label { flex: 1; overflow: hidden; text-overflow: ellipsis; }
        .we-dropdown-ext-link {
            display: none;
            flex-shrink: 0;
            width: 0.9375rem;
            height: 0.9375rem;
            background-color: rgba(var(--now-color_text--primary), 0.45);
            -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
            -webkit-mask-position: center;
            mask-position: center;
            -webkit-mask-size: 0.6875rem 0.6875rem;
            mask-size: 0.6875rem 0.6875rem;
            -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 640'%3E%3Cpath d='M384 64C366.3 64 352 78.3 352 96C352 113.7 366.3 128 384 128L466.7 128L265.3 329.4C252.8 341.9 252.8 362.2 265.3 374.7C277.8 387.2 298.1 387.2 310.6 374.7L512 173.3L512 256C512 273.7 526.3 288 544 288C561.7 288 576 273.7 576 256L576 96C576 78.3 561.7 64 544 64L384 64zM144 160C99.8 160 64 195.8 64 240L64 496C64 540.2 99.8 576 144 576L400 576C444.2 576 480 540.2 480 496L480 416C480 398.3 465.7 384 448 384C430.3 384 416 398.3 416 416L416 496C416 504.8 408.8 512 400 512L144 512C135.2 512 128 504.8 128 496L128 240C128 231.2 135.2 224 144 224L224 224C241.7 224 256 209.7 256 192C256 174.3 241.7 160 224 160L144 160z'/%3E%3C/svg%3E");
            mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 640'%3E%3Cpath d='M384 64C366.3 64 352 78.3 352 96C352 113.7 366.3 128 384 128L466.7 128L265.3 329.4C252.8 341.9 252.8 362.2 265.3 374.7C277.8 387.2 298.1 387.2 310.6 374.7L512 173.3L512 256C512 273.7 526.3 288 544 288C561.7 288 576 273.7 576 256L576 96C576 78.3 561.7 64 544 64L384 64zM144 160C99.8 160 64 195.8 64 240L64 496C64 540.2 99.8 576 144 576L400 576C444.2 576 480 540.2 480 496L480 416C480 398.3 465.7 384 448 384C430.3 384 416 398.3 416 416L416 496C416 504.8 408.8 512 400 512L144 512C135.2 512 128 504.8 128 496L128 240C128 231.2 135.2 224 144 224L224 224C241.7 224 256 209.7 256 192C256 174.3 241.7 160 224 160L144 160z'/%3E%3C/svg%3E");
        }
        .we-dropdown-ext-link:hover { background-color: rgb(var(--now-color_text--primary)); }
        .we-dropdown-item:hover .we-dropdown-ext-link,
        .we-link-item:hover .we-dropdown-ext-link { display: block; }

        /* Version ext-link: always occupies space so the row columns don't shift on hover */
        .we-dropdown-ext-link--reserved { display: block !important; visibility: hidden; }
        .we-dropdown-item:hover .we-dropdown-ext-link--reserved { visibility: visible; }

        /* Inline external-link icon — reuses the same FA mask as .we-dropdown-ext-link */
        .we-ext-icon {
            display: inline-block;
            width: 0.8125rem;
            height: 0.8125rem;
            vertical-align: -0.1rem;
            flex-shrink: 0;
            background-color: currentColor;
            -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
            -webkit-mask-position: center;
            mask-position: center;
            -webkit-mask-size: contain;
            mask-size: contain;
            -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 640'%3E%3Cpath d='M384 64C366.3 64 352 78.3 352 96C352 113.7 366.3 128 384 128L466.7 128L265.3 329.4C252.8 341.9 252.8 362.2 265.3 374.7C277.8 387.2 298.1 387.2 310.6 374.7L512 173.3L512 256C512 273.7 526.3 288 544 288C561.7 288 576 273.7 576 256L576 96C576 78.3 561.7 64 544 64L384 64zM144 160C99.8 160 64 195.8 64 240L64 496C64 540.2 99.8 576 144 576L400 576C444.2 576 480 540.2 480 496L480 416C480 398.3 465.7 384 448 384C430.3 384 416 398.3 416 416L416 496C416 504.8 408.8 512 400 512L144 512C135.2 512 128 504.8 128 496L128 240C128 231.2 135.2 224 144 224L224 224C241.7 224 256 209.7 256 192C256 174.3 241.7 160 224 160L144 160z'/%3E%3C/svg%3E");
            mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 640'%3E%3Cpath d='M384 64C366.3 64 352 78.3 352 96C352 113.7 366.3 128 384 128L466.7 128L265.3 329.4C252.8 341.9 252.8 362.2 265.3 374.7C277.8 387.2 298.1 387.2 310.6 374.7L512 173.3L512 256C512 273.7 526.3 288 544 288C561.7 288 576 273.7 576 256L576 96C576 78.3 561.7 64 544 64L384 64zM144 160C99.8 160 64 195.8 64 240L64 496C64 540.2 99.8 576 144 576L400 576C444.2 576 480 540.2 480 496L480 416C480 398.3 465.7 384 448 384C430.3 384 416 398.3 416 416L416 496C416 504.8 408.8 512 400 512L144 512C135.2 512 128 504.8 128 496L128 240C128 231.2 135.2 224 144 224L224 224C241.7 224 256 209.7 256 192C256 174.3 241.7 160 224 160L144 160z'/%3E%3C/svg%3E");
        }
        button.we-dropdown-unlink-btn {
            display: none;
            flex-shrink: 0;
            width: 0.9375rem;
            height: 0.9375rem;
            min-width: auto;
            min-height: auto;
            background-color: rgba(var(--now-color_text--primary), 0.45);
            -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
            -webkit-mask-position: center;
            mask-position: center;
            -webkit-mask-size: 0.6875rem 0.6875rem;
            mask-size: 0.6875rem 0.6875rem;
            -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 640'%3E%3Cpath d='M73 39.1C63.6 29.7 48.4 29.7 39.1 39.1C29.8 48.5 29.7 63.7 39 73.1L567 601.1C576.4 610.5 591.6 610.5 600.9 601.1C610.2 591.7 610.3 576.5 600.9 567.2L478.9 445.2C483.1 441.8 487.2 438.1 491 434.3L562.1 363.2C591.4 333.9 607.9 294.1 607.9 252.6C607.9 166.2 537.9 96.1 451.4 96.1C414.1 96.1 378.3 109.4 350.1 133.3C370.4 143.4 388.8 156.8 404.6 172.8C418.7 164.5 434.8 160.1 451.4 160.1C502.5 160.1 543.9 201.5 543.9 252.6C543.9 277.1 534.2 300.6 516.8 318L445.7 389.1C441.8 393 437.6 396.5 433.1 399.6L385.6 352.1C402.1 351.2 415.3 337.7 415.8 321C415.8 319.7 415.8 318.4 415.8 317.1C415.8 230.8 345.9 160.2 259.3 160.2C240.1 160.2 221.4 163.7 203.8 170.4L73 39.1zM257.9 224C258.5 224 259 224 259.6 224C274.7 224 289.1 227.7 301.7 234.2C303.5 235.4 305.3 236.5 307.2 237.3C334 253.6 352 283.2 352 316.9C352 317.3 352 317.7 352 318.1L257.9 224zM378.2 480L224 325.8C225.2 410.4 293.6 478.7 378.1 479.9zM171.7 273.5L126.4 228.2L77.8 276.8C48.5 306.1 32 345.9 32 387.4C32 473.8 102 543.9 188.5 543.9C225.7 543.9 261.6 530.6 289.8 506.7C269.5 496.6 251 483.2 235.2 467.2C221.2 475.4 205.1 479.8 188.5 479.8C137.4 479.8 96 438.4 96 387.3C96 362.8 105.7 339.3 123.1 321.9L171.7 273.3z'/%3E%3C/svg%3E");
            mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 640'%3E%3Cpath d='M73 39.1C63.6 29.7 48.4 29.7 39.1 39.1C29.8 48.5 29.7 63.7 39 73.1L567 601.1C576.4 610.5 591.6 610.5 600.9 601.1C610.2 591.7 610.3 576.5 600.9 567.2L478.9 445.2C483.1 441.8 487.2 438.1 491 434.3L562.1 363.2C591.4 333.9 607.9 294.1 607.9 252.6C607.9 166.2 537.9 96.1 451.4 96.1C414.1 96.1 378.3 109.4 350.1 133.3C370.4 143.4 388.8 156.8 404.6 172.8C418.7 164.5 434.8 160.1 451.4 160.1C502.5 160.1 543.9 201.5 543.9 252.6C543.9 277.1 534.2 300.6 516.8 318L445.7 389.1C441.8 393 437.6 396.5 433.1 399.6L385.6 352.1C402.1 351.2 415.3 337.7 415.8 321C415.8 319.7 415.8 318.4 415.8 317.1C415.8 230.8 345.9 160.2 259.3 160.2C240.1 160.2 221.4 163.7 203.8 170.4L73 39.1zM257.9 224C258.5 224 259 224 259.6 224C274.7 224 289.1 227.7 301.7 234.2C303.5 235.4 305.3 236.5 307.2 237.3C334 253.6 352 283.2 352 316.9C352 317.3 352 317.7 352 318.1L257.9 224zM378.2 480L224 325.8C225.2 410.4 293.6 478.7 378.1 479.9zM171.7 273.5L126.4 228.2L77.8 276.8C48.5 306.1 32 345.9 32 387.4C32 473.8 102 543.9 188.5 543.9C225.7 543.9 261.6 530.6 289.8 506.7C269.5 496.6 251 483.2 235.2 467.2C221.2 475.4 205.1 479.8 188.5 479.8C137.4 479.8 96 438.4 96 387.3C96 362.8 105.7 339.3 123.1 321.9L171.7 273.3z'/%3E%3C/svg%3E");
            cursor: pointer;
            border: none;
            padding: 0;
        }
        button.we-dropdown-unlink-btn:hover { background-color: #e05050; }
        .we-dropdown-item:hover button.we-dropdown-unlink-btn { display: block; }

        .we-dropdown-item.add-item {
            border-top: 1px solid rgba(var(--now-color--neutral-0), 0.08);
            color: rgb(var(--now-color--primary-2));
            gap: 0.375rem;
        }
        .we-dropdown-item.add-item::before {
            content: '';
            display: inline-block;
            flex-shrink: 0;
            width: 0.8125rem;
            height: 0.8125rem;
            background-color: currentColor;
            -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
            -webkit-mask-position: center;
            mask-position: center;
            -webkit-mask-size: contain;
            mask-size: contain;
        }
        .we-add-new::before {
            -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 640'%3E%3Cpath d='M352 128C352 110.3 337.7 96 320 96C302.3 96 288 110.3 288 128L288 288L128 288C110.3 288 96 302.3 96 320C96 337.7 110.3 352 128 352L288 352L288 512C288 529.7 302.3 544 320 544C337.7 544 352 529.7 352 512L352 352L512 352C529.7 352 544 337.7 544 320C544 302.3 529.7 288 512 288L352 288L352 128z'/%3E%3C/svg%3E");
            mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 640'%3E%3Cpath d='M352 128C352 110.3 337.7 96 320 96C302.3 96 288 110.3 288 128L288 288L128 288C110.3 288 96 302.3 96 320C96 337.7 110.3 352 128 352L288 352L288 512C288 529.7 302.3 544 320 544C337.7 544 352 529.7 352 512L352 352L512 352C529.7 352 544 337.7 544 320C544 302.3 529.7 288 512 288L352 288L352 128z'/%3E%3C/svg%3E");
        }
        .we-add-link::before {
            -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 640'%3E%3Cpath d='M451.5 160C434.9 160 418.8 164.5 404.7 172.7C388.9 156.7 370.5 143.3 350.2 133.2C378.4 109.2 414.3 96 451.5 96C537.9 96 608 166 608 252.5C608 294 591.5 333.8 562.2 363.1L491.1 434.2C461.8 463.5 422 480 380.5 480C294.1 480 224 410 224 323.5C224 322 224 320.5 224.1 319C224.6 301.3 239.3 287.4 257 287.9C274.7 288.4 288.6 303.1 288.1 320.8C288.1 321.7 288.1 322.6 288.1 323.4C288.1 374.5 329.5 415.9 380.6 415.9C405.1 415.9 428.6 406.2 446 388.8L517.1 317.7C534.4 300.4 544.2 276.8 544.2 252.3C544.2 201.2 502.8 159.8 451.7 159.8zM307.2 237.3C305.3 236.5 303.4 235.4 301.7 234.2C289.1 227.7 274.7 224 259.6 224C235.1 224 211.6 233.7 194.2 251.1L123.1 322.2C105.8 339.5 96 363.1 96 387.6C96 438.7 137.4 480.1 188.5 480.1C205 480.1 221.1 475.7 235.2 467.5C251 483.5 269.4 496.9 289.8 507C261.6 530.9 225.8 544.2 188.5 544.2C102.1 544.2 32 474.2 32 387.7C32 346.2 48.5 306.4 77.8 277.1L148.9 206C178.2 176.7 218 160.2 259.5 160.2C346.1 160.2 416 230.8 416 317.1C416 318.4 416 319.7 416 321C415.6 338.7 400.9 352.6 383.2 352.2C365.5 351.8 351.6 337.1 352 319.4C352 318.6 352 317.9 352 317.1C352 283.4 334 253.8 307.2 237.5z'/%3E%3C/svg%3E");
            mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 640'%3E%3Cpath d='M451.5 160C434.9 160 418.8 164.5 404.7 172.7C388.9 156.7 370.5 143.3 350.2 133.2C378.4 109.2 414.3 96 451.5 96C537.9 96 608 166 608 252.5C608 294 591.5 333.8 562.2 363.1L491.1 434.2C461.8 463.5 422 480 380.5 480C294.1 480 224 410 224 323.5C224 322 224 320.5 224.1 319C224.6 301.3 239.3 287.4 257 287.9C274.7 288.4 288.6 303.1 288.1 320.8C288.1 321.7 288.1 322.6 288.1 323.4C288.1 374.5 329.5 415.9 380.6 415.9C405.1 415.9 428.6 406.2 446 388.8L517.1 317.7C534.4 300.4 544.2 276.8 544.2 252.3C544.2 201.2 502.8 159.8 451.7 159.8zM307.2 237.3C305.3 236.5 303.4 235.4 301.7 234.2C289.1 227.7 274.7 224 259.6 224C235.1 224 211.6 233.7 194.2 251.1L123.1 322.2C105.8 339.5 96 363.1 96 387.6C96 438.7 137.4 480.1 188.5 480.1C205 480.1 221.1 475.7 235.2 467.5C251 483.5 269.4 496.9 289.8 507C261.6 530.9 225.8 544.2 188.5 544.2C102.1 544.2 32 474.2 32 387.7C32 346.2 48.5 306.4 77.8 277.1L148.9 206C178.2 176.7 218 160.2 259.5 160.2C346.1 160.2 416 230.8 416 317.1C416 318.4 416 319.7 416 321C415.6 338.7 400.9 352.6 383.2 352.2C365.5 351.8 351.6 337.1 352 319.4C352 318.6 352 317.9 352 317.1C352 283.4 334 253.8 307.2 237.5z'/%3E%3C/svg%3E");
        }

        .we-dropdown-empty {
            padding: 0.5rem 0.75rem;
            color: rgba(var(--now-color_text--primary), 0.65);
        }
        .we-version-update-set {
            color: rgb(var(--now-color_text--tertiary));
            font-style: italic;
        }

        .we-dropdown-menu-versions {
            min-width: min(47.5rem, 90vw);
            max-height: 75vh;
            overflow-y: auto;
            scroll-snap-type: y mandatory;
        }

        .we-version-row {
            display: grid;
            grid-template-columns: 1fr 3fr 1fr;
            gap: 0 0.375rem;
            width: 100%;
        }

        .we-version-col-date {
            white-space: nowrap;
        }

        .we-version-col-uset {
            color: rgb(var(--now-color_text--tertiary));
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .we-version-col-uset--in-progress { font-style: italic; }
        .we-version-col-uset--ignore { text-decoration: line-through; }

        .we-version-col-user {
            color: rgb(var(--now-color_text--secondary));
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .we-version-current-dot {
            display: inline-block;
            width: 0.5rem;
            height: 0.5rem;
            border-radius: 50%;
            background: #3eb489;
            margin-right: 0.375rem;
            flex-shrink: 0;
            vertical-align: middle;
            position: relative;
            top: -0.0625rem;
        }

        /* Compact menu (viewport less than 1200px) */
        .we-compact-menu { display: none; }
        .we-compact-menu-panel { min-width: max(14rem, 25vw); width: 25rem; max-width: 95vw; max-height: 80vh; overflow-y: auto; }
        .we-compact-submenu-trigger {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.4375rem 0.75rem;
            cursor: pointer;
            user-select: none;
            font-size: var(--now-global-font-size--md, 14px);
            color: rgb(var(--now-color_text--primary));
        }
        .we-compact-submenu-trigger:hover { background: rgb(var(--now-dropdown-list_search--background-color--hover)); }
        .we-compact-submenu-arrow { font-size: 0.625rem; opacity: 0.5; display: inline-block; transition: transform 0.15s; flex-shrink: 0; }
        .we-compact-submenu-arrow--open { transform: rotate(90deg); }
        .we-compact-submenu-panel {
            background: rgba(var(--now-color--neutral-0), 0.04);
            border-top: 1px solid rgba(var(--now-color--neutral-0), 0.07);
            border-bottom: 1px solid rgba(var(--now-color--neutral-0), 0.07);
            max-height: 50vh;
            overflow-y: auto;
        }
        .we-compact-submenu-panel .we-dropdown-item,
        .we-compact-submenu-panel .we-dropdown-empty { padding-left: 1.25rem; }
        .we-compact-submenu-panel .we-version-row { display: flex; flex-direction: column; gap: 0; width: 100%; }
        .we-compact-submenu-panel .we-version-col-date,
        .we-compact-submenu-panel .we-version-col-uset,
        .we-compact-submenu-panel .we-version-col-user { white-space: normal; }
        .we-dropdown-item.disabled { opacity: 0.45; cursor: default; pointer-events: none; }
        @media (max-width: 1199px) {
            .we-header-wide-only { display: none !important; }
            .we-compact-menu { display: block; }
        }

        /* Body */
        .we-body {
            flex: 1;
            display: flex;
            flex-direction: row;
            overflow: hidden;
        }

        /* Panes */
        .we-pane {
            display: flex;
            flex-direction: column;
            overflow: hidden;
            min-width: 3.75rem;
            flex-shrink: 0;
        }
        @media (prefers-reduced-motion: no-preference) {
        .we-pane.we-pane-flash .we-pane-editor::after {
            content: '';
            position: absolute;
            inset: 0;
            pointer-events: none;
            background-color: rgba(var(--now-color--primary-2, 0 118 204), 0.22);
            box-shadow: inset 0 0 0 1px rgba(var(--now-color--primary-2, 0 118 204), 0.45);
            opacity: 0;
            animation: we-pane-flash-once 340ms ease-out 1;
        }
        }
        @keyframes we-pane-flash-once {
            0% {
                opacity: 0;
            }
            30% {
                opacity: 1;
            }
            100% {
                opacity: 0;
            }
        }

        .we-pane-header {
            background: rgb(var(--now-color_background--secondary));
            border-bottom: 1px solid rgba(var(--now-color--neutral-0), 0.08);
            padding: 0.25rem 0.625rem;
            display: flex;
            align-items: center;
            gap: 0.375rem;
            flex-shrink: 0;
            min-height: 2rem;
        }

        .we-pane-header--dirty {
            box-shadow: inset 0px -1px 0px 0px rgb(var(--we-unsaved-color));
        }

        .we-pane-title {
            color: rgb(var(--now-color_text--secondary));
            font-weight: 500;
            white-space: nowrap;
            letter-spacing: 0.1px;
        }

        .we-pane-unsaved-dot {
            display: inline-flex;
            align-items: center;
            color: rgb(var(--we-unsaved-color));
            margin-left: 0.1875rem;
            flex-shrink: 0;
            line-height: 1;
        }
        .we-pane-unsaved-dot::before { content: '\\25CF'; }

        .we-status-dot {
            display: inline-flex;
            align-items: center;
            margin-left: 0.3125rem;
            flex-shrink: 0;
            line-height: 1;
            font-size: 0.625rem;
        }
        .we-status-dot::before { content: '\\25CF'; }
        .we-status-dot--green { color: rgb(var(--now-alert--success--color, var(--now-color_alert--low-3))); }

        .we-pane-id-input {
            width: 10rem;
        }

        .we-pane-editor {
            flex: 1;
            overflow: hidden;
            position: relative;
        }


        /* Pane subheader (template/provider Name + Type row, sits between pane header and editor) */
        .we-pane-subheader {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            gap: 0.375rem;
            padding: 0.3125rem 0.5rem;
            background: rgb(var(--now-color_background--secondary));
            border-bottom: 1px solid rgba(var(--now-color--neutral-0), 0.08);
        }

        .we-pane-subheader-name-row {
            flex: 1 1 0;
            min-width: 0;
            display: flex;
            align-items: center;
            gap: 0.375rem;
        }

        .we-pane-id-input {
            flex: 1 1 0;
            min-width: 4rem;
        }

        /* Inline type controls — visible alongside name row when space allows */
        .we-pane-subheader-type-row {
            display: flex;
            align-items: center;
            gap: 0.375rem;
            flex-shrink: 0;
        }
        .we-pane-type-select { flex-shrink: 0; width: auto; }

        /* Overflow type menu button — hidden unless type row is hidden */
        .we-pane-type-overflow-wrap { display: none; position: relative; }
        .we-pane-subheader--type-overflow .we-pane-subheader-type-row { display: none; }
        .we-pane-subheader--type-overflow .we-pane-type-overflow-wrap { display: block; }

        .we-pane-type-overflow-btn.btn {
            padding: 0 0.25rem;
            height: 1.625rem;
            width: 1.625rem;
        }

        .we-pane-type-overflow-menu {
            min-width: 12rem;
            padding: 0.5rem;
        }

        .we-pane-type-overflow-row {
            display: flex;
            align-items: center;
            gap: 0.375rem;
        }
        .we-pane-type-overflow-row .we-pane-type-select {
            flex: 1 1 0;
            min-width: 0;
            width: auto;
        }

        .we-pane-meta-label {
            font-size: var(--now-font-size--xs);
            color: rgb(var(--now-color_text--tertiary));
            white-space: nowrap;
            margin: 0;
        }

        /* ES12 toggle in pane header right group */
        .we-pane-es12 {
            margin-right: 0.25rem;
        }

        /* Monaco popup overrides
           fixedOverflowWidgets:true causes Monaco to append suggest/hover widgets.
           Override backgrounds so they're readable against the dark theme. */
        .monaco-editor .suggest-widget,
        .monaco-editor-overflowing-widgets .suggest-widget {
            background-color: rgb(var(--now-color_background--tertiary)) !important;
            border: 1px solid rgba(var(--now-color--neutral-0), 0.12) !important;
        }
        .monaco-editor .suggest-widget .monaco-list-row,
        .monaco-editor-overflowing-widgets .suggest-widget .monaco-list-row {
            background-color: rgb(var(--now-color_background--tertiary));
            color: rgb(var(--now-color_text--primary));
        }
        .monaco-editor .suggest-widget .monaco-list-row.focused,
        .monaco-editor-overflowing-widgets .suggest-widget .monaco-list-row.focused {
            background-color: rgba(var(--now-color--primary-1), 0.25);
            color: rgb(var(--now-color--neutral-0));
        }
        .monaco-editor .monaco-hover,
        .monaco-editor-overflowing-widgets .monaco-hover {
            background-color: rgb(var(--now-color_background--tertiary)) !important;
            border: 1px solid rgba(var(--now-color--neutral-0), 0.12) !important;
            color: rgb(var(--now-color_text--primary)) !important;
        }
        .monaco-editor .monaco-hover .hover-row,
        .monaco-editor-overflowing-widgets .monaco-hover .hover-row {
            background-color: rgb(var(--now-color_background--tertiary));
        }
        .monaco-editor .parameter-hints-widget,
        .monaco-editor-overflowing-widgets .parameter-hints-widget {
            background-color: rgb(var(--now-color_background--tertiary)) !important;
            border: 1px solid rgba(var(--now-color--neutral-0), 0.12) !important;
            color: rgb(var(--now-color_text--primary)) !important;
        }

        /* Code action (lightbulb) popup */
        .action-widget { min-width: 15.625rem !important; }

        /* Breakpoint glyph in server-script editor */
        .we-breakpoint-glyph {
            background: #e51400;
            border-radius: 50%;
            width: 0.625rem !important;
            height: 0.625rem !important;
            margin-top: 0.1875rem;
            margin-left: 0.1875rem;
        }

        /* Translucent ghost glyph shown on gutter hover (potential breakpoint) */
        .we-breakpoint-glyph-ghost {
            background: rgba(229, 20, 0, 0.35);
            border-radius: 50%;
            width: 0.625rem !important;
            height: 0.625rem !important;
            margin-top: 0.1875rem;
            margin-left: 0.1875rem;
        }


        /* Find References modal */
        #we-ref-panel { align-items: flex-start; padding-top: 3.75rem; }
        .we-ref-modal { width: min(32.5rem, 95vw) !important; max-height: 33.75rem; display: flex; flex-direction: column; }
        .we-ref-body { overflow-y: auto; flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 0 !important; }
        .we-ref-searching { color: rgb(var(--now-color_text--secondary)); font-style: italic; }
        .we-ref-none { color: rgb(var(--now-color--negative-2, 210 0 0)); }
        .we-ref-count { font-size: var(--now-font-size--sm); color: rgb(var(--now-color_text--secondary)); margin-bottom: 0.5rem; }
        .we-ref-item {
            display: flex;
            align-items: baseline;
            gap: 0.625rem;
            padding: 0.375rem 0;
            border-bottom: 1px solid rgba(var(--now-color--neutral-0), 0.06);
        }
        .we-ref-item:last-child { border-bottom: none; }
        .we-ref-label {
            flex-shrink: 0;
            margin-left: auto;
            color: rgb(var(--now-color_text--tertiary));
            background: rgba(var(--now-color--neutral-0), 0.06);
            padding: 0.0625rem 0.625rem;
            border-radius: var(--now-badge--border-radius);
            min-width: 6rem;
            text-align: center;
        }
        .we-ref-item a {
            color: rgb(var(--now-color--primary-2, 0 118 204));
            text-decoration: none;
            word-break: break-all;
        }
        .we-ref-item a:hover { text-decoration: underline; }

        /* Burger / right-aligned dropdown */
        .we-dropdown-menu-right {
            right: 0;
            left: auto;
        }

        /* Pane header icon buttons */
        .we-pane-icon-btn {
            background-color: transparent;
            border: none;
            cursor: pointer;
            padding: 0;
            border-radius: var(--now-button--border-radius);
            flex-shrink: 0;
            width: 1.875rem;
            height: 1.875rem;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.1s;
        }
        .we-pane-icon-btn:hover { background-color: rgba(var(--now-color--neutral-0), 0.07); }

        /* Shared mask icon style — color controlled via background-color */
        .we-icon {
            display: block;
            width: 1.5rem;
            height: 1.5rem;
            background-color: rgba(var(--now-color_text--primary), 0.4);
            -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
            -webkit-mask-position: center;
            mask-position: center;
            -webkit-mask-size: contain;
            mask-size: contain;
        }
        .we-pane-icon-btn:hover .we-icon { background-color: currentColor; }
        .we-pane-icon-btn--danger:hover .we-icon { background-color: rgb(var(--now-alert--critical--color, var(--now-color_alert--critical-3))) !important; }

        .we-icon-secondary { background-color: rgb(var(--now-badge--secondary_gray--color)) !important; }

        .we-icon-delete   { -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 640'%3E%3Cpath d='M208 0C199.2 0 192 7.2 192 16C192 24.8 199.2 32 208 32L432 32C440.8 32 448 24.8 448 16C448 7.2 440.8 0 432 0L208 0zM64 64C46.3 64 32 78.3 32 96C32 113.7 46.3 128 64 128L576 128C593.7 128 608 113.7 608 96C608 78.3 593.7 64 576 64L64 64zM88 160L552 160L552 544C552 562.1 537.7 576 520 576L120 576C102.3 576 88 562.1 88 544L88 160zM216 224C198.3 224 184 238.3 184 256L184 480C184 497.7 198.3 512 216 512C233.7 512 248 497.7 248 480L248 256C248 238.3 233.7 224 216 224zM320 224C302.3 224 288 238.3 288 256L288 480C288 497.7 302.3 512 320 512C337.7 512 352 497.7 352 480L352 256C352 238.3 337.7 224 320 224zM424 224C406.3 224 392 238.3 392 256L392 480C392 497.7 406.3 512 424 512C441.7 512 456 497.7 456 480L456 256C456 238.3 441.7 224 424 224z'/%3E%3C/svg%3E"); mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 640'%3E%3Cpath d='M208 0C199.2 0 192 7.2 192 16C192 24.8 199.2 32 208 32L432 32C440.8 32 448 24.8 448 16C448 7.2 440.8 0 432 0L208 0zM64 64C46.3 64 32 78.3 32 96C32 113.7 46.3 128 64 128L576 128C593.7 128 608 113.7 608 96C608 78.3 593.7 64 576 64L64 64zM88 160L552 160L552 544C552 562.1 537.7 576 520 576L120 576C102.3 576 88 562.1 88 544L88 160zM216 224C198.3 224 184 238.3 184 256L184 480C184 497.7 198.3 512 216 512C233.7 512 248 497.7 248 480L248 256C248 238.3 233.7 224 216 224zM320 224C302.3 224 288 238.3 288 256L288 480C288 497.7 302.3 512 320 512C337.7 512 352 497.7 352 480L352 256C352 238.3 337.7 224 320 224zM424 224C406.3 224 392 238.3 392 256L392 480C392 497.7 406.3 512 424 512C441.7 512 456 497.7 456 480L456 256C456 238.3 441.7 224 424 224z'/%3E%3C/svg%3E"); }

        .we-icon-format   { -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 640'%3E%3Cpath d='M384 128C384 145.7 369.7 160 352 160L128 160C110.3 160 96 145.7 96 128C96 110.3 110.3 96 128 96L352 96C369.7 96 384 110.3 384 128zM384 384C384 401.7 369.7 416 352 416L128 416C110.3 416 96 401.7 96 384C96 366.3 110.3 352 128 352L352 352C369.7 352 384 366.3 384 384zM96 256C96 238.3 110.3 224 128 224L512 224C529.7 224 544 238.3 544 256C544 273.7 529.7 288 512 288L128 288C110.3 288 96 273.7 96 256zM544 512C544 529.7 529.7 544 512 544L128 544C110.3 544 96 529.7 96 512C96 494.3 110.3 480 128 480L512 480C529.7 480 544 494.3 544 512z'/%3E%3C/svg%3E"); mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 640'%3E%3Cpath d='M384 128C384 145.7 369.7 160 352 160L128 160C110.3 160 96 145.7 96 128C96 110.3 110.3 96 128 96L352 96C369.7 96 384 110.3 384 128zM384 384C384 401.7 369.7 416 352 416L128 416C110.3 416 96 401.7 96 384C96 366.3 110.3 352 128 352L352 352C369.7 352 384 366.3 384 384zM96 256C96 238.3 110.3 224 128 224L512 224C529.7 224 544 238.3 544 256C544 273.7 529.7 288 512 288L128 288C110.3 288 96 273.7 96 256zM544 512C544 529.7 529.7 544 512 544L128 544C110.3 544 96 529.7 96 512C96 494.3 110.3 480 128 480L512 480C529.7 480 544 494.3 544 512z'/%3E%3C/svg%3E"); }
        .we-icon-debugger { -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 640'%3E%3Cpath d='M224 160C224 107 267 64 320 64C373 64 416 107 416 160L416 163.6C416 179.3 403.3 192 387.6 192L252.5 192C236.8 192 224.1 179.3 224.1 163.6L224.1 160zM569.6 172.8C580.2 186.9 577.3 207 563.2 217.6L465.4 290.9C470.7 299.8 474.7 309.6 477.2 320L576 320C593.7 320 608 334.3 608 352C608 369.7 593.7 384 576 384L480 384L480 416C480 418.6 479.9 421.3 479.8 423.9L563.2 486.4C577.3 497 580.2 517.1 569.6 531.2C559 545.3 538.9 548.2 524.8 537.6L461.7 490.3C438.5 534.5 395.2 566.5 344 574.2L344 344C344 330.7 333.3 320 320 320C306.7 320 296 330.7 296 344L296 574.2C244.8 566.5 201.5 534.5 178.3 490.3L115.2 537.6C101.1 548.2 81 545.3 70.4 531.2C59.8 517.1 62.7 497 76.8 486.4L160.2 423.9C160.1 421.3 160 418.7 160 416L160 384L64 384C46.3 384 32 369.7 32 352C32 334.3 46.3 320 64 320L162.8 320C165.3 309.6 169.3 299.8 174.6 290.9L76.8 217.6C62.7 207 59.8 186.9 70.4 172.8C81 158.7 101.1 155.8 115.2 166.4L224 248C236.3 242.9 249.8 240 264 240L376 240C390.2 240 403.7 242.8 416 248L524.8 166.4C538.9 155.8 559 158.7 569.6 172.8z'/%3E%3C/svg%3E"); mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 640'%3E%3Cpath d='M224 160C224 107 267 64 320 64C373 64 416 107 416 160L416 163.6C416 179.3 403.3 192 387.6 192L252.5 192C236.8 192 224.1 179.3 224.1 163.6L224.1 160zM569.6 172.8C580.2 186.9 577.3 207 563.2 217.6L465.4 290.9C470.7 299.8 474.7 309.6 477.2 320L576 320C593.7 320 608 334.3 608 352C608 369.7 593.7 384 576 384L480 384L480 416C480 418.6 479.9 421.3 479.8 423.9L563.2 486.4C577.3 497 580.2 517.1 569.6 531.2C559 545.3 538.9 548.2 524.8 537.6L461.7 490.3C438.5 534.5 395.2 566.5 344 574.2L344 344C344 330.7 333.3 320 320 320C306.7 320 296 330.7 296 344L296 574.2C244.8 566.5 201.5 534.5 178.3 490.3L115.2 537.6C101.1 548.2 81 545.3 70.4 531.2C59.8 517.1 62.7 497 76.8 486.4L160.2 423.9C160.1 421.3 160 418.7 160 416L160 384L64 384C46.3 384 32 369.7 32 352C32 334.3 46.3 320 64 320L162.8 320C165.3 309.6 169.3 299.8 174.6 290.9L76.8 217.6C62.7 207 59.8 186.9 70.4 172.8C81 158.7 101.1 155.8 115.2 166.4L224 248C236.3 242.9 249.8 240 264 240L376 240C390.2 240 403.7 242.8 416 248L524.8 166.4C538.9 155.8 559 158.7 569.6 172.8z'/%3E%3C/svg%3E"); }
        .we-icon-ext-link { -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 640'%3E%3Cpath d='M384 64C366.3 64 352 78.3 352 96C352 113.7 366.3 128 384 128L466.7 128L265.3 329.4C252.8 341.9 252.8 362.2 265.3 374.7C277.8 387.2 298.1 387.2 310.6 374.7L512 173.3L512 256C512 273.7 526.3 288 544 288C561.7 288 576 273.7 576 256L576 96C576 78.3 561.7 64 544 64L384 64zM144 160C99.8 160 64 195.8 64 240L64 496C64 540.2 99.8 576 144 576L400 576C444.2 576 480 540.2 480 496L480 416C480 398.3 465.7 384 448 384C430.3 384 416 398.3 416 416L416 496C416 504.8 408.8 512 400 512L144 512C135.2 512 128 504.8 128 496L128 240C128 231.2 135.2 224 144 224L224 224C241.7 224 256 209.7 256 192C256 174.3 241.7 160 224 160L144 160z'/%3E%3C/svg%3E"); mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 640'%3E%3Cpath d='M384 64C366.3 64 352 78.3 352 96C352 113.7 366.3 128 384 128L466.7 128L265.3 329.4C252.8 341.9 252.8 362.2 265.3 374.7C277.8 387.2 298.1 387.2 310.6 374.7L512 173.3L512 256C512 273.7 526.3 288 544 288C561.7 288 576 273.7 576 256L576 96C576 78.3 561.7 64 544 64L384 64zM144 160C99.8 160 64 195.8 64 240L64 496C64 540.2 99.8 576 144 576L400 576C444.2 576 480 540.2 480 496L480 416C480 398.3 465.7 384 448 384C430.3 384 416 398.3 416 416L416 496C416 504.8 408.8 512 400 512L144 512C135.2 512 128 504.8 128 496L128 240C128 231.2 135.2 224 144 224L224 224C241.7 224 256 209.7 256 192C256 174.3 241.7 160 224 160L144 160z'/%3E%3C/svg%3E"); }
        .we-icon-unlink   { -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 640'%3E%3Cpath d='M73 39.1C63.6 29.7 48.4 29.7 39.1 39.1C29.8 48.5 29.7 63.7 39 73.1L567 601.1C576.4 610.5 591.6 610.5 600.9 601.1C610.2 591.7 610.3 576.5 600.9 567.2L478.9 445.2C483.1 441.8 487.2 438.1 491 434.3L562.1 363.2C591.4 333.9 607.9 294.1 607.9 252.6C607.9 166.2 537.9 96.1 451.4 96.1C414.1 96.1 378.3 109.4 350.1 133.3C370.4 143.4 388.8 156.8 404.6 172.8C418.7 164.5 434.8 160.1 451.4 160.1C502.5 160.1 543.9 201.5 543.9 252.6C543.9 277.1 534.2 300.6 516.8 318L445.7 389.1C441.8 393 437.6 396.5 433.1 399.6L385.6 352.1C402.1 351.2 415.3 337.7 415.8 321C415.8 319.7 415.8 318.4 415.8 317.1C415.8 230.8 345.9 160.2 259.3 160.2C240.1 160.2 221.4 163.7 203.8 170.4L73 39.1zM257.9 224C258.5 224 259 224 259.6 224C274.7 224 289.1 227.7 301.7 234.2C303.5 235.4 305.3 236.5 307.2 237.3C334 253.6 352 283.2 352 316.9C352 317.3 352 317.7 352 318.1L257.9 224zM378.2 480L224 325.8C225.2 410.4 293.6 478.7 378.1 479.9zM171.7 273.5L126.4 228.2L77.8 276.8C48.5 306.1 32 345.9 32 387.4C32 473.8 102 543.9 188.5 543.9C225.7 543.9 261.6 530.6 289.8 506.7C269.5 496.6 251 483.2 235.2 467.2C221.2 475.4 205.1 479.8 188.5 479.8C137.4 479.8 96 438.4 96 387.3C96 362.8 105.7 339.3 123.1 321.9L171.7 273.3z'/%3E%3C/svg%3E"); mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 640'%3E%3Cpath d='M73 39.1C63.6 29.7 48.4 29.7 39.1 39.1C29.8 48.5 29.7 63.7 39 73.1L567 601.1C576.4 610.5 591.6 610.5 600.9 601.1C610.2 591.7 610.3 576.5 600.9 567.2L478.9 445.2C483.1 441.8 487.2 438.1 491 434.3L562.1 363.2C591.4 333.9 607.9 294.1 607.9 252.6C607.9 166.2 537.9 96.1 451.4 96.1C414.1 96.1 378.3 109.4 350.1 133.3C370.4 143.4 388.8 156.8 404.6 172.8C418.7 164.5 434.8 160.1 451.4 160.1C502.5 160.1 543.9 201.5 543.9 252.6C543.9 277.1 534.2 300.6 516.8 318L445.7 389.1C441.8 393 437.6 396.5 433.1 399.6L385.6 352.1C402.1 351.2 415.3 337.7 415.8 321C415.8 319.7 415.8 318.4 415.8 317.1C415.8 230.8 345.9 160.2 259.3 160.2C240.1 160.2 221.4 163.7 203.8 170.4L73 39.1zM257.9 224C258.5 224 259 224 259.6 224C274.7 224 289.1 227.7 301.7 234.2C303.5 235.4 305.3 236.5 307.2 237.3C334 253.6 352 283.2 352 316.9C352 317.3 352 317.7 352 318.1L257.9 224zM378.2 480L224 325.8C225.2 410.4 293.6 478.7 378.1 479.9zM171.7 273.5L126.4 228.2L77.8 276.8C48.5 306.1 32 345.9 32 387.4C32 473.8 102 543.9 188.5 543.9C225.7 543.9 261.6 530.6 289.8 506.7C269.5 496.6 251 483.2 235.2 467.2C221.2 475.4 205.1 479.8 188.5 479.8C137.4 479.8 96 438.4 96 387.3C96 362.8 105.7 339.3 123.1 321.9L171.7 273.3z'/%3E%3C/svg%3E"); }
        .we-icon-ellipsis { -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 640'%3E%3Ccircle cx='320' cy='320' r='64'/%3E%3Ccircle cx='96' cy='320' r='64'/%3E%3Ccircle cx='544' cy='320' r='64'/%3E%3C/svg%3E"); mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 640'%3E%3Ccircle cx='320' cy='320' r='64'/%3E%3Ccircle cx='96' cy='320' r='64'/%3E%3Ccircle cx='544' cy='320' r='64'/%3E%3C/svg%3E"); }

        /* Related Lists Modal */
        .we-related-modal { width: 96vw !important; max-width: 100rem !important; height: 88vh; display: flex; flex-direction: column; }
        .we-related-body  { flex: 1; overflow: auto; width: calc(100% - var(--now-global-space--xl, 20px)); margin: 0 auto; }
        .we-related-modal .data_list_table { width: 100%; border-collapse: collapse; }
        .we-related-modal .data_list_table thead th { padding: 0.625rem 0.75rem; text-align: left; font-weight: 600; border-bottom: 1px solid rgba(var(--now-color--neutral-0), 0.12); background: rgb(var(--now-color_background--primary)); color: rgb(var(--now-color_text--secondary)); white-space: nowrap; }
        .we-related-modal .data_list_table tbody td { padding: 0.625rem 0.75rem; border-bottom: 1px solid rgba(var(--now-color--neutral-0), 0.07); vertical-align: top; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 20rem; }
        .we-related-modal .data_list_table tbody tr:hover td { background: RGBA(var(--now-color--primary-0, 221,237,233), 0.5); }
        .we-related-modal .data_list_table td a { color: rgb(var(--now-color--primary-1)); text-decoration: none; }
        .we-related-modal .data_list_table td a:hover { text-decoration: underline; }
        .we-related-pagination { display: flex; align-items: center; justify-content: center; gap: 4px; padding: 6px 10px; border-top: 1px solid rgba(var(--now-color--neutral-0), 0.12); flex-shrink: 0; height: 44px; }
        .we-pg-btn.btn { height: 32px; width: 32px; padding: 0; display: inline-flex !important; align-items: center; justify-content: center; background: transparent !important; border: none !important; color: RGB(var(--now-color--primary-1)) !important; font-size: 1rem; }
        .we-pg-btn.btn:disabled { opacity: 0.25; pointer-events: none; }
        .we-pg-info { font-size: 14px; color: rgb(var(--now-color_text--primary)); white-space: nowrap; display: inline-flex; align-items: center; gap: 0.375rem; }
        .we-pg-start-input.form-control { width: 4.5rem; height: 32px; padding: 0 4px 0 6px; text-align: center; background: rgb(var(--now-color_background--primary)); border: 0.8px solid rgb(126,133,146); border-radius: var(--now-form-field--border-radius); display: inline-block; -moz-appearance: textfield; }
        .we-pg-start-input.form-control::-webkit-inner-spin-button, .we-pg-start-input.form-control::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .list2_empty-state-list { display: grid; place-items: center; padding: 20px; }
        .we-related-empty { padding: 2rem 1rem; text-align: center; color: rgb(var(--now-color_text--tertiary)); }
        .we-related-loading-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem; background: rgb(var(--now-color_background--secondary)); z-index: 1; color: rgb(var(--now-color_text--tertiary)); }
        .we-related-table-container { background: rgb(var(--now-color_background--primary)); height: 100%; }

        /* User Preferences modal */
        .we-modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 980;
        }
        .we-modal {
            background: rgb(var(--now-color_background--secondary));
            border: 1px solid rgba(var(--now-color--neutral-0), 0.1);
            border-radius: var(--now-modal--border-radius);
            width: 22.5rem;
            max-width: 90vw;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            color: rgb(var(--now-color_text--primary));
            box-shadow: 0 12px 48px rgba(0,0,0,0.7);
        }
        .we-modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.75rem 1rem;
            border-bottom: 1px solid rgba(var(--now-color--neutral-0), 0.08);
            font-size: var(--now-font-size--lg);
            font-weight: 600;
            flex-shrink: 0;
        }
        .we-modal-close { cursor: pointer; font-size: var(--now-font-size--lg); color: rgba(var(--now-color_text--primary), 0.45); line-height: 1; align-self: flex-start; }
        .we-modal-close:hover { color: rgb(var(--now-button--secondary--color--hover)); }
        .close { font-size: 1.5rem; transform: scale(1); transition: transform 0.15s ease; }
        .close:hover { background: none; transform: scale(1.2); }
        .we-modal-body { padding: 1rem; overflow-y: auto; flex: 1 1 auto; }
        .we-modal-pref .we-modal-body { display: flex; flex-direction: column; gap: 1.25rem; }

        /* Modal enter/leave animations — skipped if user prefers reduced motion */
        @media (prefers-reduced-motion: no-preference) {
            @keyframes we-overlay-in  { from { opacity: 0; } to { opacity: 1; } }
            @keyframes we-overlay-out { to   { opacity: 0; } }
            @keyframes we-modal-in {
                from { transform: scale(0.95) translateY(-2rem); }
                to   { transform: scale(1) translateY(0); }
            }
            @keyframes we-modal-out {
                to   { transform: scale(0.95) translateY(-2rem); }
            }

            /* Play on DOM insertion (ng-if becoming true) */
            .we-modal-overlay { animation: we-overlay-in 0.18s ease both; }
            /* backwards: holds 'from' at t=0 (no flash), releases after end (drag works) */
            .we-modal-overlay > .we-modal { animation: we-modal-in 0.22s ease backwards; }

            /* Play when JS adds the leaving class before ng-if removes the element */
            .we-modal-overlay--leaving { animation: we-overlay-out 0.15s ease forwards; pointer-events: none; }
            .we-modal-overlay--leaving > .we-modal { animation: we-modal-out 0.15s ease forwards; }
        }

        /* Draggable modal header — grab cursor; restored for interactive children */
        .we-modal-header { cursor: grab; user-select: none; }
        .we-modal-header:active { cursor: grabbing; }
        .we-modal--dragging,
        .we-modal--dragging .we-modal-header { cursor: grabbing !important; }
        .we-modal-header button,
        .we-modal-header a,
        .we-modal-header [role="button"] { cursor: pointer; user-select: auto; }
        .we-modal-section-title {
            font-size: var(--now-font-size--sm);
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.07em;
            color: rgba(var(--now-color_text--primary), 0.75);
            margin-top: 0.25rem;
        }
        .we-modal-option { padding: 0.1875rem 0; }
        .we-modal-option label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; line-height: 1.25 !important }
        .we-modal-option-row { display: flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0; }
        .we-modal-option-label { color: rgb(var(--now-color_text--secondary)); flex: 0 0 11rem; }
        .we-pref-select { height: 1.625rem; padding: 0 0.5rem; flex: 1; }
        .we-pref-number {padding: 0 0.25rem; width: 2.875rem;
            border: none; border-radius: 0; text-align: center;
            -moz-appearance: textfield; }
        .we-pref-number::-webkit-outer-spin-button,
        .we-pref-number::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .we-pref-number:focus { outline: none; }
        .we-spin-wrap {
            display: inline-flex;
            align-items: stretch;
            height: 1.625rem;
            border: 1px solid rgba(var(--now-color--neutral-0), 0.18);
            border-radius: var(--now-form-field--border-radius);
            overflow: hidden;
        }
        button.we-spin-btn {
            width: 1.625rem;
            min-height: auto;
            max-height: none;
            flex-shrink: 0;
            background-color: rgba(var(--now-color_background--primary, var(--now-color--neutral-0)));
            border-color: rgb(var(--now-button--secondary--border-color, var(--now-color--neutral-7)));
            border-width: var(--now-button--secondary--border-width, var(--now-button--border-width, var(--now-actionable--border-width, 1px)));
            color: rgb(var(--now-button--secondary--color, var(--now-color--neutral-18)));
            cursor: pointer;
            font-size: 1em;
            line-height: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            user-select: none;
            transition: background 0.1s;
        }
        .we-spin-btn:hover {
            background-color: rgba(var(--now-button--secondary--background-color--hover, var(--now-color--neutral-3)), var(--now-button--secondary--background-color-alpha--hover, var(--now-button--secondary--background-color-alpha, 1)));
            border-color: rgb(var(--now-button--secondary--border-color--hover, var(--now-button--secondary--border-color, var(--now-color--neutral-7))));
            box-shadow: 0 2px 4px 0 RGBA(56, 56, 56, .25);
            color: rgb(var(--now-button--secondary--color--hover, var(--now-color--secondary-2)));
         }
        .we-spin-btn:active { 
            background-color: rgba(var(--now-button--secondary--background-color--active, var(--now-color--neutral-5)), var(--now-button--secondary--background-color-alpha--active, var(--now-button--secondary--background-color-alpha, 1)));
            border-color: rgb(var(--now-button--secondary--border-color--active, var(--now-button--secondary--border-color, var(--now-color--neutral-7))));
            box-shadow: none;
            color: rgb(var(--now-button--secondary--color--active, var(--now-color--secondary-3)));
        }
        .we-spin-dec { border-right: 1px solid rgba(var(--now-color--neutral-0), 0.12); }
        .we-spin-inc { border-left:  1px solid rgba(var(--now-color--neutral-0), 0.12); }
        .we-modal-section { margin-top: 0.875rem; display: flex; flex-direction: column; gap: 0.75rem; }
        .we-pref-hint { margin: 0.25rem 0 0 0; font-size: var(--now-font-size--sm); color: rgba(var(--now-color_text--secondary), 0.8); line-height: 1.4; }
        .we-pref-link { font-size: var(--now-font-size--sm); color: rgb(var(--now-color--primary-1)); text-decoration: none; }
        .we-pref-link:hover { text-decoration: underline; }
       
        .we-modal-footer {
            display: flex;
            justify-content: space-between;
            gap: 0.5rem;
            padding: 0.75rem 1rem;
            border-top: 1px solid rgba(var(--now-color--neutral-0), 0.08);
            flex-shrink: 0;
        }

        .we-modal-pref {
            width: min(48.75rem, 90vw);
        }
        .we-pref-columns {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0 1.75rem;
        }
        .we-pref-col { display: flex; flex-direction: column; }
        .we-pref-col > .we-modal-section:first-child { margin-top: 0; }
        @media (max-width: 500px) {
            .we-pref-columns { grid-template-columns: 1fr; }
        }

        /* Save / dirty indicators */
        .we-pane-save-btn {
            white-space: nowrap;
            line-height: 1.4;
            height: auto !important;
        }

        /* Compact form-control for header, pane header, and pane subheader */
        .we-header .form-control,
        .we-pane-header .form-control,
        .we-pane-subheader .form-control {
            height: 1.625rem;
        }

        .we-pane-saved-text {
            color: rgb(var(--now-color--primary-2));
        }

        .we-pane-infobar {
            flex-shrink: 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 0.5rem;
            padding: 0.3125rem 0.625rem;
            background: rgb(var(--now-alert--warning--background-color, var(--now-color_alert--warning-0)));
            border-bottom: 1px solid rgb(var(--now-alert--warning--border-color, var(--now-color_alert--warning-1)));
            color: rgb(var(--now-alert--warning--color, var(--now-color_alert--warning-4)));
            font-size: var(--now-font-size--sm);
        }

        .we-pane-infobar .we-pane-infobar-actions {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .we-pane-infobar .we-pane-save-btn {
            color: rgb(var(--now-alert--warning--color, var(--now-color_alert--warning-4)));
            background: rgb(var(--now-alert_button--background-color));
            border-color: rgb(var(--now-alert_button--border-color, var(--now-color_text--primary)));
        }

        .we-pane-infobar .we-pane-save-btn:hover {
            background: rgb(var(--now-alert_button--background-color--hover, var(--now-alert_button--background-color)));
            border-color: rgb(var(--now-alert_button--border-color--hover, var(--now-alert_button--border-color)));
        }

        .we-pane-infobar--critical {
            background: rgb(var(--now-alert--critical--background-color));
            border-color: rgb(var(--now-alert--critical--border-color));
            color: rgb(var(--now-color_text--secondary));
        }

        .we-pane-viewers {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            color: rgba(var(--now-color_text--primary), 0.55);
            cursor: default;
            white-space: nowrap;
        }

        .we-pane-viewers .icon-user-selected {
            flex-shrink: 0;
            vertical-align: middle;
            color: rgb(var(--now-color--primary-2));
        }

        .we-pane-viewers-count {
            background: rgba(var(--now-color--primary-1), 0.15);
            color: rgb(var(--now-color--primary-2));
            border-radius: var(--now-badge--border-radius);
            padding: 0.25em 0.5em;
            line-height: 1em;
            user-select: none;
        }

        .we-pane-right-actions {
            display: flex;
            align-items: center;
            gap: 0.375rem;
            overflow: hidden;
            flex-shrink: 1;
            min-width: 0;
        }

        .we-pane-close {
            cursor: pointer;
            color: rgba(var(--now-color_text--primary), 0.3);
            font-size: var(--now-font-size--lg);
            line-height: 1;
            padding: 0 0.125rem;
            flex-shrink: 0;
        }

        .we-pane-close:hover {
            color: rgb(var(--now-button--secondary--color--hover));
        }

        /* Splitter */
        .we-splitter {
            width: 3px;
            background: rgba(var(--now-color--neutral-0), 0.06);
            cursor: col-resize;
            flex-shrink: 0;
            transition: background 0.12s;
        }

        .we-splitter:hover,
        .we-splitter.dragging {
            background: rgb(var(--now-color--primary-2));
        }

        /* Loading */
        we-spinner { display: contents; }
        we-loader { display: inline-flex; align-items: center; justify-content: center; }
        @keyframes we-loader-spin { to { transform: rotate(360deg); } }
        .we-loader-icon {
            display: block;
            width: 1rem;
            height: 1rem;
            fill: RGB(var(--now-loader_icon--color, var(--now-loading_indicator--primary--color, var(--now-color--primary-1))));
            animation: we-loader-spin 0.75s linear infinite;
            transform-origin: center;
        }
        .we-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            height: 100%;
            color: rgba(var(--now-color_text--primary), 0.65);
            font-size: var(--now-font-size--lg);
        }

        .we-not-found {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            color: rgb(var(--now-color--text--tertiary));
        }
        .we-not-found-icon {
            color: rgb(var(--now-color_surface--brand-5));
        }
        .we-not-found-title {
            font-size: var(--now-font-size--lg);
            font-weight: 500;
            margin: 0;
        }

        /* Widget picker */
        .we-picker {
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 1;
        }
        .we-picker-box {
            background: rgb(var(--now-color_background--secondary));
            border: 1px solid rgba(var(--now-color--neutral-0), 0.1);
            border-radius: var(--now-modal--border-radius);
            width: min(35rem, 95vw);
            height: min(40rem, 75vh);
            display: flex;
            flex-direction: column;
            box-shadow: 0 16px 48px rgba(0,0,0,0.75);
        }

        .we-picker-body {
            display: flex;
            flex-direction: column;
            padding: 1rem 1rem 1.5rem 1rem;
            gap: 1rem;
            flex: 1;
            overflow: hidden;
        }

        .we-picker-body .we-link-list {
            height: auto;
            flex: 1;
        }

        .we-picker-title-row {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            padding: 0.625rem 0.75rem 0.625rem 1rem;
            border-bottom: 1px solid rgba(var(--now-color--neutral-0), 0.08);
            flex-shrink: 0;
            gap: 1rem;
        }
        .we-picker-title {
            font-size: var(--now-font-size--lg);
            font-weight: 600;
            color: rgb(var(--now-color_text--primary));
        }
        .we-picker-search {
            margin-top: -0.5rem;
            flex-shrink: 0;
            display: block;
            width: 100%;
        }
        .we-search-wrap {
            position: relative;
            flex-shrink: 0;
        }
        .we-picker-body .we-search-wrap { margin-top: -0.5rem; }
        .we-search-wrap .we-picker-search { margin-top: 0; padding-right: 2.25rem; }
        .we-search-loader {
            position: absolute;
            right: 0.5rem;
            top: 50%;
            transform: translateY(-50%);
            display: flex;
            align-items: center;
            pointer-events: none;
        }
        .we-picker-list { overflow-y: auto; flex: 1; }
        .we-link-empty { padding: 0.5rem 1rem; color: rgba(var(--now-color_text--primary), 0.65); }
        .we-picker-item {
            cursor: pointer;
            display: flex;
            align-items: baseline;
            gap: 0.625rem;
        }
        .we-picker-item:focus {
            outline: 2px solid rgba(var(--now-color--primary-2), 0.65);
            outline-offset: -2px;
        }
        .we-picker-item:focus:not(:focus-visible) {
            outline: none;
        }

        .we-picker-item .we-dropdown-ext-link {
            margin-left: auto;
            display: block;
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            transition: opacity 0.12s ease;
        }

        .we-picker-item:hover .we-dropdown-ext-link,
        .we-picker-item:focus-within .we-dropdown-ext-link {
            opacity: 1;
            visibility: visible;
            pointer-events: auto;
        }
		
        .we-picker-item-name { color: rgb(var(--now-color_text--primary)); }
        .we-picker-item-id { color: rgb(var(--now-color_text--tertiary)); font-size: var(--now-font-size--sm); }

        /* Modal overlay */
        .we-modal-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            z-index: 970;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        /* Search/picker modals: anchor to a fixed top position so the input
           never shifts as results load. Content expands downward. */
        .we-modal-anchored-top {
            align-items: flex-start;
            padding-top: 12vh;
        }

        .we-modal-box {
            background: rgb(var(--now-color_background--secondary));
            border: 1px solid rgba(var(--now-color--neutral-0), 0.1);
            border-radius: var(--now-modal--border-radius);
            display: flex;
            flex-direction: column;
            max-height: 90vh;
            box-shadow: 0 16px 48px rgba(0, 0, 0, 0.8);
        }

        .we-modal-title {
            padding: 0.875rem 1rem 0.625rem;
            font-size: var(--now-font-size--lg);
            font-weight: 600;
            color: rgb(var(--now-color_text--primary));
            border-bottom: 1px solid rgba(var(--now-color--neutral-0), 0.08);
            flex-shrink: 0;
        }

        .we-modal-body {
            padding: 1rem;
            color: rgb(var(--now-color_text--tertiary));
            line-height: 1.5;
        }

        .we-modal-actions {
            padding: 0.625rem 1rem 0.875rem;
            display: flex;
            gap: 0.5rem;
            justify-content: flex-start;
        }
        .we-modal-actions .btn-primary { margin-left: auto; order: 99; }

        /* Unsaved warning */
        .we-unsaved-warning {
            color: rgb(var(--we-unsaved-color));
            display: inline-flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 0.375rem;
            font-size: 0.75rem;
            line-height: 1;
            flex: 1 1 6rem;
            min-width: min-content;
        }
        .we-unsaved-compare { white-space: nowrap; }
        .we-unsaved-diff-btn {
            padding: 0;
            color: rgb(var(--we-unsaved-color));
            font-size: inherit;
            text-decoration: underline;
            border: none;
            background: none;
            cursor: pointer;
            height: auto;
        }
        .we-unsaved-diff-btn:hover { color: rgba(var(--we-unsaved-color), 0.8); }

        /* No write access label */
        .we-no-write-access {
            color: rgb(var(--now-alert--critical--color, var(--now-color_alert--critical-3)));
            font-size: 0.75rem;
            line-height: 1;
            min-width: min-content;
        }

        /* Last save time */
        .we-update-set-link { color: inherit; text-decoration: underline; text-decoration-style: dotted; }
        .we-update-set-link:hover { opacity: 0.75; }
        .we-last-save-time {
            display: flex;
            flex-direction: column;
            color: rgb(var(--now-color_text--tertiary, 114 114 114));
            font-size: 0.75rem;
            line-height: 1.2;
            margin-right: 0.5rem;
            text-align: right;
            text-underline-offset: 3px;
            flex: 1 1 6rem;
            min-width: 6rem;
        }

        /* Save error (header) */
        .we-save-error {
            color: rgb(var(--now-alert--critical--color, var(--now-color_alert--critical-3)));
            font-size: 0.75rem;
            line-height: 1.2;
            flex: 1 1 6rem;
            min-width: 6rem;
            cursor: default;
        }

        /* Save button lint indicators */
        .we-btn-save--error { box-shadow: 0 0 0 3px rgba(var(--now-alert--critical--color, var(--now-color_alert--critical-3)), 0.65) !important; }
        .we-btn-save--warn  { box-shadow: 0 0 0 3px rgba(var(--now-alert--warning--color, var(--now-color_alert--warning-4)), 0.65) !important; }

        /* Save error (pane header) */
        .we-pane-save-error {
            color: rgb(var(--now-alert--critical--color, var(--now-color_alert--critical-3)));
            white-space: nowrap;
            max-width: 11.25rem;
            overflow: hidden;
            text-overflow: ellipsis;
            cursor: default;
        }

        /* Light mode: boost opacity for elements that are heavily dimmed for dark mode.
           Class applied by JS reading the Polaris --now-color_background--primary variable. */
        html.we-light .we-field label {
            color: rgba(var(--now-color_text--primary), 0.75) !important;
        }
        html.we-light .we-pane-id-status {
            color: rgba(var(--now-color_text--primary), 0.75);
        }
        html.we-light .we-info-icon {
            color: rgba(var(--now-color_text--primary), 0.65);
        }
        html.we-light .we-pref-drag-handle {
            color: rgba(var(--now-color_text--primary), 0.6);
        }
        html.we-light .we-btn:disabled,
        html.we-light .we-btn[disabled] {
            opacity: 0.65;
        }
        html.we-light .we-field input[readonly],
        html.we-light .we-field input:disabled {
            opacity: 0.75;
        }
        html.we-light .we-pane-type-select:disabled {
            opacity: 0.75;
        }
        html.we-light { --we-unsaved-color: rgb(var(--now-color_surface--brand-6)); }
        html.we-light .we-header {
            background: rgb(var(--now-color_surface--brand-1));
        }
        .we-header.we-header--deprecated,
        html.we-light .we-header.we-header--deprecated {
            background: rgba(var(----now-alert--low--background-color, var(--now-color_alert--low-0)), 0.85);
        }
        .we-header.we-header--deprecated .icon-cog,
        .we-header.we-header--deprecated .icon-cog-selected,
        html.we-light .we-header.we-header--deprecated .icon-cog,
        html.we-light .we-header.we-header--deprecated .icon-cog-selected {
            color: rgb(var(--now-checkbox_required-indicator--color--invalid, var(--now-color_alert--critical-2))) !important;
        }
        .we-pane-header.we-pane-header--deprecated,
        html.we-light .we-pane-header.we-pane-header--deprecated {
            background: rgba(var(--now-color_alert--low-1), 0.85);
        }
        html.we-light .we-pane-header {
            background: rgb(var(--now-color_surface--brand-2));
        }
        html.we-light .we-pane {
            border: 1px solid rgba(var(--now-color--neutral-18), 0.15);
        }
        html.we-light .we-splitter {
            background: rgba(var(--now-color--neutral-18), 0.12);
        }

        /* Keyboard shortcuts modal */
        .we-modal-kbd { width: min(44rem, 92vw); }
        .we-kbd-sections { display: flex; flex-direction: column; gap: 1.25rem; }
        .we-kbd-table {
            width: 100%;
            border-collapse: collapse;
            font-size: var(--now-font-size--sm);
        }
        .we-kbd-table th {
            text-align: left;
            padding: 0.375rem 0.625rem;
            font-weight: 600;
            color: rgb(var(--now-color_text--secondary, 82 82 82));
            border-bottom: 1px solid rgba(var(--now-color--neutral-0, 0 0 0), 0.1);
            font-size: var(--now-global-font-size--md, 14px);
            text-transform: uppercase;
            letter-spacing: 0.4px;
            white-space: nowrap;
        }
        .we-kbd-table td {
            padding: 0.3125rem 0.625rem;
            border-bottom: 1px solid rgba(var(--now-color--neutral-0, 0 0 0), 0.05);
            vertical-align: middle;
        }
        .we-kbd-table tr:last-child td { border-bottom: none; }
        .we-kbd-table tbody tr:hover td {
            background: rgba(var(--now-color_text--primary, 29 29 29), 0.03);
        }
        .we-kbd-table .we-kbd-action { color: rgb(var(--now-color_text--primary, 29 29 29)); }
        .we-kbd-key {
            display: inline-block;
            font-family: 'Consolas', 'Menlo', 'Monaco', monospace;
            font-size: 0.75rem;
            padding: 0.0625rem 0.3125rem;
            border-radius: var(--now-badge--border-radius);
            background: rgba(var(--now-color_text--primary, 29 29 29), 0.06);
            color: rgb(var(--now-color_text--primary, 29 29 29));
            white-space: nowrap;
            line-height: 1.6;
        }
        .we-kbd-sep {
            color: rgba(var(--now-color_text--primary, 29 29 29), 0.4);
            margin: 0 0.125rem;
            font-size: 0.8em;
        }
        .we-kbd-mouse-list {
            display: flex;
            flex-direction: column;
            gap: 0.4375rem;
            font-size: var(--now-font-size--sm);
        }
        .we-kbd-mouse-item {
            display: flex;
            align-items: baseline;
            gap: 0.75rem;
        }
        .we-kbd-mouse-gesture {
            flex-shrink: 0;
            min-width: 14.5rem;
        }
        .we-kbd-mouse-desc {
            color: rgb(var(--now-color_text--secondary, 82 82 82));
        }
    </style>

    <!-- GlideEditor5Includes (in js_includes_doctype) sets getWorkerUrl to .js paths
         that don't work on this instance. Override to use the .bundle.min.jsx workers. -->
    <script>
        (function() {
            var b = '/scripts/snc-code-editor/';
            var s = '?sysparm_substitute=false';
            (window.MonacoEnvironment = window.MonacoEnvironment || {}).getWorkerUrl = function(id, label) {
                if (label === 'html')                                        return b + 'html.worker.bundle.min.jsx'   + s;
                if (label === 'css' || label === 'less' || label === 'scss') return b + 'css.worker.bundle.min.jsx'    + s;
                if (label === 'typescript' || label === 'javascript')        return b + 'ts.worker.bundle.min.jsx'     + s;
                return b + 'editor.worker.bundle.min.jsx' + s;
            };
        })();
    </script>

    <main ng-app="widgetEditor" ng-controller="WidgetEditorCtrl" ng-cloak="">

        <div class="we-app">

            <!-- Loading state -->
            <div class="we-loading" ng-if="loading">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
                    <defs>
                        <linearGradient id="we-gradient" gradientUnits="userSpaceOnUse" x1="-100%" y1="-100%" x2="0%" y2="0%">
                            <animate attributeName="x1" values="-100%; 100%" dur="3s" repeatCount="indefinite" />
                            <animate attributeName="y1" values="-100%; 100%" dur="3s" repeatCount="indefinite" />
                            <animate attributeName="x2" values="0%; 200%" dur="3s" repeatCount="indefinite" />
                            <animate attributeName="y2" values="0%; 200%" dur="3s" repeatCount="indefinite" />
                            <stop offset="0%" stop-color="currentColor" stop-opacity="0.4" />
                            <stop offset="50%" stop-color="currentColor" stop-opacity="1" />
                            <stop offset="100%" stop-color="currentColor" stop-opacity="0.4" />
                        </linearGradient>
                    </defs>
                    <style>
                        /* Monochrome setup inheriting text color */
                        .stroke-element {
                        fill: none;
                        stroke: url(#we-gradient);
                        stroke-width: 4;
                        stroke-linecap: round;
                        stroke-linejoin: round;
                        }
                        .fill-element {
                        fill: url(#we-gradient);
                        }

                        /* Animation assignments */
                        .container { animation: fadeOut 3s ease-in-out infinite; }
                        .frame     { animation: drawFrame 3s ease-in-out infinite; stroke-dasharray: 320; stroke-dashoffset: 320; }
                        .header    { animation: dropHeader 3s cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite; }
                        .block1    { animation: popBlock1 3s cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite; transform-origin: 32.5px 60px; }
                        .block2    { animation: popBlock2 3s cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite; transform-origin: 66px 47.5px; }
                        .block3    { animation: popBlock3 3s cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite; transform-origin: 66px 71px; }

                        /* Keyframes */
                        @keyframes drawFrame {
                        0%, 5% { stroke-dashoffset: 320; }
                        30%, 90% { stroke-dashoffset: 0; }
                        90.1%, 100% { stroke-dashoffset: 320; }
                        }
                        @keyframes dropHeader {
                        0%, 20% { opacity: 0; transform: translateY(-10px); }
                        35%, 90% { opacity: 1; transform: translateY(0); }
                        90.1%, 100% { opacity: 0; transform: translateY(-10px); }
                        }
                        @keyframes popBlock1 {
                        0%, 30% { opacity: 0; transform: scale(0.5); }
                        45%, 90% { opacity: 1; transform: scale(1); }
                        90.1%, 100% { opacity: 0; transform: scale(0.5); }
                        }
                        @keyframes popBlock2 {
                        0%, 40% { opacity: 0; transform: scale(0.5); }
                        55%, 90% { opacity: 1; transform: scale(1); }
                        90.1%, 100% { opacity: 0; transform: scale(0.5); }
                        }
                        @keyframes popBlock3 {
                        0%, 50% { opacity: 0; transform: scale(0.5); }
                        65%, 90% { opacity: 1; transform: scale(1); }
                        90.1%, 100% { opacity: 0; transform: scale(0.5); }
                        }
                        @keyframes fadeOut {
                        0%, 80% { opacity: 1; }
                        90%, 100% { opacity: 0; }
                        }
                    </style>

                    <g class="container">
                        <rect class="stroke-element frame" x="10" y="10" width="80" height="80" rx="8" />
                        
                        <g class="header">
                        <rect class="fill-element" x="20" y="22" width="60" height="12" rx="3" />
                        </g>
                        <g class="block1">
                        <rect class="fill-element" x="20" y="40" width="25" height="40" rx="3" />
                        </g>
                        <g class="block2">
                        <rect class="fill-element" x="52" y="40" width="28" height="15" rx="3" />
                        </g>
                        <g class="block3">
                        <rect class="fill-element" x="52" y="62" width="28" height="18" rx="3" />
                        </g>
                    </g>
                    </svg>
                <span ng-if="loadingWidgetName">Loading {{loadingWidgetName}}…</span>
                <span ng-if="!loadingWidgetName">Loading widget…</span>
            </div>

            <!-- Error state -->
            <div class="we-not-found" ng-if="loadError">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="72" height="72" aria-hidden="true" class="we-not-found-icon">
                    <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" stroke-width="5"/>
                    <circle cx="35" cy="40" r="5" fill="currentColor"/>
                    <circle cx="65" cy="40" r="5" fill="currentColor"/>
                    <path d="M32 68 Q50 54 68 68" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
                </svg>
                <p class="we-not-found-title">Widget not found</p>
                <button class="btn btn-default" ng-click="openWidgetPickerModal()">Open another widget</button>
            </div>


            <!-- Write permission error banner -->
            <div class="we-alert-bar we-alert-bar--critical" ng-if="!loading &amp;&amp; !loadError &amp;&amp; !showPicker &amp;&amp; !isVersionView &amp;&amp; hasWritePermissionError() &amp;&amp; !permissionAlertDismissed">
                <span><strong>Error:</strong>&nbsp;Unable to save widget (write permission denied).</span>
                <span class="close" ng-click="dismissPermissionAlert()" aria-label="Dismiss">×</span>
            </div>

            <!-- No write access info bar -->
            <div class="we-alert-bar we-alert-bar--critical" ng-if="!loading &amp;&amp; !loadError &amp;&amp; !showPicker &amp;&amp; !isVersionView &amp;&amp; !canWriteWidget &amp;&amp; !widgetSysPolicy">
                <span ng-if="!widget.scope_mismatch">No write access to this widget.</span>
                <span ng-if="widget.scope_mismatch">
                    Different application scope —&nbsp;<strong ng-bind="widget.application"></strong>.
                    <a class="we-alert-bar-link" ng-click="switchToWidgetScope()" style="margin-left: 0.3125rem;">Switch scope and reload</a>
                </span>
            </div>

            <!-- Version read-only banner -->
            <div class="we-version-banner we-alert-bar we-alert-bar--warning" ng-if="isVersionView">
                <span ng-bind-template="Viewing version from {{versionInfo.sys_created_on}} by {{versionInfo.sys_created_by}}"></span><span ng-if="versionInfo.update_set_name" ng-bind-template=" — {{versionInfo.update_set_name}}"></span> — Read Only
            </div>

            <!-- Widget reverted notification -->
            <div class="we-version-banner we-alert-bar we-alert-bar--warning" ng-if="widgetReverted">
                This widget has been reverted to a previous version.
                <a class="we-alert-bar-link" ng-click="reloadPage()">Reload</a>
            </div>

            <!-- sys_policy read-only/protected bar -->
            <div class="we-alert-bar we-alert-bar--critical" ng-if="!loading &amp;&amp; !loadError &amp;&amp; !showPicker &amp;&amp; !isVersionView &amp;&amp; widgetSysPolicy">
                <span>{{widget.name}} is {{widgetSysPolicyDisplay | lowercase}} and cannot be edited.</span>
            </div>

            <!-- ServiceNow widget bar -->
            <div class="we-alert-bar we-alert-bar--warning" ng-if="!loading &amp;&amp; !loadError &amp;&amp; !showPicker &amp;&amp; !isVersionView &amp;&amp; widgetIsServiceNow &amp;&amp; !snAlertDismissed">
                <span><strong>Warning:</strong>&nbsp;<i>{{widget.name}}</i>&nbsp;is a ServiceNow widget — <a class="we-alert-bar-link" ng-click="cloneWidget()">Clone widget</a></span>
                <span class="close" ng-click="dismissSnAlert()" aria-label="Dismiss">×</span>
            </div>

            <!-- Update set mismatch bar -->
            <div class="we-alert-bar" ng-if="!loading &amp;&amp; !loadError &amp;&amp; !showPicker &amp;&amp; !isVersionView &amp;&amp; updateSetMismatch &amp;&amp; !updateSetAlertDismissed">
                <span><strong>Notice:</strong>&nbsp;<i>{{widget.name}}</i>&nbsp;is currently being edited in the update set:&nbsp;<a class="we-alert-bar-link" ng-href="/nav_to.do?uri=sys_update_set.do%3Fsys_id%3D{{widgetUpdateSetId}}" target="_blank"><strong>{{widgetUpdateSetName}}</strong><span class="icon-open-document-new-tab" style="display: inline-block; margin-left: 4px;"></span></a></span>
                <span class="close" ng-click="dismissUpdateSetAlert()" aria-label="Dismiss">×</span>
            </div>

            <!-- Widget volatility risk bar -->
            <div class="we-alert-bar" ng-class="widgetVolatilityLevel === 'High' ? 'we-alert-bar--critical' : 'we-alert-bar--warning'" ng-if="!loading &amp;&amp; !loadError &amp;&amp; !showPicker &amp;&amp; !isVersionView &amp;&amp; widgetVolatilityLevel &amp;&amp; !volatilityAlertDismissed">
                <span><strong>Warning:</strong>&nbsp;<i>{{widget.name}}</i>&nbsp;is a&nbsp;<strong>{{widgetVolatilityDisplay}} Risk</strong>&nbsp;file that might get updated again in later releases. Do not alter this file unless necessary.</span>
                <span class="close" ng-click="dismissVolatilityAlert()" aria-label="Dismiss">×</span>
            </div>

            <!--  Header -->
            <div class="we-header" ng-class="{'we-header--deprecated': widget.deprecated}" ng-if="!loading &amp;&amp; !loadError &amp;&amp; !showPicker">

                <!-- Open widget -->
                <button class="btn btn-default" ng-click="openWidgetPickerModal()" title="Open another widget">Open…</button>
                <div class="we-header-sep"></div>

                <!-- Metadata fields -->
                <div class="we-header-group">
                    <div class="we-field we-field-with-popover">
                        <div class="we-field-label-row">
                            <label for="widget-name">Name</label>
                            <i class="we-info-icon" ng-class="{'icon-cog-selected': openDropdown === 'description' || descDropdownIconHover, 'icon-cog': !(openDropdown === 'description' || descDropdownIconHover)}" ng-mouseenter="descDropdownIconHover = true" ng-mouseleave="descDropdownIconHover = false" ng-click="toggleDropdown('description'); $event.stopPropagation()" ng-keydown="onDropdownTriggerKeydown($event, 'description')" title="More fields" tabindex="0" role="button" aria-haspopup="true" aria-expanded="{{openDropdown === 'description'}}"></i>
                            <span class="we-pane-unsaved-dot" ng-if="!isVersionView &amp;&amp; canWriteWidget &amp;&amp; headerDirty.name" title="Unsaved changes"></span>
                        </div>
                        <input type="text" class="form-control" id="widget-name" ng-model="widget.name" ng-readonly="isVersionView || !canWriteWidget" ng-class="{'we-input-invalid': nameInvalid}" />
                        <div class="we-popover" ng-if="openDropdown === 'description'" ng-click="$event.stopPropagation()" we-dropdown-auto-pos="we-dropdown-auto-pos">
                            <div class="we-field">
                                <div class="we-field-label-row">
                                    <label for="widget-description">
                                        <span>Description</span>
                                        <span class="we-pane-unsaved-dot" ng-if="!isVersionView &amp;&amp; canWriteWidget &amp;&amp; headerDirty.description" title="Unsaved changes"></span>
                                    </label>
                                </div>
                                <textarea class="form-control we-desc-textarea" id="widget-description" we-auto-resize="we-auto-resize" ng-model="widget.description" ng-readonly="isVersionView || !canWriteWidget" rows="3" placeholder="Description"></textarea>
                            </div>
                            <div class="we-field">
                                <label for="widget-application-pop">Application</label>
                                <input type="text" class="form-control" id="widget-application-pop" ng-model="widget.application" readonly="readonly" style="width:100%" />
                            </div>
                            <div class="we-field">
                                <div class="we-field-label-row">
                                    <label for="widget-controller-as">Controller As</label>
                                    <span class="we-pane-unsaved-dot" ng-if="!isVersionView &amp;&amp; canWriteWidget &amp;&amp; headerDirty.controller_as" title="Unsaved changes"></span>
                                </div>
                                <input type="text" class="form-control" id="widget-controller-as" ng-model="widget.controller_as" ng-readonly="isVersionView || !canWriteWidget" />
                            </div>
                            <div class="we-field" ng-if="widget.is_header_footer">
                                <span class="input-group-checkbox">
                                    <input type="checkbox" class="checkbox" id="widget-static" ng-model="widget.static" ng-disabled="isVersionView || !canWriteWidget" />
                                    <label class="checkbox-label" for="widget-static">
                                        <span style="display: flex; min-height: 0.825rem; gap: 0.25rem; align-items: center">
                                            <span>Static</span>
                                            <span style="display: inline-block; width: 0.5rem;">
                                                <span class="we-pane-unsaved-dot" ng-if="!isVersionView &amp;&amp; canWriteWidget &amp;&amp; headerDirty.static" title="Unsaved changes"></span>
                                            </span>
                                        </span>
                                    </label>
                                </span>
                            </div>
                            <div class="we-field" ng-repeat="field in additionalWidgetFields track by field.name">
                                <div class="we-field-label-row" ng-if="field.type !== 'boolean'">
                                    <label ng-attr-for="widget-extra-{{field.name}}">{{field.label}}</label>
                                    <span class="we-pane-unsaved-dot" ng-if="!isVersionView &amp;&amp; canWriteWidget &amp;&amp; headerDirty[field.name]" title="Unsaved changes"></span>
                                </div>
                                <span class="input-group-checkbox" ng-if="field.type === 'boolean'">
                                    <input type="checkbox" class="checkbox" ng-attr-id="widget-extra-{{field.name}}" ng-model="widget[field.name]" ng-disabled="isVersionView || !canWriteWidget || !field.canWrite" />
                                    <label class="checkbox-label" ng-attr-for="widget-extra-{{field.name}}">
                                        <span style="display: flex; min-height: 0.825rem; gap: 0.25rem; align-items: center">
                                            <span>{{field.label}}</span>
                                            <span style="display: inline-block; width: 0.5rem;">
                                                <span class="we-pane-unsaved-dot" ng-if="!isVersionView &amp;&amp; canWriteWidget &amp;&amp; headerDirty[field.name]" title="Unsaved changes"></span>
                                            </span>
                                        </span>
                                    </label>
                                </span>
                                <input ng-if="field.type !== 'boolean'" type="text" class="form-control" ng-attr-id="widget-extra-{{field.name}}" ng-model="widget[field.name]" ng-readonly="isVersionView || !canWriteWidget || !field.canWrite" />
                            </div>
                            <span class="we-widget-origin" ng-if="widgetOrigin" title="{{widgetOrigin.tooltip}}" ng-bind-template="Established {{widgetOrigin.year}} by {{widgetOrigin.founder}}"></span>
                        </div>
                    </div>
                    <div class="we-field">
                        <div class="we-field-label-row">
                            <label for="widget-id">Widget ID</label>
                            <span class="we-pane-unsaved-dot" ng-if="!isVersionView &amp;&amp; canWriteWidget &amp;&amp; headerDirty.id" title="Unsaved changes"></span>
                        </div>
                        <input type="text" class="form-control" id="widget-id" ng-model="widget.id" ng-readonly="isVersionView || !canWriteWidget" />
                    </div>
                    <div class="we-field we-field-public">
                        <div class="we-field-label-row">
                            <span class="input-group-checkbox">
                                <input type="checkbox" class="checkbox" id="chk-is-public" ng-model="widget.is_public" ng-disabled="isVersionView || !canWriteWidget" ng-change="onPublicChange()" />
                                <label class="checkbox-label" for="chk-is-public">
                                    <span style="display: flex; min-height: 0.825rem; gap: 0.25rem; align-items: center">
                                        <span>Public</span>
                                        <span style="display: inline-block; width: 0.5rem;">
                                            <span class="we-pane-unsaved-dot" ng-if="!isVersionView &amp;&amp; canWriteWidget &amp;&amp; headerDirty.is_public" title="Unsaved changes"></span>
                                        </span>
                                    </span>
                                </label>                        
                            </span>
                        </div>
                    </div>
                    <div class="we-field we-field-with-popover" ng-if="!widget.is_public" style="align-self: stretch; padding-top: 0.125rem;">
                        <div class="we-field-label-row we-field-roles">
                            <label for="rolesSelect" style="display: flex; align-items: center; gap: 0.25rem; min-height: 0.825rem;">
                                <span>Roles</span>
                                <span class="we-pane-unsaved-dot" ng-if="!isVersionView &amp;&amp; canWriteWidget &amp;&amp; headerDirty.roles" title="Unsaved changes"></span>
                            </label>
                            <span class="we-roles-count" ng-class="{'we-roles-count--active': rolesList.length > 0}" ng-click="toggleDropdown('roles'); $event.stopPropagation()" ng-keydown="onDropdownTriggerKeydown($event, 'roles')" ng-bind="rolesList.length" ng-attr-title="{{rolesList.length ? rolesList.slice().sort().join(', ') : undefined}}" tabindex="0" role="button" aria-haspopup="true" aria-expanded="{{openDropdown === 'roles'}}"></span>
                            
                        </div>
                        <div class="we-popover we-roles-popover" ng-if="openDropdown === 'roles'" ng-click="$event.stopPropagation()" we-dropdown-auto-pos="we-dropdown-auto-pos">
                            <div ng-if="!isVersionView &amp;&amp; canWriteWidget" style="width:30rem">
                                <input type="hidden" id="rolesSelect" we-select2-roles="we-select2-roles" style="width:100%" />
                            </div>
                            <input ng-if="isVersionView || !canWriteWidget" type="text" class="form-control" ng-model="widget.roles" readonly="readonly" style="width:12.5rem" />
                        </div>
                    </div>
                </div>

                <div class="we-header-sep"></div>

                <!-- Providers dropdown -->
                <div class="we-dropdown we-header-wide-only" ng-if="!isVersionView" we-close-on-outside-click="openDropdown" close-key="'providers'">
                    <button class="btn btn-default" ng-click="toggleDropdown('providers')" ng-disabled="isNewWidget">Providers ({{providers.length}}) <span class="caret" ng-class="{'we-caret--open': openDropdown === 'providers'}"></span></button>
                    <div class="we-dropdown-menu we-dropdown-menu-providers" ng-show="openDropdown === 'providers'" we-dropdown-auto-pos="we-dropdown-auto-pos">
                        <div class="we-dropdown-empty" ng-if="providers.length === 0">No providers linked</div>
                        <div class="we-dropdown-item" ng-repeat="p in providers" ng-click="openProvider(p)">
                            <span class="we-dropdown-item-label" ng-bind="p.name"></span>
                            <button class="we-dropdown-unlink-btn" ng-if="canWriteWidget" ng-click="$event.stopPropagation(); unlinkProviderFromDropdown(p)" title="Unlink provider" aria-label="Unlink provider" style="margin-right: 0.5rem;"></button>
                            <a class="we-dropdown-ext-link" href="/nav_to.do?uri=sp_angular_provider.do%3Fsys_id={{p.sys_id}}" target="_blank" ng-click="$event.stopPropagation(); openDropdown = null" title="Open in platform" aria-label="Open provider in platform"></a>
                        </div>
                        <div class="we-dropdown-divider" ng-if="providers.length > 0 &amp;&amp; canWriteWidget"></div>
                        <div class="we-dropdown-item add-item we-add-new" ng-if="canWriteWidget" ng-click="addNewProvider()">Add new provider</div>
                        <div class="we-dropdown-item add-item we-add-link" ng-if="canWriteWidget" ng-click="openLinkProviderModal()">Link existing provider</div>
                    </div>
                </div>

                <!-- Templates dropdown -->
                <div class="we-dropdown we-header-wide-only" ng-if="!isVersionView" we-close-on-outside-click="openDropdown" close-key="'templates'">
                    <button class="btn btn-default" ng-click="toggleDropdown('templates')" ng-disabled="isNewWidget">Templates ({{templates.length}}) <span class="caret" ng-class="{'we-caret--open': openDropdown === 'templates'}"></span></button>
                    <div class="we-dropdown-menu" ng-show="openDropdown === 'templates'" we-dropdown-auto-pos="we-dropdown-auto-pos">
                        <div class="we-dropdown-empty" ng-if="templates.length === 0">No templates</div>
                        <div class="we-dropdown-item" ng-repeat="t in templates" ng-click="openTemplate(t)">
                            <span class="we-dropdown-item-label" ng-bind="t.id"></span>
                            <a class="we-dropdown-ext-link" href="/nav_to.do?uri=sp_ng_template.do%3Fsys_id={{t.sys_id}}" target="_blank" ng-click="$event.stopPropagation(); openDropdown = null" title="Open in platform" aria-label="Open template in platform"></a>
                        </div>
                        <div class="we-dropdown-item add-item we-add-new" ng-if="canWriteWidget" ng-click="addTemplate()">Add template</div>
                    </div>
                </div>

                <!-- Dependencies dropdown -->
                <div class="we-dropdown we-header-wide-only" ng-if="!isVersionView" we-close-on-outside-click="openDropdown" close-key="'dependencies'">
                    <button class="btn btn-default" ng-click="toggleDropdown('dependencies')" ng-disabled="isNewWidget">Dependencies ({{dependencies.length}}) <span class="caret" ng-class="{'we-caret--open': openDropdown === 'dependencies'}"></span></button>
                    <div class="we-dropdown-menu we-dropdown-menu-providers" ng-show="openDropdown === 'dependencies'" we-dropdown-auto-pos="we-dropdown-auto-pos">
                        <div class="we-dropdown-empty" ng-if="dependencies.length === 0">No dependencies linked</div>
                        <div class="we-dropdown-item" ng-repeat="dep in dependencies" ng-click="openDependency(dep)">
                            <span class="we-dropdown-item-label" ng-bind="dep.name"></span>
                            <button class="we-dropdown-unlink-btn" ng-if="canWriteWidget" ng-click="$event.stopPropagation(); unlinkDependencyFromDropdown(dep)" title="Unlink dependency" aria-label="Unlink dependency" style="margin-right:0.5rem;"></button>
                            <a class="we-dropdown-ext-link" href="/nav_to.do?uri=sp_dependency.do%3Fsys_id={{dep.sys_id}}" target="_blank" ng-click="$event.stopPropagation(); openDropdown = null" title="Open in platform" aria-label="Open dependency in platform"></a>
                        </div>
                        <div class="we-dropdown-divider" ng-if="canWriteWidget &amp;&amp; dependencies.length > 0"></div>
                        <div class="we-dropdown-item add-item we-add-new" ng-if="canWriteWidget" ng-click="addNewDependency()">Add new dependency</div>
                        <div class="we-dropdown-item add-item we-add-link" ng-if="canWriteWidget" ng-click="openLinkDependencyModal()">Link existing dependency</div>
                    </div>
                </div>

                <!-- Versions dropdown -->
                <div class="we-dropdown we-header-wide-only" we-close-on-outside-click="openDropdown" close-key="'versions'">
                    <button class="btn btn-default" ng-click="toggleDropdown('versions')" ng-disabled="isNewWidget">Versions ({{versions.length}}) <span class="caret" ng-class="{'we-caret--open': openDropdown === 'versions'}"></span></button>
                    <div class="we-dropdown-menu we-dropdown-menu-versions" ng-show="openDropdown === 'versions'" we-dropdown-auto-pos="we-dropdown-auto-pos">
                        <div class="we-dropdown-empty" ng-if="versions.length === 0">No versions found</div>
                        <div class="we-dropdown-item" ng-repeat="v in versions" ng-click="openVersionDiff(v)">
                            <span class="we-version-row">
                                <span class="we-version-col-date" title="{{formatVersionDate(v.sys_created_on, true)}}"><span ng-bind="formatVersionDate(v.sys_created_on)"></span></span>
                                <span class="we-version-col-uset" ng-class="{'we-version-col-uset--in-progress': v.update_set_state === 'in progress', 'we-version-col-uset--ignore': v.update_set_state === 'ignore'}" title="{{v.update_set_name}}
[{{v.update_set_state_label}}]" ng-bind="v.update_set_name || ''"></span>
                                <span class="we-version-col-user"><span ng-bind="v.sys_created_by" title="{{v.sys_created_by}}"></span> <span ng-if="v.state === 'current'" class="we-version-current-dot" title="Current" style="margin-left: 0.5rem;"></span></span>
                            </span>
                            <a class="we-dropdown-ext-link we-dropdown-ext-link--reserved" href="/nav_to.do?uri=sys_update_version.do%3Fsys_id%3D{{v.sys_id}}" target="_blank" ng-click="$event.stopPropagation(); openDropdown = null" title="Open in platform" aria-label="Open version in platform"></a>
                        </div>
                    </div>
                </div>

                <!-- Related Lists button -->
                <button class="btn btn-default we-header-wide-only" ng-if="!isVersionView" ng-click="openRelatedModal()" ng-disabled="isNewWidget">Related Lists</button>

                <div class="we-header-sep we-header-wide-only"></div>

                <!-- Editor visibility -->
                <div class="we-dropdown" ng-if="!isVersionView" we-close-on-outside-click="openDropdown" close-key="'editorPicker'">
                    <button class="btn btn-default" ng-click="toggleDropdown('editorPicker')" title="Choose visible editors">Editors <span class="caret" ng-class="{'we-caret--open': openDropdown === 'editorPicker'}"></span></button>
                    <div class="we-dropdown-menu" ng-show="openDropdown === 'editorPicker'" we-dropdown-auto-pos="we-dropdown-auto-pos">
                        <div class="we-dropdown-item" ng-repeat="e in coreEditorDefs">
                            <span class="input-group-checkbox" style="width:100%">
                                <input type="checkbox" class="checkbox" id="chk-field-{{e.key}}" ng-model="e.visible" ng-change="onEditorVisibilityChange()" />
                                <label class="checkbox-label" for="chk-field-{{e.key}}" style="flex:1" ng-bind="e.label"></label>
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Compact menu (viewport < 1200px): replaces individual dropdowns -->
                <div class="we-compact-menu we-dropdown">
                    <button class="btn btn-default" ng-click="toggleDropdown('compactMenu')" title="Widget options" aria-label="Widget options">Lists <span class="caret" ng-class="{'we-caret--open': openDropdown === 'compactMenu'}"></span></button>
                    <div class="we-dropdown-menu we-compact-menu-panel" ng-show="openDropdown === 'compactMenu'" we-dropdown-auto-pos="we-dropdown-auto-pos">

                        <!-- Providers -->
                        <div class="we-compact-submenu-trigger" ng-if="!isVersionView" ng-click="toggleCompactSubmenu('providers')">
                            <span>Providers ({{providers.length}})</span>
                            <span class="we-compact-submenu-arrow" ng-class="{'we-compact-submenu-arrow--open': openCompactSubmenu === 'providers'}"><i class="icon-chevron-right"></i></span>
                        </div>
                        <div class="we-compact-submenu-panel" ng-show="openCompactSubmenu === 'providers'">
                            <div class="we-dropdown-empty" ng-if="isNewWidget">Save widget first</div>
                            <div class="we-dropdown-empty" ng-if="!isNewWidget &amp;&amp; providers.length === 0">No providers</div>
                            <div class="we-dropdown-item" ng-repeat="p in providers" ng-if="!isNewWidget" ng-click="openProvider(p)">
                                <span class="we-dropdown-item-label" ng-bind="p.name"></span>
                                <button class="we-dropdown-unlink-btn" ng-if="canWriteWidget" ng-click="$event.stopPropagation(); unlinkProviderFromDropdown(p)" title="Unlink provider" aria-label="Unlink provider" style="margin-right:0.5rem;"></button>
                                <a class="we-dropdown-ext-link" href="/nav_to.do?uri=sp_angular_provider.do%3Fsys_id={{p.sys_id}}" target="_blank" ng-click="$event.stopPropagation(); openDropdown = null" title="Open in platform" aria-label="Open provider in platform"></a>
                            </div>
                            <div class="we-dropdown-divider" ng-if="!isNewWidget &amp;&amp; providers.length > 0 &amp;&amp; canWriteWidget"></div>
                            <div class="we-dropdown-item add-item we-add-new" ng-if="!isNewWidget &amp;&amp; canWriteWidget" ng-click="addNewProvider()">Add new provider</div>
                            <div class="we-dropdown-item add-item we-add-link" ng-if="!isNewWidget &amp;&amp; canWriteWidget" ng-click="openLinkProviderModal()">Link existing provider</div>
                        </div>

                        <!-- Templates -->
                        <div class="we-compact-submenu-trigger" ng-if="!isVersionView" ng-click="toggleCompactSubmenu('templates')">
                            <span>Templates ({{templates.length}})</span>
                            <span class="we-compact-submenu-arrow" ng-class="{'we-compact-submenu-arrow--open': openCompactSubmenu === 'templates'}"><i class="icon-chevron-right"></i></span>
                        </div>
                        <div class="we-compact-submenu-panel" ng-show="openCompactSubmenu === 'templates'">
                            <div class="we-dropdown-empty" ng-if="isNewWidget">Save widget first</div>
                            <div class="we-dropdown-empty" ng-if="!isNewWidget &amp;&amp; templates.length === 0">No templates</div>
                            <div class="we-dropdown-item" ng-repeat="t in templates" ng-if="!isNewWidget" ng-click="openTemplate(t)">
                                <span class="we-dropdown-item-label" ng-bind="t.id"></span>
                                <a class="we-dropdown-ext-link" href="/nav_to.do?uri=sp_ng_template.do%3Fsys_id={{t.sys_id}}" target="_blank" ng-click="$event.stopPropagation(); openDropdown = null" title="Open in platform" aria-label="Open template in platform"></a>
                            </div>
                            <div class="we-dropdown-item add-item we-add-new" ng-if="!isNewWidget &amp;&amp; canWriteWidget" ng-click="addTemplate()">Add template</div>
                        </div>

                        <!-- Dependencies -->
                        <div class="we-compact-submenu-trigger" ng-if="!isVersionView" ng-click="toggleCompactSubmenu('dependencies')">
                            <span>Dependencies ({{dependencies.length}})</span>
                            <span class="we-compact-submenu-arrow" ng-class="{'we-compact-submenu-arrow--open': openCompactSubmenu === 'dependencies'}"><i class="icon-chevron-right"></i></span>
                        </div>
                        <div class="we-compact-submenu-panel" ng-show="openCompactSubmenu === 'dependencies'">
                            <div class="we-dropdown-empty" ng-if="isNewWidget">Save widget first</div>
                            <div class="we-dropdown-empty" ng-if="!isNewWidget &amp;&amp; dependencies.length === 0">No dependencies</div>
                            <div class="we-dropdown-item" ng-repeat="dep in dependencies" ng-if="!isNewWidget" ng-click="openDependency(dep)">
                                <span class="we-dropdown-item-label" ng-bind="dep.name"></span>
                                <button class="we-dropdown-unlink-btn" ng-if="canWriteWidget" ng-click="$event.stopPropagation(); unlinkDependencyFromDropdown(dep)" title="Unlink dependency" aria-label="Unlink dependency" style="margin-right:0.5rem;"></button>
                                <a class="we-dropdown-ext-link" href="/nav_to.do?uri=sp_dependency.do%3Fsys_id={{dep.sys_id}}" target="_blank" ng-click="$event.stopPropagation(); openDropdown = null" title="Open in platform" aria-label="Open dependency in platform"></a>
                            </div>
                            <div class="we-dropdown-divider" ng-if="!isNewWidget &amp;&amp; canWriteWidget"></div>
                            <div class="we-dropdown-item add-item we-add-new" ng-if="!isNewWidget &amp;&amp; canWriteWidget" ng-click="addNewDependency()">Add new dependency</div>
                            <div class="we-dropdown-item add-item we-add-link" ng-if="!isNewWidget &amp;&amp; canWriteWidget" ng-click="openLinkDependencyModal()">Link existing dependency</div>
                        </div>

                        <!-- Versions -->
                        <div class="we-compact-submenu-trigger" ng-click="toggleCompactSubmenu('versions')">
                            <span>Versions ({{versions.length}})</span>
                            <span class="we-compact-submenu-arrow" ng-class="{'we-compact-submenu-arrow--open': openCompactSubmenu === 'versions'}"><i class="icon-chevron-right"></i></span>
                        </div>
                        <div class="we-compact-submenu-panel" ng-show="openCompactSubmenu === 'versions'">
                            <div class="we-dropdown-empty" ng-if="isNewWidget">Save widget first</div>
                            <div class="we-dropdown-empty" ng-if="!isNewWidget &amp;&amp; versions.length === 0">No versions found</div>
                            <div class="we-dropdown-item" ng-repeat="v in versions" ng-if="!isNewWidget" ng-click="openVersionDiff(v)">
                                <span class="we-version-row">
                                    <span class="we-version-col-date"><span ng-bind="formatVersionDate(v.sys_created_on)"></span><span ng-if="v.state === 'current'" class="we-version-current-dot" title="Current" style="margin-left: 0.5rem;"></span></span>
                                    <span class="we-version-col-uset" ng-class="{'we-version-col-uset--in-progress': v.update_set_state === 'in progress', 'we-version-col-uset--ignore': v.update_set_state === 'ignore'}" title="{{v.update_set_state_label}}" ng-bind="v.update_set_name || ''"></span>
                                    <span class="we-version-col-user"><span ng-bind="v.sys_created_by"></span></span>
                                </span>
                                <a class="we-dropdown-ext-link we-dropdown-ext-link--reserved" href="/nav_to.do?uri=sys_update_version.do%3Fsys_id%3D{{v.sys_id}}" target="_blank" ng-click="$event.stopPropagation(); openDropdown = null" title="Open in platform" aria-label="Open version in platform"></a>
                            </div>
                        </div>

                        <div class="we-dropdown-divider" ng-if="!isVersionView"></div>

                        <!-- Related Lists -->
                        <div class="we-dropdown-item" ng-if="!isVersionView" ng-class="{'disabled': isNewWidget}" ng-click="openRelatedModal(); openDropdown = null">Related Lists</div>

                    </div>
                </div>

                <div class="we-spacer"></div>

                <div class="we-header-group we-header-actions">
                    <!-- Unsaved warning -->
                    <span class="we-unsaved-warning" ng-if="!isVersionView &amp;&amp; hasUnsavedChanges()">
                        Unsaved changes
                        <span class="we-unsaved-compare" ng-if="!isNewWidget">(<button class="btn btn-link we-unsaved-diff-btn" ng-click="openUnsavedDiff()" title="Compare unsaved changes with current saved version">Compare</button>)</span>
                    </span>

                    <!-- Save error -->
                    <span class="we-save-error" ng-if="!isVersionView &amp;&amp; saveError" title="{{saveError}}" ng-bind="saveError"></span>

                    <!-- Presence -->
                    <div class="we-presence" ng-if="presenceUsers.length">
                        <div class="we-avatar" ng-repeat="u in presenceUsers" ng-if="u.sys_id !== currentUserId" title="{{u.name}}"
                            ng-style="u.avatar ? {'background-image': 'url(/' + u.avatar + ')', 'background-size': 'cover', 'background-color': 'transparent'} : {}">
                            <span ng-if="!u.avatar" ng-bind="u.initials"></span>
                        </div>
                    </div>

                    <!-- Last save time -->
                    <span class="we-last-save-time" ng-if="!isVersionView &amp;&amp; lastSaveTime &amp;&amp; !saveError &amp;&amp; !hasUnsavedChanges()">{{getLastSaveLabel()}}<span ng-if="lastSaveUpdateSet">(<a class="we-update-set-link" ng-href="/nav_to.do?uri=sys_update_set.do%3Fsys_id%3D{{lastSaveUpdateSet.sys_id}}" target="_blank" we-tooltip-title="{{lastSaveUpdateSet.name}}" ng-bind="formatUpdateSetName(lastSaveUpdateSet.name)"></a>)</span></span>

                    <!-- Save all -->
                    <button class="btn btn-primary" ng-click="saveAll()" ng-if="!isVersionView" ng-disabled="!canWriteWidget"
                            ng-class="{'we-btn-save--error': hasLintErrors, 'we-btn-save--warn': !hasLintErrors &amp;&amp; hasLintWarnings}" style="padding-left: 1.25rem; padding-right: 1.25rem;margin-left: 0.3125rem; margin-right: 0.3125rem;">Save</button>

                    <!-- Open in VS Code (SN Utils) -->
                    <button id="vscode-btn" class="btn btn-default" ng-if="!isVersionView &amp;&amp; hasSnUtils &amp;&amp; userPrefs.showOpenInVsCode !== false" ng-click="editInVsCode()" title="Open in VS Code (SN ScriptSync)" aria-label="Open in VS Code" style="padding:0.125rem 0.625rem;line-height:1.2;margin-right:0.3125rem;">
                        <svg viewBox="0 0 100 100" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: text-bottom;">
                            <mask id="we-vsc-mask0" mask-type="alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M70.9119 99.3171C72.4869 99.9307 74.2828 99.8914 75.8725 99.1264L96.4608 89.2197C98.6242 88.1787 100 85.9892 100 83.5872V16.4133C100 14.0113 98.6243 11.8218 96.4609 10.7808L75.8725 0.873756C73.7862 -0.130129 71.3446 0.11576 69.5135 1.44695C69.252 1.63711 69.0028 1.84943 68.769 2.08341L29.3551 38.0415L12.1872 25.0096C10.589 23.7965 8.35363 23.8959 6.86933 25.2461L1.36303 30.2549C-0.452552 31.9064 -0.454633 34.7627 1.35853 36.417L16.2471 50.0001L1.35853 63.5832C-0.454633 65.2374 -0.452552 68.0938 1.36303 69.7453L6.86933 74.7541C8.35363 76.1043 10.589 76.2037 12.1872 74.9905L29.3551 61.9587L68.769 97.9167C69.3925 98.5406 70.1246 99.0104 70.9119 99.3171ZM75.0152 27.2989L45.1091 50.0001L75.0152 72.7012V27.2989Z" fill="white"/>
                            </mask>
                            <g mask="url(#we-vsc-mask0)">
                                <path d="M96.4614 10.7962L75.8569 0.875542C73.4719 -0.272773 70.6217 0.211611 68.75 2.08333L1.29858 63.5832C-0.515693 65.2373 -0.513607 68.0937 1.30308 69.7452L6.81272 74.754C8.29793 76.1042 10.5347 76.2036 12.1338 74.9905L93.3609 13.3699C96.086 11.3026 100 13.2462 100 16.6667V16.4275C100 14.0265 98.6246 11.8378 96.4614 10.7962Z" fill="#0065A9"/>
                                <path d="M96.4614 89.2038L75.8569 99.1245C73.4719 100.273 70.6217 99.7884 68.75 97.9167L1.29858 36.4169C-0.515693 34.7627 -0.513607 31.9063 1.30308 30.2548L6.81272 25.246C8.29793 23.8958 10.5347 23.7964 12.1338 25.0095L93.3609 86.6301C96.086 88.6974 100 86.7538 100 83.3334V83.5726C100 85.9735 98.6246 88.1622 96.4614 89.2038Z" fill="#007ACC"/>
                                <path d="M75.8578 99.1263C73.4721 100.274 70.6219 99.7885 68.75 97.9166C71.0564 100.223 75 95.3278 75 95.3278V4.67213C75 1.41039 71.0564 -0.223106 68.75 2.08329C70.6219 0.211402 73.4721 -0.273666 75.8578 0.873633L96.4587 10.7807C98.6234 11.8217 100 14.0112 100 16.4132V83.5871C100 85.9891 98.6234 88.1786 96.4586 89.2196L75.8578 99.1263Z" fill="#1F9CF0"/>
                            </g>
                        </svg>
                    </button>

                    <!-- Burger menu -->
                    <div class="we-dropdown" we-close-on-outside-click="openDropdown" close-key="'burger'">
                        <button class="btn btn-default" ng-click="toggleDropdown('burger')" title="Menu" aria-label="Menu" style="padding:0.125rem 0.625rem;line-height:1.2"><span class="icon-menu"></span></button>
                        <div class="we-dropdown-menu we-dropdown-menu-right" ng-show="openDropdown === 'burger'" we-dropdown-auto-pos="we-dropdown-auto-pos">
                            <div class="we-dropdown-item" ng-click="newWidget()">New widget</div>
                            <div class="we-dropdown-item" ng-if="!isNewWidget" ng-click="cloneWidget()">Clone widget</div>
                            <div class="we-dropdown-divider" ng-if="!isNewWidget"></div>
                            <div class="we-dropdown-item" ng-if="!isNewWidget &amp;&amp; !widget.is_header_footer" ng-click="openOptionSchemaModal()">Edit option schema <span class="we-status-dot we-status-dot--green" ng-if="widget.option_schema_has_value" title="Has an option schema defined"></span></div>
                            <div class="we-dropdown-item" ng-if="!isNewWidget &amp;&amp; !widget.is_header_footer" ng-click="openDemoDataModal()">Edit demo data <span class="we-status-dot we-status-dot--green" ng-if="widget.demo_data_has_value" title="Has demo data defined"></span></div>
                            <div class="we-dropdown-item" ng-if="!isNewWidget" ng-click="openXmlModal()">Show XML</div>
                            <div class="we-dropdown-item" ng-if="!isNewWidget" ng-click="copyWidgetUrl()">Copy widget URL</div>
                            <div class="we-dropdown-divider" ng-if="!isNewWidget"></div>
                            <div class="we-dropdown-item" ng-click="openUserPrefsModal()">User preferences</div>
                            <div class="we-dropdown-item" ng-click="openKeyboardShortcutsModal()">Keyboard shortcuts</div>
                            <div class="we-dropdown-item" ng-click="openApiDocs()">API documentation <span class="we-ext-icon we-icon-secondary" aria-hidden="true"></span></div>
                            <div class="we-dropdown-divider" ng-if="!isNewWidget"></div>
                            <div class="we-dropdown-item" ng-if="!isNewWidget" ng-click="openInPlatform()">Open in platform</div>
                        </div>
                    </div>
                </div>

            </div><!-- /header -->

            <!--  Body: pane container -->
            <div class="we-body" id="we-pane-container" ng-if="!loading &amp;&amp; !loadError &amp;&amp; !showPicker">

                <!-- Interleaved panes + splitters via flat visibleItems array -->
                <div ng-repeat="item in visibleItems track by item.key" ng-class="{'we-pane': item.type === 'pane', 'we-splitter': item.type === 'splitter'}" ng-attr-id="{{item.type === 'pane' ? 'pane-' + item.key : undefined}}" ng-style="item.type === 'pane' ? {'width': item.width ? item.width + 'px' : 'auto', 'flex': item.width ? '0 0 ' + item.width + 'px' : '1 1 0'} : {}" we-splitter-drag="{{item.type === 'splitter' ? $index : undefined}}">

                    <!-- Pane header -->
                    <div class="we-pane-header" ng-class="{'we-pane-header--deprecated': widget.deprecated}" ng-if="item.type === 'pane'">

                        <!-- Left: label, save button, status indicators -->
                        <span class="we-pane-title" ng-bind="item.label"></span>
                        <span class="we-pane-unsaved-dot" ng-if="item.dirty || item.idDirty" title="Unsaved changes"></span>

                        <button class="btn btn-default we-pane-save-btn" ng-if="(item.dirty || item.idDirty) &amp;&amp; !isVersionView &amp;&amp; canWriteWidget &amp;&amp; (!isNewWidget || item.hasIdInput) &amp;&amp; !item.readOnly" ng-click="savePaneField(item)" title="Save {{item.label}}">Save</button>
                        <span class="we-pane-saved-text" ng-if="item.savedAt &amp;&amp; !item.dirty &amp;&amp; !item.idDirty" style="margin-left: 0.3125rem;" ng-bind="getPaneSavedLabel(item)"></span>
                        <span class="we-pane-save-error" ng-if="item.saveError &amp;&amp; !item.dirty" title="{{item.saveError}}">
                            <span class="icon-warning-circle"></span> {{item.saveError}}
                        </span>
                        <span class="we-pane-viewers" ng-if="item.viewingUsers &amp;&amp; item.viewingUsers.length > 1" title="Viewing: {{viewersTitle(item)}}" aria-label="{{item.viewingUsers.length - 1}} other user(s) viewing">
                            <i class="icon-user-selected" aria-hidden="true"></i><span class="we-pane-viewers-count" ng-bind="item.viewingUsers.length - 1"></span>
                        </span>

                        <!-- Spacer pushes right-side controls to the edge -->
                        <span class="we-spacer"></span>

                        <!-- Right: ES12 toggle, format, ext-link, debugger, close -->
                        <span class="we-pane-right-actions">
                            <span ng-if="item.key === 'script' &amp;&amp; !isVersionView" class="we-toggle we-toggle-inline input-group-checkbox we-pane-es12" title="ES12 / Modern JavaScript">
                                <input type="checkbox" class="checkbox" id="chk-es12" ng-model="widget.es12" ng-change="saveEs12()" ng-disabled="!canWriteWidget" />
                                <label class="checkbox-label" for="chk-es12">ES12</label>
                            </span>

                            <button class="btn btn-default we-pane-icon-btn" ng-click="formatDocument(item)" ng-if="!isVersionView" ng-disabled="!canWriteWidget || (item.hasIdInput &amp;&amp; !item.editorUnlocked) || item.readOnly" title="Format document" aria-label="Format document"><span class="we-icon we-icon-format" aria-hidden="true"></span></button>
                            <button class="btn btn-default we-pane-icon-btn we-pane-icon-btn--danger" ng-if="item.hasIdInput &amp;&amp; item.sys_id &amp;&amp; !isVersionView &amp;&amp; item.canDelete &amp;&amp; (item.recordType !== 'provider' || !item.linkedToOtherWidgets)" ng-click="deleteExtraPane(item)" title="Delete {{item.recordType === 'template' ? 'template' : 'provider'}}" aria-label="Delete {{item.recordType === 'template' ? 'template' : 'provider'}}"><span class="we-icon we-icon-delete" aria-hidden="true"></span></button>
                            <button class="btn btn-default we-pane-icon-btn we-pane-icon-btn--danger" ng-if="item.hasIdInput &amp;&amp; item.sys_id &amp;&amp; !isVersionView &amp;&amp; item.recordType === 'provider' &amp;&amp; canWriteWidget" ng-click="unlinkExtraPane(item)" title="Unlink provider" aria-label="Unlink provider"><span class="we-icon we-icon-unlink" aria-hidden="true"></span></button>
                            <button class="btn btn-default we-pane-icon-btn" ng-click="openScriptDebugger()" ng-if="(item.key === 'script' || item.recordType === 'script_include') &amp;&amp; !isVersionView" title="Open Script Debugger" aria-label="Open Script Debugger"><span class="we-icon we-icon-debugger" aria-hidden="true"></span></button>
                            <button class="btn btn-default we-pane-icon-btn" ng-if="(item.hasIdInput || item.recordType === 'script_include') &amp;&amp; item.sys_id" ng-click="openExtraPaneInPlatform(item)" title="Open in platform" aria-label="Open in platform"><span class="we-icon we-icon-ext-link" aria-hidden="true"></span></button>
                        </span>
                        <span class="we-pane-close" ng-if="!isVersionView &amp;&amp; visiblePaneCount > 1" ng-click="closePaneItem(item)" title="Close pane" aria-label="Close pane" role="button" tabindex="0"><span class="icon-connect-close"></span></span>
                    </div>

                    <!-- Template/provider metadata subheader (Name and Type, directly below pane header) -->
                    <div class="we-pane-subheader" ng-if="item.type === 'pane' &amp;&amp; item.hasIdInput" ng-class="{'we-pane-subheader--type-overflow': item.subheaderTypeOverflow}" we-pane-subheader-fit="we-pane-subheader-fit">
                        <div class="we-pane-subheader-name-row">
                            <label class="we-pane-meta-label" ng-attr-for="'pane-name-' + item.key">Name</label>
                            <input class="form-control we-pane-id-input" type="text" ng-attr-id="'pane-name-' + item.key" ng-model="item.recordId" placeholder="Enter name" ng-change="onPaneIdChange(item)" ng-disabled="isVersionView || !canWriteWidget" title="Record name (required to save)" ng-class="{'we-input-invalid': item.idError}" />
                            <span ng-if="item.idChecking" class="we-pane-id-status">Checking…</span>
                            <span ng-if="item.idError &amp;&amp; !item.idChecking" class="we-pane-id-error" ng-bind="item.idError"></span>
                        </div>
                        <div ng-if="item.recordType === 'provider'" class="we-pane-subheader-type-row">
                            <label class="we-pane-meta-label" ng-attr-for="'pane-type-' + item.key">Type</label>
                            <select class="form-control we-pane-type-select" ng-attr-id="'pane-type-' + item.key" ng-model="item.providerType" ng-change="onProviderTypeChange(item)" ng-disabled="isVersionView || !canWriteWidget">
                                <option value="">-- Type --</option>
                                <option ng-repeat="c in providerTypeChoices" value="{{c.value}}" ng-bind="c.label"></option>
                            </select>
                        </div>
                        <!-- Overflow type menu: shown when pane is too narrow for inline type -->
                        <div ng-if="item.recordType === 'provider'" class="we-dropdown we-pane-type-overflow-wrap">
                            <button class="btn btn-default we-pane-icon-btn we-pane-type-overflow-btn" ng-click="toggleDropdown(item.key + '-type')" title="Set provider type" aria-label="Set provider type"><span class="we-icon we-icon-ellipsis" aria-hidden="true"></span></button>
                            <div class="we-dropdown-menu we-pane-type-overflow-menu" ng-if="openDropdown === item.key + '-type'" ng-click="$event.stopPropagation()" we-dropdown-fixed-pos="we-dropdown-fixed-pos">
                                <div class="we-pane-type-overflow-row">
                                    <label class="we-pane-meta-label" ng-attr-for="'pane-type-ov-' + item.key">Type</label>
                                    <select class="form-control we-pane-type-select" ng-attr-id="'pane-type-ov-' + item.key" ng-model="item.providerType" ng-change="onProviderTypeChange(item); openDropdown = null" ng-disabled="isVersionView || !canWriteWidget">
                                        <option value="">-- Type --</option>
                                        <option ng-repeat="c in providerTypeChoices" value="{{c.value}}" ng-bind="c.label"></option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Read-only infobar for extra panes in a different scope or without write access -->
                    <div class="we-pane-infobar" ng-if="item.type === 'pane' &amp;&amp; item.readOnly">
                        <span ng-if="item.readOnlyReason === 'scope'">Read-only (scope: {{item.scopeName}})</span>
                        <span ng-if="item.readOnlyReason !== 'scope'">Read-only — no write access.</span>
                    </div>

                    <!-- Volatility risk infobar for extra panes -->
                    <div class="we-pane-infobar" ng-class="item.volatility_level === 'High' ? 'we-pane-infobar--critical' : ''" ng-if="item.type === 'pane' &amp;&amp; item.volatility_level">
                        <span>Warning: {{item.recordId || item.label}} is a {{item.volatility_level_display}} Risk file that might get updated again in later releases. Do not alter this file unless necessary.</span>
                    </div>

                    <!-- External change infobar (below subheader, above editor) -->
                    <div class="we-pane-infobar" ng-if="item.type === 'pane' &amp;&amp; item.externalChange">
                        <span><strong ng-bind="item.externalChange.user"></strong>&nbsp;has updated this field.</span>
                        <div class="we-pane-infobar-actions">
                            <button class="btn btn-default we-pane-save-btn" ng-if="!isNewWidget" ng-click="openExternalChangeDiff(item)" title="Compare your unsaved changes with the version saved by {{item.externalChange.user}}">Compare</button>
                            <button class="btn btn-default we-pane-save-btn" ng-click="applyExternalChange(item)" title="Replace editor contents with the version saved by {{item.externalChange.user}}">Update</button>
                        </div>
                    </div>

                    <!-- Editor mount point -->
                    <div class="we-pane-editor" ng-if="item.type === 'pane'" id="editor-{{item.key}}"></div>

                </div><!-- /ng-repeat -->

            </div><!-- /body -->

        </div><!-- /app -->

        <!-- User Preferences Modal -->
        <div class="we-modal-overlay" ng-class="{'we-modal-overlay--leaving': _modalClosing}" ng-if="showUserPrefsModal" ng-click="cancelUserPrefsModal()">
            <div class="we-modal we-modal-pref" ng-click="$event.stopPropagation()">
                <div class="we-modal-header" we-modal-draggable="we-modal-draggable">
                    <span>User Preferences</span>
                    <span class="close" ng-click="cancelUserPrefsModal()" aria-label="Close" role="button" tabindex="0">×</span>
                </div>
                <div class="we-modal-body">
                    <div class="we-pref-columns">
                        <!-- Left column: Default editors -->
                        <div class="we-pref-col">
                            <div class="we-modal-section">
                                <div class="we-modal-section-title">Default editors</div>
                                <div class="we-modal-option we-pref-editor-row" ng-repeat="e in userPrefsEdit.editors track by e.key" we-pref-draggable="{{e.key}}">
                                    <span class="we-pref-drag-handle" draggable="true" title="Drag to reorder">
                                        <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
                                            <circle cx="3" cy="2.5" r="1.3"/><circle cx="7" cy="2.5" r="1.3"/>
                                            <circle cx="3" cy="7" r="1.3"/><circle cx="7" cy="7" r="1.3"/>
                                            <circle cx="3" cy="11.5" r="1.3"/><circle cx="7" cy="11.5" r="1.3"/>
                                        </svg>
                                    </span>
                                    <span class="input-group-checkbox">
                                        <input type="checkbox" class="checkbox" id="chk-pref-{{e.key}}" ng-model="e.visible" />
                                        <label class="checkbox-label" for="chk-pref-{{e.key}}" ng-bind="e.label"></label>
                                    </span>
                                </div>
                                <div class="we-modal-option" style="margin-top: 0.5rem">
                                    <span class="input-group-checkbox">
                                        <input type="checkbox" class="checkbox" id="chk-always-show-link" ng-model="userPrefsEdit.alwaysShowLink" />
                                        <label class="checkbox-label" for="chk-always-show-link">Always show Link editor if not empty</label>
                                    </span>
                                </div>
                            </div>
                            <div class="we-modal-section">
                                <div class="we-modal-section-title">Editor</div>
                                <div class="we-modal-option we-modal-option-row">
                                    <label class="we-modal-option-label" for="pref-editor-theme">Theme</label>
                                    <select class="form-control we-pref-select" id="pref-editor-theme" ng-model="userPrefsEdit.editorTheme">
                                        <option value="auto">Auto (follow UI theme)</option>
                                        <option value="dark">Dark</option>
                                        <option value="light">Light</option>
                                    </select>
                                </div>
                                <div class="we-modal-option we-modal-option-row">
                                    <label class="we-modal-option-label" for="pref-font-size">Font size</label>
                                    <div class="we-spin-wrap">
                                        <button type="button" class="we-spin-btn we-spin-dec" ng-click="userPrefsEdit.fontSize = userPrefsEdit.fontSize > 8 ? userPrefsEdit.fontSize - 1 : 8" aria-label="Decrease font size"><i class="icon-subtract"></i></button>
                                        <input type="number" class="we-pref-number" id="pref-font-size" ng-model="userPrefsEdit.fontSize" min="8" max="32" step="1" />
                                        <button type="button" class="we-spin-btn we-spin-inc" ng-click="userPrefsEdit.fontSize = userPrefsEdit.fontSize &lt; 32 ? userPrefsEdit.fontSize + 1 : 32" aria-label="Increase font size">+</button>
                                    </div>
                                    <span style="font-size:var(--now-font-size--sm);color:rgb(var(--now-color_text--secondary))">px</span>
                                </div>
                                <div class="we-modal-option we-modal-option-row">
                                    <label class="we-modal-option-label" for="pref-font-family">Font family</label>
                                    <select class="form-control we-pref-select" id="pref-font-family" ng-model="userPrefsEdit.fontFamily">
                                        <option value="">Monaco default</option>
                                        <optgroup label="System fonts">
                                            <option ng-repeat="f in userPrefsEdit.availableFonts" value="{{f}}" ng-style="{'font-family': f}" ng-bind="f"></option>
                                        </optgroup>
                                        <optgroup label="Google Fonts">
                                            <option ng-repeat="f in userPrefsEdit.googleFonts" value="{{f}}" ng-style="{'font-family': f}" ng-bind="f"></option>
                                        </optgroup>
                                    </select>
                                </div>
                                <div class="we-modal-option">
                                    <span class="input-group-checkbox">
                                        <input type="checkbox" class="checkbox" id="chk-word-wrap" ng-model="userPrefsEdit.wordWrap" />
                                        <label class="checkbox-label" for="chk-word-wrap" we-tooltip-title="Prevents horizontal scrolling by forcing lines that exceed the editor width to break into new lines.">Wrap long lines in editor</label>
                                    </span>
                                </div>
                                <div class="we-modal-option">
                                    <span class="input-group-checkbox">
                                        <input type="checkbox" class="checkbox" id="chk-minimap" ng-model="userPrefsEdit.minimap" />
                                        <label class="checkbox-label" for="chk-minimap" we-tooltip-title="Displays a minimap of the code on the right side of the editor.">Show minimap</label>
                                    </span>
                                </div>
                                <div class="we-modal-option">
                                    <span class="input-group-checkbox">
                                        <input type="checkbox" class="checkbox" id="chk-sticky-scroll" ng-model="userPrefsEdit.stickyScroll" />
                                        <label class="checkbox-label" for="chk-sticky-scroll" we-tooltip-title="Keeps structural headers stuck to the top of the editor pane while scrolling.">Sticky scroll</label>
                                    </span>
                                </div>
                                <div class="we-modal-option">
                                    <span class="input-group-checkbox">
                                        <input type="checkbox" class="checkbox" id="chk-ctrl-s-save-active" ng-model="userPrefsEdit.ctrlSSaveActiveOnly" />
                                        <label class="checkbox-label" for="chk-ctrl-s-save-active" we-tooltip-title="Keyboard shortcut saves the focussed editor only when enabled.">Save shortcut applies to active editor only</label>
                                    </span>
                                </div>
                                <div class="we-modal-option">
                                    <span class="input-group-checkbox">
                                        <input type="checkbox" class="checkbox" id="chk-flash-on-open" ng-model="userPrefsEdit.flashOnEditorOpen" />
                                        <label class="checkbox-label" for="chk-flash-on-open" we-tooltip-title="Briefly highlights an editor pane when it is opened or brought into focus.">Show visual indication when editor is opened</label>
                                    </span>
                                </div>
                                <div class="we-modal-option" ng-if="hasSnUtils">
                                    <span class="input-group-checkbox">
                                        <input type="checkbox" class="checkbox" id="chk-show-open-in-vscode" ng-model="userPrefsEdit.showOpenInVsCode" />
                                        <label class="checkbox-label" for="chk-show-open-in-vscode" we-tooltip-title="Displays an 'Open in VS Code' button in the header bar when the SN Utils browser extension is installed.">Show "Open in VS Code" button (SN Utils)</label>
                                    </span>
                                </div>
                            </div>
                            <div class="we-modal-section">
                                <div class="we-modal-section-title">Collaboration</div>
                                <div class="we-modal-option" style="flex-direction: column; align-items: flex-start">
                                    <div>
                                        <span class="input-group-checkbox">
                                            <input type="checkbox" class="checkbox" id="chk-realtime-updates" ng-model="userPrefsEdit.realtimeWidgetUpdates" />
                                            <label class="checkbox-label" for="chk-realtime-updates" we-tooltip-title="{{userPrefsEdit.realtimeWidgetUpdates ? 'Enabled: real-time changes are immediately applied.' : 'Disabled: a warning alert is displayed above the editor when another user updates the field.'}}">Apply real-time changes from other users</label>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- Right column: Formatting, Code Assistance -->
                        <div class="we-pref-col">
                            <div class="we-modal-section">
                                <div class="we-modal-section-title">Formatting</div>
                                <div class="we-modal-option">
                                    <label class="we-modal-option-label" for="sel-auto-closing-brackets" we-tooltip-title="Controls whether typing an opening bracket automatically appends a closing bracket.">Auto-closing brackets</label>
                                    <select id="sel-auto-closing-brackets" class="form-control we-pref-select" ng-model="userPrefsEdit.autoClosingBrackets">
                                        <option value="languageDefined">Language defined</option>
                                        <option value="always">Always</option>
                                        <option value="beforeWhitespace">Before whitespace</option>
                                        <option value="never">Never</option>
                                    </select>
                                </div>
                                <div class="we-modal-option">
                                    <label class="we-modal-option-label" for="sel-auto-closing-quotes" we-tooltip-title="Controls whether typing a quote character automatically appends its closing counterpart.">Auto-closing quotes</label>
                                    <select id="sel-auto-closing-quotes" class="form-control we-pref-select" ng-model="userPrefsEdit.autoClosingQuotes">
                                        <option value="languageDefined">Language defined</option>
                                        <option value="always">Always</option>
                                        <option value="beforeWhitespace">Before whitespace</option>
                                        <option value="never">Never</option>
                                    </select>
                                </div>
                                <div class="we-modal-option">
                                    <label class="we-modal-option-label" for="sel-auto-surround" we-tooltip-title="Defines the behaviour when you have text selected and type a quoting or bracketing character.">Auto-surround</label>
                                    <select id="sel-auto-surround" class="form-control we-pref-select" ng-model="userPrefsEdit.autoSurround">
                                        <option value="languageDefined">Language defined</option>
                                        <option value="always">Always</option>
                                        <option value="quotes">Quotes</option>
                                        <option value="brackets">Brackets</option>
                                        <option value="never">Never</option>
                                    </select>
                                </div>
                                <div class="we-modal-option">
                                    <span class="input-group-checkbox">
                                        <input type="checkbox" class="checkbox" id="chk-auto-indent" ng-model="userPrefsEdit.autoIndent" />
                                        <label class="checkbox-label" for="chk-auto-indent" we-tooltip-title="Automatically inserts appropriate whitespace.">Auto-indent</label>
                                    </span>
                                </div>
                                <div class="we-modal-option">
                                    <span class="input-group-checkbox">
                                        <input type="checkbox" class="checkbox" id="chk-format-tabs" ng-model="userPrefsEdit.formatTabsToSpaces" />
                                        <label class="checkbox-label" for="chk-format-tabs" we-tooltip-title="The number of spaces can be set in 'Tab size'.">Convert tabs to spaces when formatting</label>
                                    </span>
                                </div>
                                <div class="we-modal-option">
                                    <span class="input-group-checkbox">
                                        <input type="checkbox" class="checkbox" id="chk-format-on-paste" ng-model="userPrefsEdit.formatOnPaste" />
                                        <label class="checkbox-label" for="chk-format-on-paste" we-tooltip-title="Automatically format code when pasting.">Format on paste</label>
                                    </span>
                                </div>
                                <div class="we-modal-option">
                                    <span class="input-group-checkbox">
                                        <input type="checkbox" class="checkbox" id="chk-format-on-type" ng-model="userPrefsEdit.formatOnType" />
                                        <label class="checkbox-label" for="chk-format-on-type" we-tooltip-title="Automatically format code while typing.">Format on type</label>
                                    </span>
                                </div>
                                <div class="we-modal-option">
                                    <span class="input-group-checkbox">
                                        <input type="checkbox" class="checkbox" id="chk-func-paren" ng-model="userPrefsEdit.insertSpaceBeforeFuncParen" />
                                        <label class="checkbox-label" for="chk-func-paren" we-tooltip-title="Inserts a space before the opening parenthesis of a function declaration.">Insert space before function parenthesis</label>
                                    </span>
                                </div>
                            </div>
                            <div class="we-modal-section">
                                <div class="we-modal-section-title">Formatting (HTML)</div>
                                <div class="we-modal-option">
                                    <span class="input-group-checkbox">
                                        <input type="checkbox" class="checkbox" id="chk-html-auto-close" ng-model="userPrefsEdit.htmlAutoCloseTags" />
                                        <label class="checkbox-label" for="chk-html-auto-close" we-tooltip-title="Automatically inserts a closing tag when typing > in the HTML template editor.">Auto-close HTML tags</label>
                                    </span>
                                </div>
                                <div class="we-modal-option">
                                    <span class="input-group-checkbox">
                                        <input type="checkbox" class="checkbox" id="chk-linked-editing" ng-model="userPrefsEdit.linkedEditing" />
                                        <label class="checkbox-label" for="chk-linked-editing" we-tooltip-title="Automatically updates the closing tag when you edit the opening tag in HTML/XML.">Linked editing</label>
                                    </span>
                                </div>
                                <div class="we-modal-option">
                                    <span class="input-group-checkbox">
                                        <input type="checkbox" class="checkbox" id="chk-html-validation" ng-model="userPrefsEdit.htmlValidation" />
                                        <label class="checkbox-label" for="chk-html-validation" we-tooltip-title="Highlights missing and mismatched closing tags in the HTML template editor.">Validate HTML tags</label>
                                    </span>
                                </div>
                            </div>
                            <div class="we-modal-section">
                                <div class="we-modal-section-title">Code Assistance</div>
                                <div class="we-modal-option">
                                    <a href="/nav_to.do?uri=syntax_editor_macro_list.do" target="_blank" class="btn btn-default">View code macros</a>
                                </div>
                                <div class="we-modal-option">
                                    <span class="input-group-checkbox">
                                        <input type="checkbox" class="checkbox" id="chk-language-helpers" ng-model="userPrefsEdit.languageHelpers" />
                                        <label class="checkbox-label" for="chk-language-helpers">Show tooltip &amp; parameter hints</label>
                                    </span>
                                </div>
                                <div class="we-modal-option">
                                    <span class="input-group-checkbox">
                                        <input type="checkbox" class="checkbox" id="chk-show-unused-vars" ng-model="userPrefsEdit.showUnusedVars" />
                                        <label class="checkbox-label" for="chk-show-unused-vars">Show unused variables</label>
                                    </span>
                                </div>
                                <div class="we-modal-option we-modal-option-row">
                                    <label class="we-modal-option-label" for="pref-tab-size">Tab size</label>
                                    <div class="we-spin-wrap">
                                        <button type="button" class="we-spin-btn we-spin-dec" ng-click="userPrefsEdit.tabSize = userPrefsEdit.tabSize > 1 ? userPrefsEdit.tabSize - 1 : 1" aria-label="Decrease tab size"><i class="icon-subtract"></i></button>
                                        <input type="number" class="we-pref-number" id="pref-tab-size" ng-model="userPrefsEdit.tabSize" min="1" max="8" step="1" />
                                        <button type="button" class="we-spin-btn we-spin-inc" ng-click="userPrefsEdit.tabSize = userPrefsEdit.tabSize &lt; 8 ? userPrefsEdit.tabSize + 1 : 8" aria-label="Increase tab size">+</button>
                                    </div>
                                    <span style="font-size:var(--now-font-size--sm);color:rgb(var(--now-color_text--secondary))">spaces</span>
                                </div>
                                <div class="we-modal-option we-modal-option-row">
                                    <label class="we-modal-option-label" for="pref-rem-base" we-tooltip-title="Sets the base pixel value for 1rem units (CSS/SCSS Code Action).">1rem conversion</label>
                                    <div class="we-spin-wrap">
                                        <button type="button" class="we-spin-btn we-spin-dec" ng-click="userPrefsEdit.remBase = userPrefsEdit.remBase > 1 ? userPrefsEdit.remBase - 1 : 1" aria-label="Decrease 1rem base"><i class="icon-subtract"></i></button>
                                        <input type="number" class="we-pref-number" id="pref-rem-base" ng-model="userPrefsEdit.remBase" min="1" max="100" step="1" />
                                        <button type="button" class="we-spin-btn we-spin-inc" ng-click="userPrefsEdit.remBase = userPrefsEdit.remBase &lt; 100 ? userPrefsEdit.remBase + 1 : 100" aria-label="Increase 1rem base">+</button>
                                    </div>
                                    <span style="font-size:var(--now-font-size--sm);color:rgb(var(--now-color_text--secondary))">px</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="we-modal-footer">
                    <button class="btn btn-default" ng-click="resetUserPrefsModal()" style="margin-right:auto" we-tooltip-title="Restore all preferences to their default values.">Reset</button>
                    <button class="btn btn-default" ng-click="cancelUserPrefsModal()">Cancel</button>
                    <button class="btn btn-primary" ng-click="saveUserPrefsModal()">Save</button>
                </div>
            </div>
        </div>

        <!-- Link Dependency Modal -->
        <div class="we-modal-overlay we-modal-anchored-top" ng-class="{'we-modal-overlay--leaving': _modalClosing}" ng-if="showLinkDependencyModal" ng-click="cancelLinkDependencyModal()">
            <div class="we-modal" ng-click="$event.stopPropagation()" style="width:37.5rem">
                <div class="we-modal-header" we-modal-draggable="we-modal-draggable">
                    <span>Link dependency</span>
                    <span class="close" ng-click="cancelLinkDependencyModal()" aria-label="Close" role="button" tabindex="0">×</span>
                </div>
                <div class="we-modal-body" style="padding-bottom:0.5rem">
                    <div class="we-search-wrap" style="margin-bottom:1rem; margin-top: -0.5rem;">
                        <input class="form-control we-picker-search" type="text" ng-model="linkDependency.search" ng-change="onLinkDependencySearch()" placeholder="Search by name" />
                        <span class="we-search-loader" ng-if="linkDependencySearching"><we-loader></we-loader></span>
                    </div>
                    <div class="we-link-list">
                        <div ng-if="!linkDependencySearching &amp;&amp; linkDependencyResults.length === 0" class="we-link-empty">No dependencies found</div>
                        <div class="we-link-item" ng-repeat="dep in linkDependencyResults" ng-click="selectLinkDependency(dep)">
                            <span ng-bind="dep.name"></span>
                            <a class="we-dropdown-ext-link" href="/nav_to.do?uri=sp_dependency.do%3Fsys_id={{dep.sys_id}}" target="_blank" ng-click="$event.stopPropagation()" title="Open in platform" aria-label="Open dependency in platform"></a>
                        </div>
                    </div>
                </div>
                <div class="we-modal-footer">
                    <div class="we-spacer"></div>
                    <button class="btn btn-default we-btn we-btn-secondary" ng-click="cancelLinkDependencyModal()">Cancel</button>
                </div>
            </div>
        </div>

        <!-- Unlink dependency confirmation -->
        <div class="we-modal-backdrop" ng-show="pendingUnlinkDependency">
            <div class="we-modal" ng-click="$event.stopPropagation()">
                <div class="we-modal-header" we-modal-draggable="we-modal-draggable">
                    <span class="we-modal-title">Unlink dependency</span>
                </div>
                <div class="we-modal-body">
                    <p>Unlink&nbsp;<strong ng-bind="pendingUnlinkDependency &amp;&amp; pendingUnlinkDependency.name"></strong>&nbsp;from this widget?</p>
                    <p>The dependency record itself will not be deleted.</p>
                </div>
                <div class="we-modal-footer">
                    <button class="btn btn-danger we-btn" ng-click="confirmUnlinkDependency()">Unlink</button>
                    <button class="btn btn-default we-btn we-btn-secondary" ng-click="cancelUnlinkDependency()">Cancel</button>
                </div>
            </div>
        </div>

        <!-- Link Existing Provider Modal -->
        <div class="we-modal-overlay we-modal-anchored-top" ng-class="{'we-modal-overlay--leaving': _modalClosing}" ng-if="showLinkProviderModal" ng-click="cancelLinkProviderModal()">
            <div class="we-modal" ng-click="$event.stopPropagation()" style="width:37.5rem">
                <div class="we-modal-header" we-modal-draggable="we-modal-draggable">
                    <span>Link existing provider</span>
                    <span class="close" ng-click="cancelLinkProviderModal()" aria-label="Close" role="button" tabindex="0">×</span>
                </div>
                <div class="we-modal-body" style="padding-bottom:0.5rem">
                    <div class="we-search-wrap" style="margin-bottom:1rem; margin-top: -0.5rem;">
                        <input class="form-control we-picker-search" type="text" ng-model="linkProvider.search" ng-change="onLinkProviderSearch()" placeholder="Search by name" />
                        <span class="we-search-loader" ng-if="linkProviderSearching"><we-loader></we-loader></span>
                    </div>
                    <div class="we-link-list">
                        <div ng-if="!linkProviderSearching &amp;&amp; linkProviderResults.length === 0" class="we-link-empty">No providers found</div>
                        <div class="we-link-item" ng-repeat="p in linkProviderResults" ng-click="selectLinkProvider(p)">
                            <span class="we-link-id" ng-bind="p.name"></span>
                            <a class="we-dropdown-ext-link" href="/nav_to.do?uri=sp_angular_provider.do%3Fsys_id={{p.sys_id}}" target="_blank" ng-click="$event.stopPropagation()" title="Open in platform" aria-label="Open provider in platform"></a>
                        </div>
                    </div>
                </div>
                <div class="we-modal-footer">
                    <div class="we-spacer"></div>
                    <button class="btn btn-default we-btn we-btn-secondary" ng-click="cancelLinkProviderModal()">Cancel</button>
                </div>
            </div>
        </div>

        <!-- Option Schema Modal -->
        <div class="we-modal-overlay we-modal-anchored-top" ng-class="{'we-modal-overlay--leaving': _modalClosing}" ng-if="showOptionSchemaModal" ng-click="closeOptionSchemaModal()">
            <div class="we-modal" ng-click="$event.stopPropagation()" style="width:45rem;max-width:95vw">
                <div class="we-modal-header" we-modal-draggable="we-modal-draggable">
                    <span>Option schema</span>
                    <span class="close" ng-click="closeOptionSchemaModal()" aria-label="Close" role="button" tabindex="0">×</span>
                </div>
                <div class="we-modal-body" style="padding:0;gap:0">
                    <div ng-if="optionSchemaLoading" style="padding:1.5rem 1rem;color:rgb(var(--now-color_text--tertiary));display:flex;flex-direction:column;align-items:center;gap:0.75rem">
                        <we-spinner></we-spinner>
                        Loading…
                    </div>
                    <div ng-if="optionSchemaLoadError" style="padding:1rem;color:rgb(var(--now-alert--critical--color, var(--now-color_alert--critical-3)))" ng-bind="optionSchemaLoadError"></div>
                    <div ng-if="!optionSchemaLoading &amp;&amp; !optionSchemaLoadError" id="option-schema-editor" class="we-option-schema-editor"></div>
                </div>
                <div class="we-modal-footer">
                    <button class="btn btn-default" ng-click="closeOptionSchemaModal()" style="margin-left:auto">Cancel</button>
                    <div>
                        <span style="color:rgb(var(--now-alert--critical--color, var(--now-color_alert--critical-3))); font-size:var(--now-font-size--sm);align-self:center">
                            <span ng-if="optionSchemaSaveError" ng-bind="optionSchemaSaveError"></span>
                            <span ng-if="!optionSchemaSaveError &amp;&amp; optionSchemaJsonInvalid"><i class="icon-alert-triangle"></i>&nbsp;Invalid JSON</span>
                        </span>
                        <button class="btn btn-primary" ng-if="canWriteWidget" ng-click="saveOptionSchemaModal()" ng-disabled="optionSchemaSaving || optionSchemaJsonInvalid" ng-bind="optionSchemaSaving ? 'Saving\\u2026' : 'Save'"></button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Demo Data Modal -->
        <div class="we-modal-overlay we-modal-anchored-top" ng-class="{'we-modal-overlay--leaving': _modalClosing}" ng-if="showDemoDataModal" ng-click="closeDemoDataModal()">
            <div class="we-modal" ng-click="$event.stopPropagation()" style="width:45rem;max-width:95vw">
                <div class="we-modal-header" we-modal-draggable="we-modal-draggable">
                    <span>Demo data</span>
                    <span class="close" ng-click="closeDemoDataModal()" aria-label="Close" role="button" tabindex="0">×</span>
                </div>
                <div class="we-modal-body" style="padding:0;gap:0">
                    <div ng-if="demoDataLoading" style="padding:1.5rem 1rem;color:rgb(var(--now-color_text--tertiary));display:flex;flex-direction:column;align-items:center;gap:0.75rem">
                        <we-spinner></we-spinner>
                        Loading…
                    </div>
                    <div ng-if="demoDataLoadError" style="padding:1rem;color:rgb(var(--now-alert--critical--color, var(--now-color_alert--critical-3)))" ng-bind="demoDataLoadError"></div>
                    <div ng-if="!demoDataLoading &amp;&amp; !demoDataLoadError" id="demo-data-editor" class="we-option-schema-editor"></div>
                </div>
                <div class="we-modal-footer">
                    <button class="btn btn-default" ng-click="closeDemoDataModal()" style="margin-left:auto">Cancel</button>
                    <div>
                        <span style="color:rgb(var(--now-alert--critical--color, var(--now-color_alert--critical-3))); font-size:var(--now-font-size--sm);align-self:center">
                            <span ng-if="demoDataSaveError" ng-bind="demoDataSaveError"></span>
                            <span ng-if="!demoDataSaveError &amp;&amp; demoDataJsonInvalid"><i class="icon-alert-triangle"></i>&nbsp;Invalid JSON</span>
                        </span>
                        <button class="btn btn-primary" ng-if="canWriteWidget" ng-click="saveDemoDataModal()" ng-disabled="demoDataSaving || demoDataJsonInvalid" ng-bind="demoDataSaving ? 'Saving\\u2026' : 'Save'"></button>
                    </div>
                </div>
            </div>
        </div>

        <!-- XML Modal -->
        <div class="we-modal-overlay we-modal-anchored-top" ng-class="{'we-modal-overlay--leaving': _modalClosing}" ng-if="showXmlModal" ng-click="closeXmlModal()">
            <div class="we-modal" ng-click="$event.stopPropagation()" style="width:56.25rem;max-width:95vw">
                <div class="we-modal-header" we-modal-draggable="we-modal-draggable">
                    <span>Widget XML</span>
                    <span class="close" ng-click="closeXmlModal()" aria-label="Close" role="button" tabindex="0">×</span>
                </div>
                <div class="we-modal-body" style="padding:0;gap:0">
                    <div ng-if="xmlLoading" style="padding:1.5rem 1rem;color:rgb(var(--now-color_text--tertiary));display:flex;flex-direction:column;align-items:center;gap:0.75rem">
                        <we-spinner></we-spinner>
                        Loading…
                    </div>
                    <div ng-if="xmlLoadError" style="padding:1rem;color:rgb(var(--now-alert--critical--color, var(--now-color_alert--critical-3)))" ng-bind="xmlLoadError"></div>
                    <div ng-if="!xmlLoading &amp;&amp; !xmlLoadError" id="xml-modal-editor" class="we-xml-editor"></div>
                </div>
                <div class="we-modal-footer">
                    <a ng-if="xmlExportUrl" class="btn btn-default" ng-href="{{xmlExportUrl}}" target="_blank">Export XML</a>
                    <button class="btn btn-primary" ng-click="closeXmlModal()" style="margin-left:auto">Close</button>
                </div>
            </div>
        </div>

        <!-- Version Diff Modal -->
        <div class="we-modal-overlay" ng-class="{'we-modal-overlay--leaving': _modalClosing}" ng-if="versionDiffModal.open" ng-click="closeVersionDiffModal()">
            <div class="we-modal" ng-click="$event.stopPropagation()" style="width:98vw;max-width:112.5rem;height:95vh;display:flex;flex-direction:column">
                <div class="we-modal-header" we-modal-draggable="we-modal-draggable">
                    <span ng-if="!versionDiffModal.expandedField">Compare versions</span>
                    <span ng-if="versionDiffModal.expandedField" ng-bind-template="Compare versions — {{versionDiffModal.expandedField}}"></span>
                    <button class="btn btn-default" ng-if="!versionDiffModal.isUnsaved" ng-click="openVersionDiffInNewTab()" style="margin-left:auto;margin-right:0.875rem">Open in new tab <span class="we-ext-icon" style="margin-left: 0.5rem" aria-hidden="true"></span></button>
                    <span class="close" ng-click="closeVersionDiffModal()" aria-label="Close" role="button" tabindex="0">×</span>
                </div>
                <iframe class="we-diff-iframe" ng-src="{{versionDiffModal.url}}" style="flex:1;border:none;width:100%"></iframe>
            </div>
        </div>

        <!-- Related Lists Modal -->
        <div class="we-modal-overlay" ng-class="{'we-modal-overlay--leaving': _modalClosing}" ng-if="relatedModal.open" ng-click="closeRelatedModal()">
            <div class="we-modal we-related-modal" ng-click="$event.stopPropagation()">
                <div class="we-modal-header" we-modal-draggable="we-modal-draggable">
                    <span ng-bind-template="Related Lists — {{widget.name}}"></span>
                    <span class="close" ng-click="closeRelatedModal()" aria-label="Close" role="button" tabindex="0">×</span>
                </div>
                <div style="position:relative;flex:1;display:flex;flex-direction:column;overflow:hidden;min-height:0">
                <div class="we-related-loading-overlay" ng-if="relatedModal.loading">
                    <we-spinner></we-spinner>
                    Loading…
                </div>
                <div ng-if="!relatedModal.loading &amp;&amp; relatedModal.tabs.length === 0" class="we-related-empty">No related lists configured.</div>
                <div ng-if="!relatedModal.loading &amp;&amp; relatedModal.tabs.length > 0" style="display:flex;flex-direction:column;flex:1;overflow:hidden">
                    <div class="tabs2_strip">
                        <span class="tab_header" ng-repeat="tab in relatedModal.tabs" ng-click="selectRelatedTab(tab)">
                            <span class="tabs2_tab" ng-class="{'tabs2_active': relatedModal.activeTab === tab}">
                                <span class="tab_caption_text"><span ng-bind="tab.title" style="margin-right : 0.25rem;"></span> (<span ng-bind="tab.count"></span>)</span>
                            </span>
                        </span>
                    </div>
                    <div class="we-related-body tabs2_list" ng-if="relatedModal.activeTab" style="position:relative">
                        <div class="we-related-loading-overlay" ng-if="relatedModal.activeTab.loading">
                            <we-spinner></we-spinner>
                            Loading…
                        </div>
                        <div ng-if="relatedModal.activeTab.error" class="we-related-empty" style="color:rgb(var(--now-alert--critical--color, var(--now-color_alert--critical-3)))" ng-bind="relatedModal.activeTab.error"></div>
                        <div ng-if="!relatedModal.activeTab.loading &amp;&amp; !relatedModal.activeTab.error" class="we-related-table-container">
                            <table ng-if="relatedModal.activeTab.rows !== null" class="data_list_table list_table table table-hover">
                                <thead>
                                    <tr>
                                        <th ng-repeat="col in relatedModal.activeTab.columns" ng-bind="col.label"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr ng-repeat="row in relatedModal.activeTab.rows" ng-class="{'list_row list_even': $even, 'list_row list_odd': $odd}">
                                        <td ng-repeat="col in relatedModal.activeTab.columns">
                                            <a ng-if="col.firstLink" ng-href="{{relatedRecordUrl(relatedModal.activeTab.table, row.sys_id)}}" target="_blank" ng-bind="row[col.field]"></a>
                                            <a ng-if="!col.firstLink &amp;&amp; col.refTable &amp;&amp; row[col.field + '__ref_id']" ng-href="{{relatedRecordUrl(col.refTable, row[col.field + '__ref_id'])}}" target="_blank" ng-bind="row[col.field]"></a>
                                            <span ng-if="!col.firstLink &amp;&amp; (!col.refTable || !row[col.field + '__ref_id'])" ng-bind="row[col.field]"></span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <div ng-if="relatedModal.activeTab.rows !== null &amp;&amp; relatedModal.activeTab.rows.length === 0" class="list2_empty-state-list">
                                <svg xmlns="http://www.w3.org/2000/svg" width="216" height="168" fill="none" viewBox="0 0 216 168" class="list-flavin"><style>.main-object--outline{fill:rgb(var(--empty-state--main-object--outline,var(--main-object--outline,var(--now-color--interactive-3,51,53,123))))}.main-object--fill{fill:rgb(var(--empty-state--main-object--fill,var(--main-object--fill,var(--now-color--interactive-1,144,146,213))))}.primary-object--outline{fill:rgb(var(--empty-state--primary-object--outline,var(--primary-object--outline,var(--now-color_border--secondary,176,181,191))))}.primary-object--primary-fill{fill:rgb(var(--empty-state--primary-object--primary-fill,var(--primary-object--primary-fill,var(--now-color_background--primary,255,255,255))))}.primary-object--tertiary-fill{fill:rgb(var(--empty-state--primary-object--tertiary-fill,var(--primary-object--tertiary-fill,var(--now-color_background--secondary,246,246,248))))}.primary-object--detail{fill:rgb(var(--empty-state--primary-object--detail,var(--primary-object--detail,var(--now-color_border--tertiary,211,214,220))))}.primary-object--shadow{fill:rgb(var(--empty-state--primary-object--shadow,var(--primary-object--shadow,var(--now-color_background--tertiary,228,230,234))))}.background--tertiary-lines{fill:rgb(var(--empty-state--background--tertiary-lines,var(--background--tertiary-lines,var(--now-color_border--tertiary,211,214,220))))}</style><g><path fill-rule="evenodd" d="M24 114a1 1 0 0 1 1-1h1.75a1 1 0 0 1 0 2H25a1 1 0 0 1-1-1Zm8.75 0a1 1 0 0 1 1-1h3.5a1 1 0 0 1 0 2h-3.5a1 1 0 0 1-1-1Zm10.5 0a1 1 0 0 1 1-1h3.5a1 1 0 0 1 0 2h-3.5a1 1 0 0 1-1-1Zm10.5 0a1 1 0 0 1 1-1H67a1 1 0 0 1 0 2h-1.75a1 1 0 0 1-1-1ZM134 155a1 1 0 0 1 1-1h1.625a1 1 0 0 1 0 2H135a1 1 0 0 1-1-1Zm8.125 0a1 1 0 0 1 1-1h3.25a1 1 0 0 1 0 2h-3.25a1 1 0 0 1-1-1Zm9.75 0a1 1 0 0 1 1-1h1.625a1 1 0 0 1 0 2h-1.625a1 1 0 0 1-1-1ZM61 23a1 1 0 0 1 1-1h2.417a1 1 0 1 1 0 2H62a1 1 0 0 1-1-1Zm12.083 0a1 1 0 0 1 1-1H76.5a1 1 0 1 1 0 2h-2.417a1 1 0 0 1-1-1ZM195.5 77a1 1 0 0 0-1-1h-1.875a1 1 0 0 0 0 2h1.875a1 1 0 0 0 1-1Zm-9.375 0a1 1 0 0 0-1-1h-3.75a1 1 0 0 0 0 2h3.75a1 1 0 0 0 1-1Zm-11.25 0a1 1 0 0 0-1-1H172a1 1 0 0 0 0 2h1.875a1 1 0 0 0 1-1Z" class="background--tertiary-lines" clip-rule="evenodd"/><path d="M181 134c0 5-32.683 5-73 5s-73 0-73-5 32.683-5 73-5 73 0 73 5Z" class="primary-object--shadow"/><path d="M175.342 125.644V55.291H42.478v70.353a7 7 0 0 0 7 7h118.864a7 7 0 0 0 7-7Z" class="primary-object--primary-fill"/><path d="M168.342 38H49.477a7 7 0 0 0-7 7v10.29h132.865V45a7 7 0 0 0-7-7Z" class="primary-object--tertiary-fill"/><path fill-rule="evenodd" d="M49.477 37a8 8 0 0 0-8 8v80.644a8 8 0 0 0 8 8h118.865a8 8 0 0 0 8-8V45a8 8 0 0 0-8-8H49.477Zm-6 8a6 6 0 0 1 6-6h118.865a6 6 0 0 1 6 6v9.29H43.477V45Zm0 80.644V56.291h130.865v69.353a6 6 0 0 1-6 6H49.477a6 6 0 0 1-6-6Z" class="primary-object--outline" clip-rule="evenodd"/><path d="M136.666 43.46a3.185 3.185 0 1 1 0 6.37 3.185 3.185 0 0 1 0-6.37Zm11.831 0a3.185 3.185 0 1 1 0 6.37 3.185 3.185 0 0 1 0-6.37Zm11.83 0a3.185 3.185 0 1 1 0 6.37 3.185 3.185 0 0 1 0-6.37Z" class="primary-object--detail"/><path fill-rule="evenodd" d="M109 112c10.493 0 19-8.507 19-19s-8.507-19-19-19-19 8.507-19 19 8.507 19 19 19Zm0 6c13.807 0 25-11.193 25-25s-11.193-25-25-25-25 11.193-25 25 11.193 25 25 25Z" class="main-object--fill" clip-rule="evenodd"/><g class="main-object--outline"><path d="M130.457 80.123a1 1 0 0 1 1.358.396A25.892 25.892 0 0 1 135.001 93c0 14.36-11.641 26-26 26-10.049 0-18.764-5.7-23.092-14.039a1 1 0 1 1 1.776-.921C91.682 111.742 99.728 117 109 117c13.255 0 24-10.745 24-24 0-4.176-1.066-8.1-2.94-11.52a1 1 0 0 1 .396-1.357Z"/><path d="M110.5 103.5a1.5 1.5 0 1 1-3.001-.001 1.5 1.5 0 0 1 3.001.001ZM104 88a5 5 0 1 1 5.831 4.931c-.924.155-1.831.93-1.831 2.069v3a1 1 0 0 0 2 0v-3a.106.106 0 0 1 .018-.025.261.261 0 0 1 .143-.07A7 7 0 1 0 102 88a1 1 0 0 0 2-.001Z"/></g></g></svg>
                                <p>No records found</p>
                            </div>
                        </div>
                    </div>
                    <div class="we-related-pagination" ng-if="relatedModal.activeTab &amp;&amp; !relatedModal.activeTab.loading &amp;&amp; relatedModal.activeTab.rows !== null &amp;&amp; relatedModal.activeTab.rows.length > 0">
                        <button class="btn btn-icon we-pg-btn" name="vcr_first" title="First page" ng-disabled="relatedModal.activeTab.page === 0" ng-click="loadRelatedTabData(relatedModal.activeTab, 0)" aria-label="First page">
                            <span class="icon-vcr-left"></span><span class="icon-vcr-left"></span>
                        </button>
                        <button class="btn btn-icon we-pg-btn" name="vcr_prev" title="Previous page" ng-disabled="relatedModal.activeTab.page === 0" ng-click="loadRelatedTabData(relatedModal.activeTab, relatedModal.activeTab.page - 1)" aria-label="Previous page">
                            <span class="icon-vcr-left"></span>
                        </button>
                        <div class="vcr_controls">
                            <input id="pageStart" type="number" min="1" class="list_row_number_input we-pg-start-input form-control" ng-model="relatedModal.activeTab.pageStartInput" ng-keydown="$event.keyCode === 13 &amp;&amp; navigateToStartRow(relatedModal.activeTab)" ng-click="$event.target.select()" aria-label="Skip to row" autocomplete="off" />
                            <span class="list_row_number_input" style="margin-left: 0.325rem;">to {{relatedModal.activeTab.pageEnd}} of {{relatedModal.activeTab.count}}</span>
                        </div>
                        <button class="btn btn-icon we-pg-btn" name="vcr_next" title="Next page" ng-disabled="relatedModal.activeTab.pageEnd &gt;= relatedModal.activeTab.count" ng-click="loadRelatedTabData(relatedModal.activeTab, relatedModal.activeTab.page + 1)" aria-label="Next page">
                            <span class="icon-vcr-right"></span>
                        </button>
                        <button class="btn btn-icon we-pg-btn" name="vcr_last" title="Last page" ng-disabled="relatedModal.activeTab.pageEnd &gt;= relatedModal.activeTab.count" ng-click="loadRelatedTabData(relatedModal.activeTab, relatedModal.activeTab.lastPage)" aria-label="Last page">
                            <span class="icon-vcr-right"></span><span class="icon-vcr-right"></span>
                        </button>
                    </div>
                </div>
                </div>
            </div>
        </div>

        <!-- Widget picker modal -->
        <div class="we-modal-backdrop we-modal-anchored-top" ng-show="showWidgetPickerModal || showPicker" ng-click="!showPicker &amp;&amp; closeWidgetPickerModal()">
            <div class="we-picker-box" ng-click="$event.stopPropagation()" style="width:40rem">
                <div class="we-picker-title-row">
                    <span class="we-picker-title">Open a Widget</span>
                    <button class="btn btn-default" ng-click="newWidget()" style="margin-left: auto;">+ New Widget</button>
                    <span class="close" ng-if="!showPicker" ng-click="closeWidgetPickerModal()" aria-label="Close" role="button" tabindex="0">×</span>
                </div>
                <div class="we-picker-body">
                    <div class="we-search-wrap">
                        <input class="form-control we-picker-search" type="text" ng-model="picker.search"
                            ng-change="onPickerSearch()" placeholder="Search by name or ID" />
                        <span class="we-search-loader" ng-if="pickerLoading"><we-loader></we-loader></span>
                    </div>
                    <div class="we-link-list">
                        <div class="we-link-empty" ng-if="!pickerLoading &amp;&amp; pickerWidgets.length === 0">No widgets found</div>
                        <div class="we-picker-item we-link-item" ng-repeat="w in pickerWidgets" ng-click="openWidget(w)" ng-keydown="onWidgetPickerItemKeydown($event, w)" tabindex="0" role="button">
                            <span class="we-picker-item-name" ng-bind="w.name"></span>
                            <span class="we-picker-item-id" ng-bind="w.id"></span>
                            <a class="we-dropdown-ext-link" ng-href="{{w.widgetEditorUrl}}" target="_blank" ng-click="$event.stopPropagation()" title="Open in Widget Editor+" aria-label="Open widget in Widget Editor+"></a>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Delete template/provider confirmation -->
        <div class="we-modal-backdrop" ng-show="pendingDeletePane">
            <div class="we-modal-box" style="width:25rem">
                <div class="we-modal-title" ng-bind="(pendingDeletePane &amp;&amp; pendingDeletePane.recordType === 'template') ? 'Delete Template' : 'Delete Provider'"></div>
                <div class="we-modal-body">
                    <p>Are you sure you want to delete&nbsp;<strong ng-bind="pendingDeletePane &amp;&amp; pendingDeletePane.recordId"></strong>? This cannot be undone.</p>
                </div>
                <div class="we-modal-actions">
                    <button class="btn btn-danger" ng-click="confirmDeletePane()" ng-disabled="pendingDeletePane &amp;&amp; pendingDeletePane.deleting" ng-bind="(pendingDeletePane &amp;&amp; pendingDeletePane.deleting) ? 'Deleting\\u2026' : 'Delete'"></button>
                    <button class="btn btn-default" ng-click="cancelDeletePane()" ng-disabled="pendingDeletePane &amp;&amp; pendingDeletePane.deleting">Cancel</button>
                </div>
            </div>
        </div>

        <!-- Unlink provider confirmation -->
        <div class="we-modal-backdrop" ng-show="pendingUnlinkProvider">
            <div class="we-modal-box" style="width:25rem">
                <div class="we-modal-title">Unlink Provider</div>
                <div class="we-modal-body">
                    <p>Unlink&nbsp;<strong ng-bind="pendingUnlinkProvider &amp;&amp; pendingUnlinkProvider.name"></strong>&nbsp;from this widget? The provider record will not be deleted.</p>
                </div>
                <div class="we-modal-actions">
                    <button class="btn btn-danger" ng-click="confirmUnlinkProvider()" ng-disabled="pendingUnlinkProvider &amp;&amp; pendingUnlinkProvider.unlinking" ng-bind="(pendingUnlinkProvider &amp;&amp; pendingUnlinkProvider.unlinking) ? 'Unlinking\\u2026' : 'Unlink'"></button>
                    <button class="btn btn-default" ng-click="cancelUnlinkProvider()" ng-disabled="pendingUnlinkProvider &amp;&amp; pendingUnlinkProvider.unlinking">Cancel</button>
                </div>
            </div>
        </div>

        <!-- Close template/provider with unsaved changes -->
        <div class="we-modal-backdrop" ng-show="pendingClosePane">
            <div class="we-modal-box" style="width:25rem">
                <div class="we-modal-title">Unsaved Changes</div>
                <div class="we-modal-body">
                    <p><strong ng-bind="pendingClosePane.recordId || pendingClosePane.label"></strong>&nbsp;has unsaved changes.</p>
                </div>
                <div class="we-modal-actions">
                    <button class="btn btn-primary" ng-click="saveAndClosePane()">Save &amp; Close</button>
                    <button class="btn btn-danger" ng-click="discardAndClosePane()">Discard</button>
                    <button class="btn btn-default" ng-click="cancelClosePane()">Cancel</button>
                </div>
            </div>
        </div>

        <!-- Unsaved changes confirmation — open existing widget -->
        <div class="we-modal-backdrop" ng-show="pendingWidgetNav">
            <div class="we-modal-box" style="width:25rem">
                <div class="we-modal-title">Unsaved Changes</div>
                <div class="we-modal-body">
                    <p>You have unsaved changes. What would you like to do before opening&nbsp;<strong ng-bind="pendingWidgetNav.name"></strong>?</p>
                </div>
                <div class="we-modal-actions">
                    <button class="btn btn-primary" ng-click="saveAndOpenWidget()">Save &amp; Open</button>
                    <button class="btn btn-danger" ng-click="discardAndOpenWidget()">Discard &amp; Open</button>
                    <button class="btn btn-default" ng-click="cancelWidgetNav()">Cancel</button>
                </div>
            </div>
        </div>

        <!-- Unsaved changes confirmation — new widget -->
        <div class="we-modal-backdrop" ng-show="pendingNewWidget">
            <div class="we-modal-box" style="width:25rem">
                <div class="we-modal-title">Unsaved Changes</div>
                <div class="we-modal-body">
                    <p>You have unsaved changes. What would you like to do?</p>
                </div>
                <div class="we-modal-actions">
                    <button class="btn btn-primary" ng-click="saveAndNewWidget()">Save</button>
                    <button class="btn btn-danger" ng-click="discardAndNewWidget()">Discard</button>
                    <button class="btn btn-default" ng-click="cancelNewWidget()">Cancel</button>
                </div>
            </div>
        </div>

        <!-- Keyboard shortcuts modal -->
        <div class="we-modal-overlay" ng-class="{'we-modal-overlay--leaving': _modalClosing}" ng-if="showKeyboardShortcutsModal" ng-click="closeKeyboardShortcutsModal()">
            <div class="we-modal we-modal-kbd" ng-click="$event.stopPropagation()">
                <div class="we-modal-header" we-modal-draggable="we-modal-draggable">
                    <span>Keyboard shortcuts</span>
                    <span class="close" ng-click="closeKeyboardShortcutsModal()" aria-label="Close" role="button" tabindex="0">×</span>
                </div>
                <div class="we-modal-body we-kbd-sections">

                    <!-- Mouse & scroll shortcuts -->
                    <div>
                        <div class="we-modal-section-title" style="margin-bottom:0.625rem">Mouse &amp; scroll</div>
                        <div class="we-kbd-mouse-list">
                            <div class="we-kbd-mouse-item">
                                <span class="we-kbd-mouse-gesture"><kbd class="we-kbd-key">Shift</kbd><span class="we-kbd-sep">+</span>Scroll wheel</span>
                                <span class="we-kbd-mouse-desc">Horizontal scroll</span>
                            </div>
                            <div class="we-kbd-mouse-item">
                                <span class="we-kbd-mouse-gesture"><kbd class="we-kbd-key">Ctrl</kbd><span class="we-kbd-sep">+</span>Scroll wheel</span>
                                <span class="we-kbd-mouse-desc">Zoom in / out</span>
                            </div>
                            <div class="we-kbd-mouse-item">
                                <span class="we-kbd-mouse-gesture"><kbd class="we-kbd-key">Alt</kbd><span class="we-kbd-sep">+</span>Left click</span>
                                <span class="we-kbd-mouse-desc">Add cursor (multi-cursor)</span>
                            </div>
                            <div class="we-kbd-mouse-item">
                                <span class="we-kbd-mouse-gesture">Middle-click<span class="we-kbd-sep">+</span>drag</span>
                                <span class="we-kbd-mouse-desc">Column (box) selection</span>
                            </div>
                            <div class="we-kbd-mouse-item">
                                <span class="we-kbd-mouse-gesture"><kbd class="we-kbd-key">Ctrl</kbd><span class="we-kbd-sep">+</span>Left click</span>
                                <span class="we-kbd-mouse-desc">Go to definition</span>
                            </div>
                        </div>
                    </div>

                    <!-- Keyboard shortcuts table -->
                    <div>
                        <div class="we-modal-section-title" style="margin-bottom:0.5rem">Keyboard shortcuts</div>
                        <table class="we-kbd-table">
                            <thead>
                                <tr>
                                    <th>Action</th>
                                    <th>Windows / Linux</th>
                                    <th>macOS</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td class="we-kbd-action">Save</td>
                                    <td><kbd class="we-kbd-key">Ctrl</kbd><span class="we-kbd-sep">+</span><kbd class="we-kbd-key">S</kbd></td>
                                    <td><kbd class="we-kbd-key">⌘</kbd><span class="we-kbd-sep">+</span><kbd class="we-kbd-key">S</kbd></td>
                                </tr>
                                <tr>
                                    <td class="we-kbd-action">Command palette</td>
                                    <td><kbd class="we-kbd-key">F1</kbd><span class="we-kbd-sep"> or </span><kbd class="we-kbd-key">Ctrl</kbd><span class="we-kbd-sep">+</span><kbd class="we-kbd-key">Shift</kbd><span class="we-kbd-sep">+</span><kbd class="we-kbd-key">P</kbd></td>
                                    <td><kbd class="we-kbd-key">F1</kbd><span class="we-kbd-sep"> or </span><kbd class="we-kbd-key">⌘</kbd><span class="we-kbd-sep">+</span><kbd class="we-kbd-key">Shift</kbd><span class="we-kbd-sep">+</span><kbd class="we-kbd-key">P</kbd></td>
                                </tr>
                                <tr>
                                    <td class="we-kbd-action">Undo / Redo</td>
                                    <td><kbd class="we-kbd-key">Ctrl</kbd><span class="we-kbd-sep">+</span><kbd class="we-kbd-key">Z</kbd><span class="we-kbd-sep"> / </span><kbd class="we-kbd-key">Ctrl</kbd><span class="we-kbd-sep">+</span><kbd class="we-kbd-key">Y</kbd></td>
                                    <td><kbd class="we-kbd-key">⌘</kbd><span class="we-kbd-sep">+</span><kbd class="we-kbd-key">Z</kbd><span class="we-kbd-sep"> / </span><kbd class="we-kbd-key">⌘</kbd><span class="we-kbd-sep">+</span><kbd class="we-kbd-key">Shift</kbd><span class="we-kbd-sep">+</span><kbd class="we-kbd-key">Z</kbd></td>
                                </tr>
                                <tr>
                                    <td class="we-kbd-action">Toggle line comment</td>
                                    <td><kbd class="we-kbd-key">Ctrl</kbd><span class="we-kbd-sep">+</span><kbd class="we-kbd-key">/</kbd></td>
                                    <td><kbd class="we-kbd-key">⌘</kbd><span class="we-kbd-sep">+</span><kbd class="we-kbd-key">/</kbd></td>
                                </tr>
                                <tr>
                                    <td class="we-kbd-action">Find / Replace</td>
                                    <td><kbd class="we-kbd-key">Ctrl</kbd><span class="we-kbd-sep">+</span><kbd class="we-kbd-key">F</kbd><span class="we-kbd-sep"> / </span><kbd class="we-kbd-key">Ctrl</kbd><span class="we-kbd-sep">+</span><kbd class="we-kbd-key">H</kbd></td>
                                    <td><kbd class="we-kbd-key">⌘</kbd><span class="we-kbd-sep">+</span><kbd class="we-kbd-key">F</kbd><span class="we-kbd-sep"> / </span><kbd class="we-kbd-key">⌘</kbd><span class="we-kbd-sep">+</span><kbd class="we-kbd-key">⌥</kbd><span class="we-kbd-sep">+</span><kbd class="we-kbd-key">F</kbd></td>
                                </tr>
                                <tr>
                                    <td class="we-kbd-action">Move line up / down</td>
                                    <td><kbd class="we-kbd-key">Alt</kbd><span class="we-kbd-sep">+</span><kbd class="we-kbd-key">↑</kbd><span class="we-kbd-sep">/</span><kbd class="we-kbd-key">↓</kbd></td>
                                    <td><kbd class="we-kbd-key">⌥</kbd><span class="we-kbd-sep">+</span><kbd class="we-kbd-key">↑</kbd><span class="we-kbd-sep">/</span><kbd class="we-kbd-key">↓</kbd></td>
                                </tr>
                                <tr>
                                    <td class="we-kbd-action">Copy line up / down</td>
                                    <td><kbd class="we-kbd-key">Shift</kbd><span class="we-kbd-sep">+</span><kbd class="we-kbd-key">Alt</kbd><span class="we-kbd-sep">+</span><kbd class="we-kbd-key">↑</kbd><span class="we-kbd-sep">/</span><kbd class="we-kbd-key">↓</kbd></td>
                                    <td><kbd class="we-kbd-key">Shift</kbd><span class="we-kbd-sep">+</span><kbd class="we-kbd-key">⌥</kbd><span class="we-kbd-sep">+</span><kbd class="we-kbd-key">↑</kbd><span class="we-kbd-sep">/</span><kbd class="we-kbd-key">↓</kbd></td>
                                </tr>
                                <tr>
                                    <td class="we-kbd-action">Multi-cursor above / below</td>
                                    <td><kbd class="we-kbd-key">Ctrl</kbd><span class="we-kbd-sep">+</span><kbd class="we-kbd-key">Alt</kbd><span class="we-kbd-sep">+</span><kbd class="we-kbd-key">↑</kbd><span class="we-kbd-sep">/</span><kbd class="we-kbd-key">↓</kbd></td>
                                    <td><kbd class="we-kbd-key">⌘</kbd><span class="we-kbd-sep">+</span><kbd class="we-kbd-key">⌥</kbd><span class="we-kbd-sep">+</span><kbd class="we-kbd-key">↑</kbd><span class="we-kbd-sep">/</span><kbd class="we-kbd-key">↓</kbd></td>
                                </tr>
                                <tr>
                                    <td class="we-kbd-action">Format document</td>
                                    <td><kbd class="we-kbd-key">Shift</kbd><span class="we-kbd-sep">+</span><kbd class="we-kbd-key">Alt</kbd><span class="we-kbd-sep">+</span><kbd class="we-kbd-key">F</kbd></td>
                                    <td><kbd class="we-kbd-key">Shift</kbd><span class="we-kbd-sep">+</span><kbd class="we-kbd-key">⌥</kbd><span class="we-kbd-sep">+</span><kbd class="we-kbd-key">F</kbd></td>
                                </tr>
                                <tr>
                                    <td class="we-kbd-action">Toggle tab trapping</td>
                                    <td><kbd class="we-kbd-key">Ctrl</kbd><span class="we-kbd-sep">+</span><kbd class="we-kbd-key">M</kbd></td>
                                    <td><kbd class="we-kbd-key">Ctrl</kbd><span class="we-kbd-sep">+</span><kbd class="we-kbd-key">Shift</kbd><span class="we-kbd-sep">+</span><kbd class="we-kbd-key">M</kbd></td>
                                </tr>
                                <tr>
                                    <td class="we-kbd-action">Go to line</td>
                                    <td><kbd class="we-kbd-key">Ctrl</kbd><span class="we-kbd-sep">+</span><kbd class="we-kbd-key">G</kbd></td>
                                    <td><kbd class="we-kbd-key">Ctrl</kbd><span class="we-kbd-sep">+</span><kbd class="we-kbd-key">G</kbd></td>
                                </tr>
                                <tr>
                                    <td class="we-kbd-action">Rename symbol</td>
                                    <td><kbd class="we-kbd-key">F2</kbd></td>
                                    <td><kbd class="we-kbd-key">F2</kbd></td>
                                </tr>
                                <tr>
                                    <td class="we-kbd-action">Go to definition</td>
                                    <td><kbd class="we-kbd-key">F12</kbd></td>
                                    <td><kbd class="we-kbd-key">F12</kbd></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                </div>
                <div class="we-modal-footer">
                    <div class="we-spacer"></div>
                    <button class="btn btn-primary" ng-click="closeKeyboardShortcutsModal()">Close</button>
                </div>
            </div>
        </div>

        <!-- Reload confirmation after revert -->
        <div class="we-modal-backdrop" ng-show="showReloadConfirm">
            <div class="we-modal-box" style="width:25rem">
                <div class="we-modal-title">Reload Widget</div>
                <div class="we-modal-body">
                    <p>Reloading will replace your unsaved changes with the reverted version. Continue?</p>
                </div>
                <div class="we-modal-actions">
                    <button class="btn btn-primary" ng-click="confirmReloadWidget()">Reload</button>
                    <button class="btn btn-default" ng-click="cancelReloadWidget()">Cancel</button>
                </div>
            </div>
        </div>
    </main>
    <g:requires output="true" />
</j:jelly>`,
    clientScript: `(function () {
    'use strict';

    ////////////////////////////////////////////////////////////
    // Widget Editor+ — client_script.js
    // AngularJS module for the ServiceNow sp_widget editor UI page.
    ////////////////////////////////////////////////////////////

    // Suppress Monaco worker 'Unexpected usage' unhandled rejections (non-fatal).
    window.addEventListener('unhandledrejection', function (e) {
        if (e.reason && e.reason.message === 'Unexpected usage') {
            e.preventDefault();
        }
    });

    // Detect Polaris light/dark theme via CSS variable and stamp html.we-light accordingly.
    (function () {
        try {
            var bg = getComputedStyle(document.documentElement)
                .getPropertyValue('--now-color_background--primary')
                .trim();
            var p = bg.split(/[\\s,]+/).map(Number);
            if (p.length >= 3) {
                document.documentElement.classList.toggle(
                    'we-light',
                    (p[0] + p[1] + p[2]) / 3 >= 128
                );
            }
        } catch (e) {}
    })();

    if (typeof angular === 'undefined') {
        return;
    }

    var AJAX_SCRIPT =
        (window.WE_CONFIG && window.WE_CONFIG.ajaxScript) || 'WidgetEditorAjax';
    var WE_UI_SCRIPTS = (window.WE_CONFIG && window.WE_CONFIG.uiScripts) || {};
    var DIFF_PAGE_SYS_ID =
        (window.WE_CONFIG && window.WE_CONFIG.diffPageSysId) || '';

    /** Build a navigation URL for a UI page.  Uses sys_id-based nav when the
     *  page sys_id is known so the URL is stable even if the page is renamed. */
    function _diffNavUrl(params) {
        var qs = Object.keys(params)
            .map(function (k) {
                return (
                    encodeURIComponent(k) + '=' + encodeURIComponent(params[k])
                );
            })
            .join('&');
        if (DIFF_PAGE_SYS_ID) {
            return (
                '/nav_to.do?uri=' +
                encodeURIComponent(
                    'ui_page.do?sys_id=' + DIFF_PAGE_SYS_ID + '&' + qs
                )
            );
        }
        return (
            '/' + (WE_UI_SCRIPTS.diffPage || 'widget_editor_diff') + '.do?' + qs
        );
    }

    /** Build a same-frame / iframe URL for the diff page. */
    function _diffIframeUrl(params) {
        var qs = Object.keys(params)
            .map(function (k) {
                return (
                    encodeURIComponent(k) + '=' + encodeURIComponent(params[k])
                );
            })
            .join('&');
        if (DIFF_PAGE_SYS_ID) {
            return '/ui_page.do?sys_id=' + DIFF_PAGE_SYS_ID + '&' + qs;
        }
        return (
            '/' + (WE_UI_SCRIPTS.diffPage || 'widget_editor_diff') + '.do?' + qs
        );
    }

    angular
        .module('widgetEditor', [])

        ////////////////////////////////////////////////////////////
        // Directive: we-splitter-drag
        // Adds mousedown-drag behaviour to splitter elements.
        ////////////////////////////////////////////////////////////
        .directive('weSplitterDrag', [
            function () {
                return {
                    restrict: 'A',
                    link: function (scope, element, attrs) {
                        attrs.$observe('weSplitterDrag', function (val) {
                            if (!val || val === 'undefined' || val === '') {
                                return;
                            }
                            element.on('mousedown', function (event) {
                                event.preventDefault();
                                scope.$apply(function () {
                                    scope.startSplitterDrag(
                                        parseInt(val, 10),
                                        event.originalEvent || event
                                    );
                                });
                            });
                        });
                    },
                };
            },
        ])

        ////////////////////////////////////////////////////////////
        // Directive: we-pref-draggable
        // HTML5 drag-and-drop reordering of editors in the User Preferences modal.
        // Usage: we-pref-draggable="e.key" on each row; a child with draggable="true"
        // initiates the drag (dragstart bubbles up).
        ////////////////////////////////////////////////////////////
        .directive('wePrefDraggable', [
            function () {
                // Synchronous drag-state shared across all row instances.
                // Must be set in dragstart synchronously — scope.$applyAsync is too late
                // for the first dragover's e.preventDefault() call.
                var _activeDragKey = null;

                return {
                    restrict: 'A',
                    link: function (scope, element, attrs) {
                        var key = '';
                        attrs.$observe('wePrefDraggable', function (val) {
                            key = val || '';
                        });

                        element[0].addEventListener('dragstart', function (e) {
                            if (!key) {
                                return;
                            }
                            _activeDragKey = key;
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('text/plain', key);
                            scope.$applyAsync(function () {
                                scope.prefDragKey = key;
                            });
                        });

                        element[0].addEventListener('dragend', function () {
                            _activeDragKey = null;
                            element.removeClass('we-pref-drag-over');
                            scope.$applyAsync(function () {
                                scope.prefDragKey = null;
                            });
                        });

                        element[0].addEventListener('dragover', function (e) {
                            if (
                                !_activeDragKey ||
                                _activeDragKey === key ||
                                !key
                            ) {
                                return;
                            }
                            e.preventDefault();
                            element.addClass('we-pref-drag-over');
                        });

                        element[0].addEventListener('dragleave', function (e) {
                            if (!element[0].contains(e.relatedTarget)) {
                                element.removeClass('we-pref-drag-over');
                            }
                        });

                        element[0].addEventListener('drop', function (e) {
                            e.preventDefault();
                            element.removeClass('we-pref-drag-over');
                            var fromKey = _activeDragKey;
                            _activeDragKey = null;
                            scope.$applyAsync(function () {
                                scope.prefDragKey = null;
                            });
                            if (fromKey && fromKey !== key && key) {
                                scope.$apply(function () {
                                    scope.reorderPrefEditors(fromKey, key);
                                });
                            }
                        });
                    },
                };
            },
        ])

        ////////////////////////////////////////////////////////////
        // Directive: we-auto-resize
        // Makes a textarea grow vertically to fit its content.
        ////////////////////////////////////////////////////////////
        .directive('weAutoResize', [
            '$timeout',
            function ($timeout) {
                return {
                    restrict: 'A',
                    require: '?ngModel',
                    link: function (scope, el, attrs, ngModel) {
                        function resize() {
                            el[0].style.height = 'auto';
                            el[0].style.height = el[0].scrollHeight + 'px';
                        }
                        el.on('input', resize);
                        if (ngModel) {
                            scope.$watch(
                                function () {
                                    return ngModel.$viewValue;
                                },
                                function () {
                                    $timeout(resize, 0);
                                }
                            );
                        } else {
                            $timeout(resize, 0);
                        }
                    },
                };
            },
        ])

        ////////////////////////////////////////////////////////////
        // Directive: we-select2-roles
        // Initialises a Select2 v3 multi-select on an <input type="hidden"> element.
        // Select2 v3 (ServiceNow) requires query/createSearchChoice/initSelection on
        // a hidden input — ajax on <select> is not supported in v3.
        ////////////////////////////////////////////////////////////
        .directive('weSelect2Roles', [
            '$timeout',
            function ($timeout) {
                return {
                    restrict: 'A',
                    // No isolated scope. The directive lives inside ng-if child scopes,
                    // so we must mutate the rolesList array in-place rather than replacing
                    // it — replacing would shadow the controller-scope array on the child scope.
                    link: function (scope, el) {
                        $timeout(function () {
                            var $jq =
                                typeof $j !== 'undefined'
                                    ? $j
                                    : typeof jQuery !== 'undefined'
                                      ? jQuery
                                      : null;
                            if (!$jq || !$jq.fn || !$jq.fn.select2) {
                                return;
                            }
                            var $el = $jq(el[0]);

                            // Walk up scope chain to find the scope that owns rolesList
                            function getRootRolesList() {
                                var s = scope;
                                while (s) {
                                    if (s.hasOwnProperty('rolesList')) return s;
                                    s = s.$parent;
                                }
                                return scope; // fallback
                            }

                            var ownerScope = getRootRolesList();

                            // Set initial comma-separated value so initSelection can parse it
                            $el.val((ownerScope.rolesList || []).join(','));

                            var _queryTimer = null;

                            $el.select2({
                                multiple: true,
                                placeholder: 'Add roles\\u2026',
                                allowClear: false,
                                minimumInputLength: 0,
                                width: '100%',
                                query: function (query) {
                                    clearTimeout(_queryTimer);
                                    _queryTimer = setTimeout(function () {
                                        var current = $el.select2('val') || [];
                                        var ga = new GlideAjax(AJAX_SCRIPT);
                                        ga.addParam(
                                            'sysparm_name',
                                            'searchRoles'
                                        );
                                        ga.addParam('term', query.term || '');
                                        ga.getXML(function (response) {
                                            try {
                                                var answer =
                                                    response.responseXML.documentElement.getAttribute(
                                                        'answer'
                                                    );
                                                var data = JSON.parse(answer);
                                                var results = (data.roles || [])
                                                    .filter(function (r) {
                                                        return (
                                                            current.indexOf(
                                                                r
                                                            ) === -1
                                                        );
                                                    })
                                                    .map(function (r) {
                                                        return {
                                                            id: r,
                                                            text: r,
                                                        };
                                                    });
                                                query.callback({
                                                    results: results,
                                                    more: false,
                                                });
                                            } catch (e) {
                                                query.callback({
                                                    results: [],
                                                    more: false,
                                                });
                                            }
                                        });
                                    }, 250);
                                },
                                initSelection: function (element, callback) {
                                    var val = element.val();
                                    callback(
                                        val
                                            ? val
                                                  .split(',')
                                                  .filter(Boolean)
                                                  .map(function (v) {
                                                      return {
                                                          id: v.trim(),
                                                          text: v.trim(),
                                                      };
                                                  })
                                            : []
                                    );
                                },
                            });

                            $el.on('change', function () {
                                var vals = Array.isArray($el.select2('val'))
                                    ? $el.select2('val').filter(Boolean)
                                    : [];
                                ownerScope.$apply(function () {
                                    // Mutate in-place so the controller-scope array reference is updated,
                                    // not shadowed by a new array on the ng-if child scope.
                                    ownerScope.rolesList.length = 0;
                                    vals.forEach(function (v) {
                                        ownerScope.rolesList.push(v);
                                    });
                                });
                            });

                            scope.$on('$destroy', function () {
                                clearTimeout(_queryTimer);
                                try {
                                    $el.select2('destroy');
                                } catch (e) {}
                            });
                        }, 0);
                    },
                };
            },
        ])

        ////////////////////////////////////////////////////////////
        // Directive: we-modal-draggable
        // Enables dragging a modal dialog by its header. Apply to .we-modal-header.
        // Ignores mousedown on interactive elements (buttons, links, inputs).
        // Sets transform: translate(dx, dy) on the closest .we-modal ancestor.
        ////////////////////////////////////////////////////////////
        .directive('weModalDraggable', [
            function () {
                return {
                    restrict: 'A',
                    link: function (scope, element) {
                        var modal = element[0].closest('.we-modal');
                        if (!modal) {
                            return;
                        }

                        var startX,
                            startY,
                            startTx,
                            startTy,
                            naturalLeft,
                            naturalTop,
                            dragging;

                        /* Parse the current translate() values from the modal's inline transform style. */
                        function getTranslate(el) {
                            var m = (el.style.transform || '').match(
                                /translate\\(([-\\d.]+)px,\\s*([-\\d.]+)px\\)/
                            );
                            return m
                                ? [parseFloat(m[1]), parseFloat(m[2])]
                                : [0, 0];
                        }

                        function onMouseMove(e) {
                            if (!dragging) {
                                return;
                            }
                            var dx = startTx + e.clientX - startX;
                            var dy = startTy + e.clientY - startY;

                            /* Clamp so the modal stays fully within the viewport. */
                            var mW = modal.offsetWidth;
                            var mH = modal.offsetHeight;
                            dx = Math.max(
                                -naturalLeft,
                                Math.min(
                                    window.innerWidth - mW - naturalLeft,
                                    dx
                                )
                            );
                            dy = Math.max(
                                -naturalTop,
                                Math.min(
                                    window.innerHeight - mH - naturalTop,
                                    dy
                                )
                            );

                            modal.style.transform =
                                'translate(' + dx + 'px, ' + dy + 'px)';
                        }

                        function onMouseUp() {
                            dragging = false;
                            modal.classList.remove('we-modal--dragging');
                            document.removeEventListener(
                                'mousemove',
                                onMouseMove
                            );
                            document.removeEventListener('mouseup', onMouseUp);
                        }

                        element[0].addEventListener('mousedown', function (e) {
                            if (
                                e.target.closest(
                                    'button, a, input, select, [role="button"]'
                                )
                            ) {
                                return;
                            }
                            e.preventDefault();
                            var t = getTranslate(modal);
                            var rect = modal.getBoundingClientRect();
                            startX = e.clientX;
                            startY = e.clientY;
                            startTx = t[0];
                            startTy = t[1];
                            /* Natural (untranslated) position — computed once at drag start. */
                            naturalLeft = rect.left - t[0];
                            naturalTop = rect.top - t[1];
                            dragging = true;
                            modal.classList.add('we-modal--dragging');
                            document.addEventListener('mousemove', onMouseMove);
                            document.addEventListener('mouseup', onMouseUp);
                        });

                        scope.$on('$destroy', function () {
                            document.removeEventListener(
                                'mousemove',
                                onMouseMove
                            );
                            document.removeEventListener('mouseup', onMouseUp);
                        });
                    },
                };
            },
        ])

        ////////////////////////////////////////////////////////////
        // Directive: we-loader
        // Inline search-box loading indicator using the Now Design System spinner
        // path. Spins via CSS and fills with the --now-loader_icon--color token.
        ////////////////////////////////////////////////////////////
        .directive('weLoader', [
            function () {
                return {
                    restrict: 'E',
                    template:
                        '<svg class="we-loader-icon" aria-hidden="true" viewBox="0 0 16 16">' +
                        '<path d="M13 8a5 5 0 1 1-2.592-4.383c.208.115.47.09.638-.078l.738-.737a.47.47 0 0 0-.067-.735 7 7 0 1 0 2.216 2.216.47.47 0 0 0-.735-.067l-.737.738a.54.54 0 0 0-.078.638A5 5 0 0 1 13 8"/>' +
                        '</svg>',
                };
            },
        ])

        ////////////////////////////////////////////////////////////
        // Directive: we-spinner
        // Renders the circular loading spinner SVG. Colour is inherited via
        // currentColor, so set a CSS color on any ancestor element.
        ////////////////////////////////////////////////////////////
        .directive('weSpinner', [
            function () {
                return {
                    restrict: 'E',
                    template:
                        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="56" height="56" aria-hidden="true">' +
                        '<circle cx="32" cy="32" r="24" stroke="currentColor" stroke-width="3" fill="none" opacity="0.2"/>' +
                        '<circle cx="32" cy="32" r="24" stroke="currentColor" stroke-width="3" stroke-linecap="round" fill="none" stroke-dasharray="40 110">' +
                        '<animateTransform attributeName="transform" type="rotate" from="0 32 32" to="360 32 32" dur="1.2s" repeatCount="indefinite"/>' +
                        '<animate attributeName="stroke-dasharray" values="10 140; 80 70; 10 140" dur="2.4s" repeatCount="indefinite"/>' +
                        '</circle>' +
                        '</svg>',
                };
            },
        ])

        ////////////////////////////////////////////////////////////
        // Directive: we-tooltip-title
        // Keeps Bootstrap's data-original-title in sync with an interpolated
        // expression, preventing double-tooltip (Bootstrap + native title).
        ////////////////////////////////////////////////////////////
        .directive('weTooltipTitle', [
            function () {
                return {
                    restrict: 'A',
                    link: function (scope, element, attrs) {
                        var modal = element[0].closest('.we-modal');
                        element.tooltip({
                            container: modal || 'body',
                            placement: 'bottom',
                        });
                        attrs.$observe('weTooltipTitle', function (val) {
                            element.attr('data-original-title', val || '');
                        });
                        scope.$on('$destroy', function () {
                            try {
                                element.tooltip('destroy');
                            } catch (e) {}
                        });
                    },
                };
            },
        ])

        ////////////////////////////////////////////////////////////
        // Directive: we-dropdown-auto-pos
        // Repositions a .we-dropdown-menu or .we-popover so it never escapes
        // the viewport edges.  Works for both ng-if (runs on link) and ng-show
        // (watches openDropdown / openCompactSubmenu).
        ////////////////////////////////////////////////////////////
        .directive('weDropdownAutoPos', [
            '$timeout',
            function ($timeout) {
                return {
                    restrict: 'A',
                    link: function (scope, element) {
                        var el = element[0];

                        function reposition() {
                            // Reset any previous inline corrections so the base CSS is
                            // restored before we re-measure.
                            el.style.left = '';
                            el.style.right = '';
                            el.style.top = '';
                            el.style.bottom = '';

                            var rect = el.getBoundingClientRect();
                            // Element is hidden (ng-show / ng-hide) or not yet laid out.
                            if (rect.width === 0 && rect.height === 0) {
                                return;
                            }

                            var vw = window.innerWidth;
                            var vh = window.innerHeight;

                            // Horizontal: flip to right-align when right edge overflows.
                            if (rect.right > vw) {
                                el.style.left = 'auto';
                                el.style.right = '0';
                            }
                            // Horizontal: fix left-align for already right-aligned menus
                            // that end up off-screen on the left.
                            if (el.getBoundingClientRect().left < 0) {
                                el.style.left = '0';
                                el.style.right = 'auto';
                            }
                            // Vertical: flip to open upward when bottom edge overflows.
                            if (rect.bottom > vh) {
                                el.style.top = 'auto';
                                el.style.bottom = 'calc(100% + 0.1875rem)';
                            }
                        }

                        // Hide → reposition → show, preventing a one-frame flash at the
                        // default position.  For ng-show: at $watch fire time ng-hide is
                        // still on the element (Angular hasn't processed ng-show yet), so
                        // opacity:0 is set now; after $timeout Angular removes ng-hide and
                        // we reposition before restoring opacity.  For ng-if: the element
                        // is freshly linked (already visible) so opacity:0 hides it for
                        // one frame while we measure and reposition.
                        function positionThenShow() {
                            el.style.opacity = '0';
                            $timeout(function () {
                                reposition();
                                el.style.opacity = '';
                            }, 0);
                        }

                        // ng-if: element is freshly inserted — reposition before first paint.
                        positionThenShow();

                        // ng-show: reposition whenever the controlling scope vars change.
                        scope.$watch('openDropdown', function (newVal, oldVal) {
                            if (newVal === oldVal) {
                                return;
                            }
                            positionThenShow();
                        });
                        scope.$watch(
                            'openCompactSubmenu',
                            function (newVal, oldVal) {
                                if (newVal === oldVal) {
                                    return;
                                }
                                // The compact menu panel is already visible; just re-check the
                                // vertical position after the submenu height change, no hide needed.
                                $timeout(function () {
                                    reposition();
                                }, 0);
                            }
                        );
                    },
                };
            },
        ])

        ////////////////////////////////////////////////////////////
        // Directive: we-dropdown-fixed-pos
        // Like we-dropdown-auto-pos but uses position:fixed so the menu
        // escapes any overflow:hidden ancestor (e.g. .we-pane).
        // Place on the .we-dropdown-menu element. The trigger button must be
        // the first .btn child of the parent .we-dropdown element.
        ////////////////////////////////////////////////////////////
        .directive('weDropdownFixedPos', [
            '$timeout',
            function ($timeout) {
                return {
                    restrict: 'A',
                    link: function (scope, element) {
                        var el = element[0];

                        function reposition() {
                            el.style.top = '';
                            el.style.left = '';
                            el.style.right = '';
                            el.style.bottom = '';

                            var rect = el.getBoundingClientRect();
                            if (rect.width === 0 && rect.height === 0) {
                                return;
                            }

                            // Anchor to the trigger button inside the parent .we-dropdown
                            var trigger = el.parentElement && el.parentElement.querySelector('.btn');
                            var triggerRect = trigger
                                ? trigger.getBoundingClientRect()
                                : { bottom: 0, left: 0, right: 0, top: 0, width: 0 };

                            var vw = window.innerWidth;
                            var vh = window.innerHeight;
                            var gap = 3; // px

                            // Default: open below, left-aligned with trigger
                            var top = triggerRect.bottom + gap;
                            var left = triggerRect.left;

                            // Flip upward if bottom would overflow
                            if (top + rect.height > vh) {
                                top = triggerRect.top - rect.height - gap;
                            }

                            // Flip left-align to right-align if right edge overflows
                            if (left + rect.width > vw) {
                                left = triggerRect.right - rect.width;
                            }

                            // Clamp to viewport edges
                            left = Math.max(0, Math.min(left, vw - rect.width));
                            top  = Math.max(0, Math.min(top,  vh - rect.height));

                            el.style.position = 'fixed';
                            el.style.top  = top  + 'px';
                            el.style.left = left + 'px';
                        }

                        function positionThenShow() {
                            el.style.opacity = '0';
                            $timeout(function () {
                                reposition();
                                el.style.opacity = '';
                            }, 0);
                        }

                        positionThenShow();

                        scope.$watch('openDropdown', function (newVal, oldVal) {
                            if (newVal === oldVal) { return; }
                            positionThenShow();
                        });
                    },
                };
            },
        ])

        ////////////////////////////////////////////////////////////
        // Directive: we-pane-subheader-fit
        // Watches the subheader width and sets item.subheaderTypeOverflow
        // true when the type row doesn't fit inline beside the name row.
        //
        // Detection strategy: the name row uses flex:1 so it always fills
        // remaining space. When the type row takes too much room the name
        // row is squeezed below a useful minimum. We detect that squeeze
        // rather than comparing totals (which always ≈ available width).
        ////////////////////////////////////////////////////////////
        .directive('wePaneSubheaderFit', [
            '$timeout',
            function ($timeout) {
                return {
                    restrict: 'A',
                    link: function (scope, element) {
                        var el = element[0];
                        var ro = null;
                        // Minimum px the name row needs to be usable:
                        // "Name" label (~35px) + gap (6px) + input min-width (64px) ≈ 105px.
                        var MIN_NAME_ROW_W = 100;

                        function check() {
                            var typeRow = el.querySelector('.we-pane-subheader-type-row');
                            var nameRow = el.querySelector('.we-pane-subheader-name-row');
                            if (!typeRow || !nameRow) { return; }

                            // When already in overflow mode the type row is display:none via CSS.
                            // Temporarily restore it so the browser can re-layout and we can
                            // measure whether there is now enough room to switch back.
                            var wasOverflow = !!(scope.item && scope.item.subheaderTypeOverflow);
                            if (wasOverflow) {
                                typeRow.style.display = 'flex';
                            }

                            // getBoundingClientRect forces a synchronous layout flush.
                            var nameRowW = nameRow.getBoundingClientRect().width;

                            if (wasOverflow) {
                                typeRow.style.display = '';
                            }

                            // If the name row has been squeezed below the minimum useful
                            // width, the type row doesn't fit alongside it.
                            var overflows = nameRowW < MIN_NAME_ROW_W;

                            if (scope.item && !!scope.item.subheaderTypeOverflow !== overflows) {
                                scope.$apply(function () {
                                    scope.item.subheaderTypeOverflow = overflows;
                                });
                            }
                        }

                        $timeout(check, 50);

                        if (window.ResizeObserver) {
                            ro = new ResizeObserver(function () { check(); });
                            ro.observe(el);
                        }

                        scope.$on('$destroy', function () {
                            if (ro) { ro.disconnect(); }
                        });
                    },
                };
            },
        ])

        ////////////////////////////////////////////////////////////
        // Controller: WidgetEditorCtrl
        ////////////////////////////////////////////////////////////
        .controller('WidgetEditorCtrl', [
            '$scope',
            '$http',
            '$timeout',
            '$interval',
            '$q',
            '$injector',
            '$window',
            function (
                $scope,
                $http,
                $timeout,
                $interval,
                $q,
                $injector,
                $window
            ) {
                /* Get the AMB client. js_includes_amb.jsx bundles the CometD client but does NOT
                 * register an Angular ng.amb module — the Angular 'amb' service is only available
                 * on full form pages (js_includes_ui16_form.jsx). Use the global window.amb.getClient()
                 * as the primary source; fall back to the Angular injector if somehow available. */
                var amb = null;
                try {
                    if ($injector.has('amb')) amb = $injector.get('amb');
                } catch (e) {}
                if (
                    !amb &&
                    window.amb &&
                    typeof window.amb.getClient === 'function'
                ) {
                    try {
                        amb = window.amb.getClient();
                    } catch (e) {}
                }

                ////////////////////////////////////////////////////////////
                // Config
                ////////////////////////////////////////////////////////////
                var _params = new URLSearchParams(window.location.search);
                var SYS_ID = _params.get('widget_id') || '';
                var VERSION_ID = _params.get('version_id') || '';
                var IS_NEW = _params.get('new') === '1';
                var APP_TITLE = 'Widget Editor+';
                var SITE_TITLE =
                    (window.WE_CONFIG && window.WE_CONFIG.siteTitle) ||
                    'ServiceNow';

                var _titleTimer = null;
                $scope.$watch('widget.name', function (name) {
                    var _title =
                        (name ? name + ' - ' : '') +
                        APP_TITLE +
                        ' - ' +
                        SITE_TITLE;
                    document.title = _title;
                    if (_titleTimer) {
                        $timeout.cancel(_titleTimer);
                    }
                    _titleTimer = $timeout(function () {
                        try {
                            if (window.parent !== window) {
                                window.parent.document.title = _title;
                            }
                        } catch (e) {}
                    }, 1000);
                    $scope.headerDirty.name =
                        (name || '') !== originalHeader.name;
                });
                $scope.$watch('widget.id', function (v) {
                    $scope.headerDirty.id = (v || '') !== originalHeader.id;
                });
                $scope.$watch('widget.description', function (v) {
                    $scope.headerDirty.description =
                        (v || '') !== originalHeader.description;
                });
                $scope.$watch('widget.controller_as', function (v) {
                    $scope.headerDirty.controller_as =
                        (v || 'c') !== originalHeader.controller_as;
                });
                $scope.$watch('widget.is_public', function (v) {
                    $scope.headerDirty.is_public =
                        !!v !== originalHeader.is_public;
                });
                $scope.$watch('widget.static', function (v) {
                    $scope.headerDirty.static =
                        !!v !== originalHeader.static;
                });
                $scope.$watchCollection('rolesList', function (v) {
                    $scope.headerDirty.roles =
                        (v || []).join(',') !== originalHeader.roles;
                });
                $scope.$watch(
                    function () {
                        return ($scope.additionalWidgetFields || [])
                            .map(function (fieldDef) {
                                return (
                                    fieldDef.name +
                                    '=' +
                                    _normaliseExtraWidgetFieldValue(
                                        fieldDef,
                                        $scope.widget[fieldDef.name]
                                    )
                                );
                            })
                            .join('|');
                    },
                    function () {
                        ($scope.additionalWidgetFields || []).forEach(
                            function (fieldDef) {
                                $scope.headerDirty[fieldDef.name] =
                                    _normaliseExtraWidgetFieldValue(
                                        fieldDef,
                                        $scope.widget[fieldDef.name]
                                    ) !==
                                    _normaliseExtraWidgetFieldValue(
                                        fieldDef,
                                        originalHeader[fieldDef.name]
                                    );
                            }
                        );
                    }
                );

                ////////////////////////////////////////////////////////////
                // Scope state
                ////////////////////////////////////////////////////////////
                $scope.loading = true;
                $scope.loadingWidgetName = '';
                if (SYS_ID) {
                    ajax('getWidgetName', { sys_id: SYS_ID }).then(
                        function (data) {
                            $scope.loadingWidgetName = data.name || '';
                        }
                    );
                }
                $scope.loadError = null;
                $scope.widget = {};
                $scope.isVersionView = !!VERSION_ID;

                ////////////////////////////////////////////////////////////
                // SN Utils "Edit in VS Code" integration
                ////////////////////////////////////////////////////////////
                function checkSnUtilsInstalled() {
                    var installed = (
                        typeof window.snusettings !== 'undefined' ||
                        typeof window.SNUtilsInject !== 'undefined' ||
                        typeof window.snuPostRequestToScriptSync === 'function' ||
                        !!document.querySelector('snu-presence') ||
                        !!document.querySelector('script[src*="snutils"], script[src*="lfabkiipmidkmhplochgpbaeekjjfbch"]')
                    );
                    if (!installed) {
                        return false;
                    }
                    // Only hide if snusettings has been injected AND vsscriptsync is explicitly false
                    if (typeof window.snusettings !== 'undefined' && window.snusettings && window.snusettings.vsscriptsync === false) {
                        return false;
                    }
                    return true;
                }

                function updateSnUtilsState() {
                    var active = checkSnUtilsInstalled();
                    if (active !== $scope.hasSnUtils) {
                        $scope.$applyAsync(function () {
                            $scope.hasSnUtils = active;
                        });
                    }
                    return active;
                }

                $scope.hasSnUtils = checkSnUtilsInstalled();

                // Hook into snuSettingsAdded if SN Utils injects settings after page load
                var origSnuSettingsAdded = window.snuSettingsAdded;
                window.snuSettingsAdded = function () {
                    if (typeof origSnuSettingsAdded === 'function') {
                        try { origSnuSettingsAdded.apply(this, arguments); } catch (e) {}
                    }
                    updateSnUtilsState();
                };

                var _snuObserver = new MutationObserver(function () {
                    updateSnUtilsState();
                });
                _snuObserver.observe(document.documentElement, {
                    childList: true,
                    subtree: true,
                });

                // Delayed re-evaluations to account for async snusettings injection after page load
                $timeout(updateSnUtilsState, 500);
                $timeout(updateSnUtilsState, 1500);
                $timeout(updateSnUtilsState, 3000);

                $timeout(function () {
                    updateSnUtilsState();
                    _snuObserver.disconnect();
                }, 10000);

                $scope.c = $scope.c || {};
                $scope.$watch('widget', function (w) {
                    if (!w) return;
                    $scope.c.readOnly = !$scope.canWriteWidget;
                    $scope.data = $scope.data || {};
                    $scope.data.title = w.name || '';
                    $scope.data.sys_id = w.sys_id || '';
                    var scopeVal = typeof w.sys_scope === 'object' && w.sys_scope ? w.sys_scope.value || 'global' : (w.sys_scope || 'global');
                    var scopeDisp = typeof w.sys_scope === 'object' && w.sys_scope ? w.sys_scope.displayValue || scopeVal : scopeVal;
                    $scope.data.f = {
                        _fields: {
                            name: { value: w.name || '', displayValue: w.name || '' },
                            id: { value: w.id || '', displayValue: w.id || '' },
                            template: { value: w.template || '' },
                            css: { value: w.css || '' },
                            client_script: { value: w.client_script || '' },
                            script: { value: w.script || '' },
                            link: { value: w.link || '' },
                            option_schema: { value: w.option_schema || '' },
                            demo_data: { value: w.demo_data || '' },
                            sys_scope: { value: scopeVal, displayValue: scopeDisp },
                            data_table: { value: 'sp_widget', displayValue: 'Widget', choices: [] },
                        },
                    };
                }, true);

                $scope.editInVsCode = function () {
                    if (!$scope.widget || !$scope.widget.sys_id) return;

                    if (!$scope.canWriteWidget || $scope.widget.read_only) {
                        alert(
                            'This is a read-only widget and cannot be opened in VS Code. Please clone the widget first.'
                        );
                        return;
                    }

                    var g_ck_val =
                        window.g_ck ||
                        (typeof g_ck !== 'undefined' ? g_ck : '');
                    var instanceName = window.location.host.split('.')[0];
                    var instanceUrl = window.location.origin;

                    var instance = {
                        name: instanceName,
                        url: instanceUrl,
                        g_ck: g_ck_val,
                    };

                    var scopeVal = typeof $scope.widget.sys_scope === 'object' && $scope.widget.sys_scope ? $scope.widget.sys_scope.value || 'global' : ($scope.widget.sys_scope || 'global');
                    var scopeDisp = typeof $scope.widget.sys_scope === 'object' && $scope.widget.sys_scope ? $scope.widget.sys_scope.displayValue || scopeVal : scopeVal;

                    var fields = {
                        name: { value: $scope.widget.name || '', displayValue: $scope.widget.name || '' },
                        id: { value: $scope.widget.id || '', displayValue: $scope.widget.id || '' },
                        template: { value: $scope.widget.template || '' },
                        css: { value: $scope.widget.css || '' },
                        client_script: { value: $scope.widget.client_script || '' },
                        script: { value: $scope.widget.script || '' },
                        link: { value: $scope.widget.link || '' },
                        option_schema: { value: $scope.widget.option_schema || '' },
                        demo_data: { value: $scope.widget.demo_data || '' },
                        sys_scope: { value: scopeVal, displayValue: scopeDisp },
                        data_table: { value: 'sp_widget', displayValue: 'Widget', choices: [] },
                    };

                    var data = {
                        action: 'saveWidget',
                        tableName: 'sp_widget',
                        name: $scope.widget.name || '',
                        sys_id: $scope.widget.sys_id,
                        instance: instance,
                        widget: fields,
                    };

                    // Trigger SN Utils ScriptSync once (prefer extension functions if exposed, otherwise dispatch custom event)
                    if (typeof window.snuScriptSyncPostData === 'function') {
                        if (typeof window.snuScriptSync === 'function') {
                            try { window.snuScriptSync(); } catch (e) {}
                        }
                        try { window.snuScriptSyncPostData(data); } catch (e) {}
                    } else if (window.SNUtilsInject && window.SNUtilsInject.IDEBridge && typeof window.SNUtilsInject.IDEBridge.scriptSyncPostData === 'function') {
                        if (typeof window.SNUtilsInject.IDEBridge.scriptSync === 'function') {
                            try { window.SNUtilsInject.IDEBridge.scriptSync(); } catch (e) {}
                        }
                        try { window.SNUtilsInject.IDEBridge.scriptSyncPostData(data); } catch (e) {}
                    } else {
                        try {
                            var evtSync = new CustomEvent('snutils-event', {
                                detail: { event: 'scriptsync', command: '' },
                            });
                            (window.top || window).document.dispatchEvent(evtSync);
                        } catch (e) {}

                        try {
                            var evtPost = new CustomEvent('snutils-event', {
                                detail: { event: 'scriptsyncpostdata', command: data },
                            });
                            (window.top || window).document.dispatchEvent(evtPost);
                        } catch (e) {}
                    }
                };
                $scope.versionInfo = {};
                $scope.versions = [];
                $scope.templates = [];
                $scope.providers = [];
                $scope.dependencies = [];
                $scope.relatedModal = {
                    open: false,
                    tabs: [],
                    activeTab: null,
                    loading: false,
                };
                $scope.versionDiffModal = {
                    open: false,
                    url: null,
                    rawUrl: null,
                    label: '',
                    expandedField: null,
                    isUnsaved: false,
                };
                $scope.providerTypeChoices = [];
                $scope.es12RecordExists = false;
                $scope.presenceUsers = [];
                $scope.currentUserId =
                    (typeof NOW !== 'undefined' && NOW.user_id) ||
                    (typeof g_user !== 'undefined' && g_user.userID) ||
                    null;
                $scope.openDropdown = null;
                $scope.openCompactSubmenu = null;
                $scope.hasLintErrors = false;
                $scope.hasLintWarnings = false;

                // New widget / widget picker state
                $scope.isNewWidget = false;
                $scope.showPicker = false;
                $scope.showWidgetPickerModal = false;
                $scope.pendingWidgetNav = null;
                $scope.pendingNewWidget = false;
                $scope.pickerWidgets = [];
                $scope.pickerLoading = false;
                $scope.picker = { search: '' };

                // Roles
                $scope.rolesList = [];
                $scope.additionalWidgetFields = [];

                // Reverted notification
                $scope.widgetReverted = false;
                $scope.showReloadConfirm = false;

                // Header field dirty tracking
                $scope.headerDirty = {
                    name: false,
                    id: false,
                    description: false,
                    controller_as: false,
                    is_public: false,
                    roles: false,
                    static: false,
                };
                var originalHeader = {
                    name: '',
                    id: '',
                    description: '',
                    controller_as: 'c',
                    is_public: false,
                    roles: '',
                    static: false,
                };

                // Core editor definitions (order = default pane order)
                $scope.coreEditorDefs = [
                    {
                        key: 'template',
                        label: 'Body HTML template',
                        field: 'template',
                        language: 'html',
                        visible: true,
                    },
                    {
                        key: 'css',
                        label: 'CSS/SCSS',
                        field: 'css',
                        language: 'scss',
                        visible: true,
                    },
                    {
                        key: 'client_script',
                        label: 'Client controller',
                        field: 'client_script',
                        language: 'javascript',
                        visible: true,
                    },
                    {
                        key: 'link',
                        label: 'Link',
                        field: 'link',
                        language: 'javascript',
                        visible: false,
                    },
                    {
                        key: 'script',
                        label: 'Server script',
                        field: 'script',
                        language: 'typescript',
                        visible: true,
                    },
                ];

                $scope.nameInvalid = false;
                $scope.visiblePaneCount = 0;
                $scope.prefDragKey = null;

                // Link provider modal state
                $scope.showLinkProviderModal = false;
                $scope.linkProvider = { search: '' };
                $scope.showLinkDependencyModal = false;
                $scope.linkDependency = { search: '' };
                $scope.linkDependencyResults = [];
                $scope.linkDependencySearching = false;
                $scope.pendingUnlinkDependency = null;
                $scope.linkProviderResults = [];
                $scope.linkProviderSearching = false;

                // Write-access state
                $scope.canWriteWidget = true;
                $scope.saveError = null;
                $scope.lastSaveTime = null;
                $scope.lastSaveUpdateSet = null; // { sys_id, name } — set after each saveAll

                // User preferences (loaded from server; defaults apply until loaded)
                $scope.userPrefs = {
                    formatTabsToSpaces: true,
                    wordWrap: true,
                    editorTheme: 'auto',
                    minimap: false,
                    alwaysShowLink: true,
                    realtimeWidgetUpdates: false,
                    autoIndent: true,
                    formatOnPaste: true,
                    formatOnType: true,
                    fontSize: 12,
                    fontFamily: '',
                    languageHelpers: true,
                    showUnusedVars: true,
                    remBase: 16,
                    stickyScroll: true,
                    htmlValidation: true,
                    htmlAutoCloseTags: true,
                    autoSurround: 'languageDefined',
                    autoClosingBrackets: 'languageDefined',
                    autoClosingQuotes: 'languageDefined',
                    linkedEditing: true,
                    insertSpaceBeforeFuncParen: false,
                    tabSize: 4,
                    ctrlSSaveActiveOnly: true,
                    flashOnEditorOpen: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
                    showOpenInVsCode: true,
                    // Snapshot of the last-saved editor order and visibility.
                    // Used by the Preferences dialog so it reflects saved state,
                    // not any temporary live changes the user has made.
                    editorOrder: [],
                    editorVisibility: {},
                };
                $scope.showUserPrefsModal = false;
                $scope.userPrefsEdit = {};
                $scope.showOptionSchemaModal = false;
                $scope.optionSchemaLoading = false;
                $scope.optionSchemaLoadError = null;
                $scope.optionSchemaSaveError = null;
                $scope.optionSchemaSaving = false;
                $scope.optionSchemaJsonInvalid = false;
                $scope.showDemoDataModal = false;
                $scope.demoDataLoading = false;
                $scope.demoDataLoadError = null;
                $scope.demoDataSaveError = null;
                $scope.demoDataSaving = false;
                $scope.demoDataJsonInvalid = false;

                // Persistent pane state map (key → pane object). Prevents state loss on rebuild.
                var paneMap = {};
                // Extra panes for open templates / providers
                var extraPanes = [];
                // Monaco editor instances (key → monaco.editor instance)
                var monacoEditors = {};
                // Option schema modal editor instance
                var _optionSchemaEditor = null;
                // Demo data modal editor instance
                var _demoDataEditor = null;
                // XML modal editor instance
                var _xmlEditor = null;
                // Original values loaded from server (used for dirty-checking)
                var originalValues = {};
                // Last-known server values (used for external-change detection)
                var lastServerValues = {};
                // AMB channel subscription for widget presence
                var presenceChannel = null;
                // Widget sys_id used for presence — stored so stop can reference it
                var _presenceWidgetSysId = null;
                // ESLint lint worker state
                var _lintWorker = null; // SharedWorker port or dedicated Worker
                var _lintWorkerReady = false;
                var _lintSeq = 0; // monotonic request counter
                var _lintSeqMap = {}; // seq → { paneKey, model }
                var _lintLatestSeq = {}; // paneKey → latest seq (stale-result guard)
                var _lintTimers = {}; // paneKey → debounce timer id
                var _lintEditorLangs = {}; // paneKey → language ('javascript'|'html'|'scss'…)
                var _lintEditorIsServer = {}; // paneKey → true if this is the server script field
                var _es12Enabled = false; // tracks current ES12 mode for per-pane config
                var _lintMarkerWatcherActive = false; // true once onDidChangeMarkers is registered
                var _isInitialPaneBuild = true; // apply one-time pane auto-visibility rules on first load only

                $scope.visibleItems = [];

                ////////////////////////////////////////////////////////////
                // AJAX helper — GlideAjax → WidgetEditorAjax Script Include
                ////////////////////////////////////////////////////////////
                function ajax(action, params) {
                    var deferred = $q.defer();
                    var ga = new GlideAjax(AJAX_SCRIPT);
                    ga.addParam('sysparm_name', action);
                    if (params) {
                        Object.keys(params).forEach(function (k) {
                            ga.addParam(
                                k,
                                params[k] != null ? String(params[k]) : ''
                            );
                        });
                    }
                    ga.getXML(function (response) {
                        var answer =
                            response.responseXML.documentElement.getAttribute(
                                'answer'
                            );
                        try {
                            deferred.resolve(JSON.parse(answer));
                        } catch (e) {
                            deferred.reject(e);
                        }
                    });
                    return deferred.promise;
                }

                ////////////////////////////////////////////////////////////
                // Widget picker
                ////////////////////////////////////////////////////////////
                function _buildSavePayload() {
                    $scope.coreEditorDefs.forEach(function (def) {
                        if (monacoEditors[def.key]) {
                            $scope.widget[def.field] =
                                monacoEditors[def.key].getValue();
                        }
                    });
                    if ($scope.widget.is_public) {
                        $scope.rolesList.length = 0;
                    }
                    $scope.widget.roles = $scope.rolesList.join(',');
                    var payload = {
                        name: $scope.widget.name,
                        id: $scope.widget.id,
                        description: $scope.widget.description,
                        controller_as: $scope.widget.controller_as || 'c',
                        public: $scope.widget.is_public,
                        roles: $scope.widget.roles,
                        static: !!$scope.widget.static,
                        template: $scope.widget.template || '',
                        css: $scope.widget.css || '',
                        client_script: $scope.widget.client_script || '',
                        script: $scope.widget.script || '',
                        link: $scope.widget.link || '',
                    };

                    ($scope.additionalWidgetFields || []).forEach(function (
                        fieldDef
                    ) {
                        payload[fieldDef.name] =
                            fieldDef.type === 'boolean'
                                ? !!$scope.widget[fieldDef.name]
                                : $scope.widget[fieldDef.name] || '';
                    });

                    return payload;
                }

                function loadWidgetList(search) {
                    $scope.pickerLoading = true;
                    ajax('getWidgets', { search: search }).then(
                        function (d) {
                            $scope.pickerWidgets =
                                d.success && d.widgets
                                    ? d.widgets.map(function (w) {
                                          w.widgetEditorUrl =
                                              buildWidgetEditorUrl(w.sys_id);
                                          return w;
                                      })
                                    : [];
                            $scope.pickerLoading = false;
                        },
                        function () {
                            $scope.pickerWidgets = [];
                            $scope.pickerLoading = false;
                        }
                    );
                }

                var pickerDebounce;
                $scope.onPickerSearch = function () {
                    $timeout.cancel(pickerDebounce);
                    pickerDebounce = $timeout(function () {
                        loadWidgetList($scope.picker.search);
                    }, 250);
                };

                function buildWidgetEditorUrl(widgetSysId) {
                    return (
                        window.location.pathname +
                        '?sys_id=' +
                        window.WE_CONFIG.widgetPageSysId +
                        '&widget_id=' +
                        encodeURIComponent(widgetSysId)
                    );
                }

                function navigateToWidget(w) {
                    window.location.href = buildWidgetEditorUrl(w.sys_id);
                }

                $scope.openWidget = function (w) {
                    $scope.showWidgetPickerModal = false;
                    if (hasUnsavedChanges()) {
                        $scope.pendingWidgetNav = w;
                    } else {
                        navigateToWidget(w);
                    }
                };

                $scope.onWidgetPickerItemKeydown = function (event, w) {
                    var key = event && event.key;
                    var keyCode = event && event.keyCode;

                    if (
                        key === 'Enter' ||
                        keyCode === 13 ||
                        key === ' ' ||
                        key === 'Spacebar' ||
                        keyCode === 32
                    ) {
                        event.preventDefault();
                        $scope.openWidget(w);
                        return;
                    }

                    if (
                        key !== 'ArrowDown' &&
                        key !== 'ArrowUp' &&
                        keyCode !== 38 &&
                        keyCode !== 40
                    ) {
                        return;
                    }

                    event.preventDefault();
                    var el = event.currentTarget;
                    var parent = el && el.parentElement;
                    if (!parent) {
                        return;
                    }

                    var items = parent.querySelectorAll('.we-picker-item');
                    if (!items || !items.length) {
                        return;
                    }

                    var idx = Array.prototype.indexOf.call(items, el);
                    if (idx < 0) {
                        return;
                    }

                    var nextIdx =
                        key === 'ArrowDown' || keyCode === 40
                            ? Math.min(idx + 1, items.length - 1)
                            : Math.max(idx - 1, 0);

                    if (nextIdx !== idx && items[nextIdx] && items[nextIdx].focus) {
                        items[nextIdx].focus();
                    }
                };

                function navigateToNewWidget() {
                    window.location.href =
                        window.location.pathname +
                        '?sys_id=' +
                        window.WE_CONFIG.widgetPageSysId +
                        '&new=1';
                }

                $scope.newWidget = function () {
                    $scope.openDropdown = null;
                    $scope.showWidgetPickerModal = false;
                    if (hasUnsavedChanges()) {
                        $scope.pendingNewWidget = true;
                    } else {
                        navigateToNewWidget();
                    }
                };

                $scope.cancelNewWidget = function () {
                    $scope.pendingNewWidget = false;
                };
                $scope.discardAndNewWidget = function () {
                    $scope.pendingNewWidget = false;
                    _bypassUnloadWarning = true;
                    navigateToNewWidget();
                };
                $scope.saveAndNewWidget = function () {
                    $scope.pendingNewWidget = false;
                    ajax('saveWidget', {
                        sys_id: SYS_ID,
                        data: JSON.stringify(_buildSavePayload()),
                    }).then(function () {
                        navigateToNewWidget();
                    });
                };

                $scope.openWidgetPickerModal = function () {
                    $scope.picker.search = '';
                    $scope.pickerWidgets = [];
                    loadWidgetList('');
                    $scope.showWidgetPickerModal = true;
                };

                $scope.closeWidgetPickerModal = function () {
                    $scope.showWidgetPickerModal = false;
                };

                $scope.cancelWidgetNav = function () {
                    $scope.pendingWidgetNav = null;
                };

                $scope.discardAndOpenWidget = function () {
                    var target = $scope.pendingWidgetNav;
                    $scope.pendingWidgetNav = null;
                    _bypassUnloadWarning = true;
                    navigateToWidget(target);
                };

                $scope.saveAndOpenWidget = function () {
                    var target = $scope.pendingWidgetNav;
                    $scope.pendingWidgetNav = null;
                    ajax('saveWidget', {
                        sys_id: SYS_ID,
                        data: JSON.stringify(_buildSavePayload()),
                    }).then(function () {
                        navigateToWidget(target);
                    });
                };

                ////////////////////////////////////////////////////////////
                // Initialisation
                ////////////////////////////////////////////////////////////
                function _snapshotEditorPrefs() {
                    $scope.userPrefs.editorOrder = $scope.coreEditorDefs.map(function (d) { return d.key; });
                    $scope.userPrefs.editorVisibility = {};
                    $scope.coreEditorDefs.forEach(function (d) {
                        $scope.userPrefs.editorVisibility[d.key] = d.visible;
                    });
                }

                function _applyUserPrefsData(p) {
                    if (p.order && Array.isArray(p.order)) {
                        var ordered = [];
                        p.order.forEach(function (key) {
                            var def = $scope.coreEditorDefs.filter(
                                function (d) {
                                    return d.key === key;
                                }
                            )[0];
                            if (def) {
                                ordered.push(def);
                            }
                        });
                        $scope.coreEditorDefs.forEach(function (d) {
                            if (
                                !ordered.some(function (od) {
                                    return od.key === d.key;
                                })
                            ) {
                                ordered.push(d);
                            }
                        });
                        $scope.coreEditorDefs.length = 0;
                        ordered.forEach(function (d) {
                            $scope.coreEditorDefs.push(d);
                        });
                    }
                    $scope.coreEditorDefs.forEach(function (d) {
                        if (p.hasOwnProperty(d.key)) d.visible = p[d.key];
                    });
                    _snapshotEditorPrefs();
                    [
                        'formatTabsToSpaces',
                        'wordWrap',
                        'editorTheme',
                        'minimap',
                        'alwaysShowLink',
                        'realtimeWidgetUpdates',
                        'autoIndent',
                        'formatOnPaste',
                        'formatOnType',
                        'autoSurround',
                        'autoClosingBrackets',
                        'autoClosingQuotes',
                    ].forEach(function (k) {
                        if (p.hasOwnProperty(k)) {
                            $scope.userPrefs[k] = p[k];
                        }
                    });
                    [
                        'htmlValidation',
                        'htmlAutoCloseTags',
                        'languageHelpers',
                        'showUnusedVars',
                        'stickyScroll',
                        'insertSpaceBeforeFuncParen',
                        'linkedEditing',
                        'flashOnEditorOpen',
                        'showOpenInVsCode',
                    ].forEach(function (k) {
                        if (p.hasOwnProperty(k)) {
                            $scope.userPrefs[k] = !!p[k];
                        }
                    });
                    if (window.SNMonacoPlus && SNMonacoPlus.setUnusedVarsEnabled) {
                        SNMonacoPlus.setUnusedVarsEnabled($scope.userPrefs.showUnusedVars);
                    }
                    if (p.hasOwnProperty('fontSize')) {
                        var fs = parseInt(p.fontSize, 10);
                        if (fs >= 8 && fs <= 32) {
                            $scope.userPrefs.fontSize = fs;
                        }
                    }
                    if (p.hasOwnProperty('tabSize')) {
                        var ts = parseInt(p.tabSize, 10);
                        if (ts >= 1 && ts <= 8) {
                            $scope.userPrefs.tabSize = ts;
                        }
                    }
                    if (p.hasOwnProperty('remBase')) {
                        var rb = parseFloat(p.remBase);
                        if (rb > 0) {
                            $scope.userPrefs.remBase = rb;
                        }
                    }
                    /* fontFamily triggers Google Fonts loader */
                    if (p.hasOwnProperty('fontFamily')) {
                        $scope.userPrefs.fontFamily = p.fontFamily || '';
                        if ($scope.userPrefs.fontFamily) {
                            _loadGoogleFonts();
                        }
                    }
                    /* ctrlSSaveActiveOnly — with migration from old inverted key */
                    if (p.hasOwnProperty('ctrlSSaveActiveOnly')) {
                        $scope.userPrefs.ctrlSSaveActiveOnly =
                            !!p.ctrlSSaveActiveOnly;
                    } else if (p.hasOwnProperty('ctrlSSaveAll')) {
                        /* Migrate old preference (inverted semantics) */
                        $scope.userPrefs.ctrlSSaveActiveOnly = !p.ctrlSSaveAll;
                    }
                    /* Apply HTML toggles to the language module */
                    if (window.MONACO_LANGUAGE_HTML) {
                        if (MONACO_LANGUAGE_HTML.setValidationEnabled) {
                            MONACO_LANGUAGE_HTML.setValidationEnabled($scope.userPrefs.htmlValidation);
                        }
                        if (MONACO_LANGUAGE_HTML.setAutoCloseTagsEnabled) {
                            MONACO_LANGUAGE_HTML.setAutoCloseTagsEnabled($scope.userPrefs.htmlAutoCloseTags);
                        }
                    }
                }

                function init() {
                    if (!SYS_ID) {
                        if (IS_NEW) {
                            $scope.isNewWidget = true;
                            $scope.widget = {
                                name: '',
                                id: '',
                                description: '',
                                controller_as: 'c',
                                is_public: false,
                                roles: '',
                                template: '',
                                css: '',
                                client_script: '',
                                script: '',
                                link: '',
                                es12: true,
                                is_header_footer: false,
                                static: false,
                                option_schema_has_value: false,
                                demo_data_has_value: false,
                            };
                            $scope.es12RecordExists = false;
                            $scope.rolesList = [];
                            originalHeader = {
                                name: '',
                                id: '',
                                description: '',
                                controller_as: 'c',
                                is_public: false,
                                roles: '',
                                static: false,
                            };
                            originalValues = {
                                template: '',
                                css: '',
                                client_script: '',
                                script: '',
                                link: '',
                            };
                            lastServerValues = angular.copy(originalValues);
                            $q.all([
                                ajax('getUserPrefs', {}),
                                ajax('getWidgetDefaults', {}),
                            ])
                                .then(function (results) {
                                    var prefsData = results[0];
                                    var defaultsData = results[1];
                                    if (
                                        prefsData &&
                                        prefsData.success &&
                                        prefsData.value
                                    ) {
                                        try {
                                            _applyUserPrefsData(
                                                JSON.parse(prefsData.value)
                                            );
                                        } catch (e) {}
                                    }
                                    if (defaultsData && defaultsData.success) {
                                        _setAdditionalWidgetFields(
                                            defaultsData.additional_widget_fields
                                        );
                                        _applyAdditionalWidgetFieldDefaults();

                                        var d = defaultsData.defaults || {};
                                        [
                                            'template',
                                            'css',
                                            'client_script',
                                            'script',
                                            'link',
                                        ].forEach(function (f) {
                                            if (d[f]) {
                                                $scope.widget[f] = d[f];
                                                originalValues[f] = d[f];
                                                lastServerValues[f] = d[f];
                                            }
                                        });
                                        $scope.widget.application =
                                            defaultsData.application || '';
                                        $scope.widget.application_sys_id =
                                            defaultsData.application_sys_id ||
                                            '';
                                    }
                                    $scope.loading = false;
                                    buildVisibleItems();
                                    initAllEditors();
                                })
                                .catch(function () {
                                    $scope.loading = false;
                                    buildVisibleItems();
                                    initAllEditors();
                                });
                            ajax('getProviderChoices').then(function (d) {
                                if (d.success) {
                                    $scope.providerTypeChoices = d.choices;
                                }
                            });
                            $window.addEventListener(
                                'beforeunload',
                                stopPresenceSubscription
                            );
                            return;
                        }
                        $scope.showPicker = true;
                        $scope.loading = false;
                        loadWidgetList('');
                        return;
                    }

                    // Load widget + prefs in sequence; side-data in parallel
                    ajax('getWidget', {
                        sys_id: SYS_ID,
                    })
                        .then(function (data) {
                            if (!data.success) {
                                throw new Error(
                                    data.error || 'Failed to load widget'
                                );
                            }

                            $scope.widget = data.widget;
                            _setAdditionalWidgetFields(
                                data.additional_widget_fields
                            );
                            var wo = data.widget.widgetOrigin;
                            if (wo && wo.created_on) {
                                // SN returns UTC "YYYY-MM-DD HH:MM:SS"; replace space with T so
                                // Date() parses it as UTC across all browsers.
                                var originDate = new Date(
                                    wo.created_on.replace(' ', 'T') + 'Z'
                                );
                                $scope.widgetOrigin = {
                                    year: originDate.getFullYear(),
                                    founder: wo.founder,
                                    tooltip: originDate.toLocaleString(),
                                };
                            } else {
                                $scope.widgetOrigin = null;
                            }
                            $scope.canWriteWidget =
                                data.widget.canWrite !== false;
                            $scope.widgetSysPolicy =
                                data.widget.sys_policy || '';
                            $scope.widgetSysPolicyDisplay =
                                data.widget.sys_policy_display || '';
                            $scope.widgetIsServiceNow =
                                !!data.widget.servicenow;
                            $scope.widgetVolatilityLevel =
                                data.widget.volatility_level || '';
                            $scope.widgetVolatilityDisplay =
                                data.widget.volatility_level_display || '';
                            $scope.snAlertDismissed = false;
                            $scope.volatilityAlertDismissed = false;
                            $scope.updateSetAlertDismissed = false;
                            $scope.permissionAlertDismissed = false;
                            $scope.dismissSnAlert = function () {
                                $scope.snAlertDismissed = true;
                            };
                            $scope.dismissVolatilityAlert = function () {
                                $scope.volatilityAlertDismissed = true;
                            };
                            $scope.dismissUpdateSetAlert = function () {
                                $scope.updateSetAlertDismissed = true;
                            };
                            $scope.dismissPermissionAlert = function () {
                                $scope.permissionAlertDismissed = true;
                            };
                            $scope.hasWritePermissionError = function () {
                                if ($scope.saveError && ($scope.saveError.indexOf('permission') !== -1 || $scope.saveError.indexOf('write access') !== -1)) {
                                    return true;
                                }
                                var hasPaneError = ($scope.visibleItems || []).some(function (item) {
                                    return item.type === 'pane' && item.saveError && (item.saveError.indexOf('permission') !== -1 || item.saveError.indexOf('write access') !== -1);
                                });
                                return hasPaneError;
                            };
                            $scope.updateSetMismatch =
                                !!data.widget.update_set_mismatch;
                            $scope.widgetUpdateSetId =
                                data.widget.widget_update_set_id || '';
                            $scope.widgetUpdateSetName =
                                data.widget.widget_update_set_name || '';
                            if ($scope.widgetSysPolicy) {
                                $scope.canWriteWidget = false;
                            }
                            $scope.es12RecordExists =
                                !!data.widget.es12_record_exists;
                            _applyEsVersion(!!data.widget.es12);
                            $scope.rolesList = parseRoles(data.widget.roles);
                            originalHeader = {
                                name: data.widget.name || '',
                                id: data.widget.id || '',
                                description: data.widget.description || '',
                                controller_as: data.widget.controller_as || 'c',
                                is_public: !!data.widget.is_public,
                                roles: parseRoles(data.widget.roles).join(','),
                                static: !!data.widget.static,
                            };
                            _captureAdditionalHeaderValues(data.widget);
                            loadSnTypeDefinitions(
                                data.widget.application_sys_id
                            );
                            loadHtmlMonarchDts();
                            registerMacroCompletions();
                            loadCodeActions();
                            if (window.SNMonacoPlusBootstrap) {
                                window.SNMonacoPlusBootstrap.ensureCoreLoaded().then(
                                    function (api) {
                                        if (api) {
                                            api.loadCssEditorSupport();
                                        }
                                    }
                                );
                            }
                            originalValues = {
                                template: data.widget.template,
                                css: data.widget.css,
                                client_script: data.widget.client_script,
                                script: data.widget.script,
                                link: data.widget.link,
                            };
                            lastServerValues = angular.copy(originalValues);

                            return ajax('getUserPrefs', {});
                        })
                        .then(function (prefsData) {
                            if (
                                prefsData &&
                                prefsData.success &&
                                prefsData.value
                            ) {
                                try {
                                    _applyUserPrefsData(
                                        JSON.parse(prefsData.value)
                                    );
                                } catch (e) {}
                            }

                            if ($scope.isVersionView) {
                                return ajax('getVersion', {
                                    version_id: VERSION_ID,
                                });
                            }
                            return null;
                        })
                        .then(function (vd) {
                            if (vd && vd.success) {
                                $scope.versionInfo = {
                                    sys_created_on: vd.sys_created_on,
                                    sys_created_by: vd.sys_created_by,
                                    update_set_name: vd.update_set_name || '',
                                };
                                overlayVersionFields(vd.fields);
                            }

                            $scope.loading = false;
                            buildVisibleItems();
                            initAllEditors();
                        })
                        .catch(function (err) {
                            $scope.loadError =
                                'Error: ' + (err.message || String(err));
                            $scope.loading = false;
                        });

                    // Side data — parallel, non-blocking
                    ajax('getVersions', {
                        sys_id: SYS_ID,
                    }).then(function (d) {
                        if (d.success) {
                            $scope.versions = d.versions;
                        }
                    });
                    ajax('getTemplates', {
                        sys_id: SYS_ID,
                    }).then(function (d) {
                        if (d.success) {
                            $scope.templates = d.templates;
                        }
                    });
                    ajax('getProviders', {
                        sys_id: SYS_ID,
                    }).then(function (d) {
                        if (d.success) {
                            $scope.providers = d.providers;
                        }
                    });
                    ajax('getDependencies', {
                        sys_id: SYS_ID,
                    }).then(function (d) {
                        if (d.success) {
                            $scope.dependencies = d.dependencies;
                        }
                    });
                    ajax('getProviderChoices').then(function (d) {
                        if (d.success) {
                            $scope.providerTypeChoices = d.choices;
                        }
                    });

                    // Presence — subscribe to AMB channel (real-time, no polling)
                    if (!$scope.isVersionView) {
                        startPresenceSubscription(SYS_ID);
                    }
                    if (!$scope.isVersionView) {
                        startRecordWatcher();
                    }
                    if (!$scope.isVersionView) {
                        startRevertListener();
                    }
                    $window.addEventListener(
                        'beforeunload',
                        stopPresenceSubscription
                    );
                }

                function overlayVersionFields(fields) {
                    var map = {
                        public: function (v) {
                            $scope.widget.is_public = v === '1' || v === 'true';
                        },
                        roles: function (v) {
                            $scope.widget.roles = v;
                            $scope.rolesList = parseRoles(v);
                        },
                    };
                    [
                        'template',
                        'css',
                        'client_script',
                        'script',
                        'link',
                        'name',
                        'id',
                        'description',
                        'public',
                        'roles',
                    ].forEach(function (f) {
                        if (fields[f] === undefined) {
                            return;
                        }
                        if (map[f]) {
                            map[f](fields[f]);
                        } else {
                            $scope.widget[f] = fields[f];
                        }
                    });
                }

                ////////////////////////////////////////////////////////////
                // Pane management
                ////////////////////////////////////////////////////////////
                function getOrCreateCorePaneObj(def) {
                    if (!paneMap[def.key]) {
                        paneMap[def.key] = {
                            key: def.key,
                            label: def.label,
                            field: def.field,
                            language: def.language,
                            type: 'pane',
                            hasIdInput: false,
                            closeable: false,
                            dirty: false,
                            idDirty: false,
                            savedAt: null,
                            externalChange: null,
                            width: null,
                        };
                    }
                    return paneMap[def.key];
                }

                function buildVisibleItems() {
                    var panes = [];
                    var applyInitialLinkAutoShow = _isInitialPaneBuild;

                    $scope.coreEditorDefs.forEach(function (def) {
                        var show = def.visible;
                        // Auto-show Link editor only on initial widget load when enabled and
                        // the widget has a meaningful link value (more than 3 non-empty lines).
                        if (
                            !show &&
                            applyInitialLinkAutoShow &&
                            def.field === 'link' &&
                            $scope.userPrefs.alwaysShowLink &&
                            $scope.widget
                        ) {
                            var linkVal = $scope.widget.link || '';
                            var nonEmptyLines = linkVal
                                .split('\\n')
                                .filter(function (l) {
                                    return l.trim() !== '';
                                }).length;
                            if (nonEmptyLines > 3) {
                                show = true;
                                // Persist visibility for this session after initial auto-show.
                                def.visible = true;
                            }
                        }
                        if (show) {
                            panes.push(getOrCreateCorePaneObj(def));
                        }
                    });

                    extraPanes.forEach(function (p) {
                        panes.push(p);
                    });

                    $scope.visiblePaneCount = panes.length;

                    var items = [];
                    panes.forEach(function (p, i) {
                        if (i > 0) {
                            items.push({
                                key: 'spl-' + i,
                                type: 'splitter',
                            });
                        }
                        items.push(p);
                    });
                    $scope.visibleItems = items;
                    _isInitialPaneBuild = false;
                }

                $scope.reorderPrefEditors = function (fromKey, toKey) {
                    var arr = $scope.userPrefsEdit.editors;
                    var fromIdx = -1,
                        toIdx = -1;
                    for (var i = 0; i < arr.length; i++) {
                        if (arr[i].key === fromKey) {
                            fromIdx = i;
                        }
                        if (arr[i].key === toKey) {
                            toIdx = i;
                        }
                    }
                    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) {
                        return;
                    }
                    var removed = arr.splice(fromIdx, 1)[0];
                    arr.splice(toIdx > fromIdx ? toIdx - 1 : toIdx, 0, removed);
                };

                ////////////////////////////////////////////////////////////
                // Monaco editor management — uses GlideEditorMonaco (ServiceNow wrapper)
                ////////////////////////////////////////////////////////////

                var _monacoThemesDefined = false;
                var _scssTokenizerSet = false;
                var _weJsonRegistered = false;
                function _ensureMonacoThemes() {
                    if (
                        _monacoThemesDefined ||
                        !window.monaco ||
                        !monaco.editor
                    ) {
                        return;
                    }
                    _monacoThemesDefined = true;
                    monaco.editor.defineTheme('we-vs', {
                        base: 'vs',
                        inherit: true,
                        rules: [
                            { token: 'variable.scss', foreground: '9c27b0' },
                            {
                                token: 'attribute.name.ng',
                                foreground: '0070c1',
                                fontStyle: 'bold',
                            },
                            {
                                token: 'attribute.name.sp',
                                foreground: '0070c1',
                            },
                            { token: 'ng.delimiter', foreground: 'af00db' },
                            { token: 'ng.expression', foreground: '001080' },
                        ],
                        colors: {},
                    });
                    monaco.editor.defineTheme('we-vs-dark', {
                        base: 'vs-dark',
                        inherit: true,
                        rules: [
                            { token: 'variable.scss', foreground: 'c792ea' },
                            {
                                token: 'attribute.name.ng',
                                foreground: '569cd6',
                                fontStyle: 'bold',
                            },
                            {
                                token: 'attribute.name.sp',
                                foreground: '569cd6',
                            },
                            { token: 'ng.delimiter', foreground: 'c678dd' },
                            { token: 'ng.expression', foreground: '9cdcfe' },
                        ],
                        colors: {},
                    });
                }

                // Register a lightweight JSON language that uses only a Monarch tokenizer
                // (main thread, no worker). Avoids the "Unexpected usage" console error
                // that occurs when Monaco tries to load the JSON language service worker.
                function _ensureWeJsonLanguage() {
                    if (
                        _weJsonRegistered ||
                        !window.monaco ||
                        !monaco.languages
                    ) {
                        return;
                    }
                    _weJsonRegistered = true;
                    monaco.languages.register({ id: 'we-json' });
                    monaco.languages.setMonarchTokensProvider('we-json', {
                        defaultToken: '',
                        tokenizer: {
                            root: [
                                [/[{}[\\],:]/, 'delimiter.bracket'],
                                [
                                    /"/,
                                    { token: 'string.quote', next: '@string' },
                                ],
                                [/-?\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?/, 'number'],
                                [/\\b(?:true|false|null)\\b/, 'keyword'],
                                [/\\s+/, ''],
                            ],
                            string: [
                                [/[^\\\\"]+/, 'string'],
                                [/\\\\./, 'string.escape'],
                                [/"/, { token: 'string.quote', next: '@pop' }],
                            ],
                        },
                    });
                }

                function _setupScssTokenizer() {
                    if (_scssTokenizerSet) {
                        return;
                    }
                    _scssTokenizerSet = true;
                    monaco.languages.setLanguageConfiguration('scss', {
                        wordPattern:
                            /(#?-?[_a-zA-Z][_a-zA-Z0-9-]*)|\\d+[_a-zA-Z][_a-zA-Z0-9-]*/,
                        comments: {
                            lineComment: '//',
                            blockComment: ['/*', '*/'],
                        },
                        brackets: [
                            ['{', '}'],
                            ['[', ']'],
                            ['(', ')'],
                        ],
                        autoClosingPairs: [
                            { open: '{', close: '}' },
                            { open: '[', close: ']' },
                            { open: '(', close: ')' },
                            { open: '"', close: '"' },
                            { open: "'", close: "'" },
                        ],
                        surroundingPairs: [
                            { open: '{', close: '}' },
                            { open: '[', close: ']' },
                            { open: '(', close: ')' },
                            { open: '"', close: '"' },
                            { open: "'", close: "'" },
                        ],
                    });

                    monaco.languages.setMonarchTokensProvider('scss', {
                        defaultToken: '',
                        tokenPostfix: '.scss',

                        tokenizer: {
                            root: [
                                // Single-line comment
                                [/\\/\\/.*$/, 'comment'],
                                // Block comment
                                [
                                    /\\/\\*/,
                                    { token: 'comment', next: '@blockcomment' },
                                ],
                                // Strings
                                [/"([^"\\\\]|\\\\.)*"/, 'string'],
                                [/'([^'\\\\]|\\\\.)*'/, 'string'],
                                // SCSS variables
                                [/\\$[\\w-]+/, 'variable'],
                                // Interpolation #{...}
                                [
                                    /#{/,
                                    {
                                        token: 'keyword.operator',
                                        next: '@interpolation',
                                    },
                                ],
                                // At-rules
                                [
                                    /@(?:mixin|include|extend|function|return|if|else\\s+if|else|for|each|while|debug|warn|error|use|forward|import|charset|namespace|media|supports|keyframes|-webkit-keyframes|-moz-keyframes|-o-keyframes|page|font-face|layer|container)\\b/,
                                    'keyword',
                                ],
                                // !important / !default / !global / !optional
                                [
                                    /!(?:important|default|global|optional)\\b/,
                                    'keyword',
                                ],
                                // Hex colours
                                [/#[0-9a-fA-F]{3,8}\\b/, 'number.hex'],
                                // Numbers with optional unit
                                [
                                    /-?(?:\\d+\\.?\\d*|\\.\\d+)(?:em|ex|ch|rem|vw|vh|vmin|vmax|cqw|cqh|fr|px|pt|pc|in|cm|mm|deg|rad|turn|grad|s|ms|Hz|kHz|dpi|dpcm|dppx|%)?(?=[\\s,;{}()\\[\\]])/,
                                    'number',
                                ],
                                // CSS functions — word immediately before (
                                [/[\\w-]+(?=\\s*\\()/, 'support.function'],
                                // Property names — word then colon (not ::)
                                [/[\\w-]+(?=\\s*:(?!:))/, 'attribute.name'],
                                // Pseudo-elements ::
                                [/::[:\\w-]+/, 'tag'],
                                // Pseudo-classes :
                                [/:[:\\w-]+/, 'tag'],
                                // ID selectors
                                [/#[\\w-]+/, 'tag'],
                                // Class selectors
                                [/\\.[\\w-]+/, 'tag'],
                                // Universal selector / parent ref / placeholder
                                [/[*&%]/, 'keyword.operator'],
                                // Control keywords
                                [
                                    /\\b(?:true|false|null|and|or|not|in|from|through|to|auto|none|inherit|unset|initial|revert)\\b/,
                                    'keyword',
                                ],
                                // Delimiters
                                [/[{}]/, 'delimiter.curly'],
                                [/[\\[\\]]/, 'delimiter.square'],
                                [/[()]/, 'delimiter.parenthesis'],
                                [/[;,:]/, 'delimiter'],
                            ],

                            blockcomment: [
                                [/\\*\\//, { token: 'comment', next: '@pop' }],
                                [/./, 'comment'],
                            ],

                            interpolation: [
                                [
                                    /}/,
                                    { token: 'keyword.operator', next: '@pop' },
                                ],
                                [/\\$[\\w-]+/, 'variable'],
                                { include: '@root' },
                            ],
                        },
                    });
                }

                // Wait one tick for Angular to render pane DOM nodes, then init editors.
                function initAllEditors() {
                    if (monaco.languages) {
                        // Register only if not already registered (built-in may have it already).
                        if (
                            !monaco.languages.getLanguages().some(function (l) {
                                return l.id === 'scss';
                            })
                        ) {
                            monaco.languages.register({ id: 'scss' });
                        }
                        // Always override the tokenizer so our variable.scss token is produced
                        // regardless of whether Monaco's built-in SCSS tokenizer was already set.
                        _setupScssTokenizer();
                        if (window.SNMonacoPlusBootstrap) {
                            window.SNMonacoPlusBootstrap.ensureCoreLoaded().then(
                                function (api) {
                                    if (api) {
                                        api.loadCssEditorSupport();
                                    }
                                }
                            );
                        }
                    }
                    // Each pane loads its own DTS (server or client) when it initialises;
                    // no need to gate all editors on a single DTS load here.
                    $timeout(function () {
                        $scope.visibleItems.forEach(function (item) {
                            if (
                                item.type === 'pane' &&
                                !monacoEditors[item.key]
                            ) {
                                initEditorForPane(item);
                            }
                        });
                        $timeout(layoutAllEditors, 20);
                        $timeout(layoutAllEditors, 500);
                        $timeout(layoutAllEditors, 900);
                        // Font metrics can arrive after editor creation and delay proper paint.
                        // Re-layout once fonts are ready so token colors are visible immediately.
                        try {
                            if (
                                document.fonts &&
                                document.fonts.ready &&
                                document.fonts.ready.then
                            ) {
                                document.fonts.ready.then(function () {
                                    $timeout(layoutAllEditors, 0);
                                });
                            }
                        } catch (e) {}
                    });
                }

                function getMonacoTheme() {
                    try {
                        if (
                            window.NOW &&
                            window.NOW.theme &&
                            window.NOW.theme.name
                        ) {
                            return /dark/i.test(window.NOW.theme.name)
                                ? 'vs-dark'
                                : 'vs';
                        }
                    } catch (e) {}
                    var bg = getComputedStyle(document.documentElement)
                        .getPropertyValue('--now-color_background--primary')
                        .trim();
                    if (bg) {
                        var parts = bg.split(',').map(Number);
                        if (
                            parts.length === 3 &&
                            (parts[0] + parts[1] + parts[2]) / 3 >= 128
                        ) {
                            return 'vs';
                        }
                    }
                    return 'vs-dark';
                }

                function _resolveMonacoTheme() {
                    var pref = $scope.userPrefs.editorTheme;
                    if (pref === 'dark') {
                        return 'we-vs-dark';
                    }
                    if (pref === 'light') {
                        return 'we-vs';
                    }
                    return getMonacoTheme() === 'vs-dark'
                        ? 'we-vs-dark'
                        : 'we-vs';
                }

                // Returns the ServiceNow table name under the cursor if it is the first
                // argument to a table-consuming API (GlideRecord, GlideRecordSecure,
                // GlideAggregate, GlideQuery, addJoinQuery), otherwise null.
                function _getTableNameAtCursor(ed) {
                    var model = ed.getModel();
                    var pos = ed.getPosition();
                    if (!model || !pos) {
                        return null;
                    }

                    var line = model.getLineContent(pos.lineNumber);
                    var col = pos.column - 1; // 0-based column index

                    // Walk left to find the opening quote enclosing the cursor
                    var quoteChar = null,
                        startIdx = -1;
                    for (var i = col - 1; i >= 0; i--) {
                        var c = line[i];
                        if (c === "'" || c === '"') {
                            var bs = 0;
                            for (var j = i - 1; j >= 0 && line[j] === '\\\\'; j--)
                                bs++;
                            if (bs % 2 === 0) {
                                quoteChar = c;
                                startIdx = i;
                                break;
                            }
                        }
                    }
                    if (quoteChar === null) {
                        return null;
                    }

                    // Walk right to find the closing quote
                    var endIdx = line.length;
                    for (var i = col; i < line.length; i++) {
                        if (line[i] === quoteChar) {
                            var bs = 0;
                            for (var j = i - 1; j >= 0 && line[j] === '\\\\'; j--)
                                bs++;
                            if (bs % 2 === 0) {
                                endIdx = i;
                                break;
                            }
                        }
                    }

                    var candidate = line.substring(startIdx + 1, endIdx);
                    // ServiceNow table names: lowercase letters, digits, underscores
                    if (!/^[a-z][a-z0-9_]*$/.test(candidate)) {
                        return null;
                    }

                    // Check that the string is the first argument to a table API
                    var before = line
                        .substring(0, startIdx)
                        .replace(/\\s+$/, '');
                    if (
                        /(?:GlideRecord(?:Secure)?|GlideAggregate|GlideQuery|addJoinQuery)\\s*\\($/.test(
                            before
                        )
                    ) {
                        return candidate;
                    }
                    return null;
                }

                // Returns the platform version string for ServiceNow docs URLs.
                // Returns the ServiceNow build name (e.g. "zurich") for docs URLs.
                // WE_CONFIG.buildName is injected server-side via gs.getBuildName() in html.xml.
                function _getSnVersion() {
                    if (window.WE_CONFIG && window.WE_CONFIG.buildName) {
                        return window.WE_CONFIG.buildName;
                    }
                    if (typeof getVersion === 'function') {
                        try {
                            var v = getVersion();
                            if (v) {
                                return v;
                            }
                        } catch (e) {}
                    }
                    if (window.NOW && window.NOW.buildName) {
                        return window.NOW.buildName;
                    }
                    if (typeof g_buildName !== 'undefined' && g_buildName) {
                        return g_buildName;
                    }
                    return '';
                }

                // Returns the ServiceNow class name under/around the cursor, or null.
                // If the cursor is on an uppercase-starting identifier → that is the class.
                // If the cursor is on a method/property name, looks for ClassName. on the
                // left of it on the same line and returns that class name.
                // Common JavaScript built-ins are excluded to avoid false positives.
                var _JS_BUILTINS = {
                    Array: 1,
                    Boolean: 1,
                    Date: 1,
                    Error: 1,
                    Function: 1,
                    JSON: 1,
                    Map: 1,
                    Math: 1,
                    Number: 1,
                    Object: 1,
                    Promise: 1,
                    Proxy: 1,
                    Reflect: 1,
                    RegExp: 1,
                    Set: 1,
                    String: 1,
                    Symbol: 1,
                    WeakMap: 1,
                    WeakSet: 1,
                };

                function _getSnClassAtCursor(ed) {
                    var model = ed.getModel();
                    var pos = ed.getPosition();
                    if (!model || !pos) {
                        return null;
                    }

                    var word = model.getWordAtPosition(pos);
                    if (!word || !word.word) {
                        return null;
                    }
                    var name = word.word;

                    // Cursor is directly on an uppercase-starting identifier — likely a class
                    if (/^[A-Z]/.test(name)) {
                        return _JS_BUILTINS[name] ? null : name;
                    }

                    // Cursor is on a method/property — look for ClassName. immediately before
                    var line = model.getLineContent(pos.lineNumber);
                    var before = line.substring(0, (word.startColumn || 1) - 1);
                    var m = before.match(/([A-Z][A-Za-z0-9_]*)\\.$/);
                    if (m && !_JS_BUILTINS[m[1]]) {
                        return m[1];
                    }

                    return null;
                }

                // Returns the script include name under the cursor if it exists in the SI name map, else null.
                function _getSINameAtCursor(ed) {
                    var model = ed.getModel();
                    var pos = ed.getPosition();
                    if (!model || !pos) {
                        return null;
                    }
                    var word = model.getWordAtPosition(pos);
                    if (!word || !word.word) {
                        return null;
                    }
                    return window.SNMonacoPlus &&
                        window.SNMonacoPlus.getSiSysId(word.word)
                        ? word.word
                        : null;
                }

                ////////////////////////////////////////////////////////////
                // JS formatting options
                ////////////////////////////////////////////////////////////
                function _applyJsFormatOptions() {
                    if (
                        !window.monaco ||
                        !monaco.languages ||
                        !monaco.languages.typescript
                    ) {
                        return;
                    }
                    var opts = {
                        insertSpaceBeforeFunctionParenthesis:
                            !!$scope.userPrefs.insertSpaceBeforeFuncParen,
                    };
                    var jsDef = monaco.languages.typescript.javascriptDefaults;
                    var tsDef = monaco.languages.typescript.typescriptDefaults;
                    if (jsDef && jsDef.setFormattingOptions) {
                        jsDef.setFormattingOptions(opts);
                    }
                    if (tsDef && tsDef.setFormattingOptions) {
                        tsDef.setFormattingOptions(opts);
                    }
                }

                var _jsFormattingProviderRegistered = false;

                // Registers a custom DocumentFormattingEditProvider for JavaScript that
                // calls the TypeScript worker directly, forwarding our user preferences
                // (notably insertSpaceBeforeFunctionParenthesis) as format options.
                // This is more reliable than setFormattingOptions, which was removed in
                // newer Monaco versions.
                function _registerJsFormattingProvider() {
                    if (_jsFormattingProviderRegistered || !window.monaco) {
                        return;
                    }
                    if (
                        !monaco.languages ||
                        !monaco.languages.typescript ||
                        !monaco.languages.typescript.getJavaScriptWorker
                    ) {
                        return;
                    }
                    _jsFormattingProviderRegistered = true;

                    function _buildFmtProvider(getWorker) {
                        return {
                            provideDocumentFormattingEdits: function (
                                model,
                                monacoOptions
                            ) {
                                return getWorker()
                                    .then(function (workerFactory) {
                                        return workerFactory(model.uri);
                                    })
                                    .then(function (worker) {
                                        return worker.getFormattingEditsForDocument(
                                            model.uri.toString(),
                                            {
                                                baseIndentSize: 0,
                                                indentSize:
                                                    $scope.userPrefs.tabSize,
                                                tabSize:
                                                    $scope.userPrefs.tabSize,
                                                convertTabsToSpaces:
                                                    monacoOptions.insertSpaces,
                                                insertSpaces:
                                                    monacoOptions.insertSpaces,
                                                newLineCharacter: '\\n',
                                                indentStyle: 2, // Smart
                                                insertSpaceAfterCommaDelimiter: true,
                                                insertSpaceAfterConstructor: false,
                                                insertSpaceAfterSemicolonInForStatements: true,
                                                insertSpaceBeforeAndAfterBinaryOperators: true,
                                                insertSpaceAfterKeywordsInControlFlowStatements: true,
                                                insertSpaceAfterFunctionKeywordForAnonymousFunctions:
                                                    !!$scope.userPrefs
                                                        .insertSpaceBeforeFuncParen,
                                                insertSpaceBeforeFunctionParenthesis:
                                                    !!$scope.userPrefs
                                                        .insertSpaceBeforeFuncParen,
                                                insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis: false,
                                                insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets: false,
                                                insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces: true,
                                                insertSpaceAfterOpeningAndBeforeClosingEmptyBraces: false,
                                                insertSpaceAfterOpeningAndBeforeClosingTemplateStringBraces: false,
                                                insertSpaceAfterOpeningAndBeforeClosingJsxExpressionBraces: false,
                                                trimTrailingWhitespace: true,
                                                semicolons: 'ignore',
                                            }
                                        );
                                    })
                                    .then(function (edits) {
                                        if (!edits || !edits.length) {
                                            return [];
                                        }
                                        return edits.map(function (edit) {
                                            var start = model.getPositionAt(
                                                edit.span.start
                                            );
                                            var end = model.getPositionAt(
                                                edit.span.start +
                                                    edit.span.length
                                            );
                                            return {
                                                range: new monaco.Range(
                                                    start.lineNumber,
                                                    start.column,
                                                    end.lineNumber,
                                                    end.column
                                                ),
                                                text: edit.newText,
                                            };
                                        });
                                    });
                            },
                        };
                    }
                    monaco.languages.registerDocumentFormattingEditProvider(
                        'javascript',
                        _buildFmtProvider(
                            monaco.languages.typescript.getJavaScriptWorker
                        )
                    );
                    if (monaco.languages.typescript.getTypeScriptWorker) {
                        monaco.languages.registerDocumentFormattingEditProvider(
                            'typescript',
                            _buildFmtProvider(
                                monaco.languages.typescript.getTypeScriptWorker
                            )
                        );
                    }
                }

                function initEditorForPane(pane) {
                    var container = document.getElementById(
                        'editor-' + pane.key
                    );
                    if (!container || monacoEditors[pane.key]) {
                        return;
                    }

                    var isSI = pane.recordType === 'script_include';
                    var value = pane.field
                        ? $scope.widget[pane.field] || ''
                        : pane.content || '';
                    var readOnly =
                        $scope.isVersionView ||
                        !$scope.canWriteWidget ||
                        (pane.hasIdInput && !pane.editorUnlocked) ||
                        !!pane.readOnly;
                    var lang = pane.language || 'javascript';

                    function _create() {
                        if (monacoEditors[pane.key]) {
                            return; // guard against double-init
                        }
                        _ensureMonacoThemes();
                        // Ensure our SCSS tokenizer is active — Monaco's built-in may have
                        // already registered 'scss' before initAllEditors ran its override.
                        if (monaco.languages) {
                            _setupScssTokenizer();
                        }
                        var isJs =
                            lang === 'javascript' || lang === 'typescript';
                        // Track language and server-script flag for per-pane ESLint config routing.
                        // HTML/SCSS editors are validated by Monaco's built-in language services;
                        // ESLint is only invoked for JavaScript editors.
                        _lintEditorLangs[pane.key] = lang;
                        _lintEditorIsServer[pane.key] =
                            pane.field === 'script' || isSI;
                        if (pane.field === 'script' || isSI) {
                            loadServerMonarchDts();
                        } else if (
                            pane.recordType === 'provider' ||
                            pane.field === 'link' ||
                            pane.field === 'client_script'
                        ) {
                            loadClientMonarchDts();
                        }
                        function _doCreate() {
                            if (monacoEditors[pane.key]) {
                                return;
                            }
                            var ed = monaco.editor.create(container, {
                                automaticLayout: true,
                                fixedOverflowWidgets: true,
                                fontFamily: _buildFontFamily(
                                    $scope.userPrefs.fontFamily
                                ),
                                fontSize: $scope.userPrefs.fontSize,
                                glyphMargin: isJs,
                                insertSpaces: false,
                                language: lang,
                                lightbulb: { enabled: true },
                                lineNumbers: 'on',
                                minimap: {
                                    enabled: !!$scope.userPrefs.minimap,
                                },
                                quickSuggestions: {
                                    other: true,
                                    comments: false,
                                    strings: true, // Enables inside string literals
                                },
                                hover: {
                                    enabled: !!$scope.userPrefs.languageHelpers,
                                },
                                parameterHints: {
                                    enabled: !!$scope.userPrefs.languageHelpers,
                                },
                                readOnly: readOnly,
                                scrollBeyondLastLine: false,
                                suggestOnTriggerCharacters: true,
                                tabSize: $scope.userPrefs.tabSize,
                                theme: _resolveMonacoTheme(),
                                value: value,
                                wordWrap: $scope.userPrefs.wordWrap
                                    ? 'on'
                                    : 'off',
                                autoIndent: $scope.userPrefs.autoIndent
                                    ? 'full'
                                    : 'none',
                                formatOnPaste: !!$scope.userPrefs.formatOnPaste,
                                formatOnType: !!$scope.userPrefs.formatOnType,
                                autoSurround: $scope.userPrefs.autoSurround,
                                autoClosingBrackets: $scope.userPrefs.autoClosingBrackets,
                                autoClosingQuotes: $scope.userPrefs.autoClosingQuotes,
                                linkedEditing: !!$scope.userPrefs.linkedEditing,
                                multiCursorModifier: 'ctrlCmd',
                                mouseWheelZoom: true,
                                stickyScroll: {
                                    enabled: !!$scope.userPrefs.stickyScroll,
                                },
                            });

                            _registerJsFormattingProvider();
                            _applyJsFormatOptions();

                            monacoEditors[pane.key] = {
                                getValue: function () {
                                    return ed.getValue();
                                },
                                focus: function () {
                                    try {
                                        ed.focus();
                                    } catch (e) {}
                                },
                                setValue: function (v) {
                                    if (isJs) {
                                        try {
                                            monaco.editor.setModelMarkers(
                                                ed.getModel(),
                                                'LINT_MARKER',
                                                []
                                            );
                                        } catch (e2) {}
                                    }
                                    ed.setValue(v);
                                },
                                getModel: function () {
                                    return ed.getModel();
                                },
                                layout: function () {
                                    ed.layout();
                                },
                                render: function () {
                                    try {
                                        ed.render(true);
                                    } catch (e) {}
                                },
                                forceTokenize: function () {
                                    try {
                                        var _m = ed.getModel();
                                        if (!_m) {
                                            return;
                                        }
                                        // Tokenize the full model on initial/layout passes.
                                        // Using visible ranges here can be stale before first paint,
                                        // which leaves JS/TS text uncolored until user interaction.
                                        var _lastLine = _m.getLineCount();
                                        // Monaco ≥0.32 puts forceTokenization on model.tokenization;
                                        // older builds expose it directly on the model.
                                        var _tok =
                                            _m.tokenization &&
                                            _m.tokenization.forceTokenization
                                                ? _m.tokenization
                                                : _m;
                                        if (_tok.forceTokenization) {
                                            _tok.forceTokenization(_lastLine);
                                        }
                                    } catch (_e) {}
                                },
                                updateOptions: function (opts) {
                                    ed.updateOptions(opts);
                                },
                                dispose: function () {
                                    try {
                                        var _m = ed.getModel();
                                        if (_m) {
                                            delete _serverScriptModels[_m.id];
                                        }
                                    } catch (e2) {}
                                    try {
                                        ed.dispose();
                                    } catch (e) {}
                                },
                                format: function (useSpaces) {
                                    var action = ed.getAction(
                                        'editor.action.formatDocument'
                                    );
                                    if (!action) {
                                        return;
                                    }
                                    /* Monaco reads FormattingOptions from the
                                       model, so both must be updated. */
                                    var _fmtModel = ed.getModel();
                                    ed.updateOptions({
                                        insertSpaces: !!useSpaces,
                                    });
                                    if (_fmtModel) {
                                        _fmtModel.updateOptions({
                                            insertSpaces: !!useSpaces,
                                        });
                                    }
                                    function _resetIndent() {
                                        ed.updateOptions({
                                            insertSpaces: false,
                                        });
                                        if (_fmtModel && !_fmtModel.isDisposed()) {
                                            _fmtModel.updateOptions({
                                                insertSpaces: false,
                                            });
                                        }
                                    }
                                    var result = action.run();
                                    if (result && result.then) {
                                        result.then(_resetIndent, _resetIndent);
                                    } else {
                                        _resetIndent();
                                    }
                                },
                            };

                            // Track server script editors for script-include "new " completions
                            if (pane.field === 'script' || isSI) {
                                var _edModel = ed.getModel();
                                if (_edModel) {
                                    _serverScriptModels[_edModel.id] = true;
                                }
                            }

                            if (!readOnly && pane.field) {
                                ed.onDidChangeModelContent(function () {
                                    $scope.$apply(function () {
                                        var cur = ed.getValue();
                                        pane.dirty =
                                            cur !== originalValues[pane.field];
                                        if (pane.dirty) {
                                            pane.savedAt = null;
                                        }
                                    });
                                });
                            } else if (pane.hasIdInput || isSI) {
                                ed.onDidChangeModelContent(function () {
                                    if (
                                        ed.getOption(
                                            monaco.editor.EditorOption.readOnly
                                        )
                                    ) {
                                        return;
                                    }
                                    $scope.$apply(function () {
                                        if (isSI) {
                                            var cur = ed.getValue();
                                            pane.dirty =
                                                cur !== pane.lastServerContent;
                                            if (pane.dirty) {
                                                pane.savedAt = null;
                                            }
                                        } else {
                                            pane.dirty = true;
                                            pane.savedAt = null;
                                        }
                                    });
                                });
                            }

                            if (
                                !readOnly &&
                                isJs &&
                                (pane.field === 'script' || isSI)
                            ) {
                                if (window.SNMonacoPlus) {
                                    window.SNMonacoPlus.scanAndFetchSIs(value);
                                }
                                var _siTimer = null;
                                ed.onDidChangeModelContent(function () {
                                    clearTimeout(_siTimer);
                                    _siTimer = setTimeout(function () {
                                        if (window.SNMonacoPlus) {
                                            window.SNMonacoPlus.scanAndFetchSIs(
                                                ed.getValue()
                                            );
                                        }
                                    }, 800);
                                });
                            }

                            if (!readOnly && isJs && !$scope.isVersionView) {
                                _initLintWorker();
                                _triggerLint(pane.key);
                                ed.onDidChangeModelContent(function () {
                                    _triggerLint(pane.key);
                                });
                            }

                            if (!$scope.isVersionView) {
                                initBreakpoints(ed, pane.key, pane);
                            }

                            // "Open table" context menu action — JavaScript panes only.
                            // Shown when the cursor is inside a string that is the first argument
                            // to GlideRecord / GlideRecordSecure / GlideAggregate / GlideQuery /
                            // addJoinQuery.  Opens the table list view in a new tab.
                            if (isJs) {
                                var _tableCtxKey = ed.createContextKey(
                                    'weIsOnTable',
                                    false
                                );
                                var _classCtxKey = ed.createContextKey(
                                    'weIsOnSnClass',
                                    false
                                );
                                ed.onDidChangeCursorPosition(function () {
                                    _tableCtxKey.set(
                                        !!_getTableNameAtCursor(ed)
                                    );
                                    _classCtxKey.set(!!_getSnClassAtCursor(ed));
                                });
                                ed.addAction({
                                    id: 'we.open-docs',
                                    label: 'Open documentation',
                                    contextMenuGroupId: '0_we_docs',
                                    contextMenuOrder: 1,
                                    precondition: 'weIsOnSnClass',
                                    run: function (ed) {
                                        var cls = _getSnClassAtCursor(ed);
                                        if (!cls) {
                                            return;
                                        }
                                        // GlideRecordSecure shares its docs page with GlideRecord
                                        if (cls === 'GlideRecordSecure') {
                                            cls = 'GlideRecord';
                                        }
                                        var ver = _getSnVersion();
                                        var url =
                                            'https://docs.servicenow.com/csh?topicname=c_' +
                                            cls +
                                            'API.html' +
                                            (ver
                                                ? '&version=' +
                                                  encodeURIComponent(ver)
                                                : '');
                                        window.open(url, '_blank');
                                    },
                                });
                                ed.addAction({
                                    id: 'we.view-table-config',
                                    label: 'View table configuration',
                                    contextMenuGroupId: '0_we_table',
                                    contextMenuOrder: 1,
                                    precondition: 'weIsOnTable',
                                    run: function (ed) {
                                        var tbl = _getTableNameAtCursor(ed);
                                        if (tbl) {
                                            window.open(
                                                '/nav_to.do?uri=' +
                                                    encodeURIComponent(
                                                        'sys_db_object.do?sys_id=' +
                                                            tbl +
                                                            '&sysparm_refkey=name&sysparm_domain_restore=false'
                                                    ),
                                                '_blank'
                                            );
                                        }
                                    },
                                });
                                ed.addAction({
                                    id: 'we.open-table-list',
                                    label: 'Open table list',
                                    contextMenuGroupId: '0_we_table',
                                    contextMenuOrder: 2,
                                    precondition: 'weIsOnTable',
                                    run: function (ed) {
                                        var tbl = _getTableNameAtCursor(ed);
                                        if (tbl) {
                                            window.open(
                                                '/nav_to.do?uri=' +
                                                    encodeURIComponent(
                                                        tbl + '_list.do'
                                                    ),
                                                '_blank'
                                            );
                                        }
                                    },
                                });
                            }

                            // "Edit Script Include" context menu — shown when cursor is on a known SI name,
                            // or asynchronously confirmed for any capitalised word not yet in the cache.
                            if (isJs) {
                                var _siCtxKey = ed.createContextKey(
                                    'weIsOnScriptInclude',
                                    false
                                );
                                var _siCheckSeq = 0;
                                ed.onDidChangeCursorPosition(function () {
                                    var syncName = _getSINameAtCursor(ed);
                                    if (syncName) {
                                        _siCtxKey.set(true);
                                        return;
                                    }
                                    _siCtxKey.set(false);

                                    var model = ed.getModel();
                                    var pos = ed.getPosition();
                                    if (!model || !pos) {
                                        return;
                                    }
                                    var wordObj = model.getWordAtPosition(pos);
                                    var wordStr = wordObj && wordObj.word;
                                    if (!wordStr || !/^[A-Z]/.test(wordStr)) {
                                        return;
                                    }

                                    var snPlus = window.SNMonacoPlus;
                                    if (!snPlus || !snPlus.checkSiExists) {
                                        return;
                                    }
                                    var seq = ++_siCheckSeq;
                                    snPlus.checkSiExists(
                                        wordStr,
                                        function (foundName) {
                                            if (
                                                foundName &&
                                                seq === _siCheckSeq
                                            ) {
                                                _siCtxKey.set(true);
                                            }
                                        }
                                    );
                                });
                                ed.addAction({
                                    id: 'we.open-script-include',
                                    label: 'Edit Script Include',
                                    contextMenuGroupId: '0_we_docs',
                                    contextMenuOrder: 2,
                                    precondition: 'weIsOnScriptInclude',
                                    run: function (ed) {
                                        var name = _getSINameAtCursor(ed);
                                        if (name) {
                                            openScriptIncludeByName(name);
                                        }
                                    },
                                });
                            }

                            if (isJs) {
                                var _isAngularPane =
                                    pane.recordType === 'provider' ||
                                    pane.field === 'client_script';
                                loadCodeActions(
                                    ed.getModel().id,
                                    _isAngularPane
                                );
                                ed.addAction({
                                    id: 'we.go-to-references-platform',
                                    label: 'Go to References (Platform)',
                                    contextMenuGroupId: 'navigation',
                                    // Keep this below Monaco's built-in "Go to References".
                                    contextMenuOrder: 2.2,
                                    run: function (ed) {
                                        var model = ed.getModel();
                                        var pos = ed.getPosition();
                                        if (
                                            !model ||
                                            !pos ||
                                            typeof _openSnReferencesModal !==
                                                'function'
                                        ) {
                                            return;
                                        }
                                        var word = model.getWordAtPosition(pos);
                                        if (!word || !word.word) {
                                            return;
                                        }
                                        _openSnReferencesModal(word.word);
                                    },
                                });
                            }

                            if (!readOnly) {
                                ed.addAction({
                                    id: 'we.save',
                                    label: 'Save',
                                    keybindings: [
                                        monaco.KeyMod.CtrlCmd |
                                            monaco.KeyCode.KeyS,
                                    ],
                                    run: function () {
                                        $scope.$apply(function () {
                                            _handleCtrlS(pane);
                                        });
                                    },
                                });
                            }
                        } // end _doCreate
                        if (lang === 'html') {
                            loadHtmlMonarchDts(_doCreate);
                        } else {
                            _doCreate();
                        }
                    }

                    // Use Monaco directly via AMD require (bypasses GlideEditorMonaco
                    // which expects a standard SN form-field DOM structure we don't have).
                    if (window.monaco && window.monaco.editor) {
                        _create();
                    } else {
                        require(['vs/editor/editor.main'], function () {
                            _create();
                        });
                    }
                }

                function layoutAllEditors() {
                    Object.keys(monacoEditors).forEach(function (k) {
                        try {
                            monacoEditors[k].layout();
                        } catch (e) {}
                        try {
                            monacoEditors[k].forceTokenize();
                        } catch (e) {}
                        try {
                            monacoEditors[k].render();
                        } catch (e) {}
                    });
                }

                function disposeEditor(key) {
                    if (monacoEditors[key]) {
                        try {
                            var _model =
                                monacoEditors[key].getModel &&
                                monacoEditors[key].getModel();
                            if (_model) {
                                _clearLintMarkers(key, _model);
                            }
                        } catch (e) {}
                        try {
                            monacoEditors[key].dispose();
                        } catch (e) {}
                        delete monacoEditors[key];
                        delete _lintEditorLangs[key];
                        delete _lintEditorIsServer[key];
                    }
                }

                ////////////////////////////////////////////////////////////
                // ESLint linting — ServiceNow lintWorker + monaco.editor.setModelMarkers
                ////////////////////////////////////////////////////////////

                function _initLintWorker() {
                    if (_lintWorker || typeof Worker === 'undefined') {
                        return;
                    }
                    var base = window.location.origin;
                    var workerUrl =
                        base +
                        '/scripts/classes/monaco/lintWorker.js?sysparm_substitute=false';
                    var eslintUrl =
                        base +
                        '/scripts/snc-code-editor/eslint_bundle.min.js?sysparm_substitute=false';
                    try {
                        if (typeof SharedWorker !== 'undefined') {
                            var sw = new SharedWorker(workerUrl);
                            _lintWorker = sw.port;
                            _lintWorker.onmessage = _onLintWorkerMessage;
                            _lintWorker.start();
                        } else {
                            _lintWorker = new Worker(workerUrl);
                            _lintWorker.onmessage = _onLintWorkerMessage;
                        }
                        _lintWorker.postMessage({ linterUrl: eslintUrl });
                        _lintWorkerReady = true;
                    } catch (e) {
                        _lintWorker = null;
                    }
                    _initLintMarkerWatcher();
                }

                // Registers a one-time listener on monaco.editor.onDidChangeMarkers to keep
                // $scope.hasLintErrors and $scope.hasLintWarnings in sync with LINT_MARKER severity on open editors.
                function _initLintMarkerWatcher() {
                    if (_lintMarkerWatcherActive || !window.monaco) {
                        return;
                    }
                    _lintMarkerWatcherActive = true;
                    monaco.editor.onDidChangeMarkers(function () {
                        var hasErrors = false;
                        var hasWarnings = false;
                        Object.keys(monacoEditors).forEach(function (k) {
                            if (hasErrors && hasWarnings) {
                                return;
                            }
                            try {
                                var model =
                                    monacoEditors[k].getModel &&
                                    monacoEditors[k].getModel();
                                if (!model) {
                                    return;
                                }
                                var markers = monaco.editor.getModelMarkers({
                                    resource: model.uri,
                                    owner: 'LINT_MARKER',
                                });
                                markers.forEach(function (m) {
                                    if (
                                        m.severity ===
                                        monaco.MarkerSeverity.Error
                                    ) {
                                        hasErrors = true;
                                    }
                                    if (
                                        m.severity ===
                                        monaco.MarkerSeverity.Warning
                                    ) {
                                        hasWarnings = true;
                                    }
                                });
                            } catch (e) {}
                        });
                        $scope.$applyAsync(function () {
                            $scope.hasLintErrors = hasErrors;
                            $scope.hasLintWarnings = hasWarnings;
                        });
                    });
                }

                function _onLintWorkerMessage(e) {
                    var data = e.data;
                    if (!data) {
                        return;
                    }
                    var entry = _lintSeqMap[data.version];
                    if (!entry) {
                        return;
                    }
                    delete _lintSeqMap[data.version];
                    // Discard stale result superseded by a newer request for this pane
                    if (_lintLatestSeq[entry.paneKey] !== data.version) {
                        return;
                    }
                    if (!window.monaco) {
                        return;
                    }
                    try {
                        var markers = _convertLintErrors(
                            data.errors || [],
                            entry.model
                        );
                        monaco.editor.setModelMarkers(
                            entry.model,
                            'LINT_MARKER',
                            markers
                        );
                    } catch (e2) {}
                }

                function _convertLintErrors(errors, model) {
                    var severityMap = window.monaco
                        ? {
                              error: monaco.MarkerSeverity.Error,
                              warning: monaco.MarkerSeverity.Warning,
                              hint: monaco.MarkerSeverity.Hint,
                              info: monaco.MarkerSeverity.Info,
                          }
                        : {};
                    return errors.map(function (err) {
                        var lineCount = model.getLineCount();
                        var startLine = Math.min(
                            Math.max(err.from.line, 1),
                            lineCount
                        );
                        var endLine = Math.min(
                            Math.max(err.to.line, 1),
                            lineCount
                        );
                        var lineLen = model.getLineLength(startLine);
                        var startCol = Math.max(
                            Math.min(err.from.column, lineLen + 1),
                            1
                        );
                        var endCol = Math.max(
                            Math.min(err.to.column, lineLen + 1),
                            1
                        );
                        return {
                            startLineNumber: startLine,
                            endLineNumber: endLine,
                            startColumn: startCol,
                            endColumn: endCol,
                            message: err.message,
                            severity:
                                severityMap[err.severity] ||
                                monaco.MarkerSeverity.Warning,
                        };
                    });
                }

                // Returns per-pane ESLint config:
                //   • server script (field='script'): ES5 unless ES12 mode is on
                //   • all other JS editors (client_script, link, providers): always ES2021
                //   • HTML editors: null → skip ESLint (validated by MONACO_LANGUAGE_HTML)
                //   • SCSS editors: null → skip ESLint (validated by Monaco's built-in CSS service)
                function _getEslintConfigForPane(paneKey) {
                    var lang = _lintEditorLangs[paneKey];
                    if (lang !== 'javascript' && lang !== 'typescript') {
                        return null;
                    }
                    var ecmaVersion =
                        _lintEditorIsServer[paneKey] && !_es12Enabled
                            ? 5
                            : 2021;
                    return {
                        parserOptions: {
                            ecmaVersion: ecmaVersion,
                            sourceType: 'script',
                        },
                        rules: { semi: ['warn', 'always'] },
                    };
                }

                function _triggerLint(paneKey) {
                    // HTML/SCSS editors are validated by Monaco's built-in language services — skip ESLint.
                    var _lang = _lintEditorLangs[paneKey];
                    if (_lang !== 'javascript' && _lang !== 'typescript') {
                        return;
                    }
                    if (!_lintWorker || !_lintWorkerReady) {
                        return;
                    }
                    clearTimeout(_lintTimers[paneKey]);
                    _lintTimers[paneKey] = setTimeout(function () {
                        var edWrapper = monacoEditors[paneKey];
                        if (!edWrapper) {
                            return;
                        }
                        var model = edWrapper.getModel();
                        if (!model) {
                            return;
                        }
                        var cfg = _getEslintConfigForPane(paneKey);
                        if (!cfg) {
                            return;
                        }
                        var seq = ++_lintSeq;
                        _lintSeqMap[seq] = { paneKey: paneKey, model: model };
                        _lintLatestSeq[paneKey] = seq;
                        try {
                            _lintWorker.postMessage({
                                content: model.getValue(),
                                version: seq,
                                eslintOptions: cfg,
                            });
                        } catch (e) {}
                    }, 600);
                }

                function _clearLintMarkers(paneKey, model) {
                    clearTimeout(_lintTimers[paneKey]);
                    delete _lintTimers[paneKey];
                    delete _lintLatestSeq[paneKey];
                    if (!window.monaco || !model) {
                        return;
                    }
                    try {
                        monaco.editor.setModelMarkers(model, 'LINT_MARKER', []);
                    } catch (e) {}
                }

                function _applyEsVersion(es12Enabled) {
                    _es12Enabled = !!es12Enabled;
                    // Re-lint all open JS editors — each gets a fresh config via _getEslintConfigForPane.
                    // HTML/SCSS editors are skipped automatically inside _triggerLint.
                    Object.keys(monacoEditors).forEach(function (k) {
                        _triggerLint(k);
                    });
                }

                ////////////////////////////////////////////////////////////
                // Monaco plus init — delegates all DTS/diagnostic/provider
                // setup to SNMonacoPlus. Language context controls which
                // Monaco language service receives server vs. client DTS.
                ////////////////////////////////////////////////////////////
                var _serverPlusInitialized = false;
                function _initServerMonacoPlus(scope) {
                    var _bs = window.SNMonacoPlusBootstrap;
                    if (!_bs) {
                        return;
                    }
                    if (!_serverPlusInitialized) {
                        _serverPlusInitialized = true;
                        _bs.init({
                            language: 'typescript',
                            getRemBase: function () {
                                return $scope.userPrefs &&
                                    $scope.userPrefs.remBase > 0
                                    ? $scope.userPrefs.remBase
                                    : 16;
                            },
                        });
                    }
                    // Reload scope-specific SN completions DTS for the current widget's app scope.
                    _bs.ensureCoreLoaded().then(function (api) {
                        if (!api) {
                            return;
                        }
                        if (scope && api.loadSnTypeDefinitions) {
                            api.loadSnTypeDefinitions(scope, 'typescript');
                        }
                        if (!_snProvidersRegistered) {
                            _snProvidersRegistered = true;
                            registerSnDefinitionProvider();
                            registerSnReferenceProvider();
                        }
                    });
                }

                function loadSnTypeDefinitions(scope) {
                    _initServerMonacoPlus(scope);
                }

                function loadServerMonarchDts() {
                    _initServerMonacoPlus();
                }

                function loadClientMonarchDts(cb) {
                    var _bs = window.SNMonacoPlusBootstrap;
                    if (_bs) {
                        _bs.init({
                            language: 'javascript',
                            isClient: true,
                            getRemBase: function () {
                                return $scope.userPrefs &&
                                    $scope.userPrefs.remBase > 0
                                    ? $scope.userPrefs.remBase
                                    : 16;
                            },
                        });
                    }
                    if (typeof cb === 'function') {
                        cb();
                    }
                }

                function loadHtmlMonarchDts(cb) {
                    var _bs = window.SNMonacoPlusBootstrap;
                    if (!_bs) {
                        if (typeof cb === 'function') {
                            cb();
                        }
                        return;
                    }
                    _bs.init({ language: 'html' }).then(function (api) {
                        if (
                            api &&
                            typeof api.loadHtmlMonarchDts === 'function'
                        ) {
                            api.loadHtmlMonarchDts(cb);
                        } else if (typeof cb === 'function') {
                            cb();
                        }
                    });
                }

                ////////////////////////////////////////////////////////////
                // Code actions — JSDoc insertion (JS) and px→rem conversion (SCSS).
                // Lazy-loads monaco_code_actions.jsdbx on first JS or SCSS editor
                // creation (also pre-loaded at widget load so the SCSS action is ready
                // before the first CSS pane opens).
                ////////////////////////////////////////////////////////////
                function loadCodeActions(modelId, isAngular) {
                    var _bs = window.SNMonacoPlusBootstrap;
                    if (!_bs) {
                        return;
                    }
                    _bs.ensureCoreLoaded().then(function (api) {
                        if (api && typeof api.loadCodeActions === 'function') {
                            api.loadCodeActions({
                                modelId: modelId,
                                isAngular: !!isAngular,
                                getRemBase: function () {
                                    return $scope.userPrefs &&
                                        $scope.userPrefs.remBase > 0
                                        ? $scope.userPrefs.remBase
                                        : 16;
                                },
                            });
                        }
                    });
                }

                ////////////////////////////////////////////////////////////
                // Script include intellisense — delegated to SNMonacoPlus core
                ////////////////////////////////////////////////////////////
                var _selfSavingFields = {}; // field -> saved value; absorb own-save RW echoes
                var _serverScriptModels = {}; // model.id -> true for server script editors

                ////////////////////////////////////////////////////////////
                // Code macro completions — registerCompletionItemProvider for JS editors
                // Fetches SN code macros server-side and registers them as Monaco snippet
                // completions, mirroring the monacoIncludes.jsx _initMacros pattern.
                ////////////////////////////////////////////////////////////
                var _macroCompletionRegistered = false;

                function registerMacroCompletions() {
                    if (_macroCompletionRegistered) {
                        return;
                    }
                    var ga = new GlideAjax(AJAX_SCRIPT);
                    ga.addParam('sysparm_name', 'getMacros');
                    ga.getXML(function (resp) {
                        if (_macroCompletionRegistered) {
                            return;
                        }
                        var macros = [];
                        try {
                            var answer =
                                resp.responseXML.documentElement.getAttribute(
                                    'answer'
                                );
                            var data = JSON.parse(answer);
                            if (data.success && data.macros) {
                                macros = data.macros;
                            }
                        } catch (e) {}

                        function doRegister() {
                            if (_macroCompletionRegistered || !window.monaco) {
                                return;
                            }
                            _macroCompletionRegistered = true;

                            var suggestions = macros.map(function (m) {
                                return {
                                    label: m.name,
                                    detail: m.comments || '',
                                    insertText: m.script,
                                    kind: monaco.languages.CompletionItemKind
                                        .Snippet,
                                    insertTextRules:
                                        monaco.languages
                                            .CompletionItemInsertTextRule
                                            .InsertAsSnippet,
                                };
                            });

                            var frozen = JSON.stringify(suggestions);
                            var _macroProvider = {
                                provideCompletionItems: function (
                                    model,
                                    position
                                ) {
                                    var word =
                                        model.getWordUntilPosition(position);
                                    var range = {
                                        startLineNumber: position.lineNumber,
                                        endLineNumber: position.lineNumber,
                                        startColumn: word.startColumn,
                                        endColumn: word.endColumn,
                                    };
                                    return {
                                        suggestions: JSON.parse(frozen).map(
                                            function (s) {
                                                return {
                                                    label: s.label,
                                                    detail: s.detail,
                                                    insertText: s.insertText,
                                                    kind: s.kind,
                                                    insertTextRules:
                                                        s.insertTextRules,
                                                    range: range,
                                                };
                                            }
                                        ),
                                    };
                                },
                            };
                            monaco.languages.registerCompletionItemProvider(
                                'javascript',
                                _macroProvider
                            );
                            monaco.languages.registerCompletionItemProvider(
                                'typescript',
                                _macroProvider
                            );
                        }

                        if (window.monaco) {
                            doRegister();
                        } else {
                            require(['vs/editor/editor.main'], doRegister);
                        }
                    });
                }

                ////////////////////////////////////////////////////////////
                // Go to Definition — opens Script Include / UI Script record in new tab
                ////////////////////////////////////////////////////////////
                var _snProvidersRegistered = false;
                function registerSnDefinitionProvider() {
                    if (!window.monaco) {
                        return;
                    }
                    // Tables searched in order; first hit wins
                    var defTables = [
                        { table: 'sys_script_include', nameField: 'api_name' },
                        { table: 'sys_script_include', nameField: 'name' },
                        { table: 'sys_ui_script', nameField: 'name' },
                    ];
                    var _defProvider = {
                        provideDefinition: function (model, position) {
                            var word = model.getWordAtPosition(position);
                            if (!word || !word.word) {
                                return [];
                            }
                            var name = word.word;
                            var headers = {
                                'X-UserToken': window.g_ck || '',
                                Accept: 'application/json',
                            };
                            // Try each table sequentially until a record is found, then open it
                            function tryTable(idx) {
                                if (idx >= defTables.length) {
                                    return;
                                }
                                var t = defTables[idx];
                                $http
                                    .get('/api/now/table/' + t.table, {
                                        params: {
                                            sysparm_query:
                                                t.nameField + '=' + name,
                                            sysparm_fields: 'sys_id',
                                            sysparm_limit: 1,
                                        },
                                        headers: headers,
                                    })
                                    .then(
                                        function (res) {
                                            var records =
                                                res.data && res.data.result;
                                            if (records && records.length > 0) {
                                                window.open(
                                                    '/' +
                                                        t.table +
                                                        '.do?sys_id=' +
                                                        records[0].sys_id
                                                );
                                            } else {
                                                tryTable(idx + 1);
                                            }
                                        },
                                        function () {
                                            tryTable(idx + 1);
                                        }
                                    );
                            }
                            tryTable(0);
                            return [];
                        },
                    };
                    monaco.languages.registerDefinitionProvider(
                        'javascript',
                        _defProvider
                    );
                    monaco.languages.registerDefinitionProvider(
                        'typescript',
                        _defProvider
                    );
                }

                ////////////////////////////////////////////////////////////
                // Find References — searches for word usage across SN script tables
                ////////////////////////////////////////////////////////////
                var _openSnReferencesModal = null;
                function registerSnReferenceProvider() {
                    if (!window.monaco) {
                        return;
                    }
                    var refTables = [
                        {
                            table: 'sys_script_include',
                            label: 'Script Include',
                            fields: 'sys_id,name,script',
                            searchField: 'script',
                        },
                        {
                            table: 'sp_widget',
                            label: 'Widget',
                            fields: 'sys_id,name,script,client_script',
                            searchField: 'script',
                        },
                        {
                            table: 'sys_ui_page',
                            label: 'UI Page',
                            fields: 'sys_id,name,processing_script',
                            searchField: 'processing_script',
                        },
                        {
                            table: 'sys_script',
                            label: 'Business Rule',
                            fields: 'sys_id,name,script',
                            searchField: 'script',
                        },
                        {
                            table: 'sys_ui_script',
                            label: 'UI Script',
                            fields: 'sys_id,name,script',
                            searchField: 'script',
                        },
                    ];
                    // Build the references modal once; reuse on subsequent searches
                    var _refOverlay = null;
                    var _refTitle = null;
                    var _refBody = null;

                    function _ensureRefModal() {
                        if (_refOverlay) {
                            return;
                        }
                        _refOverlay = document.createElement('div');
                        _refOverlay.id = 'we-ref-panel';
                        _refOverlay.className = 'we-modal-overlay';
                        _refOverlay.style.display = 'none';
                        _refOverlay.innerHTML =
                            '<div class="we-modal we-ref-modal">' +
                            '<div class="we-modal-header">' +
                            '<span id="we-ref-title"></span>' +
                            '<span class="we-modal-close" id="we-ref-close">×</span>' +
                            '</div>' +
                            '<div id="we-ref-body" class="we-modal-body we-ref-body"></div>' +
                            '</div>';
                        document.body.appendChild(_refOverlay);
                        _refTitle = document.getElementById('we-ref-title');
                        _refBody = document.getElementById('we-ref-body');

                        document
                            .getElementById('we-ref-close')
                            .addEventListener('click', function () {
                                _refOverlay.style.display = 'none';
                            });
                        _refOverlay.addEventListener('click', function (e) {
                            if (e.target === _refOverlay) {
                                _refOverlay.style.display = 'none';
                            }
                        });
                        document.addEventListener('keydown', function (e) {
                            if (
                                e.key === 'Escape' &&
                                _refOverlay.style.display !== 'none'
                            ) {
                                _refOverlay.style.display = 'none';
                            }
                        });
                    }

                    function _renderRefTitle(name) {
                        if (!_refTitle) {
                            return;
                        }
                        _refTitle.textContent = '';
                        _refTitle.appendChild(
                            document.createTextNode('References to ')
                        );
                        var strong = document.createElement('strong');
                        strong.textContent = name || '';
                        _refTitle.appendChild(strong);
                    }

                    function _renderRefSearching() {
                        if (!_refBody) {
                            return;
                        }
                        _refBody.textContent = '';
                        var div = document.createElement('div');
                        div.className = 'we-ref-searching';
                        div.textContent = 'Searching...';
                        _refBody.appendChild(div);
                    }

                    function _renderRefNone(name) {
                        if (!_refBody) {
                            return;
                        }
                        _refBody.textContent = '';
                        var div = document.createElement('div');
                        div.className = 'we-ref-none';
                        div.appendChild(
                            document.createTextNode('No references found for ')
                        );
                        var strong = document.createElement('strong');
                        strong.textContent = name || '';
                        div.appendChild(strong);
                        div.appendChild(document.createTextNode('.'));
                        _refBody.appendChild(div);
                    }

                    function _renderRefResults(results) {
                        if (!_refBody) {
                            return;
                        }
                        _refBody.textContent = '';

                        var count = document.createElement('div');
                        count.className = 'we-ref-count';
                        count.textContent =
                            results.length +
                            ' reference' +
                            (results.length !== 1 ? 's' : '');
                        _refBody.appendChild(count);

                        results.forEach(function (r) {
                            var item = document.createElement('div');
                            item.className = 'we-ref-item';

                            var link = document.createElement('a');
                            link.href =
                                '/' +
                                String(r.table || '') +
                                '.do?sys_id=' +
                                encodeURIComponent(String(r.sys_id || ''));
                            link.target = '_blank';
                            link.rel = 'noopener noreferrer';
                            link.textContent = String(r.name || r.sys_id || '');
                            item.appendChild(link);

                            var label = document.createElement('span');
                            label.className = 'we-ref-label';
                            label.textContent = String(r.label || '');
                            item.appendChild(label);

                            _refBody.appendChild(item);
                        });
                    }

                    _openSnReferencesModal = function (name) {
                        if (!name) {
                            return;
                        }
                        var headers = {
                            'X-UserToken': window.g_ck || '',
                            Accept: 'application/json',
                        };

                        _ensureRefModal();
                        _renderRefTitle(name);
                        _renderRefSearching();
                        _refOverlay.style.display = 'flex';

                        var pending = refTables.length;
                        var results = [];
                        refTables.forEach(function (t) {
                            $http
                                .get('/api/now/table/' + t.table, {
                                    params: {
                                        sysparm_query:
                                            t.searchField + 'CONTAINS' + name,
                                        sysparm_fields: t.fields,
                                        sysparm_limit: 20,
                                    },
                                    headers: headers,
                                })
                                .then(function (res) {
                                    var records =
                                        (res.data && res.data.result) || [];
                                    records.forEach(function (r) {
                                        results.push({
                                            table: t.table,
                                            label: t.label,
                                            name: r.name || r.sys_id,
                                            sys_id: r.sys_id,
                                        });
                                    });
                                })
                                .finally(function () {
                                    pending--;
                                    if (pending === 0) {
                                        if (results.length === 0) {
                                            _renderRefNone(name);
                                        } else {
                                            results.sort(function (a, b) {
                                                if (a.label < b.label) {
                                                    return -1;
                                                }
                                                if (a.label > b.label) {
                                                    return 1;
                                                }
                                                if (a.name < b.name) {
                                                    return -1;
                                                }
                                                if (a.name > b.name) {
                                                    return 1;
                                                }
                                                return 0;
                                            });
                                            _renderRefResults(results);
                                        }
                                    }
                                });
                        });
                    };
                }

                ////////////////////////////////////////////////////////////
                // Server Breakpoints — gutter decoration + SN debug API
                ////////////////////////////////////////////////////////////
                function initBreakpoints(editor, paneKey, pane) {
                    var isSIPane = pane && pane.recordType === 'script_include';
                    if (paneKey !== 'script' && !isSIPane) {
                        return;
                    }

                    var table, recordSysId;
                    if (isSIPane) {
                        table = 'sys_script_include';
                        recordSysId = pane.sys_id;
                    } else {
                        table = 'sp_widget';
                        recordSysId = $scope.widget && $scope.widget.sys_id;
                    }
                    if (!recordSysId) {
                        return;
                    }

                    var bpBase =
                        '/api/now/js/debugger/breakpoint/' +
                        table +
                        '/' +
                        recordSysId +
                        '/script/';
                    var dpUrl =
                        '/api/now/js/debugpoints/script/' +
                        table +
                        '/' +
                        recordSysId +
                        '/script';
                    var authHeaders = {
                        'X-UserToken': window.g_ck || '',
                        Accept: 'application/json',
                    };

                    var activeLines = {}; // line (string) → true
                    var decorationIds = [];
                    var ghostDecorationIds = [];
                    var ghostLine = null;

                    function renderDecorations() {
                        var newDecs = Object.keys(activeLines).map(
                            function (line) {
                                return {
                                    range: new monaco.Range(
                                        parseInt(line, 10),
                                        1,
                                        parseInt(line, 10),
                                        1
                                    ),
                                    options: {
                                        isWholeLine: false,
                                        glyphMarginClassName:
                                            'we-breakpoint-glyph',
                                        glyphMarginHoverMessage: {
                                            value:
                                                'Breakpoint (line ' +
                                                line +
                                                ')',
                                        },
                                    },
                                };
                            }
                        );
                        decorationIds = editor.deltaDecorations(
                            decorationIds,
                            newDecs
                        );
                    }

                    function renderGhostDecoration(lineNumber) {
                        var newDecs = lineNumber
                            ? [
                                  {
                                      range: new monaco.Range(
                                          lineNumber,
                                          1,
                                          lineNumber,
                                          1
                                      ),
                                      options: {
                                          isWholeLine: false,
                                          glyphMarginClassName:
                                              'we-breakpoint-glyph-ghost',
                                      },
                                  },
                              ]
                            : [];
                        ghostDecorationIds = editor.deltaDecorations(
                            ghostDecorationIds,
                            newDecs
                        );
                    }

                    function syncFromServer() {
                        return $http
                            .get(dpUrl, { headers: authHeaders })
                            .then(function (res) {
                                var dp =
                                    res.data &&
                                    res.data.result &&
                                    res.data.result.debugpoints;
                                // debugpoints structure: { "BREAKPOINT": { "5": {...}, "10": {...} }, ... }
                                var bpLines = dp && dp.BREAKPOINT;
                                activeLines = {};
                                if (bpLines && typeof bpLines === 'object') {
                                    Object.keys(bpLines).forEach(
                                        function (line) {
                                            activeLines[line] = true;
                                        }
                                    );
                                }
                                renderDecorations();
                            });
                    }

                    // Load existing breakpoints on init
                    syncFromServer();

                    // Ghost glyph + pointer cursor on glyph-margin hover only (not line numbers)
                    var editorDom = editor.getDomNode();
                    editor.onMouseMove(function (e) {
                        var inGutter =
                            e.target.type ===
                            monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN;
                        editorDom.style.cursor = inGutter ? 'pointer' : '';
                        var newGhostLine = null;
                        if (inGutter && e.target.position) {
                            var hoverLineNum = e.target.position.lineNumber;
                            // Only show ghost on lines that don't already have a real breakpoint
                            var lineDecs =
                                editor.getLineDecorations(hoverLineNum) || [];
                            var hasReal = lineDecs.some(function (d) {
                                return (
                                    d.options.glyphMarginClassName ===
                                    'we-breakpoint-glyph'
                                );
                            });
                            if (!hasReal) {
                                newGhostLine = hoverLineNum;
                            }
                        }
                        if (newGhostLine !== ghostLine) {
                            ghostLine = newGhostLine;
                            renderGhostDecoration(ghostLine);
                        }
                    });

                    editor.onMouseLeave(function () {
                        editorDom.style.cursor = '';
                        if (ghostLine !== null) {
                            ghostLine = null;
                            renderGhostDecoration(null);
                        }
                    });

                    editor.onMouseDown(function (e) {
                        if (
                            e.target.type ===
                                monaco.editor.MouseTargetType
                                    .GUTTER_GLYPH_MARGIN ||
                            e.target.type ===
                                monaco.editor.MouseTargetType
                                    .GUTTER_LINE_NUMBERS
                        ) {
                            if (!e.target.position) {
                                return;
                            }
                            var lineNumber = e.target.position.lineNumber;
                            var line = String(lineNumber);
                            // Use actual rendered decorations to decide set vs remove —
                            // more reliable than activeLines which may lag behind
                            var lineDecs =
                                editor.getLineDecorations(lineNumber) || [];
                            var isRemoving = lineDecs.some(function (d) {
                                return (
                                    d.options.glyphMarginClassName ===
                                    'we-breakpoint-glyph'
                                );
                            });
                            // Set: body {evaluationString:''}; Remove: empty body
                            var postConfig = isRemoving
                                ? { headers: authHeaders }
                                : {
                                      headers: angular.extend(
                                          {
                                              'Content-Type':
                                                  'application/json',
                                          },
                                          authHeaders
                                      ),
                                  };
                            var postBody = isRemoving
                                ? undefined
                                : { evaluationString: '' };
                            $http
                                .post(bpBase + line, postBody, postConfig)
                                .then(function () {
                                    syncFromServer();
                                });
                        }
                    });
                }

                ////////////////////////////////////////////////////////////
                // Splitter drag
                ////////////////////////////////////////////////////////////
                $scope.startSplitterDrag = function (splitterIdx, event) {
                    var items = $scope.visibleItems;
                    var leftPane = items[splitterIdx - 1];
                    var rightPane = items[splitterIdx + 1];
                    if (!leftPane || !rightPane) {
                        return;
                    }

                    var leftEl = document.getElementById(
                        'pane-' + leftPane.key
                    );
                    var rightEl = document.getElementById(
                        'pane-' + rightPane.key
                    );
                    if (!leftEl || !rightEl) {
                        return;
                    }

                    var startX = event.clientX;
                    var startLeftW = leftEl.offsetWidth;
                    var startRightW = rightEl.offsetWidth;

                    event.currentTarget.classList.add('dragging');
                    var splitterEl = event.currentTarget;

                    function onMove(e) {
                        var dx = e.clientX - startX;
                        var newLeft = Math.max(60, startLeftW + dx);
                        var newRight = Math.max(60, startRightW - dx);
                        leftPane.width = newLeft;
                        rightPane.width = newRight;
                        $scope.$apply();
                        layoutAllEditors();
                    }

                    function onUp() {
                        splitterEl.classList.remove('dragging');
                        document.removeEventListener('mousemove', onMove);
                        document.removeEventListener('mouseup', onUp);
                    }
                    document.addEventListener('mousemove', onMove);
                    document.addEventListener('mouseup', onUp);
                };

                ////////////////////////////////////////////////////////////
                // Save: single field
                ////////////////////////////////////////////////////////////
                var _paneIdDebounceMap = {};
                $scope.onPaneIdChange = function (pane) {
                    pane.idDirty = true;
                    pane.idError = null;
                    pane.editorUnlocked = false;
                    if (monacoEditors[pane.key]) {
                        monacoEditors[pane.key].updateOptions({
                            readOnly: true,
                        });
                    }
                    $timeout.cancel(_paneIdDebounceMap[pane.key]);
                    if (!pane.recordId || !pane.recordId.trim()) {
                        pane.idChecking = false;
                        return;
                    }
                    pane.idChecking = true;
                    _paneIdDebounceMap[pane.key] = $timeout(function () {
                        var action =
                            pane.recordType === 'template'
                                ? 'checkTemplateId'
                                : 'checkProviderId';
                        ajax(action, {
                            id: pane.recordId,
                            sys_id: pane.sys_id || '',
                        }).then(function (res) {
                            pane.idChecking = false;
                            if (!res.success) {
                                return;
                            }
                            if (res.exists) {
                                pane.idError = 'ID already exists';
                            } else {
                                pane.idError = null;
                                pane.editorUnlocked = true;
                                if (monacoEditors[pane.key]) {
                                    monacoEditors[pane.key].updateOptions({
                                        readOnly: false,
                                    });
                                }
                            }
                        });
                    }, 500);
                };

                $scope.onProviderTypeChange = function (pane) {
                    pane.dirty = true;
                };

                function _handleCtrlS(pane) {
                    if ($scope.isVersionView || !$scope.canWriteWidget) {
                        return;
                    }
                    if ($scope.userPrefs.ctrlSSaveActiveOnly) {
                        if (pane && pane.dirty) {
                            $scope.savePaneField(pane);
                        }
                    } else {
                        $scope.saveAll();
                    }
                }

                $scope.savePaneField = function (pane) {
                    if ($scope.isVersionView) {
                        return;
                    }
                    $scope.permissionAlertDismissed = false;
                    if (pane.recordType === 'script_include') {
                        saveExtraPane(pane);
                        return;
                    }
                    if (pane.hasIdInput) {
                        saveExtraPane(pane);
                        return;
                    }

                    var editor = monacoEditors[pane.key];
                    var value = editor
                        ? editor.getValue()
                        : $scope.widget[pane.field] || '';

                    // Mark field as self-saving so the record-watcher echo is absorbed
                    _selfSavingFields[pane.field] = value;

                    ajax('saveField', {
                        sys_id: SYS_ID,
                        field: pane.field,
                        value: value,
                    })
                        .then(function (data) {
                            if (!data.success) {
                                delete _selfSavingFields[pane.field];
                                pane.saveError = data.error || 'Save failed';
                                return;
                            }
                            pane.saveError = null;
                            originalValues[pane.field] = value;
                            lastServerValues[pane.field] = value;
                            if (data.sys_updated_on) {
                                $scope.widget.sys_updated_on =
                                    data.sys_updated_on;
                            }
                            pane.dirty = false;
                            pane.externalChange = null;
                            if (!hasUnsavedChanges()) {
                                pane.savedAt = null;
                                $scope.lastSaveTime = new Date();
                                if (
                                    data.update_set_sys_id &&
                                    data.update_set_name
                                ) {
                                    $scope.lastSaveUpdateSet = {
                                        sys_id: data.update_set_sys_id,
                                        name: data.update_set_name,
                                    };
                                }
                            } else {
                                pane.savedAt = new Date();
                            }
                            // Safety: clear self-save flag if RW echo never arrives
                            $timeout(function () {
                                delete _selfSavingFields[pane.field];
                            }, 5000);
                        })
                        .catch(function (err) {
                            delete _selfSavingFields[pane.field];
                            pane.saveError = 'Save failed';
                            if (err && err.message) {
                                pane.saveError += ' (' + err.message + ')';
                            }
                        });
                };

                ////////////////////////////////////////////////////////////
                // Save: all (header Save button)
                ////////////////////////////////////////////////////////////
                $scope.$watch('widget.name', function (v) {
                    if (v && v.trim()) {
                        $scope.nameInvalid = false;
                        if ($scope.saveError === 'Widget name is required') {
                            $scope.saveError = null;
                        }
                    }
                });

                function _formatRelativeTime(date) {
                    var now = new Date();
                    var diffMs = now - date;
                    var diffMin = Math.floor(diffMs / 60000);
                    if (diffMin < 1) {
                        return 'just now';
                    }
                    if (diffMin < 60) {
                        return (
                            diffMin +
                            ' min' +
                            (diffMin === 1 ? '' : 's') +
                            ' ago'
                        );
                    }
                    var opts = { hour: 'numeric', minute: '2-digit' };
                    if (diffMs >= 86400000) {
                        opts.month = 'short';
                        opts.day = 'numeric';
                        opts.year = 'numeric';
                    }
                    return date.toLocaleString(undefined, opts);
                }

                $scope.getLastSaveLabel = function () {
                    return $scope.lastSaveTime
                        ? 'Saved ' + _formatRelativeTime($scope.lastSaveTime)
                        : '';
                };

                $scope.getPaneSavedLabel = function (pane) {
                    return pane.savedAt
                        ? 'Saved ' + _formatRelativeTime(pane.savedAt)
                        : '';
                };

                $scope.formatUpdateSetName = function (name) {
                    if (!name || name.length <= 25) {
                        return name;
                    }
                    return name.substring(0, 20) + '\\u2026' + name.slice(-4);
                };

                // Keep the relative labels fresh even when the user is idle
                setInterval(function () {
                    var hasPaneSaved = $scope.visibleItems.some(
                        function (item) {
                            return item.type === 'pane' && item.savedAt;
                        }
                    );
                    if ($scope.lastSaveTime || hasPaneSaved) {
                        $scope.$applyAsync();
                    }
                }, 30000);

                $scope.saveAll = function () {
                    if ($scope.isVersionView) {
                        return;
                    }
                    if (!$scope.canWriteWidget) {
                        return;
                    }
                    $scope.saveError = null;
                    $scope.permissionAlertDismissed = false;
                    if (!$scope.widget.name || !$scope.widget.name.trim()) {
                        $scope.nameInvalid = true;
                        $scope.saveError = 'Widget name is required';
                        return;
                    }

                    // Pull latest Monaco values into widget object
                    $scope.coreEditorDefs.forEach(function (def) {
                        if (monacoEditors[def.key]) {
                            $scope.widget[def.field] =
                                monacoEditors[def.key].getValue();
                        }
                    });
                    if ($scope.widget.is_public) {
                        $scope.rolesList.length = 0;
                    }
                    $scope.widget.roles = $scope.rolesList.join(',');

                    var payload = {
                        name: $scope.widget.name,
                        id: $scope.widget.id,
                        description: $scope.widget.description,
                        controller_as: $scope.widget.controller_as || 'c',
                        public: $scope.widget.is_public,
                        roles: $scope.widget.roles,
                        static: !!$scope.widget.static,
                        template: $scope.widget.template || '',
                        css: $scope.widget.css || '',
                        client_script: $scope.widget.client_script || '',
                        script: $scope.widget.script || '',
                        link: $scope.widget.link || '',
                    };

                    // Mark all script fields as self-saving so the record-watcher echo
                    // is absorbed and doesn't show "has updated" infobars or re-dirty panes.
                    var _saveAllScriptFields = [
                        'template',
                        'css',
                        'client_script',
                        'script',
                        'link',
                    ];
                    _saveAllScriptFields.forEach(function (f) {
                        _selfSavingFields[f] = payload[f];
                    });

                    ajax('saveWidget', {
                        sys_id: SYS_ID,
                        data: JSON.stringify(payload),
                    })
                        .then(function (data) {
                            if (!data.success) {
                                _saveAllScriptFields.forEach(function (f) {
                                    delete _selfSavingFields[f];
                                });
                                $scope.saveError = data.error || 'Save failed';
                                return;
                            }
                            $scope.saveError = null;
                            $scope.lastSaveTime = new Date();
                            $scope.lastSaveUpdateSet =
                                data.update_set_sys_id && data.update_set_name
                                    ? {
                                          sys_id: data.update_set_sys_id,
                                          name: data.update_set_name,
                                      }
                                    : null;
                            if (data.sys_updated_on) {
                                $scope.widget.sys_updated_on =
                                    data.sys_updated_on;
                            }
                            var wasNew = $scope.isNewWidget;
                            if (wasNew) {
                                SYS_ID = data.sys_id;
                                $scope.widget.sys_id = SYS_ID;
                                var newUrl =
                                    '/' +
                                    (WE_UI_SCRIPTS.editorPage ||
                                        'widget_editor') +
                                    '.do?widget_id=' +
                                    SYS_ID;
                                history.replaceState({}, '', newUrl);
                                try {
                                    window.parent.history.replaceState(
                                        {},
                                        '',
                                        newUrl
                                    );
                                } catch (e) {}
                                $scope.isNewWidget = false;
                            }
                            // Refresh originals; clear all dirty indicators
                            $scope.coreEditorDefs.forEach(function (def) {
                                var val = monacoEditors[def.key]
                                    ? monacoEditors[def.key].getValue()
                                    : $scope.widget[def.field] || '';
                                originalValues[def.field] = val;
                                lastServerValues[def.field] = val;
                            });
                            $scope.visibleItems.forEach(function (item) {
                                if (item.type === 'pane' && !item.hasIdInput) {
                                    item.dirty = item.idDirty = false;
                                    item.savedAt = null;
                                    item.externalChange = null;
                                }
                            });
                            // Reset header dirty tracking
                            originalHeader = {
                                name: $scope.widget.name || '',
                                id: $scope.widget.id || '',
                                description: $scope.widget.description || '',
                                controller_as:
                                    $scope.widget.controller_as || 'c',
                                public: !!$scope.widget.is_public,
                                roles: $scope.rolesList.join(','),
                                static: !!$scope.widget.static,
                            };
                            _captureAdditionalHeaderValues($scope.widget);
                            $scope.headerDirty = {
                                name: false,
                                id: false,
                                description: false,
                                controller_as: false,
                                is_public: false,
                                roles: false,
                                static: false,
                            };
                            ($scope.additionalWidgetFields || []).forEach(
                                function (fieldDef) {
                                    $scope.headerDirty[fieldDef.name] = false;
                                }
                            );
                            // Sync ES12 — SYS_ID is now set even for newly-created widgets
                            ajax('saveEs12', {
                                sys_id: SYS_ID,
                                enabled: $scope.widget.es12 ? 'true' : 'false',
                            }).then(function (_data) {
                                $scope.es12RecordExists = true;
                            });
                            // Always refresh versions after a save so the new entry appears in the dropdown
                            ajax('getVersions', { sys_id: SYS_ID }).then(
                                function (d) {
                                    if (d.success) {
                                        $scope.versions = d.versions;
                                    }
                                }
                            );
                            if (wasNew) {
                                // Load remaining side data now that the record exists
                                ajax('getTemplates', { sys_id: SYS_ID }).then(
                                    function (d) {
                                        if (d.success) {
                                            $scope.templates = d.templates;
                                        }
                                    }
                                );
                                ajax('getProviders', { sys_id: SYS_ID }).then(
                                    function (d) {
                                        if (d.success) {
                                            $scope.providers = d.providers;
                                        }
                                    }
                                );
                                ajax('getDependencies', {
                                    sys_id: SYS_ID,
                                }).then(function (d) {
                                    if (d.success) {
                                        $scope.dependencies = d.dependencies;
                                    }
                                });
                                startPresenceSubscription(SYS_ID);
                                startRecordWatcher();
                            }
                            // Also save any dirty open templates/providers
                            extraPanes.forEach(function (pane) {
                                if (pane.dirty || pane.idDirty) {
                                    saveExtraPane(pane);
                                }
                            });
                            // Safety: clear self-save flags if the RW echo never arrives
                            $timeout(function () {
                                _saveAllScriptFields.forEach(function (f) {
                                    delete _selfSavingFields[f];
                                });
                            }, 5000);
                        })
                        .catch(function (err) {
                            _saveAllScriptFields.forEach(function (f) {
                                delete _selfSavingFields[f];
                            });
                            $scope.saveError = 'Save failed';
                            if (err && err.message) {
                                $scope.saveError += ' (' + err.message + ')';
                            }
                        });
                };

                ////////////////////////////////////////////////////////////
                // ES12
                ////////////////////////////////////////////////////////////
                $scope.saveEs12 = function () {
                    // Defer until the widget record exists (new unsaved widget has no SYS_ID).
                    // For existing widgets the server does an upsert, so no pre-existence check needed.
                    if (!SYS_ID) {
                        return;
                    }
                    _applyEsVersion(!!$scope.widget.es12);
                    ajax('saveEs12', {
                        sys_id: SYS_ID,
                        enabled: $scope.widget.es12 ? 'true' : 'false',
                    }).then(function (_data) {
                        $scope.es12RecordExists = true;
                    });
                };

                ////////////////////////////////////////////////////////////
                // Presence — AMB channel (real-time, no GlideAjax polling)
                // Mirrors platform snRecordPresence: subscribe to /sp/rp/sp_widget/<id>,
                // publish own status on connect, receive others' statuses via the channel.
                ////////////////////////////////////////////////////////////

                var _presenceVisibilityHandler = null;

                function startPresenceSubscription(widgetSysId) {
                    _presenceWidgetSysId = widgetSysId;

                    var currentUserId =
                        (typeof NOW !== 'undefined' && NOW.user_id) || null;
                    // Presence map: user_id -> { sys_id, name, initials, avatar }
                    // Populated by GlideAjax polling; kept current by AMB messages.
                    var presenceMap = {};

                    function updatePresenceFromMap() {
                        $scope.presenceUsers = Object.keys(presenceMap).map(
                            function (uid) {
                                return presenceMap[uid];
                            }
                        );
                    }

                    function fetchPresence() {
                        ajax('getPresence', { sys_id: widgetSysId }).then(
                            function (data) {
                                if (!data || !data.success) {
                                    return;
                                }
                                presenceMap = {};
                                (data.users || []).forEach(function (u) {
                                    if (
                                        u.sys_id &&
                                        u.sys_id !== currentUserId
                                    ) {
                                        presenceMap[u.sys_id] = u;
                                    }
                                });
                                updatePresenceFromMap();
                            }
                        );
                    }

                    // Publish our own viewing status to the presence channel.
                    // Mirrors snRecordPresence.publish() — notifies other subscribers in real-time.
                    function publishPresence(status) {
                        if (!presenceChannel) {
                            return;
                        }
                        try {
                            presenceChannel.publish({
                                presences: [
                                    {
                                        status: status,
                                        session_id:
                                            (NOW && NOW.session_id) || '',
                                        user_name: (NOW && NOW.user_name) || '',
                                        user_id: currentUserId || '',
                                        user_display_name:
                                            (NOW &&
                                                (NOW.user_display_name ||
                                                    NOW.full_name)) ||
                                            '',
                                        user_initials:
                                            (NOW && NOW.user_initials) || '',
                                        user_avatar:
                                            (NOW && NOW.user_avatar) || null,
                                        table: 'sp_widget',
                                        sys_id: widgetSysId,
                                    },
                                ],
                            });
                        } catch (e) {}
                    }

                    if (amb) {
                        try {
                            presenceChannel = amb.getChannel(
                                '/sn/rp/sp_widget/' + widgetSysId
                            );

                            // Subscribe to receive other users' presence updates in real-time.
                            // Subscribing also registers us server-side (sys_amb_channel_presence).
                            presenceChannel.subscribe(function (msg) {
                                var presences =
                                    msg && msg.data && msg.data.presences;
                                if (!presences) {
                                    return;
                                }
                                var changed = false;
                                presences.forEach(function (p) {
                                    var uid = p.user_id;
                                    if (!uid || uid === currentUserId) {
                                        return;
                                    }
                                    if (
                                        p.status === 'exited' ||
                                        p.status === 'probably left'
                                    ) {
                                        if (presenceMap[uid]) {
                                            delete presenceMap[uid];
                                            changed = true;
                                        }
                                    } else {
                                        presenceMap[uid] = {
                                            sys_id: uid,
                                            name:
                                                p.user_display_name ||
                                                p.user_name ||
                                                uid,
                                            initials:
                                                p.user_initials ||
                                                p.user_initial ||
                                                '',
                                            avatar: p.user_avatar || null,
                                        };
                                        changed = true;
                                    }
                                });
                                if (changed) {
                                    $scope.$applyAsync(updatePresenceFromMap);
                                }
                            });

                            // Ensure the AMB connection is active then announce ourselves.
                            amb.connect();
                            $timeout(function () {
                                publishPresence('viewing');
                            }, 500);
                        } catch (e) {}
                    }

                    // Initial fetch — catches users already viewing before we subscribed.
                    $timeout(fetchPresence, 1500);

                    _presenceVisibilityHandler = function () {
                        if (document.hidden) {
                            publishPresence('probably left');
                        } else {
                            fetchPresence();
                            publishPresence('viewing');
                        }
                    };
                    document.addEventListener(
                        'visibilitychange',
                        _presenceVisibilityHandler
                    );
                }

                function stopPresenceSubscription() {
                    if (presenceChannel) {
                        // Publish "exited" so other subscribers know we left immediately,
                        // then unsubscribe (mirrors snRecordPresence.termPresence behaviour).
                        try {
                            presenceChannel.publish({
                                presences: [
                                    {
                                        status: 'exited',
                                        session_id:
                                            (NOW && NOW.session_id) || '',
                                        user_id: (NOW && NOW.user_id) || '',
                                        table: 'sp_widget',
                                        sys_id: _presenceWidgetSysId,
                                    },
                                ],
                            });
                        } catch (e) {}
                        try {
                            presenceChannel.unsubscribe();
                        } catch (e) {}
                        presenceChannel = null;
                    }
                    if (_presenceVisibilityHandler) {
                        document.removeEventListener(
                            'visibilitychange',
                            _presenceVisibilityHandler
                        );
                        _presenceVisibilityHandler = null;
                    }
                    _presenceWidgetSysId = null;
                    $scope.presenceUsers = [];
                }

                ////////////////////////////////////////////////////////////
                // Per-pane presence (template / provider editors)
                ////////////////////////////////////////////////////////////
                var _panePresenceCurrentUserId =
                    (typeof NOW !== 'undefined' && NOW.user_id) || null;

                function _presencePublishData(table, sysId, status) {
                    return {
                        presences: [
                            {
                                status: status,
                                session_id: (NOW && NOW.session_id) || '',
                                user_name: (NOW && NOW.user_name) || '',
                                user_id: _panePresenceCurrentUserId || '',
                                user_display_name:
                                    (NOW &&
                                        (NOW.user_display_name ||
                                            NOW.full_name)) ||
                                    '',
                                user_initials: (NOW && NOW.user_initials) || '',
                                user_avatar: (NOW && NOW.user_avatar) || null,
                                table: table,
                                sys_id: sysId,
                            },
                        ],
                    };
                }

                function startPanePresence(pane) {
                    if (!amb || !pane.sys_id || pane._presenceChannel) {
                        return;
                    }
                    var table =
                        pane.recordType === 'template'
                            ? 'sp_ng_template'
                            : pane.recordType === 'script_include'
                              ? 'sys_script_include'
                              : 'sp_angular_provider';
                    var panePresenceMap = {};

                    try {
                        pane._presenceChannel = amb.getChannel(
                            '/sn/rp/' + table + '/' + pane.sys_id
                        );
                        pane._presenceChannel.subscribe(function (msg) {
                            var presences =
                                msg && msg.data && msg.data.presences;
                            if (!presences) {
                                return;
                            }
                            var changed = false;
                            presences.forEach(function (p) {
                                var uid = p.user_id;
                                if (
                                    !uid ||
                                    uid === _panePresenceCurrentUserId
                                ) {
                                    return;
                                }
                                if (
                                    p.status === 'exited' ||
                                    p.status === 'probably left'
                                ) {
                                    if (panePresenceMap[uid]) {
                                        delete panePresenceMap[uid];
                                        changed = true;
                                    }
                                } else {
                                    panePresenceMap[uid] = {
                                        sys_id: uid,
                                        name:
                                            p.user_display_name ||
                                            p.user_name ||
                                            uid,
                                        initials:
                                            p.user_initials ||
                                            p.user_initial ||
                                            '',
                                        avatar: p.user_avatar || null,
                                    };
                                    changed = true;
                                }
                            });
                            if (changed) {
                                $scope.$applyAsync(function () {
                                    pane.viewingUsers = Object.keys(
                                        panePresenceMap
                                    ).map(function (uid) {
                                        return panePresenceMap[uid];
                                    });
                                });
                            }
                        });
                        $timeout(function () {
                            if (pane._presenceChannel) {
                                try {
                                    pane._presenceChannel.publish(
                                        _presencePublishData(
                                            table,
                                            pane.sys_id,
                                            'viewing'
                                        )
                                    );
                                } catch (e) {}
                            }
                        }, 500);
                    } catch (e) {}
                }

                function stopPanePresence(pane) {
                    if (!pane._presenceChannel) {
                        return;
                    }
                    var table =
                        pane.recordType === 'template'
                            ? 'sp_ng_template'
                            : pane.recordType === 'script_include'
                              ? 'sys_script_include'
                              : 'sp_angular_provider';
                    try {
                        pane._presenceChannel.publish(
                            _presencePublishData(table, pane.sys_id, 'exited')
                        );
                    } catch (e) {}
                    try {
                        pane._presenceChannel.unsubscribe();
                    } catch (e) {}
                    pane._presenceChannel = null;
                    pane.viewingUsers = [];
                }

                $scope.viewersTitle = function (pane) {
                    return (pane.viewingUsers || [])
                        .filter(function (u) {
                            return u.sys_id !== $scope.currentUserId;
                        })
                        .map(function (u) {
                            return u.name;
                        })
                        .join(', ');
                };

                ////////////////////////////////////////////////////////////
                // Extra pane (template/provider) external-change via AMB record watcher
                ////////////////////////////////////////////////////////////
                function startPaneRecordWatcher(pane) {
                    if (!amb || !pane.sys_id || pane._rwChannel) {
                        return;
                    }
                    var table =
                        pane.recordType === 'template'
                            ? 'sp_ng_template'
                            : pane.recordType === 'script_include'
                              ? 'sys_script_include'
                              : 'sp_angular_provider';
                    var contentField =
                        pane.recordType === 'template' ? 'template' : 'script';
                    try {
                        pane._rwChannel = amb.getRecordWatcherChannel
                            ? amb.getRecordWatcherChannel(
                                  table,
                                  'sys_id=' + pane.sys_id
                              )
                            : amb.getChannel(
                                  '/rw/default/' +
                                      table +
                                      '/' +
                                      btoa('sys_id=' + pane.sys_id)
                              );
                        pane._rwChannel.subscribe(function (msg) {
                            var d = msg && msg.data;
                            if (!d || !d.record || !d.record[contentField]) {
                                return;
                            }
                            var serverVal = d.record[contentField].value || '';
                            if (serverVal === pane.lastServerContent) {
                                return;
                            }
                            // Absorb echo of our own save (may arrive before AJAX callback)
                            if (
                                pane._pendingSaveContent !== undefined &&
                                pane._pendingSaveContent === serverVal
                            ) {
                                delete pane._pendingSaveContent;
                                pane.lastServerContent = serverVal;
                                return;
                            }
                            var updater =
                                (msg.ext && msg.ext.from_user) ||
                                'Another user';
                            $timeout(function () {
                                pane.lastServerContent = serverVal;
                                var editor = monacoEditors[pane.key];
                                if (!pane.dirty && editor) {
                                    editor.setValue(serverVal);
                                } else {
                                    pane.externalChange = {
                                        user: updater,
                                        serverVal: serverVal,
                                    };
                                }
                            });
                        });
                    } catch (e) {}
                }

                function stopPaneRecordWatcher(pane) {
                    if (!pane._rwChannel) {
                        return;
                    }
                    try {
                        pane._rwChannel.unsubscribe();
                    } catch (e) {}
                    pane._rwChannel = null;
                }

                ////////////////////////////////////////////////////////////
                // External-change detection via AMB record watcher
                ////////////////////////////////////////////////////////////
                function startRecordWatcher() {
                    if (!amb) {
                        return;
                    }

                    // Use window.amb.getClient().getRecordWatcherChannel() directly —
                    // equivalent to snRecordWatcher._initWatcher() from ng.amb (not available here).
                    try {
                        var rwChannel = amb.getRecordWatcherChannel
                            ? amb.getRecordWatcherChannel(
                                  'sp_widget',
                                  'sys_id=' + SYS_ID
                              )
                            : amb.getChannel(
                                  '/rw/default/sp_widget/' +
                                      btoa('sys_id=' + SYS_ID)
                              );
                        rwChannel.subscribe(function (msg) {
                            var d = msg && msg.data;
                            if (!d || (d.sys_id && d.sys_id !== SYS_ID)) {
                                return;
                            }
                            $timeout(function () {
                                _applyWidgetRwMessage(d, msg.ext);
                            });
                        });
                        amb.connect();
                    } catch (e) {
                        return;
                    }
                }

                function _applyWidgetRwMessage(d, ext) {
                    var updater =
                        (ext && ext.from_user) ||
                        (d.record &&
                            d.record.sys_updated_by &&
                            d.record.sys_updated_by.value) ||
                        'Another user';
                    var changes = d.changes_with_users || {};
                    var record = d.record || {};

                    // Refresh the versions dropdown whenever any change is detected
                    ajax('getVersions', { sys_id: SYS_ID }).then(function (vd) {
                        if (vd.success) {
                            $scope.versions = vd.versions;
                        }
                    });

                    Object.keys(changes).forEach(function (field) {
                        if (!record[field]) {
                            return;
                        }
                        var serverVal = record[field].value || '';
                        lastServerValues[field] = serverVal;
                        var pane = getPaneByField(field);
                        if (!pane) {
                            return;
                        }
                        // Absorb echo of our own save: if the saved value matches the RW value,
                        // this notification is our own update reflecting back — skip the infobar.
                        if (
                            _selfSavingFields[field] !== undefined &&
                            _selfSavingFields[field] === serverVal
                        ) {
                            delete _selfSavingFields[field];
                            originalValues[field] = serverVal;
                            pane.dirty = false;
                            pane.externalChange = null;
                            return;
                        }
                        originalValues[field] = serverVal;
                        if ($scope.userPrefs.realtimeWidgetUpdates) {
                            if (monacoEditors[pane.key]) {
                                monacoEditors[pane.key].setValue(serverVal);
                            }
                            $scope.widget[field] = serverVal;
                            pane.externalChange = null;
                        } else {
                            pane.dirty = true;
                            pane.externalChange = {
                                user: updater,
                                serverVal: serverVal,
                            };
                        }
                    });
                }

                function getPaneByField(field) {
                    for (var i = 0; i < $scope.visibleItems.length; i++) {
                        var item = $scope.visibleItems[i];
                        if (item.type === 'pane' && item.field === field) {
                            return item;
                        }
                    }
                    return null;
                }

                // Listens for a revert triggered from the diff page (localStorage signal).
                // Reverts by other users are handled by the AMB record watcher.
                function startRevertListener() {
                    var revertKey = '_weRevertPending_' + SYS_ID;
                    var FIELDS = [
                        'template',
                        'css',
                        'client_script',
                        'script',
                        'link',
                    ];

                    function _onRevertDetected(w) {
                        FIELDS.forEach(function (f) {
                            lastServerValues[f] = w[f] || '';
                        });
                        $timeout(function () {
                            $scope.widgetReverted = true;
                        });
                    }

                    // Same-browser revert (diff page in another tab): do a single fetch to
                    // confirm the reverted values, then show the banner. Remote-user reverts
                    // arrive via the AMB record watcher as normal field changes.
                    window.addEventListener('storage', function (e) {
                        if (e.key !== revertKey || !e.newValue) {
                            return;
                        }
                        try {
                            localStorage.removeItem(revertKey);
                        } catch (ex) {}
                        ajax('getWidget', { sys_id: SYS_ID }).then(
                            function (data) {
                                if (!data.success || !data.widget) {
                                    return;
                                }
                                var w = data.widget;
                                // Only show the banner if the server values actually changed.
                                // If the user cancelled the revert dialog, the widget is
                                // unchanged and we should not show a false "reverted" alert.
                                var changed = FIELDS.some(function (f) {
                                    return (w[f] || '') !== lastServerValues[f];
                                });
                                if (changed) {
                                    _onRevertDetected(w);
                                }
                            }
                        );
                    });
                }

                $scope.reloadPage = function () {
                    window.location.reload();
                };

                ////////////////////////////////////////////////////////////
                // Editor visibility & user preferences
                ////////////////////////////////////////////////////////////
                function _clearPaneWidths() {
                    Object.keys(paneMap).forEach(function (k) {
                        paneMap[k].width = null;
                    });
                    extraPanes.forEach(function (p) {
                        p.width = null;
                    });
                }

                function applyVisibility() {
                    // Save current value of editors becoming hidden, then dispose them
                    $scope.coreEditorDefs.forEach(function (def) {
                        if (!def.visible && monacoEditors[def.key]) {
                            $scope.widget[def.field] =
                                monacoEditors[def.key].getValue();
                            disposeEditor(def.key);
                        }
                    });
                    _clearPaneWidths();
                    buildVisibleItems();
                    $timeout(function () {
                        initAllEditors();
                    }, 50);
                }

                $scope.onEditorVisibilityChange = function () {
                    applyVisibility();
                };

                function saveUserPrefs() {
                    _snapshotEditorPrefs();
                    var prefs = {};
                    $scope.coreEditorDefs.forEach(function (d) {
                        prefs[d.key] = d.visible;
                    });
                    prefs.formatTabsToSpaces =
                        $scope.userPrefs.formatTabsToSpaces;
                    prefs.wordWrap = $scope.userPrefs.wordWrap;
                    prefs.editorTheme = $scope.userPrefs.editorTheme;
                    prefs.minimap = $scope.userPrefs.minimap;
                    prefs.alwaysShowLink = $scope.userPrefs.alwaysShowLink;
                    prefs.realtimeWidgetUpdates =
                        $scope.userPrefs.realtimeWidgetUpdates;
                    prefs.autoIndent = $scope.userPrefs.autoIndent;
                    prefs.formatOnPaste = $scope.userPrefs.formatOnPaste;
                    prefs.formatOnType = $scope.userPrefs.formatOnType;
                    prefs.fontSize = $scope.userPrefs.fontSize;
                    prefs.fontFamily = $scope.userPrefs.fontFamily;
                    prefs.languageHelpers = $scope.userPrefs.languageHelpers;
                    prefs.stickyScroll = $scope.userPrefs.stickyScroll;
                    prefs.htmlValidation = $scope.userPrefs.htmlValidation;
                    prefs.htmlAutoCloseTags = $scope.userPrefs.htmlAutoCloseTags;
                    prefs.autoSurround = $scope.userPrefs.autoSurround;
                    prefs.autoClosingBrackets = $scope.userPrefs.autoClosingBrackets;
                    prefs.autoClosingQuotes = $scope.userPrefs.autoClosingQuotes;
                    prefs.linkedEditing = $scope.userPrefs.linkedEditing;
                    prefs.insertSpaceBeforeFuncParen =
                        $scope.userPrefs.insertSpaceBeforeFuncParen;
                    prefs.tabSize = $scope.userPrefs.tabSize;
                    prefs.remBase = $scope.userPrefs.remBase;
                    prefs.ctrlSSaveActiveOnly =
                        $scope.userPrefs.ctrlSSaveActiveOnly;
                    prefs.flashOnEditorOpen =
                        $scope.userPrefs.flashOnEditorOpen;
                    prefs.showOpenInVsCode =
                        $scope.userPrefs.showOpenInVsCode;
                    prefs.order = $scope.coreEditorDefs.map(function (d) {
                        return d.key;
                    });
                    ajax('saveUserPrefs', { value: JSON.stringify(prefs) });
                }

                ////////////////////////////////////////////////////////////
                // Angular Templates (sp_ng_template)
                ////////////////////////////////////////////////////////////
                function focusPaneEditor(pane) {
                    if (!pane || !pane.key) {
                        return;
                    }
                    $timeout(function () {
                        var editor = monacoEditors[pane.key];
                        if (editor && editor.focus) {
                            editor.focus();
                            return;
                        }
                        // Fallback while Monaco is still mounting.
                        var container = document.getElementById(
                            'editor-' + pane.key
                        );
                        if (!container || !container.querySelector) {
                            return;
                        }
                        var input = container.querySelector(
                            'textarea, [contenteditable="true"]'
                        );
                        if (input && input.focus) {
                            input.focus();
                        }
                    }, 0);
                }

                function flashOpenExtraPane(existingPane) {
                    if (!existingPane || !existingPane.key || !$scope.userPrefs.flashOnEditorOpen) {
                        return;
                    }
                    var paneEl = document.getElementById(
                        'pane-' + existingPane.key
                    );
                    if (!paneEl || !paneEl.classList) {
                        return;
                    }
                    paneEl.classList.remove('we-pane-flash');
                    // Force reflow so quick re-selections can replay the animation.
                    paneEl.offsetWidth;
                    paneEl.classList.add('we-pane-flash');
                    focusPaneEditor(existingPane);
                    $timeout(function () {
                        if (paneEl && paneEl.classList) {
                            paneEl.classList.remove('we-pane-flash');
                        }
                    }, 380);
                }

                $scope.openTemplate = function (t) {
                    $scope.openDropdown = null;
                    var existingPane = extraPanes.find(function (p) {
                        return p.sys_id === t.sys_id;
                    });
                    if (existingPane) {
                        flashOpenExtraPane(existingPane);
                        return;
                    }
                    var pane = makeTemplatePaneObj(t);
                    pane.lastServerContent = t.template || '';
                    openExtraPane(pane);
                };

                function initPaneIdCheck(pane) {
                    if (!pane.recordId || !pane.recordId.trim()) {
                        return;
                    }
                    pane.idChecking = true;
                    var action =
                        pane.recordType === 'template'
                            ? 'checkTemplateId'
                            : 'checkProviderId';
                    ajax(action, {
                        id: pane.recordId,
                        sys_id: pane.sys_id || '',
                    }).then(function (res) {
                        pane.idChecking = false;
                        if (!res.success) {
                            return;
                        }
                        if (res.exists) {
                            pane.idError = 'ID already exists';
                        } else {
                            pane.idError = null;
                            pane.editorUnlocked = true;
                            if (monacoEditors[pane.key]) {
                                monacoEditors[pane.key].updateOptions({
                                    readOnly: false,
                                });
                            }
                        }
                    });
                }

                $scope.addTemplate = function () {
                    $scope.openDropdown = null;
                    var defaultId =
                        $scope.widget && $scope.widget.id
                            ? $scope.widget.id + '-'
                            : '';
                    var pane = makeTemplatePaneObj({
                        sys_id: null,
                        id: defaultId,
                        template: '',
                    });
                    openExtraPane(pane);
                    if (defaultId) {
                        $timeout(function () {
                            initPaneIdCheck(pane);
                        }, 80);
                    }
                };

                function makeTemplatePaneObj(t) {
                    var key = 'tpl-' + (t.sys_id || 'new-' + Date.now());
                    return {
                        key: key,
                        label: 'Angular template',
                        field: null,
                        language: 'html',
                        type: 'pane',
                        hasIdInput: true,
                        closeable: true,
                        recordType: 'template',
                        sys_id: t.sys_id || null,
                        recordId: t.id || '',
                        content: t.template || '',
                        editorUnlocked: !!t.sys_id,
                        canDelete: !!t.canDelete,
                        readOnly: !!t.readOnly,
                        readOnlyReason: t.readOnlyReason || '',
                        scopeName: t.scopeName || '',
                        idError: null,
                        idChecking: false,
                        dirty: false,
                        idDirty: false,
                        savedRecently: false,
                        externalChange: null,
                        viewingUsers: [],
                        width: null,
                        volatility_level: t.volatility_level || '',
                        volatility_level_display:
                            t.volatility_level_display || '',
                    };
                }

                ////////////////////////////////////////////////////////////
                // Angular Providers (sp_angular_provider)
                ////////////////////////////////////////////////////////////
                function openExtraPane(pane) {
                    extraPanes.push(pane);
                    buildVisibleItems();
                    $timeout(function () {
                        initEditorForPane(pane);
                        focusPaneEditor(pane);
                        flashOpenExtraPane(pane);
                        // Extra panes are created after initial editor bootstrap,
                        // so they need explicit post-create relayout/tokenization.
                        $timeout(layoutAllEditors, 20);
                        $timeout(layoutAllEditors, 500);
                        $timeout(layoutAllEditors, 900);
                    }, 50);
                    if (pane.sys_id) {
                        startPanePresence(pane);
                        startPaneRecordWatcher(pane);
                    }
                }

                $scope.openProvider = function (p) {
                    $scope.openDropdown = null;
                    var existingPane = extraPanes.find(function (e) {
                        return e.sys_id === p.sys_id;
                    });
                    if (existingPane) {
                        flashOpenExtraPane(existingPane);
                        return;
                    }
                    var pane = makeProviderPaneObj(p);
                    pane.lastServerContent = p.script || '';
                    openExtraPane(pane);
                };

                $scope.addNewProvider = function () {
                    $scope.openDropdown = null;
                    var pane = makeProviderPaneObj({
                        sys_id: null,
                        name: '',
                        type: '',
                        script: '',
                    });
                    openExtraPane(pane);
                };

                var _linkProviderDebounce;
                $scope.openLinkProviderModal = function () {
                    $scope.openDropdown = null;
                    $scope.linkProvider.search = '';
                    $scope.linkProviderResults = [];
                    $scope.showLinkProviderModal = true;
                    loadLinkProviderResults('');
                };

                $scope.onLinkProviderSearch = function () {
                    $timeout.cancel(_linkProviderDebounce);
                    _linkProviderDebounce = $timeout(function () {
                        loadLinkProviderResults($scope.linkProvider.search);
                    }, 300);
                };

                function loadLinkProviderResults(search) {
                    $scope.linkProviderSearching = true;
                    ajax('getAllProviders', {
                        sys_id: SYS_ID,
                        search: search,
                    }).then(function (d) {
                        $scope.linkProviderSearching = false;
                        if (d.success) {
                            $scope.linkProviderResults = d.providers;
                        }
                    });
                }

                $scope.selectLinkProvider = function (p) {
                    _closeModal(function () {
                        $scope.showLinkProviderModal = false;
                    });
                    ajax('linkProvider', {
                        sys_id: SYS_ID,
                        provider_sys_id: p.sys_id,
                    }).then(function (d) {
                        if (!d.success) {
                            return;
                        }
                        ajax('getProviders', { sys_id: SYS_ID }).then(
                            function (pd) {
                                if (pd.success) {
                                    $scope.providers = pd.providers;
                                }
                            }
                        );
                        $scope.openProvider(p);
                    });
                };

                $scope.cancelLinkProviderModal = function () {
                    _closeModal(function () {
                        $scope.showLinkProviderModal = false;
                    });
                };

                function makeProviderPaneObj(p) {
                    var key = 'prv-' + (p.sys_id || 'new-' + Date.now());
                    return {
                        key: key,
                        label: 'Angular provider',
                        field: null,
                        language: 'javascript',
                        type: 'pane',
                        hasIdInput: true,
                        closeable: true,
                        recordType: 'provider',
                        sys_id: p.sys_id || null,
                        recordId: p.name || '',
                        providerType: p.type || '',
                        content: p.script || '',
                        editorUnlocked: !!p.sys_id,
                        canDelete: !!p.canDelete,
                        linkedToOtherWidgets: !!p.linkedToOtherWidgets,
                        readOnly: !!p.readOnly,
                        readOnlyReason: p.readOnlyReason || '',
                        scopeName: p.scopeName || '',
                        idError: null,
                        idChecking: false,
                        dirty: false,
                        idDirty: false,
                        savedRecently: false,
                        externalChange: null,
                        viewingUsers: [],
                        width: null,
                        volatility_level: p.volatility_level || '',
                        volatility_level_display:
                            p.volatility_level_display || '',
                    };
                }

                ////////////////////////////////////////////////////////////
                // Script Include panes
                ////////////////////////////////////////////////////////////
                function makeScriptIncludePaneObj(si) {
                    var key = 'si-' + si.sys_id;
                    return {
                        key: key,
                        label: si.name,
                        field: null,
                        language: 'typescript',
                        type: 'pane',
                        hasIdInput: false,
                        closeable: true,
                        recordType: 'script_include',
                        sys_id: si.sys_id,
                        recordId: si.name,
                        content: si.script || '',
                        readOnly: !!si.readOnly,
                        readOnlyReason: si.readOnlyReason || '',
                        scopeName: si.scopeName || '',
                        editorUnlocked: true,
                        canDelete: false,
                        idError: null,
                        idChecking: false,
                        dirty: false,
                        idDirty: false,
                        savedRecently: false,
                        externalChange: null,
                        viewingUsers: [],
                        width: null,
                        volatility_level: si.volatility_level || '',
                        volatility_level_display:
                            si.volatility_level_display || '',
                    };
                }

                $scope.openScriptInclude = function (si) {
                    // If already open, scroll it into view
                    var existing = extraPanes.filter(function (p) {
                        return p.sys_id === si.sys_id;
                    })[0];
                    if (existing) {
                        flashOpenExtraPane(existing);
                        return;
                    }
                    var pane = makeScriptIncludePaneObj(si);
                    pane.lastServerContent = si.script || '';
                    openExtraPane(pane);
                };

                function openScriptIncludeByName(name) {
                    var sysId =
                        window.SNMonacoPlus &&
                        window.SNMonacoPlus.getSiSysId(name);
                    // If already open, focus it
                    if (sysId) {
                        var existing = extraPanes.filter(function (p) {
                            return p.sys_id === sysId;
                        })[0];
                        if (existing) {
                            $timeout(function () {
                                var el = document.querySelector(
                                    '[data-key="' + existing.key + '"]'
                                );
                                if (el) {
                                    el.scrollIntoView({
                                        behavior: 'smooth',
                                        inline: 'nearest',
                                    });
                                }
                            }, 50);
                            return;
                        }
                    }
                    var params = sysId ? { sys_id: sysId } : { name: name };
                    ajax('getScriptInclude', params).then(function (d) {
                        if (!d.success) {
                            return;
                        }
                        $scope.openScriptInclude(d.si);
                    });
                }

                $scope.pendingDeletePane = null;

                $scope.deleteExtraPane = function (item) {
                    $scope.pendingDeletePane = item;
                };

                $scope.cancelDeletePane = function () {
                    $scope.pendingDeletePane = null;
                };

                $scope.confirmDeletePane = function () {
                    var item = $scope.pendingDeletePane;
                    if (!item || item.deleting) {
                        return;
                    }
                    item.deleting = true;
                    var params = { sys_id: item.sys_id };
                    if (item.recordType === 'provider') {
                        params.widget_sys_id = SYS_ID;
                    }
                    ajax(
                        item.recordType === 'template'
                            ? 'deleteTemplate'
                            : 'deleteProvider',
                        params
                    ).then(function (d) {
                        item.deleting = false;
                        $scope.pendingDeletePane = null;
                        if (!d.success) {
                            $window.alert(d.error || 'Delete failed');
                            return;
                        }
                        var idx = extraPanes.indexOf(item);
                        if (idx !== -1) {
                            extraPanes.splice(idx, 1);
                        }
                        if (item.recordType === 'template') {
                            $scope.templates = $scope.templates.filter(
                                function (t) {
                                    return t.sys_id !== item.sys_id;
                                }
                            );
                        } else {
                            $scope.providers = $scope.providers.filter(
                                function (p) {
                                    return p.sys_id !== item.sys_id;
                                }
                            );
                        }
                        buildVisibleItems();
                    });
                };

                ////////////////////////////////////////////////////////////
                // Dependencies (m2m_sp_widget_dependency)
                ////////////////////////////////////////////////////////////
                var _linkDepDebounce = null;

                $scope.openDependency = function (dep) {
                    $scope.openDropdown = null;
                    $window.open(
                        '/nav_to.do?uri=' +
                            encodeURIComponent(
                                'sp_dependency.do?sys_id=' + dep.sys_id
                            ),
                        '_blank'
                    );
                };

                $scope.addNewDependency = function () {
                    $scope.openDropdown = null;
                    $window.open('/nav_to.do?uri=sp_dependency.do', '_blank');
                };

                $scope.openLinkDependencyModal = function () {
                    $scope.openDropdown = null;
                    $scope.linkDependency.search = '';
                    $scope.linkDependencyResults = [];
                    $scope.showLinkDependencyModal = true;
                    _loadLinkDependencyResults('');
                };

                $scope.onLinkDependencySearch = function () {
                    $timeout.cancel(_linkDepDebounce);
                    _linkDepDebounce = $timeout(function () {
                        _loadLinkDependencyResults(
                            $scope.linkDependency.search
                        );
                    }, 300);
                };

                function _loadLinkDependencyResults(search) {
                    $scope.linkDependencySearching = true;
                    ajax('getAllDependencies', {
                        sys_id: SYS_ID,
                        search: search,
                    }).then(function (d) {
                        $scope.linkDependencySearching = false;
                        if (d.success) {
                            $scope.linkDependencyResults = d.dependencies;
                        }
                    });
                }

                $scope.selectLinkDependency = function (dep) {
                    _closeModal(function () {
                        $scope.showLinkDependencyModal = false;
                    });
                    ajax('linkDependency', {
                        sys_id: SYS_ID,
                        dep_sys_id: dep.sys_id,
                    }).then(function (d) {
                        if (!d.success) {
                            return;
                        }
                        ajax('getDependencies', { sys_id: SYS_ID }).then(
                            function (dd) {
                                if (dd.success) {
                                    $scope.dependencies = dd.dependencies;
                                }
                            }
                        );
                    });
                };

                $scope.cancelLinkDependencyModal = function () {
                    _closeModal(function () {
                        $scope.showLinkDependencyModal = false;
                    });
                };

                $scope.unlinkDependencyFromDropdown = function (dep) {
                    $scope.openDropdown = null;
                    $scope.pendingUnlinkDependency = {
                        sys_id: dep.sys_id,
                        name: dep.name,
                    };
                };

                $scope.cancelUnlinkDependency = function () {
                    $scope.pendingUnlinkDependency = null;
                };

                $scope.confirmUnlinkDependency = function () {
                    var pending = $scope.pendingUnlinkDependency;
                    if (!pending) {
                        return;
                    }
                    $scope.pendingUnlinkDependency = null;
                    ajax('unlinkDependency', {
                        sys_id: SYS_ID,
                        dep_sys_id: pending.sys_id,
                    }).then(function (d) {
                        if (!d.success) {
                            return;
                        }
                        $scope.dependencies = $scope.dependencies.filter(
                            function (dep) {
                                return dep.sys_id !== pending.sys_id;
                            }
                        );
                    });
                };

                ////////////////////////////////////////////////////////////
                // Related Lists modal
                ////////////////////////////////////////////////////////////

                function _markFirstLink(columns) {
                    var set = false;
                    (columns || []).forEach(function (col) {
                        col.firstLink = !set && !col.refTable;
                        if (col.firstLink) {
                            set = true;
                        }
                    });
                }

                $scope.openRelatedModal = function () {
                    if ($scope.isNewWidget) {
                        return;
                    }
                    $scope.relatedModal.open = true;
                    $scope.relatedModal.tabs = [];
                    $scope.relatedModal.activeTab = null;
                    $scope.relatedModal.loading = true;
                    ajax('getRelatedDefinitions', { sys_id: SYS_ID }).then(
                        function (d) {
                            $scope.relatedModal.loading = false;
                            if (!d.success) {
                                return;
                            }
                            d.tabs.forEach(function (tab) {
                                _markFirstLink(tab.columns);
                            });
                            $scope.relatedModal.tabs = d.tabs;
                            if (d.tabs.length > 0) {
                                $scope.selectRelatedTab(d.tabs[0]);
                            }
                        }
                    );
                };

                $scope.closeRelatedModal = function () {
                    _closeModal(function () {
                        $scope.relatedModal.open = false;
                    });
                };

                $scope.selectRelatedTab = function (tab) {
                    $scope.relatedModal.activeTab = tab;
                    if (!tab.rows) {
                        $scope.loadRelatedTabData(tab, 0);
                    }
                };

                $scope.loadRelatedTabData = function (tab, page) {
                    tab.loading = true;
                    tab.rows = null;
                    tab.error = null;
                    ajax('getRelatedData', {
                        sys_id: SYS_ID,
                        related_list: tab.related_list,
                        page: page,
                    }).then(function (d) {
                        tab.loading = false;
                        if (!d.success) {
                            tab.error = d.error || 'Failed to load';
                            return;
                        }
                        tab.rows = d.rows;
                        tab.columns = d.columns;
                        _markFirstLink(tab.columns);
                        tab.page = d.page;
                        var _ps = 20;
                        tab.pageStart =
                            d.rows.length > 0 ? d.page * _ps + 1 : 0;
                        tab.pageEnd = d.page * _ps + d.rows.length;
                        tab.lastPage = Math.max(
                            0,
                            Math.ceil(tab.count / _ps) - 1
                        );
                        tab.pageStartInput = tab.pageStart;
                    });
                };

                $scope.navigateToStartRow = function (tab) {
                    var ps = 20;
                    var val = parseInt(tab.pageStartInput, 10);
                    if (isNaN(val) || val < 1) val = 1;
                    if (val > tab.count) val = Math.max(1, tab.count);
                    var page = Math.floor((val - 1) / ps);
                    tab.pageStartInput = page * ps + 1;
                    if (page !== tab.page) {
                        $scope.loadRelatedTabData(tab, page);
                    }
                };

                $scope.relatedRecordUrl = function (table, sysId) {
                    return (
                        '/nav_to.do?uri=' +
                        encodeURIComponent(table + '.do?sys_id=' + sysId)
                    );
                };

                ////////////////////////////////////////////////////////////
                // Unlink Provider
                ////////////////////////////////////////////////////////////
                $scope.pendingUnlinkProvider = null;

                $scope.unlinkProviderFromDropdown = function (p) {
                    $scope.openDropdown = null;
                    $scope.pendingUnlinkProvider = {
                        sys_id: p.sys_id,
                        name: p.name,
                    };
                };

                $scope.unlinkExtraPane = function (item) {
                    $scope.pendingUnlinkProvider = {
                        sys_id: item.sys_id,
                        name: item.recordId,
                    };
                };

                $scope.cancelUnlinkProvider = function () {
                    $scope.pendingUnlinkProvider = null;
                };

                $scope.confirmUnlinkProvider = function () {
                    var pending = $scope.pendingUnlinkProvider;
                    if (!pending || pending.unlinking) {
                        return;
                    }
                    pending.unlinking = true;
                    ajax('unlinkProvider', {
                        sys_id: SYS_ID,
                        provider_sys_id: pending.sys_id,
                    }).then(function (d) {
                        pending.unlinking = false;
                        $scope.pendingUnlinkProvider = null;
                        if (!d.success) {
                            $window.alert(d.error || 'Unlink failed');
                            return;
                        }
                        // Remove from providers list
                        $scope.providers = $scope.providers.filter(
                            function (p) {
                                return p.sys_id !== pending.sys_id;
                            }
                        );
                        // Close the open pane for this provider, if any
                        var idx = extraPanes.findIndex(function (e) {
                            return e.sys_id === pending.sys_id;
                        });
                        if (idx !== -1) {
                            extraPanes.splice(idx, 1);
                        }
                        buildVisibleItems();
                    });
                };

                function saveExtraPane(pane, onSuccess) {
                    if (pane.recordType === 'script_include') {
                        if (pane.readOnly) {
                            return;
                        }
                        var editor = monacoEditors[pane.key];
                        var value = editor
                            ? editor.getValue()
                            : pane.content || '';
                        pane._pendingSaveContent = value;
                        ajax('saveScriptInclude', {
                            sys_id: pane.sys_id,
                            data: JSON.stringify({ script: value }),
                        }).then(function (res) {
                            if (!res.success) {
                                delete pane._pendingSaveContent;
                                return;
                            }
                            pane.lastServerContent = value;
                            delete pane._pendingSaveContent;
                            pane.dirty = false;
                            if (!hasUnsavedChanges()) {
                                pane.savedAt = null;
                                $scope.lastSaveTime = new Date();
                            } else {
                                pane.savedAt = new Date();
                            }
                            if (onSuccess) {
                                onSuccess();
                            }
                        });
                        return;
                    }
                    if (!pane.recordId || !pane.recordId.trim()) {
                        pane.idError = 'An ID is required';
                        return;
                    }
                    if (pane.idError || pane.idChecking) {
                        return;
                    }
                    var editor = monacoEditors[pane.key];
                    var value = editor ? editor.getValue() : pane.content || '';
                    var isTemplate = pane.recordType === 'template';
                    var dataObj = {
                        sys_id: pane.sys_id,
                    };
                    if (isTemplate) {
                        dataObj.id = pane.recordId;
                    } else {
                        dataObj.name = pane.recordId;
                        dataObj.type = pane.providerType || '';
                    }
                    dataObj[isTemplate ? 'template' : 'script'] = value;
                    pane._pendingSaveContent = value;

                    ajax(isTemplate ? 'saveTemplate' : 'saveProvider', {
                        sys_id: SYS_ID,
                        data: JSON.stringify(dataObj),
                    }).then(function (res) {
                        if (!res.success) {
                            delete pane._pendingSaveContent;
                            return;
                        }
                        pane.sys_id = res.sys_id;
                        startPanePresence(pane); // subscribe now that the record exists
                        startPaneRecordWatcher(pane); // watch for external changes
                        pane.lastServerContent = value;
                        delete pane._pendingSaveContent;
                        pane.dirty = false;
                        pane.idDirty = false;
                        if (!hasUnsavedChanges()) {
                            pane.savedAt = null;
                            $scope.lastSaveTime = new Date();
                        } else {
                            pane.savedAt = new Date();
                        }
                        var action = isTemplate
                            ? 'getTemplates'
                            : 'getProviders';
                        ajax(action, { sys_id: SYS_ID }).then(function (d) {
                            if (d.success) {
                                if (isTemplate) {
                                    $scope.templates = d.templates;
                                } else {
                                    $scope.providers = d.providers;
                                }
                            }
                        });
                        if (onSuccess) {
                            onSuccess();
                        }
                    });
                }

                ////////////////////////////////////////////////////////////
                // Close extra pane
                ////////////////////////////////////////////////////////////
                $scope.pendingClosePane = null;

                $scope.closePane = function (pane) {
                    stopPanePresence(pane);
                    stopPaneRecordWatcher(pane);
                    var idx = extraPanes.indexOf(pane);
                    if (idx !== -1) {
                        extraPanes.splice(idx, 1);
                    }
                    disposeEditor(pane.key);
                    _clearPaneWidths();
                    buildVisibleItems();
                };

                $scope.cancelClosePane = function () {
                    $scope.pendingClosePane = null;
                };

                $scope.discardAndClosePane = function () {
                    var pane = $scope.pendingClosePane;
                    $scope.pendingClosePane = null;
                    $scope.closePane(pane);
                };

                $scope.saveAndClosePane = function () {
                    var pane = $scope.pendingClosePane;
                    $scope.pendingClosePane = null;
                    saveExtraPane(pane, function () {
                        $scope.closePane(pane);
                    });
                };

                // Unified close handler for all pane types
                $scope.closePaneItem = function (item) {
                    if (item.closeable) {
                        if (item.dirty || item.idDirty) {
                            $scope.pendingClosePane = item;
                        } else {
                            $scope.closePane(item);
                        }
                    } else {
                        var def = $scope.coreEditorDefs.filter(function (d) {
                            return d.key === item.key;
                        })[0];
                        if (def) {
                            def.visible = false;
                            applyVisibility();
                        }
                    }
                };

                ////////////////////////////////////////////////////////////
                // Versions diff tab
                ////////////////////////////////////////////////////////////
                $scope.formatVersionDate = function (snDate, includeSeconds) {
                    if (!snDate) {
                        return '';
                    }
                    try {
                        var options = {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                        };

                        // Conditionally add seconds to the options object
                        if (includeSeconds) {
                            options.second = '2-digit';
                        }

                        // SN returns UTC dates without a timezone suffix — append T and Z
                        return new Date(
                            snDate.replace(' ', 'T') + 'Z'
                        ).toLocaleString(undefined, options);
                    } catch (e) {
                        return snDate;
                    }
                };

                $scope.openVersionDiff = function (version) {
                    $scope.openDropdown = null;
                    var widgetSysId = $scope.widget && $scope.widget.sys_id;
                    if (!widgetSysId || !version.sys_id) {
                        return;
                    }

                    var params = {
                        table: 'sp_widget',
                        record_id: widgetSysId,
                        version_1: version.sys_id,
                    };
                    var rawUrl = _diffNavUrl(params);
                    var $sce = $injector.get('$sce');
                    var label =
                        $scope.formatVersionDate(version.sys_created_on) +
                        (version.sys_created_by
                            ? ' \\u2014 ' + version.sys_created_by
                            : '');
                    $scope.versionDiffModal.rawUrl = rawUrl;
                    $scope.versionDiffModal.url = $sce.trustAsResourceUrl(
                        _diffIframeUrl(
                            angular.extend({}, params, { da_iframe: 'true' })
                        )
                    );
                    $scope.versionDiffModal.label = label;
                    $scope.versionDiffModal.isUnsaved = false;
                    $scope.versionDiffModal.open = true;
                };

                $scope.closeVersionDiffModal = function () {
                    _closeModal(function () {
                        $scope.versionDiffModal.open = false;
                        $scope.versionDiffModal.url = null;
                        $scope.versionDiffModal.expandedField = null;
                        $scope.versionDiffModal.isUnsaved = false;
                    });
                };

                $scope.openVersionDiffInNewTab = function () {
                    $window.open($scope.versionDiffModal.rawUrl, '_blank');
                    $scope.closeVersionDiffModal();
                };

                $scope.collapseDiffEditor = function () {
                    var iframe = document.querySelector('.we-diff-iframe');
                    if (iframe && iframe.contentWindow) {
                        iframe.contentWindow.postMessage(
                            { type: 'we-diff-collapse' },
                            '*'
                        );
                    }
                };

                // Listen for expand/collapse notifications from the diff iframe
                window.addEventListener('message', function (e) {
                    if (!e.data || e.data.type !== 'we-diff-expand') {
                        return;
                    }
                    $scope.$apply(function () {
                        $scope.versionDiffModal.expandedField =
                            e.data.fieldLabel || null;
                    });
                });

                // Opens the diff page to compare unsaved changes vs current saved state.
                // No version_id in the URL — the diff page detects the unsaved opener snap
                // and shows left = current saved, right = unsaved.
                $scope.openUnsavedDiff = function () {
                    $scope.openDropdown = null;
                    var wSysId = $scope.widget && $scope.widget.sys_id;
                    if (!wSysId) {
                        return;
                    }

                    var snap = {
                        name: $scope.widget.name || '',
                        id: $scope.widget.id || '',
                        description: $scope.widget.description || '',
                        is_public: !!$scope.widget.is_public,
                        roles: $scope.rolesList.join(','),
                        template: '',
                        css: '',
                        client_script: '',
                        script: '',
                        link: '',
                    };
                    $scope.coreEditorDefs.forEach(function (def) {
                        snap[def.field] = monacoEditors[def.key]
                            ? monacoEditors[def.key].getValue()
                            : $scope.widget[def.field] || '';
                    });
                    snap._unsaved = true;
                    snap.sys_updated_on = $scope.widget.sys_updated_on || '';
                    snap.sys_updated_by = $scope.widget.sys_updated_by || '';

                    var snapToken =
                        Date.now() + '_' + Math.random().toString(36).slice(2);
                    try {
                        localStorage.setItem(
                            '_weDiffSnap_' + snapToken,
                            JSON.stringify(snap)
                        );
                    } catch (e) {}

                    var params = {
                        table: 'sp_widget',
                        record_id: wSysId,
                        da_token: snapToken,
                    };
                    var rawUrl = _diffNavUrl(params);
                    var $sce = $injector.get('$sce');
                    $scope.versionDiffModal.rawUrl = rawUrl;
                    $scope.versionDiffModal.url = $sce.trustAsResourceUrl(
                        _diffIframeUrl(
                            angular.extend({}, params, { da_iframe: 'true' })
                        )
                    );
                    $scope.versionDiffModal.label = 'Unsaved changes';
                    $scope.versionDiffModal.isUnsaved = true;
                    $scope.versionDiffModal.open = true;
                };

                // Opens the diff page for an external-change alert on a pane.
                // Shows the user's current (unsaved) editor state vs the server's updated saved state.
                $scope.openExternalChangeDiff = function (item) {
                    if (!item.externalChange) {
                        return;
                    }
                    $scope.openUnsavedDiff();
                };

                // Replaces editor contents with the externally-saved server value and clears the warning.
                $scope.applyExternalChange = function (item) {
                    if (!item.externalChange) {
                        return;
                    }
                    var serverVal = item.externalChange.serverVal || '';
                    var editor = monacoEditors[item.key];
                    if (editor) {
                        editor.setValue(serverVal);
                    }
                    if (item.field) {
                        originalValues[item.field] = serverVal;
                        lastServerValues[item.field] = serverVal;
                        $scope.widget[item.field] = serverVal;
                    } else {
                        item.lastServerContent = serverVal;
                    }
                    item.dirty = false;
                    item.externalChange = null;
                };

                ////////////////////////////////////////////////////////////
                // Roles
                ////////////////////////////////////////////////////////////
                function parseRoles(str) {
                    return (str || '')
                        .split(',')
                        .map(function (r) {
                            return r.trim();
                        })
                        .filter(Boolean);
                }

                function _normaliseExtraWidgetFieldValue(fieldDef, value) {
                    if (fieldDef && fieldDef.type === 'boolean') {
                        return !!value;
                    }
                    return value || '';
                }

                function _setAdditionalWidgetFields(defs) {
                    $scope.additionalWidgetFields = Array.isArray(defs)
                        ? defs.filter(function (def) {
                              return def && def.name;
                          })
                        : [];
                }

                function _applyAdditionalWidgetFieldDefaults() {
                    ($scope.additionalWidgetFields || []).forEach(function (
                        fieldDef
                    ) {
                        if ($scope.widget[fieldDef.name] !== undefined) {
                            return;
                        }
                        $scope.widget[fieldDef.name] =
                            fieldDef.type === 'boolean' ? false : '';
                    });
                }

                function _captureAdditionalHeaderValues(source) {
                    ($scope.additionalWidgetFields || []).forEach(function (
                        fieldDef
                    ) {
                        originalHeader[fieldDef.name] =
                            _normaliseExtraWidgetFieldValue(
                                fieldDef,
                                source[fieldDef.name]
                            );
                    });
                }

                $scope.onPublicChange = function () {
                    // Roles are cleared on Save if is_public is true — not immediately
                };

                ////////////////////////////////////////////////////////////
                // Dropdown management
                ////////////////////////////////////////////////////////////
                $scope.toggleDropdown = function (name) {
                    $scope.openDropdown =
                        $scope.openDropdown === name ? null : name;
                    if (name !== 'compactMenu') {
                        $scope.openCompactSubmenu = null;
                    }
                };

                $scope.toggleCompactSubmenu = function (key) {
                    $scope.openCompactSubmenu =
                        $scope.openCompactSubmenu === key ? null : key;
                };

                function _isKeyboardActivatableElement(el) {
                    if (!el || !el.closest) {
                        return false;
                    }
                    var target = el.closest(
                        '.we-dropdown-item, .we-compact-submenu-trigger'
                    );
                    if (!target) {
                        return false;
                    }
                    if (
                        target.classList.contains('disabled') ||
                        target.getAttribute('aria-disabled') === 'true'
                    ) {
                        return false;
                    }
                    return true;
                }

                function _getMenuKeyboardItems(container) {
                    if (!container || !container.querySelectorAll) {
                        return [];
                    }
                    return Array.prototype.filter.call(
                        container.querySelectorAll(
                            '.we-dropdown-item, .we-compact-submenu-trigger'
                        ),
                        function (el) {
                            if (el.classList.contains('disabled')) {
                                return false;
                            }
                            return !!el.offsetParent;
                        }
                    );
                }

                function _prepareDropdownKeyboardItems() {
                    var roots = document.querySelectorAll(
                        '.we-dropdown-menu, .we-popover'
                    );
                    Array.prototype.forEach.call(roots, function (root) {
                        Array.prototype.forEach.call(
                            root.querySelectorAll(
                                '.we-dropdown-item, .we-compact-submenu-trigger'
                            ),
                            function (el) {
                                // Menu options are arrow-key navigable; keep them out of Tab order.
                                el.setAttribute('tabindex', '-1');
                                if (!el.hasAttribute('role')) {
                                    el.setAttribute('role', 'button');
                                }
                            }
                        );
                    });
                }

                function _getDropdownTriggersInOrder() {
                    return Array.prototype.filter.call(
                        document.querySelectorAll('[ng-click*="toggleDropdown("]'),
                        function (el) {
                            if (!el.offsetParent) {
                                return false;
                            }
                            if (el.disabled || el.getAttribute('aria-disabled') === 'true') {
                                return false;
                            }
                            return true;
                        }
                    );
                }

                function _getDropdownNameFromTrigger(el) {
                    if (!el || !el.getAttribute) {
                        return null;
                    }
                    var clickExpr = el.getAttribute('ng-click') || '';
                    var match = /toggleDropdown\\('([^']+)'\\)/.exec(clickExpr);
                    return match && match[1] ? match[1] : null;
                }

                function _focusSiblingDropdownTrigger(backward) {
                    var triggers = _getDropdownTriggersInOrder();
                    if (!triggers.length) {
                        return;
                    }

                    var currentIdx = -1;
                    if ($scope.openDropdown) {
                        for (var i = 0; i < triggers.length; i++) {
                            if (
                                _getDropdownNameFromTrigger(triggers[i]) ===
                                $scope.openDropdown
                            ) {
                                currentIdx = i;
                                break;
                            }
                        }
                    }

                    if (currentIdx < 0) {
                        currentIdx = triggers.indexOf(document.activeElement);
                    }
                    if (currentIdx < 0) {
                        currentIdx = 0;
                    }

                    var nextIdx;
                    if (backward) {
                        nextIdx =
                            currentIdx === 0
                                ? triggers.length - 1
                                : currentIdx - 1;
                    } else {
                        nextIdx =
                            currentIdx === triggers.length - 1
                                ? 0
                                : currentIdx + 1;
                    }

                    var next = triggers[nextIdx];
                    if (next && next.focus) {
                        next.focus();
                    }
                }

                function _isOpenDropdownTriggerElement(el) {
                    if (!el || !el.closest || !$scope.openDropdown) {
                        return false;
                    }
                    var trigger = el.closest('[ng-click*="toggleDropdown("]');
                    if (!trigger) {
                        return false;
                    }
                    return (
                        _getDropdownNameFromTrigger(trigger) ===
                        $scope.openDropdown
                    );
                }

                function _closeOpenModalOnEscape() {
                    if ($scope._modalClosing) {
                        return true;
                    }

                    if ($scope.showReloadConfirm) {
                        $scope.showReloadConfirm = false;
                        return true;
                    }
                    if ($scope.showKeyboardShortcutsModal) {
                        $scope.closeKeyboardShortcutsModal();
                        return true;
                    }
                    if ($scope.pendingNewWidget) {
                        $scope.cancelNewWidget();
                        return true;
                    }
                    if ($scope.pendingWidgetNav) {
                        $scope.cancelWidgetNav();
                        return true;
                    }
                    if ($scope.pendingClosePane) {
                        $scope.cancelClosePane();
                        return true;
                    }
                    if ($scope.pendingUnlinkProvider) {
                        $scope.cancelUnlinkProvider();
                        return true;
                    }
                    if ($scope.pendingDeletePane) {
                        $scope.cancelDeletePane();
                        return true;
                    }
                    if ($scope.showWidgetPickerModal && !$scope.showPicker) {
                        $scope.closeWidgetPickerModal();
                        return true;
                    }
                    if ($scope.relatedModal && $scope.relatedModal.open) {
                        $scope.closeRelatedModal();
                        return true;
                    }
                    if ($scope.versionDiffModal && $scope.versionDiffModal.open) {
                        $scope.closeVersionDiffModal();
                        return true;
                    }
                    if ($scope.showXmlModal) {
                        $scope.closeXmlModal();
                        return true;
                    }
                    if ($scope.showOptionSchemaModal) {
                        $scope.closeOptionSchemaModal();
                        return true;
                    }
                    if ($scope.showDemoDataModal) {
                        $scope.closeDemoDataModal();
                        return true;
                    }
                    if ($scope.showLinkProviderModal) {
                        $scope.cancelLinkProviderModal();
                        return true;
                    }
                    if ($scope.pendingUnlinkDependency) {
                        $scope.cancelUnlinkDependency();
                        return true;
                    }
                    if ($scope.showLinkDependencyModal) {
                        $scope.cancelLinkDependencyModal();
                        return true;
                    }
                    if ($scope.showUserPrefsModal) {
                        $scope.cancelUserPrefsModal();
                        return true;
                    }

                    return false;
                }

                function _safeApply(fn) {
                    if ($scope.$$phase) {
                        fn();
                        return;
                    }
                    $scope.$apply(fn);
                }

                $scope.onDropdownTriggerKeydown = function (event, name) {
                    var key = event && event.key;
                    var keyCode = event && event.keyCode;
                    if (key === 'Escape' || keyCode === 27) {
                        event.preventDefault();
                        $scope.openDropdown = null;
                        $scope.openCompactSubmenu = null;
                        return;
                    }

                    if (
                        key !== 'Enter' &&
                        key !== ' ' &&
                        key !== 'Spacebar' &&
                        key !== 'ArrowDown' &&
                        keyCode !== 13 &&
                        keyCode !== 32 &&
                        keyCode !== 40
                    ) {
                        return;
                    }

                    event.preventDefault();
                    $scope.openDropdown = name;
                    if (name !== 'compactMenu') {
                        $scope.openCompactSubmenu = null;
                    }
                    $timeout(function () {
                        _prepareDropdownKeyboardItems();
                        var openMenu = document.querySelector(
                            '.we-dropdown-menu:not(.ng-hide), .we-popover:not(.ng-hide)'
                        );
                        if (!openMenu) {
                            return;
                        }
                        var items = _getMenuKeyboardItems(openMenu);
                        if (items.length) {
                            items[0].focus();
                        }
                    }, 0);
                };

                $scope.$watch('openDropdown', function (newVal) {
                    if (!newVal) {
                        return;
                    }
                    $timeout(function () {
                        _prepareDropdownKeyboardItems();
                    }, 0);
                });

                $scope.$watch('openCompactSubmenu', function (newVal) {
                    if (!newVal) {
                        return;
                    }
                    $timeout(function () {
                        _prepareDropdownKeyboardItems();
                    }, 0);
                });

                document.addEventListener('click', function (e) {
                    if (
                        !e.target.closest ||
                        (!e.target.closest('.we-dropdown') &&
                            !e.target.closest('.we-autocomplete') &&
                            !e.target.closest('.we-popover') &&
                            !e.target.closest('.select2-container') &&
                            !e.target.closest('.select2-dropdown') &&
                            !e.target.closest('.select2-drop'))
                    ) {
                        $scope.$apply(function () {
                            $scope.openDropdown = null;
                            $scope.openCompactSubmenu = null;
                        });
                    }
                });

                document.addEventListener('keydown', function (e) {
                    var key = e && e.key;
                    var keyCode = e && e.keyCode;
                    var isArrowDown = key === 'ArrowDown' || keyCode === 40;
                    var isArrowUp = key === 'ArrowUp' || keyCode === 38;

                    if (key === 'Escape' || keyCode === 27) {
                        var closedModal = false;
                        _safeApply(function () {
                            closedModal = _closeOpenModalOnEscape();
                        });
                        if (closedModal) {
                            e.preventDefault();
                            return;
                        }
                    }

                    if ((key === 'Tab' || keyCode === 9) && $scope.openDropdown) {
                        // Preserve native Tab/Shift+Tab order; close the menu after
                        // the browser has moved focus to the next focusable element.
                        setTimeout(function () {
                            _safeApply(function () {
                                $scope.openDropdown = null;
                                $scope.openCompactSubmenu = null;
                            });
                        }, 0);
                        return;
                    }

                    if ((key === 'Escape' || keyCode === 27) && $scope.openDropdown) {
                        e.preventDefault();
                        _safeApply(function () {
                            $scope.openDropdown = null;
                            $scope.openCompactSubmenu = null;
                        });
                        return;
                    }

                    if (!e.target || !e.target.closest) {
                        return;
                    }

                    var menuContainer = e.target.closest(
                        '.we-dropdown-menu, .we-popover'
                    );
                    if (!menuContainer) {
                        if (
                            !$scope.openDropdown ||
                            (!isArrowDown && !isArrowUp) ||
                            !_isOpenDropdownTriggerElement(e.target)
                        ) {
                            return;
                        }

                        var openMenu = document.querySelector(
                            '.we-dropdown-menu:not(.ng-hide), .we-popover:not(.ng-hide)'
                        );
                        var openItems = _getMenuKeyboardItems(openMenu);
                        if (!openItems.length) {
                            return;
                        }

                        e.preventDefault();
                        var focusIdx = isArrowDown ? 0 : openItems.length - 1;
                        if (openItems[focusIdx] && openItems[focusIdx].focus) {
                            openItems[focusIdx].focus();
                        }
                        return;
                    }

                    if (isArrowDown || isArrowUp) {
                        var items = _getMenuKeyboardItems(menuContainer);
                        if (!items.length) {
                            return;
                        }
                        e.preventDefault();
                        var current = e.target.closest(
                            '.we-dropdown-item, .we-compact-submenu-trigger'
                        );
                        var currentIdx = items.indexOf(current);
                        if (currentIdx < 0) {
                            items[0].focus();
                            return;
                        }
                        var nextIdx = isArrowDown
                            ? Math.min(currentIdx + 1, items.length - 1)
                            : Math.max(currentIdx - 1, 0);
                        if (items[nextIdx] && items[nextIdx].focus) {
                            items[nextIdx].focus();
                        }
                        return;
                    }

                    var isEnter = key === 'Enter' || keyCode === 13;
                    var isSpace =
                        key === ' ' || key === 'Spacebar' || keyCode === 32;
                    if (!isEnter && !isSpace) {
                        return;
                    }

                    if (
                        e.target.closest(
                            'a, button, input, select, textarea, .select2-container, .select2-dropdown'
                        )
                    ) {
                        return;
                    }

                    if (!_isKeyboardActivatableElement(e.target)) {
                        return;
                    }

                    e.preventDefault();
                    var target = e.target.closest(
                        '.we-dropdown-item, .we-compact-submenu-trigger'
                    );
                    if (target && target.click) {
                        target.click();
                    }
                });

                ////////////////////////////////////////////////////////////
                // Unsaved changes guard
                ////////////////////////////////////////////////////////////
                function hasUnsavedChanges() {
                    if (
                        $scope.isNewWidget &&
                        ($scope.widget.name ||
                            $scope.widget.id ||
                            $scope.widget.description)
                    ) {
                        return true;
                    }

                    var hasHeaderChanges =
                        !!$scope.headerDirty.name ||
                        !!$scope.headerDirty.id ||
                        !!$scope.headerDirty.description ||
                        !!$scope.headerDirty.controller_as ||
                        !!$scope.headerDirty.is_public ||
                        !!$scope.headerDirty.roles ||
                        !!$scope.headerDirty.static ||
                        ($scope.additionalWidgetFields || []).some(function (
                            fieldDef
                        ) {
                            return !!$scope.headerDirty[fieldDef.name];
                        });

                    return (
                        hasHeaderChanges ||
                        $scope.visibleItems.some(function (item) {
                            return (
                                item.type === 'pane' &&
                                (item.dirty || item.idDirty)
                            );
                        }) ||
                        $scope.coreEditorDefs.some(function (def) {
                            var ed = monacoEditors[def.key];
                            return (
                                ed &&
                                ed.getValue() !== originalValues[def.field]
                            );
                        })
                    );
                }

                $scope.hasUnsavedChanges = hasUnsavedChanges;

                $scope.openInPlatform = function () {
                    window.open(
                        '/nav_to.do?uri=' +
                            encodeURIComponent('sp_widget.do?sys_id=' + SYS_ID),
                        '_blank'
                    );
                    $scope.openDropdown = null;
                };

                $scope.cloneWidget = function () {
                    if ($scope.isNewWidget) {
                        return;
                    }
                    $scope.openDropdown = null;
                    ajax('cloneWidget', { sys_id: SYS_ID }).then(
                        function (data) {
                            if (!data.success) {
                                $scope.saveError = data.error || 'Clone failed';
                                return;
                            }
                            window.location.href = buildWidgetEditorUrl(
                                data.sys_id
                            );
                        }
                    );
                };

                $scope.switchToWidgetScope = function () {
                    var scopeId = $scope.widget.application_sys_id;
                    $http({
                        method: 'PUT',
                        url: '/api/now/ui/concoursepicker/application',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-UserToken': window.g_ck || '',
                        },
                        data: { app_id: scopeId },
                    }).then(
                        function () {
                            window.location.reload();
                        },
                        function () {
                            $scope.saveError = 'Scope switch failed.';
                        }
                    );
                };

                $scope.openExtraPaneInPlatform = function (item) {
                    var table =
                        item.recordType === 'template'
                            ? 'sp_ng_template'
                            : item.recordType === 'script_include'
                              ? 'sys_script_include'
                              : 'sp_angular_provider';
                    window.open(
                        '/nav_to.do?uri=' +
                            encodeURIComponent(
                                table + '.do?sys_id=' + item.sys_id
                            ),
                        '_blank'
                    );
                };

                $scope.openScriptDebugger = function () {
                    window.top.launchScriptDebugger();
                };

                $scope.formatDocument = function (item) {
                    var edWrapper = monacoEditors[item.key];
                    if (!edWrapper || !edWrapper.format) {
                        return;
                    }
                    edWrapper.format($scope.userPrefs.formatTabsToSpaces);
                };

                // Detect which monospace fonts are available on the user's system using
                // a canvas width-measurement trick (no DOM insertion required).
                function _getAvailableMonospaceFonts() {
                    var ua = navigator.userAgent.toLowerCase();
                    var os = 'unknown';
                    if (ua.indexOf('win') !== -1) {
                        os = 'windows';
                    } else if (ua.indexOf('mac') !== -1) {
                        os = 'macos';
                    } else if (ua.indexOf('linux') !== -1) {
                        os = 'linux';
                    }

                    var fontStacks = {
                        windows: [
                            'Consolas',
                            'Cascadia Mono',
                            'Cascadia Code',
                            'Lucida Console',
                            'Courier New',
                            'Fixedsys',
                        ],
                        macos: [
                            'SF Mono',
                            'Menlo',
                            'Monaco',
                            'Andale Mono',
                            'Courier',
                        ],
                        linux: [
                            'Ubuntu Mono',
                            'Liberation Mono',
                            'DejaVu Sans Mono',
                            'Hack',
                            'Fira Mono',
                            'FreeMono',
                        ],
                        unknown: ['Consolas', 'Menlo', 'Monaco', 'Courier New'],
                    };

                    var fontsToTest = fontStacks[os];
                    var canvas = document.createElement('canvas');
                    var ctx = canvas.getContext('2d');
                    var testString = 'mmmmmmmmmmllllliiii';
                    var baseSize = '72px';

                    ctx.font = baseSize + ' sans-serif';
                    var baselineWidth = ctx.measureText(testString).width;

                    var available = fontsToTest.filter(function (font) {
                        ctx.font = baseSize + ' "' + font + '", sans-serif';
                        return (
                            ctx.measureText(testString).width !== baselineWidth
                        );
                    });

                    if (available.indexOf('monospace') === -1) {
                        available.push('monospace');
                    }
                    return available;
                }

                // Build a CSS font-family string for Monaco with appropriate fallbacks.
                function _buildFontFamily(name) {
                    if (!name) {
                        return 'Menlo, Monaco, "Courier New", monospace';
                    }
                    return '"' + name + '", "Courier New", monospace';
                }

                var _GOOGLE_FONTS = [
                    'Fira Code',
                    'JetBrains Mono',
                    'Source Code Pro',
                    'Roboto Mono',
                    'IBM Plex Mono',
                ];
                var _googleFontsLoaded = false;

                function _loadGoogleFonts() {
                    if (_googleFontsLoaded) {
                        return;
                    }
                    _googleFontsLoaded = true;
                    var link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href =
                        'https://fonts.googleapis.com/css2?family=Fira+Code&family=JetBrains+Mono&family=Source+Code+Pro&family=Roboto+Mono&family=IBM+Plex+Mono&display=swap';
                    document.head.appendChild(link);
                }

                $scope.openUserPrefsModal = function () {
                    _loadGoogleFonts();
                    var _savedOrder = $scope.userPrefs.editorOrder;
                    var _savedVis = $scope.userPrefs.editorVisibility;
                    var _editorKeys = _savedOrder.length
                        ? _savedOrder.concat(
                            $scope.coreEditorDefs
                                .map(function (d) { return d.key; })
                                .filter(function (k) { return _savedOrder.indexOf(k) === -1; })
                          )
                        : $scope.coreEditorDefs.map(function (d) { return d.key; });
                    $scope.userPrefsEdit = {
                        editors: _editorKeys.map(function (key) {
                            var def = $scope.coreEditorDefs.filter(function (d) { return d.key === key; })[0];
                            return {
                                key: key,
                                label: def ? def.label : key,
                                visible: _savedVis.hasOwnProperty(key) ? _savedVis[key] : (def ? def.visible : true),
                            };
                        }),
                        formatTabsToSpaces: $scope.userPrefs.formatTabsToSpaces,
                        wordWrap: $scope.userPrefs.wordWrap,
                        editorTheme: $scope.userPrefs.editorTheme,
                        minimap: $scope.userPrefs.minimap,
                        alwaysShowLink: $scope.userPrefs.alwaysShowLink,
                        realtimeWidgetUpdates:
                            $scope.userPrefs.realtimeWidgetUpdates,
                        autoIndent: $scope.userPrefs.autoIndent,
                        formatOnPaste: $scope.userPrefs.formatOnPaste,
                        formatOnType: $scope.userPrefs.formatOnType,
                        fontSize: $scope.userPrefs.fontSize,
                        fontFamily: $scope.userPrefs.fontFamily,
                        languageHelpers: $scope.userPrefs.languageHelpers,
                        showUnusedVars: $scope.userPrefs.showUnusedVars,
                        stickyScroll: $scope.userPrefs.stickyScroll,
                        htmlValidation: $scope.userPrefs.htmlValidation,
                        htmlAutoCloseTags: $scope.userPrefs.htmlAutoCloseTags,
                        autoSurround: $scope.userPrefs.autoSurround,
                        autoClosingBrackets: $scope.userPrefs.autoClosingBrackets,
                        autoClosingQuotes: $scope.userPrefs.autoClosingQuotes,
                        linkedEditing: $scope.userPrefs.linkedEditing,
                        insertSpaceBeforeFuncParen:
                            $scope.userPrefs.insertSpaceBeforeFuncParen,
                        tabSize: $scope.userPrefs.tabSize,
                        remBase: $scope.userPrefs.remBase,
                        ctrlSSaveActiveOnly:
                            $scope.userPrefs.ctrlSSaveActiveOnly,
                        flashOnEditorOpen:
                            $scope.userPrefs.flashOnEditorOpen,
                        showOpenInVsCode:
                            $scope.userPrefs.showOpenInVsCode !== false,
                        availableFonts: _getAvailableMonospaceFonts(),
                        googleFonts: _GOOGLE_FONTS,
                    };
                    $scope.showUserPrefsModal = true;
                    $scope.openDropdown = null;
                };

                $scope.saveUserPrefsModal = function () {
                    // Apply order and visibility from modal back to coreEditorDefs
                    var orderedDefs = [];
                    $scope.userPrefsEdit.editors.forEach(function (e) {
                        for (var i = 0; i < $scope.coreEditorDefs.length; i++) {
                            if ($scope.coreEditorDefs[i].key === e.key) {
                                $scope.coreEditorDefs[i].visible = e.visible;
                                orderedDefs.push($scope.coreEditorDefs[i]);
                                break;
                            }
                        }
                    });
                    $scope.coreEditorDefs.length = 0;
                    orderedDefs.forEach(function (d) {
                        $scope.coreEditorDefs.push(d);
                    });
                    $scope.userPrefs.formatTabsToSpaces =
                        $scope.userPrefsEdit.formatTabsToSpaces;
                    $scope.userPrefs.wordWrap = $scope.userPrefsEdit.wordWrap;
                    $scope.userPrefs.editorTheme =
                        $scope.userPrefsEdit.editorTheme;
                    $scope.userPrefs.minimap = $scope.userPrefsEdit.minimap;
                    $scope.userPrefs.alwaysShowLink =
                        $scope.userPrefsEdit.alwaysShowLink;
                    $scope.userPrefs.realtimeWidgetUpdates =
                        $scope.userPrefsEdit.realtimeWidgetUpdates;
                    $scope.userPrefs.autoIndent =
                        $scope.userPrefsEdit.autoIndent;
                    $scope.userPrefs.formatOnPaste =
                        $scope.userPrefsEdit.formatOnPaste;
                    $scope.userPrefs.formatOnType =
                        $scope.userPrefsEdit.formatOnType;
                    $scope.userPrefs.fontSize = $scope.userPrefsEdit.fontSize;
                    $scope.userPrefs.fontFamily =
                        $scope.userPrefsEdit.fontFamily || '';
                    $scope.userPrefs.languageHelpers =
                        $scope.userPrefsEdit.languageHelpers;
                    $scope.userPrefs.showUnusedVars =
                        !!$scope.userPrefsEdit.showUnusedVars;
                    $scope.userPrefs.stickyScroll =
                        !!$scope.userPrefsEdit.stickyScroll;
                    $scope.userPrefs.htmlValidation =
                        !!$scope.userPrefsEdit.htmlValidation;
                    $scope.userPrefs.htmlAutoCloseTags =
                        !!$scope.userPrefsEdit.htmlAutoCloseTags;
                    $scope.userPrefs.autoSurround =
                        $scope.userPrefsEdit.autoSurround;
                    $scope.userPrefs.autoClosingBrackets =
                        $scope.userPrefsEdit.autoClosingBrackets;
                    $scope.userPrefs.autoClosingQuotes =
                        $scope.userPrefsEdit.autoClosingQuotes;
                    $scope.userPrefs.linkedEditing =
                        !!$scope.userPrefsEdit.linkedEditing;
                    $scope.userPrefs.insertSpaceBeforeFuncParen =
                        !!$scope.userPrefsEdit.insertSpaceBeforeFuncParen;
                    $scope.userPrefs.ctrlSSaveActiveOnly =
                        !!$scope.userPrefsEdit.ctrlSSaveActiveOnly;
                    $scope.userPrefs.flashOnEditorOpen =
                        !!$scope.userPrefsEdit.flashOnEditorOpen;
                    $scope.userPrefs.showOpenInVsCode =
                        !!$scope.userPrefsEdit.showOpenInVsCode;
                    var ts = parseInt($scope.userPrefsEdit.tabSize, 10);
                    if (ts >= 1 && ts <= 8) {
                        $scope.userPrefs.tabSize = ts;
                    }
                    var rb = parseFloat($scope.userPrefsEdit.remBase);
                    if (rb > 0) {
                        $scope.userPrefs.remBase = rb;
                    }
                    var wrapVal = $scope.userPrefs.wordWrap ? 'on' : 'off';
                    var minimapVal = { enabled: !!$scope.userPrefs.minimap };
                    var autoIndentVal = $scope.userPrefs.autoIndent
                        ? 'full'
                        : 'none';
                    var formatOnPasteVal = !!$scope.userPrefs.formatOnPaste;
                    var formatOnTypeVal = !!$scope.userPrefs.formatOnType;
                    var fontSizeVal = $scope.userPrefs.fontSize;
                    var fontFamilyVal = _buildFontFamily(
                        $scope.userPrefs.fontFamily
                    );
                    var langHelpersEnabled = !!$scope.userPrefs.languageHelpers;
                    if (window.SNMonacoPlus && SNMonacoPlus.setUnusedVarsEnabled) {
                        SNMonacoPlus.setUnusedVarsEnabled($scope.userPrefs.showUnusedVars);
                    }
                    var stickyScrollVal = {
                        enabled: !!$scope.userPrefs.stickyScroll,
                    };
                    var tabSizeVal = $scope.userPrefs.tabSize;
                    var autoSurroundVal = $scope.userPrefs.autoSurround;
                    var autoClosingBracketsVal = $scope.userPrefs.autoClosingBrackets;
                    var autoClosingQuotesVal = $scope.userPrefs.autoClosingQuotes;
                    var linkedEditingVal = !!$scope.userPrefs.linkedEditing;
                    Object.keys(monacoEditors).forEach(function (k) {
                        monacoEditors[k].updateOptions({
                            wordWrap: wrapVal,
                            minimap: minimapVal,
                            autoIndent: autoIndentVal,
                            formatOnPaste: formatOnPasteVal,
                            formatOnType: formatOnTypeVal,
                            autoSurround: autoSurroundVal,
                            autoClosingBrackets: autoClosingBracketsVal,
                            autoClosingQuotes: autoClosingQuotesVal,
                            linkedEditing: linkedEditingVal,
                            fontSize: fontSizeVal,
                            fontFamily: fontFamilyVal,
                            hover: { enabled: langHelpersEnabled },
                            parameterHints: { enabled: langHelpersEnabled },
                            stickyScroll: stickyScrollVal,
                            tabSize: tabSizeVal,
                        });
                    });
                    if (window.monaco) {
                        monaco.editor.setTheme(_resolveMonacoTheme());
                    }
                    _applyJsFormatOptions();
                    if (window.MONACO_LANGUAGE_HTML) {
                        if (MONACO_LANGUAGE_HTML.setValidationEnabled) {
                            MONACO_LANGUAGE_HTML.setValidationEnabled($scope.userPrefs.htmlValidation);
                        }
                        if (MONACO_LANGUAGE_HTML.setAutoCloseTagsEnabled) {
                            MONACO_LANGUAGE_HTML.setAutoCloseTagsEnabled($scope.userPrefs.htmlAutoCloseTags);
                        }
                    }
                    $scope.onEditorVisibilityChange();
                    saveUserPrefs();
                    _closeModal(function () {
                        $scope.showUserPrefsModal = false;
                    });
                };

                $scope.cancelUserPrefsModal = function () {
                    _closeModal(function () {
                        $scope.showUserPrefsModal = false;
                    });
                };

                $scope.resetUserPrefsModal = function () {
                    var defaultOrder = [
                        'template', 'css', 'client_script', 'link', 'script',
                    ];
                    var defaultVisible = {
                        template: true, css: true, client_script: true,
                        link: false, script: true,
                    };
                    var sorted = [];
                    defaultOrder.forEach(function (key) {
                        for (var i = 0; i < $scope.userPrefsEdit.editors.length; i++) {
                            if ($scope.userPrefsEdit.editors[i].key === key) {
                                var e = $scope.userPrefsEdit.editors[i];
                                e.visible = !!defaultVisible[key];
                                sorted.push(e);
                                break;
                            }
                        }
                    });
                    $scope.userPrefsEdit.editors = sorted;
                    $scope.userPrefsEdit.formatTabsToSpaces = true;
                    $scope.userPrefsEdit.wordWrap = true;
                    $scope.userPrefsEdit.editorTheme = 'auto';
                    $scope.userPrefsEdit.minimap = false;
                    $scope.userPrefsEdit.alwaysShowLink = true;
                    $scope.userPrefsEdit.realtimeWidgetUpdates = false;
                    $scope.userPrefsEdit.autoIndent = true;
                    $scope.userPrefsEdit.formatOnPaste = true;
                    $scope.userPrefsEdit.formatOnType = true;
                    $scope.userPrefsEdit.fontSize = 13;
                    $scope.userPrefsEdit.fontFamily = '';
                    $scope.userPrefsEdit.languageHelpers = true;
                    $scope.userPrefsEdit.showUnusedVars = true;
                    $scope.userPrefsEdit.remBase = 16;
                    $scope.userPrefsEdit.stickyScroll = true;
                    $scope.userPrefsEdit.htmlValidation = true;
                    $scope.userPrefsEdit.htmlAutoCloseTags = true;
                    $scope.userPrefsEdit.autoSurround = 'languageDefined';
                    $scope.userPrefsEdit.autoClosingBrackets = 'languageDefined';
                    $scope.userPrefsEdit.autoClosingQuotes = 'languageDefined';
                    $scope.userPrefsEdit.linkedEditing = true;
                    $scope.userPrefsEdit.insertSpaceBeforeFuncParen = false;
                    $scope.userPrefsEdit.tabSize = 4;
                    $scope.userPrefsEdit.ctrlSSaveActiveOnly = true;
                    $scope.userPrefsEdit.flashOnEditorOpen = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                    $scope.userPrefsEdit.showOpenInVsCode = true;
                };

                /* Trigger the modal leave animation, then invoke the close callback after it
                   completes. Guards against double-calls during the animation window. */
                function _closeModal(fn) {
                    if ($scope._modalClosing) {
                        return;
                    }
                    $scope._modalClosing = true;
                    $timeout(function () {
                        $scope._modalClosing = false;
                        fn();
                    }, 150);
                }

                ////////////////////////////////////////////////////////////
                // Keyboard shortcuts modal
                ////////////////////////////////////////////////////////////

                $scope.openKeyboardShortcutsModal = function () {
                    $scope.openDropdown = null;
                    $scope.showKeyboardShortcutsModal = true;
                };

                $scope.closeKeyboardShortcutsModal = function () {
                    _closeModal(function () {
                        $scope.showKeyboardShortcutsModal = false;
                    });
                };

                $scope.openApiDocs = function () {
                    var build = _getSnVersion();
                    var url = build
                        ? 'https://www.servicenow.com/docs/r/' +
                          build +
                          '/api-reference'
                        : 'https://www.servicenow.com/docs/';
                    window.open(url, '_blank', 'noopener,noreferrer');
                    $scope.openDropdown = null;
                };

                ////////////////////////////////////////////////////////////
                // Option Schema modal
                ////////////////////////////////////////////////////////////

                $scope.openOptionSchemaModal = function () {
                    $scope.openDropdown = null;
                    $scope.optionSchemaLoading = true;
                    $scope.optionSchemaLoadError = null;
                    $scope.optionSchemaSaveError = null;
                    $scope.optionSchemaSaving = false;
                    $scope.showOptionSchemaModal = true;

                    ajax('getOptionSchema', {
                        sys_id: $scope.widget.sys_id,
                    }).then(function (data) {
                        if (!data.success) {
                            $scope.optionSchemaLoading = false;
                            $scope.optionSchemaLoadError =
                                data.error || 'Failed to load option schema';
                            return;
                        }
                        $scope.optionSchemaLoading = false;
                        $timeout(function () {
                            var container = document.getElementById(
                                'option-schema-editor'
                            );
                            if (!container) {
                                return;
                            }
                            if (_optionSchemaEditor) {
                                try {
                                    _optionSchemaEditor.dispose();
                                } catch (e) {}
                                _optionSchemaEditor = null;
                            }
                            var raw = data.option_schema || '';
                            var value = raw;
                            try {
                                if (value.trim())
                                    value = JSON.stringify(
                                        JSON.parse(value),
                                        null,
                                        4
                                    );
                            } catch (e) {}
                            _ensureMonacoThemes();
                            _ensureWeJsonLanguage();
                            function _create() {
                                $scope.optionSchemaJsonInvalid = false;
                                _optionSchemaEditor = monaco.editor.create(
                                    container,
                                    {
                                        value: value,
                                        language: 'we-json',
                                        theme: _resolveMonacoTheme(),
                                        readOnly: !$scope.canWriteWidget,
                                        automaticLayout: true,
                                        fontSize: 12,
                                        scrollBeyondLastLine: false,
                                        minimap: { enabled: false },
                                        tabSize: 4,
                                        insertSpaces: true,
                                        wordWrap: $scope.userPrefs.wordWrap
                                            ? 'on'
                                            : 'off',
                                        fixedOverflowWidgets: true,
                                        mouseWheelZoom: true,
                                    }
                                );
                                // Validate JSON manually on every content change
                                function _validateJson() {
                                    var content =
                                        _optionSchemaEditor.getValue();
                                    var invalid = !!content.trim();
                                    if (invalid) {
                                        try {
                                            JSON.parse(content);
                                            invalid = false;
                                        } catch (e) {}
                                    }
                                    $scope.$apply(function () {
                                        $scope.optionSchemaJsonInvalid =
                                            invalid;
                                    });
                                }
                                _optionSchemaEditor.onDidChangeModelContent(
                                    _validateJson
                                );
                                _validateJson(); // run immediately in case initial value is invalid
                            }
                            if (window.monaco && window.monaco.editor) {
                                _create();
                            } else {
                                require(['vs/editor/editor.main'], function () {
                                    _ensureMonacoThemes();
                                    _ensureWeJsonLanguage();
                                    _create();
                                });
                            }
                        }, 50);
                    });
                };

                $scope.saveOptionSchemaModal = function () {
                    if (
                        !_optionSchemaEditor ||
                        !$scope.canWriteWidget ||
                        $scope.optionSchemaJsonInvalid
                    ) {
                        return;
                    }
                    $scope.optionSchemaSaving = true;
                    $scope.optionSchemaSaveError = null;
                    var newValue = _optionSchemaEditor.getValue();
                    ajax('saveOptionSchema', {
                        sys_id: $scope.widget.sys_id,
                        value: newValue,
                    }).then(function (data) {
                        $scope.optionSchemaSaving = false;
                        if (!data.success) {
                            $scope.optionSchemaSaveError =
                                data.error || 'Save failed';
                            return;
                        }
                        $scope.widget.option_schema_has_value =
                            _hasProperJsonObjectValue(newValue);
                        $scope.closeOptionSchemaModal();
                    });
                };

                $scope.closeOptionSchemaModal = function () {
                    _closeModal(function () {
                        $scope.showOptionSchemaModal = false;
                        if (_optionSchemaEditor) {
                            try {
                                _optionSchemaEditor.dispose();
                            } catch (e) {}
                            _optionSchemaEditor = null;
                        }
                    });
                };

                // True when a raw JSON string parses to an object with at least one property.
                function _hasProperJsonObjectValue(raw) {
                    if (!raw || !raw.trim()) {
                        return false;
                    }
                    try {
                        var parsed = JSON.parse(raw);
                        return (
                            !!parsed &&
                            typeof parsed === 'object' &&
                            !Array.isArray(parsed) &&
                            Object.keys(parsed).length > 0
                        );
                    } catch (e) {
                        return false;
                    }
                }

                ////////////////////////////////////////////////////////////
                // Demo Data modal
                ////////////////////////////////////////////////////////////

                $scope.openDemoDataModal = function () {
                    $scope.openDropdown = null;
                    $scope.demoDataLoading = true;
                    $scope.demoDataLoadError = null;
                    $scope.demoDataSaveError = null;
                    $scope.demoDataSaving = false;
                    $scope.showDemoDataModal = true;

                    ajax('getDemoData', {
                        sys_id: $scope.widget.sys_id,
                    }).then(function (data) {
                        if (!data.success) {
                            $scope.demoDataLoading = false;
                            $scope.demoDataLoadError =
                                data.error || 'Failed to load demo data';
                            return;
                        }
                        $scope.demoDataLoading = false;
                        $timeout(function () {
                            var container = document.getElementById(
                                'demo-data-editor'
                            );
                            if (!container) {
                                return;
                            }
                            if (_demoDataEditor) {
                                try {
                                    _demoDataEditor.dispose();
                                } catch (e) {}
                                _demoDataEditor = null;
                            }
                            var raw = data.demo_data || '';
                            var value = raw;
                            try {
                                if (value.trim())
                                    value = JSON.stringify(
                                        JSON.parse(value),
                                        null,
                                        4
                                    );
                            } catch (e) {}
                            _ensureMonacoThemes();
                            _ensureWeJsonLanguage();
                            function _create() {
                                $scope.demoDataJsonInvalid = false;
                                _demoDataEditor = monaco.editor.create(
                                    container,
                                    {
                                        value: value,
                                        language: 'we-json',
                                        theme: _resolveMonacoTheme(),
                                        readOnly: !$scope.canWriteWidget,
                                        automaticLayout: true,
                                        fontSize: 12,
                                        scrollBeyondLastLine: false,
                                        minimap: { enabled: false },
                                        tabSize: 4,
                                        insertSpaces: true,
                                        wordWrap: $scope.userPrefs.wordWrap
                                            ? 'on'
                                            : 'off',
                                        fixedOverflowWidgets: true,
                                        mouseWheelZoom: true,
                                    }
                                );
                                // Validate JSON manually on every content change
                                function _validateJson() {
                                    var content =
                                        _demoDataEditor.getValue();
                                    var invalid = !!content.trim();
                                    if (invalid) {
                                        try {
                                            JSON.parse(content);
                                            invalid = false;
                                        } catch (e) {}
                                    }
                                    $scope.$apply(function () {
                                        $scope.demoDataJsonInvalid =
                                            invalid;
                                    });
                                }
                                _demoDataEditor.onDidChangeModelContent(
                                    _validateJson
                                );
                                _validateJson(); // run immediately in case initial value is invalid
                            }
                            if (window.monaco && window.monaco.editor) {
                                _create();
                            } else {
                                require(['vs/editor/editor.main'], function () {
                                    _ensureMonacoThemes();
                                    _ensureWeJsonLanguage();
                                    _create();
                                });
                            }
                        }, 50);
                    });
                };

                $scope.saveDemoDataModal = function () {
                    if (
                        !_demoDataEditor ||
                        !$scope.canWriteWidget ||
                        $scope.demoDataJsonInvalid
                    ) {
                        return;
                    }
                    $scope.demoDataSaving = true;
                    $scope.demoDataSaveError = null;
                    var newValue = _demoDataEditor.getValue();
                    ajax('saveDemoData', {
                        sys_id: $scope.widget.sys_id,
                        value: newValue,
                    }).then(function (data) {
                        $scope.demoDataSaving = false;
                        if (!data.success) {
                            $scope.demoDataSaveError =
                                data.error || 'Save failed';
                            return;
                        }
                        $scope.widget.demo_data_has_value =
                            _hasProperJsonObjectValue(newValue);
                        $scope.closeDemoDataModal();
                    });
                };

                $scope.closeDemoDataModal = function () {
                    _closeModal(function () {
                        $scope.showDemoDataModal = false;
                        if (_demoDataEditor) {
                            try {
                                _demoDataEditor.dispose();
                            } catch (e) {}
                            _demoDataEditor = null;
                        }
                    });
                };

                ////////////////////////////////////////////////////////////
                // XML modal
                ////////////////////////////////////////////////////////////

                $scope.copyWidgetUrl = function () {
                    $scope.openDropdown = null;
                    var url =
                        window.location.protocol +
                        '//' +
                        window.location.host +
                        '/nav_to.do?uri=' +
                        encodeURIComponent('sp_widget?sys_id=' + SYS_ID);
                    navigator.clipboard.writeText(url);
                };

                $scope.openXmlModal = function () {
                    $scope.openDropdown = null;
                    $scope.showXmlModal = true;
                    $scope.xmlLoading = true;
                    $scope.xmlLoadError = null;
                    $scope.xmlExportUrl = null;

                    var xmlUrl =
                        '/sp_widget.do?UNL&sysparm_query=sys_id=' + SYS_ID;

                    $q.all([
                        $http.get(xmlUrl, {
                            headers: { 'X-UserToken': window.g_ck || '' },
                            transformResponse: function (d) {
                                return d;
                            },
                        }),
                        ajax('getHistorySetId', { sys_id: SYS_ID }),
                    ]).then(
                        function (results) {
                            var xmlContent =
                                typeof results[0].data === 'string'
                                    ? results[0].data
                                    : '';
                            var histRes = results[1];
                            if (histRes.success && histRes.history_set_id) {
                                $scope.xmlExportUrl =
                                    '/sys_history_set.do?UNL&sysparm_query=sys_id=' +
                                    histRes.history_set_id;
                            } else if (SYS_ID) {
                                $scope.xmlExportUrl = xmlUrl;
                            }
                            $scope.xmlLoading = false;
                            $timeout(function () {
                                var container =
                                    document.getElementById('xml-modal-editor');
                                if (!container) {
                                    return;
                                }
                                if (_xmlEditor) {
                                    try {
                                        _xmlEditor.dispose();
                                    } catch (e) {}
                                    _xmlEditor = null;
                                }
                                _ensureMonacoThemes();
                                function _create() {
                                    _xmlEditor = monaco.editor.create(
                                        container,
                                        {
                                            value: xmlContent,
                                            language: 'xml',
                                            theme: _resolveMonacoTheme(),
                                            readOnly: true,
                                            automaticLayout: true,
                                            fontSize: 12,
                                            scrollBeyondLastLine: false,
                                            minimap: { enabled: false },
                                            wordWrap: 'on',
                                            fixedOverflowWidgets: true,
                                        }
                                    );
                                }
                                if (window.monaco && window.monaco.editor) {
                                    _create();
                                } else {
                                    require([
                                        'vs/editor/editor.main',
                                    ], function () {
                                        _ensureMonacoThemes();
                                        _create();
                                    });
                                }
                            }, 50);
                        },
                        function () {
                            $scope.xmlLoading = false;
                            $scope.xmlLoadError = 'Failed to load XML';
                        }
                    );
                };

                $scope.closeXmlModal = function () {
                    _closeModal(function () {
                        $scope.showXmlModal = false;
                        if (_xmlEditor) {
                            try {
                                _xmlEditor.dispose();
                            } catch (e) {}
                            _xmlEditor = null;
                        }
                    });
                };

                var _bypassUnloadWarning = false;
                window.onbeforeunload = function () {
                    if (_bypassUnloadWarning) {
                        return undefined;
                    }
                    if (hasUnsavedChanges()) {
                        return 'You have unsaved changes. Leave page?';
                    }
                };

                ////////////////////////////////////////////////////////////
                // Window resize → re-layout editors
                ////////////////////////////////////////////////////////////
                window.addEventListener('resize', layoutAllEditors);

                ////////////////////////////////////////////////////////////
                // Boot
                ////////////////////////////////////////////////////////////
                init();
            },
        ]);
})();
`,
    processingScript: `// Server-side logic is handled by the WidgetEditorAjax Script Include (AbstractAjaxProcessor).
// Client calls are made via GlideAjax from client script.
`,
})
