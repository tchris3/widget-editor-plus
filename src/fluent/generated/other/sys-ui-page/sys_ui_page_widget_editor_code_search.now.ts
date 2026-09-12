import { UiPage } from '@servicenow/sdk/core'

export const widgetEditorCodeSearchUiPage = UiPage({
    $id: Now.ID['widget-editor-code-search-ui-page'],
    category: 'htmleditor',
    endpoint: 'widget_editor_code_search.do',
    description: 'Advanced cross-table code search for Widget Editor+, with per-table runtime and saved encoded-query filters.',
    html: `<?xml version="1.0" encoding="utf-8" ?>
<j:jelly trim="false" xmlns:j="jelly:core" xmlns:g="glide" xmlns:j2="null" xmlns:g2="null">

    <!-- Ensure the ServiceNow header frame is present; redirect if accessed directly -->
    <script>
        (function () {
            if (window.top === window) {
                var page = window.location.pathname.substring(1) + window.location.search + window.location.hash;
                window.location.replace('/now/nav/ui/classic/params/target/' + encodeURIComponent(page));
            }
        })();
    </script>

    <g:requires name="scripts/snc-code-editor/monaco.bundle.min.jsx" params="sysparm_substitute=false" />
    <g:requires name="monaco_plus_bootstrap.jsdbx" params="sysparm_substitute=false" />
    <g:requires name="scripts/angular_1.5.11/angular.min.js" position="last" />
    <link rel="stylesheet" href="/styles/retina_icons/retina_icons.css" />

    <style>
        /* Base Reset */
        *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        html {
            font-size: 16px;
        }

        html, body {
            height: 100%;
            margin: 0;
            padding: 0 !important;
            overflow: hidden;
            overscroll-behavior: none;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: var(--now-global-font-size--md, 14px);
            line-height: 1.45;
            background: rgb(var(--now-color_background--primary, 255 255 255));
            color: rgb(var(--now-color_text--primary, 29 29 29));
        }

        button, input, select, textarea {
            font-family: inherit;
            font-size: inherit;
            color: inherit;
        }

        [ng-cloak], .ng-cloak {
            display: none !important;
        }

        /* App Shell */
        .cs-app {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100vw;
            height: 100vh;
            max-height: 100vh;
            display: grid;
            grid-template-rows: auto minmax(0, 1fr);
            overflow: hidden !important;
            overscroll-behavior: none;
            background: rgb(var(--now-color_background--secondary, 246, 247, 249));
        }

        /* Header Bar - Native ServiceNow Horizon Styling matching Widget Editor+ Assistant */
        .dc-header {
            background: rgb(var(--now-color_chrome--brand-5, var(--now-color--primary-0, 221, 237, 233)));
            border-bottom: 1px solid rgb(var(--now-color_border--secondary, var(--now-color_divider--secondary, 228, 230, 235)));
            flex-shrink: 0;
            z-index: 10;
            margin: 0;
        }

        .dc-header-row {
            padding: 0.75rem 1.25rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1.25rem;
        }

        .dc-title {
            font-size: var(--now-font-size--lg, 18px);
            font-weight: 600;
            color: rgb(var(--now-color--neutral-0, var(--now-color--neutral-12, 38, 50, 56)));
            display: flex;
            align-items: center;
            gap: 0.5rem;
            white-space: nowrap;
        }

        .dc-title strong {
            font-weight: 700;
        }

        /* Horizon-like Search Bar */
        .cs-header-search {
            display: flex;
            flex: 1;
            gap: 0.5rem;
            margin: 0 auto;
            justify-content: center;
            align-items: center;
        }

        .cs-search-input-group {
            position: relative;
            display: flex;
            align-items: center;
            width: 100%;
            max-width: 38rem;
        }

        .cs-search-control {
            width: 100%;
            height: 2.25rem;
            padding: 0 4.25rem 0 0.875rem;
            font-size: var(--now-global-font-size--md, 14px);
            font-family: inherit;
            color: rgb(var(--now-color_text--primary, 29, 29, 29));
            background: rgb(var(--now-color_background--primary, 255, 255, 255));
            border: 1px solid rgb(var(--now-color_border--secondary, var(--now-color_divider--secondary, 200, 204, 210)));
            border-radius: var(--now-form-field--border-radius, 4px);
            outline: none;
            box-shadow: none;
            transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .cs-search-control:hover {
            border-color: rgb(var(--now-color_border--primary, 150, 155, 165));
        }

        .cs-search-control:focus {
            border-color: rgb(var(--now-color--primary-2, 23, 103, 91));
            box-shadow: 0 0 0 1px rgb(var(--now-color--primary-2, 23, 103, 91));
        }

        .cs-search-actions {
            position: absolute;
            right: 0.35rem;
            top: 50%;
            transform: translateY(-50%);
            display: flex;
            align-items: center;
            gap: 0.2rem;
            height: 1.75rem;
        }

        .cs-search-actions button.btn {
            border: none;
            height: 100%;
        }

        .cs-header-toggles {
            display: flex;
            align-items: center;
            gap: 0.85rem;
            flex-shrink: 0;
        }

        .cs-toggle-label {
            display: inline-flex;
            align-items: center;
            gap: 0.45rem;
            font-weight: 500;
            color: rgb(var(--now-color--neutral-0, var(--now-color--neutral-12, 38, 50, 56)));
            cursor: pointer;
            user-select: none;
            margin: 0;
            white-space: nowrap;
            padding: 0.35rem 0.55rem;
            border-radius: 4px;
            transition: background 0.12s ease;
        }

        .cs-toggle-label:hover {
            background: rgba(var(--now-color--neutral-0, 0, 0, 0), 0.05);
        }

        .cs-toggle-label input[type="checkbox"] {
            margin: 0;
            cursor: pointer;
            accent-color: rgb(var(--now-color--primary-2, 23, 103, 91));
            width: 1rem;
            height: 1rem;
        }

        /* Body Layout */
        .cs-body {
            min-height: 0;
            display: grid;
            grid-template-columns: 21rem minmax(0, 1fr);
            grid-template-rows: minmax(0, 1fr);
            overflow: hidden;
        }

        /* Sidebar */
        .cs-sidebar {
            display: flex;
            flex-direction: column;
            min-height: 0;
            background: rgb(var(--now-color_background--primary, 255, 255, 255));
            border-right: 1px solid rgb(var(--now-color_border--secondary, var(--now-color_divider--secondary, 228, 230, 235)));
            overflow: hidden;
        }

        /* Sidebar Panes (Accordion) */
        .cs-pane {
            display: flex;
            flex-direction: column;
            border-bottom: 1px solid rgb(var(--now-color_border--secondary, 228, 230, 235));
        }

        .cs-pane-expanded {
            flex: 1 1 auto;
            min-height: 0;
        }

        .cs-pane-collapsed {
            flex: 0 0 auto;
        }

        .cs-pane-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.75rem 1rem;
            background: rgb(var(--now-color_background--secondary, 246, 247, 249));
            cursor: pointer;
            user-select: none;
            transition: background 0.15s ease;
        }

        .cs-pane-head:hover {
            background: rgb(var(--now-color_background--tertiary, 238, 240, 242));
        }

        .cs-pane-title {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.8rem;
            font-weight: 700;
            color: rgb(var(--now-color_text--primary, 29, 29, 29));
            text-transform: uppercase;
            letter-spacing: 0.04em;
        }

        .cs-pane-chevron {
            font-size: 0.72rem;
            color: rgb(var(--now-color_text--secondary, 96, 100, 108));
        }

        .cs-pane-badge {
            font-size: 0.72rem;
            font-weight: 600;
            color: rgb(var(--now-color_text--secondary, 96, 100, 108));
            max-width: 9.5rem;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .cs-pane-disabled {
            opacity: 0.55;
        }

        .cs-pane-disabled .cs-pane-head {
            cursor: not-allowed;
            background: rgb(var(--now-color_background--secondary, 246, 247, 249));
        }

        .cs-pane-disabled .cs-pane-head:hover {
            background: rgb(var(--now-color_background--secondary, 246, 247, 249));
        }

        .cs-pane-disabled-text {
            font-size: 0.72rem;
            font-style: italic;
            color: rgb(var(--now-color_text--secondary, 96, 100, 108));
        }

        .cs-pane-body {
            display: flex;
            flex-direction: column;
            flex: 1 1 auto;
            min-height: 0;
            overflow: hidden;
            background: rgb(var(--now-color_background--primary, 255, 255, 255));
        }

        .cs-side-group-box {
            padding: 0.75rem 1rem;
            border-bottom: 1px solid rgb(var(--now-color_border--secondary, 228, 230, 235));
            background: rgb(var(--now-color_background--primary, 255, 255, 255));
        }

        .cs-label {
            display: block;
            font-size: 0.72rem;
            font-weight: 700;
            color: rgb(var(--now-color_text--secondary, 96, 100, 108));
            text-transform: uppercase;
            letter-spacing: 0.04em;
            margin-bottom: 0.35rem;
        }

        .cs-table-header-bar {
            padding: 0.65rem 1rem;
            border-bottom: 1px solid rgb(var(--now-color_border--secondary, 228, 230, 235));
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            background: rgb(var(--now-color_background--secondary, 246, 247, 249));
        }

        .cs-table-actions-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .cs-table-count-badge {
            font-size: 0.75rem;
            font-weight: 600;
            color: rgb(var(--now-color_text--secondary, 96, 100, 108));
            display: flex;
            align-items: center;
        }

        .cs-table-count-badge strong {
            color: rgb(var(--now-color_text--primary, 29, 29, 29));
            margin: 0 0.25rem 0 0;
        }

        .cs-results-pane-header {
            padding: 0.65rem 1rem;
            background: rgb(var(--now-color_background--secondary, 246, 247, 249));
            border-bottom: 1px solid rgb(var(--now-color_border--secondary, 228, 230, 235));
        }

        .cs-pane-empty-notice {
            padding: 2rem 1rem;
            text-align: center;
            font-size: 0.8rem;
            color: rgb(var(--now-color_text--secondary, 96, 100, 108));
        }

        .cs-table-list {
            flex: 1;
            min-height: 0;
            overflow-y: auto;
            padding: 0.5rem;
        }

        .cs-table-item {
            border: 1px solid transparent;
            border-radius: var(--now-form-field--border-radius, 4px);
            padding: 0.45rem 0.6rem;
            margin-bottom: 0.2rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: background 0.12s ease, border-color 0.12s ease;
            cursor: pointer;
        }

        .cs-table-item:hover {
            background: rgb(var(--now-color_background--tertiary, 238, 240, 242));
        }

        .cs-table-item.active {
            background: rgba(var(--now-color--primary-0, 221, 237, 233), 0.5);
            border-color: rgba(var(--now-color--primary-2, 23, 103, 91), 0.35);
        }

        .cs-table-result-item {
            padding: 0.5rem 0.65rem;
        }

        /* Tracks which table's results section is currently scrolled into view — reuses the
           same subtle background as :hover rather than introducing another highlight colour. */
        .cs-table-result-item.in-view {
            background: rgb(var(--now-color_background--tertiary, 238, 240, 242));
        }

        .cs-check {
            accent-color: rgb(var(--now-color--primary-2, 23, 103, 91));
            width: 0.95rem;
            height: 0.95rem;
            cursor: pointer;
            flex-shrink: 0;
        }

        .cs-table-info {
            flex: 1;
            min-width: 0;
        }

        .cs-table-name {
            font-weight: 600;
            font-size: 0.82rem;
            color: rgb(var(--now-color_text--primary, 29, 29, 29));
            display: flex;
            align-items: center;
            gap: 0.35rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .cs-table-id {
            color: rgb(var(--now-color_text--secondary, 96, 100, 108));
            font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
            font-size: 0.7rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .cs-filter-badge {
            display: inline-flex;
            align-items: center;
            font-size: 0.62rem;
            font-weight: 700;
            padding: 0.05rem 0.3rem;
            border-radius: 9999px;
            background: rgb(var(--now-alert--warning--background-color, 254, 243, 199));
            color: rgb(var(--now-alert--warning--color, 146, 64, 14));
            border: 1px solid rgba(var(--now-color_alert--warning-1, 245, 158, 11), 0.3);
            vertical-align: middle;
        }

        .cs-table-count-pill {
            font-size: 0.72rem;
            font-weight: 700;
            padding: 0.1rem 0.45rem;
            border-radius: 9999px;
            background: rgba(var(--now-color--primary-2, 23, 103, 91), 0.15);
            color: rgb(var(--now-color--primary-2, 23, 103, 91));
            flex-shrink: 0;
        }

        /* Main Search Results Area */
        .cs-main {
            min-width: 0;
            min-height: 0;
            height: 100%;
            max-height: 100%;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            background: rgb(var(--now-color_background--secondary, 246, 247, 249));
        }

        .cs-advanced { padding: .6rem 1rem; border-bottom: 1px solid rgb(var(--now-color_border--secondary, 228, 230, 235)); flex-shrink: 0; max-height: 35vh; overflow: auto; }

        .cs-cond-row {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-bottom: 0.5rem;
        }

        .cs-cond-joiner {
            flex-shrink: 0;
            width: 2.25rem;
            text-transform: lowercase;
            font-weight: 700;
            font-size: 0.78rem;
            color: rgb(var(--now-color--primary-2, 23, 103, 91));
        }

        .cs-cond-operator {
            width: 13rem;
        }

        .cs-cond-term {
            flex: 1;
            min-width: 12rem;
        }

        .cs-cond-joiner-btns {
            display: flex;
            gap: 0.25rem;
            flex-shrink: 0;
        }

        .cs-toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            padding: 0.6rem 1.25rem;
            border-bottom: 1px solid rgb(var(--now-color_border--secondary, 228, 230, 235));
            background: rgb(var(--now-color_background--primary, 255, 255, 255));
            flex-shrink: 0;
        }

        .cs-toolbar-summary {
            font-size: 0.84rem;
            color: rgb(var(--now-color_text--secondary, 96, 100, 108));
            display: flex;
            align-items: center;
            white-space: nowrap;
        }

        .cs-toolbar-summary strong {
            color: rgb(var(--now-color_text--primary, 29, 29, 29));
            margin: 0 0.25rem;
        }

        .cs-summary-sep {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin: 0 0.325rem;
            color: rgb(var(--now-color_text--secondary, 96, 100, 108));
            opacity: 0.65;
            font-size: 0.95rem;
            line-height: 1;
            user-select: none;
        }

        .cs-toolbar-actions {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .cs-toolbar-label {
            font-size: 0.78rem;
            font-weight: 600;
            color: rgb(var(--now-color_text--secondary, 96, 100, 108));
            white-space: nowrap;
            margin: 0;
        }

        .cs-results {
            flex: 1 1 0%;
            min-height: 0;
            overflow-y: auto !important;
            overflow-x: hidden;
            position: relative;
            padding: 0 1rem 1.25rem;
            -webkit-overflow-scrolling: touch;
            overscroll-behavior: contain;
        }

        /* Empty / Initial State */
        .cs-empty {
            height: 100%;
            min-height: 20rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            color: rgb(var(--now-color_text--secondary, 96, 100, 108));
            padding: 2rem;
        }

        .cs-empty-icon {
            width: 3.5rem;
            height: 3.5rem;
            margin-bottom: 0.875rem;
            color: rgb(var(--now-color--primary-2, 23, 103, 91));
            opacity: 0.7;
        }

        /* Hero Animated Icon for "Search for code" */
        .cs-hero-icon-wrap {
            position: relative;
            width: 5.25rem;
            height: 5.25rem;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 1.25rem;
            border-radius: 1.25rem;
            background: radial-gradient(circle at 35% 35%, rgba(var(--now-color--primary-2, 23, 103, 91), 0.16) 0%, rgba(var(--now-color--primary-2, 23, 103, 91), 0.04) 70%, transparent 100%);
            border: 1px solid rgba(var(--now-color--primary-2, 23, 103, 91), 0.22);
            box-shadow: 0 8px 24px -4px rgba(var(--now-color--primary-2, 23, 103, 91), 0.14);
        }

        .cs-hero-icon {
            width: 3.25rem;
            height: 3.25rem;
            color: rgb(var(--now-color--primary-2, 23, 103, 91));
        }

        .cs-anim-brackets {
            animation: csBracketsPulse 3.5s ease-in-out infinite;
            transform-origin: center center;
        }

        .cs-anim-glass {
            animation: csGlassScan 3.5s ease-in-out infinite;
            transform-origin: 27px 27px;
        }

        @keyframes csGlassScan {
            0%, 100% {
                transform: translate(0, 0) rotate(0deg);
            }
            25% {
                transform: translate(1.5px, -1.5px) rotate(1.2deg);
            }
            50% {
                transform: translate(-1.5px, 0.5px) rotate(-1deg);
            }
            75% {
                transform: translate(0.5px, 1.2px) rotate(0.6deg);
            }
        }

        @keyframes csBracketsPulse {
            0%, 100% {
                opacity: 0.65;
            }
            50% {
                opacity: 0.95;
            }
        }

        /* No Results Icon */
        .cs-no-results-wrap {
            position: relative;
            width: 5.25rem;
            height: 5.25rem;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 1.25rem;
            border-radius: 1.25rem;
            background: radial-gradient(circle at 35% 35%, rgba(var(--now-color--primary-2, 23, 103, 91), 0.14) 0%, rgba(var(--now-color--primary-2, 23, 103, 91), 0.03) 70%, transparent 100%);
            border: 1px solid rgba(var(--now-color--primary-2, 23, 103, 91), 0.2);
            box-shadow: 0 8px 24px -4px rgba(var(--now-color--primary-2, 23, 103, 91), 0.12);
        }

        .cs-no-results-icon {
            width: 3.25rem;
            height: 3.25rem;
            color: rgb(var(--now-color--primary-2, 23, 103, 91));
        }
        .cs-nores-question-mark {
            animation: csQuestionFloat 4.5s ease-in-out infinite;
            transform-origin: 24px 24px;
        }

        @keyframes csQuestionFloat {
            0% {
                transform: translate(0, 0) rotate(0deg);
            }
            20% {
                transform: translate(2px, -3.5px) rotate(3deg);
            }
            45% {
                transform: translate(-2.5px, -1px) rotate(-3deg);
            }
            70% {
                transform: translate(1.5px, 2.5px) rotate(2deg);
            }
            85% {
                transform: translate(-1px, 1.5px) rotate(-1.5deg);
            }
            100% {
                transform: translate(0, 0) rotate(0deg);
            }
        }

        .cs-empty h2 {
            font-size: var(--now-font-size--lg, 1.15rem);
            font-weight: 700;
            color: rgb(var(--now-color_text--primary, 29, 29, 29));
            margin-bottom: 0.35rem;
        }

        .cs-empty p {
            max-width: 28rem;
            font-size: 0.84rem;
            line-height: 1.5;
        }

        /* Search Progress Bar */
        .cs-progress-state {
            padding: 3rem 1.5rem;
            min-height: 18rem;
        }

        .cs-progress-card {
            width: 100%;
            max-width: 32rem;
            background: rgb(var(--now-color_background--primary, 255 255 255));
            border: 1px solid rgb(var(--now-color_border--secondary, var(--now-color_divider--secondary, 228 230 235)));
            border-radius: var(--now-form-field--border-radius, 6px);
            padding: 1.5rem 1.75rem;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
            text-align: left;
        }

        .cs-progress-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.75rem;
            margin-bottom: 0.85rem;
        }

        .cs-progress-title {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: var(--now-global-font-size--md, 14px);
            font-weight: 600;
            color: rgb(var(--now-color_text--primary, 29, 29, 29));
        }

        .cs-progress-icon {
            font-size: 1rem;
            color: rgb(var(--now-color--primary-2, 23, 103, 91));
        }

        .cs-progress-count {
            font-size: 0.8rem;
            font-weight: 600;
            color: rgb(var(--now-color_text--secondary, 96, 100, 108));
            white-space: nowrap;
        }

        .cs-progress-bar-container {
            height: 0.75rem;
            margin-bottom: 0.75rem;
            background-color: rgb(var(--now-color_background--secondary, 235, 238, 242));
            border-radius: 9999px;
            overflow: hidden;
            box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .cs-progress-bar-fill {
            height: 100%;
            background-color: rgb(var(--now-color--primary-2, 23, 103, 91));
            transition: width 0.25s ease-out;
            border-radius: 9999px;
        }

        .cs-progress-foot {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.5rem;
            font-size: 0.8rem;
            color: rgb(var(--now-color_text--secondary, 96, 100, 108));
        }

        .cs-progress-curr {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .cs-progress-curr strong {
            color: rgb(var(--now-color_text--primary, 29, 29, 29));
            font-weight: 600;
        }

        .cs-progress-percent {
            font-weight: 700;
            color: rgb(var(--now-color--primary-2, 23, 103, 91));
            white-space: nowrap;
            margin-left: auto;
        }

        /* Hierarchical Indentation */
        .cs-table-group {
            margin-bottom: 1.5rem;
        }

        /* Cancels .cs-results' own top padding so the first sticky table header sits flush
           against the top of the results pane from the start, instead of leaving a gap that
           only closes once scrolled past. */
        .cs-group-table-view {
            margin-top: -1rem;
        }

        /* Sticky table header: bleeds out to the full width of the results pane (cancelling
           its horizontal padding) and stays pinned, with the field pills, while that table's
           records scroll underneath. Opaque so scrolled-past cards never show through it. */
        .cs-table-group-sticky {
            position: sticky;
            top: 0;
            z-index: 2;
            margin: 0 -1.25rem 0.75rem;
            padding: 0.55rem 1.25rem 0.6rem;
            background: rgb(var(--now-color_surface--brand-3, 255, 255, 255));
            border-bottom: 1px solid rgb(var(--now-color_border--secondary, 228, 230, 235));
            scroll-margin-top: 0.5rem;
        }

        /* Level 1: Record table (no indent) */
        .cs-table-group-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .cs-field-toggle-row {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 0.4rem;
            margin: 0.5rem 0 0;
        }

        .cs-field-toggle-label {
            font-size: 0.7rem;
            font-weight: 700;
            color: rgb(var(--now-color_text--secondary, 96, 100, 108));
            text-transform: uppercase;
            letter-spacing: 0.03em;
            margin-right: 0.1rem;
        }

        .cs-field-toggle-pill {
            font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
            font-size: 0.72rem;
            font-weight: 700;
            padding: 0.15rem 0.55rem;
            border-radius: 9999px;
            border: 1px solid rgba(var(--now-color--primary-2, 23, 103, 91), 0.35);
            background: rgba(var(--now-color--primary-0, 221, 237, 233), 0.45);
            color: rgb(var(--now-color--primary-2, 23, 103, 91));
            cursor: pointer;
            transition: opacity 0.12s ease, background 0.12s ease, color 0.12s ease, border-color 0.12s ease;
        }

        .cs-field-toggle-pill:hover {
            opacity: 0.85;
        }

        .cs-field-toggle-pill.inactive {
            background: transparent;
            border-color: rgb(var(--now-color_border--secondary, 228, 230, 235));
            color: rgb(var(--now-color_text--tertiary, 140, 145, 155));
            text-decoration: line-through;
        }

        .cs-field-toggle-pill:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .cs-field-toggle-pill:disabled:hover {
            opacity: 0.5;
        }

        .cs-table-group-title {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .cs-table-group-label {
            font-size: 0.92rem;
            font-weight: 700;
            color: rgb(var(--now-color_text--primary, 29, 29, 29));
        }

        .cs-table-group-name {
            font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
            font-size: 0.75rem;
            color: rgb(var(--now-color_text--secondary, 96, 100, 108));
        }

        .cs-table-group-badge {
            font-size: 0.72rem;
            font-weight: 700;
            padding: 0.12rem 0.5rem;
            border-radius: 9999px;
            background: rgba(var(--now-color--primary-2, 23, 103, 91), 0.12);
            color: rgb(var(--now-color--primary-2, 23, 103, 91));
            text-decoration: none;
            cursor: pointer;
            transition: background 0.12s ease;
        }

        .cs-table-group-badge:hover {
            background: rgba(var(--now-color--primary-2, 23, 103, 91), 0.22);
        }

        /* Level 2: Record name (indented) */
        .cs-card {
            background: rgb(var(--now-color_background--primary, 255, 255, 255));
            border: 1px solid rgb(var(--now-color_border--secondary, 228, 230, 235));
            border-radius: var(--now-form-field--border-radius, 4px);
            margin-left: 1.5rem;
            margin-bottom: 0.85rem;
            overflow: hidden;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
        }

        .cs-card-flat {
            margin-left: 0 !important;
        }

        .cs-card-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            padding: 0.6rem 0.85rem;
            background: rgb(var(--now-color_background--primary, 255, 255, 255));
            border-bottom: 1px solid rgb(var(--now-color_border--secondary, 228, 230, 235));
        }

        .cs-card-title-wrap {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            flex-wrap: wrap;
            min-width: 0;
        }

        .cs-badge {
            font-size: 0.7rem;
            font-weight: 600;
            color: rgb(var(--now-color_text--secondary, 96, 100, 108));
            background: rgb(var(--now-color_background--secondary, 246, 247, 249));
            border: 1px solid rgb(var(--now-color_border--secondary, 228, 230, 235));
            border-radius: 9999px;
            padding: 0.1rem 0.45rem;
            white-space: nowrap;
        }

        .cs-status-pill {
            display: inline-flex;
            align-items: center;
            font-size: 0.65rem;
            font-weight: 700;
            line-height: 1;
            padding: 0.15rem 0.45rem;
            border-radius: 9999px;
            letter-spacing: 0.03em;
            text-transform: uppercase;
            flex-shrink: 0;
        }

        .cs-status-active {
            background: rgb(var(--now-alert--success--background-color, 220, 245, 227));
            color: rgb(var(--now-alert--success--color, 22, 122, 66));
            border: 1px solid rgba(var(--now-color_alert--success-1, 61, 174, 106), 0.35);
        }

        .cs-status-inactive {
            background: rgb(var(--now-color_background--tertiary, 238, 240, 242));
            color: rgb(var(--now-color_text--secondary, 96, 100, 108));
            border: 1px solid rgb(var(--now-color_border--secondary, 228, 230, 235));
        }

        .cs-secondary-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            font-size: 0.72rem;
            padding: 0.1rem 0.45rem;
            border-radius: var(--now-form-field--border-radius, 4px);
            background: rgb(var(--now-color_background--secondary, 246, 246, 248));
            border: 1px solid rgb(var(--now-color_border--secondary, 228, 230, 235));
            color: rgb(var(--now-color_text--primary, 29, 29, 29));
            white-space: nowrap;
        }

        .cs-sec-label {
            color: rgb(var(--now-color_text--secondary, 96, 100, 108));
            font-weight: 600;
        }

        .cs-record-link {
            color: rgb(var(--now-color--primary-2, 23, 103, 91));
            text-decoration: none;
            font-weight: 700;
            font-size: 0.9rem;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .cs-filter-match-link {
            font-weight: 700;
            text-decoration: underline;
        }

        .cs-record-link:hover {
            text-decoration: underline;
            color: rgb(var(--now-color--primary-3, 18, 85, 75));
        }

        .cs-card-actions {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            flex-shrink: 0;
        }

        .cs-updated {
            font-size: 0.75rem;
            color: rgb(var(--now-color_text--tertiary, 140, 145, 155));
        }

        /* Level 3: Fields (indented again) */
        .cs-match-container {
            margin: 0.6rem 0.85rem 0.85rem 1.5rem;
            border: 1px solid rgb(var(--now-color_border--secondary, 228, 230, 235));
            border-left: 3px solid rgb(var(--now-color--primary-2, 23, 103, 91));
            border-radius: var(--now-form-field--border-radius, 4px);
            background: rgb(var(--now-color_background--secondary, 246, 247, 249));
            overflow: hidden;
        }

        .cs-match-row {
            display: flex;
            flex-direction: column;
            border-bottom: 1px solid rgb(var(--now-color_border--secondary, 228, 230, 235));
        }

        .cs-match-row:last-child {
            border-bottom: none;
        }

        .cs-match-meta {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.35rem 0.85rem;
            background: rgb(var(--now-color_background--secondary, 246, 246, 248));
            border-bottom: 1px solid rgba(var(--now-color--neutral-0, 0, 0, 0), 0.06);
        }

        .cs-field-pill {
            font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
            font-size: 0.72rem;
            font-weight: 700;
            color: rgb(var(--now-color--primary-2, 23, 103, 91));
            background: rgba(var(--now-color--primary-0, 221, 237, 233), 0.45);
            padding: 0.05rem 0.35rem;
            border-radius: 3px;
        }

        .cs-line-pill {
            font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
            font-size: 0.7rem;
            color: rgb(var(--now-color_text--secondary, 96, 100, 108));
            margin-left: 0.4rem;
        }

        /* Monaco keyword matching uses native Monaco findController styling */

        /* Monaco-style Code Snippet Box */
        .cs-code-editor-box {
            display: flex;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 0.8125rem;
            line-height: 1.55;
            background: rgb(var(--now-color_background--primary, 255, 255, 255));
            border-top: 1px solid rgba(var(--now-color--neutral-0, 0, 0, 0), 0.05);
            overflow-x: auto;
        }

        .cs-code-gutter {
            flex-shrink: 0;
            padding: 0.4rem 0;
            background: rgb(var(--now-color_background--secondary, 246, 247, 249));
            border-right: 1px solid rgb(var(--now-color_border--secondary, 228, 230, 235));
            user-select: none;
            text-align: right;
        }

        .cs-gutter-num {
            display: block;
            padding: 0 0.65rem 0 0.5rem;
            color: rgb(var(--now-color_text--secondary, 140, 145, 155));
            font-size: 0.75rem;
            min-width: 2.75rem;
            line-height: 1.55;
        }

        .cs-code-content {
            flex: 1;
            min-width: 0;
            padding: 0.4rem 0;
            overflow-x: auto;
        }

        .cs-code-line {
            padding: 0 0.85rem;
            white-space: pre;
            color: rgb(var(--now-color_text--primary, 29, 29, 29));
            line-height: 1.55;
        }

        /* Marks a gap between two non-contiguous excerpts of the same field, merged into one box,
           as a horizontal rule spanning both the gutter and content columns. */
        .cs-gutter-num.cs-sep,
        .cs-code-line.cs-sep {
            display: flex;
            align-items: center;
        }

        .cs-gutter-num.cs-sep::after,
        .cs-code-line.cs-sep::after {
            content: '';
            width: 100%;
            border-top: 1px dashed rgb(var(--now-color_border--secondary, 228, 230, 235));
        }

        .cs-code-box {
            padding: 0.65rem 0.85rem;
            margin: 0;
            white-space: pre-wrap;
            overflow-wrap: anywhere;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 0.8125rem;
            line-height: 1.55;
            color: rgb(var(--now-color_text--primary, 29, 29, 29));
            background: rgb(var(--now-color_background--primary, 255, 255, 255));
        }

        mark.cs-highlight {
            background: rgb(var(--now-alert--warning--background-color, var(--now-color_alert--warning-0, 254, 243, 199)));
            color: rgb(var(--now-alert--warning--color, var(--now-color_alert--warning-3, 146, 64, 14)));
            border-radius: 2px;
            padding: 0 2px;
            font-weight: 700;
            box-shadow: 0 0 0 1px rgba(var(--now-color_alert--warning-1, 245, 158, 11), 0.4);
        }

        /* Inline Monaco Editor Box */
        .cs-inline-monaco-wrap {
            position: relative;
            width: 100%;
            background: #1e1e1e;
            border-top: 1px solid rgb(var(--now-color_border--secondary, 228, 230, 235));
        }

        .cs-inline-monaco-host {
            width: 100%;
            height: 380px;
        }

        .cs-inline-monaco-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 2rem 1rem;
            color: #d4d4d4;
            background: #1e1e1e;
            font-size: 0.85rem;
        }

        /* Drawer / Flyout Panel */
        .cs-drawer-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.35);
            z-index: 100;
            display: flex;
            justify-content: flex-end;
        }

        .cs-drawer {
            width: min(32rem, 92vw);
            height: 100%;
            background: rgb(var(--now-color_background--primary, 255, 255, 255));
            border-left: 1px solid rgb(var(--now-color_border--secondary, 228, 230, 235));
            box-shadow: -8px 0 24px rgba(0, 0, 0, 0.15);
            display: flex;
            flex-direction: column;
            animation: csSlideIn 0.18s ease-out;
        }

        @keyframes csSlideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
        }

        .cs-drawer-head {
            padding: 1rem 1.25rem;
            border-bottom: 1px solid rgb(var(--now-color_border--secondary, 228, 230, 235));
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: rgb(var(--now-color_background--secondary, 246, 246, 248));
        }

        .cs-drawer-head h2 {
            margin: 0;
            font-size: var(--now-font-size--lg, 1.1rem);
            font-weight: 700;
            color: rgb(var(--now-color_text--primary, 29, 29, 29));
        }

        .cs-modal-close-btn {
            all: unset;
            box-sizing: border-box;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 2rem;
            height: 2rem;
            cursor: pointer;
            color: rgb(var(--now-color_text--secondary, 96, 100, 108));
            border-radius: var(--now-button--border-radius, 4px);
            transition: background 0.12s ease, color 0.12s ease;
        }

        .cs-modal-close-btn:hover {
            background: rgba(var(--now-color--neutral-0, 0, 0, 0), 0.08);
            color: rgb(var(--now-color_text--primary, 29, 29, 29));
        }

        .cs-drawer-body {
            padding: 1.25rem;
            overflow-y: auto;
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .cs-form-group {
            display: flex;
            flex-direction: column;
            gap: 0.35rem;
        }

        .cs-form-label {
            font-size: 0.8rem;
            font-weight: 600;
            color: rgb(var(--now-color_text--primary, 29, 29, 29));
        }

        .cs-textarea {
            width: 100%;
            min-height: 6rem;
            border: 1px solid rgb(var(--now-color_border--secondary, 228, 230, 235));
            border-radius: var(--now-form-field--border-radius, 4px);
            padding: 0.6rem 0.65rem;
            background: rgb(var(--now-color_background--primary, 255, 255, 255));
            color: rgb(var(--now-color_text--primary, 29, 29, 29));
            resize: vertical;
            font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
            font-size: 0.8rem;
            line-height: 1.45;
            outline: none;
        }

        .cs-textarea:focus {
            border-color: rgb(var(--now-color--primary-2, 30, 133, 203));
            box-shadow: 0 0 0 2px rgba(var(--now-color--primary-2, 30, 133, 203), 0.2);
        }

        .cs-help {
            color: rgb(var(--now-color_text--secondary, 96, 100, 108));
            font-size: 0.75rem;
            line-height: 1.45;
        }

        .cs-drawer-foot {
            border-top: 1px solid rgb(var(--now-color_border--secondary, 228, 230, 235));
            padding: 0.875rem 1.25rem;
            display: flex;
            justify-content: flex-end;
            gap: 0.625rem;
            background: rgb(var(--now-color_background--secondary, 246, 246, 248));
        }

        /* Select2 multi-select styles in drawer */
        .cs-drawer .select2-container {
            width: 100% !important;
        }
        .cs-drawer .select2-choices {
            background: rgb(var(--now-color_background--primary, 255, 255, 255)) !important;
            border: 1px solid rgb(var(--now-color_border--secondary, 228, 230, 235)) !important;
            border-radius: var(--now-form-field--border-radius, 4px) !important;
            min-height: 2.25rem;
            padding: 0.15rem 0.35rem !important;
            box-shadow: none !important;
            background-image: none !important;
            cursor: text;
        }
        .cs-drawer .select2-search-choice {
            display: inline-flex !important;
            align-items: center;
            padding: 0.2rem 0.5rem !important;
            margin: 0.15rem 0.25rem 0.15rem 0 !important;
            background: rgba(var(--now-color--primary-2, 23, 103, 91), 0.12) !important;
            color: rgb(var(--now-color--primary-2, 23, 103, 91)) !important;
            border: 1px solid rgba(var(--now-color--primary-2, 23, 103, 91), 0.25) !important;
            border-radius: 9999px !important;
            box-shadow: none !important;
            font-size: 0.78rem !important;
            font-weight: 600 !important;
            line-height: 1.3 !important;
        }
        .cs-drawer .select2-search-choice-close {
            opacity: 0.6;
            position: static !important;
            margin-left: 0.35rem !important;
        }
        .cs-drawer .select2-search-choice-close:hover {
            opacity: 1;
        }
        .cs-drawer .select2-container-multi.select2-container-active .select2-choices {
            border-color: rgb(var(--now-color--primary-2, 23, 103, 91)) !important;
            box-shadow: 0 0 0 2px rgba(var(--now-color--primary-2, 23, 103, 91), 0.2) !important;
        }
        .cs-drawer .select2-input {
            font-family: inherit !important;
            font-size: 0.82rem !important;
            color: rgb(var(--now-color_text--primary, 29, 29, 29)) !important;
            padding: 0.2rem 0.35rem !important;
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
        }
        .cs-drawer .select2-container-multi .select2-choices .select2-search-field input.select2-active {
            background-image: none !important;
        }

        /* Select2 Dropdown */
        .cs-fields-picker-drop.select2-drop {
            background: rgb(var(--now-color_background--primary, 255, 255, 255)) !important;
            border: 1px solid rgb(var(--now-color_border--secondary, 228, 230, 235)) !important;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18) !important;
            border-radius: var(--now-form-field--border-radius, 4px) !important;
            z-index: 10000 !important;
            color: rgb(var(--now-color_text--primary, 29, 29, 29)) !important;
        }
        .cs-fields-picker-drop .select2-search {
            padding: 0.4rem !important;
        }
        .cs-fields-picker-drop .select2-search input {
            background: rgb(var(--now-color_background--secondary, 246, 247, 249)) !important;
            border: 1px solid rgb(var(--now-color_border--secondary, 228, 230, 235)) !important;
            border-radius: var(--now-form-field--border-radius, 4px) !important;
            color: rgb(var(--now-color_text--primary, 29, 29, 29)) !important;
            font-size: 0.82rem !important;
            padding: 0.35rem 0.5rem !important;
            box-shadow: none !important;
            background-image: none !important;
        }
        .cs-fields-picker-drop .select2-results {
            max-height: 220px !important;
            padding: 0.25rem !important;
            background: transparent !important;
        }
        .cs-fields-picker-drop .select2-result-label {
            color: rgb(var(--now-color_text--primary, 29, 29, 29)) !important;
            font-size: 0.82rem !important;
            padding: 0.35rem 0.55rem !important;
            border-radius: 3px !important;
        }
        .cs-fields-picker-drop .select2-result.select2-highlighted .select2-result-label {
            background: rgba(var(--now-color--primary-2, 23, 103, 91), 0.12) !important;
            color: rgb(var(--now-color--primary-2, 23, 103, 91)) !important;
        }
        .cs-fields-picker-drop .select2-searching,
        .cs-fields-picker-drop .select2-no-results {
            background: transparent !important;
            color: rgb(var(--now-color_text--secondary, 96, 100, 108)) !important;
            font-size: 0.8rem !important;
            padding: 0.5rem !important;
        }

        /* Toast Feedback - ServiceNow Next Experience / Polaris Dark Surface */
        .cs-toast {
            position: fixed;
            left: 50%;
            bottom: 1.5rem;
            transform: translateX(-50%);
            background: rgb(var(--now-color_surface--dark, var(--now-color--neutral-20, var(--now-color--neutral-18, 30 41 59))));
            color: rgb(var(--now-color_text--inverse, var(--now-color--neutral-0, 255 255 255)));
            border: 1px solid rgb(var(--now-color_border--inverse, var(--now-color--neutral-15, 60 75 90)));
            padding: 0.65rem 1.25rem;
            border-radius: var(--now-form-field--border-radius, 4px);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
            font-size: 0.85rem;
            font-weight: 500;
            z-index: 1000;
            pointer-events: none;
            animation: csFadeIn 0.15s ease;
        }

        @keyframes csFadeIn {
            from { opacity: 0; transform: translate(-50%, 8px); }
            to { opacity: 1; transform: translate(-50%, 0); }
        }

        /* Spinner animation */
        .cs-spin {
            animation: csSpin 0.75s linear infinite;
        }

        @keyframes csSpin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        @media (max-width: 900px) {
            .cs-body {
                grid-template-columns: 16rem minmax(0, 1fr);
            }
        }
    </style>

    <div class="cs-app" id="codeSearchApp" ng-controller="CodeSearchController as ctrl" ng-cloak="true">
        <!-- Header Bar matching Widget Editor+ Assistant -->
        <header class="dc-header">
            <div class="dc-header-row">
                <!-- Exact Assistant Title Style -->
                <div class="dc-title">
                    <span>Widget Editor+ Code Search</span>
                </div>

                <!-- Horizon-Like Centered Search Bar -->
                <form class="cs-header-search" ng-submit="ctrl.onSearchSubmit()">
                    <div class="cs-search-input-group">
                        <input type="text"
                               class="cs-search-control"
                               ng-model="ctrl.query"
                               placeholder="Search code across tables…"
                               aria-label="Search code across configured tables"
                               autofocus="autofocus" />
                        <div class="cs-search-actions">
                            <button type="button"
                                    class="btn btn-default"
                                    ng-if="ctrl.query"
                                    ng-click="ctrl.clearInput()"
                                    title="Clear search"
                                    aria-label="Clear search">
                                <span class="icon-error-circle" aria-hidden="true"></span>
                            </button>
                        </div>
                    </div>

                    <button type="button" class="btn btn-default" ng-click="ctrl.showAdvanced()" aria-expanded="{{!!ctrl.secondaryFilters.length}}" aria-controls="secondary-filters"><span class="icon-filter" aria-hidden="true"></span><span class="sr-only">Advanced conditions</span></button>

                    <button type="submit"
                            class="btn btn-default"
                            ng-disabled="ctrl.loading || !ctrl.query.trim()"
                            title="Search"
                            aria-label="Search">
                        <span ng-if="!ctrl.loading" class="icon-search" aria-hidden="true"></span>
                        <span ng-if="ctrl.loading" class="icon-loading" aria-hidden="true"></span>
                    </button>
                </form>

                <!-- Options / Toggles -->
                <div class="cs-header-toggles">
                    <label class="cs-toggle-label" title="Match case exactly">
                        <input type="checkbox" ng-model="ctrl.caseSensitive" ng-change="ctrl.onOptionChange()" />
                        <span>Case sensitive</span>
                    </label>
                    <label class="cs-toggle-label" title="Only show records where active=true or u_active=true">
                        <input type="checkbox" ng-model="ctrl.activeOnly" ng-change="ctrl.onOptionChange()" />
                        <span>Active only</span>
                    </label>
                </div>
            </div>
        </header>

        <form class="cs-advanced" id="secondary-filters" ng-if="ctrl.secondaryFilters.length" ng-submit="ctrl.onSearchSubmit()">
            <div class="cs-cond-row" ng-repeat="filter in ctrl.secondaryFilters track by $index">
                <span class="cs-cond-joiner" ng-if="filter.joiner === 'or'">or</span>
                <select class="form-control cs-cond-operator" ng-model="filter.operator" aria-label="Secondary filter operator">
                    <option value="contains">Contains</option>
                    <option value="not_contains">Does not contain</option>
                </select>
                <input class="form-control cs-cond-term" ng-model="filter.term" maxlength="250" />
                <div class="cs-cond-joiner-btns">
                    <button type="button" class="btn btn-default" ng-click="ctrl.addSecondaryFilter($index, 'and')" ng-disabled="ctrl.secondaryFilters.length >= 20" title="Add an AND condition after this one">AND</button>
                    <button type="button" class="btn btn-default" ng-click="ctrl.addSecondaryFilter($index, 'or')" ng-disabled="ctrl.secondaryFilters.length >= 20" title="Add an OR condition after this one">OR</button>
                </div>
                <button type="button" class="btn btn-danger" ng-click="ctrl.removeSecondaryFilter($index)" aria-label="Remove condition" title="Remove condition">
                    <i class="icon-cross" aria-hidden="true"></i>
                </button>
            </div>
        </form>
        <!-- Body -->
        <div class="cs-body">
            <!-- Sidebar: Search Group & Results Panes -->
            <aside class="cs-sidebar">
                <!-- Pane 1: Search Group (Configured Tables) -->
                <div class="cs-pane" ng-class="{'cs-pane-collapsed': !ctrl.paneGroupOpen, 'cs-pane-expanded': ctrl.paneGroupOpen}">
                    <div class="cs-pane-head" ng-click="ctrl.togglePane('group')" title="Toggle Search Group pane">
                        <div class="cs-pane-title">
                            <i ng-class="ctrl.paneGroupOpen ? 'icon-chevron-down' : 'icon-chevron-right'" class="cs-pane-chevron" aria-hidden="true"></i>
                            <span>Search Group</span>
                        </div>
                        <span class="cs-pane-badge" ng-if="ctrl.selectedGroup">{{ctrl.selectedGroup.name}}</span>
                    </div>
                    <div class="cs-pane-body" ng-show="ctrl.paneGroupOpen">
                        <div class="cs-side-group-box">
                            <label class="cs-label" for="group-select">Search Group</label>
                            <select id="group-select" class="form-control" ng-model="ctrl.selectedGroupId" ng-change="ctrl.onGroupChange()">
                                <option ng-repeat="g in ctrl.groups track by g.sysId" ng-value="g.sysId">
                                    {{g.name}} ({{g.tableCount}})
                                </option>
                            </select>
                        </div>

                        <div class="cs-table-header-bar">
                            <div class="cs-table-actions-row">
                                <span class="cs-table-count-badge">Tables<span class="cs-summary-sep">•</span><strong>{{ctrl.enabledCount()}}</strong> of {{ctrl.tables.length}} enabled</span>
                                <div style="display: flex; gap: 0.25rem;">
                                    <button type="button" class="btn btn-default" ng-click="ctrl.selectAllTables(true)" title="Enable all tables">All</button>
                                    <button type="button" class="btn btn-default" ng-click="ctrl.selectAllTables(false)" title="Disable all tables">None</button>
                                </div>
                            </div>
                            <input type="text" class="form-control" ng-model="ctrl.tableFilter" placeholder="Filter tables by name or ID…" aria-label="Filter tables" />
                        </div>

                        <div class="cs-table-list">
                            <div class="cs-table-item" ng-repeat="table in ctrl.filteredConfigTables track by table.sysId" ng-class="{active: ctrl.editing === table}" ng-click="ctrl.toggleTable(table)" title="Click to {{table.enabled ? 'disable' : 'enable'}} {{table.label}}">
                                <input class="cs-check" type="checkbox" ng-model="table.enabled" ng-click="$event.stopPropagation()" aria-label="Include {{table.label}} in search" />
                                <div class="cs-table-info">
                                    <div class="cs-table-name">
                                        <span>{{table.label}}</span>
                                        <span class="cs-filter-badge" ng-if="table.additionalFilter" title="Custom encoded query filter applied">FILTER</span>
                                    </div>
                                    <div class="cs-table-id">{{table.table}}</div>
                                </div>
                                <button type="button" class="btn btn-icon" ng-click="$event.stopPropagation(); ctrl.openConfig(table)" title="Configure table search fields and filters" aria-label="Configure table">
                                    <i class="icon-cog" aria-hidden="true"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Pane 2: Tables with Results -->
                <div class="cs-pane" ng-class="{'cs-pane-collapsed': !ctrl.paneResultsOpen, 'cs-pane-expanded': ctrl.paneResultsOpen, 'cs-pane-disabled': !ctrl.hasSearched}">
                    <div class="cs-pane-head" ng-click="ctrl.togglePane('results')" title="{{ctrl.hasSearched ? 'Toggle Tables with Results' : 'Perform a search to view matching tables'}}">
                        <div class="cs-pane-title">
                            <i ng-class="ctrl.paneResultsOpen ? 'icon-chevron-down' : 'icon-chevron-right'" class="cs-pane-chevron" aria-hidden="true"></i>
                            <span>Tables with Results</span>
                        </div>
                        <span class="cs-table-count-pill" ng-if="ctrl.hasSearched">{{ctrl.tablesWithResults.length}}</span>
                        <span class="cs-pane-disabled-text" ng-if="!ctrl.hasSearched">N/A</span>
                    </div>
                    <div class="cs-pane-body" ng-show="ctrl.paneResultsOpen &amp;&amp; ctrl.hasSearched">
                        <div class="cs-results-pane-header">
                            <span class="cs-table-count-badge">
                                <strong>{{ctrl.tablesWithResults.length}}</strong>
                                <span>tables with results</span>
                            </span>
                        </div>
                        <div class="cs-table-list">
                            <div class="cs-table-item cs-table-result-item" ng-class="{'in-view': ctrl.currentViewedTable === table.table}" ng-repeat="table in ctrl.tablesWithResults track by table.sysId" ng-click="ctrl.scrollToTable(table.table)" title="{{table.searchFieldsDisplay || ctrl.getTableSearchFieldsDisplay(table)}}">
                                <div class="cs-table-info">
                                    <div class="cs-table-name">
                                        <span>{{table.label}}</span>
                                    </div>
                                    <div class="cs-table-id">{{table.table}}</div>
                                </div>
                                <span class="cs-table-count-pill" title="{{ctrl.tableMatchCounts[table.table]}} matching records">{{ctrl.tableMatchCounts[table.table] || 0}}</span>
                            </div>
                            <div class="cs-pane-empty-notice" ng-if="!ctrl.loading &amp;&amp; !ctrl.tablesWithResults.length">
                                No matching tables found.
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            <!-- Main Results Area -->
            <main class="cs-main">
                <div class="cs-toolbar" ng-if="ctrl.hasSearched &amp;&amp; !ctrl.loading">
                    <div class="cs-toolbar-summary" ng-if="ctrl.hasSearched &amp;&amp; !ctrl.loading">
                        <span>Found</span>
                        <strong>{{ctrl.sortedResults.length}}</strong>
                        <span>matching records across</span>
                        <strong>{{ctrl.searchedTables}}</strong>
                        <span>tables</span>
                        <span ng-if="ctrl.elapsed" class="cs-summary-sep">•</span>
                        <span ng-if="ctrl.elapsed">{{ctrl.formatElapsed(ctrl.elapsed)}}</span>
                    </div>

                    <div ng-show="ctrl.hasSearched &amp;&amp; !ctrl.loading" class="cs-toolbar-actions">
                        <select id="view-select" class="form-control" ng-model="ctrl.viewMode" aria-label="Sort or group results">
                            <option value="group_table">Group by record type</option>
                            <option value="date_asc">Sort by updated date (oldest to newest)</option>
                            <option value="date_desc">Sort by updated date (newest to oldest)</option>
                        </select>
                    </div>
                </div>
                <div class="cs-results" id="cs-results-container">
                    <!-- Initial Welcome State -->
                    <div class="cs-empty cs-welcome-state" ng-if="!ctrl.hasSearched &amp;&amp; !ctrl.loading">
                        <div class="cs-hero-icon-wrap" aria-hidden="true">
                            <svg class="cs-hero-icon" viewBox="0 0 56 56" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <!-- Outer Code Brackets -->
                                <g class="cs-anim-brackets">
                                    <path d="M14 18L5 28L14 38" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M42 18L51 28L42 38" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                                </g>
                                <!-- Magnifying Glass Scanning Over Code -->
                                <g class="cs-anim-glass">
                                    <circle cx="27" cy="27" r="11" stroke-width="2.5"/>
                                    <path d="M22 22A6 6 0 0 1 29 19.5" stroke-width="1.75" stroke-linecap="round" opacity="0.75"/>
                                    <!-- Handle -->
                                    <path d="M35 35L46 46" stroke-width="3.25" stroke-linecap="round"/>
                                </g>
                            </svg>
                        </div>
                        <h2>Search for code</h2>
                        <p>Search across configured fields in your tables.</p>
                    </div>

                    <!-- Loading State with Progress Bar -->
                    <div class="cs-empty cs-progress-state" ng-if="ctrl.loading">
                        <div class="cs-progress-card">
                            <div class="cs-progress-head">
                                <div class="cs-progress-title">
                                    <span class="icon-search cs-progress-icon" aria-hidden="true"></span>
                                    <span>Searching…</span>
                                </div>
                                <span class="cs-progress-count">{{ctrl.searchProgress.completed}} of {{ctrl.searchProgress.total}} tables</span>
                            </div>
                            <div class="progress cs-progress-bar-container">
                                <div class="progress-bar progress-bar-striped active cs-progress-bar-fill"
                                     role="progressbar"
                                     aria-valuenow="{{ctrl.searchProgress.percent}}"
                                     aria-valuemin="0"
                                     aria-valuemax="100"
                                     ng-style="{'width': ctrl.searchProgress.percent + '%'}">
                                </div>
                            </div>
                            <div class="cs-progress-foot">
                                <span class="cs-progress-curr" ng-if="ctrl.searchProgress.currentTable">
                                    <strong>{{ctrl.searchProgress.currentTable}}</strong>…
                                </span>
                                <span class="cs-progress-percent">{{ctrl.searchProgress.percent}}%</span>
                            </div>
                        </div>
                    </div>

                    <!-- No Results State -->
                    <div class="cs-empty cs-no-results-state" ng-if="ctrl.hasSearched &amp;&amp; !ctrl.loading &amp;&amp; !ctrl.results.length">
                        <div class="cs-no-results-wrap" aria-hidden="true">
                            <svg class="cs-no-results-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <g class="cs-nores-question-mark">
                                    <path d="M17 17C17 13.4 20.1 10.5 24 10.5C27.9 10.5 31 13.4 31 17C31 20.2 29 22.2 26 24.5C24.5 25.6 24 26.8 24 29" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <circle cx="24" cy="37" r="2" fill="currentColor" stroke="none"/>
                                </g>
                            </svg>
                        </div>
                        <h2>No results found</h2>
                    </div>

                    <!-- View 1: Grouped by Record Type (Table) -->
                    <div class="cs-group-table-view" ng-if="ctrl.hasSearched &amp;&amp; !ctrl.loading &amp;&amp; ctrl.viewMode === 'group_table'">
                        <section class="cs-table-group" id="table-group-{{group.table}}" data-table="{{group.table}}" ng-repeat="group in ctrl.groupedResults track by group.table" ng-if="group.records.length">
                            <!-- Level 1: Record table (no indent). Sticky so the table name and its
                                 field pills stay visible while that table's records scroll beneath. -->
                            <div class="cs-table-group-sticky" id="table-group-head-{{group.table}}">
                                <div class="cs-table-group-head">
                                    <div class="cs-table-group-title">
                                        <span class="cs-table-group-label">{{group.tableLabel}}</span>
                                        <span class="cs-table-group-name">{{group.table}}</span>
                                    </div>
                                    <a class="cs-table-group-badge" ng-href="{{ctrl.getGroupListUrl(group)}}" target="_blank" title="Open {{group.tableLabel}} list (case insensitive)">{{group.records.length}} {{group.records.length === 1 ? 'record' : 'records'}}</a>
                                </div>

                                <div class="cs-field-toggle-row" ng-if="group.fields.length">
                                    <span class="cs-field-toggle-label">Fields:</span>
                                    <button type="button"
                                            class="cs-field-toggle-pill"
                                            ng-repeat="f in group.fields track by f.field"
                                            ng-class="{'inactive': !ctrl.tableActiveFields[group.table][f.field]}"
                                            ng-click="ctrl.toggleGroupField(group, f.field)"
                                            ng-disabled="ctrl.isLastActiveField(group, f.field)"
                                            title="{{ctrl.isLastActiveField(group, f.field) ? 'At least one field must stay included' : (ctrl.tableActiveFields[group.table][f.field] ? 'Exclude results where the keyword only appears in ' + f.label : 'Include results where the keyword appears in ' + f.label)}}">
                                        {{f.label}}
                                    </button>
                                </div>
                            </div>

                            <!-- Level 2: Record name (indented) -->
                            <article class="cs-card" ng-repeat="result in group.records track by result.table + result.sysId">
                                <header class="cs-card-head">
                                    <div class="cs-card-title-wrap">
                                        <a class="cs-record-link" ng-href="{{result.url}}" target="_blank" title="Open record in new tab">{{result.displayValue}}</a>
                                        <span class="cs-status-pill cs-status-active" ng-if="result.hasActive &amp;&amp; result.isActive">Active</span>
                                        <span class="cs-status-pill cs-status-inactive" ng-if="result.hasActive &amp;&amp; !result.isActive">Inactive</span>
                                        <span class="cs-secondary-badge" ng-repeat="sec in result.secondaryValues track by sec.field" title="{{sec.label}}: {{sec.value}}">
                                            <span class="cs-sec-label">{{sec.label}}:</span>
                                            <span>{{sec.value}}</span>
                                        </span>
                                    </div>
                                    <div class="cs-card-actions">
                                        <span class="cs-updated" ng-if="result.updatedOn">Updated on {{ctrl.formatDate(result.updatedOn)}}</span>
                                        <a class="btn btn-primary" ng-if="result.isWidget" ng-href="{{result.widgetEditorUrl}}" target="_blank" title="Open widget in Widget Editor+">
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                                            <span>Widget Editor+</span>
                                        </a>
                                    </div>
                                </header>

                                <!-- Level 3: Fields (indented again) -->
                                <div class="cs-match-container">
                                    <div class="cs-match-row" ng-repeat="match in result.visibleMatches">
                                        <div class="cs-match-meta">
                                            <div>
                                                <span class="cs-field-pill">{{match.fieldLabel || match.field}}</span>
                                            </div>
                                            <button type="button" class="btn btn-icon" ng-if="!match.allLinesShown" ng-class="{'active': match.expanded}" ng-click="ctrl.toggleMatchExpand(result, match, $index)" title="{{match.expanded ? 'Collapse to snippet' : 'View entire field'}}" aria-label="{{match.expanded ? 'Collapse to snippet' : 'View entire field'}}">
                                                <span ng-class="match.expanded ? 'icon-pop-in' : 'icon-pop-out'" aria-hidden="true"></span>
                                            </button>
                                        </div>

                                        <!-- Initial snippet state -->
                                        <div ng-if="!match.expanded">
                                            <!-- Monaco-style line gutter and code lines -->
                                            <div class="cs-code-editor-box" ng-if="match.lines">
                                                <div class="cs-code-gutter" ng-if="match.totalLines ? match.totalLines > 1 : match.lines.length > 1">
                                                    <span class="cs-gutter-num" ng-class="{'cs-sep': line.separator}" ng-repeat="line in match.lines track by $index">{{line.separator ? '' : line.num}}</span>
                                                </div>
                                                <div class="cs-code-content">
                                                    <div class="cs-code-line" ng-class="{'cs-sep': line.separator}" ng-repeat="line in match.lines track by $index"><span ng-if="!line.separator" ng-bind-html="ctrl.highlight(line.text)"></span></div>
                                                </div>
                                            </div>
                                            <pre class="cs-code-box" ng-if="!match.lines" ng-bind-html="ctrl.highlight(match.snippet)"></pre>
                                        </div>

                                        <!-- Inline Monaco Editor state (replaces code snippet) -->
                                        <div class="cs-inline-monaco-wrap" ng-if="match.expanded">
                                            <div class="cs-inline-monaco-loading" ng-if="match.loading">
                                                <svg class="cs-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12"/></svg>
                                                <span>Loading entire field…</span>
                                            </div>
                                            <div id="{{ctrl.getMonacoHostId(result, match, $index)}}" class="cs-inline-monaco-host" ng-show="!match.loading"></div>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        </section>
                    </div>

                    <!-- View 2: Sorted by Date (Oldest to Newest or Newest to Oldest) -->
                    <div ng-if="ctrl.hasSearched &amp;&amp; !ctrl.loading &amp;&amp; ctrl.viewMode !== 'group_table'">
                        <article class="cs-card cs-card-flat" ng-repeat="result in ctrl.sortedResults track by result.table + result.sysId">
                            <header class="cs-card-head">
                                <div class="cs-card-title-wrap">
                                    <span class="cs-badge">{{result.tableLabel}}</span>
                                    <a class="cs-record-link" ng-href="{{result.url}}" target="_blank" title="Open record in new tab">{{result.displayValue}}</a>
                                    <span class="cs-status-pill cs-status-active" ng-if="result.hasActive &amp;&amp; result.isActive">Active</span>
                                    <span class="cs-status-pill cs-status-inactive" ng-if="result.hasActive &amp;&amp; !result.isActive">Inactive</span>
                                    <span class="cs-secondary-badge" ng-repeat="sec in result.secondaryValues track by sec.field" title="{{sec.label}}: {{sec.value}}">
                                        <span class="cs-sec-label">{{sec.label}}:</span>
                                        <span>{{sec.value}}</span>
                                    </span>
                                </div>
                                <div class="cs-card-actions">
                                    <span class="cs-updated" ng-if="result.updatedOn">Updated on {{ctrl.formatDate(result.updatedOn)}}</span>
                                    <a class="btn btn-primary" ng-if="result.isWidget" ng-href="{{result.widgetEditorUrl}}" target="_blank" title="Open widget in Widget Editor+">
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                                        <span>Widget Editor+</span>
                                    </a>
                                </div>
                            </header>

                            <!-- Level 3: Fields (indented again) -->
                            <div class="cs-match-container">
                                <div class="cs-match-row" ng-repeat="match in result.visibleMatches">
                                    <div class="cs-match-meta">
                                        <div>
                                            <span class="cs-field-pill">{{match.fieldLabel || match.field}}</span>
                                        </div>
                                        <button type="button" class="btn btn-icon" ng-if="!match.allLinesShown" ng-class="{'active': match.expanded}" ng-click="ctrl.toggleMatchExpand(result, match, $index)" title="{{match.expanded ? 'Collapse to snippet' : 'View entire field'}}" aria-label="{{match.expanded ? 'Collapse to snippet' : 'View entire field'}}">
                                            <span ng-class="match.expanded ? 'icon-pop-in' : 'icon-pop-out'" aria-hidden="true"></span>
                                        </button>
                                    </div>

                                    <!-- Initial snippet state -->
                                    <div ng-if="!match.expanded">
                                        <!-- Monaco-style line gutter and code lines -->
                                        <div class="cs-code-editor-box" ng-if="match.lines">
                                            <div class="cs-code-gutter" ng-if="match.totalLines ? match.totalLines > 1 : match.lines.length > 1">
                                                <span class="cs-gutter-num" ng-class="{'cs-sep': line.separator}" ng-repeat="line in match.lines track by $index">{{line.separator ? '' : line.num}}</span>
                                            </div>
                                            <div class="cs-code-content">
                                                <div class="cs-code-line" ng-class="{'cs-sep': line.separator}" ng-repeat="line in match.lines track by $index"><span ng-if="!line.separator" ng-bind-html="ctrl.highlight(line.text)"></span></div>
                                            </div>
                                        </div>
                                        <pre class="cs-code-box" ng-if="!match.lines" ng-bind-html="ctrl.highlight(match.snippet)"></pre>
                                    </div>

                                    <!-- Inline Monaco Editor state (replaces code snippet) -->
                                    <div class="cs-inline-monaco-wrap" ng-if="match.expanded">
                                        <div class="cs-inline-monaco-loading" ng-if="match.loading">
                                            <svg class="cs-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12"/></svg>
                                            <span>Loading entire field…</span>
                                        </div>
                                        <div id="{{ctrl.getMonacoHostId(result, match, $index)}}" class="cs-inline-monaco-host" ng-show="!match.loading"></div>
                                    </div>
                                </div>
                            </div>
                        </article>
                    </div>
                </div>
            </main>
        </div>

        <!-- Table Configuration Drawer -->
        <div class="cs-drawer-backdrop" ng-if="ctrl.editing" ng-click="ctrl.closeConfig()">
            <section class="cs-drawer" ng-click="$event.stopPropagation()">
                <header class="cs-drawer-head">
                    <div>
                        <h2>{{ctrl.editing.label}}</h2>
                        <div class="cs-table-id">{{ctrl.editing.table}}</div>
                    </div>
                    <button type="button" class="btn btn-icon" ng-click="ctrl.closeConfig()" aria-label="Close drawer">
                        <span class="icon-connect-close"></span>
                    </button>
                </header>

                <div class="cs-drawer-body">
                    <div class="cs-form-group">
                        <label class="cs-form-label" for="fields-select">Search Fields</label>
                        <div class="cs-select2-wrap">
                            <input type="hidden" id="fields-select" cs-select2-fields="" ng-model="ctrl.draft.searchFields" placeholder="Select fields to search…" />
                        </div>
                        <p class="cs-help" ng-if="ctrl.loadingFields">
                            <svg class="cs-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12"/></svg>
                            <span>Loading available fields for {{ctrl.editing.table}}…</span>
                        </p>
                        <p class="cs-help" ng-if="!ctrl.loadingFields">Select valid fields on <code ng-bind="ctrl.editing.table"></code> containing source code.</p>
                    </div>

                    <div class="cs-form-group">
                        <label class="cs-form-label" for="filter-input">Additional Filter (Encoded Query)</label>
                        <textarea id="filter-input" class="cs-textarea" ng-model="ctrl.draft.additionalFilter"></textarea>
                        <p class="cs-help">Applied to pre-filter records before searching code fields.</p>
                    </div>

                    <div>
                        <button type="button" class="btn btn-default" ng-click="ctrl.validateFilter()" ng-disabled="ctrl.validating">
                            <svg ng-if="ctrl.validating" class="cs-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12"/></svg>
                            <span>{{ctrl.validating ? 'Testing…' : 'Test Filter Query'}}</span>
                        </button>
                    </div>

                    <div class="alert alert-success" ng-if="ctrl.validation.ok">
                        <span ng-if="ctrl.validation.matchCount &lt; 0 || !ctrl.validation.listUrl">{{ctrl.validation.message}}</span>
                        <span ng-if="ctrl.validation.matchCount >= 0 &amp;&amp; ctrl.validation.listUrl">Filter is valid (<a class="cs-filter-match-link" ng-href="{{ctrl.validation.listUrl}}" target="_blank" title="Open the list view for this table with this filter applied">{{ctrl.validation.matchCount}} record{{ctrl.validation.matchCount === 1 ? '' : 's'}} match</a>)</span>
                    </div>

                    <div class="alert alert-danger" ng-if="ctrl.validation.error">
                        <span>{{ctrl.validation.error}}</span>
                    </div>
                </div>

                <footer class="cs-drawer-foot">
                    <button type="button" class="btn btn-default" ng-click="ctrl.saveConfig()" ng-disabled="!ctrl.editing.canWrite || ctrl.saving" title="{{ctrl.editing.canWrite ? 'Update Code Search Table configuration' : 'Write access required to update configuration'}}">
                        <svg ng-if="ctrl.saving" class="cs-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12"/></svg>
                        <span>{{ctrl.saving ? 'Updating…' : 'Update Code Search Table'}}</span>
                    </button>
                    <button type="button" class="btn btn-primary" ng-click="ctrl.applyConfig()">Apply for session</button>
                </footer>
            </section>
        </div>

        <!-- Notification Toast -->
        <div class="cs-toast" ng-if="ctrl.toast">{{ctrl.toast}}</div>
    </div>
</j:jelly>`,
    clientScript: `(function () {
    'use strict';

    function _initAngular() {
        if (typeof angular === 'undefined') {
            return;
        }

        var codeSearchApp = angular.module('codeSearchApp', []);

        codeSearchApp.directive('csSelect2Fields', ['$timeout', function ($timeout) {
            return {
                restrict: 'A',
                link: function (scope, el) {
                    var $jq = (typeof $j !== 'undefined') ? $j : (typeof jQuery !== 'undefined' ? jQuery : null);
                    if (!$jq || !$jq.fn || !$jq.fn.select2) {
                        return;
                    }
                    var $el = $jq(el[0]);
                    var ctrl = scope.ctrl;
                    var isInitialized = false;

                    function buildFieldData() {
                        var fields = (ctrl && ctrl.currentTableFields) || [];
                        return fields.map(function (f) {
                            return {
                                id: f.id,
                                text: f.text || (f.label ? (f.label + ' (' + f.id + ')') : f.id)
                            };
                        });
                    }

                    function updateSelect2Val() {
                        if (!isInitialized) return;
                        var raw = (ctrl && ctrl.draft && ctrl.draft.searchFields) || '';
                        var arr = raw ? raw.split(',').map(function (s) { return s.trim(); }).filter(Boolean) : [];
                        $el.select2('val', arr);
                    }

                    function initSelect2() {
                        var data = buildFieldData();
                        if (!data.length) return;

                        try {
                            $el.select2('destroy');
                        } catch (e) {}

                        $el.select2({
                            multiple: true,
                            placeholder: 'Select code search fields…',
                            data: data,
                            dropdownCssClass: 'cs-fields-picker-drop',
                            width: '100%',
                            initSelection: function (element, callback) {
                                var val = element.val();
                                var selected = [];
                                if (val) {
                                    var map = {};
                                    data.forEach(function (d) { map[d.id] = d; });
                                    val.split(',').forEach(function (id) {
                                        var trimmed = id.trim();
                                        if (trimmed && map[trimmed]) {
                                            selected.push(map[trimmed]);
                                        }
                                    });
                                }
                                callback(selected);
                            }
                        });

                        isInitialized = true;
                        updateSelect2Val();

                        $el.off('change.csFields').on('change.csFields', function () {
                            var val = $el.select2('val');
                            var arr = Array.isArray(val) ? val.filter(Boolean) : [];
                            var csv = arr.join(',');
                            if (ctrl && ctrl.draft && ctrl.draft.searchFields !== csv) {
                                scope.$apply(function () {
                                    ctrl.draft.searchFields = csv;
                                    if (ctrl.validation && ctrl.validation.error) {
                                        ctrl.validation.error = '';
                                    }
                                });
                            }
                        });
                    }

                    var initVal = (ctrl && ctrl.draft && ctrl.draft.searchFields) || '';
                    $el.val(initVal);

                    scope.$watchCollection('ctrl.currentTableFields', function (fields) {
                        if (fields && fields.length) {
                            $timeout(initSelect2, 0);
                        }
                    });

                    scope.$watch('ctrl.draft.searchFields', function (newVal, oldVal) {
                        if (newVal !== oldVal) {
                            updateSelect2Val();
                        }
                    });

                    scope.$on('$destroy', function () {
                        try {
                            $el.off('.csFields');
                            $el.select2('destroy');
                        } catch (e) {}
                    });
                }
            };
        }]);

        codeSearchApp.controller('CodeSearchController', ['$scope', '$sce', '$timeout', '$q', function ($scope, $sce, $timeout, $q) {
            var vm = this;
            vm.groups = [];
            vm.tables = [];
            vm.results = [];
            vm.groupedResults = [];
            vm.sortedResults = [];
            vm.tablesWithResults = [];
            vm.filteredConfigTables = [];
            vm.query = '';
            vm.secondaryFilters = [];
            vm.loading = false;
            vm.hasSearched = false;
            vm.searchedTables = 0;
            vm.elapsed = null;
            vm.editing = null;
            vm.draft = {};
            vm.validation = {};
            vm.toast = '';
            vm.tableFilter = '';
            vm.selectedGroupId = '';
            vm.selectedGroup = null;
            vm.viewMode = 'group_table';
            vm.tableMatchCounts = {};
            vm.tableActiveFields = {};
            vm.fieldsCache = {};
            vm.loadingFields = false;
            vm.currentTableFields = [];
            vm.caseSensitive = false;
            vm.activeOnly = true;
            // Table whose results section is currently scrolled to the top of the results pane.
            vm.currentViewedTable = null;

            var currentSearchGen = 0;
            vm.searchProgress = {
                completed: 0,
                total: 0,
                percent: 0,
                currentTable: ''
            };

            // Sidebar Panes State
            vm.paneGroupOpen = true;
            vm.paneResultsOpen = false;

            function _updateTablesWithResults() {
                if (!vm.hasSearched) {
                    vm.tablesWithResults = [];
                    return;
                }
                vm.tablesWithResults = (vm.tables || []).filter(function (t) {
                    return (vm.tableMatchCounts[t.table] || 0) > 0;
                });
            }

            function _updateFilteredConfigTables() {
                var list = vm.tables || [];
                if (vm.tableFilter) {
                    var q = vm.tableFilter.toLowerCase();
                    list = list.filter(function (t) {
                        return (t.label && t.label.toLowerCase().indexOf(q) > -1) ||
                               (t.table && t.table.toLowerCase().indexOf(q) > -1);
                    });
                }
                vm.filteredConfigTables = list;
            }

            function _fieldIsActive(table, field) {
                var active = vm.tableActiveFields[table];
                return !active || active[field] !== false;
            }

            function _applyVisibleMatches(r) {
                r.visibleMatches = (r.matches || []).filter(function (m) {
                    return _fieldIsActive(r.table, m.field);
                });
                return r.visibleMatches.length > 0;
            }

            function _computeGroupFields(records) {
                var seen = {};
                var fields = [];
                records.forEach(function (r) {
                    (r.matches || []).forEach(function (m) {
                        if (!seen[m.field]) {
                            seen[m.field] = true;
                            fields.push({ field: m.field, label: m.fieldLabel || m.field });
                        }
                    });
                });
                return fields;
            }

            function _ensureActiveFieldDefaults(table, fields) {
                if (!vm.tableActiveFields[table]) {
                    vm.tableActiveFields[table] = {};
                }
                var active = vm.tableActiveFields[table];
                fields.forEach(function (f) {
                    if (!(f.field in active)) active[f.field] = true;
                });
            }

            function _applyFieldFilter(group) {
                group.records = (group.allRecords || []).filter(_applyVisibleMatches);
            }

            function _updateGroupedResults() {
                var items = vm.results || [];
                var groupsMap = {};
                var order = [];
                items.forEach(function (r) {
                    if (!groupsMap[r.table]) {
                        groupsMap[r.table] = {
                            table: r.table,
                            tableLabel: r.tableLabel,
                            allRecords: [],
                            records: [],
                            fields: []
                        };
                        order.push(r.table);
                    }
                    groupsMap[r.table].allRecords.push(r);
                });
                order.sort(function (a, b) {
                    return (groupsMap[a].tableLabel || a).localeCompare(groupsMap[b].tableLabel || b);
                });
                order.forEach(function (t) {
                    var group = groupsMap[t];
                    group.allRecords.sort(function (a, b) {
                        var valA = String(a.displayValue || '');
                        var valB = String(b.displayValue || '');
                        var comp = valA.localeCompare(valB, undefined, { sensitivity: 'base', numeric: true });
                        if (comp !== 0) return comp;
                        return valA.localeCompare(valB);
                    });
                    group.fields = _computeGroupFields(group.allRecords);
                    _ensureActiveFieldDefaults(t, group.fields);
                    _applyFieldFilter(group);
                });
                vm.groupedResults = order.map(function (t) { return groupsMap[t]; });
            }

            function _updateSortedResults() {
                var items = (vm.results || []).filter(_applyVisibleMatches);
                if (vm.viewMode === 'date_asc') {
                    items.sort(function (a, b) {
                        var da = a.updatedOn ? new Date(a.updatedOn.replace(' ', 'T') + 'Z').getTime() : 0;
                        var db = b.updatedOn ? new Date(b.updatedOn.replace(' ', 'T') + 'Z').getTime() : 0;
                        return da - db;
                    });
                } else if (vm.viewMode === 'date_desc') {
                    items.sort(function (a, b) {
                        var da = a.updatedOn ? new Date(a.updatedOn.replace(' ', 'T') + 'Z').getTime() : 0;
                        var db = b.updatedOn ? new Date(b.updatedOn.replace(' ', 'T') + 'Z').getTime() : 0;
                        return db - da;
                    });
                }
                vm.sortedResults = items;
            }

            // Tracks which table's section has scrolled to the top of the results pane,
            // so the sidebar's "tables with results" list can highlight it.
            function _updateCurrentViewedTable() {
                if (vm.viewMode !== 'group_table' || !vm.hasSearched) {
                    vm.currentViewedTable = null;
                    return;
                }
                var container = document.getElementById('cs-results-container');
                var sections = container ? container.querySelectorAll('.cs-table-group') : [];
                if (!sections.length) {
                    vm.currentViewedTable = null;
                    return;
                }
                var containerTop = container.getBoundingClientRect().top;
                var current = sections[0].getAttribute('data-table');
                for (var i = 0; i < sections.length; i++) {
                    if (sections[i].getBoundingClientRect().top - containerTop > 4) break;
                    current = sections[i].getAttribute('data-table');
                }
                vm.currentViewedTable = current;
            }

            function _bindResultsScrollSpy() {
                var container = document.getElementById('cs-results-container');
                if (!container) return;
                var ticking = false;
                container.addEventListener('scroll', function () {
                    if (ticking) return;
                    ticking = true;
                    window.requestAnimationFrame(function () {
                        ticking = false;
                        if ($scope.$$phase) {
                            _updateCurrentViewedTable();
                        } else {
                            $scope.$apply(_updateCurrentViewedTable);
                        }
                    });
                }, { passive: true });
            }

            vm.togglePane = function (pane) {
                if (pane === 'group') {
                    vm.paneGroupOpen = !vm.paneGroupOpen;
                } else if (pane === 'results') {
                    if (!vm.hasSearched) return;
                    vm.paneResultsOpen = !vm.paneResultsOpen;
                }
            };

            vm.getTablesWithResults = function () {
                return vm.tablesWithResults;
            };

            vm.tablesWithResultsCount = function () {
                return (vm.tablesWithResults || []).length;
            };

            vm.getTableSearchFieldsDisplay = function (table) {
                if (!table) return '';
                var val = table.searchFields || table.search_fields;
                if (!val) return '';
                var raw = Array.isArray(val) ? val.join(',') : String(val);
                return raw.split(',')
                    .map(function (f) { return f.trim(); })
                    .filter(Boolean)
                    .join(', ');
            };

            vm.getSortedResults = function () {
                return vm.sortedResults;
            };

            $scope.$watch('ctrl.tableFilter', function () {
                _updateFilteredConfigTables();
            });

            $scope.$watch('ctrl.viewMode', function () {
                _updateSortedResults();
                $timeout(_updateCurrentViewedTable);
            });

            vm.clearInput = function () {
                vm.query = '';
                vm.clearResults();
            };

            vm.showAdvanced = function () {
                if (!vm.secondaryFilters.length) {
                    vm.addSecondaryFilter(-1, 'and');
                }
            };

            function _lastOrChainIndex(afterIndex) {
                // Find the end of any contiguous run of OR-joined rows immediately
                // following afterIndex, so a new condition lands after the whole group
                // rather than splitting it.
                var idx = afterIndex;
                while (idx + 1 < vm.secondaryFilters.length && vm.secondaryFilters[idx + 1].joiner === 'or') {
                    idx++;
                }
                return idx;
            }

            vm.addSecondaryFilter = function (afterIndex, joiner) {
                if (vm.secondaryFilters.length >= 20) return;
                var row = { operator: 'contains', term: '', joiner: joiner === 'or' ? 'or' : 'and' };
                if (afterIndex < 0) {
                    vm.secondaryFilters.push(row);
                } else {
                    vm.secondaryFilters.splice(_lastOrChainIndex(afterIndex) + 1, 0, row);
                }
            };

            vm.removeSecondaryFilter = function (index) {
                vm.secondaryFilters.splice(index, 1);
            };

            vm.formatElapsed = function (ms) {
                if (!ms && ms !== 0) return '';
                var sec = ms / 1000;
                return (sec < 10 ? sec.toFixed(2) : sec.toFixed(1)) + ' s';
            };

            vm.onOptionChange = function () {
                if (vm.hasSearched && vm.query && vm.query.trim()) {
                    vm.runSearch();
                }
            };

            function updateUrlParam(term) {
                try {
                    var url = new URL(window.location.href);
                    if (term) {
                        url.searchParams.set('q', term);
                        if (vm.caseSensitive) url.searchParams.set('case', '1');
                        else url.searchParams.delete('case');
                        if (vm.activeOnly) url.searchParams.set('active', '1');
                        else url.searchParams.set('active', '0');
                    } else {
                        url.searchParams.delete('q');
                        url.searchParams.delete('case');
                        url.searchParams.delete('active');
                    }
                    window.history.replaceState({}, '', url.toString());

                    if (window.top && window.top !== window) {
                        try {
                            var topUrl = new URL(window.top.location.href);
                            if (topUrl.pathname.indexOf('/now/nav/ui/classic/params/target/') > -1) {
                                var targetPath = url.pathname + url.search + url.hash;
                                var newTop = '/now/nav/ui/classic/params/target/' + encodeURIComponent(targetPath.substring(1));
                                window.top.history.replaceState({}, '', newTop);
                            } else if (topUrl.searchParams.has('uri')) {
                                var targetUri = url.pathname + url.search + url.hash;
                                topUrl.searchParams.set('uri', targetUri);
                                window.top.history.replaceState({}, '', topUrl.toString());
                            }
                        } catch (eTop) {}
                    }
                } catch (e) {}
            }

            var initialParams = new URLSearchParams(window.location.search);
            var urlQuery = initialParams.get('q') || initialParams.get('query') || '';
            var urlCase = initialParams.get('case');
            if (urlCase === '1' || urlCase === 'true') vm.caseSensitive = true;
            var urlActive = initialParams.get('active');
            if (urlActive === '0' || urlActive === 'false') {
                vm.activeOnly = false;
            } else if (urlActive === '1' || urlActive === 'true') {
                vm.activeOnly = true;
            }

            if (!urlQuery && window.top && window.top !== window) {
                try {
                    var topPath = window.top.location.pathname;
                    var marker = '/now/nav/ui/classic/params/target/';
                    var markerIdx = topPath.indexOf(marker);
                    if (markerIdx > -1) {
                        var encodedTarget = topPath.substring(markerIdx + marker.length);
                        var decodedTarget = decodeURIComponent(encodedTarget);
                        var topTargetParams = new URLSearchParams(decodedTarget.indexOf('?') > -1 ? decodedTarget.split('?')[1] : '');
                        urlQuery = topTargetParams.get('q') || topTargetParams.get('query') || '';
                        var topCase = topTargetParams.get('case');
                        if (topCase === '1' || topCase === 'true') vm.caseSensitive = true;
                        var topActive = topTargetParams.get('active');
                        if (topActive === '0' || topActive === 'false') {
                            vm.activeOnly = false;
                        } else if (topActive === '1' || topActive === 'true') {
                            vm.activeOnly = true;
                        }
                    }
                } catch (eTop) {}
            }
            if (urlQuery) {
                vm.query = urlQuery;
            }

            function notify(msg) {
                vm.toast = msg;
                $timeout(function () {
                    if (vm.toast === msg) vm.toast = '';
                }, 3000);
            }

            function ajax(action, params) {
                var deferred = $q.defer();
                var ga = new GlideAjax('WidgetEditorCodeSearchAjax');
                ga.addParam('sysparm_name', action);
                if (params) {
                    Object.keys(params).forEach(function (k) {
                        var val = params[k] != null ? String(params[k]) : '';
                        ga.addParam(k, val);
                        ga.addParam('sysparm_' + k, val);
                    });
                }
                ga.getXML(function (response) {
                    var answer = response && response.responseXML && response.responseXML.documentElement
                        ? response.responseXML.documentElement.getAttribute('answer')
                        : null;
                    try {
                        var parsed = JSON.parse(answer || '{}');
                        $timeout(function () {
                            if (parsed && parsed.success) {
                                deferred.resolve(parsed);
                            } else {
                                deferred.reject(new Error((parsed && parsed.error) || 'Request failed'));
                            }
                        });
                    } catch (e) {
                        $timeout(function () { deferred.reject(e); });
                    }
                });
                return deferred.promise;
            }

            function _selectGroup(groupId) {
                var match = groupId && vm.groups.filter(function (g) { return g.sysId === groupId; })[0];
                vm.selectedGroup = match || vm.groups[0];
                vm.selectedGroupId = vm.selectedGroup.sysId;
                vm.loadTables();
            }

            vm.loadGroups = function () {
                ajax('getGroups').then(function (data) {
                    vm.groups = data.groups || [];
                    if (vm.groups.length > 0) {
                        ajax('getLastSearchGroup').then(function (prefData) {
                            _selectGroup(prefData && prefData.groupId);
                        }).catch(function () {
                            _selectGroup(null);
                        });
                    }
                }).catch(function (e) {
                    notify('Could not load search groups: ' + e.message);
                });
            };

            vm.onGroupChange = function () {
                for (var i = 0; i < vm.groups.length; i++) {
                    if (vm.groups[i].sysId === vm.selectedGroupId) {
                        vm.selectedGroup = vm.groups[i];
                        break;
                    }
                }
                vm.loadTables();
                ajax('saveLastSearchGroup', { group_id: vm.selectedGroupId }).catch(function () {});
            };

            vm.loadTables = function () {
                if (!vm.selectedGroupId) return;
                ajax('getGroupTables', { group_id: vm.selectedGroupId }).then(function (data) {
                    vm.tables = (data.tables || []).map(function (t) {
                        t.enabled = true;
                        t.searchFieldsDisplay = (t.searchFields || t.search_fields || '').split(',').map(function (f) { return f.trim(); }).filter(Boolean).join(', ');
                        return t;
                    });
                    // Sort alphabetical by label
                    vm.tables.sort(function (a, b) {
                        return (a.label || a.table).localeCompare(b.label || b.table);
                    });
                    vm.tableMatchCounts = {};
                    vm.tableActiveFields = {};
                    vm.editing = null;
                    _updateFilteredConfigTables();
                    _updateTablesWithResults();
                    if (vm.query && !vm.hasSearched) {
                        vm.runSearch();
                    }
                }).catch(function (e) {
                    notify('Could not load tables: ' + e.message);
                });
            };

            vm.visibleTables = function () {
                var list = vm.tables;
                if (vm.hasSearched) {
                    list = list.filter(function (t) {
                        return (vm.tableMatchCounts[t.table] || 0) > 0;
                    });
                } else if (vm.tableFilter) {
                    var q = vm.tableFilter.toLowerCase();
                    list = list.filter(function (t) {
                        return (t.label && t.label.toLowerCase().indexOf(q) > -1) ||
                               (t.table && t.table.toLowerCase().indexOf(q) > -1);
                    });
                }
                return list;
            };

            vm.enabledCount = function () {
                return vm.tables.filter(function (t) { return t.enabled; }).length;
            };

            vm.selectAllTables = function (state) {
                vm.tables.forEach(function (t) { t.enabled = state; });
            };

            vm.toggleTable = function (table) {
                if (table) {
                    table.enabled = !table.enabled;
                }
            };

            vm.onTableClick = function (table) {
                if (vm.hasSearched) {
                    vm.scrollToTable(table.table);
                } else {
                    vm.openConfig(table);
                }
            };

            var tableScrollRequest = 0;
            vm.scrollToTable = function (tableName) {
                var request = ++tableScrollRequest;
                vm.viewMode = 'group_table';
                function doScroll(attempts) {
                    if (request !== tableScrollRequest || vm.viewMode !== 'group_table') return;
                    var container = document.getElementById('cs-results-container');
                    var el = document.getElementById('table-group-' + tableName);
                    // Angular may still be replacing the date-sorted view with table groups.
                    if (!container || !el || !container.contains(el) || !el.getClientRects().length || !container.clientHeight) {
                        if (attempts > 0) {
                            $timeout(function () { doScroll(attempts - 1); }, 50);
                        }
                        return;
                    }

                    vm.currentViewedTable = tableName;
                    var containerRect = container.getBoundingClientRect();
                    var elRect = el.getBoundingClientRect();
                    var visibleTop = containerRect.top + container.clientTop;
                    var visibleBottom = visibleTop + container.clientHeight;
                    var heading = el.querySelector('.cs-table-group-sticky') || el.querySelector('.cs-table-group-head');
                    var headingHeight = heading ? heading.getBoundingClientRect().height : 0;
                    // Measure the section's natural position: its sticky heading may be
                    // visible even when the start of the table is above the results pane.
                    if (elRect.top < visibleTop || elRect.top + headingHeight > visibleBottom) {
                        var offset = container.scrollTop + elRect.top - visibleTop - 10;
                        var top = Math.max(0, Math.min(offset, container.scrollHeight - container.clientHeight));
                        // ServiceNow's Prototype extensions shadow element.scrollTo with
                        // a page-scrolling helper. Call the browser method directly instead.
                        var nativeScrollTo = window.Element && window.Element.prototype.scrollTo;
                        if (typeof nativeScrollTo === 'function') {
                            try {
                                nativeScrollTo.call(container, { top: top, behavior: 'smooth' });
                            } catch (e) {
                                container.scrollTop = top;
                            }
                        } else {
                            container.scrollTop = top;
                        }
                    }
                }
                $timeout(function () { doScroll(8); });
            };

            vm.openConfig = function (table) {
                vm.editing = table;
                vm.draft = {
                    searchFields: table.searchFields,
                    additionalFilter: table.additionalFilter
                };
                vm.validation = {};
                vm.currentTableFields = [];

                if (vm.fieldsCache[table.table]) {
                    vm.currentTableFields = vm.fieldsCache[table.table];
                } else {
                    vm.loadingFields = true;
                    ajax('getTableFields', { table: table.table })
                        .then(function (data) {
                            vm.loadingFields = false;
                            var fields = (data && data.fields) || [];
                            vm.fieldsCache[table.table] = fields;
                            if (vm.editing && vm.editing.table === table.table) {
                                vm.currentTableFields = fields;
                            }
                        })
                        .catch(function (e) {
                            vm.loadingFields = false;
                            vm.validation = { error: 'Failed to load table fields: ' + e.message };
                        });
                }
            };

            vm.closeConfig = function () {
                vm.editing = null;
                vm.currentTableFields = [];
                vm.validation = {};
            };

            vm.applyConfig = function () {
                if (!vm.editing) return;
                var raw = (vm.draft.searchFields || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
                if (!raw.length) {
                    vm.validation = { error: 'At least one valid search field is required.' };
                    return;
                }
                var validFields = vm.fieldsCache[vm.editing.table] || vm.currentTableFields || [];
                if (validFields.length > 0) {
                    var validMap = {};
                    validFields.forEach(function (f) { validMap[f.id] = true; });
                    for (var i = 0; i < raw.length; i++) {
                        if (!validMap[raw[i]]) {
                            vm.validation = { error: 'Field "' + raw[i] + '" does not exist on table ' + vm.editing.table + '.' };
                            return;
                        }
                    }
                }
                vm.editing.searchFields = raw.join(',');
                vm.editing.searchFieldsDisplay = raw.join(', ');
                vm.editing.additionalFilter = vm.draft.additionalFilter;
                vm.closeConfig();
                notify('Filter applied for this search session');
            };

            vm.validateFilter = function () {
                if (!vm.editing) return;
                vm.validating = true;
                vm.validation = {};
                ajax('validateFilter', {
                    config_id: vm.editing.sysId,
                    filter: vm.draft.additionalFilter || ''
                }).then(function (data) {
                    vm.validation = {
                        ok: true,
                        message: data.message || 'Filter is valid.',
                        matchCount: data.matchCount,
                        listUrl: data.listUrl
                    };
                    vm.validating = false;
                }).catch(function (e) {
                    vm.validation = { error: e.message };
                    vm.validating = false;
                });
            };

            vm.saveConfig = function () {
                if (!vm.editing) return;
                var raw = (vm.draft.searchFields || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
                if (!raw.length) {
                    vm.validation = { error: 'At least one valid search field is required.' };
                    return;
                }
                var validFields = vm.fieldsCache[vm.editing.table] || vm.currentTableFields || [];
                if (validFields.length > 0) {
                    var validMap = {};
                    validFields.forEach(function (f) { validMap[f.id] = true; });
                    for (var i = 0; i < raw.length; i++) {
                        if (!validMap[raw[i]]) {
                            vm.validation = { error: 'Field "' + raw[i] + '" does not exist on table ' + vm.editing.table + '.' };
                            return;
                        }
                    }
                }
                vm.saving = true;
                ajax('saveTableConfig', {
                    config_id: vm.editing.sysId,
                    search_fields: raw.join(','),
                    filter: vm.draft.additionalFilter || ''
                }).then(function (data) {
                    vm.editing.searchFields = data.searchFields;
                    vm.editing.searchFieldsDisplay = (data.searchFields || '').split(',').map(function (f) { return f.trim(); }).filter(Boolean).join(', ');
                    vm.editing.additionalFilter = data.additionalFilter;
                    vm.saving = false;
                    vm.closeConfig();
                    notify('Code Search Table updated');
                }).catch(function (e) {
                    vm.saving = false;
                    vm.validation = { error: e.message };
                });
            };

            vm.onSearchSubmit = function () {
                vm.runSearch();
            };

            vm.runSearch = function () {
                if (!vm.selectedGroupId || !vm.query.trim()) return;
                if (vm.secondaryFilters.some(function (filter) { return !filter.term.trim(); })) {
                    notify('Enter a term for each secondary filter or remove the empty row.');
                    return;
                }
                ++tableScrollRequest;
                var resultsContainer = document.getElementById('cs-results-container');
                if (resultsContainer) resultsContainer.scrollTop = 0;
                _disposeAllEditors();
                updateUrlParam(vm.query.trim());

                var enabledTables = (vm.tables || []).filter(function (t) { return t.enabled; });
                var total = enabledTables.length;
                if (!total) {
                    notify('No tables are enabled for search.');
                    return;
                }

                var gen = ++currentSearchGen;
                var started = Date.now();
                vm.loading = true;
                vm.hasSearched = true;
                vm.results = [];
                vm.tableMatchCounts = {};
                vm.tableActiveFields = {};
                vm.searchedTables = 0;
                vm.searchProgress = {
                    completed: 0,
                    total: total,
                    percent: 0,
                    currentTable: enabledTables[0].label || enabledTables[0].table
                };
                _updateTablesWithResults();
                _updateGroupedResults();
                _updateSortedResults();

                var poolConcurrency = Math.min(3, total);
                var nextIndex = 0;
                var completedCount = 0;
                var accumulatedResults = [];
                var allSkipped = [];

                function searchNext() {
                    if (currentSearchGen !== gen) return $q.when();
                    if (nextIndex >= total) return $q.when();
                    var table = enabledTables[nextIndex++];
                    var overrides = {};
                    overrides[table.sysId] = {
                        enabled: true,
                        searchFields: table.searchFields,
                        additionalFilter: table.additionalFilter
                    };

                    vm.searchProgress.currentTable = table.label || table.table;

                    return ajax('search', {
                        group_id: vm.selectedGroupId,
                        table_config_id: table.sysId,
                        query: vm.query,
                        secondary_filters: JSON.stringify(vm.secondaryFilters),
                        overrides: JSON.stringify(overrides),
                        case_sensitive: vm.caseSensitive ? 'true' : 'false',
                        active_only: vm.activeOnly ? 'true' : 'false'
                    }).then(function (data) {
                        if (currentSearchGen !== gen) return;
                        completedCount++;
                        vm.searchedTables = completedCount;
                        vm.searchProgress.completed = completedCount;
                        vm.searchProgress.percent = Math.round((completedCount / total) * 100);

                        var tableResults = (data && data.results) || [];
                        tableResults.forEach(function (r) {
                            if (r && (!r.url || r.url.indexOf('/nav_to.do?uri=') !== 0)) {
                                r.url = '/nav_to.do?uri=' + encodeURIComponent((r.table || table.table) + '.do?sys_id=' + r.sysId);
                            }
                        });
                        if (tableResults.length > 0) {
                            vm.tableMatchCounts[table.table] = tableResults.length;
                            accumulatedResults = accumulatedResults.concat(tableResults);
                            vm.results = accumulatedResults;
                            _updateTablesWithResults();
                            _updateGroupedResults();
                        }
                        if (data && data.skipped && data.skipped.length) {
                            allSkipped = allSkipped.concat(data.skipped);
                        }

                        if (nextIndex < total) {
                            return searchNext();
                        }
                    }).catch(function () {
                        if (currentSearchGen !== gen) return;
                        completedCount++;
                        vm.searchedTables = completedCount;
                        vm.searchProgress.completed = completedCount;
                        vm.searchProgress.percent = Math.round((completedCount / total) * 100);
                        if (nextIndex < total) {
                            return searchNext();
                        }
                    });
                }

                var workers = [];
                for (var w = 0; w < poolConcurrency; w++) {
                    workers.push(searchNext());
                }

                $q.all(workers).then(function () {
                    if (currentSearchGen !== gen) return;
                    vm.results = accumulatedResults;
                    vm.elapsed = Date.now() - started;
                    vm.loading = false;
                    vm.searchProgress.percent = 100;
                    _updateTablesWithResults();
                    _updateGroupedResults();
                    _updateSortedResults();
                    vm.paneResultsOpen = true;
                    vm.paneGroupOpen = false;
                    $timeout(_updateCurrentViewedTable);
                    if (allSkipped.length) {
                        notify(allSkipped.length + ' table configuration(s) skipped');
                    }
                }).catch(function (e) {
                    if (currentSearchGen !== gen) return;
                    vm.loading = false;
                    notify(e ? e.message : 'Search encountered an error');
                });
            };

            vm.formatDate = function (dateStr) {
                if (!dateStr) return '';
                var s = String(dateStr).trim();
                var iso = s.replace(' ', 'T');
                if (!iso.endsWith('Z') && !iso.includes('+')) iso += 'Z';
                var d = new Date(iso);
                if (isNaN(d.getTime())) d = new Date(s);
                if (isNaN(d.getTime())) return dateStr;
                return d.toLocaleString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                });
            };

            vm.getGroupedResults = function () {
                return vm.groupedResults;
            };

            // At least one field must stay included, so results are never entirely hidden.
            vm.isLastActiveField = function (group, field) {
                var active = vm.tableActiveFields[group.table];
                if (!active || active[field] === false) return false;
                var activeCount = (group.fields || []).filter(function (f) {
                    return active[f.field] !== false;
                }).length;
                return activeCount <= 1;
            };

            vm.toggleGroupField = function (group, field) {
                var active = vm.tableActiveFields[group.table];
                if (!active) return;
                if (vm.isLastActiveField(group, field)) return;
                active[field] = active[field] === false;
                _applyFieldFilter(group);
                _updateSortedResults();
            };

            function _fieldsOrClause(fields, operator, value) {
                return fields.map(function (f) { return f + operator + value; }).join('^OR');
            }

            // Builds a nav_to.do link to the table's list view scoped to only the toggled-on
            // fields for the primary term, plus the advanced AND/OR conditions applied the
            // same way the search itself evaluates them (left to right, no precedence
            // grouping). DOES NOT CONTAIN conditions are ANDed across fields (a record must be
            // missing the term from every field), which can't be flattened into the OR chain
            // when it follows an OR joiner — in that rare case it's ANDed in instead.
            vm.getGroupListUrl = function (group) {
                if (!vm.query) return null;
                var activeFields = (group.fields || [])
                    .filter(function (f) { return _fieldIsActive(group.table, f.field); })
                    .map(function (f) { return f.field; });
                if (!activeFields.length) return null;

                var tableCfg = null;
                for (var i = 0; i < (vm.tables || []).length; i++) {
                    if (vm.tables[i].table === group.table) { tableCfg = vm.tables[i]; break; }
                }
                var allFields = tableCfg && tableCfg.searchFields
                    ? String(tableCfg.searchFields).split(',').map(function (s) { return s.trim(); }).filter(Boolean)
                    : activeFields;

                var primaryClause = _fieldsOrClause(activeFields, 'LIKE', vm.query);
                var segments = [{ pieces: primaryClause ? [primaryClause] : [] }];

                (vm.secondaryFilters || []).forEach(function (filter, idx) {
                    if (!filter || !filter.term) return;
                    var fields = allFields.length ? allFields : activeFields;
                    var joiner = idx === 0 ? 'and' : (filter.joiner === 'or' ? 'or' : 'and');
                    if (filter.operator === 'not_contains') {
                        var andClause = fields.map(function (f) { return f + 'NOTLIKE' + filter.term; }).join('^');
                        segments.push({ pieces: [andClause] });
                    } else {
                        var orClause = _fieldsOrClause(fields, 'LIKE', filter.term);
                        if (joiner === 'or' && segments.length) {
                            segments[segments.length - 1].pieces.push(orClause);
                        } else {
                            segments.push({ pieces: [orClause] });
                        }
                    }
                });

                var encodedQuery = segments
                    .map(function (seg) { return seg.pieces.join('^OR'); })
                    .filter(Boolean)
                    .join('^');

                if (tableCfg && tableCfg.additionalFilter) {
                    encodedQuery = tableCfg.additionalFilter + (encodedQuery ? '^' + encodedQuery : '');
                }

                var listPath = group.table + '_list.do' + (encodedQuery ? '?sysparm_query=' + encodedQuery : '');
                return '/nav_to.do?uri=' + encodeURIComponent(listPath);
            };

            vm.clearResults = function () {
                currentSearchGen++;
                _disposeAllEditors();
                vm.results = [];
                vm.tableMatchCounts = {};
                vm.tableActiveFields = {};
                vm.hasSearched = false;
                vm.loading = false;
                vm.elapsed = null;
                vm.paneResultsOpen = false;
                vm.paneGroupOpen = true;
                vm.searchProgress = {
                    completed: 0,
                    total: 0,
                    percent: 0,
                    currentTable: ''
                };
                _updateTablesWithResults();
                _updateGroupedResults();
                _updateSortedResults();
                updateUrlParam('');
            };

            var _highlightCache = {};
            var _highlightCacheKey = '';

            vm.highlight = function (text) {
                function esc(v) {
                    var div = document.createElement('div');
                    div.textContent = String(v || '');
                    return div.innerHTML;
                }
                var raw = String(text || '');
                var needle = String(vm.query || '');
                var cacheKey = needle + ' ' + (vm.caseSensitive ? '1' : '0');
                if (cacheKey !== _highlightCacheKey) {
                    _highlightCache = {};
                    _highlightCacheKey = cacheKey;
                }
                if (Object.prototype.hasOwnProperty.call(_highlightCache, raw)) {
                    return _highlightCache[raw];
                }

                var result;
                if (!needle) {
                    result = $sce.trustAsHtml(esc(raw));
                } else if (vm.caseSensitive) {
                    var out = '';
                    var pos = 0;
                    var at;
                    while ((at = raw.indexOf(needle, pos)) !== -1) {
                        out += esc(raw.substring(pos, at)) + '<mark class="cs-highlight">' + esc(raw.substring(at, at + needle.length)) + '</mark>';
                        pos = at + needle.length;
                    }
                    out += esc(raw.substring(pos));
                    result = $sce.trustAsHtml(out);
                } else {
                    var lower = raw.toLowerCase();
                    var find = needle.toLowerCase();
                    var out2 = '';
                    var pos2 = 0;
                    var at2;
                    while ((at2 = lower.indexOf(find, pos2)) !== -1) {
                        out2 += esc(raw.substring(pos2, at2)) + '<mark class="cs-highlight">' + esc(raw.substring(at2, at2 + needle.length)) + '</mark>';
                        pos2 = at2 + needle.length;
                    }
                    out2 += esc(raw.substring(pos2));
                    result = $sce.trustAsHtml(out2);
                }
                _highlightCache[raw] = result;
                return result;
            };

            function _disposeAllEditors() {
                if (vm.results && vm.results.length) {
                    vm.results.forEach(function (r) {
                        if (r.matches) {
                            r.matches.forEach(function (m) {
                                if (m._editor) {
                                    try { m._editor.dispose(); } catch (e) {}
                                    m._editor = null;
                                }
                                m.expanded = false;
                            });
                        }
                    });
                }
            }

            function _ensureMonacoWorker() {
                if (!window.MonacoEnvironment) {
                    window.MonacoEnvironment = {};
                }
                if (typeof window.MonacoEnvironment.getWorker === 'function') {
                    return;
                }
                var wb = '/scripts/snc-code-editor/';
                window.MonacoEnvironment.getWorker = function (workerId, label) {
                    var f;
                    if (label === 'typescript' || label === 'javascript') {
                        f = wb + 'ts.worker.bundle.min.jsx?sysparm_substitute=false';
                    } else if (label === 'css' || label === 'scss' || label === 'less') {
                        f = wb + 'css.worker.bundle.min.jsx?sysparm_substitute=false';
                    } else if (label === 'html' || label === 'handlebars') {
                        f = wb + 'html.worker.bundle.min.jsx?sysparm_substitute=false';
                    } else if (label === 'json') {
                        f = wb + 'json.worker.bundle.min.jsx?sysparm_substitute=false';
                    } else {
                        f = wb + 'editor.worker.bundle.min.jsx?sysparm_substitute=false';
                    }
                    var blob = new Blob(['importScripts(' + JSON.stringify(location.origin + f) + ')'], { type: 'application/javascript' });
                    return new Worker(URL.createObjectURL(blob));
                };
            }

            function _detectLanguage(fieldName, content) {
                var f = String(fieldName || '').toLowerCase();
                if (f.indexOf('template') > -1 || f.indexOf('html') > -1) return 'html';
                if (f.indexOf('css') > -1 || f.indexOf('scss') > -1) return 'css';
                if (f.indexOf('schema') > -1 || f.indexOf('json') > -1) return 'json';
                if (f.indexOf('xml') > -1) return 'xml';
                return 'javascript';
            }

            function _highlightQueryInEditor(editor, query, targetLine) {
                if (!editor || !query) return;
                var q = String(query).trim();
                if (!q) return;

                var matchCase = !!vm.caseSensitive;

                // 1. Configure Monaco FindController with search string & case sensitivity
                try {
                    var findController = editor.getContribution('editor.contrib.findController');
                    if (findController) {
                        findController.start({
                            forceRevealReplace: false,
                            seedSearchStringFromSelection: false,
                            shouldFocus: 0,
                            shouldAnimate: false
                        });
                        var state = findController.getState();
                        if (state) {
                            state.change({
                                searchString: q,
                                isRegex: false,
                                matchCase: matchCase,
                                wholeWord: false
                            }, false);
                        }
                    }
                } catch (efc) {}

                // 2. Automatically open Monaco Editor's native Find widget UI
                try {
                    var findAction = editor.getAction('actions.find');
                    if (findAction) {
                        findAction.run();
                    }
                } catch (efa) {}

                // 3. Scroll to target match line
                if (targetLine) {
                    try {
                        editor.revealLineInCenter(targetLine);
                        editor.setPosition({ lineNumber: targetLine, column: 1 });
                    } catch (ePos) {}
                }
            }

            vm.getMonacoHostId = function (result, match, index) {
                return 'monaco-host-' + result.table + '-' + result.sysId + '-' + match.field + '-' + index;
            };

            vm.toggleMatchExpand = function (result, match, index) {
                if (match.expanded) {
                    vm.collapseMatch(match);
                } else {
                    vm.expandMatch(result, match, index);
                }
            };

            vm.collapseMatch = function (match) {
                match.expanded = false;
                match.loading = false;
                if (match._editor) {
                    try { match._editor.dispose(); } catch (e) {}
                    match._editor = null;
                }
            };

            vm.expandMatch = function (result, match, index) {
                match.expanded = true;
                match.loading = true;

                ajax('getFieldContent', {
                    table: result.table,
                    sys_id: result.sysId,
                    field: match.field
                }).then(function (data) {
                    match.loading = false;
                    $timeout(function () {
                        var hostId = vm.getMonacoHostId(result, match, index);
                        var container = document.getElementById(hostId);
                        if (!container) return;
                        _ensureMonacoWorker();

                        if (match._editor) {
                            try { match._editor.dispose(); } catch (e) {}
                            match._editor = null;
                        }

                        if (window.monaco && window.monaco.editor) {
                            var lang = _detectLanguage(match.field, data.content);
                            var editor = window.monaco.editor.create(container, {
                                value: data.content || '',
                                language: lang,
                                theme: 'vs-dark',
                                readOnly: true,
                                automaticLayout: true,
                                lineNumbers: 'on',
                                scrollBeyondLastLine: false,
                                minimap: { enabled: false }
                            });
                            match._editor = editor;

                            var line = match.line || 1;
                            editor.setPosition({ lineNumber: line, column: 1 });
                            editor.revealLineInCenter(line);

                            _highlightQueryInEditor(editor, vm.query, line);
                            $timeout(function () {
                                _highlightQueryInEditor(editor, vm.query, line);
                            }, 80);
                        }
                    }, 60);
                }).catch(function (e) {
                    match.loading = false;
                    match.expanded = false;
                    notify('Could not load code: ' + e.message);
                });
            };

            // Initialize
            _bindResultsScrollSpy();
            vm.loadGroups();
        }]);

        function _bootstrap() {
            var appEl = document.getElementById('codeSearchApp');
            if (!appEl) {
                setTimeout(_bootstrap, 20);
                return;
            }
            if (!window.angular.element || !angular.element(appEl).injector()) {
                try {
                    angular.bootstrap(appEl, ['codeSearchApp']);
                } catch (e) {
                    console.error('Failed to bootstrap codeSearchApp:', e);
                }
            }
        }
        _bootstrap();
    }

    function _loadScript(src, callback) {
        var s = document.createElement('script');
        s.src = src;
        s.onload = function () { if (callback) callback(null); };
        s.onerror = function (e) { if (callback) callback(e); };
        document.head.appendChild(s);
    }

    function _init() {
        if (typeof angular !== 'undefined') {
            _initAngular();
            return;
        }

        var attempts = 0;
        var timer = setInterval(function () {
            attempts++;
            if (typeof angular !== 'undefined') {
                clearInterval(timer);
                _initAngular();
            } else if (attempts === 15) {
                _loadScript('/scripts/angular_1.5.11/angular.min.js', function () {
                    if (typeof angular !== 'undefined') {
                        clearInterval(timer);
                        _initAngular();
                    }
                });
            } else if (attempts > 120) {
                clearInterval(timer);
                console.error('AngularJS failed to load within timeout');
            }
        }, 50);
    }

    if (typeof addAfterPageLoadedEvent === 'function') {
        addAfterPageLoadedEvent(_init);
    } else if (document.readyState !== 'loading') {
        _init();
    } else {
        document.addEventListener('DOMContentLoaded', _init);
    }
})();
`,
    processingScript: `// Server-side work is handled by WidgetEditorCodeSearchAjax via GlideAjax.`,
})
