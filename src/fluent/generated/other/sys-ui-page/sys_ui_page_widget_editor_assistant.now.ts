import { UiPage } from '@servicenow/sdk/core'

export const widgetEditorAssistantUiPage = UiPage({
    $id: Now.ID['widget-editor-assistant-ui-page'],
    category: 'htmleditor',
    endpoint: 'widget_editor_assistant.do',
    description:
        'Builds a redacted XML export of a primary record plus its related components (script includes, Angular templates/providers, and any manually added records) for use as AI tool context. Standalone page; can be launched with a primary record pre-selected from Widget Editor+.',
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

    <g:requires name="scripts/angular_1.5.11/angular.min.js" position="last" />
    <script src="/scripts/angular_1.5.11/angular.min.js"></script>

    <script>
        var _weAssistantConfigParams = new URLSearchParams(window.location.search);
        var _weAssistantEmbedded = false;
        try {
            if (window.top !== window) {
                if (window.parent !== window.top) {
                    _weAssistantEmbedded = true;
                }
            }
        } catch (e) {}
        window.WE_ASSISTANT_CONFIG = {
            table: _weAssistantConfigParams.get('record_table') || '',
            sysId: _weAssistantConfigParams.get('record_sys_id') || '',
            embedded: _weAssistantEmbedded,
            siteTitle: '\${gs.getProperty("glide.product.name", "ServiceNow")}'
        };
    </script>

    <style>
        /* Reset */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        html {
            font-size: 16px;
        }

        html, body {
            height: 100%;
            margin: 0;
            padding: 0 !important;
            overflow: hidden;
            overscroll-behavior: none;
            background: rgb(var(--now-color_background--primary, 255 255 255));
            color: rgb(var(--now-color_text--primary, 29 29 29));
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: var(--now-global-font-size--md, 14px);
            line-height: 1.45;
        }

        [ng-cloak], .ng-cloak { display: none !important; }

        /* App Shell */
        .dc-app {
            display: flex;
            flex-direction: column;
            height: 100vh;
            width: 100vw;
            overflow: hidden;
            overscroll-behavior: none;
        }

        /* Header Bar */
        .dc-header {
            background: rgb(var(--now-color_chrome--brand-5,var(--now-color--primary-0,221,237,233)));
            border-bottom: 1px solid rgb(var(--now-color_border--secondary, var(--now-color_divider--secondary, 228 230 235)));
            flex-shrink: 0;
            z-index: 10;
            margin: 0;
        }
        .dc-header-row {
            padding: 0.75rem 1.25rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
        }
        .dc-title {
            font-size: var(--now-font-size--lg, 18px);
            font-weight: 600;
            color: rgb(var(--now-color--neutral-0, var(--now-color--neutral-12)));
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .dc-title strong {
            font-weight: 700;
        }

        /* Layout Container: Spans entire height below header */
        .we-body-container {
            flex: 1;
            display: flex;
            min-height: 0;
            overflow: hidden;
            margin: 0;
            padding: 0;
            width: 100%;
        }

        /* Left Side: Table Area */
        .we-main-area {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-width: 0;
            min-height: 0;
            padding: 1rem;
            overflow: hidden;
        }
        /* Table Card and Scroll Area */
        .we-table-card {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 0;
            background: rgb(var(--now-color_background--primary, 255 255 255));
            border: 1px solid rgb(var(--now-color_border--secondary, var(--now-color_divider--secondary, 228 230 235)));
            border-radius: var(--now-form-field--border-radius, 6px);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
            overflow: hidden;
        }
        .we-table-header-toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.875rem 1.25rem;
            background: rgb(var(--now-color_background--secondary, 246 246 248));
            border-bottom: 1px solid rgb(var(--now-color_border--secondary, var(--now-color_divider--secondary, 228 230 235)));
            flex-shrink: 0;
        }
        .we-scan-indicator {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            font-size: 0.8125rem;
            color: rgb(var(--now-color_text--secondary, 96 100 108));
        }
        .we-table-heading {
            font-size: var(--now-font-size--lg, 18px);
            font-weight: 700;
            color: rgb(var(--now-color_text--primary, 29 29 29));
        }
        .we-table-scroll-container {
            flex: 1;
            min-height: 0;
            overflow-y: auto;
            overflow-x: hidden;
            overscroll-behavior: none;
            -webkit-overflow-scrolling: touch;
        }

        .we-table-loading-wrap {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            min-height: 18rem;
            height: 100%;
            color: rgb(var(--now-color_text--secondary, 96 100 108));
            font-size: var(--now-global-font-size--md, 14px);
        }
        .we-table-loading-wrap .we-loader-icon {
            width: 2rem;
            height: 2rem;
        }

        /* Horizon Contextual Sidebar: Spans top to bottom with zero gaps */
        .we-contextual-sidebar {
            display: flex;
            align-items: stretch;
            height: 100%;
            background: rgb(var(--now-color_background--primary, 255 255 255));
            border-left: 1px solid rgb(var(--now-color_border--secondary, var(--now-color_divider--secondary, 228 230 235)));
            flex-shrink: 0;
            overflow: hidden;
        }

        .we-sidebar-panel-container {
            width: 20rem;
            height: 100%;
            display: flex;
            flex-direction: column;
            min-height: 0;
            overflow: hidden;
            background-color: rgb(var(--now-color_surface--brand-1,236,244,241));
            transition: width 0.2s cubic-bezier(0.2, 0, 0, 1);
        }
        .we-sidebar-panel {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 0;
            overflow: hidden;
            padding: 1rem 0;
        }
        .we-sidebar-header {
            display: flex;
            align-items: center;
            height: 3.5rem;
            padding: 0 1.25rem;
            flex-shrink: 0;
        }
        .we-sidebar-title {
            font-size: var(--now-font-size--lg, 18px);
            font-weight: 700;
            color: rgb(var(--now-color_text--primary, 29 29 29));
        }
        .we-sidebar-content {
            flex: 1;
            min-height: 0;
            overflow-y: auto;
            padding: 1.25rem;
            display: flex;
            flex-direction: column;
            gap: 1.125rem;
            overscroll-behavior: contain;
            -webkit-overflow-scrolling: touch;
        }

        /* Horizon Dock Rail */
        .we-sidebar-rail {
            width: 2.75rem;
            height: 100%;
            background: rgb(var(--now-color_surface--brand-2,218,233,228));
            border-left: 1px solid rgb(var(--now-color_border--tertiary,var(--now-color--neutral-3,209,214,214)));
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 0.75rem 0;
            gap: 0.5rem;
            flex-shrink: 0;
        }
        /* Data Table */
        table.we-main-table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            table-layout: fixed;
        }
        table.we-main-table thead th {
            position: sticky;
            top: 0;
            z-index: 10;
            padding: 0.75rem 0.875rem;
            font-size: var(--now-global-font-size--md, 14px);
            font-weight: 600;
            color: rgb(var(--now-color_text--secondary, 96 100 108));
            background: rgb(var(--now-color_background--tertiary, 243 244 246));
            border-bottom: 1px solid rgb(var(--now-color_border--secondary, var(--now-color_divider--secondary, 228 230 235)));
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        table.we-main-table tbody td {
            padding: 0.75rem 0.875rem;
            font-size: var(--now-global-font-size--md, 14px);
            border-bottom: 1px solid rgba(var(--now-color--neutral-0, 0 0 0), 0.07);
            vertical-align: middle;
            color: rgb(var(--now-color_text--primary, 29 29 29));
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            background: rgb(var(--now-color_background--primary, 255 255 255));
        }
        table.we-main-table tbody tr:hover td {
            background: rgba(var(--now-color--primary-0, 221 237 233), 0.35);
        }
        table.we-main-table tbody tr.we-primary-row td {
            position: sticky;
            top: 2.75rem;
            z-index: 8;
            background: rgba(var(--now-color--primary-1, 0 118 204), 0.1);
            border-bottom: 1px solid rgba(var(--now-color--primary-1, 0 118 204), 0.25);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            font-weight: 500;
        }
        table.we-main-table tbody tr.we-primary-row:hover td {
            background: rgba(var(--now-color--primary-1, 0 118 204), 0.16);
        }
        @keyframes we-highlight-fade {
            0% {
                background-color: rgba(var(--now-color--primary-1, 0 118 204), 0.25);
            }
            100% {
                background-color: transparent;
            }
        }
        table.we-main-table tbody tr.we-row-just-added td {
            animation: we-highlight-fade 1.8s ease-out forwards;
        }

        .we-cell-check {
            width: 3.25rem;
            text-align: center;
            overflow: visible !important;
            text-overflow: unset !important;
        }
        .we-cell-actions {
            text-align: right;
            white-space: nowrap;
            width: 6.5rem;
            overflow: visible !important;
            text-overflow: unset !important;
        }
        .we-cell-actions .btn + .btn {
            margin-left: 0.375rem;
        }
        .we-spin {
            display: inline-block;
            animation: we-spin 0.7s linear infinite;
        }
        @keyframes we-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .we-checkbox {
            cursor: pointer;
            width: 1rem;
            height: 1rem;
            vertical-align: middle;
        }

        /* Recommended Pill Badge */
        .we-pill-suggested {
            display: inline-flex;
            align-items: center;
            gap: 0.2rem;
            font-size: 0.7rem;
            font-weight: 600;
            padding: 0.125rem 0.45rem;
            border-radius: 9999px;
            background: rgba(var(--now-color--primary-1, 0 118 204), 0.12);
            color: rgb(var(--now-color--primary-2, 0 118 204));
            margin-left: 0.5rem;
            vertical-align: middle;
            cursor: default;
        }
        .we-pill-suggested i {
            font-size: 0.75rem;
        }

        /* Primary indicator pill */
        .we-pill-primary {
            display: inline-flex;
            align-items: center;
            font-size: 0.7rem;
            font-weight: 700;
            padding: 0.125rem 0.45rem;
            border-radius: 9999px;
            background: rgb(var(--now-alert--positive--background-color, var(--now-color_alert--positive-0, 201 224 202)));
            color: rgb(var(--now-badge--secondary_positive--color, var(--now-color_alert--positive-5, 15 52 17)));
            margin-left: 0.5rem;
            vertical-align: middle;
            cursor: default;
        }

        /* Inline Table and Record Lookup Triggers */
        .we-lookup-link {
            color: rgb(var(--now-color--primary-2, 0 118 204));
            cursor: pointer;
            text-decoration: underline;
            text-decoration-style: dotted;
            font-weight: 600;
        }
        .we-lookup-link:hover {
            color: rgb(var(--now-color--primary-1, 0 90 156));
            text-decoration: underline;
        }

        .we-sidebar-stat-row {
            display: flex;
            align-items: baseline;
            gap: 0.5rem;
        }
        .we-stat-val {
            font-size: 1.875rem;
            font-weight: 700;
            color: rgb(var(--now-color_text--primary, 29 29 29));
            line-height: 1;
        }
        .we-stat-lbl {
            font-size: 0.8125rem;
            color: rgb(var(--now-color_text--secondary, 96 100 108));
        }

        /* Record Type Counts */
        .we-type-counts-list {
            display: flex;
            flex-direction: column;
            gap: 0.375rem;
            margin: 0.25rem 0;
        }
        .we-type-count-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 0.8125rem;
            padding: 0.35rem 0.5rem;
            background: rgb(var(--now-color_background--secondary, 246 246 248));
            border-radius: 4px;
            color: rgb(var(--now-color_text--secondary, 96 100 108));
        }
        .we-type-count-pill {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 1.375rem;
            height: 1.375rem;
            padding: 0 0.4rem;
            font-size: 0.75rem;
            font-weight: 700;
            border-radius: 9999px;
            background: rgba(var(--now-color--primary-1, 0 118 204), 0.15);
            color: rgb(var(--now-color--primary-2, 0 118 204));
        }

        /* Skeleton Placeholders */
        @keyframes we-skeleton-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.35; }
        }
        .we-skeleton-bar {
            display: inline-block;
            background: rgba(var(--now-color--neutral-0, 0 0 0), 0.1);
            border-radius: 4px;
            animation: we-skeleton-pulse 1.4s ease-in-out infinite;
        }
        .we-skeleton-counts {
            display: flex;
            flex-direction: column;
            gap: 0.375rem;
        }
        .we-skeleton-count-row {
            height: 1.875rem;
            width: 100%;
            border-radius: 4px;
        }
        .we-skeleton-token-card {
            background: rgb(var(--now-color_background--secondary, 246 246 248));
            border: 1px solid rgb(var(--now-color_border--secondary, var(--now-color_divider--secondary, 228 230 235)));
        }

        /* Token Gauge */
        .we-token-card {
            padding: 0.625rem 0.75rem;
            background: rgb(var(--now-color_background--secondary, 246 246 248));
            border: 1px dashed rgb(var(--now-color_border--secondary, var(--now-color_divider--secondary, 228 230 235)));
            border-radius: 4px;
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            transition: background 0.2s ease, border-color 0.2s ease;
        }
        .we-token-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .we-token-lbl {
            font-size: 0.7rem;
            font-weight: 600;
            text-transform: uppercase;
            color: rgb(var(--now-color_text--tertiary, 130 134 142));
            letter-spacing: 0.03em;
        }
        .we-token-badge {
            font-size: 0.6875rem;
            font-weight: 700;
            padding: 0.1rem 0.45rem;
            border-radius: 9999px;
            text-transform: uppercase;
            letter-spacing: 0.02em;
        }
        .we-token-val {
            font-size: 1.125rem;
            font-weight: 700;
            color: rgb(var(--now-color_text--primary, 29 29 29));
            line-height: 1.2;
        }

        /* Color-coded Token Ranges */
        .we-token-card.we-token-green {
            background: rgb(var(--now-alert--positive--background-color, var(--now-color_alert--positive-0, 201 224 202)));
            border: 1px solid rgb(var(--now-alert--positive--border-color, var(--now-color_alert--positive-1, 119 178 123)));
        }
        .we-token-card.we-token-green .we-token-val {
            color: rgb(var(--now-alert--positive--color, var(--now-color_alert--positive-3, 30 105 34)));
        }
        .we-token-card.we-token-green .we-token-badge {
            background: rgb(var(--now-badge--secondary_positive--background-color, var(--now-color_alert--positive-0, 201 224 202)));
            color: rgb(var(--now-badge--secondary_positive--color, var(--now-color_alert--positive-5, 15 52 17)));
        }

        .we-token-card.we-token-orange {
            background: rgb(var(--now-alert--warning--background-color, var(--now-color_alert--warning-0, 244 240 191)));
            border: 1px solid rgb(var(--now-alert--warning--border-color, var(--now-color_alert--warning-1, 227 218 96)));
        }
        .we-token-card.we-token-orange .we-token-val {
            color: rgb(var(--now-alert--warning--color, var(--now-color_alert--warning-4, 149 139 17)));
        }
        .we-token-card.we-token-orange .we-token-badge {
            background: rgb(var(--now-badge--secondary_warning--background-color, var(--now-color_alert--warning-0, 244 240 191)));
            color: rgb(var(--now-badge--secondary_warning--color, var(--now-color_alert--warning-5, 99 92 11)));
        }

        .we-token-card.we-token-red {
            background: rgb(var(--now-alert--critical--background-color, var(--now-color_alert--critical-0, 241 206 205)));
            border: 1px solid rgb(var(--now-alert--critical--border-color, var(--now-color_alert--critical-1, 221 133 129)));
        }
        .we-token-card.we-token-red .we-token-val {
            color: rgb(var(--now-alert--critical--color, var(--now-color_alert--critical-3, 160 48 43)));
        }
        .we-token-card.we-token-red .we-token-badge {
            background: rgb(var(--now-badge--secondary_critical--background-color, var(--now-color_alert--critical-0, 241 206 205)));
            color: rgb(var(--now-badge--secondary_critical--color, var(--now-color_alert--critical-5, 80 24 22)));
        }

        /* Privacy and Sanitisation Notice */
        .we-privacy-box {
            display: flex;
            align-items: flex-start;
            gap: 0.625rem;
            padding: 0.875rem 1rem;
            background: rgb(var(--now-alert--positive--background-color, var(--now-color_alert--positive-0, 201 224 202)));
            border: 1px solid rgb(var(--now-alert--positive--border-color, var(--now-color_alert--positive-1, 119 178 123)));
            border-radius: 6px;
            font-size: var(--now-global-font-size--md, 14px);
            color: rgb(var(--now-alert--positive--color, var(--now-color_alert--positive-3, 30 105 34)));
            line-height: 1.5;
        }
        .we-privacy-box i {
            font-size: 1.125rem;
            color: rgb(var(--now-color_alert--positive-2, 37 131 43));
            flex-shrink: 0;
            margin-top: 0.125rem;
        }
        .we-privacy-box code {
            display: inline-block;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 0.8125rem;
            padding: 0.125rem 0.35rem;
            border-radius: 3px;
            background: rgba(var(--now-color_alert--positive-3, 30 105 34), 0.1);
            color: rgb(var(--now-color_alert--positive-5, 15 52 17));
            font-weight: 600;
        }

        /* Progress Bar */
        .we-progress-box {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }
        .we-progress-info {
            display: flex;
            justify-content: space-between;
            font-size: 0.75rem;
            color: rgb(var(--now-color_text--secondary, 96 100 108));
            font-weight: 600;
        }
        .we-progress-bar {
            height: 0.5rem;
            background: rgba(var(--now-color--neutral-0, 0 0 0), 0.12);
            border-radius: 9999px;
            overflow: hidden;
        }
        .we-progress-bar-fill {
            height: 100%;
            background: rgb(var(--now-color--primary-1, 0 118 204));
            transition: width 0.15s ease;
        }

        /* Record Lookup Modal — matches the Widget Editor+ picker design language */
        .we-modal-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: flex-start;
            justify-content: center;
            z-index: 1000;
            padding: 1rem;
            padding-top: 12vh;
        }
        .we-picker-box {
            background: rgb(var(--now-color_background--secondary, 246 246 248));
            border: 1px solid rgba(var(--now-color--neutral-0, 0 0 0), 0.12);
            border-radius: 12px;
            width: min(40rem, 95vw);
            height: min(38rem, 80vh);
            display: flex;
            flex-direction: column;
            box-shadow: 0 24px 64px -8px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05);
            overflow: hidden;
        }
        .we-picker-title-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.875rem 1.25rem;
            border-bottom: 1px solid rgba(var(--now-color--neutral-0, 0 0 0), 0.08);
            background: rgb(var(--now-color_background--secondary, 246 246 248));
            flex-shrink: 0;
            gap: 1rem;
        }
        .we-picker-title-left {
            display: flex;
            align-items: center;
            gap: 0.625rem;
            min-width: 0;
        }
        .we-picker-title {
            font-size: var(--now-font-size--lg, 18px);
            font-weight: 600;
            color: rgb(var(--now-color_text--primary, 29 29 29));
            white-space: nowrap;
        }
        .we-picker-title-actions {
            display: flex;
            align-items: center;
            gap: 0.625rem;
            margin-left: auto;
        }

        /* Horizon Design System Modal Close Button */
        .we-modal-close-btn {
            all: unset;
            box-sizing: border-box;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 2.25rem !important;
            height: 2.25rem !important;
            min-width: 2.25rem !important;
            min-height: 2.25rem !important;
            margin: 0 !important;
            padding: 0 !important;
            cursor: pointer !important;
            color: rgb(var(--now-color_text--secondary, 96 100 108)) !important;
            background-color: transparent !important;
            border: none !important;
            border-radius: var(--now-button--border-radius, var(--now-form-field--border-radius, 4px)) !important;
            outline: none !important;
            box-shadow: none !important;
            transition: background-color 0.15s ease, color 0.15s ease;
            flex-shrink: 0 !important;
        }
        .we-modal-close-btn svg {
            display: block !important;
            width: 1.375rem !important;
            height: 1.375rem !important;
            pointer-events: none !important;
            flex-shrink: 0 !important;
        }
        .we-modal-close-btn:hover {
            background-color: rgba(var(--now-color--neutral-0, 0 0 0), 0.08) !important;
            color: rgb(var(--now-color_text--primary, 29 29 29)) !important;
        }
        .we-modal-close-btn:focus-visible {
            outline: 2px solid rgb(var(--now-color--primary-2, 0 118 204)) !important;
            outline-offset: 2px !important;
        }

        /* Favourite-table toggle in the picker modal header — standard btn btn-default
           chrome, with just a colour tint layered on for the active/favourited state. */
        .we-modal-fav-btn--active,
        .we-modal-fav-btn--active i {
            color: rgb(var(--now-color--warning-2, 217 155 12)) !important;
        }

        /* Body columns */
        .we-picker-columns {
            display: flex;
            flex: 1;
            overflow: hidden;
            min-height: 0;
        }
        .we-picker-col-main {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            padding: 1rem 1.25rem 0.75rem 1.25rem;
            overflow: hidden;
        }

        /* Search input bar */
        .we-picker-search-wrap {
            position: relative;
            display: flex;
            align-items: center;
            margin-bottom: 0.75rem;
            flex-shrink: 0;
            width: 100%;
        }
        .we-picker-search-input {
            padding-right: 2.25rem !important;
        }
        .we-picker-search-icon {
            position: absolute;
            right: 0.75rem;
            top: 50%;
            transform: translateY(-50%);
            font-size: 1rem;
            line-height: 1;
            color: rgb(var(--now-color_text--secondary, 96 100 108));
            pointer-events: none;
        }
        .we-picker-search-clear {
            position: absolute;
            right: 0.6rem;
            top: 50%;
            transform: translateY(-50%);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 1.25rem;
            height: 1.25rem;
            border-radius: 999px;
            color: rgb(var(--now-color_text--secondary, 96 100 108));
            background: rgba(var(--now-color--neutral-0, 0 0 0), 0.08);
            cursor: pointer;
            font-size: 0.875rem;
            line-height: 1;
            transition: all 0.12s ease;
        }
        .we-picker-search-clear:hover {
            color: rgb(var(--now-color_text--primary, 29 29 29));
            background: rgba(var(--now-color--neutral-0, 0 0 0), 0.16);
        }
        .we-picker-search-spinner {
            position: absolute;
            right: 0.75rem;
            top: 50%;
            transform: translateY(-50%);
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
            z-index: 2;
        }

        /* Loading spinners */
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
        .we-header-loader {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: RGB(var(--now-loader_icon--color, var(--now-loading_indicator--primary--color, var(--now-color--primary-1, 56, 126, 245))));
            line-height: 1;
            flex-shrink: 0;
            vertical-align: middle;
        }
        @keyframes we-header-loader-spin { to { transform: rotate(360deg); } }
        .we-header-loader-icon {
            display: block;
            width: 0.75rem;
            height: 0.75rem;
            animation: we-header-loader-spin 0.75s linear infinite;
            transform-origin: center;
        }
        .we-picker-item mark {
            background-color: rgba(var(--now-color--primary-1, 0 118 204), 0.22);
            color: rgb(var(--now-color_text--primary, 29 29 29));
            font-weight: 600;
            padding: 0 0.125rem;
            border-radius: 2px;
        }

        /* Column subheaders */
        .we-picker-section-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.25rem 0.25rem 0.5rem 0.25rem;
            flex-shrink: 0;
        }
        .we-picker-section-title {
            font-size: 0.75rem;
            font-weight: 600;
            color: rgba(var(--now-color_text--primary, 29 29 29), 0.55);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            display: flex;
            align-items: center;
            gap: 0.375rem;
        }
        .we-picker-count-badge {
            font-size: 0.6875rem;
            font-weight: 500;
            color: rgba(var(--now-color_text--primary, 29 29 29), 0.5);
            background: rgba(var(--now-color--neutral-0, 0 0 0), 0.08);
            padding: 0.0625rem 0.375rem;
            border-radius: 999px;
        }

        /* Scrollable list */
        .we-picker-list {
            flex: 1;
            overflow-y: auto;
            min-height: 0;
            display: flex;
            flex-direction: column;
            gap: 0.1875rem;
            padding-right: 0.25rem;
            overscroll-behavior: contain;
            -webkit-overflow-scrolling: touch;
        }
        .we-picker-list::-webkit-scrollbar {
            width: 6px;
        }
        .we-picker-list::-webkit-scrollbar-thumb {
            background: rgba(var(--now-color--neutral-0, 0 0 0), 0.15);
            border-radius: 4px;
        }
        .we-picker-load-more {
            display: flex;
            justify-content: center;
            padding: 0.5rem 0;
            flex-shrink: 0;
        }

        /* Empty state */
        .we-picker-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2.5rem 1rem;
            text-align: center;
            font-size: var(--now-font-size--md, 0.875rem);
            color: rgb(var(--now-color_text--secondary, 96 100 108));
            line-height: 1.5;
            flex: 1;
        }

        /* List item row */
        .we-picker-item {
            display: flex;
            align-items: center;
            gap: 0.625rem;
            padding: 0.5rem 0.625rem;
            border-radius: 8px;
            cursor: pointer;
            user-select: none;
            background: transparent;
            border: 1px solid transparent;
            transition: background-color 0.12s ease, border-color 0.12s ease;
        }
        .we-picker-item:hover {
            background: rgba(var(--now-color--primary-1, 0 118 204), 0.08);
        }
        .we-picker-item:focus,
        .we-picker-item:focus-visible {
            outline: none;
            background: rgba(var(--now-color--primary-1, 0 118 204), 0.12);
            border-color: rgba(var(--now-color--primary-1, 0 118 204), 0.4);
        }
        .we-picker-item-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 1.875rem;
            height: 1.875rem;
            border-radius: 6px;
            background: rgba(var(--now-color--neutral-0, 0 0 0), 0.06);
            color: rgba(var(--now-color_text--primary, 29 29 29), 0.6);
            flex-shrink: 0;
            font-size: 1rem;
        }
        .we-picker-item:hover .we-picker-item-icon {
            background: rgba(var(--now-color--primary-1, 0 118 204), 0.15);
            color: rgb(var(--now-color--primary-2, 0 118 204));
        }
        .we-picker-item-content {
            display: flex;
            flex-direction: column;
            gap: 0.125rem;
            min-width: 0;
            flex: 1;
        }
        .we-picker-item-name {
            font-size: var(--now-font-size--md, 0.875rem);
            font-weight: 400;
            color: rgb(var(--now-color_text--primary, 29 29 29));
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.25;
        }
        .we-picker-item-id {
            font-size: var(--now-font-size--xs, 0.6875rem);
            color: rgba(var(--now-color_text--primary, 29 29 29), 0.5);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.2;
        }

        .we-picker-item-actions {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            margin-left: auto;
            flex-shrink: 0;
        }
        .we-picker-action-btn,
        button.we-picker-action-btn,
        a.we-picker-action-btn {
            all: unset;
            box-sizing: border-box;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 1.625rem !important;
            height: 1.625rem !important;
            min-width: 1.625rem !important;
            min-height: 1.625rem !important;
            max-width: 1.625rem !important;
            max-height: 1.625rem !important;
            border-radius: 4px !important;
            color: rgba(var(--now-color_text--primary, 29 29 29), 0.45) !important;
            background: transparent !important;
            cursor: pointer !important;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.12s ease, background-color 0.12s ease, color 0.12s ease;
            text-decoration: none !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            outline: none !important;
            box-shadow: none !important;
            font-size: 0.875rem !important;
            line-height: 1 !important;
            flex-shrink: 0 !important;
        }
        .we-picker-action-btn i,
        button.we-picker-action-btn i,
        a.we-picker-action-btn i {
            font-size: 0.875rem !important;
            line-height: 1 !important;
            color: inherit !important;
            display: inline-block !important;
        }
        .we-picker-item:hover .we-picker-action-btn,
        .we-picker-item:focus-within .we-picker-action-btn {
            opacity: 1 !important;
            visibility: visible !important;
        }
        .we-picker-action-btn:hover,
        button.we-picker-action-btn:hover,
        a.we-picker-action-btn:hover {
            background: rgba(var(--now-color--neutral-0, 0 0 0), 0.12) !important;
            color: rgb(var(--now-color_text--primary, 29 29 29)) !important;
            text-decoration: none !important;
        }
        .we-picker-action-btn:focus-visible,
        button.we-picker-action-btn:focus-visible,
        a.we-picker-action-btn:focus-visible {
            opacity: 1 !important;
            visibility: visible !important;
            outline: 2px solid rgb(var(--now-focus-ring--color, var(--now-color_focus--primary, var(--now-color--primary-2, 30 133 203)))) !important;
            outline-offset: 1px !important;
        }

        .we-code-font {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 0.75rem;
            color: rgb(var(--now-color_text--secondary, 96 100 108));
        }

        .we-updated-text {
            font-size: 0.75rem;
            color: rgb(var(--now-color_text--secondary, 96 100 108));
        }

        /* Quick Table Chips */
        .we-table-chips {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }
        .we-table-chips .btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5em;
        }
    </style>

    <div id="we-assistant-app" ng-controller="WeAssistantCtrl as ctrl" class="dc-app" ng-cloak="">
        
        <!-- Diff-Style Sticky Header Bar -->
        <div class="dc-header" ng-if="!ctrl.embeddedInModal">
            <div class="dc-header-row">
                <div class="dc-title">
                    <span>Widget Editor+ Assistant</span>
                </div>
            </div>
        </div>

        <!-- Main Body Area -->
        <div class="we-body-container">
            <!-- Left Side: Single Table -->
            <div class="we-main-area">
                <div class="we-table-card">
                    <div class="we-table-header-toolbar">
                        <div class="we-table-heading">
                            <span>Records</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <span class="we-scan-indicator" ng-if="ctrl.scanningSuggested">
                                <we-loader></we-loader>
                                <span>Scanning for suggestions…</span>
                            </span>
                            <button type="button" class="btn btn-default" ng-if="ctrl.primary.sysId" ng-click="ctrl.refreshAll()" ng-disabled="ctrl.refreshingAll" title="Refresh all records and re-scan for suggested related components">
                                <i class="icon-refresh" ng-class="{'we-spin': ctrl.refreshingAll}" style="margin-right: 0.375rem;"></i>
                                <span>Refresh</span>
                            </button>
                            <button class="btn btn-primary" ng-click="ctrl.openLookup('add')" title="Add a record to the bundle">
                                <i class="icon-add" style="margin-right: 0.375rem;"></i>
                                <span>Add Record</span>
                            </button>
                        </div>
                    </div>

                    <div class="we-table-scroll-container">
                        <!-- Initial Loading State -->
                        <div class="we-table-loading-wrap" ng-if="ctrl.loadingInitial">
                            <we-loader></we-loader>
                            <span>Loading records…</span>
                        </div>

                        <table class="we-main-table" ng-if="!ctrl.loadingInitial">
                            <colgroup>
                                <col style="width: 3.25rem;" />
                                <col style="width: 25%;" />
                                <col style="width: 42%;" />
                                <col style="width: 20%;" />
                                <col style="width: 13%; min-width: 6.5rem;" />
                            </colgroup>
                            <thead>
                                <tr>
                                    <th class="we-cell-check">
                                        <input type="checkbox" class="we-checkbox" ng-checked="ctrl.isAllSelected()" ng-click="ctrl.toggleSelectAll()" title="Select / deselect all" />
                                    </th>
                                    <th>Table</th>
                                    <th>Name</th>
                                    <th>Updated</th>
                                    <th class="we-cell-actions">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <!-- Unified Rows: Row 0 is Primary (or a placeholder prompting selection), Remaining Rows Grouped by Type -->
                                <tr ng-repeat-start="row in ctrl.rows track by (row.placeholder ? 'ph' : (row.table + ':' + row.sys_id))" ng-if="row.placeholder" class="we-primary-row" data-row-key="ph">
                                    <td colspan="5" style="text-align: center; padding: 1.5rem 1rem;">
                                        <button type="button" class="btn btn-primary" ng-click="ctrl.openLookup('primary')">
                                            <i class="icon-add" style="margin-right: 0.375rem;"></i>
                                            <span>Select record</span>
                                        </button>
                                        <div style="margin-top: 1.5rem; font-size: var(--now-global-font-size--md, 14px); color: rgb(var(--now-color_text--secondary, 96 100 108));">
                                            Choose the primary record to get started.
                                        </div>
                                    </td>
                                </tr>
                                <tr ng-repeat-end="ng-repeat-end" ng-if="!row.placeholder" ng-class="{'we-primary-row': row.primary, 'we-row-just-added': row._justAdded}" data-row-key="{{row.table}}:{{row.sys_id}}">
                                    <td class="we-cell-check">
                                        <input type="checkbox" class="we-checkbox" ng-model="row.checked" ng-disabled="row.primary" ng-change="ctrl.onSelectionChange()" />
                                    </td>
                                    <td>
                                        <span ng-class="{'we-lookup-link': !(row.primary &amp;&amp; ctrl.embeddedInModal)}" ng-click="!(row.primary &amp;&amp; ctrl.embeddedInModal) &amp;&amp; ctrl.openLookupForRow(row, 'table')" title="{{(row.primary &amp;&amp; ctrl.embeddedInModal) ? '' : 'Click to change table'}}">
                                            {{row.tableLabel || row.table}}
                                            <i ng-class="ctrl.tableIconClass(row.table)" style="margin-left: 0.25em" aria-hidden="true"></i>
                                        </span>
                                    </td>
                                    <td>
                                        <span ng-class="{'we-lookup-link': !(row.primary &amp;&amp; ctrl.embeddedInModal)}" ng-click="!(row.primary &amp;&amp; ctrl.embeddedInModal) &amp;&amp; ctrl.openLookupForRow(row, 'record')" title="{{(row.primary &amp;&amp; ctrl.embeddedInModal) ? '' : 'Click to change record'}}">
                                            {{row.label}}
                                        </span>
                                        <span class="we-pill-primary" ng-if="row.primary">Primary</span>
                                        <span class="we-pill-suggested" ng-if="row.suggested">
                                            <span>Recommended</span>
                                            <i class="icon-ai-sparkle-fill" aria-hidden="true"></i>
                                        </span>
                                    </td>
                                    <td>
                                        <span class="we-updated-text" ng-bind="row.updatedOn || '—'"></span>
                                    </td>
                                    <td class="we-cell-actions">
                                        <button type="button" class="btn btn-default" ng-if="row.primary &amp;&amp; !ctrl.embeddedInModal" ng-click="ctrl.openLookup('primary')" title="Select primary record">
                                            <i class="icon-target"></i>
                                        </button>
                                        <button type="button" class="btn btn-default" ng-if="!row.primary" ng-click="ctrl.removeRow(row)" title="Remove record">
                                            <i class="icon-cross"></i>
                                        </button>
                                        <a class="btn btn-default" ng-if="!(row.primary &amp;&amp; ctrl.embeddedInModal)" ng-href="/nav_to.do?uri={{row.table}}.do%3Fsys_id%3D{{row.sys_id}}" target="_blank" title="Open record in platform">
                                            <i class="icon-open-document-new-tab"></i>
                                        </a>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Horizon Contextual Sidebar -->
            <aside class="we-contextual-sidebar">
                <!-- Expanded Panel (2) -->
                <div class="we-sidebar-panel-container" ng-show="!ctrl.sidebarCollapsed">
                    <!-- Tab 1: Context XML -->
                    <div class="we-sidebar-panel" ng-if="ctrl.activeSidebarTab === 'xml'">
                        <div class="we-sidebar-header">
                            <span class="we-sidebar-title">Context XML</span>
                        </div>

                        <div class="we-sidebar-content">
                            <!-- Skeleton Placeholders while loading records -->
                            <div class="we-skeleton-counts" ng-if="ctrl.loadingInitial">
                                <div class="we-skeleton-bar we-skeleton-count-row"></div>
                                <div class="we-skeleton-bar we-skeleton-count-row"></div>
                            </div>

                            <div class="we-token-card we-skeleton-token-card" ng-if="ctrl.loadingInitial">
                                <div class="we-token-header">
                                    <span class="we-token-lbl">Estimated Context Size</span>
                                    <span class="we-skeleton-bar" style="width: 3.5rem; height: 1rem; border-radius: 9999px;"></span>
                                </div>
                                <div class="we-skeleton-bar" style="width: 7.5rem; height: 1.375rem; margin-top: 0.25rem;"></div>
                            </div>

                            <!-- Record Type Counts (when loaded) -->
                            <div class="we-type-counts-list" ng-if="!ctrl.loadingInitial &amp;&amp; ctrl.typeCountsList.length &gt; 0">
                                <div class="we-type-count-item" ng-repeat="tc in ctrl.typeCountsList">
                                    <span ng-bind="tc.label"></span>
                                    <span class="we-type-count-pill" ng-bind="tc.selectedCount"></span>
                                </div>
                            </div>

                            <!-- Token Estimation (when loaded) -->
                            <div class="we-token-card" ng-class="ctrl.tokenCardClass()" ng-if="!ctrl.loadingInitial">
                                <div class="we-token-header">
                                    <span class="we-token-lbl">Estimated Context Size</span>
                                    <span class="we-token-badge" ng-if="ctrl.tokenLevelInfo().label" ng-bind="ctrl.tokenLevelInfo().label"></span>
                                </div>
                                <span class="we-token-val" ng-if="ctrl.sizesPending()">~<span class="we-skeleton-bar" style="width: 3rem; height: 1em; border-radius: 4px; vertical-align: middle; margin: 0 0.25em;" aria-hidden="true"></span> tokens</span>
                                <span class="we-token-val" ng-if="!ctrl.sizesPending() &amp;&amp; ctrl.rawTokenCount() === 0">N/A</span>
                                <span class="we-token-val" ng-if="!ctrl.sizesPending() &amp;&amp; ctrl.rawTokenCount() &gt; 0">~{{ctrl.estimatedTokens()}} tokens</span>
                            </div>

                            <!-- Export Button -->
                            <button class="btn btn-primary btn-block" ng-click="ctrl.generateXml()" ng-disabled="ctrl.loadingInitial || ctrl.selectedCount() === 0 || ctrl.generating">
                                <i class="icon-download" style="margin-right: 4px;"></i>
                                <span>{{ctrl.generating ? 'Generating XML…' : 'Generate XML'}}</span>
                            </button>

                            <!-- Progress Indicator — stays visible after completion until the record set changes -->
                            <div class="we-progress-box" ng-if="ctrl.progress.total &gt; 0">
                                <div class="we-progress-info">
                                    <span>{{ctrl.generating ? 'Generating XML bundle…' : 'XML bundle generated'}}</span>
                                    <span>{{ctrl.progressPct()}}%</span>
                                </div>
                                <div class="we-progress-bar">
                                    <div class="we-progress-bar-fill" ng-style="{width: ctrl.progressPct() + '%'}"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Tab 2: Help and Info -->
                    <div class="we-sidebar-panel" ng-if="ctrl.activeSidebarTab === 'info'">
                        <div class="we-sidebar-header">
                            <span class="we-sidebar-title">About</span>
                        </div>
                        <div class="we-sidebar-content">
                            <div style="font-size: var(--now-global-font-size--md, 14px); line-height: 1.5; color: rgb(var(--now-color_text--primary, 29 29 29)); display: flex; flex-direction: column; gap: 1rem;">
                                <div>
                                    <strong>Widget Editor+ Assistant</strong>&#160;bundles a record and related components into a clean XML context bundle for generative AI coding assistants.
                                </div>
                                <div class="we-privacy-box">
                                    <p>
                                        Author fields <code>sys_created_by</code>, <code>sys_updated_by</code> and email addresses are automatically redacted for privacy.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Horizon Dock Rail (1) -->
                <div class="we-sidebar-rail">
                    <button type="button" class="btn btn-icon" ng-class="{'active': ctrl.activeSidebarTab === 'xml' &amp;&amp; !ctrl.sidebarCollapsed}" ng-click="ctrl.selectSidebarTab('xml')" title="Context XML">
                        <i class="icon-document" aria-hidden="true"></i>
                    </button>
                    <button type="button" class="btn btn-icon" ng-class="{'active': ctrl.activeSidebarTab === 'info' &amp;&amp; !ctrl.sidebarCollapsed}" ng-click="ctrl.selectSidebarTab('info')" title="About">
                        <i class="icon-help" aria-hidden="true"></i>
                    </button>
                </div>
            </aside>
        </div>

        <!-- Table and Record Lookup Modal — same picker chrome as the Widget Editor+ modals -->
        <div class="we-modal-backdrop" ng-if="ctrl.lookup.open" ng-click="ctrl.onModalBackdropClick($event)">
            <div class="we-picker-box" ng-click="$event.stopPropagation()">
                <div class="we-picker-title-row">
                    <div class="we-picker-title-left">
                        <span class="we-picker-title" ng-if="ctrl.lookup.step === 'table'">Select Table</span>
                        <span class="we-picker-title" ng-if="ctrl.lookup.step === 'record'">Select {{ctrl.lookup.tableLabel}}</span>
                    </div>
                    <div class="we-picker-title-actions">
                        <button type="button" class="btn btn-default" ng-if="ctrl.lookup.step === 'record' &amp;&amp; !ctrl.isPresetTable(ctrl.lookup.chosenTable)" ng-click="ctrl.toggleFavouriteTable()" ng-class="{'we-modal-fav-btn--active': ctrl.isFavouriteTable(ctrl.lookup.chosenTable)}" aria-pressed="{{ctrl.isFavouriteTable(ctrl.lookup.chosenTable)}}" title="{{ctrl.isFavouriteTable(ctrl.lookup.chosenTable) ? 'Remove ' + ctrl.lookup.tableLabel + ' from favourites' : 'Add ' + ctrl.lookup.tableLabel + ' to favourites'}}">
                            <i ng-class="ctrl.isFavouriteTable(ctrl.lookup.chosenTable) ? 'icon-star' : 'icon-star-empty'" aria-hidden="true"></i>
                        </button>
                        <button type="button" class="we-modal-close-btn" ng-click="ctrl.closeLookup()" aria-label="Close">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M5 5L19 19M19 5L5 19" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                        </button>
                    </div>
                </div>

                <div class="we-picker-columns">
                    <div class="we-picker-col-main">
                        <!-- Step 1: Table Lookup -->
                        <div ng-if="ctrl.lookup.step === 'table'" style="display: flex; flex-direction: column; min-height: 0; flex: 1;">
                            <div class="we-picker-search-wrap">
                                <input type="text" class="form-control we-picker-search-input" ng-model="ctrl.lookup.tableQuery" ng-change="ctrl.onTableQueryChange()" ng-keydown="ctrl.onTableSearchKeydown($event)" placeholder="Search by table…" autofocus="autofocus" />
                                <span class="we-picker-search-clear" ng-if="ctrl.lookup.tableQuery &amp;&amp; !ctrl.lookup.tableLoading" ng-click="ctrl.lookup.tableQuery = ''; ctrl.onTableQueryChange()" role="button" title="Clear search">×</span>
                                <span class="we-picker-search-spinner" ng-if="ctrl.lookup.tableLoading"><we-loader></we-loader></span>
                                <i class="icon-search we-picker-search-icon" aria-hidden="true" ng-if="!ctrl.lookup.tableQuery &amp;&amp; !ctrl.lookup.tableLoading"></i>
                            </div>

                            <div ng-if="!ctrl.lookup.tableQuery">
                                <div class="we-picker-section-header">
                                    <span class="we-picker-section-title">Popular</span>
                                </div>
                                <div class="we-table-chips">
                                    <button type="button" class="btn btn-sm btn-default" ng-repeat="t in ctrl.lookup.commonTables" ng-click="ctrl.chooseTable(t)" title="{{t.name}}">
                                        {{t.label}}
                                        <i ng-class="ctrl.tableIconClass(t.name)" aria-hidden="true"></i>
                                    </button>
                                </div>

                                <div ng-if="ctrl.favouriteTables.length" style="margin-top: 0.75rem;">
                                    <div class="we-picker-section-header">
                                        <span class="we-picker-section-title">Favourites</span>
                                    </div>
                                    <div class="we-table-chips">
                                        <button type="button" class="btn btn-sm btn-default" ng-repeat="t in ctrl.favouriteTables" ng-click="ctrl.chooseTable(t)" title="{{t.name}}">
                                            {{t.label}}
                                            <i ng-class="ctrl.tableIconClass(t.name)" aria-hidden="true"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div ng-if="ctrl.lookup.tableQuery" style="display: flex; flex-direction: column; min-height: 0; flex: 1;">
                                <div class="we-picker-section-header">
                                    <span class="we-picker-section-title">
                                        <span>Results</span>
                                        <span class="we-picker-count-badge" ng-if="ctrl.lookup.tableTotal" ng-bind="ctrl.lookup.tableTotal"></span>
                                        <we-header-loader ng-if="ctrl.lookup.tableLoading || ctrl.lookup.tableLoadingMore"></we-header-loader>
                                    </span>
                                </div>
                                <div class="we-picker-list" we-infinite-scroll="ctrl.loadMoreTables()">
                                    <div class="we-picker-empty" ng-if="!ctrl.lookup.tableLoading &amp;&amp; ctrl.lookup.tableResults.length === 0">
                                        <span>No matching tables found</span>
                                    </div>
                                    <div class="we-picker-item" ng-repeat="t in ctrl.lookup.tableResults" ng-click="ctrl.chooseTable(t)" ng-keydown="ctrl.onTableItemKeydown($event, t)" tabindex="0" role="button" title="{{t.name}}">
                                        <span class="we-picker-item-icon" aria-hidden="true"><i ng-class="ctrl.tableIconClass(t.name)" aria-hidden="true"></i></span>
                                        <div class="we-picker-item-content">
                                            <span class="we-picker-item-name" ng-bind-html="t.label | weHighlight:ctrl.lookup.tableActiveSearch"></span>
                                            <span class="we-picker-item-id we-code-font" ng-bind-html="t.name | weHighlight:ctrl.lookup.tableActiveSearch"></span>
                                        </div>
                                    </div>
                                    <div class="we-picker-load-more" ng-if="ctrl.lookup.tableLoadingMore"><we-loader></we-loader></div>
                                </div>
                            </div>
                        </div>

                        <!-- Step 2: Default List View Columns Lookup with Lazy-Loading -->
                        <div ng-if="ctrl.lookup.step === 'record'" style="display: flex; flex-direction: column; min-height: 0; flex: 1;">
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; flex-shrink: 0;">
                                <button type="button" class="btn btn-default" ng-click="ctrl.lookup.step = 'table'">
                                    <i class="icon-chevron-left" style="margin-right: 0.375rem;"></i>
                                    <span>Back to Tables</span>
                                </button>
                                <span class="we-code-font" title="{{ctrl.lookup.chosenTable}}">{{ctrl.lookup.chosenTable}}</span>
                            </div>

                            <div class="we-picker-search-wrap">
                                <input type="text" class="form-control we-picker-search-input" ng-model="ctrl.lookup.recordQuery" ng-change="ctrl.onRecordQueryChange()" ng-keydown="ctrl.onRecordSearchKeydown($event)" placeholder="Search by name or sys_id…" autofocus="autofocus" />
                                <span class="we-picker-search-clear" ng-if="ctrl.lookup.recordQuery &amp;&amp; !ctrl.lookup.loading" ng-click="ctrl.lookup.recordQuery = ''; ctrl.onRecordQueryChange()" role="button" title="Clear search">×</span>
                                <span class="we-picker-search-spinner" ng-if="ctrl.lookup.loading"><we-loader></we-loader></span>
                                <i class="icon-search we-picker-search-icon" aria-hidden="true" ng-if="!ctrl.lookup.recordQuery &amp;&amp; !ctrl.lookup.loading"></i>
                            </div>

                            <div class="we-picker-section-header">
                                <span class="we-picker-section-title">
                                    <span>{{ctrl.lookup.tableLabel}}</span>
                                    <span class="we-picker-count-badge" ng-if="ctrl.lookup.total" ng-bind="ctrl.lookup.total"></span>
                                    <we-header-loader ng-if="ctrl.lookup.loading || ctrl.lookup.loadingMore"></we-header-loader>
                                </span>
                            </div>

                            <div class="we-picker-list" we-infinite-scroll="ctrl.loadMoreRecords()">
                                <div class="we-picker-empty" ng-if="!ctrl.lookup.loading &amp;&amp; ctrl.lookup.recordResults.length === 0">
                                    <span>No records found</span>
                                </div>
                                <div class="we-picker-empty" ng-if="ctrl.lookup.loading &amp;&amp; ctrl.lookup.recordResults.length === 0">
                                    <span>Loading records…</span>
                                </div>
                                <div class="we-picker-item" ng-repeat="r in ctrl.lookup.recordResults" ng-click="ctrl.chooseRecord(r)" ng-keydown="ctrl.onRecordItemKeydown($event, r)" tabindex="0" role="button">
                                    <span class="we-picker-item-icon" aria-hidden="true"><i ng-class="ctrl.tableIconClass(ctrl.lookup.chosenTable)" aria-hidden="true"></i></span>
                                    <div class="we-picker-item-content">
                                        <span class="we-picker-item-name" ng-if="ctrl.lookup.columns.length" ng-bind-html="(r.values[ctrl.lookup.columns[0].field] || r[ctrl.lookup.columns[0].field] || '—') | weHighlight:ctrl.lookup.recordActiveSearch"></span>
                                        <span class="we-picker-item-id we-code-font" ng-if="ctrl.recordSecondaryText(r)" ng-bind-html="ctrl.recordSecondaryText(r) | weHighlight:ctrl.lookup.recordActiveSearch"></span>
                                    </div>
                                    <div class="we-picker-item-actions">
                                        <a class="we-picker-action-btn" ng-href="/nav_to.do?uri={{ctrl.lookup.chosenTable}}.do%3Fsys_id%3D{{r.sys_id}}" target="_blank" ng-click="$event.stopPropagation()" title="Open in platform" aria-label="Open record in platform">
                                            <i class="icon-open-document-new-tab" aria-hidden="true"></i>
                                        </a>
                                    </div>
                                </div>
                                <div class="we-picker-load-more" ng-if="ctrl.lookup.loadingMore"><we-loader></we-loader></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>

</j:jelly>
`,
    clientScript: `(function () {
    'use strict';

    function _initAngular() {
        if (typeof angular === 'undefined') {
            return;
        }

        var weAssistantApp = angular.module('weAssistantApp', []);

        // Directive: we-infinite-scroll="handler()" — invokes handler when the element is scrolled near its bottom.
        weAssistantApp.directive('weInfiniteScroll', [
            function () {
                var THRESHOLD_PX = 120;
                return {
                    restrict: 'A',
                    link: function (scope, el, attrs) {
                        function onScroll() {
                            var node = el[0];
                            if (node.scrollTop + node.clientHeight >= node.scrollHeight - THRESHOLD_PX) {
                                scope.$apply(function () {
                                    scope.$eval(attrs.weInfiniteScroll);
                                });
                            }
                        }
                        el.on('scroll', onScroll);
                        scope.$on('$destroy', function () {
                            el.off('scroll', onScroll);
                        });
                    },
                };
            },
        ]);

        // Filter: weHighlight — wraps matching search-query text in native <mark> tags.
        weAssistantApp.filter('weHighlight', [
            '$sce',
            function ($sce) {
                function escapeRegex(s) {
                    return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
                }
                function escapeHtml(s) {
                    if (!s) return '';
                    return String(s)
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&#39;');
                }
                return function (text, query) {
                    if (text === null || typeof text === 'undefined') {
                        return '';
                    }
                    var str = String(text);
                    if (!query || typeof query !== 'string' || !query.trim()) {
                        return $sce.trustAsHtml(escapeHtml(str));
                    }
                    var q = query.trim();
                    var regex = new RegExp(escapeRegex(q), 'gi');
                    var out = '';
                    var lastIndex = 0;
                    var match;
                    while ((match = regex.exec(str)) !== null) {
                        out += escapeHtml(str.slice(lastIndex, match.index));
                        out += '<mark>' + escapeHtml(match[0]) + '</mark>';
                        lastIndex = match.index + match[0].length;
                        if (match[0].length === 0) {
                            regex.lastIndex++;
                        }
                    }
                    out += escapeHtml(str.slice(lastIndex));
                    return $sce.trustAsHtml(out);
                };
            },
        ]);

        // Directive: we-loader — inline search-box loading spinner.
        weAssistantApp.directive('weLoader', [
            function () {
                return {
                    restrict: 'E',
                    template:
                        '<svg class="we-loader-icon" aria-hidden="true" viewBox="0 0 16 16">' +
                        '<path d="M13 8a5 5 0 1 1-2.592-4.383c.208.115.47.09.638-.078l.738-.737a.47.47 0 0 0-.067-.735 7 7 0 1 0 2.216 2.216.47.47 0 0 0-.735-.067l-.737.738a.54.54 0 0 0-.078.638A5 5 0 0 1 13 8"/>' +
                        '</svg>',
                };
            },
        ]);

        // Directive: we-header-loader — small spinner shown next to a section header while loading.
        weAssistantApp.directive('weHeaderLoader', [
            function () {
                return {
                    restrict: 'E',
                    template:
                        '<span class="we-header-loader" aria-label="Loading" title="Loading…">' +
                        '<svg class="we-header-loader-icon" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">' +
                        '<circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2" fill="none" opacity="0.25"/>' +
                        '<path d="M8 2a6 6 0 0 1 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>' +
                        '</svg>' +
                        '</span>',
                };
            },
        ]);

        var COMMON_TABLES = [
            { name: 'sp_widget', label: 'Widget' },
            { name: 'sys_script_include', label: 'Script Include' },
            { name: 'sys_script', label: 'Business Rule' },
            { name: 'sp_ng_template', label: 'Angular Template' },
            { name: 'sp_angular_provider', label: 'Angular Provider' },
            { name: 'sys_ui_page', label: 'UI Page' },
            { name: 'sys_ui_script', label: 'UI Script' },
            { name: 'sp_css', label: 'Style Sheet' },
            { name: 'sys_script_client', label: 'Client Script' },
            { name: 'sys_ui_policy', label: 'UI Policy' },
            { name: 'sys_ui_action', label: 'UI Action' },
            { name: 'sys_security_acl', label: 'Access Control (ACL)' },
            { name: 'sys_db_object', label: 'Table' },
            { name: 'sys_properties', label: 'System Property' },
        ];
        COMMON_TABLES.sort(function (a, b) { return a.label.localeCompare(b.label); });

        var COMMON_TABLE_NAMES = {};
        for (var ci = 0; ci < COMMON_TABLES.length; ci++) {
            COMMON_TABLE_NAMES[COMMON_TABLES[ci].name] = true;
        }

        var TABLE_LABELS = {
            sp_widget: 'Widget',
            sp_ng_template: 'Angular Template',
            sp_angular_provider: 'Angular Provider',
        };
        for (var i = 0; i < COMMON_TABLES.length; i++) {
            TABLE_LABELS[COMMON_TABLES[i].name] = COMMON_TABLES[i].label;
        }

        var EMAIL_ONLY_RE = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
        var REDACT_FIELDS = { sys_created_by: true, sys_updated_by: true };

        function tableLabel(table) {
            return TABLE_LABELS[table] || table;
        }

        // Per-table icon overrides; anything unlisted falls back to a generic document icon.
        var TABLE_ICONS = {
            sys_db_object: 'icon-insert-table',
            sp_widget: 'icon-script',
            sys_security_acl: 'icon-locked',
            sys_properties: 'icon-cog',
            sys_script: 'icon-list',
            sp_css: 'icon-marker',
            sp_ng_template: 'icon-layout',
            sp_angular_provider: 'icon-console',
        };
        var DEFAULT_TABLE_ICON = 'icon-document-code';

        function tableIconClass(table) {
            return TABLE_ICONS[table] || DEFAULT_TABLE_ICON;
        }

        function pad(n) {
            return n < 10 ? '0' + n : '' + n;
        }

        // Pretty-prints an XML document in place by inserting indentation text nodes
        // between element children; leaf elements (text/CDATA only) stay inline.
        function indentXmlDoc(doc, spacing) {
            spacing = spacing || '  ';
            function hasElementChild(node) {
                for (var i = 0; i < node.childNodes.length; i++) {
                    if (node.childNodes[i].nodeType === 1) return true;
                }
                return false;
            }
            function indent(node, depth) {
                if (!hasElementChild(node)) return;
                var childPad = '\\n' + spacing.repeat(depth + 1);
                var closePad = '\\n' + spacing.repeat(depth);
                Array.prototype.slice.call(node.childNodes).forEach(function (child) {
                    if (child.nodeType === 3 && !child.textContent.trim()) {
                        node.removeChild(child);
                    }
                });
                var children = Array.prototype.slice.call(node.childNodes);
                children.forEach(function (child) {
                    node.insertBefore(doc.createTextNode(childPad), child);
                });
                node.appendChild(doc.createTextNode(closePad));
                children.forEach(function (child) {
                    if (child.nodeType === 1) indent(child, depth + 1);
                });
            }
            indent(doc.documentElement, 0);
        }

        // Strips unsafe filename characters, collapsing whitespace to underscores.
        function safeFileNameSegment(str) {
            return String(str || '')
                .trim()
                .replace(/[\\\\/:*?"<>|]/g, '')
                .replace(/\\s+/g, '_')
                .replace(/_+/g, '_')
                .replace(/^_+|_+$/g, '')
                .slice(0, 80);
        }

        // Reflects the primary record in the URL without reloading the page.
        function updatePrimaryUrl(table, sysId) {
            try {
                var url = new URL(window.location.href);
                url.searchParams.set('record_table', table);
                url.searchParams.set('record_sys_id', sysId);
                window.history.replaceState(null, '', url.toString());

                // Skip if nested 2+ levels deep (e.g. inside the Assistant modal's iframe).
                if (window.top !== window && window.parent === window.top) {
                    var page = url.pathname.substring(1) + url.search + url.hash;
                    window.top.history.replaceState(null, '', '/now/nav/ui/classic/params/target/' + encodeURIComponent(page));
                }
            } catch (e) {}
        }

        async function runPool(items, worker, concurrency) {
            var idx = 0;
            async function next() {
                while (idx < items.length) {
                    var i = idx++;
                    await worker(items[i], i);
                }
            }
            var workers = [];
            for (var i = 0; i < Math.min(concurrency, items.length); i++) {
                workers.push(next());
            }
            await Promise.all(workers);
        }

        function redactRecordElement(el) {
            var leaves = el.querySelectorAll('*');
            for (var i = 0; i < leaves.length; i++) {
                var node = leaves[i];
                if (node.children.length > 0) {
                    continue;
                }
                var tag = node.tagName;
                var text = (node.textContent || '').trim();
                if (REDACT_FIELDS[tag] || (text && EMAIL_ONLY_RE.test(text))) {
                    node.textContent = '';
                }
            }
        }

        weAssistantApp.controller('WeAssistantCtrl', ['$scope', '$q', '$timeout', function ($scope, $q, $timeout) {
            var ctrl = this;

            function ajax(action, params) {
                var deferred = $q.defer();
                var ga = new GlideAjax('WidgetEditorAssistantAjax');
                ga.addParam('sysparm_name', action);
                if (params) {
                    Object.keys(params).forEach(function (k) {
                        ga.addParam(k, params[k] != null ? String(params[k]) : '');
                    });
                }
                ga.getXML(function (response) {
                    var answer = response.responseXML.documentElement.getAttribute('answer');
                    try {
                        var parsed = JSON.parse(answer);
                        $timeout(function () { deferred.resolve(parsed); });
                    } catch (e) {
                        $timeout(function () { deferred.reject(e); });
                    }
                });
                return deferred.promise;
            }

            ctrl.embeddedInModal = !!(window.WE_ASSISTANT_CONFIG && window.WE_ASSISTANT_CONFIG.embedded);
            ctrl.primary = { table: '', sysId: '', label: '', tableLabel: '', updatedOn: '' };
            ctrl.related = [];
            ctrl.rows = [];
            ctrl.typeCountsList = [];
            var primaryRowObj = null;
            var placeholderRowObj = { placeholder: true, checked: false };
            ctrl.generating = false;
            ctrl.loadingInitial = !!(window.WE_ASSISTANT_CONFIG && window.WE_ASSISTANT_CONFIG.sysId);
            ctrl.progress = { done: 0, total: 0 };
            ctrl.activeSidebarTab = 'xml';
            ctrl.sidebarCollapsed = false;

            if (!ctrl.embeddedInModal) {
                var siteTitle = (window.WE_ASSISTANT_CONFIG && window.WE_ASSISTANT_CONFIG.siteTitle) || 'ServiceNow';
                $scope.$watch(function () { return ctrl.primary.label; }, function (label) {
                    document.title = (label ? label + ' - ' : '') + 'Widget Editor+ Assistant - ' + siteTitle;
                });
            }

            ctrl.selectSidebarTab = function (tab) {
                if (ctrl.activeSidebarTab === tab && !ctrl.sidebarCollapsed) {
                    ctrl.sidebarCollapsed = true;
                } else {
                    ctrl.activeSidebarTab = tab;
                    ctrl.sidebarCollapsed = false;
                }
            };

            ctrl.toggleSidebar = function () {
                ctrl.sidebarCollapsed = !ctrl.sidebarCollapsed;
            };

            ctrl.lookup = {
                open: false,
                mode: 'primary',
                targetRow: null,
                step: 'table',
                tableQuery: '',
                recordQuery: '',
                commonTables: COMMON_TABLES,
                tableResults: [],
                tableTotal: 0,
                tableHasMore: false,
                tableLoading: false,
                tableLoadingMore: false,
                tableActiveSearch: '',
                columns: [],
                recordResults: [],
                chosenTable: '',
                tableLabel: '',
                total: 0,
                hasMore: false,
                loading: false,
                loadingMore: false,
                recordActiveSearch: '',
            };

            // Favourite tables: persisted server-side as a user preference, not localStorage.
            ctrl.favouriteTables = [];

            function sortByLabel(list) {
                list.sort(function (a, b) { return a.label.localeCompare(b.label); });
                return list;
            }

            function saveFavouriteTables() {
                ajax('saveFavouriteTables', { favourites: JSON.stringify(ctrl.favouriteTables) }).then(angular.noop, angular.noop);
            }

            function loadFavouriteTables() {
                return ajax('getFavouriteTables', {}).then(function (res) {
                    if (res.success && angular.isArray(res.favourites)) {
                        ctrl.favouriteTables = sortByLabel(res.favourites.filter(function (t) {
                            return t && t.name && !COMMON_TABLE_NAMES[t.name];
                        }));
                    }
                }, angular.noop);
            }

            ctrl.tokenConfig = {
                charsPerToken: 4,
                ranges: [
                    { max: 15000, level: 'green', label: 'Small' },
                    { max: 150000, level: 'orange', label: 'Moderate' },
                    { max: null, level: 'red', label: 'Large' },
                ],
            };

            function loadTokenConfig() {
                return ajax('getTokenConfig', {}).then(function (res) {
                    if (res && res.success && angular.isArray(res.ranges)) {
                        ctrl.tokenConfig = res;
                    }
                }, angular.noop);
            }

            ctrl.isPresetTable = function (name) {
                return !!COMMON_TABLE_NAMES[name];
            };

            ctrl.tableIconClass = tableIconClass;

            ctrl.isFavouriteTable = function (name) {
                if (!name) return false;
                return ctrl.favouriteTables.some(function (t) { return t.name === name; });
            };

            ctrl.toggleFavouriteTable = function () {
                var name = ctrl.lookup.chosenTable;
                if (!name || ctrl.isPresetTable(name)) return;
                var idx = -1;
                for (var i = 0; i < ctrl.favouriteTables.length; i++) {
                    if (ctrl.favouriteTables[i].name === name) { idx = i; break; }
                }
                if (idx === -1) {
                    ctrl.favouriteTables.push({ name: name, label: ctrl.lookup.tableLabel || tableLabel(name) });
                    sortByLabel(ctrl.favouriteTables);
                } else {
                    ctrl.favouriteTables.splice(idx, 1);
                }
                saveFavouriteTables();
            };

            function storageKey() {
                return 'we_assistant_selection_' + ctrl.primary.table + '_' + ctrl.primary.sysId;
            }

            function rowKey(row) {
                return row.table + ':' + row.sys_id;
            }

            // Exported XML/SCHEMA byte size per row, keyed by rowKey — drives the real token estimate.
            ctrl.rowSizeBytes = {};
            var _sizeFetchInFlight = {};

            function _fetchRowSize(row) {
                var key = rowKey(row);
                var p;
                if (row.table === 'sys_db_object') {
                    p = fetch('/sys_db_object.do?sys_id=' + encodeURIComponent(row.sys_id) + '&XML', { credentials: 'same-origin' })
                        .then(function (r) { return r.text(); })
                        .then(function (metaText) {
                            var metaEl = new DOMParser().parseFromString(metaText, 'text/xml').documentElement.firstElementChild;
                            var nameEl = metaEl ? metaEl.querySelector('name') : null;
                            var targetTable = (nameEl && nameEl.textContent) || row.label;
                            if (!targetTable) return 0;
                            return fetch('/' + encodeURIComponent(targetTable) + '.do?SCHEMA', { credentials: 'same-origin' })
                                .then(function (r) { return r.text(); })
                                .then(function (text) { return new Blob([text]).size; });
                        });
                } else {
                    p = fetch('/' + row.table + '.do?sys_id=' + encodeURIComponent(row.sys_id) + '&XML', { credentials: 'same-origin' })
                        .then(function (r) { return r.text(); })
                        .then(function (text) { return new Blob([text]).size; });
                }
                return p.then(function (size) {
                    ctrl.rowSizeBytes[key] = size || 0;
                }, function () {
                    ctrl.rowSizeBytes[key] = 0;
                }).finally(function () {
                    delete _sizeFetchInFlight[key];
                    $timeout(angular.noop);
                });
            }

            function ensureRowSizesLoaded() {
                var pending = ctrl.rows.filter(function (r) {
                    if (r.placeholder || !r.sys_id || !r.table) return false;
                    var key = rowKey(r);
                    return !ctrl.rowSizeBytes.hasOwnProperty(key) && !_sizeFetchInFlight[key];
                });
                pending.forEach(function (r) { _sizeFetchInFlight[rowKey(r)] = true; });
                if (pending.length) {
                    runPool(pending, _fetchRowSize, 4);
                }
            }

            // Suggested rows the user explicitly removed, so a refresh doesn't re-add them.
            var dismissedSuggestionKeys = {};

            function loadDismissedSuggestions() {
                dismissedSuggestionKeys = {};
                try {
                    var stored = JSON.parse(localStorage.getItem(storageKey()) || 'null');
                    (stored && stored.dismissedSuggestions || []).forEach(function (k) {
                        dismissedSuggestionKeys[k] = true;
                    });
                } catch (e) {}
            }

            function recomputeTypeCounts() {
                var map = {};
                for (var j = 0; j < ctrl.rows.length; j++) {
                    var r = ctrl.rows[j];
                    if (r.placeholder || !r.sys_id || !r.table) continue;
                    var lbl = r.tableLabel || tableLabel(r.table) || r.table;
                    if (!map[lbl]) {
                        map[lbl] = { label: lbl, selectedCount: 0, totalCount: 0 };
                    }
                    map[lbl].totalCount++;
                    if (r.checked) {
                        map[lbl].selectedCount++;
                    }
                }
                var typeCountsList = [];
                Object.keys(map).forEach(function (k) {
                    typeCountsList.push(map[k]);
                });
                typeCountsList.sort(function (a, b) { return a.label.localeCompare(b.label); });
                ctrl.typeCountsList = typeCountsList;
            }

            // Reuses existing row objects across calls so ng-repeat's watch settles; also resets the progress bar.
            function rebuildRows(pinnedAtEndRow) {
                ctrl.progress = { done: 0, total: 0 };
                var rows = [];
                if (ctrl.primary.sysId && ctrl.primary.table) {
                    if (!primaryRowObj) primaryRowObj = {};
                    angular.extend(primaryRowObj, {
                        table: ctrl.primary.table,
                        sys_id: ctrl.primary.sysId,
                        label: ctrl.primary.label || '',
                        tableLabel: ctrl.primary.tableLabel || tableLabel(ctrl.primary.table),
                        updatedOn: ctrl.primary.updatedOn || '',
                        primary: true,
                        suggested: false,
                        manual: false,
                        placeholder: false,
                        checked: true,
                    });
                    rows.push(primaryRowObj);
                } else if (!ctrl.loadingInitial) {
                    rows.push(placeholderRowObj);
                }

                var nonPrimary = ctrl.related.filter(function (r) {
                    return !r.primary && r.sys_id && r.table && r.label;
                });
                if (pinnedAtEndRow && pinnedAtEndRow.sys_id && pinnedAtEndRow.label) {
                    var rest = nonPrimary.filter(function (r) { return r !== pinnedAtEndRow; });
                    rest.sort(function (a, b) {
                        var tA = a.tableLabel || a.table || '';
                        var tB = b.tableLabel || b.table || '';
                        if (tA !== tB) return tA.localeCompare(tB);
                        return (a.label || '').localeCompare(b.label || '');
                    });
                    for (var i = 0; i < rest.length; i++) {
                        rows.push(rest[i]);
                    }
                    rows.push(pinnedAtEndRow);
                } else {
                    nonPrimary.sort(function (a, b) {
                        var tA = a.tableLabel || a.table || '';
                        var tB = b.tableLabel || b.table || '';
                        if (tA !== tB) return tA.localeCompare(tB);
                        return (a.label || '').localeCompare(b.label || '');
                    });
                    for (var j = 0; j < nonPrimary.length; j++) {
                        rows.push(nonPrimary[j]);
                    }
                }

                ctrl.rows = rows;
                recomputeTypeCounts();
                ensureRowSizesLoaded();
            }
            rebuildRows();

            ctrl.totalRowCount = function () {
                return ctrl.rows.filter(function (r) { return !r.placeholder; }).length;
            };

            ctrl.selectedCount = function () {
                return ctrl.rows.filter(function (r) { return r.checked && !r.placeholder; }).length;
            };

            ctrl.rawTokenCount = function () {
                var charsPerToken = (ctrl.tokenConfig && ctrl.tokenConfig.charsPerToken) || 4;
                var bytes = 0;
                for (var i = 0; i < ctrl.rows.length; i++) {
                    var r = ctrl.rows[i];
                    if (r.placeholder || !r.checked) continue;
                    bytes += ctrl.rowSizeBytes[rowKey(r)] || 0;
                }
                return Math.round(bytes / charsPerToken);
            };

            // True while any checked row's export size hasn't been measured yet.
            ctrl.sizesPending = function () {
                for (var i = 0; i < ctrl.rows.length; i++) {
                    var r = ctrl.rows[i];
                    if (r.placeholder || !r.checked) continue;
                    if (!ctrl.rowSizeBytes.hasOwnProperty(rowKey(r))) return true;
                }
                return false;
            };

            ctrl.estimatedTokens = function () {
                var count = ctrl.rawTokenCount();
                if (count === 0) return '0';
                if (count > 100000) {
                    return Math.round(count / 1000) + 'K';
                }
                return String(count);
            };

            ctrl.tokenLevelInfo = function () {
                var count = ctrl.rawTokenCount();
                if (count === 0) {
                    return { level: 'none', label: '' };
                }
                var ranges = (ctrl.tokenConfig && ctrl.tokenConfig.ranges) || [
                    { max: 15000, level: 'green', label: 'Small' },
                    { max: 150000, level: 'orange', label: 'Moderate' },
                    { max: null, level: 'red', label: 'Large' },
                ];
                for (var i = 0; i < ranges.length; i++) {
                    var r = ranges[i];
                    if (r.max === null || r.max === undefined || count <= r.max) {
                        return r;
                    }
                }
                return ranges[ranges.length - 1] || { level: 'red', label: 'Large' };
            };

            ctrl.tokenCardClass = function () {
                var info = ctrl.tokenLevelInfo();
                return info.level ? ('we-token-' + info.level) : '';
            };

            ctrl.isAllSelected = function () {
                var rows = ctrl.rows.filter(function (r) { return !r.placeholder; });
                if (rows.length === 0) return false;
                return rows.every(function (r) { return r.checked; });
            };

            ctrl.toggleSelectAll = function () {
                var target = !ctrl.isAllSelected();
                for (var i = 0; i < ctrl.rows.length; i++) {
                    if (!ctrl.rows[i].primary && !ctrl.rows[i].placeholder) {
                        ctrl.rows[i].checked = target;
                    }
                }
                for (var j = 0; j < ctrl.related.length; j++) {
                    if (!ctrl.related[j].primary) {
                        ctrl.related[j].checked = target;
                    }
                }
                ctrl.saveSelections();
                recomputeTypeCounts();
            };

            ctrl.onSelectionChange = function () {
                ctrl.saveSelections();
                recomputeTypeCounts();
            };

            ctrl.removeRow = function (row) {
                if (row.suggested) {
                    dismissedSuggestionKeys[rowKey(row)] = true;
                }
                ctrl.related = ctrl.related.filter(function (r) { return r !== row; });
                ctrl.saveSelections();
                rebuildRows();
            };

            // Refreshes every row's name/updated-on and re-scans the primary for suggestions.
            ctrl.refreshingAll = false;
            ctrl.refreshAll = function () {
                if (!ctrl.primary.sysId || ctrl.refreshingAll) return;
                ctrl.refreshingAll = true;
                // Refresh re-adds any recommended records the user previously removed.
                dismissedSuggestionKeys = {};
                // Content may have changed since the last measurement.
                ctrl.rowSizeBytes = {};
                ctrl.saveSelections();
                ajax('getRecordLabel', { table: ctrl.primary.table, sys_id: ctrl.primary.sysId }).then(function (res) {
                    if (res.success) {
                        ctrl.primary.label = res.label;
                        ctrl.primary.updatedOn = res.updatedOn;
                    }
                    return loadPrimaryContext();
                }).then(function () {
                    ctrl.refreshingAll = false;
                }, function () {
                    ctrl.refreshingAll = false;
                });
            };

            ctrl.progressPct = function () {
                if (!ctrl.progress.total) return 0;
                return Math.round((ctrl.progress.done / ctrl.progress.total) * 100);
            };

            // localStorage remembers only table+sys_id and checked state, never name/updated-on.
            ctrl.saveSelections = function () {
                try {
                    var manual = ctrl.related.filter(function (r) { return r.manual; })
                        .map(function (r) { return { table: r.table, sys_id: r.sys_id }; });
                    var checked = {};
                    for (var i = 0; i < ctrl.related.length; i++) {
                        var r = ctrl.related[i];
                        if (!r.primary) {
                            checked[rowKey(r)] = r.checked;
                        }
                    }
                    var dismissedSuggestions = Object.keys(dismissedSuggestionKeys);
                    localStorage.setItem(storageKey(), JSON.stringify({ manual: manual, checked: checked, dismissedSuggestions: dismissedSuggestions }));
                } catch (e) {}
            };

            function loadStoredSelections() {
                var stored = null;
                try {
                    stored = JSON.parse(localStorage.getItem(storageKey()) || 'null');
                } catch (e) {}
                if (!stored) {
                    return $q.resolve();
                }

                var existingKeys = new Set(ctrl.related.map(rowKey));
                var manualRows = (stored.manual || []).filter(function (r) {
                    return r && r.table && r.sys_id && !existingKeys.has(r.table + ':' + r.sys_id);
                });
                for (var i = 0; i < manualRows.length; i++) {
                    var r = manualRows[i];
                    ctrl.related.push({
                        table: r.table,
                        sys_id: r.sys_id,
                        label: '',
                        tableLabel: tableLabel(r.table),
                        category: 'Manual',
                        manual: true,
                        suggested: false,
                        checked: true,
                    });
                }

                var checked = stored.checked || {};
                for (var j = 0; j < ctrl.related.length; j++) {
                    var row = ctrl.related[j];
                    if (row.primary) continue;
                    var key = rowKey(row);
                    if (Object.prototype.hasOwnProperty.call(checked, key)) {
                        row.checked = !!checked[key];
                    }
                }

                return validateManualRows();
            }

            function validateManualRows() {
                var manualRows = ctrl.related.filter(function (r) { return r.manual; });
                if (manualRows.length === 0) {
                    return $q.resolve();
                }
                return $q.all(manualRows.map(function (r) {
                    if (!r.table || !r.sys_id) {
                        ctrl.related = ctrl.related.filter(function (x) { return x !== r; });
                        return $q.resolve();
                    }
                    return ajax('getRecordLabel', { table: r.table, sys_id: r.sys_id }).then(function (res) {
                        if (!res || !res.success || !res.label) {
                            ctrl.related = ctrl.related.filter(function (x) { return x !== r; });
                        } else {
                            r.label = res.label;
                            r.updatedOn = res.updatedOn || '';
                            r.tableLabel = res.tableLabel || tableLabel(r.table);
                        }
                    }, function () {
                        ctrl.related = ctrl.related.filter(function (x) { return x !== r; });
                    });
                })).then(function () {
                    ctrl.related = ctrl.related.filter(function (r) {
                        return r.primary || (r.sys_id && r.table && r.label);
                    });
                });
            }

            ctrl.scanningSuggested = false;

            function loadSuggested() {
                // Always resolves so a failed fetch can't stall the rest of loadPrimaryContext.
                ctrl.scanningSuggested = true;
                return ajax('getSuggestedRelated', { table: ctrl.primary.table, sys_id: ctrl.primary.sysId }).then(function (res) {
                    ctrl.scanningSuggested = false;
                    if (!res || !res.success || !res.related) {
                        if (res && res.error) {
                            console.error('[Widget Editor+ Assistant] getSuggestedRelated failed:', res.error);
                        }
                        return;
                    }
                    var existingKeys = new Set(ctrl.related.map(rowKey));
                    for (var i = 0; i < res.related.length; i++) {
                        var row = res.related[i];
                        var key = rowKey(row);
                        if (existingKeys.has(key) || dismissedSuggestionKeys[key]) continue;
                        existingKeys.add(key);
                        ctrl.related.push({
                            table: row.table,
                            sys_id: row.sys_id,
                            label: row.label,
                            tableLabel: tableLabel(row.table),
                            category: row.category,
                            updatedOn: row.updatedOn,
                            manual: false,
                            suggested: true,
                            checked: true,
                        });
                    }
                }, function (err) {
                    ctrl.scanningSuggested = false;
                    console.error('[Widget Editor+ Assistant] getSuggestedRelated request failed:', err);
                });
            }

            function loadPrimaryContext() {
                loadDismissedSuggestions();
                ctrl.related = [{
                    table: ctrl.primary.table,
                    sys_id: ctrl.primary.sysId,
                    label: ctrl.primary.label,
                    tableLabel: ctrl.primary.tableLabel,
                    category: 'Primary record',
                    updatedOn: ctrl.primary.updatedOn,
                    manual: false,
                    primary: true,
                    suggested: false,
                    checked: true,
                }];
                rebuildRows();
                return loadSuggested().then(loadStoredSelections).then(rebuildRows);
            }

            // Lookup Modal methods
            function resetLookupResults() {
                ctrl.lookup.tableQuery = '';
                ctrl.lookup.tableResults = [];
                ctrl.lookup.tableTotal = 0;
                ctrl.lookup.tableHasMore = false;
                ctrl.lookup.tableLoading = false;
                ctrl.lookup.tableLoadingMore = false;
                ctrl.lookup.tableActiveSearch = '';
                ctrl.lookup.recordQuery = '';
                ctrl.lookup.recordResults = [];
                ctrl.lookup.columns = [];
                ctrl.lookup.total = 0;
                ctrl.lookup.hasMore = false;
                ctrl.lookup.recordActiveSearch = '';
            }

            ctrl.openLookup = function (mode) {
                if (mode === 'primary' && ctrl.embeddedInModal) return;
                ctrl.lookup.open = true;
                ctrl.lookup.mode = mode;
                ctrl.lookup.targetRow = null;
                ctrl.lookup.step = 'table';
                resetLookupResults();
            };

            ctrl.openLookupForRow = function (row, step) {
                if (row.primary && ctrl.embeddedInModal) return;
                ctrl.lookup.open = true;
                ctrl.lookup.mode = row.primary ? 'primary' : 'edit';
                ctrl.lookup.targetRow = row;
                ctrl.lookup.chosenTable = row.table;
                ctrl.lookup.tableLabel = row.tableLabel || tableLabel(row.table);
                ctrl.lookup.step = step;
                resetLookupResults();
                if (step === 'record') {
                    loadRecords('', false);
                }
            };

            ctrl.closeLookup = function () {
                ctrl.lookup.open = false;
            };

            ctrl.onModalBackdropClick = function (event) {
                if (event.target === event.currentTarget) {
                    ctrl.closeLookup();
                }
            };

            // Table search (step 1): offset-based lazy loading via scroll, $timeout-debounced.
            var _tableRequestId = 0;
            function loadTables(query, isMore) {
                if (!query) {
                    ctrl.lookup.tableResults = [];
                    ctrl.lookup.tableTotal = 0;
                    ctrl.lookup.tableHasMore = false;
                    ctrl.lookup.tableLoading = false;
                    ctrl.lookup.tableLoadingMore = false;
                    return;
                }
                if (isMore) {
                    ctrl.lookup.tableLoadingMore = true;
                } else {
                    ctrl.lookup.tableLoading = true;
                    ctrl.lookup.tableResults = [];
                }
                var requestId = ++_tableRequestId;
                var offset = isMore ? ctrl.lookup.tableResults.length : 0;

                ajax('searchTables', { query: query, offset: offset }).then(function (res) {
                    if (requestId !== _tableRequestId) return;
                    ctrl.lookup.tableActiveSearch = query;
                    if (res.success) {
                        var found = (res.tables || []).filter(function (t) { return !COMMON_TABLE_NAMES[t.name]; });
                        ctrl.lookup.tableTotal = res.total || 0;
                        ctrl.lookup.tableHasMore = !!res.hasMore;
                        ctrl.lookup.tableResults = isMore ? ctrl.lookup.tableResults.concat(found) : found;
                    }
                    ctrl.lookup.tableLoading = false;
                    ctrl.lookup.tableLoadingMore = false;
                }, function () {
                    if (requestId === _tableRequestId) {
                        ctrl.lookup.tableLoading = false;
                        ctrl.lookup.tableLoadingMore = false;
                    }
                });
            }

            var _tableSearchDebounce;
            ctrl.onTableQueryChange = function () {
                ctrl.lookup.tableLoading = true;
                $timeout.cancel(_tableSearchDebounce);
                _tableSearchDebounce = $timeout(function () {
                    loadTables(ctrl.lookup.tableQuery, false);
                }, 250);
            };

            ctrl.loadMoreTables = function () {
                if (ctrl.lookup.tableLoading || ctrl.lookup.tableLoadingMore || !ctrl.lookup.tableHasMore) return;
                loadTables(ctrl.lookup.tableQuery, true);
            };

            var _recordRequestId = 0;
            // Excludes records already in the bundle, except the one being edited.
            function filterOutSelectedRecords(records) {
                var excludeSysId = ctrl.lookup.targetRow ? ctrl.lookup.targetRow.sys_id : null;
                var selected = {};
                for (var i = 0; i < ctrl.related.length; i++) {
                    var r = ctrl.related[i];
                    if (r.table === ctrl.lookup.chosenTable && r.sys_id !== excludeSysId) {
                        selected[r.sys_id] = true;
                    }
                }
                return records.filter(function (rec) { return !selected[rec.sys_id]; });
            }

            function loadRecords(query, isMore) {
                if (isMore) {
                    ctrl.lookup.loadingMore = true;
                } else {
                    ctrl.lookup.loading = true;
                    ctrl.lookup.recordResults = [];
                }
                var requestId = ++_recordRequestId;
                var offset = isMore ? ctrl.lookup.recordResults.length : 0;

                return ajax('searchRecords', {
                    table: ctrl.lookup.chosenTable,
                    query: query || '',
                    offset: offset,
                }).then(function (res) {
                    if (requestId !== _recordRequestId) return;
                    ctrl.lookup.recordActiveSearch = query || '';
                    if (res.success) {
                        ctrl.lookup.columns = res.columns || [];
                        ctrl.lookup.total = res.total || 0;
                        ctrl.lookup.hasMore = res.hasMore;
                        var records = filterOutSelectedRecords(res.records || []);
                        if (isMore) {
                            ctrl.lookup.recordResults = ctrl.lookup.recordResults.concat(records);
                        } else {
                            ctrl.lookup.recordResults = records;
                        }
                    }
                    ctrl.lookup.loading = false;
                    ctrl.lookup.loadingMore = false;
                }, function () {
                    if (requestId === _recordRequestId) {
                        ctrl.lookup.loading = false;
                        ctrl.lookup.loadingMore = false;
                    }
                });
            }

            ctrl.loadMoreRecords = function () {
                if (ctrl.lookup.loading || ctrl.lookup.loadingMore || !ctrl.lookup.hasMore) return;
                loadRecords(ctrl.lookup.recordQuery, true);
            };

            var _recordSearchDebounce;
            ctrl.onRecordQueryChange = function () {
                ctrl.lookup.loading = true;
                $timeout.cancel(_recordSearchDebounce);
                _recordSearchDebounce = $timeout(function () {
                    loadRecords(ctrl.lookup.recordQuery, false);
                }, 250);
            };

            // Keyboard nav for picker lists: Up/Down moves focus, Enter selects.
            function focusFirstItem(listEl) {
                var first = listEl && listEl.querySelector('.we-picker-item');
                if (first && first.focus) {
                    first.focus();
                    if (typeof first.scrollIntoView === 'function') first.scrollIntoView({ block: 'nearest' });
                }
            }

            function focusLastItem(listEl) {
                var items = listEl ? listEl.querySelectorAll('.we-picker-item') : null;
                if (!items || !items.length) return;
                var last = items[items.length - 1];
                if (last && last.focus) {
                    last.focus();
                    if (typeof last.scrollIntoView === 'function') last.scrollIntoView({ block: 'nearest' });
                }
            }

            function onListSearchKeydown(event, listSelector, onEnterFirst) {
                var key = event && event.key;
                if (key === 'ArrowDown') {
                    event.preventDefault();
                    focusFirstItem(document.querySelector(listSelector));
                } else if (key === 'ArrowUp') {
                    event.preventDefault();
                    focusLastItem(document.querySelector(listSelector));
                } else if (key === 'Enter' && typeof onEnterFirst === 'function') {
                    event.preventDefault();
                    onEnterFirst();
                }
            }

            function onListItemKeydown(event, onSelect) {
                var key = event && event.key;
                if (key === 'Enter' || key === ' ' || key === 'Spacebar') {
                    event.preventDefault();
                    if (typeof onSelect === 'function') onSelect();
                    return;
                }
                if (key !== 'ArrowDown' && key !== 'ArrowUp') return;
                event.preventDefault();
                var el = event.currentTarget;
                var list = el && el.parentElement;
                if (!list) return;
                var items = list.querySelectorAll('.we-picker-item');
                if (!items.length) return;
                var idx = Array.prototype.indexOf.call(items, el);
                var nextIdx;
                if (key === 'ArrowDown') {
                    if (idx === items.length - 1) return;
                    nextIdx = idx + 1;
                } else {
                    if (idx === 0) return;
                    nextIdx = idx - 1;
                }
                var nextItem = items[nextIdx];
                if (nextItem && nextItem.focus) {
                    nextItem.focus();
                    if (typeof nextItem.scrollIntoView === 'function') nextItem.scrollIntoView({ block: 'nearest' });
                }
            }

            ctrl.onTableSearchKeydown = function (event) {
                onListSearchKeydown(event, '.we-picker-col-main .we-picker-item', function () {
                    if (ctrl.lookup.tableResults.length) ctrl.chooseTable(ctrl.lookup.tableResults[0]);
                });
            };

            ctrl.onRecordSearchKeydown = function (event) {
                onListSearchKeydown(event, '.we-picker-col-main .we-picker-item', function () {
                    if (ctrl.lookup.recordResults.length) ctrl.chooseRecord(ctrl.lookup.recordResults[0]);
                });
            };

            ctrl.onTableItemKeydown = function (event, t) {
                onListItemKeydown(event, function () { ctrl.chooseTable(t); });
            };

            ctrl.onRecordItemKeydown = function (event, r) {
                onListItemKeydown(event, function () { ctrl.chooseRecord(r); });
            };

            ctrl.chooseTable = function (t) {
                ctrl.lookup.chosenTable = t.name;
                ctrl.lookup.tableLabel = t.label;
                ctrl.lookup.step = 'record';
                ctrl.lookup.recordQuery = '';
                loadRecords('', false);
            };

            ctrl.recordSecondaryText = function (r) {
                var parts = [];
                for (var i = 1; i < ctrl.lookup.columns.length; i++) {
                    var field = ctrl.lookup.columns[i].field;
                    var val = r.values[field] || r[field];
                    if (val) {
                        parts.push(val);
                    }
                }
                return parts.join(' · ');
            };

            ctrl.chooseRecord = function (r) {
                if (ctrl.lookup.mode === 'primary') {
                    ctrl.primary = {
                        table: ctrl.lookup.chosenTable,
                        sysId: r.sys_id,
                        label: r.label,
                        tableLabel: ctrl.lookup.tableLabel,
                        updatedOn: r.updatedOn,
                    };
                    updatePrimaryUrl(ctrl.primary.table, ctrl.primary.sysId);
                    ctrl.closeLookup();
                    loadPrimaryContext();
                    return;
                }

                if (ctrl.lookup.mode === 'edit' && ctrl.lookup.targetRow) {
                    ctrl.lookup.targetRow.table = ctrl.lookup.chosenTable;
                    ctrl.lookup.targetRow.tableLabel = ctrl.lookup.tableLabel;
                    ctrl.lookup.targetRow.sys_id = r.sys_id;
                    ctrl.lookup.targetRow.label = r.label;
                    ctrl.lookup.targetRow.updatedOn = r.updatedOn;
                    ctrl.saveSelections();
                    ctrl.closeLookup();
                    rebuildRows();
                    return;
                }

                // Add mode
                var exists = ctrl.related.some(function (row) {
                    return row.table === ctrl.lookup.chosenTable && row.sys_id === r.sys_id;
                });
                if (!exists) {
                    var newRecord = {
                        table: ctrl.lookup.chosenTable,
                        sys_id: r.sys_id,
                        label: r.label,
                        tableLabel: ctrl.lookup.tableLabel,
                        category: 'Manual',
                        updatedOn: r.updatedOn,
                        manual: true,
                        suggested: false,
                        checked: true,
                        _justAdded: true,
                    };
                    ctrl.related.push(newRecord);
                    ctrl.saveSelections();

                    // Step 1: Render new row immediately pinned at the bottom of the table
                    rebuildRows(newRecord);
                    ctrl.closeLookup();

                    // Step 2: After short delay, animate smoothly upwards to its sorted position
                    $timeout(function () {
                        var tableEl = document.querySelector('table.we-main-table');
                        var rowEls = tableEl ? tableEl.querySelectorAll('tbody tr[data-row-key]') : [];
                        var prevTops = {};
                        for (var i = 0; i < rowEls.length; i++) {
                            var key = rowEls[i].getAttribute('data-row-key');
                            if (key) {
                                prevTops[key] = rowEls[i].getBoundingClientRect().top;
                            }
                        }

                        // Re-order rows into standard sorted sequence
                        rebuildRows();

                        // FLIP animation
                        $timeout(function () {
                            var updatedRowEls = tableEl ? tableEl.querySelectorAll('tbody tr[data-row-key]') : [];
                            var movedEls = [];
                            for (var j = 0; j < updatedRowEls.length; j++) {
                                var el = updatedRowEls[j];
                                var k = el.getAttribute('data-row-key');
                                if (k && prevTops[k] !== undefined) {
                                    var newTop = el.getBoundingClientRect().top;
                                    var dy = prevTops[k] - newTop;
                                    if (Math.abs(dy) > 1) {
                                        el.style.transition = 'none';
                                        el.style.transform = 'translateY(' + dy + 'px)';
                                        movedEls.push(el);
                                    }
                                }
                            }

                            if (movedEls.length > 0) {
                                window.requestAnimationFrame(function () {
                                    window.requestAnimationFrame(function () {
                                        for (var m = 0; m < movedEls.length; m++) {
                                            movedEls[m].style.transition = 'transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1)';
                                            movedEls[m].style.transform = '';
                                        }
                                        $timeout(function () {
                                            for (var m = 0; m < movedEls.length; m++) {
                                                movedEls[m].style.transition = '';
                                            }
                                            newRecord._justAdded = false;
                                        }, 500);
                                    });
                                });
                            } else {
                                $timeout(function () {
                                    newRecord._justAdded = false;
                                }, 1200);
                            }
                        }, 0);
                    }, 350);
                    return;
                }
                ctrl.closeLookup();
            };

            ctrl.generateXml = async function () {
                var selected = ctrl.rows.filter(function (r) { return r.checked; });
                if (selected.length === 0) {
                    return;
                }
                ctrl.generating = true;
                ctrl.progress = { done: 0, total: selected.length };

                var combinedDoc = document.implementation.createDocument(null, 'unload', null);
                combinedDoc.documentElement.setAttribute('unload', 'widget_editor_assistant_context');

                // Manifest tells a reader what's here and why before it has to parse any record data.
                var manifestEl = combinedDoc.createElement('context_manifest');
                selected.forEach(function (row) {
                    var entryEl = combinedDoc.createElement('record');
                    entryEl.setAttribute('table', row.table);
                    entryEl.setAttribute('name', row.label || row.sys_id);
                    entryEl.setAttribute('role', row.primary ? 'primary' : (row.manual ? 'manual' : 'suggested'));
                    entryEl.setAttribute('reason', row.category || (row.primary ? 'Primary record' : (row.manual ? 'Manual' : 'Related')));
                    manifestEl.appendChild(entryEl);
                });
                combinedDoc.documentElement.appendChild(manifestEl);

                var primaryContainer = combinedDoc.createElement('primary_record');
                var relatedContainer = combinedDoc.createElement('related_records');
                combinedDoc.documentElement.appendChild(primaryContainer);
                combinedDoc.documentElement.appendChild(relatedContainer);

                await runPool(selected, async function (row) {
                    var targetContainer = row.primary ? primaryContainer : relatedContainer;
                    try {
                        if (row.table === 'sys_db_object') {
                            // ?SCHEMA is keyed by the URL's own table, not sys_id — resolve the
                            // actual table name this sys_db_object row represents first, then
                            // export THAT table's schema (e.g. sys_user.do?SCHEMA, no sys_id).
                            var metaResp = await fetch('/sys_db_object.do?sys_id=' + encodeURIComponent(row.sys_id) + '&XML', { credentials: 'same-origin' });
                            var metaText = await metaResp.text();
                            var metaEl = new DOMParser().parseFromString(metaText, 'text/xml').documentElement.firstElementChild;
                            var nameEl = metaEl ? metaEl.querySelector('name') : null;
                            var targetTable = (nameEl && nameEl.textContent) || row.label;
                            if (targetTable) {
                                var schemaResp = await fetch('/' + encodeURIComponent(targetTable) + '.do?SCHEMA', { credentials: 'same-origin' });
                                var schemaText = await schemaResp.text();
                                var schemaEl = new DOMParser().parseFromString(schemaText, 'text/xml').documentElement;
                                redactRecordElement(schemaEl);
                                targetContainer.appendChild(combinedDoc.importNode(schemaEl, true));
                            }
                        } else {
                            var resp = await fetch('/' + row.table + '.do?sys_id=' + encodeURIComponent(row.sys_id) + '&XML', { credentials: 'same-origin' });
                            var text = await resp.text();
                            var parsed = new DOMParser().parseFromString(text, 'text/xml');
                            var children = parsed.documentElement.children;
                            for (var c = 0; c < children.length; c++) {
                                var recordEl = children[c];
                                redactRecordElement(recordEl);
                                targetContainer.appendChild(combinedDoc.importNode(recordEl, true));
                            }
                        }
                    } catch (e) {}
                    $timeout(function () { ctrl.progress.done++; });
                }, 4);

                indentXmlDoc(combinedDoc);
                var xml = new XMLSerializer().serializeToString(combinedDoc);
                var blob = new Blob([xml], { type: 'application/xml' });
                var url = URL.createObjectURL(blob);
                var now = new Date();
                var stamp = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) +
                    '-' + pad(now.getHours()) + '-' + pad(now.getMinutes()) + '-' + pad(now.getSeconds());
                var primaryName = safeFileNameSegment(ctrl.primary.label);
                var a = document.createElement('a');
                a.href = url;
                a.download = 'context-' + (primaryName ? primaryName + '-' : '') + stamp + '.xml';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                $timeout(function () { ctrl.generating = false; });
            };

            function init() {
                loadFavouriteTables();
                loadTokenConfig();
                if (window.WE_ASSISTANT_CONFIG && window.WE_ASSISTANT_CONFIG.sysId) {
                    ctrl.loadingInitial = true;
                    var table = window.WE_ASSISTANT_CONFIG.table || 'sp_widget';
                    var sysId = window.WE_ASSISTANT_CONFIG.sysId;
                    ajax('getRecordLabel', { table: table, sys_id: sysId }).then(function (res) {
                        ctrl.primary = {
                            table: table,
                            sysId: sysId,
                            label: (res && res.success) ? res.label : sysId,
                            tableLabel: (res && res.tableLabel) ? res.tableLabel : tableLabel(table),
                            updatedOn: (res && res.updatedOn) ? res.updatedOn : '',
                        };
                        return loadPrimaryContext();
                    }).catch(function () {
                        rebuildRows();
                    }).finally(function () {
                        ctrl.loadingInitial = false;
                    });
                }
            }

            init();
        }]);

        var appEl = document.getElementById('we-assistant-app');
        if (appEl && !angular.element(appEl).injector()) {
            try {
                angular.bootstrap(appEl, ['weAssistantApp']);
            } catch (e) {}
        }
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
    processingScript: `// This page is fully client-rendered; all data access goes through the
// WidgetEditorAssistantAjax client-callable script include via GlideAjax.`,
})
