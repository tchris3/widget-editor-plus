import { UiPage } from '@servicenow/sdk/core'

UiPage({
    $id: Now.ID['51ec3d258363b61070b8b5dfeeaad36b'],
    category: 'htmleditor',
    endpoint: 'widget_editor_diff.do',
    description:
        'Side-by-side diff viewer for comparing two versions of a Service Portal widget. Displays field-level differences across all widget fields and supports reverting.',
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

    <script>
        var _weDiffConfigParams = new URLSearchParams(window.location.search);
        window.WE_DIFF_CONFIG = {
            record_id:        _weDiffConfigParams.get('record_id') || '',
            table:            _weDiffConfigParams.get('table') || 'sp_widget',
            version_1:        _weDiffConfigParams.get('version_1') || '',
            version_2:        _weDiffConfigParams.get('version_2') || '',
            da_token:         _weDiffConfigParams.get('da_token') || '',
            da_iframe:        _weDiffConfigParams.get('da_iframe') || '',
            da_source:        _weDiffConfigParams.get('da_source') || '',
            diffPageSysId:    '51ec3d258363b61070b8b5dfeeaad36b',
            widgetEditorSysId:'8b2e70458373fe1070b8b5dfeeaad35e',
            siteTitle:        '\${gs.getProperty("glide.product.name", "ServiceNow")}'
        };
    </script>

    <style>
        /* Reset */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        html {
            font-size: 16px; /* anchor 1rem = 16px regardless of platform override */
        }

        html, body {
            background: rgb(var(--now-color_background--primary, 255 255 255));
            color: rgb(var(--now-color_text--primary, 29 29 29));
            overflow: visible !important;
            padding: 0.5rem 0.75rem;
            margin: 0;
        }

        body {
            font-size: var(--now-font-size--md);
        }

        /* App shell */
        .dc-app {
            display: flex;
            flex-direction: column;
        }

        /* Full-page loading overlay */
        #diff-loading {
            position: fixed;
            inset: 0;
            z-index: 100;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(var(--now-color_background--primary, 255 255 255), 0.72);
            backdrop-filter: blur(2px);
        }
        @keyframes dc-spin {
            to { transform: rotate(360deg); }
        }
        #diff-loading .dc-spinner {
            width: 2rem;
            height: 2rem;
            border: 3px solid rgba(var(--now-color_text--tertiary, 114 114 114), 0.25);
            border-top-color: rgba(var(--now-color_text--tertiary, 114 114 114), 0.8);
            border-radius: 50%;
            animation: dc-spin 0.75s linear infinite;
        }

        #diff-error {
            padding: 0.875rem 1rem;
            color: #f47878;
            background: rgba(244, 120, 120, 0.08);
            border-bottom: 1px solid rgba(244, 120, 120, 0.2);
            font-size: var(--now-font-size--md);
        }

        /* Content wrapper — flex column */
        #diff-content {
            flex: 1;
            display: flex;
            flex-direction: column;
        }

        /* Header — sticky so version selects remain visible while scrolling */
        .dc-header {
            background: rgb(var(--now-color_surface--brand-2));
            border-bottom: 1px solid rgba(var(--now-color--neutral-0, 0 0 0), 0.08);
            flex-shrink: 0;
            position: sticky;
            top: 0;
            z-index: 1001;
            margin: -0.825rem -1.125rem 0 -1.125rem; /* negate body padding so header spans full width */
        }
        .dc-header-row {
            padding: 0.75rem 1rem 0.5rem;
            margin: 0 1rem;
        }

        /* Version-select row inside the sticky header */
        .dc-version-row {
            display: flex;
            align-items: stretch;
            min-height: 3.1875rem;
            padding: 0 1.5rem;
            background: rgb(var(--now-color_background--tertiary, 237 237 237));
            border-top: 1px solid rgba(var(--now-color--neutral-0, 0 0 0), 0.06);
        }
        /* Spacer = sft-col-label (7.5rem) + dc-simple-section left border (1px) */
        .dc-version-spacer {
            width: calc(7.5rem + 1px);
            flex-shrink: 0;
            display: flex;
            align-items: center;
        }
        .dc-version-col {
            flex: 1;
            min-width: 0;
            padding: 0.25rem 0.375rem;
            position: relative;
            display: flex;
            align-items: center;
        }

        /* Left half wrapper — groups the left select + Revert button so their combined
           width equals the right select's width (both are flex:1 children of the row). */
        .dc-version-left-half {
            flex: 1;
            min-width: 0;
            display: flex;
            align-items: stretch;
            border-right: 1px solid rgba(var(--now-color--neutral-0, 0 0 0), 0.1);
        }

        .dc-title {
            font-size: var(--now-font-size--lg);
            font-weight: 600;
            color: rgb(var(--now-color_text--primary, 29 29 29));
            display: flex;
            align-items: center;
        }

        .dc-title strong {
            font-weight: 700;
        }

        .dc-meta {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 0;
            font-size: var(--now-font-size--md);
            color: rgb(var(--now-color_text--secondary, 82 82 82));
        }

        .dc-meta-sep {
            margin: 0 0.5rem;
            opacity: 0.35;
        }

        .dc-meta-label {
            color: rgb(var(--now-color_text--tertiary, 114 114 114));
            text-transform: uppercase;
            font-size: var(--now-font-size--md);
            letter-spacing: 0.4px;
            margin-right: 0.25rem;
        }

        .dc-link {
            color: rgb(var(--now-color--primary-2, 0 118 204));
            text-decoration: none;
        }

        .dc-link:hover { text-decoration: underline; }

        /* Inline external-link icon */
        .we-ext-icon {
            display: inline-block;
            width: 0.8125rem;
            height: 0.8125rem;
            vertical-align: -0.1rem;
            flex-shrink: 0;
            margin-left: 0.25rem;
            background-color: currentColor;
            -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
            -webkit-mask-position: center;
            mask-position: center;
            -webkit-mask-size: contain;
            mask-size: contain;
            -webkit-mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCA2NDAgNjQwJz48IS0tIUZvbnQgQXdlc29tZSBGcmVlIHY3LjIuMCBieSBAZm9udGF3ZXNvbWUgLSBodHRwczovL2ZvbnRhd2Vzb21lLmNvbSBMaWNlbnNlIC0gaHR0cHM6Ly9mb250YXdlc29tZS5jb20vbGljZW5zZS9mcmVlIENvcHlyaWdodCAyMDI2IEZvbnRpY29ucywgSW5jLi0tPjxwYXRoIGQ9J00zODQgNjRDMzY2LjMgNjQgMzUyIDc4LjMgMzUyIDk2QzM1MiAxMTMuNyAzNjYuMyAxMjggMzg0IDEyOEw0NjYuNyAxMjhMMjY1LjMgMzI5LjRDMjUyLjggMzQxLjkgMjUyLjggMzYyLjIgMjY1LjMgMzc0LjdDMjc3LjggMzg3LjIgMjk4LjEgMzg3LjIgMzEwLjYgMzc0LjdMNTEyIDE3My4zTDUxMiAyNTZDNTEyIDI3My43IDUyNi4zIDI4OCA1NDQgMjg4QzU2MS43IDI4OCA1NzYgMjczLjcgNTc2IDI1Nkw1NzYgOTZDNTc2IDc4LjMgNTYxLjcgNjQgNTQ0IDY0TDM4NCA2NHpNMTQ0IDE2MEM5OS44IDE2MCA2NCAxOTUuOCA2NCAyNDBMNjQgNDk2QzY0IDU0MC4yIDk5LjggNTc2IDE0NCA1NzZMNDAwIDU3NkM0NDQuMiA1NzYgNDgwIDU0MC4yIDQ4MCA0OTZMNDgwIDQxNkM0ODAgMzk4LjMgNDY1LjcgMzg0IDQ0OCAzODRDNDMwLjMgMzg0IDQxNiAzOTguMyA0MTYgNDE2TDQxNiA0OTZDNDE2IDUwNC44IDQwOC44IDUxMiA0MDAgNTEyTDE0NCA1MTJDMTM1LjIgNTEyIDEyOCA1MDQuOCAxMjggNDk2TDEyOCAyNDBDMTI4IDIzMS4yIDEzNS4yIDIyNCAxNDQgMjI0TDIyNCAyMjRDMjQxLjcgMjI0IDI1NiAyMDkuNyAyNTYgMTkyQzI1NiAxNzQuMyAyNDEuNyAxNjAgMjI0IDE2MEwxNDQgMTYweicvPjwvc3ZnPg==");
            mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCA2NDAgNjQwJz48IS0tIUZvbnQgQXdlc29tZSBGcmVlIHY3LjIuMCBieSBAZm9udGF3ZXNvbWUgLSBodHRwczovL2ZvbnRhd2Vzb21lLmNvbSBMaWNlbnNlIC0gaHR0cHM6Ly9mb250YXdlc29tZS5jb20vbGljZW5zZS9mcmVlIENvcHlyaWdodCAyMDI2IEZvbnRpY29ucywgSW5jLi0tPjxwYXRoIGQ9J00zODQgNjRDMzY2LjMgNjQgMzUyIDc4LjMgMzUyIDk2QzM1MiAxMTMuNyAzNjYuMyAxMjggMzg0IDEyOEw0NjYuNyAxMjhMMjY1LjMgMzI5LjRDMjUyLjggMzQxLjkgMjUyLjggMzYyLjIgMjY1LjMgMzc0LjdDMjc3LjggMzg3LjIgMjk4LjEgMzg3LjIgMzEwLjYgMzc0LjdMNTEyIDE3My4zTDUxMiAyNTZDNTEyIDI3My43IDUyNi4zIDI4OCA1NDQgMjg4QzU2MS43IDI4OCA1NzYgMjczLjcgNTc2IDI1Nkw1NzYgOTZDNTc2IDc4LjMgNTYxLjcgNjQgNTQ0IDY0TDM4NCA2NHpNMTQ0IDE2MEM5OS44IDE2MCA2NCAxOTUuOCA2NCAyNDBMNjQgNDk2QzY0IDU0MC4yIDk5LjggNTc2IDE0NCA1NzZMNDAwIDU3NkM0NDQuMiA1NzYgNDgwIDU0MC4yIDQ4MCA0OTZMNDgwIDQxNkM0ODAgMzk4LjMgNDY1LjcgMzg0IDQ0OCAzODRDNDMwLjMgMzg0IDQxNiAzOTguMyA0MTYgNDE2TDQxNiA0OTZDNDE2IDUwNC44IDQwOC44IDUxMiA0MDAgNTEyTDE0NCA1MTJDMTM1LjIgNTEyIDEyOCA1MDQuOCAxMjggNDk2TDEyOCAyNDBDMTI4IDIzMS4yIDEzNS4yIDIyNCAxNDQgMjI0TDIyNCAyMjRDMjQxLjcgMjI0IDI1NiAyMDkuNyAyNTYgMTkyQzI1NiAxNzQuMyAyNDEuNyAxNjAgMjI0IDE2MEwxNDQgMTYweicvPjwvc3ZnPg==");
        }

        .dc-body {
            flex: 1;
            padding: 0.75rem 0 0 0;
            display: flex;
            flex-direction: column;
            gap: 0.625rem;
            position: relative;
        }

        /* No-versions overlay */
        .dc-no-versions-overlay {
            position: fixed;
            inset: 0;
            z-index: 20;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(var(--now-color_background--primary, 255 255 255), 0.92);
            backdrop-filter: blur(3px);
        }

        .dc-no-versions-content {
            text-align: center;
            padding: 2rem;
        }

        .dc-no-versions-content p {
            font-size: var(--now-font-size--lg);
            color: rgb(var(--now-color_text--secondary, 82 82 82));
            margin-bottom: 1rem;
        }

        /* Simple fields table */
        .dc-simple-section {
            background: rgb(var(--now-color_background--secondary, 246 246 246));
            border: 1px solid rgba(var(--now-color--neutral-0, 0 0 0), 0.08);
            border-radius: 0.25rem;
            overflow: hidden;
            flex-shrink: 0;
        }

        .sft-table {
            width: 100%;
            border-collapse: collapse;
            font-size: var(--now-font-size--md);
            table-layout: fixed;
        }

        .sft-col-label { width: 7.5rem; }


        .sft-row td {
            min-height: 3.1875rem;
            padding: 0.5rem 0.75rem;
            border-bottom: 1px solid rgba(var(--now-color--neutral-0, 0 0 0), 0.1);
            vertical-align: middle;
        }

        /* Textarea rows: top-align the label and value cells so a tall textarea
           sits next to its label instead of pushing the row's contents off-center. */
        .sft-row--top td { vertical-align: top; }

        .sft-row:last-child td { border-bottom: none; }

        .sft-label {
            display: table-cell !important;
            color: rgb(var(--now-color_text--tertiary, 114 114 114));
            border-right: 1px solid rgba(var(--now-color--neutral-0, 0 0 0), 0.1);
            width: 7.5rem;
            cursor: default;
        }

        /* Divider between left and right value columns */
        .sft-table td:nth-child(2) {
            border-right: 1px solid rgba(var(--now-color--neutral-0, 0 0 0), 0.1);
        }

        .sft-label .sft-label-main {
            display: flex;
            align-items: center;
            gap: 0.25rem;
        }

        .sft-val {
            color: rgb(var(--now-color_text--primary, 29 29 29));
            word-break: break-word;
        }

        .sft-textarea {
            resize: vertical;
            min-height: 2rem;
            max-height: 10rem;
            line-height: 1.4;
            overflow-y: auto;
            field-sizing: content;
        }

        .sft-val--cb { vertical-align: middle; }

        .sft-ref-wrap {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            width: 100%;
        }
        .sft-ref-wrap .form-control {
            flex: 1;
            min-width: 0;
        }
        .sft-ref-btn {
            flex-shrink: 0;
            padding: 0.25rem 0.5rem;
            line-height: 1;
        }
        .sft-img-preview {
            max-height: 4rem;
            width: auto;
            flex-shrink: 0;
            background-color: #fff;
            background-image:
                linear-gradient(45deg, #eee 25%, transparent 25%),
                linear-gradient(-45deg, #eee 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #eee 75%),
                linear-gradient(-45deg, transparent 75%, #eee 75%);
            background-size: 18px 18px;
            background-position: 0 0, 0 9px, 9px -9px, -9px 0px;
        }

        /* Boolean SVG icons */
        .sft-bool-icon {
            display: inline-block;
            width: 1.5rem;
            height: 1.5rem;
            vertical-align: middle;
            flex-shrink: 0;
            -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
            -webkit-mask-position: center;
            mask-position: center;
            -webkit-mask-size: contain;
            mask-size: contain;
        }

        .sft-bool-icon--changed { background-color: rgb(var(--now-color--caution-2, 224 150 32)); }
        .sft-bool-icon--same    { background-color: rgba(var(--now-color_text--primary, 29 29 29), 0.28); }

        .sft-bool-icon--true {
            -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect x='1.5' y='1.5' width='21' height='21' rx='4' ry='4' fill='none' stroke='black' stroke-width='2'/%3E%3Cpolyline points='6,12 10,16 18,8' fill='none' stroke='black' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
            mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect x='1.5' y='1.5' width='21' height='21' rx='4' ry='4' fill='none' stroke='black' stroke-width='2'/%3E%3Cpolyline points='6,12 10,16 18,8' fill='none' stroke='black' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
        }

        .sft-bool-icon--false {
            -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect x='1.5' y='1.5' width='21' height='21' rx='4' ry='4' fill='none' stroke='black' stroke-width='2'/%3E%3C/svg%3E");
            mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect x='1.5' y='1.5' width='21' height='21' rx='4' ry='4' fill='none' stroke='black' stroke-width='2'/%3E%3C/svg%3E");
        }

        .sft-changed .sft-label { color: rgb(var(--now-color--caution-2, 224 150 32)); }
        .sft-changed td:first-child { border-left: 3px solid rgb(var(--now-color_alert--high-2, 194 86 0)); }
        .sft-changed .form-control { border-color: rgb(var(--now-color--caution-2, 224 150 32)); }

        /* Diff glyph */
        .diff-glyph {
            color: rgb(var(--now-color--caution-2, 224 150 32));
            margin-left: 0.25rem;
            font-size: 0.75em;
            vertical-align: middle;
        }

        /* Script field accordions */
        .da-section {
            border: 1px solid rgba(var(--now-color--neutral-0, 0 0 0), 0.08);
            border-radius: 0.25rem;
            overflow: hidden;
            background: rgb(var(--now-color_background--secondary, 246 246 246));
        }

        .da-section.da-changed {
            border-color: rgba(var(--now-color_alert--high-2, 194 86 0), 0.4);
            border-left: 3px solid rgb(var(--now-color_alert--high-2, 194 86 0));
        }

        /* Remove native disclosure triangle */
        .da-section > summary { list-style: none; }
        .da-section > summary::-webkit-details-marker { display: none; }

        /* Accordion expand/collapse icons — right-aligned ::after on the flex summary */
        .da-summary::after {
            content: '';
            display: block;
            width: 0.6875rem;
            height: 0.6875rem;
            flex-shrink: 0;
            margin-left: auto;
            background-color: rgba(var(--now-color_text--primary, 29 29 29), 0.4);
            -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 640'%3E%3Cpath d='M352 128C352 110.3 337.7 96 320 96C302.3 96 288 110.3 288 128L288 288L128 288C110.3 288 96 302.3 96 320C96 337.7 110.3 352 128 352L288 352L288 512C288 529.7 302.3 544 320 544C337.7 544 352 529.7 352 512L352 352L512 352C529.7 352 544 337.7 544 320C544 302.3 529.7 288 512 288L352 288L352 128z'/%3E%3C/svg%3E");
            mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 640'%3E%3Cpath d='M352 128C352 110.3 337.7 96 320 96C302.3 96 288 110.3 288 128L288 288L128 288C110.3 288 96 302.3 96 320C96 337.7 110.3 352 128 352L288 352L288 512C288 529.7 302.3 544 320 544C337.7 544 352 529.7 352 512L352 352L512 352C529.7 352 544 337.7 544 320C544 302.3 529.7 288 512 288L352 288L352 128z'/%3E%3C/svg%3E");
            -webkit-mask-size: contain;
            mask-size: contain;
            -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
            -webkit-mask-position: center;
            mask-position: center;
        }
        .da-section[open] .da-summary::after {
            -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 640'%3E%3Cpath d='M96 320C96 302.3 110.3 288 128 288L512 288C529.7 288 544 302.3 544 320C544 337.7 529.7 352 512 352L128 352C110.3 352 96 337.7 96 320z'/%3E%3C/svg%3E");
            mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 640'%3E%3Cpath d='M96 320C96 302.3 110.3 288 128 288L512 288C529.7 288 544 302.3 544 320C544 337.7 529.7 352 512 352L128 352C110.3 352 96 337.7 96 320z'/%3E%3C/svg%3E");
        }

        .da-summary {
            cursor: pointer;
            padding: 0.5rem 0.75rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            user-select: none;
            font-size: var(--now-font-size--md);
        }

        .da-summary:hover {
            background: rgba(var(--now-color_text--primary), 0.05);
        }

        .da-toggle-icon { display: none; }

        .da-label {
            flex: 1;
            display: flex;
            align-items: center;
            color: rgb(var(--now-color_text--primary, 29 29 29));
        }

        .da-label-main {
            display: flex;
            align-items: center;
            gap: 0.25rem;
        }

        .da-field-key {
            font-family: 'Consolas', 'Menlo', 'Monaco', monospace;
            font-size: var(--now-font-size--md);
            color: rgba(var(--now-color_text--primary, 29 29 29), 0.38);
        }

        /* Field key in simple fields table label column */
        .sft-field-key {
            display: block;
            font-family: 'Consolas', 'Menlo', 'Monaco', monospace;
            font-size: var(--now-font-size--md);
            color: rgba(var(--now-color_text--primary, 29 29 29), 0.35);
            margin-top: 0.0625rem;
        }

        .da-same {
            font-size: var(--now-font-size--md);
            color: rgba(var(--now-color_text--primary, 29 29 29), 0.35);
            margin-left: 0.625rem;
        }

        .da-editor-wrap {
            display: flex;
            height: 21.875rem;
        }

        .da-editor-spacer {
            width: 7.5rem;
            flex-shrink: 0;
            display: flex;
            justify-content: flex-end;
            align-items: flex-start;
            padding: 0.375rem 0.375rem 0 0;
        }

        .da-editor-canvas-outer {
            flex: 1;
            min-width: 0;
            position: relative;
        }

        .da-editor-canvas {
            width: 100%;
            height: 100%;
        }

        /* Small spinner reused for column-level loading */
        .dc-spinner-sm {
            width: 1.25rem;
            height: 1.25rem;
            border: 2px solid rgba(var(--now-color_text--tertiary, 114 114 114), 0.2);
            border-top-color: rgba(var(--now-color_text--tertiary, 114 114 114), 0.75);
            border-radius: 50%;
            animation: dc-spin 0.75s linear infinite;
        }

        /* Translucent overlay used for column-level loading (th cells + editor area) */
        .dc-col-overlay {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(var(--now-color_background--primary, 255 255 255), 0.75);
            pointer-events: none;
            z-index: 1;
        }


        .da-editor-loading-overlay {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(var(--now-color_background--primary, 255 255 255), 0.78);
            pointer-events: none;
        }

        /* Column loading overlay for simple fields table */
        .sft-col-loading {
            position: relative;
            pointer-events: none;
        }

        .sft-col-loading::after {
            content: '';
            position: absolute;
            inset: 0;
            background: rgba(var(--now-color_background--primary, 255 255 255), 0.65);
        }

        .da-no-monaco {
            padding: 1rem;
            color: rgba(var(--now-color_text--primary, 29 29 29), 0.45);
            font-style: italic;
            font-size: var(--now-font-size--md);
        }

        /* Bottom indicator for changed fields below viewport */
        .dc-changed-below-indicator {
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            height: 0.75rem;
            pointer-events: none;
            z-index: 1100;
            opacity: 0;
            transition: opacity 600ms cubic-bezier(0.22, 1, 0.36, 1);
            background: linear-gradient(
                180deg,
                rgba(var(--now-color_alert--high-2, 194 86 0), 0),
                rgba(var(--now-color_alert--high-2, 194 86 0), 0.9)
            );
        }

        .dc-changed-below-indicator.is-visible {
            opacity: 1;
        }

        .dc-changed-below-indicator.is-embedded {
            border-bottom-left-radius: var(--now-badge--border-radius, 0.375rem);
            border-bottom-right-radius: var(--now-badge--border-radius, 0.375rem);
            overflow: hidden;
        }

        /* Header row — title + controls */
        .dc-header-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 0.5rem;
        }
        .dc-header-btns {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        /* Custom version column dropdowns */
        .dc-version-dd {
            position: relative;
        }

        button.dc-version-dd-btn {
            width: 100%;
            font-size: var(--now-font-size--md);
            font-family: inherit;
            text-align: left;
            display: flex;
            align-items: center;
            gap: 0.25rem;
            cursor: pointer;
            overflow: hidden;
        }

        button.dc-version-dd-btn.dc-version-dd-btn--error {
            border-color: rgb(var(--now-color--warning-2, 197 132 9));
            color: rgb(var(--now-color--warning-2, 197 132 9));
        }

        .dc-version-dd-btn-label {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .dc-version-dd-btn-chevron {
            flex-shrink: 0;
            font-size: 1em;
            opacity: 0.6;
        }

        .caret { transition: transform 0.2s ease; flex-shrink: 0; }
        .we-caret--open { transform: rotate(180deg); }

        .dc-version-dd-menu {
            position: absolute;
            top: calc(100% + 0.1875rem);
            left: 0;
            right: 0;
            min-width: 21.25rem;
            background: rgb(var(--now-color_background--tertiary, 237 237 237));
            border: 1px solid rgba(var(--now-color--neutral-0, 0 0 0), 0.1);
            max-height: 18.75rem;
            overflow-y: auto;
            z-index: 1000;
            box-shadow: 0 0.375rem 1.25rem rgba(0, 0, 0, 0.65);
            border-radius: 0.3125rem;
        }

        .dc-version-dd-item {
            padding: 0.5rem 0.75rem;
            cursor: pointer;
            font-size: var(--now-font-size--md);
            display: block;
        }

        .dc-version-dd-item + .dc-version-dd-item {
            border-top: 1px solid rgba(var(--now-color--neutral-0, 0 0 0), 0.08);
        }

        .dc-version-dd-item:hover {
            background: rgb(var(--now-dropdown-list_search--background-color--hover));
        }

        .dc-version-dd-item.dc-version-dd-selected {
            background: rgba(var(--now-color--primary-1, 0 118 204), 0.12);
        }

        .dc-vrow {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 0 0.75rem;
            width: 100%;
        }

        .dc-vrow-date { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .dc-vrow-uset {
            color: rgb(var(--now-color_text--tertiary, 114 114 114));
            font-style: italic;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .dc-vrow-user {
            color: rgb(var(--now-color_text--secondary, 82 82 82));
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .dc-current-dot {
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

        /* Inline loading state shown while a version is being fetched */
        .dc-loading-inline {
            padding: 0.75rem 1rem;
            color: rgb(var(--now-color_text--tertiary, 114 114 114));
            font-style: italic;
            font-size: var(--now-font-size--md);
        }

        /* Diff line-count badges (+N -M) */
        .da-diff-counts {
            font-size: var(--now-font-size--md);
            font-weight: 600;
            margin-left: 0.625rem;
        }

        .da-diff-added   { color: rgb(9, 134, 88); }
        .da-diff-removed { color: rgb(191, 41, 41); margin-left: 0.375rem; }


        /* Monaco diff highlight colors — not included in ServiceNow's Monaco bundle */
        .monaco-diff-editor .line-insert  { background-color: rgba(  9, 134,  88, 0.15) !important; }
        .monaco-diff-editor .char-insert  { background-color: rgba(  9, 134,  88, 0.40) !important; }
        .monaco-diff-editor .line-delete  { background-color: rgba(191,  41,  41, 0.15) !important; }
        .monaco-diff-editor .char-delete  { background-color: rgba(191,  41,  41, 0.35) !important; }

        /* Monaco hover/tooltip: ServiceNow's bundle may not inject vscode theme vars when the
           page is rendered inside an iframe, leaving the background transparent. Force it. */
        .monaco-hover {
            background-color: rgb(var(--now-color_background--secondary, 246 246 246)) !important;
            border-color: rgba(var(--now-color--neutral-0, 0 0 0), 0.2) !important;
        }
        html.we-light .monaco-hover {
            background-color: rgb(var(--now-color_background--primary, 255 255 255)) !important;
        }

        /* Widget picker in header title */
        .dc-title-label {
            font-weight: 400;
            margin-right: 0;
        }
        .dc-title-colon {
            font-size: var(--now-font-size--lg);
            font-weight: 600;
            margin-right: 0;
        }

        /* Table picker in header title */
        .dc-table-picker-wrap {
            display: inline-flex;
            align-items: center;
        }
        .dc-table-picker-wrap .select2-container {
            display: inline-block;
            vertical-align: middle;
            min-width: 12rem;
            max-width: 26rem;
        }
        .dc-table-picker-wrap .select2-choice {
            border: none !important;
            border-bottom: 1px dotted rgba(var(--now-color_text--primary, 29 29 29), 0.4) !important;
            border-radius: 0;
            background: transparent !important;
            box-shadow: none !important;
            padding: 0 0 0.125rem 0 !important;
            height: auto !important;
            line-height: 1.2 !important;
            font-size: var(--now-font-size--lg) !important;
            font-weight: 600 !important;
            color: rgb(var(--now-color_text--primary, 29 29 29)) !important;
            position: relative !important;
            margin-top: 0.125rem;
        }
        .dc-table-picker-wrap .select2-chosen {
            padding-left: 0 !important;
            padding-right: 0 !important;
            color: rgb(var(--now-color_text--primary, 29 29 29)) !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            display: block !important;
        }
        .dc-table-picker-wrap .select2-chosen::before {
            content: "\\200B";
            display: inline-block;
        }
        .dc-table-picker-wrap .select2-arrow { display: none !important; }
        .dc-table-picker-wrap .select2-choice { padding-right: 0 !important; }

        .dc-picker-wrap {
            display: inline-flex;
            align-items: center;
            margin-left: 0.5rem;
        }
        .dc-picker-wrap .select2-container {
            display: inline-block;
            vertical-align: middle;
            min-width: 18.75rem;
            max-width: 27.5rem;
        }
        .dc-picker-wrap .select2-choice {
            border: none !important;
            border-bottom: 1px dotted rgba(var(--now-color_text--primary, 29 29 29), 0.4) !important;
            border-radius: 0;
            background: transparent !important;
            box-shadow: none !important;
            padding: 0 1.25rem 0.125rem 0 !important;
            height: auto !important;
            line-height: 1.2 !important;
            font-size: var(--now-font-size--lg) !important;
            font-weight: 700 !important;
            color: rgb(var(--now-color_text--primary, 29 29 29)) !important;
            position: relative !important;
            margin-top: 0.125rem;
        }
        .dc-picker-wrap .select2-chosen {
            padding-left: 0.5rem;
            padding-right: 0 !important;
            color: rgb(var(--now-color_text--primary, 29 29 29)) !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            display: block !important;
        }

        .dc-picker-wrap .select2-chosen::before {
            content: "\\200B";
            display: inline-block;
        }
        
        /* Chevron-down arrow replacing Select2's default sprite */
        .dc-picker-wrap .select2-arrow {
            background: transparent !important;
            border-left: none !important;
            width: 1.25rem !important;
            height: 1.25rem !important;
            position: absolute !important;
            right: 0 !important;
            top: 50% !important;
            transform: translateY(-50%) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
        }
        .dc-picker-wrap .select2-arrow b::before {
            content: none !important;
        }
        .dc-picker-wrap .select2-arrow b {
            display: block !important;
            width: 0.6875rem !important;
            height: 0.4375rem !important;
            background-image: none !important;
            background-color: rgba(var(--now-color_text--primary, 29 29 29), 0.55) !important;
            -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6'%3E%3Cpath d='M0 0.5L5 5.5L10 0.5' stroke='black' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") !important;
            mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6'%3E%3Cpath d='M0 0.5L5 5.5L10 0.5' stroke='black' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") !important;
            -webkit-mask-size: contain !important;
            mask-size: contain !important;
            -webkit-mask-repeat: no-repeat !important;
            mask-repeat: no-repeat !important;
            -webkit-mask-position: center !important;
            mask-position: center !important;
            transition: transform 0.15s ease !important;
        }
        .dc-picker-wrap .select2-container.select2-dropdown-open .select2-arrow b {
            transform: rotate(180deg) !important;
        }
        /* Table name shown after label in the table picker dropdown */
        .dc-table-result-name {
            margin-left: 0.5rem;
            font-size: var(--now-font-size--sm);
            opacity: 0.6;
        }

        /* Table/record picker dropdowns — wider than the inputs so long names aren't cut off */
        .dc-table-picker-drop  { min-width: 26rem !important; }
        .dc-record-picker-drop { min-width: 26rem !important; }

        /* Select2 themed dropdown (appended to body) */
        .select2-drop {
            background: rgb(var(--now-color_background--tertiary, 237 237 237)) !important;
            border: 1px solid rgba(var(--now-color--neutral-0, 0 0 0), 0.15) !important;
            box-shadow: 0 0.25rem 1rem rgba(0, 0, 0, 0.35) !important;
            color: rgb(var(--now-color_text--primary, 29 29 29)) !important;
        }
        .select2-drop .select2-results { background: transparent !important; }
        .select2-drop .select2-result {
            border-bottom: 1px solid rgba(var(--now-color--neutral-0, 0 0 0), 0.07) !important;
        }
        .select2-drop .select2-result:last-child { border-bottom: none !important; }
        .select2-drop .select2-result-label {
            color: rgb(var(--now-color_text--primary, 29 29 29)) !important;
            font-size: var(--now-font-size--md) !important;
            padding: 0.375rem 0.625rem !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            display: block !important;
        }
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
            background: rgb(var(--now-color_background--primary, 255 255 255)) !important;
            background-image: none !important;
            border: 1px solid rgba(var(--now-color--neutral-0, 0 0 0), 0.15) !important;
            color: rgb(var(--now-color_text--primary, 29 29 29)) !important;
            box-shadow: none !important;
        }

        /* Revert button — sits between the two version-column selects */
        .dc-version-revert {
            display: flex;
            align-items: center;
            padding: 0.25rem 0.375rem;
            flex-shrink: 0;
        }

        /* Collapse button — sits in dc-version-spacer when an editor is expanded */
        button.dc-collapse-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            margin-left: 1rem;
            width: 2rem;
            height: 2rem;
        }
        button.dc-collapse-btn::before {
            content: '';
            display: block;
            width: 100%;
            height: 100%;
            background-color: currentColor;
            -webkit-mask-size: 1rem 1rem;
            mask-size: 1rem 1rem;
            -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
            -webkit-mask-position: center;
            mask-position: center;
            -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 640'%3E%3Cpath d='M256 128C256 110.3 241.7 96 224 96C206.3 96 192 110.3 192 128L192 192L128 192C110.3 192 96 206.3 96 224C96 241.7 110.3 256 128 256L224 256C241.7 256 256 241.7 256 224L256 128zM128 384C110.3 384 96 398.3 96 416C96 433.7 110.3 448 128 448L192 448L192 512C192 529.7 206.3 544 224 544C241.7 544 256 529.7 256 512L256 416C256 398.3 241.7 384 224 384L128 384zM448 128C448 110.3 433.7 96 416 96C398.3 96 384 110.3 384 128L384 224C384 241.7 398.3 256 416 256L512 256C529.7 256 544 241.7 544 224C544 206.3 529.7 192 512 192L448 192L448 128zM416 384C398.3 384 384 398.3 384 416L384 512C384 529.7 398.3 544 416 544C433.7 544 448 529.7 448 512L448 448L512 448C529.7 448 544 433.7 544 416C544 398.3 529.7 384 512 384L416 384z'/%3E%3C/svg%3E");
            mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 640'%3E%3Cpath d='M256 128C256 110.3 241.7 96 224 96C206.3 96 192 110.3 192 128L192 192L128 192C110.3 192 96 206.3 96 224C96 241.7 110.3 256 128 256L224 256C241.7 256 256 241.7 256 224L256 128zM128 384C110.3 384 96 398.3 96 416C96 433.7 110.3 448 128 448L192 448L192 512C192 529.7 206.3 544 224 544C241.7 544 256 529.7 256 512L256 416C256 398.3 241.7 384 224 384L128 384zM448 128C448 110.3 433.7 96 416 96C398.3 96 384 110.3 384 128L384 224C384 241.7 398.3 256 416 256L512 256C529.7 256 544 241.7 544 224C544 206.3 529.7 192 512 192L448 192L448 128zM416 384C398.3 384 384 398.3 384 416L384 512C384 529.7 398.3 544 416 544C433.7 544 448 529.7 448 512L448 448L512 448C529.7 448 544 433.7 544 416C544 398.3 529.7 384 512 384L416 384z'/%3E%3C/svg%3E");
        }
        button.dc-collapse-btn:hover::before { background-color: currentColor; }

        /* Expand button — sits in da-editor-spacer, styled to match the Widget Editor burger button */
        button.da-expand-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            margin-right: auto;
            margin-left: 1rem;
            width: 2rem;
            height: 2rem;
        }
      
        button.da-expand-btn::before {
            content: '';
            display: block;
            width: 100%;
            height: 100%;
            background-color: currentColor;
            -webkit-mask-size: 1rem 1rem;
            mask-size: 1rem 1rem;
            -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
            -webkit-mask-position: center;
            mask-position: center;
            -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 640'%3E%3Cpath d='M128 96C110.3 96 96 110.3 96 128L96 224C96 241.7 110.3 256 128 256C145.7 256 160 241.7 160 224L160 160L224 160C241.7 160 256 145.7 256 128C256 110.3 241.7 96 224 96L128 96zM160 416C160 398.3 145.7 384 128 384C110.3 384 96 398.3 96 416L96 512C96 529.7 110.3 544 128 544L224 544C241.7 544 256 529.7 256 512C256 494.3 241.7 480 224 480L160 480L160 416zM416 96C398.3 96 384 110.3 384 128C384 145.7 398.3 160 416 160L480 160L480 224C480 241.7 494.3 256 512 256C529.7 256 544 241.7 544 224L544 128C544 110.3 529.7 96 512 96L416 96zM544 416C544 398.3 529.7 384 512 384C494.3 384 480 398.3 480 416L480 480L416 480C398.3 480 384 494.3 384 512C384 529.7 398.3 544 416 544L512 544C529.7 544 544 529.7 544 512L544 416z'/%3E%3C/svg%3E");
            mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 640'%3E%3Cpath d='M128 96C110.3 96 96 110.3 96 128L96 224C96 241.7 110.3 256 128 256C145.7 256 160 241.7 160 224L160 160L224 160C241.7 160 256 145.7 256 128C256 110.3 241.7 96 224 96L128 96zM160 416C160 398.3 145.7 384 128 384C110.3 384 96 398.3 96 416L96 512C96 529.7 110.3 544 128 544L224 544C241.7 544 256 529.7 256 512C256 494.3 241.7 480 224 480L160 480L160 416zM416 96C398.3 96 384 110.3 384 128C384 145.7 398.3 160 416 160L480 160L480 224C480 241.7 494.3 256 512 256C529.7 256 544 241.7 544 224L544 128C544 110.3 529.7 96 512 96L416 96zM544 416C544 398.3 529.7 384 512 384C494.3 384 480 398.3 480 416L480 480L416 480C398.3 480 384 494.3 384 512C384 529.7 398.3 544 416 544L512 544C529.7 544 544 529.7 544 512L544 416z'/%3E%3C/svg%3E");
        }
        button.da-expand-btn:hover::before { background-color: currentColor; }
        .da-section.da-expanded button.da-expand-btn::before {
            -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 640'%3E%3Cpath d='M256 128C256 110.3 241.7 96 224 96C206.3 96 192 110.3 192 128L192 192L128 192C110.3 192 96 206.3 96 224C96 241.7 110.3 256 128 256L224 256C241.7 256 256 241.7 256 224L256 128zM128 384C110.3 384 96 398.3 96 416C96 433.7 110.3 448 128 448L192 448L192 512C192 529.7 206.3 544 224 544C241.7 544 256 529.7 256 512L256 416C256 398.3 241.7 384 224 384L128 384zM448 128C448 110.3 433.7 96 416 96C398.3 96 384 110.3 384 128L384 224C384 241.7 398.3 256 416 256L512 256C529.7 256 544 241.7 544 224C544 206.3 529.7 192 512 192L448 192L448 128zM416 384C398.3 384 384 398.3 384 416L384 512C384 529.7 398.3 544 416 544C433.7 544 448 529.7 448 512L448 448L512 448C529.7 448 544 433.7 544 416C544 398.3 529.7 384 512 384L416 384z'/%3E%3C/svg%3E");
            mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 640'%3E%3Cpath d='M256 128C256 110.3 241.7 96 224 96C206.3 96 192 110.3 192 128L192 192L128 192C110.3 192 96 206.3 96 224C96 241.7 110.3 256 128 256L224 256C241.7 256 256 241.7 256 224L256 128zM128 384C110.3 384 96 398.3 96 416C96 433.7 110.3 448 128 448L192 448L192 512C192 529.7 206.3 544 224 544C241.7 544 256 529.7 256 512L256 416C256 398.3 241.7 384 224 384L128 384zM448 128C448 110.3 433.7 96 416 96C398.3 96 384 110.3 384 128L384 224C384 241.7 398.3 256 416 256L512 256C529.7 256 544 241.7 544 224C544 206.3 529.7 192 512 192L448 192L448 128zM416 384C398.3 384 384 398.3 384 416L384 512C384 529.7 398.3 544 416 544C433.7 544 448 529.7 448 512L448 448L512 448C529.7 448 544 433.7 544 416C544 398.3 529.7 384 512 384L416 384z'/%3E%3C/svg%3E");
        }

        /* Expanded: da-editor-wrap covers the viewport below the sticky header.
           top is set via inline style by JS (= dc-header.offsetHeight). */
        .da-section.da-expanded .da-editor-wrap {
            position: fixed;
            top: 0; /* overridden by inline style */
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 1000;
            height: auto !important; /* let top + bottom define height; override 21.875rem */
            width: 100%;
            background: rgb(var(--now-color_background--primary, 255 255 255));
        }
        .da-section.da-expanded .da-editor-wrap .da-editor-spacer {
            width: 0 !important;
            overflow: hidden;
        }
        /* Ensure the editor canvas fills the full height of its flex parent */
        .da-section.da-expanded .da-editor-canvas-outer {
            height: 100%;
        }

        /* String-field expand button — sits on the right of long string inputs/textareas */
        .sft-string-wrap {
            display: flex;
            align-items: flex-start;
            gap: 0.25rem;
            width: 100%;
        }
        .sft-string-wrap .form-control {
            flex: 1;
            min-width: 0;
        }
        button.sft-expand-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            width: 2rem;
            height: 2rem;
            padding: 0;
        }
        button.sft-expand-btn::before {
            content: '';
            display: block;
            width: 100%;
            height: 100%;
            background-color: currentColor;
            -webkit-mask-size: 1rem 1rem;
            mask-size: 1rem 1rem;
            -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
            -webkit-mask-position: center;
            mask-position: center;
            -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 640'%3E%3Cpath d='M128 96C110.3 96 96 110.3 96 128L96 224C96 241.7 110.3 256 128 256C145.7 256 160 241.7 160 224L160 160L224 160C241.7 160 256 145.7 256 128C256 110.3 241.7 96 224 96L128 96zM160 416C160 398.3 145.7 384 128 384C110.3 384 96 398.3 96 416L96 512C96 529.7 110.3 544 128 544L224 544C241.7 544 256 529.7 256 512C256 494.3 241.7 480 224 480L160 480L160 416zM416 96C398.3 96 384 110.3 384 128C384 145.7 398.3 160 416 160L480 160L480 224C480 241.7 494.3 256 512 256C529.7 256 544 241.7 544 224L544 128C544 110.3 529.7 96 512 96L416 96zM544 416C544 398.3 529.7 384 512 384C494.3 384 480 398.3 480 416L480 480L416 480C398.3 480 384 494.3 384 512C384 529.7 398.3 544 416 544L512 544C529.7 544 544 529.7 544 512L544 416z'/%3E%3C/svg%3E");
            mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 640'%3E%3Cpath d='M128 96C110.3 96 96 110.3 96 128L96 224C96 241.7 110.3 256 128 256C145.7 256 160 241.7 160 224L160 160L224 160C241.7 160 256 145.7 256 128C256 110.3 241.7 96 224 96L128 96zM160 416C160 398.3 145.7 384 128 384C110.3 384 96 398.3 96 416L96 512C96 529.7 110.3 544 128 544L224 544C241.7 544 256 529.7 256 512C256 494.3 241.7 480 224 480L160 480L160 416zM416 96C398.3 96 384 110.3 384 128C384 145.7 398.3 160 416 160L480 160L480 224C480 241.7 494.3 256 512 256C529.7 256 544 241.7 544 224L544 128C544 110.3 529.7 96 512 96L416 96zM544 416C544 398.3 529.7 384 512 384C494.3 384 480 398.3 480 416L480 480L416 480C398.3 480 384 494.3 384 512C384 529.7 398.3 544 416 544L512 544C529.7 544 544 529.7 544 512L544 416z'/%3E%3C/svg%3E");
        }
        button.sft-expand-btn:hover::before { background-color: currentColor; }

        /* String diff editor overlay — fixed below the sticky header.
           top is set via inline style by JS (= dc-header.offsetHeight). */
        .sft-string-overlay {
            position: fixed;
            top: 0; /* overridden by inline style */
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 1000;
            display: flex;
            background: rgb(var(--now-color_background--primary, 255 255 255));
        }
        .sft-string-overlay .da-editor-canvas-outer {
            flex: 1;
            min-width: 0;
            position: relative;
            height: 100%;
        }

        /* Hide uncompiled Angular template before bootstrap */
        [ng-cloak], .ng-cloak { display: none !important; }

        /* Header label above the extra-changed-fields sections */
        .dc-extra-label {
            font-size: 0.75rem;
            font-weight: 600;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            color: rgb(var(--now-color_text--primary, 29 29 29));
            opacity: 0.45;
            padding: 1.5rem 1rem 0.5rem;
        }
        html.we-light .dc-extra-label {
            opacity: 0.4;
        }

        /* Light mode: boost opacity for elements that are heavily dimmed for dark mode.
           Class applied by JS reading the Polaris --now-color_background--primary variable. */
        html.we-light .dc-meta-sep {
            opacity: 0.6;
        }
        html.we-light .sft-bool-icon--same {
            background-color: rgba(var(--now-color_text--primary, 29 29 29), 0.55);
        }
        html.we-light .da-summary::after {
            background-color: rgba(var(--now-color_text--primary, 29 29 29), 0.55);
        }
        html.we-light .da-field-key {
            color: rgba(var(--now-color_text--primary, 29 29 29), 0.65);
        }
        html.we-light .sft-field-key {
            color: rgba(var(--now-color_text--primary, 29 29 29), 0.62);
        }
        html.we-light .da-same {
            color: rgba(var(--now-color_text--primary, 29 29 29), 0.62);
        }
        html.we-light .da-no-monaco {
            color: rgba(var(--now-color_text--primary, 29 29 29), 0.7);
        }
        /* Light mode: flip the background hierarchy — tertiary page backdrop makes
           sections stand out as white cards, giving clear visual separation. */
        html.we-light,
        html.we-light body {
            background: rgb(var(--now-color_background--tertiary, 237 237 237));
        }
        html.we-light .dc-simple-section,
        html.we-light .da-section {
            background: rgb(var(--now-color_background--primary, 255 255 255));
        }
        /* Light mode: stronger column and row dividers for contrast against white sections */
        html.we-light .sft-row td { border-bottom-color: rgba(var(--now-color--neutral-0, 0 0 0), 0.2); }
        html.we-light .sft-label,
        html.we-light .sft-table td:nth-child(2) { border-right-color: rgba(var(--now-color--neutral-0, 0 0 0), 0.2); }
        html.we-light .dc-version-left-half { border-right-color: rgba(var(--now-color--neutral-0, 0 0 0), 0.2); }
        html.we-light .dc-simple-section,
        html.we-light .da-section { border-color: rgba(var(--now-color--neutral-0, 0 0 0), 0.18); }
    </style>

    <div class="dc-app" id="we-diff-app" ng-controller="WeDiffCtrl as ctrl" ng-cloak="ng-cloak">

        <div class="dc-changed-below-indicator" ng-class="{'is-visible': ctrl.hasChangedBelowViewport, 'is-embedded': ctrl.isEmbedded}"></div>

        <!-- Shared Monaco diff overlay for expanded long string fields -->
        <div class="sft-string-overlay" ng-show="ctrl.expandedString">
            <div class="da-editor-canvas-outer">
                <div id="sft-string-editor" class="da-editor-canvas"></div>
                <div class="da-editor-loading-overlay"
                     ng-show="ctrl.loadingLeft || ctrl.loadingRight">
                    <div class="dc-spinner-sm"></div>
                </div>
            </div>
        </div>

        <!-- Loading overlay (initial page load only) -->
        <div id="diff-loading" ng-show="ctrl.loading"><div class="dc-spinner"></div></div>

        <!-- Error -->
        <div id="diff-error" ng-show="ctrl.errorMsg"><i class="icon-alert-triangle"></i> <span ng-bind="ctrl.errorMsg"></span></div>

        <!-- Content -->
        <div id="diff-content" ng-show="!ctrl.errorMsg">

            <div class="dc-header">
                <div class="dc-header-row" ng-hide="ctrl.isEmbedded">
                    <div class="dc-title">
                        <span class="dc-title-label" ng-if="ctrl.expandedIndex === null &amp;&amp; !ctrl.expandedString">Compare </span>
                        <span class="dc-table-picker-wrap" ng-show="ctrl.expandedIndex === null &amp;&amp; !ctrl.expandedString" we-diff-table-picker="we-diff-table-picker"></span>
                        <span class="dc-title-colon" ng-if="ctrl.expandedIndex === null &amp;&amp; !ctrl.expandedString &amp;&amp; !ctrl.tableNoVersions">:</span>
                        <span class="dc-picker-wrap" ng-show="ctrl.expandedIndex === null &amp;&amp; !ctrl.expandedString &amp;&amp; !ctrl.tableNoVersions" we-diff-record-picker="we-diff-record-picker"></span>
                        <span class="dc-title-label" ng-if="ctrl.expandedIndex !== null || ctrl.expandedString" ng-bind="ctrl.expandedFieldLabel()"></span>
                    </div>
                    <div class="dc-header-btns" ng-hide="ctrl.recordNotFound || ctrl.noRecordSelected || ctrl.tableNoVersions">
                        <button class="btn btn-default" ng-if="ctrl.isSpWidget" ng-hide="ctrl.noVersions" ng-click="ctrl.goToWidgetEditor()" ng-bind="ctrl.isFromList ? 'Close' : (ctrl.hasWidgetEditorOpener ? 'Return to Widget Editor+' : 'Open Widget Editor+')"></button>
                        <a class="btn btn-default" ng-if="!ctrl.isSpWidget &amp;&amp; ctrl.tableLabel" ng-href="{{ctrl.platformUrl}}" target="_blank">Open {{ctrl.tableLabel}}<span class="icon-open-document-new-tab" style="display: inline-block; margin-left: 4px;" aria-hidden="true"></span></a>
                    </div>
                </div>

                <!-- Version-select row — sticky so column headings stay visible while scrolling -->
                <div class="dc-version-row" ng-hide="ctrl.noVersions || ctrl.recordNotFound || ctrl.noRecordSelected || ctrl.tableNoVersions">
                    <div class="dc-version-spacer">
                        <button class="btn btn-default dc-collapse-btn"
                                ng-if="ctrl.expandedIndex !== null || ctrl.expandedString"
                                ng-click="ctrl.collapseAnyExpanded()"
                                title="Collapse editor"
                                aria-label="Collapse editor"></button>
                    </div>
                    <div class="dc-version-left-half">
                    <div class="dc-version-col dc-version-dd" ng-click="$event.stopPropagation()">
                        <button class="btn btn-default dc-version-dd-btn" ng-click="ctrl.toggleVersionCol('left')"
                                ng-disabled="ctrl.loadingLeft" aria-label="Left version"
                                ng-class="{'dc-version-dd-btn--error': ctrl.isSameVersionSelected()}">
                            <span class="dc-version-dd-btn-label" ng-bind="ctrl.leftLabel()"></span>
                            <span class="dc-version-dd-btn-chevron"><span class="caret" ng-class="{'we-caret--open': ctrl.openVersionCol === 'left'}"></span></span>
                        </button>
                                <div class="dc-version-dd-menu" ng-show="ctrl.openVersionCol === 'left'">
                            <div class="dc-version-dd-item"
                                 ng-if="ctrl.currentIsUnsaved"
                                 ng-class="{'dc-version-dd-selected': ctrl.leftVersionId === 'current_saved'}"
                                 ng-click="ctrl.selectLeftVersion('current_saved')">
                                <span class="dc-vrow">
                                    <span class="dc-vrow-date" ng-bind-template="{{ctrl.savedMeta.date}} (Current)" title="{{ctrl.savedMeta.dateFull}}"></span>
                                    <span class="dc-vrow-uset" ng-bind="ctrl.savedMeta.usn" title="{{ctrl.savedMeta.usn}}"></span>
                                    <span class="dc-vrow-user" ng-bind="ctrl.savedMeta.by" title="{{ctrl.savedMeta.by}}"></span>
                                </span>
                            </div>
                            <div class="dc-version-dd-item"
                                 ng-repeat="v in ctrl.leftVersionOptions"
                                 ng-class="{'dc-version-dd-selected': v.sys_id === ctrl.leftVersionId}"
                                 ng-click="ctrl.selectLeftVersion(v.sys_id)">
                                <span class="dc-vrow">
                                    <span class="dc-vrow-date" title="{{ctrl.formatDateFull(v.sys_created_on)}}"><span ng-if="v.state === 'current'" class="dc-current-dot" title="Current"></span><span ng-bind="ctrl.formatDate(v.sys_created_on)"></span></span>
                                    <span class="dc-vrow-uset" ng-bind="v.update_set_name" title="{{v.update_set_name}}
[{{v.update_set_state_label}}]"></span>
                                    <span class="dc-vrow-user" ng-bind="v.sys_created_by" title="{{v.sys_created_by}}"></span>
                                </span>
                            </div>
                        </div>
                        <div class="dc-col-overlay" ng-show="ctrl.loadingLeft">
                            <div class="dc-spinner-sm"></div>
                        </div>
                    </div>
                    <div class="dc-version-revert" ng-if="ctrl.canWrite &amp;&amp; ctrl.leftVersionId &amp;&amp; ctrl.leftVersionId !== 'current_saved'">
                        <button class="btn btn-default dc-revert-btn" ng-click="ctrl.revertToLeft()" ng-disabled="!!ctrl.recordSysPolicy" title="{{ctrl.recordSysPolicy ? (ctrl.recordSysPolicyDisplay + ' protection policy prevents changes') : 'Revert'}}">Revert</button>
                    </div>
                    </div><!-- /.dc-version-left-half -->
                    <div class="dc-version-col dc-version-dd" ng-click="$event.stopPropagation()">
                        <button class="btn btn-default dc-version-dd-btn" ng-click="ctrl.toggleVersionCol('right')"
                                ng-disabled="ctrl.loadingRight" aria-label="Right version" style="margin: 0 0.75rem;"
                                ng-class="{'dc-version-dd-btn--error': ctrl.isSameVersionSelected()}">
                            <span class="dc-version-dd-btn-label" ng-bind="ctrl.rightLabel()"></span>
                            <span class="dc-version-dd-btn-chevron"><span class="caret" ng-class="{'we-caret--open': ctrl.openVersionCol === 'right'}"></span></span>
                        </button>
                                <div class="dc-version-dd-menu" ng-show="ctrl.openVersionCol === 'right'">
                            <div class="dc-version-dd-item"
                                 ng-class="{'dc-version-dd-selected': ctrl.rightVersionId === 'current'}"
                                 ng-click="ctrl.selectRightVersion('current')">
                                <span ng-if="ctrl.currentIsUnsaved">(Unsaved)</span>
                                <span ng-if="!ctrl.currentIsUnsaved" class="dc-vrow">
                                    <span class="dc-vrow-date" ng-bind-template="{{ctrl.currentMeta.date}} (Current)" title="{{ctrl.currentMeta.dateFull}}"></span>
                                    <span class="dc-vrow-uset" ng-bind="ctrl.currentMeta.usn" title="{{ctrl.currentMeta.usn}}"></span>
                                    <span class="dc-vrow-user" ng-bind="ctrl.currentMeta.by" title="{{ctrl.currentMeta.by}}"></span>
                                </span>
                            </div>
                            <div class="dc-version-dd-item"
                                 ng-repeat="v in ctrl.eligibleRightVersions"
                                 ng-class="{'dc-version-dd-selected': v.sys_id === ctrl.rightVersionId}"
                                 ng-click="ctrl.selectRightVersion(v.sys_id)">
                                <span class="dc-vrow">
                                    <span class="dc-vrow-date" title="{{ctrl.formatDateFull(v.sys_created_on)}}"><span ng-if="v.state === 'current'" class="dc-current-dot" title="Current"></span><span ng-bind="ctrl.formatDate(v.sys_created_on)"></span></span>
                                    <span class="dc-vrow-uset" ng-bind="v.update_set_name" title="{{v.update_set_name}}
[{{v.update_set_state_label}}]"></span>
                                    <span class="dc-vrow-user" ng-bind="v.sys_created_by" title="{{v.sys_created_by}}"></span>
                                </span>
                            </div>
                        </div>
                        <div class="dc-col-overlay" ng-show="ctrl.loadingRight">
                            <div class="dc-spinner-sm"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="dc-body">

                <!-- Table does not track versions overlay -->
                <div class="dc-no-versions-overlay" ng-if="ctrl.tableNoVersions">
                    <div class="dc-no-versions-content">
                        <p>Table does not track versions.</p>
                    </div>
                </div>

                <!-- No record selected overlay -->
                <div class="dc-no-versions-overlay" ng-if="ctrl.noRecordSelected &amp;&amp; !ctrl.tableNoVersions">
                    <div class="dc-no-versions-content">
                        <p>Select a record above to compare.</p>
                    </div>
                </div>

                <!-- No-versions overlay -->
                <div class="dc-no-versions-overlay" ng-if="ctrl.noVersions">
                    <div class="dc-no-versions-content">
                        <p>No versions are available for this record.</p>
                        <button class="btn btn-default" ng-if="ctrl.isSpWidget" ng-click="ctrl.openWidgetEditorNew()">Open in Widget Editor+</button>
                    </div>
                </div>

                <!-- Record not found overlay -->
                <div class="dc-no-versions-overlay" ng-if="ctrl.recordNotFound">
                    <div class="dc-no-versions-content">
                        <p>Record not found.</p>
                    </div>
                </div>

                <!-- Simple fields + version selects -->
                <div class="dc-simple-section">
                    <table class="sft-table">
                        <colgroup><col class="sft-col-label" /><col /><col /></colgroup>
                        <tbody>
                            <!-- Metadata rows -->
                            <tr class="sft-row" ng-if="ctrl.metaLeft.usn || ctrl.metaRight.usn">
                                <td class="sft-label" we-tooltip="source.name">Update set</td>
                                <td class="sft-val" ng-class="{'sft-col-loading': ctrl.loadingLeft}">
                                    <a ng-if="ctrl.metaLeft.uss" class="dc-link"
                                       ng-href="/nav_to.do?uri=sys_update_set.do%3Fsys_id%3D{{ctrl.metaLeft.uss}}"
                                       target="_blank">{{ctrl.metaLeft.usn}}<span class="we-ext-icon" aria-hidden="true"></span></a>
                                    <span ng-if="!ctrl.metaLeft.uss" ng-bind="ctrl.metaLeft.usn"></span>
                                </td>
                                <td class="sft-val" ng-class="{'sft-col-loading': ctrl.loadingRight}">
                                    <a ng-if="ctrl.metaRight.uss" class="dc-link"
                                       ng-href="/nav_to.do?uri=sys_update_set.do%3Fsys_id%3D{{ctrl.metaRight.uss}}"
                                       target="_blank">{{ctrl.metaRight.usn}}<span class="we-ext-icon" aria-hidden="true"></span></a>
                                    <span ng-if="!ctrl.metaRight.uss" ng-bind="ctrl.metaRight.usn"></span>
                                </td>
                            </tr>

                            <tr class="sft-row" ng-if="ctrl.metaLeft.by || ctrl.metaRight.by">
                                <td class="sft-label" we-tooltip="sys_created_by">Created by</td>
                                <td class="sft-val" ng-class="{'sft-col-loading': ctrl.loadingLeft}">
                                    <input type="text" class="form-control" readonly="readonly" ng-model="ctrl.metaLeft.by"
                                           aria-label="Created by (left)" />
                                </td>
                                <td class="sft-val" ng-class="{'sft-col-loading': ctrl.loadingRight}">
                                    <input type="text" class="form-control" readonly="readonly" ng-model="ctrl.metaRight.by"
                                           aria-label="Created by (right)" />
                                </td>
                            </tr>

                            <!-- Simple field rows -->
                            <tr class="sft-row" ng-repeat="f in ctrl.simpleFields"
                                ng-class="{'sft-changed': ctrl.isChanged(f.key), 'sft-row--top': f.renderAs === 'textarea'}">
                                <td class="sft-label" we-tooltip="{{f.key}}">
                                    <div class="sft-label-main">
                                        <span ng-bind="f.label"></span>
                                        <span class="diff-glyph" ng-if="ctrl.isChanged(f.key)"><i class="icon-circle-solid"></i></span>
                                    </div>
                                </td>

                                <!-- Left value -->
                                <td class="sft-val"
                                    ng-class="{'sft-val--cb': f.renderAs === 'boolean', 'sft-col-loading': ctrl.loadingLeft}"
                                    ng-switch="f.renderAs">
                                    <span ng-switch-when="boolean"
                                          ng-if="ctrl.leftFields[f.key] !== null"
                                          class="sft-bool-icon"
                                          ng-class="[ctrl.boolValClass(ctrl.leftFields[f.key]), ctrl.isChanged(f.key) ? 'sft-bool-icon--changed' : 'sft-bool-icon--same']"
                                          aria-label="{{ctrl.leftFields[f.key]}}"></span>
                                    <span ng-switch-when="textarea" class="sft-string-wrap">
                                        <textarea class="form-control sft-textarea"
                                                  readonly="readonly" ng-model="ctrl.leftDisplayFields[f.key]"
                                                  aria-label="{{f.label}} (left)"></textarea>
                                        <button ng-if="ctrl.shouldShowStringExpand(f, false)"
                                                class="btn btn-default sft-expand-btn"
                                                ng-click="ctrl.toggleStringExpand(f, false, $event)"
                                                title="Expand"
                                                aria-label="Expand"></button>
                                    </span>
                                    <span ng-switch-when="reference" class="sft-ref-wrap">
                                        <input type="text" class="form-control"
                                               readonly="readonly" ng-model="ctrl.leftRefDisplay[f.key]"
                                               aria-label="{{f.label}} (left)" />
                                        <a class="btn btn-default sft-ref-btn"
                                           ng-href="{{ctrl.getReferenceUrl(f, 'left')}}"
                                           ng-if="ctrl.leftFields[f.key]"
                                           target="_blank"
                                           title="Open record"><i class="icon-open-document-new-tab"></i></a>
                                    </span>
                                    <input ng-switch-when="choice" type="text" class="form-control"
                                           readonly="readonly" ng-model="ctrl.leftRefDisplay[f.key]"
                                           aria-label="{{f.label}} (left)" />
                                    <a ng-switch-when="image"
                                       ng-if="ctrl.leftFields[f.key]" ng-href="/{{ctrl.leftFields[f.key]}}.iix"
                                       target="_blank">
                                        <img ng-src="/{{ctrl.leftFields[f.key]}}.iix?t=medium"
                                             class="sft-img-preview" ng-attr-alt="{{ctrl.leftFields[f.key]}}" ng-attr-title="{{ctrl.leftFields[f.key]}}" />
                                    </a>
                                    <span ng-switch-default="ng-switch-default" class="sft-string-wrap">
                                        <input type="text" class="form-control"
                                               readonly="readonly" ng-model="ctrl.leftDisplayFields[f.key]"
                                               aria-label="{{f.label}} (left)" />
                                        <button ng-if="ctrl.shouldShowStringExpand(f, false)"
                                                class="btn btn-default sft-expand-btn"
                                                ng-click="ctrl.toggleStringExpand(f, false, $event)"
                                                title="Expand"
                                                aria-label="Expand"></button>
                                    </span>
                                </td>

                                <!-- Right value -->
                                <td class="sft-val"
                                    ng-class="{'sft-val--cb': f.renderAs === 'boolean', 'sft-col-loading': ctrl.loadingRight}"
                                    ng-switch="f.renderAs">
                                    <span ng-switch-when="boolean"
                                          ng-if="ctrl.rightFields[f.key] !== null"
                                          class="sft-bool-icon"
                                          ng-class="[ctrl.boolValClass(ctrl.rightFields[f.key]), ctrl.isChanged(f.key) ? 'sft-bool-icon--changed' : 'sft-bool-icon--same']"
                                          aria-label="{{ctrl.rightFields[f.key]}}"></span>
                                    <span ng-switch-when="textarea" class="sft-string-wrap">
                                        <textarea class="form-control sft-textarea"
                                                  readonly="readonly" ng-model="ctrl.rightDisplayFields[f.key]"
                                                  aria-label="{{f.label}} (right)"></textarea>
                                        <button ng-if="ctrl.shouldShowStringExpand(f, false)"
                                                class="btn btn-default sft-expand-btn"
                                                ng-click="ctrl.toggleStringExpand(f, false, $event)"
                                                title="Expand"
                                                aria-label="Expand"></button>
                                    </span>
                                    <span ng-switch-when="reference" class="sft-ref-wrap">
                                        <input type="text" class="form-control"
                                               readonly="readonly" ng-model="ctrl.rightRefDisplay[f.key]"
                                               aria-label="{{f.label}} (right)" />
                                        <a class="btn btn-default sft-ref-btn"
                                           ng-href="{{ctrl.getReferenceUrl(f, 'right')}}"
                                           ng-if="ctrl.rightFields[f.key]"
                                           target="_blank"
                                           title="Open record"><i class="icon-open-document-new-tab"></i></a>
                                    </span>
                                    <input ng-switch-when="choice" type="text" class="form-control"
                                           readonly="readonly" ng-model="ctrl.rightRefDisplay[f.key]"
                                           aria-label="{{f.label}} (right)" />
                                    <a ng-switch-when="image"
                                       ng-if="ctrl.rightFields[f.key]" ng-href="/{{ctrl.rightFields[f.key]}}.iix"
                                       target="_blank">
                                        <img ng-src="/{{ctrl.rightFields[f.key]}}.iix?t=medium"
                                             class="sft-img-preview" ng-attr-alt="{{ctrl.rightFields[f.key]}}" ng-attr-title="{{ctrl.rightFields[f.key]}}" />
                                    </a>
                                    <span ng-switch-default="ng-switch-default" class="sft-string-wrap">
                                        <input type="text" class="form-control"
                                               readonly="readonly" ng-model="ctrl.rightDisplayFields[f.key]"
                                               aria-label="{{f.label}} (right)" />
                                        <button ng-if="ctrl.shouldShowStringExpand(f, false)"
                                                class="btn btn-default sft-expand-btn"
                                                ng-click="ctrl.toggleStringExpand(f, false, $event)"
                                                title="Expand"
                                                aria-label="Expand"></button>
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Script field accordions -->
                <details ng-repeat="f in ctrl.scriptFields track by $index"
                         we-diff-accordion="we-diff-accordion"
                         class="da-section"
                         ng-class="{'da-changed': f.changed, 'da-expanded': ctrl.expandedIndex === $index}"
                         id="da-{{$index}}">
                    <summary class="da-summary">
                        <span class="da-toggle-icon"><i class="icon-chevron-right"></i></span>
                        <span class="da-label">
                            <span class="da-label-main" we-tooltip="{{f.key}}">
                                <span ng-bind="f.label"></span>
                                <span class="diff-glyph" ng-if="f.changed"><i class="icon-circle-solid"></i></span>
                                <span class="da-diff-counts" ng-if="f.changed &amp;&amp; f.counts">
                                    <span class="da-diff-added" ng-if="f.counts.added" ng-bind-template="+{{f.counts.added}}"></span>
                                    <span ng-if="f.counts.added &amp;&amp; f.counts.removed"> </span>
                                    <span class="da-diff-removed" ng-if="f.counts.removed" ng-bind-template="-{{f.counts.removed}}"></span>
                                </span>
                                <span class="da-same" ng-if="!f.changed">Unchanged</span>
                            </span>
                        </span>
                    </summary>
                    <div class="da-editor-wrap">
                        <div class="da-editor-spacer">
                            <button class="btn btn-default da-expand-btn" ng-click="ctrl.toggleExpand($index, $event)"
                                    title="{{ctrl.expandedIndex === $index ? 'Collapse editor' : 'Expand editor'}}"
                                    aria-label="{{ctrl.expandedIndex === $index ? 'Collapse editor' : 'Expand editor'}}"></button>
                        </div>
                        <div class="da-editor-canvas-outer">
                            <div id="da-ed-{{$index}}" class="da-editor-canvas"></div>
                            <div class="da-editor-loading-overlay"
                                 ng-show="ctrl.loadingLeft || ctrl.loadingRight">
                                <div class="dc-spinner-sm"></div>
                            </div>
                        </div>
                    </div>
                </details>

                <!-- Extra changed fields not in the Default view form layout -->
                <div ng-if="ctrl.extraChangedSimpleFields.length > 0 || ctrl.extraChangedScriptFields.length > 0">
                    <div class="dc-extra-label">Other changed fields</div>

                    <!-- Extra simple / non-code fields -->
                    <div class="dc-simple-section" ng-if="ctrl.extraChangedSimpleFields.length > 0">
                        <table class="sft-table">
                            <colgroup><col class="sft-col-label" /><col /><col /></colgroup>
                            <tbody>
                                <tr class="sft-row sft-changed" ng-repeat="f in ctrl.extraChangedSimpleFields"
                                    ng-class="{'sft-row--top': f.renderAs === 'textarea'}">
                                    <td class="sft-label" we-tooltip="{{f.key}}">
                                        <div class="sft-label-main">
                                            <span ng-bind="f.label"></span>
                                            <span class="diff-glyph"><i class="icon-circle-solid"></i></span>
                                        </div>
                                    </td>

                                    <td class="sft-val"
                                        ng-class="{'sft-val--cb': f.renderAs === 'boolean', 'sft-col-loading': ctrl.loadingLeft}"
                                        ng-switch="f.renderAs">
                                        <span ng-switch-when="boolean"
                                              ng-if="ctrl.extraLeftFields[f.key] !== null"
                                              class="sft-bool-icon sft-bool-icon--changed"
                                              ng-class="ctrl.boolValClass(ctrl.extraLeftFields[f.key])"
                                              aria-label="{{ctrl.extraLeftFields[f.key]}}"></span>
                                        <span ng-switch-when="textarea" class="sft-string-wrap">
                                            <textarea class="form-control sft-textarea"
                                                      readonly="readonly" ng-model="ctrl.extraLeftDisplayFields[f.key]"
                                                      aria-label="{{f.label}} (left)"></textarea>
                                            <button ng-if="ctrl.shouldShowStringExpand(f, true)"
                                                    class="btn btn-default sft-expand-btn"
                                                    ng-click="ctrl.toggleStringExpand(f, true, $event)"
                                                    title="Expand"
                                                    aria-label="Expand"></button>
                                        </span>
                                        <span ng-switch-when="reference" class="sft-ref-wrap">
                                            <input type="text" class="form-control"
                                                   readonly="readonly" ng-model="ctrl.extraLeftRefDisplay[f.key]"
                                                   aria-label="{{f.label}} (left)" />
                                            <a class="btn btn-default sft-ref-btn"
                                               ng-href="{{ctrl.getExtraReferenceUrl(f, 'left')}}"
                                               ng-if="ctrl.extraLeftFields[f.key]"
                                               target="_blank"
                                               title="Open record"><i class="icon-open-document-new-tab"></i></a>
                                        </span>
                                        <input ng-switch-when="choice" type="text" class="form-control"
                                               readonly="readonly" ng-model="ctrl.extraLeftRefDisplay[f.key]"
                                               aria-label="{{f.label}} (left)" />
                                        <a ng-switch-when="image"
                                           ng-if="ctrl.extraLeftFields[f.key]" ng-href="/{{ctrl.extraLeftFields[f.key]}}.iix"
                                           target="_blank">
                                            <img ng-src="/{{ctrl.extraLeftFields[f.key]}}.iix?t=medium"
                                                 class="sft-img-preview" ng-attr-alt="{{ctrl.extraLeftFields[f.key]}}" ng-attr-title="{{ctrl.extraLeftFields[f.key]}}" />
                                        </a>
                                        <span ng-switch-default="ng-switch-default" class="sft-string-wrap">
                                            <input type="text" class="form-control"
                                                   readonly="readonly" ng-model="ctrl.extraLeftDisplayFields[f.key]"
                                                   aria-label="{{f.label}} (left)" />
                                            <button ng-if="ctrl.shouldShowStringExpand(f, true)"
                                                    class="btn btn-default sft-expand-btn"
                                                    ng-click="ctrl.toggleStringExpand(f, true, $event)"
                                                    title="Expand"
                                                    aria-label="Expand"></button>
                                        </span>
                                    </td>

                                    <td class="sft-val"
                                        ng-class="{'sft-val--cb': f.renderAs === 'boolean', 'sft-col-loading': ctrl.loadingRight}"
                                        ng-switch="f.renderAs">
                                        <span ng-switch-when="boolean"
                                              ng-if="ctrl.extraRightFields[f.key] !== null"
                                              class="sft-bool-icon sft-bool-icon--changed"
                                              ng-class="ctrl.boolValClass(ctrl.extraRightFields[f.key])"
                                              aria-label="{{ctrl.extraRightFields[f.key]}}"></span>
                                        <span ng-switch-when="textarea" class="sft-string-wrap">
                                            <textarea class="form-control sft-textarea"
                                                      readonly="readonly" ng-model="ctrl.extraRightDisplayFields[f.key]"
                                                      aria-label="{{f.label}} (right)"></textarea>
                                            <button ng-if="ctrl.shouldShowStringExpand(f, true)"
                                                    class="btn btn-default sft-expand-btn"
                                                    ng-click="ctrl.toggleStringExpand(f, true, $event)"
                                                    title="Expand"
                                                    aria-label="Expand"></button>
                                        </span>
                                        <span ng-switch-when="reference" class="sft-ref-wrap">
                                            <input type="text" class="form-control"
                                                   readonly="readonly" ng-model="ctrl.extraRightRefDisplay[f.key]"
                                                   aria-label="{{f.label}} (right)" />
                                            <a class="btn btn-default sft-ref-btn"
                                               ng-href="{{ctrl.getExtraReferenceUrl(f, 'right')}}"
                                               ng-if="ctrl.extraRightFields[f.key]"
                                               target="_blank"
                                               title="Open record"><i class="icon-open-document-new-tab"></i></a>
                                        </span>
                                        <input ng-switch-when="choice" type="text" class="form-control"
                                               readonly="readonly" ng-model="ctrl.extraRightRefDisplay[f.key]"
                                               aria-label="{{f.label}} (right)" />
                                        <a ng-switch-when="image"
                                           ng-if="ctrl.extraRightFields[f.key]" ng-href="/{{ctrl.extraRightFields[f.key]}}.iix"
                                           target="_blank">
                                            <img ng-src="/{{ctrl.extraRightFields[f.key]}}.iix?t=medium"
                                                 class="sft-img-preview" ng-attr-alt="{{ctrl.extraRightFields[f.key]}}" ng-attr-title="{{ctrl.extraRightFields[f.key]}}" />
                                        </a>
                                        <span ng-switch-default="ng-switch-default" class="sft-string-wrap">
                                            <input type="text" class="form-control"
                                                   readonly="readonly" ng-model="ctrl.extraRightDisplayFields[f.key]"
                                                   aria-label="{{f.label}} (right)" />
                                            <button ng-if="ctrl.shouldShowStringExpand(f, true)"
                                                    class="btn btn-default sft-expand-btn"
                                                    ng-click="ctrl.toggleStringExpand(f, true, $event)"
                                                    title="Expand"
                                                    aria-label="Expand"></button>
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Extra code / script fields -->
                    <details ng-repeat="f in ctrl.extraChangedScriptFields track by $index"
                             we-diff-extra-accordion="we-diff-extra-accordion"
                             class="da-section da-changed"
                             id="da-extra-{{$index}}">
                        <summary class="da-summary">
                            <span class="da-toggle-icon"><i class="icon-chevron-right"></i></span>
                            <span class="da-label">
                                <span class="da-label-main" we-tooltip="{{f.key}}">
                                    <span ng-bind="f.label"></span>
                                    <span class="diff-glyph"><i class="icon-circle-solid"></i></span>
                                    <span class="da-diff-counts" ng-if="f.counts">
                                        <span class="da-diff-added" ng-if="f.counts.added" ng-bind-template="+{{f.counts.added}}"></span>
                                        <span ng-if="f.counts.added &amp;&amp; f.counts.removed"> </span>
                                        <span class="da-diff-removed" ng-if="f.counts.removed" ng-bind-template="-{{f.counts.removed}}"></span>
                                    </span>
                                </span>
                            </span>
                        </summary>
                        <div class="da-editor-wrap">
                            <div class="da-editor-spacer"></div>
                            <div class="da-editor-canvas-outer">
                                <div id="da-ex-ed-{{$index}}" class="da-editor-canvas"></div>
                                <div class="da-editor-loading-overlay"
                                     ng-show="ctrl.loadingLeft || ctrl.loadingRight">
                                    <div class="dc-spinner-sm"></div>
                                </div>
                            </div>
                        </div>
                    </details>
                </div>

            </div>
        </div>
    </div>

</j:jelly>
`,
    clientScript: `(function() {
    'use strict';

    // -----------------------------------------------------------------------------
    // Config
    // -----------------------------------------------------------------------------
    var SITE_TITLE = (window.WE_DIFF_CONFIG && window.WE_DIFF_CONFIG.siteTitle) || 'ServiceNow';

    // Suppress "Unexpected usage" rejections from language service workers
    window.addEventListener('unhandledrejection', function(e) {
        if (e.reason && e.reason.message === 'Unexpected usage') {
            e.preventDefault();
        }
    });

    function _ensureMonacoWorker() {
        if (!window.MonacoEnvironment) {
            window.MonacoEnvironment = {};
        }
        if (typeof window.MonacoEnvironment.getWorker === 'function') {
            return;
        }
        var wb = '/scripts/snc-code-editor/';
        window.MonacoEnvironment.getWorker = function(workerId, label) {
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

    var _langServicesSetup = false;
    function _setupLanguageServices() {
        if (_langServicesSetup || !window.monaco) { return; }
        _langServicesSetup = true;

        // Disable semantic/suggestion diagnostics — semantic squiggles are misleading without
        // full type context, but syntax errors are kept so devs can spot real issues in a diff.
        if (monaco.languages && monaco.languages.typescript) {
            var _noValidation = {
                noSemanticValidation: true,
                noSuggestionDiagnostics: true
            };
            var _jsDef = monaco.languages.typescript.javascriptDefaults;
            if (_jsDef && _jsDef.setDiagnosticsOptions) { _jsDef.setDiagnosticsOptions(_noValidation); }
            var _tsDef = monaco.languages.typescript.typescriptDefaults;
            if (_tsDef && _tsDef.setDiagnosticsOptions) { _tsDef.setDiagnosticsOptions(_noValidation); }
        }

        _initMonacoPlus();

        // Register a lightweight JSON tokenizer (no worker, no validation squiggles)
        if (
            monaco.languages &&
            !monaco.languages.getLanguages().some(function(l) { return l.id === 'we-json'; })
        ) {
            monaco.languages.register({ id: 'we-json' });
            monaco.languages.setMonarchTokensProvider('we-json', {
                defaultToken: '',
                tokenizer: {
                    root: [
                        [/[{}\[\],:]/, 'delimiter.bracket'],
                        [/"/, { token: 'string.quote', next: '@string' }],
                        [/-?\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?/, 'number'],
                        [/\\b(?:true|false|null)\\b/, 'keyword'],
                        [/\\s+/, '']
                    ],
                    string: [
                        [/[^\\\\"]+/, 'string'],
                        [/\\\\./, 'string.escape'],
                        [/"/, { token: 'string.quote', next: '@pop' }]
                    ]
                }
            });
        }
    }

    function _langForEditor(lang) {
        return (lang === 'json') ? 'we-json' : (lang || 'plaintext');
    }

    var _snProvidersRegistered = false;
    function _registerSnProviders() {
        if (_snProvidersRegistered || !window.monaco) { return; }
        _snProvidersRegistered = true;

        var _defTables = [
            { table: 'sys_script_include', nameField: 'api_name' },
            { table: 'sys_script_include', nameField: 'name' },
            { table: 'sys_ui_script',      nameField: 'name'    }
        ];
        var _defProvider = {
            provideDefinition: function(model, position) {
                var word = model.getWordAtPosition(position);
                if (!word || !word.word) { return []; }
                var name = word.word;
                function tryTable(idx) {
                    if (idx >= _defTables.length) { return; }
                    var t = _defTables[idx];
                    var xhr = new XMLHttpRequest();
                    xhr.open('GET',
                        '/api/now/table/' + t.table +
                        '?sysparm_query=' + t.nameField + '=' + encodeURIComponent(name) +
                        '&sysparm_fields=sys_id&sysparm_limit=1',
                        true);
                    xhr.setRequestHeader('X-UserToken', window.g_ck || '');
                    xhr.setRequestHeader('Accept', 'application/json');
                    xhr.onload = function() {
                        if (xhr.status !== 200) { tryTable(idx + 1); return; }
                        try {
                            var records = JSON.parse(xhr.responseText).result || [];
                            if (records.length > 0) {
                                window.open('/' + t.table + '.do?sys_id=' + records[0].sys_id);
                            } else {
                                tryTable(idx + 1);
                            }
                        } catch(e) { tryTable(idx + 1); }
                    };
                    xhr.onerror = function() { tryTable(idx + 1); };
                    xhr.send();
                }
                tryTable(0);
                return [];
            }
        };
        monaco.languages.registerDefinitionProvider('javascript', _defProvider);
        monaco.languages.registerDefinitionProvider('typescript', _defProvider);
    }

    var _mplusInitialized = false;
    function _initMonacoPlus() {
        if (_mplusInitialized) { return; }
        var _bs = window.SNMonacoPlusBootstrap;
        if (!_bs || typeof _bs.init !== 'function') { return; }
        _mplusInitialized = true;
        _bs.init({ language: 'typescript' }).then(function(api) {
            if (!api) { return; }
            if (typeof api.loadSnTypeDefinitions === 'function') {
                api.loadSnTypeDefinitions();
            }
            _registerSnProviders();
        });
    }

    var urlParams    = new URLSearchParams(window.location.search);
    var recordId     = urlParams.get('record_id')  || '';
    var tableParam   = urlParams.get('table')       || 'sp_widget';
    var version1Id   = urlParams.get('version_1')   || '';
    var version2Id   = urlParams.get('version_2')   || '';
    var daToken      = urlParams.get('da_token')    || '';
    var isEmbedded   = urlParams.get('da_iframe')   === 'true';
    var isFromList   = urlParams.get('da_source')   === 'list';

    var diffPageSysId      = (window.WE_DIFF_CONFIG && window.WE_DIFF_CONFIG.diffPageSysId)      || '';
    var widgetEditorSysId  = (window.WE_DIFF_CONFIG && window.WE_DIFF_CONFIG.widgetEditorSysId)  || '';

    // Build a nav_to.do URL for a page identified by its sys_id (or page name as fallback).
    function _navUrl(pageSysId, pageNameFallback, params) {
        var qs = Object.keys(params).filter(function(k) { return params[k] !== undefined && params[k] !== null; })
            .map(function(k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); }).join('&');
        var uri = pageSysId
            ? ('ui_page.do?sys_id=' + encodeURIComponent(pageSysId) + (qs ? '&' + qs : ''))
            : (pageNameFallback + '.do?' + qs);
        return '/nav_to.do?uri=' + encodeURIComponent(uri);
    }

    // Build a direct page URL (for iframe src) without nav_to wrapper.
    function _iframeUrl(pageSysId, pageNameFallback, params) {
        var qs = Object.keys(params).filter(function(k) { return params[k] !== undefined && params[k] !== null; })
            .map(function(k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); }).join('&');
        if (pageSysId) {
            return '/ui_page.do?sys_id=' + encodeURIComponent(pageSysId) + (qs ? '&' + qs : '');
        }
        return '/' + pageNameFallback + '.do?' + qs;
    }

    //////// Pure helpers ////////////////////////////////////////////////////////

    function _ajax(method, params, cb) {
        var ga = new GlideAjax('WidgetEditorAjax');
        ga.addParam('sysparm_name', method);
        for (var k in params) {
            if (params.hasOwnProperty(k)) {
                ga.addParam(k, params[k]);
            }
        }
        ga.getXML(function(resp) {
            var data;
            try { data = JSON.parse(resp.responseXML.documentElement.getAttribute('answer')); }
            catch (e) { data = { success: false, error: 'Parse error: ' + (e.message || e) }; }
            cb(data);
        });
    }

    function _formatDate(isoStr) {
        if (!isoStr) { return ''; }
        try {
            return new Date(isoStr.replace(' ', 'T') + 'Z').toLocaleString(undefined, {
                year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
            });
        } catch(e) { return isoStr; }
    }

    function _formatDateFull(isoStr) {
        if (!isoStr) { return ''; }
        try {
            return new Date(isoStr.replace(' ', 'T') + 'Z').toLocaleString(undefined, {
                year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit'
            });
        } catch(e) { return isoStr; }
    }

    function _resolveMonacoTheme() {
        try {
            var bg = getComputedStyle(document.documentElement).getPropertyValue('--now-color_background--primary').trim();
            if (bg) {
                var p = bg.split(/[\\s,]+/).map(Number);
                if (p.length >= 3) {
                    return (p[0] + p[1] + p[2]) / 3 < 128 ? 'vs-dark' : 'vs';
                }
            }
        } catch (e) {}
        return 'vs-dark';
    }

    // Build a normalized fields map from a version data object or a live record object.
    // Uses _fieldDefs to know which fields to extract.
    function _buildFields(versionDataOrNull, recordData, fieldDefs) {
        var result = {};
        if (!fieldDefs) { return result; }
        if (versionDataOrNull) {
            var f = versionDataOrNull.fields || {};
            for (var i = 0; i < fieldDefs.length; i++) {
                var key = fieldDefs[i].key;
                var isCode = fieldDefs[i].renderAs === 'code';
                var isBool = fieldDefs[i].renderAs === 'boolean';
                /* absent from payload = null; present but empty = '' */
                var raw = f[key] !== undefined ? (f[key] !== null ? String(f[key]) : null) : null;
                if (isBool && raw !== null) {
                    result[key] = (raw === 'true' || raw === '1') ? 'true' : 'false';
                } else {
                    result[key] = (raw !== null && !isCode) ? raw.trim() : raw;
                }
            }
        } else {
            var vals = (recordData && recordData.values) || {};
            for (var j = 0; j < fieldDefs.length; j++) {
                var k = fieldDefs[j].key;
                var v = vals[k];
                var isCodeField = fieldDefs[j].renderAs === 'code';
                if (fieldDefs[j].renderAs === 'boolean') {
                    result[k] = (v === null || v === undefined) ? null
                              : (v === true || v === '1' || v === 'true') ? 'true' : 'false';
                } else {
                    var rawStr = (v !== null && v !== undefined) ? String(v) : null;
                    result[k] = (rawStr !== null && !isCodeField) ? rawStr.trim() : rawStr;
                }
            }
        }
        return result;
    }

    function _buildDisplayFields(fieldsMap) {
        var result = {};
        for (var k in fieldsMap) {
            if (fieldsMap.hasOwnProperty(k)) {
                result[k] = fieldsMap[k] !== null ? fieldsMap[k] : '';
            }
        }
        return result;
    }

    /* For reference fields, return display value if available, otherwise raw value. */
    function _buildRefDisplay(versionDataOrNull, recordData, fieldDefs) {
        var result = {};
        if (!fieldDefs) { return result; }
        var dvMap = versionDataOrNull
            ? (versionDataOrNull.display_values || {})
            : ((recordData && recordData.display_values) || {});
        var rawMap = versionDataOrNull
            ? (versionDataOrNull.fields || {})
            : ((recordData && recordData.values) || {});
        for (var i = 0; i < fieldDefs.length; i++) {
            var _renderAs = fieldDefs[i].renderAs;
            if (_renderAs !== 'reference' && _renderAs !== 'choice') { continue; }
            var key = fieldDefs[i].key;
            var dv = dvMap[key];
            var rawVal = (rawMap[key] !== null && rawMap[key] !== undefined) ? String(rawMap[key]) : null;
            if (dv != null && dv !== '') {
                result[key] = rawVal ? String(dv) + ' [' + rawVal + ']' : String(dv);
            } else {
                result[key] = rawVal !== null ? rawVal : '';
            }
        }
        return result;
    }

    function _countsFromLineChanges(lineChanges) {
        var added = 0, removed = 0;
        if (!lineChanges) { return { added: 0, removed: 0 }; }
        for (var i = 0; i < lineChanges.length; i++) {
            var c = lineChanges[i];
            if (c.modifiedEndLineNumber >= c.modifiedStartLineNumber) {
                added   += c.modifiedEndLineNumber  - c.modifiedStartLineNumber  + 1;
            }
            if (c.originalEndLineNumber >= c.originalStartLineNumber) {
                removed += c.originalEndLineNumber - c.originalStartLineNumber + 1;
            }
        }
        return { added: added, removed: removed };
    }

    function _diffLineCounts(leftText, rightText) {
        if (leftText === rightText) {
            return { added: 0, removed: 0 };
        }
        var L = leftText  === '' ? [] : leftText.split('\\n');
        var R = rightText === '' ? [] : rightText.split('\\n');
        var m = L.length, n = R.length;
        if (m * n > 250000) {
            var freq = {};
            L.forEach(function(l) { freq[l] = (freq[l] || 0) + 1; });
            var common = 0;
            R.forEach(function(l) { if (freq[l] > 0) { common++; freq[l]--; } });
            return { added: n - common, removed: m - common };
        }
        var prev = new Array(n + 1).fill(0), curr = new Array(n + 1).fill(0);
        for (var i = 1; i <= m; i++) {
            for (var j = 1; j <= n; j++) {
                curr[j] = L[i-1] === R[j-1] ? prev[j-1]+1 : Math.max(curr[j-1], prev[j]);
            }
            var tmp = prev; prev = curr; curr = tmp;
            for (var kk = 0; kk <= n; kk++) curr[kk] = 0;
        }
        return { added: n - prev[n], removed: m - prev[n] };
    }


    //////// Angular app /////////////////////////////////////////////////////////

    function _initAngular() {
        if (typeof angular === 'undefined') {
            return;
        }

    angular.module('weDiff', [])

    .controller('WeDiffCtrl', ['$scope', '$timeout', '$document', function($scope, $timeout, $document) {
        var ctrl = this;

        // Exposed scope state
        ctrl.loading          = true;
        ctrl.errorMsg         = '';
        ctrl.noVersions       = false;
        ctrl.recordNotFound   = false;
        ctrl.noRecordSelected = false;
        ctrl.tableNoVersions  = false;
        ctrl.recordName   = '';
        ctrl.isSpWidget   = (tableParam === 'sp_widget');

        ctrl.leftVersionId  = version1Id;
        ctrl.rightVersionId = version2Id || 'current';
        ctrl.versionsData          = [];
        ctrl.leftVersionOptions    = [];
        ctrl.eligibleRightVersions = [];
        ctrl.leftFields  = {};
        ctrl.rightFields = {};
        ctrl.metaLeft    = {};
        ctrl.metaRight   = {};
        ctrl.simpleFields = [];   // populated after getDiffFieldDefs returns
        ctrl.scriptFields = [];   // populated after getDiffFieldDefs returns
        ctrl.tableLabel   = '';   // human-readable table name, e.g. "Widget"
        ctrl.editors       = {};
        ctrl.extraChangedSimpleFields = [];
        ctrl.extraChangedScriptFields = [];
        ctrl.extraEditors      = {};
        ctrl.extraLeftFields   = {};
        ctrl.extraRightFields  = {};
        ctrl.leftDisplayFields       = {};
        ctrl.rightDisplayFields      = {};
        ctrl.extraLeftDisplayFields  = {};
        ctrl.extraRightDisplayFields = {};
        ctrl.leftRefDisplay       = {};
        ctrl.rightRefDisplay      = {};
        ctrl.extraLeftRefDisplay  = {};
        ctrl.extraRightRefDisplay = {};
        ctrl.loadingLeft      = false;
        ctrl.loadingRight     = false;
        ctrl.currentIsUnsaved = false;
        ctrl.currentMeta      = { date: '', by: '', usn: '' };
        ctrl.savedMeta        = { date: '', by: '', usn: '' };
        ctrl.openVersionCol   = null;
        ctrl.canWrite         = false;
        ctrl.wordWrap         = true;
        ctrl.expandedIndex    = null;
        ctrl.expandedString   = null;   // { key, label, isExtra } when a long string field is expanded
        ctrl.stringEditor     = null;   // shared Monaco diff editor for expanded strings
        ctrl.hasChangedBelowViewport = false;

        // Private state
        var _recordData          = null;
        var _savedRecordData     = null;
        var _fieldDefs           = null;   // array of { key, label, type, renderAs, language, reference }
        var _extraFieldDefs      = null;   // extra (non-layout) field defs
        var _leftVersionData     = null;
        var _leftIsCurrentSaved  = false;
        var _rightVersionData    = null;
        var _allVersionsData     = [];
        var _versionCache        = {};
        var _currentLeftId       = version1Id;
        var _currentRightId      = version2Id || 'current';
        var _pending             = 0;
        var _errors              = [];
        var _tableHasNoTracking  = false;
        var _changedBelowRaf     = null;

        function _updateChangedBelowIndicator() {
            if (ctrl.expandedIndex !== null || ctrl.expandedString) {
                ctrl.hasChangedBelowViewport = false;
                return;
            }
            var changedSections = document.querySelectorAll('.da-section.da-changed');
            if (!changedSections || changedSections.length === 0) {
                ctrl.hasChangedBelowViewport = false;
                return;
            }
            var viewportBottom = window.innerHeight || document.documentElement.clientHeight || 0;
            var hasBelow = false;
            for (var i = 0; i < changedSections.length; i++) {
                var rect = changedSections[i].getBoundingClientRect();
                if (rect.bottom > viewportBottom) {
                    hasBelow = true;
                    break;
                }
            }
            ctrl.hasChangedBelowViewport = hasBelow;
        }

        function _scheduleChangedBelowIndicatorUpdate() {
            if (_changedBelowRaf) {
                return;
            }
            _changedBelowRaf = window.requestAnimationFrame(function() {
                _changedBelowRaf = null;
                _apply(_updateChangedBelowIndicator);
            });
        }

        /* Schedule fn in a digest (uses $timeout when outside one) */
        function _apply(fn) {
            if ($scope.$$phase || $scope.$root.$$phase) {
                fn();
            } else {
                $timeout(fn);
            }
        }

        function _getVersionsList() {
            if (_allVersionsData.length > 0) {
                return _allVersionsData;
            }
            var list = [];
            if (_leftVersionData) {
                list.push({
                    sys_id: version1Id,
                    sys_created_on:  _leftVersionData.sys_created_on  || '',
                    sys_created_by:  _leftVersionData.sys_created_by  || '',
                    update_set_name: _leftVersionData.update_set_name || ''
                });
            }
            if (version2Id && _rightVersionData) {
                list.push({
                    sys_id: version2Id,
                    sys_created_on:  _rightVersionData.sys_created_on  || '',
                    sys_created_by:  _rightVersionData.sys_created_by  || '',
                    update_set_name: _rightVersionData.update_set_name || ''
                });
            }
            return list;
        }

        function _getEligibleRightVersions() {
            var all = _getVersionsList();
            if (_leftIsCurrentSaved) {
                return [];
            }
            if (!ctrl.currentIsUnsaved && _allVersionsData.length > 0) {
                var latestId = _allVersionsData[0].sys_id;
                all = all.filter(function(v) { return v.sys_id !== latestId; });
            }
            var leftDate = _leftVersionData ? (_leftVersionData.sys_created_on || '') : '';
            return all.filter(function(v) {
                return leftDate ? (v.sys_created_on || '') > leftDate : v.sys_id !== _currentLeftId;
            });
        }

        function _validateRightSelection() {
            if (_currentRightId !== 'current') {
                var eligible = _getEligibleRightVersions();
                if (!eligible.some(function(v) { return v.sys_id === _currentRightId; })) {
                    _currentRightId     = 'current';
                    _rightVersionData   = null;
                    ctrl.rightVersionId = 'current';
                }
            }
        }

        function _syncScope() {
            if (!_fieldDefs) { return; }

            ctrl.recordName = (_recordData && _recordData.name) || '(Unnamed)';
            var _tableSuffix = ctrl.tableLabel ? ' (' + ctrl.tableLabel + ')' : '';
            var _title = 'Compare: ' + ctrl.recordName + _tableSuffix + ' - ' + SITE_TITLE;
            document.title = _title;
            setTimeout(function() {
                try { if (window.parent !== window) window.parent.document.title = _title; } catch(e) {}
            }, 1000);

            var _latestVer     = _allVersionsData.length > 0 ? _allVersionsData[0] : null;
            var _latestVerUsn  = _latestVer ? (_latestVer.update_set_name   || '') : '';
            var _latestVerUss  = _latestVer ? (_latestVer.update_set_sys_id || '') : '';
            var _latestVerDate = _latestVer ? (_latestVer.sys_created_on    || '') : '';
            var _recDate       = (_recordData && _recordData.sys_updated_on) || '';
            var _currentDate   = _latestVerDate > _recDate ? _latestVerDate : _recDate;

            var _savedRef = _savedRecordData || _recordData;

            // When showing Unsaved vs Current, the snap only contains the fields the Widget
            // Editor tracks. Fill the gaps by merging: saved record values as the base,
            // snap values (from _recordData.values) overlaid on top.
            var _unsavedRef = (ctrl.currentIsUnsaved && _savedRecordData)
                ? { values: (function() {
                        var merged = {};
                        var base = _savedRecordData.values || {};
                        var snap = _recordData.values || {};
                        for (var _k in base) { if (base.hasOwnProperty(_k)) { merged[_k] = base[_k]; } }
                        for (var _s in snap) { if (snap.hasOwnProperty(_s)) { merged[_s] = snap[_s]; } }
                        return merged;
                    })() }
                : _recordData;

            var lf = _leftIsCurrentSaved
                ? _buildFields(null, _savedRef, _fieldDefs)
                : _buildFields(_leftVersionData, _recordData, _fieldDefs);
            var rf = _buildFields(_rightVersionData, _unsavedRef, _fieldDefs);

            ctrl.leftFields  = lf;
            ctrl.rightFields = rf;
            ctrl.leftDisplayFields  = _buildDisplayFields(lf);
            ctrl.rightDisplayFields = _buildDisplayFields(rf);
            ctrl.leftRefDisplay = _leftIsCurrentSaved
                ? _buildRefDisplay(null, _savedRef, _fieldDefs)
                : _buildRefDisplay(_leftVersionData, _recordData, _fieldDefs);
            ctrl.rightRefDisplay = _buildRefDisplay(_rightVersionData, _unsavedRef, _fieldDefs);

            var lMeta;
            if (_leftIsCurrentSaved) {
                lMeta = {};
                ctrl.metaLeft = {
                    date:     _formatDate(_currentDate) || '',
                    dateFull: _formatDateFull(_currentDate) || '',
                    usn:      _latestVerUsn,
                    uss:      _latestVerUss,
                    by:       (_savedRef && _savedRef.sys_updated_by) || ''
                };
            } else {
                lMeta = _leftVersionData || {};
                ctrl.metaLeft = {
                    date:     _formatDate(lMeta.sys_created_on || '') || '',
                    dateFull: _formatDateFull(lMeta.sys_created_on || '') || '',
                    usn:      lMeta.update_set_name   || '',
                    uss:      lMeta.update_set_sys_id || '',
                    by:       lMeta.sys_created_by    || ''
                };
            }
            var rMeta = _rightVersionData;
            ctrl.metaRight = rMeta ? {
                date:     _formatDate(rMeta.sys_created_on || '') || '',
                dateFull: _formatDateFull(rMeta.sys_created_on || '') || '',
                usn:      rMeta.update_set_name   || '',
                uss:      rMeta.update_set_sys_id || '',
                by:       rMeta.sys_created_by    || ''
            } : ctrl.currentIsUnsaved ? {
                date:     'N/A',
                dateFull: '',
                usn:      'N/A',
                uss:      '',
                by:       'N/A'
            } : {
                date:     _formatDate(_currentDate) || '',
                dateFull: _formatDateFull(_currentDate) || '',
                usn:      _latestVerUsn,
                uss:      _latestVerUss,
                by:       (_recordData && _recordData.sys_updated_by) || ''
            };

            ctrl.currentMeta = {
                date:     _formatDate(_currentDate) || '',
                dateFull: _formatDateFull(_currentDate) || '',
                by:       (_recordData && _recordData.sys_updated_by) || '',
                usn:      _latestVerUsn,
                uss:      _latestVerUss
            };
            if (_savedRecordData) {
                ctrl.savedMeta = {
                    date:     _formatDate(_savedRecordData.sys_updated_on || '') || '',
                    dateFull: _formatDateFull(_savedRecordData.sys_updated_on || '') || '',
                    by:       _savedRecordData.sys_updated_by || '',
                    usn:      _latestVerUsn,
                    uss:      _latestVerUss
                };
            }
            ctrl.versionsData = _getVersionsList();
            ctrl.leftVersionOptions = ctrl.versionsData;
            ctrl.eligibleRightVersions = _getEligibleRightVersions();
            ctrl.leftVersionId         = _currentLeftId;
            ctrl.rightVersionId        = _currentRightId;
            var _writeRef = _savedRecordData || _recordData;
            ctrl.canWrite = !!(_writeRef && _writeRef.canWrite);
            ctrl.recordSysPolicy        = (_writeRef && _writeRef.sys_policy)         || '';
            ctrl.recordSysPolicyDisplay = (_writeRef && _writeRef.sys_policy_display) || '';

            // Update changed state on script fields
            ctrl.scriptFields.forEach(function(f) {
                var lc = (lf[f.key] || '').replace(/\\r\\n/g, '\\n');
                var rc = (rf[f.key] || '').replace(/\\r\\n/g, '\\n');
                f.changed = lc !== rc;
                f.counts  = f.changed ? _diffLineCounts(lc, rc) : null;
            });

            if (window.monaco) {
                var theme = _resolveMonacoTheme();
                if (theme === 'vs') {
                    monaco.editor.defineTheme('we-vs-light', {
                        base: 'vs',
                        inherit: true,
                        rules: [],
                        colors: {
                            // Softer line-level green (default ~12% opacity is fine; keep similar)
                            'diffEditor.insertedLineBackground': '#9bb95518',
                            // Softer char-level green — default is ~30% which is too strong in light mode
                            'diffEditor.insertedTextBackground': '#9bb95530',
                        },
                    });
                    monaco.editor.setTheme('we-vs-light');
                } else {
                    monaco.editor.setTheme('vs-dark');
                }
            }

            // Refresh any already-open diff editors
            for (var k in ctrl.editors) {
                if (!ctrl.editors.hasOwnProperty(k)) { continue; }
                var fDef  = ctrl.scriptFields[parseInt(k, 10)];
                var model = ctrl.editors[k].getModel();
                if (model && fDef) {
                    model.original.setValue(lf[fDef.key] || '');
                    model.modified.setValue(rf[fDef.key] || '');
                }
            }

            // Compute extra (non-layout) changed fields
            if (_extraFieldDefs && _extraFieldDefs.length > 0) {
                var lfe = _leftIsCurrentSaved
                    ? _buildFields(null, _savedRef, _extraFieldDefs)
                    : _buildFields(_leftVersionData, _recordData, _extraFieldDefs);
                var rfe = _buildFields(_rightVersionData, _unsavedRef, _extraFieldDefs);
                ctrl.extraLeftFields  = lfe;
                ctrl.extraRightFields = rfe;
                ctrl.extraLeftDisplayFields  = _buildDisplayFields(lfe);
                ctrl.extraRightDisplayFields = _buildDisplayFields(rfe);
                ctrl.extraLeftRefDisplay = _leftIsCurrentSaved
                    ? _buildRefDisplay(null, _savedRef, _extraFieldDefs)
                    : _buildRefDisplay(_leftVersionData, _recordData, _extraFieldDefs);
                ctrl.extraRightRefDisplay = _buildRefDisplay(_rightVersionData, _unsavedRef, _extraFieldDefs);

                var extraSimple = [];
                var extraCode   = [];
                for (var ei = 0; ei < _extraFieldDefs.length; ei++) {
                    var eDef = _extraFieldDefs[ei];
                    var lv = (lfe[eDef.key] || '').replace(/\\r\\n/g, '\\n');
                    var rv = (rfe[eDef.key] || '').replace(/\\r\\n/g, '\\n');
                    if (lv === rv) { continue; }
                    if (eDef.renderAs === 'code') {
                        extraCode.push({ key: eDef.key, label: eDef.label, language: eDef.language, reference: eDef.reference, counts: _diffLineCounts(lv, rv) });
                    } else {
                        extraSimple.push(eDef);
                    }
                }
                ctrl.extraChangedSimpleFields = extraSimple;
                ctrl.extraChangedScriptFields = extraCode;

                // Refresh any already-open extra diff editors
                for (var ek in ctrl.extraEditors) {
                    if (!ctrl.extraEditors.hasOwnProperty(ek)) { continue; }
                    var efDef  = ctrl.extraChangedScriptFields[parseInt(ek, 10)];
                    var eModel = ctrl.extraEditors[ek].getModel();
                    if (eModel && efDef) {
                        eModel.original.setValue(lfe[efDef.key] || '');
                        eModel.modified.setValue(rfe[efDef.key] || '');
                    }
                }
            } else {
                ctrl.extraChangedSimpleFields = [];
                ctrl.extraChangedScriptFields = [];
                ctrl.extraLeftFields         = {};
                ctrl.extraRightFields        = {};
                ctrl.extraLeftDisplayFields  = {};
                ctrl.extraRightDisplayFields = {};
                ctrl.extraLeftRefDisplay  = {};
                ctrl.extraRightRefDisplay = {};
            }

            // Refresh / auto-collapse the shared string diff editor when versions change
            if (ctrl.expandedString) {
                var _sk    = ctrl.expandedString.key;
                var _slMap = ctrl.expandedString.isExtra ? ctrl.extraLeftFields  : ctrl.leftFields;
                var _srMap = ctrl.expandedString.isExtra ? ctrl.extraRightFields : ctrl.rightFields;
                var _slv   = _slMap[_sk] || '';
                var _srv   = _srMap[_sk] || '';
                if (_slv === _srv || (_slv.length <= 100 && _srv.length <= 100)) {
                    ctrl.collapseStringExpanded();
                } else if (ctrl.stringEditor) {
                    var _sm = ctrl.stringEditor.getModel();
                    if (_sm) {
                        _sm.original.setValue(_slv);
                        _sm.modified.setValue(_srv);
                    }
                }
            }

            $timeout(_scheduleChangedBelowIndicatorUpdate, 0, false);
        }

        ctrl.revertToLeft = function() {
            var sysId = ctrl.leftVersionId;
            if (!sysId || sysId === 'current_saved') { return; }
            try { localStorage.setItem('_weRevertPending_' + recordId, Date.now().toString()); } catch(e) {}
            var gdw = new GlideModal('revert_update_version_confirm', true, 300);
            gdw.setTitle('Revert');
            gdw.setPreference('sysparm_sys_id', sysId);
            gdw.setPreference('focusTrap', true);
            gdw.render();
        };

        function _onLoaded() {
            _pending--;
            if (_pending > 0) { return; }
            _apply(function() {
                ctrl.loading = false;
                if (_errors.length > 0) {
                    ctrl.errorMsg = _errors.join(' | ');
                    return;
                }
                if (ctrl.tableNoVersions || ctrl.noRecordSelected) { return; }
                if (_tableHasNoTracking) {
                    if (_allVersionsData.length === 0) {
                        ctrl.tableNoVersions = true;
                        return;
                    }
                    if (!_fieldDefs && _leftVersionData && _leftVersionData.fields) {
                        var derivedSimple = [];
                        for (var _dk in _leftVersionData.fields) {
                            if (_leftVersionData.fields.hasOwnProperty(_dk)) {
                                derivedSimple.push({ key: _dk, label: _dk, renderAs: 'text', reference: '', changed: false, counts: null });
                            }
                        }
                        _fieldDefs = derivedSimple;
                        _extraFieldDefs = [];
                        ctrl.simpleFields = derivedSimple;
                        ctrl.scriptFields = [];
                    }
                }
                if (!_recordData) {
                    ctrl.recordNotFound = true;
                    var _notFoundSuffix = ctrl.tableLabel ? ' (' + ctrl.tableLabel + ')' : '';
                    document.title = 'Compare: Record not found' + _notFoundSuffix + ' - ' + SITE_TITLE;
                    return;
                }
                if (!_fieldDefs) {
                    ctrl.errorMsg = 'Failed to load field definitions for table: ' + tableParam;
                    return;
                }
                if (!_leftVersionData && !_leftIsCurrentSaved) {
                    if (_allVersionsData.length === 0) {
                        ctrl.noVersions = true;
                        ctrl.recordName = _recordData.name || '(Unnamed)';
                        var _noVerSuffix = ctrl.tableLabel ? ' (' + ctrl.tableLabel + ')' : '';
                        document.title = 'Compare: ' + ctrl.recordName + _noVerSuffix + ' - ' + SITE_TITLE;
                        return;
                    }
                    ctrl.errorMsg = 'Version load failed (record_id: ' + recordId + ')';
                    return;
                }
                // When both versions explicitly provided, ensure older → left, newer → right
                if (version1Id && version2Id && _leftVersionData && _rightVersionData) {
                    if ((_leftVersionData.sys_created_on || '') > (_rightVersionData.sys_created_on || '')) {
                        var _tmpData       = _leftVersionData;
                        _leftVersionData   = _rightVersionData;
                        _rightVersionData  = _tmpData;
                        var _tmpId         = _currentLeftId;
                        _currentLeftId     = _currentRightId;
                        _currentRightId    = _tmpId;
                    }
                }
                _syncScope();
            });
        }

        function _loadAndSwitch(side, sysId) {
            if (sysId === 'current') {
                _rightVersionData   = null;
                ctrl.loadingRight   = false;
                _validateRightSelection();
                _syncScope();
                return;
            }
            if (_versionCache[sysId]) {
                if (side === 'left') {
                    _leftVersionData  = _versionCache[sysId];
                    ctrl.loadingLeft  = false;
                } else {
                    _rightVersionData = _versionCache[sysId];
                    ctrl.loadingRight = false;
                }
                _validateRightSelection();
                _syncScope();
                return;
            }
            if (side === 'left') {
                ctrl.loadingLeft  = true;
            } else {
                ctrl.loadingRight = true;
            }

            _ajax('getVersionForTable', { version_id: sysId }, function(data) {
                if (side === 'left'  && _currentLeftId  !== sysId) { return; }
                if (side === 'right' && _currentRightId !== sysId) { return; }
                if (data.success) {
                    _versionCache[sysId] = data;
                    if (side === 'left') {
                        _leftVersionData  = data;
                    } else {
                        _rightVersionData = data;
                    }
                }
                _apply(function() {
                    if (side === 'left') {
                        ctrl.loadingLeft  = false;
                    } else {
                        ctrl.loadingRight = false;
                    }
                    _validateRightSelection();
                    _syncScope();
                });
            });
        }

        //////// Expand / collapse //////////////////////////////////////////////

        function _headerHeight() {
            var h = document.querySelector('.dc-header');
            if (!h) { return 0; }
            return Math.ceil(h.getBoundingClientRect().bottom);
        }

        function _setWrapTop(index) {
            var wrap = document.querySelector('#da-' + index + ' .da-editor-wrap');
            if (!wrap) { return; }
            var top = _headerHeight();
            var h   = window.innerHeight - top;
            wrap.style.top    = top + 'px';
            wrap.style.height = h + 'px';
            var outer = wrap.querySelector('.da-editor-canvas-outer');
            if (outer) { outer.style.height = h + 'px'; }
        }

        function _clearWrapTop(index) {
            var wrap = document.querySelector('#da-' + index + ' .da-editor-wrap');
            if (!wrap) { return; }
            wrap.style.top    = '';
            wrap.style.height = '';
            var outer = wrap.querySelector('.da-editor-canvas-outer');
            if (outer) { outer.style.height = ''; }
        }

        function _scrollAccordionIntoView(index) {
            var details = document.getElementById('da-' + index);
            if (!details) { return; }
            var margin = 8;
            var headerBottom = _headerHeight();
            var viewportTop = headerBottom + margin;
            var viewportBottom = window.innerHeight - margin;
            var rect = details.getBoundingClientRect();
            var currentY = window.pageYOffset || document.documentElement.scrollTop || 0;
            var targetY = currentY;
            var accordionHeight = rect.height;
            var viewportHeight = Math.max(0, viewportBottom - viewportTop);
            if (accordionHeight <= viewportHeight) {
                if (rect.top < viewportTop) {
                    targetY = currentY + (rect.top - viewportTop);
                } else if (rect.bottom > viewportBottom) {
                    targetY = currentY + (rect.bottom - viewportBottom);
                }
            } else {
                targetY = currentY + (rect.top - viewportTop);
            }
            var maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
            targetY = Math.max(0, Math.min(Math.round(targetY), maxY));
            if (Math.abs(targetY - currentY) > 1) {
                window.scrollTo({ top: targetY, behavior: 'smooth' });
            }
        }

        function _notifyParentExpand(fieldLabel) {
            try {
                if (window.parent !== window) {
                    window.parent.postMessage({ type: 'we-diff-expand', fieldLabel: fieldLabel || null }, '*');
                }
            } catch(e) {}
        }

        ctrl.toggleExpand = function(index, event) {
            event.stopPropagation();
            var wasExpanded = ctrl.expandedIndex === index;
            var prevIndex   = ctrl.expandedIndex;
            ctrl.expandedIndex = wasExpanded ? null : index;

            if (!wasExpanded) {
                var details = document.getElementById('da-' + index);
                if (details && !details.open) { details.open = true; }
            }

            if (!wasExpanded) {
                var _f = ctrl.scriptFields[index];
                _notifyParentExpand(_f ? _f.label : '');
            } else {
                _notifyParentExpand(null);
            }

            $timeout(function() {
                if (!wasExpanded) {
                    _setWrapTop(index);
                } else {
                    _clearWrapTop(index);
                }
                if (ctrl.editors[index]) { ctrl.editors[index].layout(); }
                if (prevIndex !== null && prevIndex !== index) {
                    _clearWrapTop(prevIndex);
                    if (ctrl.editors[prevIndex]) { ctrl.editors[prevIndex].layout(); }
                }
                if (!wasExpanded) {
                    _scrollAccordionIntoView(index);
                }
                _scheduleChangedBelowIndicatorUpdate();
            }, 10);
        };

        ctrl.scrollAccordionIntoView = function(index) {
            _scrollAccordionIntoView(index);
        };

        ctrl.collapseExpanded = function() {
            var idx = ctrl.expandedIndex;
            if (idx === null) { return; }
            ctrl.expandedIndex = null;
            _clearWrapTop(idx);
            $timeout(function() {
                if (ctrl.editors[idx]) { ctrl.editors[idx].layout(); }
                _scheduleChangedBelowIndicatorUpdate();
            }, 0);
            _notifyParentExpand(null);
        };

        function _setStringOverlayTop() {
            var wrap = document.querySelector('.sft-string-overlay');
            if (!wrap) { return; }
            var top = _headerHeight();
            wrap.style.top    = top + 'px';
            wrap.style.height = (window.innerHeight - top) + 'px';
        }

        ctrl.shouldShowStringExpand = function(f, isExtra) {
            if (!f) { return false; }
            var ra = f.renderAs;
            if (ra === 'boolean' || ra === 'reference' || ra === 'choice' || ra === 'image') {
                return false;
            }
            var lv, rv;
            if (isExtra) {
                lv = ctrl.extraLeftFields[f.key]  || '';
                rv = ctrl.extraRightFields[f.key] || '';
            } else {
                lv = ctrl.leftFields[f.key]  || '';
                rv = ctrl.rightFields[f.key] || '';
            }
            // Normalize line endings so CRLF vs LF differences don't count
            var lvn = lv.replace(/\\r\\n/g, '\\n');
            var rvn = rv.replace(/\\r\\n/g, '\\n');
            if (lvn === rvn) { return false; }
            return lvn.length > 100 || rvn.length > 100;
        };

        ctrl.initStringEditor = function() {
            if (!ctrl.expandedString) { return; }
            var container = document.getElementById('sft-string-editor');
            if (!window.monaco || !container) {
                if (container) {
                    container.innerHTML = '<div class="da-no-monaco">Monaco editor is not available. Keep the Widget Editor tab open and try again.</div>';
                }
                return;
            }
            _ensureMonacoWorker();
            _setupLanguageServices();
            var key = ctrl.expandedString.key;
            var lang = _langForEditor(ctrl.expandedString.language);
            var lf  = ctrl.expandedString.isExtra ? ctrl.extraLeftFields  : ctrl.leftFields;
            var rf  = ctrl.expandedString.isExtra ? ctrl.extraRightFields : ctrl.rightFields;
            if (ctrl.stringEditor) {
                var model = ctrl.stringEditor.getModel();
                if (model) {
                    monaco.editor.setModelLanguage(model.original, lang);
                    monaco.editor.setModelLanguage(model.modified, lang);
                    model.original.setValue(lf[key] || '');
                    model.modified.setValue(rf[key] || '');
                }
                ctrl.stringEditor.layout();
                return;
            }
            var diffEditor = monaco.editor.createDiffEditor(container, {
                automaticLayout: true,
                enableSplitViewResizing: true,
                readOnly: true,
                scrollBeyondLastLine: false,
                wordWrap: ctrl.wordWrap ? 'on' : 'off'
            });
            diffEditor.setModel({
                original: monaco.editor.createModel(lf[key] || '', lang),
                modified: monaco.editor.createModel(rf[key] || '', lang)
            });
            ctrl.stringEditor = diffEditor;
        };

        ctrl.toggleStringExpand = function(f, isExtra, event) {
            if (event) { event.stopPropagation(); }
            var sameOpen = !!(ctrl.expandedString
                && ctrl.expandedString.key === f.key
                && ctrl.expandedString.isExtra === isExtra);
            if (sameOpen) {
                ctrl.collapseStringExpanded();
                return;
            }
            // Collapse any open code-field expansion first
            if (ctrl.expandedIndex !== null) { ctrl.collapseExpanded(); }
            ctrl.expandedString = { key: f.key, label: f.label, isExtra: !!isExtra, language: f.language || 'plaintext' };
            _notifyParentExpand(f.label || '');
            $timeout(function() {
                _setStringOverlayTop();
                ctrl.initStringEditor();
                _scheduleChangedBelowIndicatorUpdate();
            }, 10);
        };

        ctrl.collapseStringExpanded = function() {
            if (!ctrl.expandedString) { return; }
            ctrl.expandedString = null;
            if (ctrl.stringEditor) {
                try { ctrl.stringEditor.dispose(); } catch(e) {}
                ctrl.stringEditor = null;
            }
            _notifyParentExpand(null);
            $timeout(function() { _scheduleChangedBelowIndicatorUpdate(); }, 0);
        };

        ctrl.collapseAnyExpanded = function() {
            if (ctrl.expandedIndex !== null) { ctrl.collapseExpanded(); }
            if (ctrl.expandedString)         { ctrl.collapseStringExpanded(); }
        };

        ctrl.expandedFieldLabel = function() {
            if (ctrl.expandedIndex !== null) {
                var f = ctrl.scriptFields[ctrl.expandedIndex];
                return f ? (ctrl.recordName + ' \\u2014 ' + f.label) : ctrl.recordName;
            }
            if (ctrl.expandedString) {
                return ctrl.recordName + ' \\u2014 ' + ctrl.expandedString.label;
            }
            return '';
        };

        var _onWindowResize = function() {
            if (ctrl.expandedIndex !== null) {
                _setWrapTop(ctrl.expandedIndex);
                if (ctrl.editors[ctrl.expandedIndex]) {
                    ctrl.editors[ctrl.expandedIndex].layout();
                }
            }
            if (ctrl.expandedString) {
                _setStringOverlayTop();
                if (ctrl.stringEditor) { ctrl.stringEditor.layout(); }
            }
            _scheduleChangedBelowIndicatorUpdate();
        };
        window.addEventListener('resize', _onWindowResize);
        var _onWindowScroll = function() {
            _scheduleChangedBelowIndicatorUpdate();
        };
        window.addEventListener('scroll', _onWindowScroll, { passive: true });
        $scope.$on('$destroy', function() {
            window.removeEventListener('resize', _onWindowResize);
            window.removeEventListener('scroll', _onWindowScroll);
            if (_changedBelowRaf) {
                window.cancelAnimationFrame(_changedBelowRaf);
                _changedBelowRaf = null;
            }
            if (ctrl.stringEditor) {
                try { ctrl.stringEditor.dispose(); } catch(e) {}
                ctrl.stringEditor = null;
            }
        });

        var _onParentMessage = function(e) {
            if (!e.data || e.data.type !== 'we-diff-collapse') { return; }
            $scope.$apply(function() { ctrl.collapseAnyExpanded(); });
        };
        window.addEventListener('message', _onParentMessage);
        $scope.$on('$destroy', function() { window.removeEventListener('message', _onParentMessage); });

        //////// Initial data load ///////////////////////////////////////////////

        if (!recordId) {
            ctrl.noRecordSelected = true;
            _pending++;
            _ajax('getDiffFieldDefs', { table: tableParam }, function(data) {
                if (data.success) {
                    _apply(function() { ctrl.tableLabel = data.table_label || ''; });
                } else if (data.error === 'Table does not track versions') {
                    _apply(function() { ctrl.tableNoVersions = true; ctrl.tableLabel = data.table_label || ''; });
                } else {
                    _errors.push(data.error || 'Field definitions load failed');
                }
                _onLoaded();
            });
        } else {
            // Load user prefs (fire-and-forget)
            _ajax('getUserPrefs', {}, function(data) {
                if (data.success && data.value) {
                    try {
                        var p = JSON.parse(data.value);
                        if (p.hasOwnProperty('wordWrap')) { ctrl.wordWrap = !!p.wordWrap; }
                    } catch(e) {}
                }
            });

            // Load field definitions
            _pending++;
            _ajax('getDiffFieldDefs', { table: tableParam }, function(data) {
                if (data.success && data.fields && data.fields.length > 0) {
                    _fieldDefs      = data.fields;
                    _extraFieldDefs = data.extra_fields || [];
                    // Partition into simple fields and script/code fields
                    var simple = [];
                    var code   = [];
                    for (var i = 0; i < data.fields.length; i++) {
                        var fd = data.fields[i];
                        if (fd.renderAs === 'code') {
                            code.push({ key: fd.key, label: fd.label, language: fd.language, reference: fd.reference, changed: false, counts: null });
                        } else {
                            simple.push(fd);
                        }
                    }
                    _apply(function() {
                        ctrl.simpleFields = simple;
                        ctrl.scriptFields = code;
                        ctrl.tableLabel   = data.table_label || '';
                    });
                } else if (data.error === 'Table does not track versions') {
                    _tableHasNoTracking = true;
                    _apply(function() { ctrl.tableLabel = data.table_label || ''; });
                } else {
                    _errors.push(data.error || 'Field definitions load failed');
                }
                _onLoaded();
            });

            // Load current record state
            var _openerSnap = null;
            if (daToken) {
                try {
                    var _lsVal = localStorage.getItem('_weDiffSnap_' + daToken);
                    if (_lsVal) {
                        _openerSnap = JSON.parse(_lsVal);
                        localStorage.removeItem('_weDiffSnap_' + daToken);
                    }
                } catch (e) {}
            }

            if (_openerSnap) {
                // Convert snap (widget-specific shape) to generic record shape
                _recordData = {
                    sys_id:         recordId,
                    name:           _openerSnap.name           || '',
                    sys_updated_on: _openerSnap.sys_updated_on || '',
                    sys_updated_by: _openerSnap.sys_updated_by || '',
                    canWrite:       false,
                    sys_policy:     '',
                    sys_policy_display: '',
                    update_set_sys_id: '',
                    update_set_name: '',
                    values: _openerSnap
                };
                ctrl.currentIsUnsaved = !!_openerSnap._unsaved;
                if (_openerSnap._unsaved) {
                    _pending++;
                    _ajax('getRecordForDiff', { table: tableParam, record_id: recordId }, function(data) {
                        if (data.success && data.record) {
                            _savedRecordData = data.record;
                        }
                        _onLoaded();
                    });
                }
            } else {
                _pending++;
                _ajax('getRecordForDiff', { table: tableParam, record_id: recordId }, function(data) {
                    if (data.success && data.record) {
                        _recordData = data.record;
                    }
                    _onLoaded();
                });
            }

            // Load all versions
            _pending++;
            _ajax('getVersionsForTable', { table: tableParam, record_id: recordId }, function(data) {
                if (data.success && data.versions) {
                    _allVersionsData = data.versions;
                }
                if (!version1Id) {
                    if (_openerSnap && _openerSnap._unsaved) {
                        _leftIsCurrentSaved = true;
                        _currentLeftId      = 'current_saved';
                        ctrl.leftVersionId  = 'current_saved';
                    } else if (_allVersionsData.length > 0) {
                        var autoIdx = _allVersionsData.length > 1 ? 1 : 0;
                        var autoId  = _allVersionsData[autoIdx].sys_id;
                        _currentLeftId     = autoId;
                        ctrl.leftVersionId = autoId;
                        _pending++;
                        _ajax('getVersionForTable', { version_id: autoId }, function(vd) {
                            if (vd.success) {
                                _leftVersionData = vd;
                                _versionCache[autoId] = vd;
                            } else {
                                _errors.push('Version load failed: ' + (vd.error || 'no detail'));
                            }
                            _onLoaded();
                        });
                    }
                }
                _onLoaded();
            });

            // Load explicit version_1
            if (version1Id) {
                _pending++;
                _ajax('getVersionForTable', { version_id: version1Id }, function(data) {
                    if (data.success) {
                        _leftVersionData = data;
                        _versionCache[version1Id] = data;
                    } else {
                        _errors.push('Version 1 load failed: ' + (data.error || 'no detail'));
                    }
                    _onLoaded();
                });

                // Load explicit version_2
                if (version2Id) {
                    _pending++;
                    _ajax('getVersionForTable', { version_id: version2Id }, function(data) {
                        if (data.success) {
                            _rightVersionData = data;
                            _versionCache[version2Id] = data;
                        }
                        _onLoaded();
                    });
                }
            }
        }

        //////// Exposed methods /////////////////////////////////////////////////

        // Resolve the 'current' sentinel to the actual sys_id of the current-state version.
        function _resolveVersionId(vId) {
            if (vId !== 'current') { return vId; }
            for (var i = 0; i < _allVersionsData.length; i++) {
                if (_allVersionsData[i].state === 'current') {
                    return _allVersionsData[i].sys_id;
                }
            }
            return vId;
        }

        ctrl.isSameVersionSelected = function() {
            var l = _resolveVersionId(ctrl.leftVersionId);
            var r = _resolveVersionId(ctrl.rightVersionId);
            return !!(l && r && l === r);
        };

        ctrl.isChanged = function(key) {
            var l = (ctrl.leftFields[key]  || '').replace(/\\r\\n/g, '\\n');
            var r = (ctrl.rightFields[key] || '').replace(/\\r\\n/g, '\\n');
            return l !== r;
        };

        ctrl.boolValClass = function(value) {
            return value === 'true' ? 'sft-bool-icon--true' : 'sft-bool-icon--false';
        };

        // Build a /nav_to.do URL that opens the referenced record in a new tab.
        ctrl.getReferenceUrl = function(f, side) {
            var val = side === 'left' ? ctrl.leftFields[f.key] : ctrl.rightFields[f.key];
            if (!val || !f.reference) { return '#'; }
            return '/nav_to.do?uri=' + encodeURIComponent(f.reference + '.do?sys_id=' + val);
        };

        ctrl.getExtraReferenceUrl = function(f, side) {
            var val = side === 'left' ? ctrl.extraLeftFields[f.key] : ctrl.extraRightFields[f.key];
            if (!val || !f.reference) { return '#'; }
            return '/nav_to.do?uri=' + encodeURIComponent(f.reference + '.do?sys_id=' + val);
        };

        ctrl.versionOptionLabel = function(v) {
            var label = _formatDate(v.sys_created_on);
            if (v.sys_created_by) {
                label += ' \\u00b7 ' + v.sys_created_by;
            }
            if (v.update_set_name) {
                label += ' (' + v.update_set_name + ')';
            }
            return label || 'Version';
        };

        ctrl.formatDate     = function(isoStr) { return _formatDate(isoStr); };
        ctrl.formatDateFull = function(isoStr) { return _formatDateFull(isoStr); };

        ctrl.leftLabel = function() {
            if (ctrl.leftVersionId === 'current_saved') {
                if (ctrl.savedMeta.date) {
                    return ctrl.savedMeta.date + ' (Current)';
                }
                return 'Current (saved)';
            }
            var v = (ctrl.versionsData || []).filter(function(x) { return x.sys_id === ctrl.leftVersionId; })[0];
            if (!v) { return 'Select version'; }
            var label = _formatDate(v.sys_created_on);
            if (v.update_set_name) { label += ' (' + v.update_set_name + ')'; }
            return label || 'Version';
        };

        ctrl.rightLabel = function() {
            if (!ctrl.rightVersionId || ctrl.rightVersionId === 'current') {
                if (ctrl.currentIsUnsaved) { return '(Unsaved)'; }
                var label = ctrl.currentMeta.date || '';
                return label + ' (Current)';
            }
            var v = (ctrl.versionsData || []).filter(function(x) { return x.sys_id === ctrl.rightVersionId; })[0];
            return v ? ctrl.versionOptionLabel(v) : 'Select version';
        };

        ctrl.toggleVersionCol = function(side) {
            ctrl.openVersionCol = ctrl.openVersionCol === side ? null : side;
        };

        ctrl.selectLeftVersion = function(sysId) {
            ctrl.openVersionCol = null;
            if (sysId === ctrl.leftVersionId) { return; }
            ctrl.leftVersionId = sysId;
            if (sysId === 'current_saved') {
                _leftIsCurrentSaved = true;
                _leftVersionData    = null;
                _currentLeftId      = 'current_saved';
                _validateRightSelection();
                _apply(function() { _syncScope(); });
            } else {
                _leftIsCurrentSaved = false;
                ctrl.onLeftVersionChange();
            }
        };

        ctrl.selectRightVersion = function(sysId) {
            ctrl.openVersionCol = null;
            if (sysId === ctrl.rightVersionId) { return; }
            ctrl.rightVersionId = sysId;
            ctrl.onRightVersionChange();
        };

        $document[0].addEventListener('click', function() {
            if (ctrl.openVersionCol !== null) {
                $scope.$apply(function() { ctrl.openVersionCol = null; });
            }
        });

        ctrl.platformUrl = '/nav_to.do?uri=' + encodeURIComponent(tableParam + '.do?sys_id=' + recordId);

        ctrl.hasWidgetEditorOpener = (function() {
            try { return !!(window.top.opener && !window.top.opener.closed); } catch(e) { return false; }
        })();
        ctrl.isEmbedded  = isEmbedded;
        ctrl.isFromList  = isFromList;

        ctrl.openWidgetEditorNew = function() {
            var url = _navUrl(widgetEditorSysId, 'widget_editor', { widget_id: recordId });
            window.open(url, '_blank');
            try { window.top.close(); } catch(e) {}
        };

        ctrl.goToWidgetEditor = function() {
            if (isFromList) {
                try { window.top.close(); } catch(e) {}
                return;
            }
            try {
                var topOpener = window.top.opener;
                if (topOpener && !topOpener.closed) {
                    topOpener.top.focus();
                    window.top.close();
                    return;
                }
            } catch (e) {}
            var url = _navUrl(widgetEditorSysId, 'widget_editor', { widget_id: recordId });
            window.top.location.href = url;
        };

        ctrl.onLeftVersionChange = function() {
            if (ctrl.leftVersionId === _currentRightId) {
                ctrl.leftVersionId = _currentLeftId;
                return;
            }
            _currentLeftId = ctrl.leftVersionId;
            _loadAndSwitch('left', _currentLeftId);
        };

        ctrl.onRightVersionChange = function() {
            if (ctrl.rightVersionId !== 'current' && ctrl.rightVersionId === _currentLeftId) {
                ctrl.rightVersionId = _currentRightId;
                return;
            }
            _currentRightId = ctrl.rightVersionId;
            _loadAndSwitch('right', _currentRightId);
        };

        ctrl.initEditor = function(index) {
            if (ctrl.editors[index]) {
                ctrl.editors[index].layout();
                return;
            }
            var fDef      = ctrl.scriptFields[index];
            var container = document.getElementById('da-ed-' + index);
            if (!window.monaco || !container) {
                if (container) {
                    container.innerHTML = '<div class="da-no-monaco">Monaco editor is not available. Keep the Widget Editor tab open and try again.</div>';
                }
                return;
            }
            _ensureMonacoWorker();
            _setupLanguageServices();
            var diffEditor = monaco.editor.createDiffEditor(container, {
                automaticLayout: true,
                enableSplitViewResizing: true,
                readOnly: true,
                scrollBeyondLastLine: false,
                wordWrap: ctrl.wordWrap ? 'on' : 'off'
            });
            diffEditor.setModel({
                original: monaco.editor.createModel(ctrl.leftFields[fDef.key]  || '', _langForEditor(fDef.language)),
                modified: monaco.editor.createModel(ctrl.rightFields[fDef.key] || '', _langForEditor(fDef.language))
            });
            diffEditor.onDidUpdateDiff(function() {
                var counts = _countsFromLineChanges(diffEditor.getLineChanges());
                _apply(function() {
                    var f = ctrl.scriptFields[index];
                    if (f) { f.counts = counts; }
                });
            });
            ctrl.editors[index] = diffEditor;
        };

        ctrl.initExtraEditor = function(index) {
            if (ctrl.extraEditors[index]) {
                ctrl.extraEditors[index].layout();
                return;
            }
            var fDef      = ctrl.extraChangedScriptFields[index];
            var container = document.getElementById('da-ex-ed-' + index);
            if (!window.monaco || !container) {
                if (container) {
                    container.innerHTML = '<div class="da-no-monaco">Monaco editor is not available. Keep the Widget Editor tab open and try again.</div>';
                }
                return;
            }
            _ensureMonacoWorker();
            _setupLanguageServices();
            var diffEditor = monaco.editor.createDiffEditor(container, {
                automaticLayout: true,
                enableSplitViewResizing: true,
                readOnly: true,
                scrollBeyondLastLine: false,
                wordWrap: ctrl.wordWrap ? 'on' : 'off'
            });
            diffEditor.setModel({
                original: monaco.editor.createModel(ctrl.extraLeftFields[fDef.key]  || '', _langForEditor(fDef.language)),
                modified: monaco.editor.createModel(ctrl.extraRightFields[fDef.key] || '', _langForEditor(fDef.language))
            });
            diffEditor.onDidUpdateDiff(function() {
                var counts = _countsFromLineChanges(diffEditor.getLineChanges());
                _apply(function() {
                    var f = ctrl.extraChangedScriptFields[index];
                    if (f) { f.counts = counts; }
                });
            });
            ctrl.extraEditors[index] = diffEditor;
        };
    }])

    .directive('weDiffRecordPicker', ['$timeout', function($timeout) {
        return {
            restrict: 'A',
            link: function(scope, el) {
                $timeout(function() {
                    var $jq = (typeof $j !== 'undefined') ? $j : (typeof jQuery !== 'undefined' ? jQuery : null);
                    if (!$jq || !$jq.fn || !$jq.fn.select2) {
                        return;
                    }

                    var input = document.createElement('input');
                    input.type = 'hidden';
                    input.value = recordId;
                    el[0].appendChild(input);
                    var $input = $jq(input);

                    var _timer = null;
                    $input.select2({
                        placeholder: '(select record)',
                        minimumInputLength: 0,
                        allowClear: false,
                        dropdownCssClass: 'dc-record-picker-drop',
                        query: function(query) {
                            clearTimeout(_timer);
                            _timer = setTimeout(function() {
                                _ajax('getRecordsForTable', { table: tableParam, search: query.term || '', page: query.page || 1 }, function(data) {
                                    var results = (data.success && data.records)
                                        ? data.records.map(function(r) { return { id: r.sys_id, text: r.name || r.sys_id }; })
                                        : [];
                                    query.callback({ results: results, more: !!data.has_more });
                                });
                            }, 250);
                        },
                        initSelection: function(element, callback) {
                            var name = scope.ctrl && scope.ctrl.recordName;
                            callback({ id: recordId, text: name || '' });
                        }
                    });

                    $input.on('change', function(e) {
                        var newId = (e.added && e.added.id) || e.val || $input.select2('val');
                        if (!newId || newId === recordId) { return; }
                        window.top.location.href = _navUrl(diffPageSysId, 'widget_editor_diff', { table: tableParam, record_id: newId });
                    });

                    var unwatch = scope.$watch('ctrl.recordName', function(name) {
                        if (!name) { return; }
                        $input.select2('data', { id: recordId, text: name });
                        unwatch();
                    });
                });
            }
        };
    }])

    .directive('weDiffTablePicker', ['$timeout', function($timeout) {
        return {
            restrict: 'A',
            link: function(scope, el) {
                $timeout(function() {
                    var $jq = (typeof $j !== 'undefined') ? $j : (typeof jQuery !== 'undefined' ? jQuery : null);
                    if (!$jq || !$jq.fn || !$jq.fn.select2) { return; }

                    var input = document.createElement('input');
                    input.type = 'hidden';
                    input.value = tableParam;
                    el[0].appendChild(input);
                    var $input = $jq(input);

                    var _timer = null;
                    $input.select2({
                        placeholder: '(select table)',
                        minimumInputLength: 0,
                        allowClear: false,
                        dropdownCssClass: 'dc-table-picker-drop',
                        formatResult: function(item) {
                            var label = document.createTextNode(item.text || item.id);
                            var name  = document.createTextNode(item.id);
                            var wrap  = document.createElement('span');
                            var sub   = document.createElement('span');
                            sub.className = 'dc-table-result-name';
                            wrap.appendChild(label);
                            wrap.appendChild(sub);
                            sub.appendChild(name);
                            return wrap;
                        },
                        formatSelection: function(item) { return item.text || item.id; },
                        query: function(query) {
                            clearTimeout(_timer);
                            _timer = setTimeout(function() {
                                _ajax('getTablesForDiff', { search: query.term || '', page: query.page || 1 }, function(data) {
                                    var results = (data.success && data.tables)
                                        ? data.tables.map(function(t) { return { id: t.name, text: t.label || t.name }; })
                                        : [];
                                    query.callback({ results: results, more: !!data.has_more });
                                });
                            }, 250);
                        },
                        initSelection: function(element, callback) {
                            var label = scope.ctrl && scope.ctrl.tableLabel;
                            callback({ id: tableParam, text: label || tableParam });
                        }
                    });

                    $input.on('change', function(e) {
                        var newTable = (e.added && e.added.id) || e.val || $input.select2('val');
                        if (!newTable || newTable === tableParam) { return; }
                        window.top.location.href = _navUrl(diffPageSysId, 'widget_editor_diff', { table: newTable });
                    });

                    var unwatch = scope.$watch('ctrl.tableLabel', function(label) {
                        if (!label) { return; }
                        $input.select2('data', { id: tableParam, text: label });
                        unwatch();
                    });
                });
            }
        };
    }])

    .directive('weDiffAccordion', ['$timeout', function($timeout) {
        return {
            link: function(scope, element) {
                element[0].addEventListener('toggle', function() {
                    if (!element[0].open) {
                        if (scope.ctrl.expandedIndex === scope.$index) {
                            $timeout(function() { scope.ctrl.collapseExpanded(); });
                        }
                        return;
                    }
                    $timeout(function() {
                        scope.ctrl.initEditor(scope.$index);
                        scope.ctrl.scrollAccordionIntoView(scope.$index);
                    }, 0);
                });
            }
        };
    }])

    .directive('weDiffExtraAccordion', ['$timeout', function($timeout) {
        return {
            link: function(scope, element) {
                element[0].addEventListener('toggle', function() {
                    if (!element[0].open) { return; }
                    $timeout(function() {
                        scope.ctrl.initExtraEditor(scope.$index);
                    }, 0);
                });
            }
        };
    }])

    .directive('weTooltip', [function() {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                element.tooltip({ container: 'body', placement: 'bottom' });
                attrs.$observe('weTooltip', function(val) {
                    element.attr('data-original-title', val || '');
                });
                scope.$on('$destroy', function() {
                    try { element.tooltip('destroy'); } catch(e) {}
                });
            }
        };
    }]);

        var appEl = document.getElementById('we-diff-app');
        if (appEl) {
            angular.bootstrap(appEl, ['weDiff']);
        }
    }

    /* Detect Polaris light/dark theme via CSS variable and stamp html.we-light accordingly. */
    function _applyThemeClass() {
        try {
            var bg = getComputedStyle(document.documentElement)
                .getPropertyValue('--now-color_background--primary').trim();
            var p = bg.split(/[\\s,]+/).map(Number);
            if (p.length >= 3) {
                document.documentElement.classList.toggle('we-light', (p[0] + p[1] + p[2]) / 3 >= 128);
            }
        } catch (e) {}
    }

    // Copy CSS variables from opener window (theme support)
    function _copyOpenerStyles() {
        var openerWin = (window.top && window.top.opener) || window.opener;
        if (!openerWin || !openerWin.document) { return; }
        try {
            var styles = openerWin.document.querySelectorAll('style');
            for (var i = 0; i < styles.length; i++) {
                var text = styles[i].textContent || '';
                if (text.indexOf('--now-') !== -1 || text.indexOf(':root') !== -1) {
                    var s = document.createElement('style');
                    s.textContent = text;
                    document.head.appendChild(s);
                }
            }
        } catch (e) {}
    }

    function _afterLoad() {
        _copyOpenerStyles();
        _applyThemeClass();
        _initAngular();
    }

    if (typeof addAfterPageLoadedEvent === 'function') {
        addAfterPageLoadedEvent(_afterLoad);
    } else if (document.readyState !== 'loading') {
        _afterLoad();
    } else {
        document.addEventListener('DOMContentLoaded', _afterLoad);
    }

})();
`,
    processingScript: `// Server-side logic is handled by the WidgetEditorAjax Script Include (AbstractAjaxProcessor).
// Client calls are made via GlideAjax from client_script.js.
`,
})
