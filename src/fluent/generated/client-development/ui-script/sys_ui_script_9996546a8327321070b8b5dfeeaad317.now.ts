import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['9996546a8327321070b8b5dfeeaad317'],
    table: 'sys_ui_script',
    data: {
        active: 'true',
        description: `AngularJS ng-directive completions and HTML Monarch tokenizer for Monaco, covering ng-* and ServiceNow SP directives (sp-widget, sp-model, etc.).
Registers as window.MONACO_LANGUAGE_HTML.`,
        global: 'false',
        ignore_in_now_experience: 'false',
        name: 'monaco_language_html',
        script: `(function () {
    'use strict';

    // -----------------------------------------------------------------------------
    // AngularJS ng-directive completions + HTML Monarch tokenizer for Monaco.
    //
    // Covers every directive in https://docs.angularjs.org/api/ng/directive
    // plus ServiceNow SP directives (sp-widget, sp-model, sp-log-stream, …).
    //
    // Activates on the HTML language ('html') — used by:
    //   • Body HTML template editor  (pane.field === 'template')
    //   • Angular template editors   (pane.recordType === 'template')
    //
    // The consumer script calls MONACO_LANGUAGE_HTML.register(monaco) once Monaco loads.
    // The registration function is idempotent — safe to call multiple times.
    //
    // Token names referenced by _ensureMonacoThemes in client_script.js:
    //   attribute.name.ng   — ng-* directive attribute names
    //   attribute.name.sp   — sp-* ServiceNow SP attribute names
    //   ng.delimiter        — {{ and }} interpolation delimiters
    //   ng.expression       — expression content inside {{ }}
    // -----------------------------------------------------------------------------

    // -------------------------------------------------------------------------
    // Directive definitions
    // -------------------------------------------------------------------------
    // Each entry:
    //   name        — attribute name as written in HTML
    //   detail      — one-line summary for the completion list
    //   snippet     — TabStop snippet inserted on completion (value only, no \\\`=\\\`)
    //   description — full Markdown documentation for hover / completion detail
    // -------------------------------------------------------------------------

    var DIRECTIVES = [

        // ---- Bootstrapping --------------------------------------------------
        {
            name: 'ng-app',
            detail: 'Bootstrap the AngularJS application',
            snippet: '"\\u0024{1:moduleName}"',
            description: [
                'Designates the root element of the AngularJS application.',
                'The value is the name of the Angular module to bootstrap.',
                '',
                '**Arguments:**',
                '- \`ng-app\` *(string, optional)* — Name of the AngularJS module to load as the root module.',
                '- \`ng-strict-di\` *(boolean, optional)* — If present, the injector will be created in strict DI mode, refusing to invoke functions without explicit DI annotations.',
                '',
                '**Example:**',
                '\`\`\`html',
                '<html ng-app="myApp">',
                '\`\`\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngApp)'
            ].join('\\n')
        },
        {
            name: 'ng-controller',
            detail: 'Attach a controller to the view',
            snippet: '"\\u0024{1:ControllerName} as \\u0024{2:ctrl}"',
            description: [
                'Attaches a controller class to the view. The controller is',
                'instantiated before the view is linked.',
                '',
                '**Arguments:**',
                '- \`ng-controller\` *(expression)* — Name of a globally accessible constructor function or an expression that evaluates to a constructor. Supports \`"CtrlName as alias"\` syntax to publish the controller instance as a scope property.',
                '',
                '**Example:**',
                '\`\`\`html',
                '<div ng-controller="MyCtrl as vm">',
                '  {{ vm.message }}',
                '</div>',
                '\`\`\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngController)'
            ].join('\\n')
        },

        // ---- Structural — DOM manipulation ----------------------------------
        {
            name: 'ng-if',
            detail: 'Conditionally include/remove an element',
            snippet: '"\\u0024{1:condition}"',
            description: [
                'Removes or recreates a portion of the DOM tree based on an expression.',
                'Unlike \`ng-show\`, the element and its children are **destroyed and',
                're-created** when the expression changes.',
                '',
                '**Arguments:**',
                '- \`ng-if\` *(expression)* — If the expression is falsy, the element and its subtree are removed from the DOM; when truthy they are re-created.',
                '',
                '**Example:**',
                '\`\`\`html',
                '<div ng-if="user.isAdmin">Admin panel</div>',
                '\`\`\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngIf)'
            ].join('\\n')
        },
        {
            name: 'ng-show',
            detail: 'Show element when expression is truthy',
            snippet: '"\\u0024{1:condition}"',
            description: [
                'Shows or hides the element by toggling the \`.ng-hide\` CSS class.',
                'The element remains in the DOM (contrast with \`ng-if\`).',
                '',
                '**Arguments:**',
                '- \`ng-show\` *(expression)* — If truthy, the element is shown; if falsy, the \`ng-hide\` CSS class is added.',
                '',
                '**Example:**',
                '\`\`\`html',
                '<p ng-show="isLoggedIn">Welcome back!</p>',
                '\`\`\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngShow)'
            ].join('\\n')
        },
        {
            name: 'ng-hide',
            detail: 'Hide element when expression is truthy',
            snippet: '"\\u0024{1:condition}"',
            description: [
                'Hides the element by adding the \`.ng-hide\` CSS class when the',
                'expression evaluates to a truthy value. The element remains in the DOM.',
                '',
                '**Arguments:**',
                '- \`ng-hide\` *(expression)* — If truthy, the element is hidden; if falsy, the element is shown.',
                '',
                '**Example:**',
                '\`\`\`html',
                '<div ng-hide="isLoading">Content loaded</div>',
                '\`\`\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngHide)'
            ].join('\\n')
        },
        {
            name: 'ng-repeat',
            detail: 'Repeat template for each item in a collection',
            snippet: '"\\u0024{1:item} in \\u0024{2:items}"',
            description: [
                'Instantiates a template once per item from a collection.',
                '',
                '**Arguments:**',
                '- \`ng-repeat\` *(repeat_expression)* — Defines the iterator. Supported forms:',
                '  - \`variable in expression\`',
                '  - \`(key, value) in expression\`',
                '  - \`variable in expression track by tracking_expression\`',
                '  - \`variable in expression | filter:x | orderBy:y track by z\`',
                '',
                '**Special properties available in each iteration:**',
                '- \`$index\` — zero-based integer position',
                '- \`$first\` / \`$last\` / \`$middle\` — position booleans',
                '- \`$even\` / \`$odd\` — alternating row booleans',
                '- \`$parent\` — access parent scope',
                '',
                '**Examples:**',
                '\`\`\`html',
                '<li ng-repeat="item in items">{{ item.name }}</li>',
                '',
                '<li ng-repeat="item in items track by item.id">',
                '',
                '<li ng-repeat="(key, value) in object">',
                '\`\`\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngRepeat)'
            ].join('\\n')
        },
        {
            name: 'ng-repeat-start',
            detail: 'Begin a multi-element ng-repeat block',
            snippet: '"\\u0024{1:item} in \\u0024{2:items}"',
            description: [
                'Used with \`ng-repeat-end\` to repeat a block of sibling elements.',
                '',
                '**Arguments:**',
                '- \`ng-repeat-start\` *(repeat_expression)* — Same expression syntax as \`ng-repeat\`. Applied to the first element of the repeated block.',
                '',
                '**Example:**',
                '\`\`\`html',
                '<dt ng-repeat-start="item in items">{{ item.label }}</dt>',
                '<dd ng-repeat-end>{{ item.value }}</dd>',
                '\`\`\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngRepeat)'
            ].join('\\n')
        },
        {
            name: 'ng-repeat-end',
            detail: 'End a multi-element ng-repeat block',
            snippet: '',
            description: [
                'Marks the end of a \`ng-repeat-start\` / \`ng-repeat-end\` block.',
                '',
                '**Arguments:** None — presence of the attribute is sufficient.',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngRepeat)'
            ].join('\\n')
        },
        {
            name: 'ng-switch',
            detail: 'Conditionally swap DOM structure',
            snippet: '"\\u0024{1:expression}"',
            description: [
                'Conditionally swaps DOM structure based on the value of an expression.',
                'Use with \`ng-switch-when\` and \`ng-switch-default\` on child elements.',
                '',
                '**Arguments:**',
                '- \`ng-switch\` / \`on\` *(expression)* — The expression to evaluate. Its string value is compared against each child\\'s \`ng-switch-when\` value.',
                '',
                '**Example:**',
                '\`\`\`html',
                '<div ng-switch="status">',
                '  <span ng-switch-when="active">Active</span>',
                '  <span ng-switch-when="inactive">Inactive</span>',
                '  <span ng-switch-default>Unknown</span>',
                '</div>',
                '\`\`\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngSwitch)'
            ].join('\\n')
        },
        {
            name: 'ng-switch-when',
            detail: 'Render when ng-switch expression matches',
            snippet: '"\\u0024{1:value}"',
            description: [
                'Child of \`ng-switch\`. Renders this element when the switch expression',
                'equals the given value.',
                '',
                '**Arguments:**',
                '- \`ng-switch-when\` *(matching_expression)* — Value to compare against the \`ng-switch\` expression. Multiple \`ng-switch-when\` attributes may appear on the same element to match several values.',
                '',
                '**Example:** \`<span ng-switch-when="active">Active</span>\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngSwitch)'
            ].join('\\n')
        },
        {
            name: 'ng-switch-default',
            detail: 'Render when no ng-switch-when matches',
            snippet: '',
            description: [
                'Child of \`ng-switch\`. Rendered when no \`ng-switch-when\` case matches.',
                '',
                '**Arguments:** None — presence of the attribute marks the element as the default case.',
                '',
                '**Example:** \`<span ng-switch-default>Unknown</span>\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngSwitch)'
            ].join('\\n')
        },
        {
            name: 'ng-include',
            detail: 'Fetch and include an external HTML template',
            snippet: '"\\'\\u0024{1:template/path.html}\\'"',
            description: [
                'Fetches, compiles and includes an external HTML fragment.',
                'The value must be an Angular expression that evaluates to a URL string.',
                '',
                '**Arguments:**',
                '- \`ng-include\` / \`src\` *(string expression)* — AngularJS expression evaluating to the URL of the template to include. String literal URLs must be quoted: \`ng-include="\\'path.html\\'"\`. Required.',
                '- \`onload\` *(expression, optional)* — Expression evaluated after the template is loaded and linked.',
                '- \`autoscroll\` *(string, optional)* — Whether to call \`$anchorScroll\` after the template is loaded. If omitted or falsy, no scroll is performed.',
                '',
                '**Examples:**',
                '\`\`\`html',
                '<div ng-include="\\'views/header.html\\'"></div>',
                '<div ng-include="templateUrl"></div>',
                '\`\`\`',
                '',
                '> **Note:** In Service Portal use \`sp-widget\` to embed widgets instead.',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngInclude)'
            ].join('\\n')
        },
        {
            name: 'ng-cloak',
            detail: 'Prevent template flash before Angular compiles',
            snippet: '',
            description: [
                'Prevents the AngularJS template from being briefly displayed as raw',
                'text before the compiler processes it (Flash of Uncompiled Content).',
                '',
                '**Arguments:** None — presence of the attribute is sufficient.',
                '',
                'Add to the root element or any element with \`{{ }}\` expressions.',
                '',
                '**Example:** \`<div ng-cloak>{{ user.name }}</div>\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngCloak)'
            ].join('\\n')
        },
        {
            name: 'ng-non-bindable',
            detail: 'Prevent Angular from compiling this element',
            snippet: '',
            description: [
                'Tells AngularJS not to compile or bind the contents of this element.',
                'Useful for displaying raw Angular template syntax as documentation.',
                '',
                '**Arguments:** None — presence of the attribute is sufficient.',
                '',
                '**Example:**',
                '\`\`\`html',
                '<code ng-non-bindable>{{ raw }}</code>',
                '\`\`\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngNonBindable)'
            ].join('\\n')
        },
        {
            name: 'ng-view',
            detail: 'ngRoute: placeholder for routed views',
            snippet: '',
            description: [
                'Placeholder element that \`ngRoute\` uses to render route templates.',
                'Only one \`ng-view\` can exist per application.',
                '',
                '**Arguments:** None — presence of the element or attribute is sufficient.',
                '',
                '**Example:** \`<div ng-view></div>\`'
            ].join('\\n')
        },
        {
            name: 'ng-transclude',
            detail: 'Mark the insertion point for transcluded content',
            snippet: '',
            description: [
                'Marks the insertion point for the transcluded DOM of the nearest',
                'parent directive that uses transclusion. Supports named slots for',
                'multi-slot transclusion.',
                '',
                '**Arguments:**',
                '- \`ng-transclude\` / \`ng-transclude-slot\` *(string, optional)* — Name of the transclusion slot to use. Leave empty for the default slot.',
                '',
                '**Example:** \`<div ng-transclude></div>\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngTransclude)'
            ].join('\\n')
        },
        {
            name: 'ng-pluralize',
            detail: 'Display a message based on a numeric count',
            snippet: 'count="\\u0024{1:count}" when="\\u0024{2:{\\'0\\': \\'No items\\', \\'one\\': \\'{} item\\', \\'other\\': \\'{} items\\'}}"',
            description: [
                'Displays a message according to en-US localisation rules,',
                'mapping count values to message templates.',
                '',
                '**Arguments:**',
                '- \`count\` *(string|expression)* — The number to compare against the thresholds in \`when\`. Required.',
                '- \`when\` *(string)* — JSON object mapping count values to message strings. Use \`\\'one\\'\`, \`\\'other\\'\`, or numeric keys. Use \`{}\` as a placeholder for the count. Required.',
                '- \`offset\` *(number, optional)* — Number to subtract from \`count\` before matching against \`when\` keys.',
                '',
                '**Example:**',
                '\`\`\`html',
                '<ng-pluralize count="itemCount"',
                '  when="{\\'0\\': \\'No items\\',',
                '          \\'one\\': \\'{} item\\',',
                '          \\'other\\': \\'{} items\\'}">',
                '</ng-pluralize>',
                '\`\`\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngPluralize)'
            ].join('\\n')
        },

        // ---- Data binding ---------------------------------------------------
        {
            name: 'ng-bind',
            detail: 'One-way bind expression to element text content',
            snippet: '"\\u0024{1:expression}"',
            description: [
                'Replaces the text content of an element with the evaluated expression.',
                'Preferred over \`{{ }}\` for the root binding to avoid FOUC.',
                '',
                '**Arguments:**',
                '- \`ng-bind\` *(expression)* — The expression to evaluate; the result is set as the text content of the element.',
                '',
                '**Example:** \`<span ng-bind="user.name"></span>\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngBind)'
            ].join('\\n')
        },
        {
            name: 'ng-bind-html',
            detail: 'Bind trusted HTML to innerHTML',
            snippet: '"\\u0024{1:trustedHtml}"',
            description: [
                'Sets the \`innerHTML\` of the element to the result of an expression.',
                'The value must be marked as trusted by \`$sce.trustAsHtml()\`, or ngSanitize must be loaded.',
                '',
                '**Arguments:**',
                '- \`ng-bind-html\` *(expression)* — Expression evaluating to a trusted HTML string or a string to be sanitized by \`$sanitize\`.',
                '',
                '**Example:** \`<div ng-bind-html="item.description"></div>\`',
                '',
                '> **Security:** Never bind raw user input without sanitisation.',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngBindHtml)'
            ].join('\\n')
        },
        {
            name: 'ng-bind-template',
            detail: 'Bind multiple interpolations to element text',
            snippet: '"\\u0024{1:Hello {{name}}, you have {{count}} messages.}"',
            description: [
                'Replaces element text with an interpolated template string.',
                'Use this when more than one expression needs to appear in the text.',
                '',
                '**Arguments:**',
                '- \`ng-bind-template\` *(string template)* — A string containing one or more AngularJS \`{{ }}\` interpolation expressions (e.g. \`"Hello {{first}} {{last}}!"\`).',
                '',
                '**Example:**',
                '\`\`\`html',
                '<title ng-bind-template="{{page.title}} - My App"></title>',
                '\`\`\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngBindTemplate)'
            ].join('\\n')
        },
        {
            name: 'ng-model',
            detail: 'Two-way bind input to a scope property',
            snippet: '"\\u0024{1:model}"',
            description: [
                'Creates a two-way data binding between an \`<input>\`, \`<select>\`,',
                'or \`<textarea>\` element and a scope property.',
                'Also handles form validation state.',
                '',
                '**Arguments:**',
                '- \`ng-model\` *(string)* — Assignable AngularJS expression to bind to. Evaluated in the context of the current scope.',
                '',
                '**Example:**',
                '\`\`\`html',
                '<input type="text" ng-model="user.name">',
                '<select ng-model="selected">',
                '<textarea ng-model="comment">',
                '\`\`\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngModel)'
            ].join('\\n')
        },
        {
            name: 'ng-model-options',
            detail: 'Tune how ng-model updates the scope',
            snippet: '"{ updateOn: \\'\\u0024{1:blur}\\', debounce: \\u0024{2:500} }"',
            description: [
                'Allows fine-grained control over when and how \`ng-model\` updates',
                'the bound scope property.',
                '',
                '**Arguments:**',
                '- \`ng-model-options\` *(object expression)* — An object with the following optional properties:',
                '  - \`updateOn\` *(string)* — Space-separated list of events that trigger model update. Use \`"default"\` to include built-in triggers alongside custom ones.',
                '  - \`debounce\` *(number|object)* — Milliseconds to wait before updating the model. Can be a number or an object keyed by event name.',
                '  - \`allowInvalid\` *(boolean)* — If \`true\`, updates the model even when the value is invalid.',
                '  - \`getterSetter\` *(boolean)* — If \`true\`, treats the bound expression as a getter/setter function.',
                '  - \`timezone\` *(string)* — Timezone for \`date\`/\`time\` inputs (e.g. \`"UTC"\`, \`"+0500"\`).',
                '  - \`timeSecondsFormat\` *(string)* — Format string for the seconds part of time inputs.',
                '  - \`timeStripZeroSeconds\` *(boolean)* — Strip \`:00\` seconds from the displayed time value.',
                '',
                '**Example:**',
                '\`\`\`html',
                '<input ng-model="name" ng-model-options="{ updateOn: \\'blur\\', debounce: 300 }">',
                '\`\`\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngModelOptions)'
            ].join('\\n')
        },
        {
            name: 'ng-init',
            detail: 'Evaluate an expression in the current scope',
            snippet: '"\\u0024{1:variable = value}"',
            description: [
                'Evaluates an expression in the current scope during template linking.',
                '',
                '**Arguments:**',
                '- \`ng-init\` *(expression)* — Expression to evaluate. Multiple assignments can be separated by semicolons.',
                '',
                '> **Prefer** initialising state in a controller over \`ng-init\`.',
                '> Use \`ng-init\` only for simple aliasing (e.g. inside \`ng-repeat\`).',
                '',
                '**Example:**',
                '\`\`\`html',
                '<div ng-init="greeting = \\'Hello\\'">{{ greeting }}</div>',
                '\`\`\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngInit)'
            ].join('\\n')
        },
        {
            name: 'ng-value',
            detail: 'Bind the value attribute of an input',
            snippet: '"\\u0024{1:expression}"',
            description: [
                'Binds the value of a \`<input type="radio">\` or \`<option>\` element.',
                'Used when the value needs to be a non-string Angular expression.',
                '',
                '**Arguments:**',
                '- \`ng-value\` *(expression)* — AngularJS expression whose result is assigned as the \`value\` attribute of the element.',
                '',
                '**Example:**',
                '\`\`\`html',
                '<input type="radio" ng-model="choice" ng-value="item">',
                '\`\`\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngValue)'
            ].join('\\n')
        },
        {
            name: 'ng-list',
            detail: 'Convert a delimited string input to an array',
            snippet: '"\\u0024{1:, }"',
            description: [
                'Converts a text input between a delimited string and an array.',
                'The value specifies the delimiter (default: \`,\`).',
                '',
                '**Arguments:**',
                '- \`ng-list\` *(string, optional)* — Delimiter string or RegExp literal. Defaults to \`", "\`. A string is used for both splitting and joining; a RegExp is used for splitting only.',
                '',
                '**Example:**',
                '\`\`\`html',
                '<input ng-model="tags" ng-list=", ">',
                '<!-- tags = ["angular", "javascript"] when input is "angular, javascript" -->',
                '\`\`\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngList)'
            ].join('\\n')
        },

        // ---- Class & style --------------------------------------------------
        {
            name: 'ng-class',
            detail: 'Dynamically set CSS classes',
            snippet: '"\\u0024{1:{\\'active\\': isActive, \\'disabled\\': isDisabled}}"',
            description: [
                'Dynamically adds and removes CSS classes based on an expression.',
                '',
                '**Arguments:**',
                '- \`ng-class\` *(expression)* — Evaluates to one of: a **string** of space-separated class names, an **array** of class name strings, or an **object** whose keys are class names and values are boolean conditions.',
                '',
                '**Three forms:**',
                '\`\`\`html',
                '<!-- Object: keys are class names, values are conditions -->',
                '<div ng-class="{active: isActive, error: hasError}">',
                '',
                '<!-- Array: all classes in the array are applied -->',
                '<div ng-class="[\\'class-a\\', conditionalClass]">',
                '',
                '<!-- String: a space-separated list of class names -->',
                '<div ng-class="dynamicClass">',
                '\`\`\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngClass)'
            ].join('\\n')
        },
        {
            name: 'ng-class-even',
            detail: 'Apply classes to even-indexed ng-repeat rows',
            snippet: '"\\u0024{1:{\\'even-row\\': true}}"',
            description: [
                'Works like \`ng-class\` but only applies to **even-numbered** rows',
                'inside an \`ng-repeat\`. (Even means \`$even === true\`.)',
                '',
                '**Arguments:**',
                '- \`ng-class-even\` *(expression)* — Same shape as \`ng-class\` (string, array, or object). Applied only to even rows.',
                '',
                '**Example:**',
                '\`\`\`html',
                '<tr ng-repeat="item in items"',
                '    ng-class-even="{\\'striped\\': true}">',
                '\`\`\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngClassEven)'
            ].join('\\n')
        },
        {
            name: 'ng-class-odd',
            detail: 'Apply classes to odd-indexed ng-repeat rows',
            snippet: '"\\u0024{1:{\\'odd-row\\': true}}"',
            description: [
                'Works like \`ng-class\` but only applies to **odd-numbered** rows',
                'inside an \`ng-repeat\`.',
                '',
                '**Arguments:**',
                '- \`ng-class-odd\` *(expression)* — Same shape as \`ng-class\` (string, array, or object). Applied only to odd rows.',
                '',
                '**Example:**',
                '\`\`\`html',
                '<tr ng-repeat="item in items"',
                '    ng-class-odd="{\\'highlighted\\': true}">',
                '\`\`\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngClassOdd)'
            ].join('\\n')
        },
        {
            name: 'ng-style',
            detail: 'Dynamically set inline CSS styles',
            snippet: '"\\u0024{1:{color: textColor, fontSize: fontSize + \\'px\\'}}"',
            description: [
                'Evaluates an object expression and applies the resulting key/value',
                'pairs as inline CSS styles.',
                '',
                '**Arguments:**',
                '- \`ng-style\` *(expression)* — Expression evaluating to a key-value CSS object. Keys are CSS property names in camelCase or kebab-case.',
                '',
                '**Example:**',
                '\`\`\`html',
                '<div ng-style="{backgroundColor: item.color, fontWeight: \\'bold\\'}">',
                '\`\`\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngStyle)'
            ].join('\\n')
        },

        // ---- Attribute directives -------------------------------------------
        {
            name: 'ng-href',
            detail: 'Safe href binding (prevents broken links during compile)',
            snippet: '"\\u0024{1:{{ url }}}"',
            description: [
                'Use instead of \`href\` when the URL contains Angular interpolation.',
                'Prevents broken \`href\` during the brief period before Angular compiles.',
                '',
                '**Arguments:**',
                '- \`ng-href\` *(template string)* — Any string containing \`{{ }}\` interpolation markup (e.g. \`"https://example.com/{{userId}}"\`).',
                '',
                '**Example:**',
                '\`\`\`html',
                '<a ng-href="{{ item.url }}">{{ item.label }}</a>',
                '\`\`\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngHref)'
            ].join('\\n')
        },
        {
            name: 'ng-src',
            detail: 'Safe src binding for images',
            snippet: '"\\u0024{1:{{ imageUrl }}}"',
            description: [
                'Use instead of \`src\` when the URL contains Angular interpolation.',
                'Prevents broken image requests before Angular compiles.',
                '',
                '**Arguments:**',
                '- \`ng-src\` *(template string)* — Any string containing \`{{ }}\` interpolation markup.',
                '',
                '**Example:**',
                '\`\`\`html',
                '<img ng-src="{{ user.avatarUrl }}" alt="{{ user.name }}">',
                '\`\`\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngSrc)'
            ].join('\\n')
        },
        {
            name: 'ng-srcset',
            detail: 'Safe srcset binding for responsive images',
            snippet: '"\\u0024{1:{{ imageUrl }} 1x, {{ imageUrl2x }} 2x}"',
            description: [
                'Use instead of \`srcset\` when the value contains Angular interpolation.',
                '',
                '**Arguments:**',
                '- \`ng-srcset\` *(template string)* — Any string containing \`{{ }}\` interpolation markup (e.g. \`"{{ img.src }} 1x, {{ img.src2x }} 2x"\`).',
                '',
                '**Example:**',
                '\`\`\`html',
                '<img ng-srcset="{{ img.src }} 1x, {{ img.src2x }} 2x">',
                '\`\`\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngSrcset)'
            ].join('\\n')
        },
        {
            name: 'ng-disabled',
            detail: 'Conditionally set the disabled attribute',
            snippet: '"\\u0024{1:condition}"',
            description: [
                'Sets the \`disabled\` attribute on the element when the expression',
                'evaluates to truthy. Works on \`<button>\`, \`<input>\`, \`<select>\`, etc.',
                '',
                '**Arguments:**',
                '- \`ng-disabled\` *(expression)* — If truthy, the \`disabled\` attribute is set on the element.',
                '',
                '**Example:**',
                '\`\`\`html',
                '<button ng-disabled="form.$invalid">Submit</button>',
                '\`\`\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngDisabled)'
            ].join('\\n')
        },
        {
            name: 'ng-checked',
            detail: 'Conditionally set the checked attribute',
            snippet: '"\\u0024{1:condition}"',
            description: [
                'Sets the \`checked\` attribute on a checkbox or radio input.',
                'For two-way binding, prefer \`ng-model\` instead.',
                '',
                '**Arguments:**',
                '- \`ng-checked\` *(expression)* — If truthy, the \`checked\` attribute is set on the element.',
                '',
                '**Example:**',
                '\`\`\`html',
                '<input type="checkbox" ng-checked="item.selected">',
                '\`\`\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngChecked)'
            ].join('\\n')
        },
        {
            name: 'ng-readonly',
            detail: 'Conditionally set the readonly attribute',
            snippet: '"\\u0024{1:condition}"',
            description: [
                'Sets the \`readonly\` attribute on an input element based on the expression.',
                '',
                '**Arguments:**',
                '- \`ng-readonly\` *(expression)* — If truthy, the \`readonly\` attribute is set on the element.',
                '',
                '**Example:**',
                '\`\`\`html',
                '<input ng-model="value" ng-readonly="!canEdit">',
                '\`\`\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngReadonly)'
            ].join('\\n')
        },
        {
            name: 'ng-required',
            detail: 'Conditionally set the required validation constraint',
            snippet: '"\\u0024{1:condition}"',
            description: [
                'Sets the \`required\` attribute on an input and wires up Angular\\'s',
                '\`required\` validator. Can be toggled dynamically.',
                '',
                '**Arguments:**',
                '- \`ng-required\` *(expression)* — If truthy, adds the required constraint to the input and sets the \`required\` CSS class.',
                '',
                '**Example:**',
                '\`\`\`html',
                '<input ng-model="email" ng-required="isEmailRequired">',
                '\`\`\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngRequired)'
            ].join('\\n')
        },
        {
            name: 'ng-selected',
            detail: 'Conditionally set the selected attribute on an option',
            snippet: '"\\u0024{1:condition}"',
            description: [
                'Sets the \`selected\` attribute on an \`<option>\` element.',
                'For full select binding, prefer \`ng-model\` + \`ng-options\`.',
                '',
                '**Arguments:**',
                '- \`ng-selected\` *(expression)* — If truthy, the \`selected\` attribute is set on the element.',
                '',
                '**Example:**',
                '\`\`\`html',
                '<option ng-selected="item.id === selected.id" value="{{ item.id }}">',
                '\`\`\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngSelected)'
            ].join('\\n')
        },
        {
            name: 'ng-open',
            detail: 'Conditionally set the open attribute on <details>',
            snippet: '"\\u0024{1:condition}"',
            description: [
                'Sets the \`open\` attribute on a \`<details>\` element.',
                '',
                '**Arguments:**',
                '- \`ng-open\` *(expression)* — If truthy, the \`open\` attribute is set on the element.',
                '',
                '**Example:**',
                '\`\`\`html',
                '<details ng-open="showDetails">',
                '  <summary>More info</summary>',
                '</details>',
                '\`\`\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngOpen)'
            ].join('\\n')
        },

        // ---- Forms ----------------------------------------------------------
        {
            name: 'ng-form',
            detail: 'Nestable alias of the form directive',
            snippet: '"\\u0024{1:formName}"',
            description: [
                'Nestable alias of the \`<form>\` directive. Allows forms to be nested',
                'and for Angular form validation to apply inside any element.',
                '',
                '**Arguments:**',
                '- \`name\` *(string, optional)* — Name of the form in the current scope. When specified, the FormController is published to the scope under this name.',
                '',
                '**Example:**',
                '\`\`\`html',
                '<div ng-form="addressForm">',
                '  <input ng-model="address.street" required>',
                '</div>',
                '\`\`\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngForm)'
            ].join('\\n')
        },
        {
            name: 'ng-options',
            detail: 'Dynamically generate <option> elements for a <select>',
            snippet: '"\\u0024{1:item} as \\u0024{2:item.label} for \\u0024{3:item} in \\u0024{4:items}"',
            description: [
                'Generates \`<option>\` elements for a \`<select>\` from a collection.',
                '',
                '**Arguments:**',
                '- \`ng-model\` *(string)* — Assignable expression for the selected value. Required.',
                '- \`ng-options\` *(comprehension_expression)* — Defines the options list. Supported syntax:',
                '  - \`label for value in array\`',
                '  - \`select as label for value in array\`',
                '  - \`label group by group for value in array\`',
                '  - \`label disable when disable for value in array\`',
                '  - \`label for (key, value) in object\`',
                '  - These forms can be combined, e.g.: \`label group by group for value in array track by value.id\`',
                '- \`name\` *(string, optional)* — Property name of the form under which the control is published.',
                '- \`required\` *(string, optional)* — Sets required validation if no option is selected.',
                '- \`ng-required\` *(expression, optional)* — Sets required validation dynamically.',
                '- \`ng-attr-size\` *(string, optional)* — Binds the \`size\` attribute via interpolation.',
                '',
                '**Common forms:**',
                '\`\`\`html',
                '<!-- Bind value, display label -->',
                '<select ng-model="selected"',
                '        ng-options="item as item.name for item in items">',
                '',
                '<!-- Group by category -->',
                '<select ng-model="selected"',
                '        ng-options="item as item.name group by item.category for item in items">',
                '',
                '<!-- Track by id -->',
                '<select ng-model="selected"',
                '        ng-options="item as item.name for item in items track by item.id">',
                '\`\`\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngOptions)'
            ].join('\\n')
        },
        {
            name: 'ng-minlength',
            detail: 'Set minimum length validation for an input',
            snippet: '"\\u0024{1:3}"',
            description: [
                'Adds a \`minlength\` validator to the input. Sets the \`$error.minlength\`',
                'flag when the value is shorter than the minimum.',
                '',
                '**Arguments:**',
                '- \`ng-minlength\` *(number|expression)* — Expression evaluating to the minimum number of characters required.',
                '',
                '**Example:**',
                '\`\`\`html',
                '<input ng-model="password" ng-minlength="8">',
                '\`\`\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngMinlength)'
            ].join('\\n')
        },
        {
            name: 'ng-maxlength',
            detail: 'Set maximum length validation for an input',
            snippet: '"\\u0024{1:255}"',
            description: [
                'Adds a \`maxlength\` validator. Sets the \`$error.maxlength\` flag when',
                'the value exceeds the maximum length.',
                '',
                '**Arguments:**',
                '- \`ng-maxlength\` *(number|expression)* — Expression evaluating to the maximum number of characters allowed. Set to \`-1\` to disable.',
                '',
                '**Example:**',
                '\`\`\`html',
                '<input ng-model="comment" ng-maxlength="500">',
                '\`\`\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngMaxlength)'
            ].join('\\n')
        },
        {
            name: 'ng-min',
            detail: 'Set minimum value validation for a number/date input',
            snippet: '"\\u0024{1:0}"',
            description: [
                'Sets the \`min\` validation constraint dynamically.',
                'Works on \`<input type="number">\`, \`<input type="date">\`, etc.',
                '',
                '**Arguments:**',
                '- \`ng-min\` *(number|expression)* — Expression evaluating to the minimum value allowed.',
                '',
                '**Example:**',
                '\`\`\`html',
                '<input type="number" ng-model="qty" ng-min="1" ng-max="100">',
                '\`\`\`'
            ].join('\\n')
        },
        {
            name: 'ng-max',
            detail: 'Set maximum value validation for a number/date input',
            snippet: '"\\u0024{1:100}"',
            description: [
                'Sets the \`max\` validation constraint dynamically.',
                '',
                '**Arguments:**',
                '- \`ng-max\` *(number|expression)* — Expression evaluating to the maximum value allowed.',
                '',
                '**Example:**',
                '\`\`\`html',
                '<input type="number" ng-model="rating" ng-min="1" ng-max="5">',
                '\`\`\`'
            ].join('\\n')
        },
        {
            name: 'ng-pattern',
            detail: 'Set a regex pattern validation for an input',
            snippet: '"\\u0024{1:/^[a-zA-Z]+$/}"',
            description: [
                'Adds a \`pattern\` validator. The expression must evaluate to a RegExp',
                'or a string that will be parsed as a regex. Sets \`$error.pattern\`.',
                '',
                '**Arguments:**',
                '- \`ng-pattern\` *(RegExp|string expression)* — RegExp pattern, or an expression evaluating to a RegExp. The model value must match this pattern.',
                '',
                '**Example:**',
                '\`\`\`html',
                '<input ng-model="zip" ng-pattern="/^\\\\d{5}$/">',
                '\`\`\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngPattern)'
            ].join('\\n')
        },

        // ---- Event directives -----------------------------------------------
        {
            name: 'ng-click',
            detail: 'Handle click events',
            snippet: '"\\u0024{1:onClick()}"',
            description: [
                'Evaluates the expression when the element is clicked.',
                '',
                '**Arguments:**',
                '- \`ng-click\` *(expression)* — Expression to evaluate on click. \`$event\` is the DOM MouseEvent.',
                '',
                '**Example:**',
                '\`\`\`html',
                '<button ng-click="saveRecord()">Save</button>',
                '<button ng-click="item.confirmed = true">Confirm</button>',
                '\`\`\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngClick)'
            ].join('\\n')
        },
        {
            name: 'ng-dblclick',
            detail: 'Handle double-click events',
            snippet: '"\\u0024{1:onDoubleClick()}"',
            description: [
                'Evaluates the expression when the element receives a double-click.',
                '',
                '**Arguments:**',
                '- \`ng-dblclick\` *(expression)* — Expression to evaluate on double-click. \`$event\` is the DOM MouseEvent.',
                '',
                '**Example:** \`<div ng-dblclick="edit(item)">{{ item.name }}</div>\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngDblclick)'
            ].join('\\n')
        },
        {
            name: 'ng-submit',
            detail: 'Handle form submit event',
            snippet: '"\\u0024{1:onSubmit()}"',
            description: [
                'Binds an Angular expression to the \`submit\` event of a form.',
                'Prevents the default browser form submission.',
                '',
                '**Arguments:**',
                '- \`ng-submit\` *(expression)* — Expression to evaluate when the form is submitted.',
                '',
                '**Example:**',
                '\`\`\`html',
                '<form ng-submit="submitForm()">',
                '  <button type="submit">Send</button>',
                '</form>',
                '\`\`\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngSubmit)'
            ].join('\\n')
        },
        {
            name: 'ng-change',
            detail: 'Evaluate expression when input value changes',
            snippet: '"\\u0024{1:onChange()}"',
            description: [
                'Evaluates the expression whenever the bound \`ng-model\` value changes.',
                'Only fires after the model is updated (not on every keystroke).',
                '',
                '**Arguments:**',
                '- \`ng-change\` *(expression)* — Expression to evaluate when the model value changes due to user input.',
                '',
                '**Example:**',
                '\`\`\`html',
                '<select ng-model="choice" ng-change="onChoiceChanged()">',
                '\`\`\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngChange)'
            ].join('\\n')
        },
        {
            name: 'ng-focus',
            detail: 'Evaluate expression on element focus',
            snippet: '"\\u0024{1:onFocus()}"',
            description: [
                'Evaluates the expression when the element receives focus.',
                '',
                '**Arguments:**',
                '- \`ng-focus\` *(expression)* — Expression to evaluate when the element receives focus.',
                '',
                '**Example:** \`<input ng-model="x" ng-focus="active = true">\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngFocus)'
            ].join('\\n')
        },
        {
            name: 'ng-blur',
            detail: 'Evaluate expression when element loses focus',
            snippet: '"\\u0024{1:onBlur()}"',
            description: [
                'Evaluates the expression when the element loses focus.',
                '',
                '**Arguments:**',
                '- \`ng-blur\` *(expression)* — Expression to evaluate when the element loses focus.',
                '',
                '**Example:** \`<input ng-model="x" ng-blur="validate()">\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngBlur)'
            ].join('\\n')
        },
        {
            name: 'ng-keydown',
            detail: 'Evaluate expression on keydown',
            snippet: '"\\u0024{1:onKeyDown($event)}"',
            description: [
                'Evaluates the expression on \`keydown\`. The \`$event\` object is the',
                'browser KeyboardEvent.',
                '',
                '**Arguments:**',
                '- \`ng-keydown\` *(expression)* — Expression to evaluate on keydown. \`$event\` is the DOM KeyboardEvent.',
                '',
                '**Example:**',
                '\`\`\`html',
                '<input ng-keydown="$event.key === \\'Enter\\' && submit()">',
                '\`\`\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngKeydown)'
            ].join('\\n')
        },
        {
            name: 'ng-keyup',
            detail: 'Evaluate expression on keyup',
            snippet: '"\\u0024{1:onKeyUp($event)}"',
            description: [
                'Evaluates the expression on \`keyup\`.',
                '',
                '**Arguments:**',
                '- \`ng-keyup\` *(expression)* — Expression to evaluate on keyup. \`$event\` is the DOM KeyboardEvent.',
                '',
                '**Example:** \`<input ng-keyup="search(query)">\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngKeyup)'
            ].join('\\n')
        },
        {
            name: 'ng-keypress',
            detail: 'Evaluate expression on keypress',
            snippet: '"\\u0024{1:onKeyPress($event)}"',
            description: [
                'Evaluates the expression when a key is pressed while the element has focus.',
                '',
                '**Arguments:**',
                '- \`ng-keypress\` *(expression)* — Expression to evaluate on keypress. \`$event\` is the DOM KeyboardEvent.',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngKeypress)'
            ].join('\\n')
        },
        {
            name: 'ng-mousedown',
            detail: 'Evaluate expression on mousedown',
            snippet: '"\\u0024{1:onMouseDown($event)}"',
            description: [
                'Evaluates the expression when the mouse button is pressed over the element.',
                '',
                '**Arguments:**',
                '- \`ng-mousedown\` *(expression)* — Expression to evaluate on mousedown. \`$event\` is the DOM MouseEvent.',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngMousedown)'
            ].join('\\n')
        },
        {
            name: 'ng-mouseup',
            detail: 'Evaluate expression on mouseup',
            snippet: '"\\u0024{1:onMouseUp($event)}"',
            description: [
                'Evaluates the expression when the mouse button is released over the element.',
                '',
                '**Arguments:**',
                '- \`ng-mouseup\` *(expression)* — Expression to evaluate on mouseup. \`$event\` is the DOM MouseEvent.',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngMouseup)'
            ].join('\\n')
        },
        {
            name: 'ng-mouseover',
            detail: 'Evaluate expression on mouseover',
            snippet: '"\\u0024{1:onMouseOver()}"',
            description: [
                'Evaluates the expression when the pointer enters the element.',
                '',
                '**Arguments:**',
                '- \`ng-mouseover\` *(expression)* — Expression to evaluate on mouseover.',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngMouseover)'
            ].join('\\n')
        },
        {
            name: 'ng-mousemove',
            detail: 'Evaluate expression on mousemove',
            snippet: '"\\u0024{1:onMouseMove($event)}"',
            description: [
                'Evaluates the expression when the pointer moves over the element.',
                '',
                '**Arguments:**',
                '- \`ng-mousemove\` *(expression)* — Expression to evaluate on mousemove. \`$event\` is the DOM MouseEvent.',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngMousemove)'
            ].join('\\n')
        },
        {
            name: 'ng-mouseenter',
            detail: 'Evaluate expression on mouseenter (no bubbling)',
            snippet: '"\\u0024{1:onMouseEnter()}"',
            description: [
                'Evaluates the expression when the pointer enters the element. Does not bubble.',
                '',
                '**Arguments:**',
                '- \`ng-mouseenter\` *(expression)* — Expression to evaluate on mouseenter.',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngMouseenter)'
            ].join('\\n')
        },
        {
            name: 'ng-mouseleave',
            detail: 'Evaluate expression on mouseleave (no bubbling)',
            snippet: '"\\u0024{1:onMouseLeave()}"',
            description: [
                'Evaluates the expression when the pointer leaves the element. Does not bubble.',
                '',
                '**Arguments:**',
                '- \`ng-mouseleave\` *(expression)* — Expression to evaluate on mouseleave.',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngMouseleave)'
            ].join('\\n')
        },
        {
            name: 'ng-copy',
            detail: 'Evaluate expression on copy',
            snippet: '"\\u0024{1:onCopy($event)}"',
            description: [
                'Evaluates the expression when the user copies content from the element.',
                '',
                '**Arguments:**',
                '- \`ng-copy\` *(expression)* — Expression to evaluate on copy. \`$event\` is the DOM ClipboardEvent.',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngCopy)'
            ].join('\\n')
        },
        {
            name: 'ng-cut',
            detail: 'Evaluate expression on cut',
            snippet: '"\\u0024{1:onCut($event)}"',
            description: [
                'Evaluates the expression when the user cuts content from the element.',
                '',
                '**Arguments:**',
                '- \`ng-cut\` *(expression)* — Expression to evaluate on cut. \`$event\` is the DOM ClipboardEvent.',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngCut)'
            ].join('\\n')
        },
        {
            name: 'ng-paste',
            detail: 'Evaluate expression on paste',
            snippet: '"\\u0024{1:onPaste($event)}"',
            description: [
                'Evaluates the expression when the user pastes content into the element.',
                '',
                '**Arguments:**',
                '- \`ng-paste\` *(expression)* — Expression to evaluate on paste. \`$event\` is the DOM ClipboardEvent.',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngPaste)'
            ].join('\\n')
        },

        // ---- Misc -----------------------------------------------------------
        {
            name: 'ng-csp',
            detail: 'Enable Content Security Policy compatibility',
            snippet: '',
            description: [
                'Enables Content Security Policy (CSP) compatibility mode.',
                'Add to the \`<html>\` element when your CSP forbids \`eval()\`.',
                '',
                '**Arguments:** None — presence of the attribute activates CSP-compatible mode.',
                '',
                '**Example:** \`<html ng-csp>\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngCsp)'
            ].join('\\n')
        },
        {
            name: 'ng-jq',
            detail: 'Specify whether Angular uses jQuery or jqLite',
            snippet: '"\\u0024{1:}"',
            description: [
                'When present with an empty value, forces \`angular.element\` to use',
                'jqLite even if jQuery is present. When set to a jQuery variable name,',
                'forces use of that jQuery instance.',
                '',
                '**Arguments:**',
                '- \`ng-jq\` *(string, optional)* — Name of the variable under \`window\` that holds the jQuery library. Leave empty to force jqLite even when jQuery is present.',
                '',
                '**Example:** \`<html ng-jq>\`',
                '',
                '[AngularJS docs](https://docs.angularjs.org/api/ng/directive/ngJq)'
            ].join('\\n')
        },

        // ---- ServiceNow Service Portal Directives ---------------------------
        {
            name: 'sp-widget',
            detail: 'Embed a Service Portal widget',
            snippet: 'widget="\\u0024{1:widgetModel}"',
            description: [
                'Renders an embedded Service Portal widget.',
                'The model must be a widget model object obtained from \`$sp.getWidget()\`.',
                '',
                '**Arguments:**',
                '- \`widget\` *(object expression)* — A widget model object returned by \`$sp.getWidget(widgetId, options)\` in the server script. Required.',
                '',
                '**Example:**',
                '\`\`\`html',
                '<sp-widget widget="data.headerWidget"></sp-widget>',
                '\`\`\`',
                '',
                'In the server script, populate the model:',
                '\`\`\`javascript',
                'data.headerWidget = $sp.getWidget("widget-header", {});',
                '\`\`\`'
            ].join('\\n')
        },
        {
            name: 'sp-model',
            detail: 'Service Portal model binding helper',
            snippet: '"\\u0024{1:model}"',
            description: [
                'Service Portal model binding directive for SP form fields.',
                '',
                '**Arguments:**',
                '- \`sp-model\` *(expression)* — The scope model property to bind to the SP form field.'
            ].join('\\n')
        },
        {
            name: 'sp-log-stream',
            detail: 'Service Portal log stream directive',
            snippet: 'table="\\u0024{1:incident}" sys-id="\\u0024{2:{{ data.sys_id }}}"',
            description: [
                'Renders a live activity log stream for the specified record.',
                '',
                '**Arguments:**',
                '- \`table\` *(string expression)* — The table name of the record (e.g. \`"incident"\`). Required.',
                '- \`sys-id\` *(string expression)* — The \`sys_id\` of the record whose activity stream to display. Required.'
            ].join('\\n')
        },
        {
            name: 'sp-form',
            detail: 'Service Portal embedded record form',
            snippet: 'table="\\u0024{1:incident}" sys-id="\\u0024{2:{{ data.sys_id }}}" form-model="\\u0024{3:formModel}"',
            description: [
                'Renders a Service Portal form for the specified table and record.',
                '',
                '**Arguments:**',
                '- \`table\` *(string expression)* — The table name (e.g. \`"\\'incident\\'"\`). Required.',
                '- \`sys-id\` *(string expression)* — The \`sys_id\` of the record to display. Use \`""\` for a new record. Required.',
                '- \`form-model\` *(object expression)* — Scope variable to receive the form model object. Required.',
                '',
                '**Example:**',
                '\`\`\`html',
                '<sp-form table="\\'incident\\'" sys-id="data.sys_id" form-model="model"></sp-form>',
                '\`\`\`'
            ].join('\\n')
        },
        {
            name: 'sp-simple-list',
            detail: 'Service Portal simple list widget',
            snippet: 'table="\\u0024{1:sc_req_item}" query="\\u0024{2:active=true}"',
            description: [
                'Renders a simple list of records for the specified table and query.',
                '',
                '**Arguments:**',
                '- \`table\` *(string expression)* — The table name to query (e.g. \`"sc_req_item"\`). Required.',
                '- \`query\` *(string expression)* — Encoded query string to filter the list (e.g. \`"active=true"\`). Required.'
            ].join('\\n')
        }
    ];

    // Build a lookup map for fast hover resolution
    var DIRECTIVE_MAP = {};
    DIRECTIVES.forEach(function (d) { DIRECTIVE_MAP[d.name] = d; });

    // -------------------------------------------------------------------------
    // Standard HTML attributes — shown after AngularJS directives in completions
    // -------------------------------------------------------------------------
    var HTML_ATTRS = [
        // Global
        { name: 'id',               detail: 'Unique element identifier',              snippet: '"\\u0024{1}"' },
        { name: 'class',            detail: 'CSS class name(s)',                       snippet: '"\\u0024{1}"' },
        { name: 'style',            detail: 'Inline CSS styles',                       snippet: '"\\u0024{1}"' },
        { name: 'title',            detail: 'Tooltip / advisory text',                 snippet: '"\\u0024{1}"' },
        { name: 'tabindex',         detail: 'Tab focus order (-1 to remove)',          snippet: '"\\u0024{1:0}"' },
        { name: 'hidden',           detail: 'Hide element from rendering',             snippet: null },
        { name: 'lang',             detail: 'Language of element content',             snippet: '"\\u0024{1:en}"' },
        { name: 'dir',              detail: 'Text direction (ltr / rtl / auto)',       snippet: '"\\u0024{1:ltr}"' },
        { name: 'contenteditable',  detail: 'Make element editable',                  snippet: '"\\u0024{1:true}"' },
        { name: 'draggable',        detail: 'Enable drag-and-drop',                   snippet: '"\\u0024{1:true}"' },
        { name: 'spellcheck',       detail: 'Enable spell checking',                  snippet: '"\\u0024{1:true}"' },
        { name: 'translate',        detail: 'Mark content for translation (yes/no)',  snippet: '"\\u0024{1:yes}"' },
        // ARIA
        { name: 'role',             detail: 'ARIA landmark / widget role',             snippet: '"\\u0024{1}"' },
        { name: 'aria-label',       detail: 'Accessible name for element',            snippet: '"\\u0024{1}"' },
        { name: 'aria-labelledby',  detail: 'ID(s) of labelling element(s)',          snippet: '"\\u0024{1}"' },
        { name: 'aria-describedby', detail: 'ID(s) of describing element(s)',         snippet: '"\\u0024{1}"' },
        { name: 'aria-hidden',      detail: 'Hide from assistive technology',         snippet: '"\\u0024{1:true}"' },
        { name: 'aria-expanded',    detail: 'Expansion state of a collapsible',       snippet: '"\\u0024{1:false}"' },
        { name: 'aria-controls',    detail: 'ID of element this one controls',        snippet: '"\\u0024{1}"' },
        { name: 'aria-haspopup',    detail: 'Type of popup the element can trigger',  snippet: '"\\u0024{1:true}"' },
        { name: 'aria-live',        detail: 'Live region update behaviour',           snippet: '"\\u0024{1:polite}"' },
        { name: 'aria-atomic',      detail: 'Present live region as whole (true/false)', snippet: '"\\u0024{1:true}"' },
        { name: 'aria-busy',        detail: 'Element is being updated',               snippet: '"\\u0024{1:true}"' },
        { name: 'aria-disabled',    detail: 'Element is perceivable but disabled',    snippet: '"\\u0024{1:true}"' },
        { name: 'aria-required',    detail: 'User input is required',                 snippet: '"\\u0024{1:true}"' },
        { name: 'aria-readonly',    detail: 'Value is not editable',                  snippet: '"\\u0024{1:true}"' },
        { name: 'aria-selected',    detail: 'Selection state',                        snippet: '"\\u0024{1:true}"' },
        { name: 'aria-checked',     detail: 'Checked state (true/false/mixed)',       snippet: '"\\u0024{1:true}"' },
        { name: 'aria-valuenow',    detail: 'Current numeric value',                  snippet: '"\\u0024{1}"' },
        { name: 'aria-valuemin',    detail: 'Minimum numeric value',                  snippet: '"\\u0024{1}"' },
        { name: 'aria-valuemax',    detail: 'Maximum numeric value',                  snippet: '"\\u0024{1}"' },
        { name: 'aria-valuetext',   detail: 'Human-readable value',                   snippet: '"\\u0024{1}"' },
        { name: 'aria-orientation', detail: 'Orientation (horizontal / vertical)',    snippet: '"\\u0024{1:vertical}"' },
        { name: 'aria-level',       detail: 'Hierarchical level (e.g. heading)',      snippet: '"\\u0024{1:1}"' },
        { name: 'aria-setsize',     detail: 'Number of items in a set',               snippet: '"\\u0024{1}"' },
        { name: 'aria-posinset',    detail: 'Position within a set',                  snippet: '"\\u0024{1}"' },
        { name: 'aria-multiselectable', detail: 'Multiple items can be selected',    snippet: '"\\u0024{1:true}"' },
        { name: 'aria-modal',       detail: 'Element is a modal dialog',              snippet: '"\\u0024{1:true}"' },
        { name: 'aria-owns',        detail: 'ID(s) of owned elements',                snippet: '"\\u0024{1}"' },
        { name: 'aria-sort',        detail: 'Column sort direction',                  snippet: '"\\u0024{1:ascending}"' },
        // Links / navigation
        { name: 'href',             detail: 'Hyperlink URL',                           snippet: '"\\u0024{1}"' },
        { name: 'target',           detail: 'Link browsing context (_blank, _self…)', snippet: '"\\u0024{1:_blank}"' },
        { name: 'rel',              detail: 'Relationship to linked resource',         snippet: '"\\u0024{1}"' },
        { name: 'hreflang',         detail: 'Language of linked resource',             snippet: '"\\u0024{1:en}"' },
        { name: 'download',         detail: 'Download resource instead of navigate',  snippet: '"\\u0024{1}"' },
        // Media
        { name: 'src',              detail: 'Resource URL',                            snippet: '"\\u0024{1}"' },
        { name: 'alt',              detail: 'Alternative text for images',             snippet: '"\\u0024{1}"' },
        { name: 'width',            detail: 'Width in pixels or %',                    snippet: '"\\u0024{1}"' },
        { name: 'height',           detail: 'Height in pixels or %',                   snippet: '"\\u0024{1}"' },
        { name: 'srcset',           detail: 'Responsive image source set',             snippet: '"\\u0024{1}"' },
        { name: 'sizes',            detail: 'Responsive image size hints',             snippet: '"\\u0024{1}"' },
        { name: 'loading',          detail: 'Load timing hint (lazy / eager)',         snippet: '"\\u0024{1:lazy}"' },
        { name: 'crossorigin',      detail: 'CORS policy (anonymous / use-credentials)', snippet: '"\\u0024{1:anonymous}"' },
        { name: 'ismap',            detail: 'Image is a server-side image map',       snippet: null },
        { name: 'usemap',           detail: 'Client-side image map reference',        snippet: '"\\u0024{1:#mapname}"' },
        // Form / input
        { name: 'type',             detail: 'Element type (text, button, submit…)',   snippet: '"\\u0024{1:text}"' },
        { name: 'name',             detail: 'Form field name',                         snippet: '"\\u0024{1}"' },
        { name: 'value',            detail: 'Element value',                           snippet: '"\\u0024{1}"' },
        { name: 'placeholder',      detail: 'Input hint text',                         snippet: '"\\u0024{1}"' },
        { name: 'required',         detail: 'Field must be filled before submit',     snippet: null },
        { name: 'disabled',         detail: 'Disable element interaction',            snippet: null },
        { name: 'checked',          detail: 'Pre-checked checkbox / radio',           snippet: null },
        { name: 'readonly',         detail: 'Value visible but not editable',         snippet: null },
        { name: 'selected',         detail: 'Pre-selected option in select',          snippet: null },
        { name: 'multiple',         detail: 'Allow multiple values / files',          snippet: null },
        { name: 'for',              detail: 'Associates label with input ID',         snippet: '"\\u0024{1}"' },
        { name: 'action',           detail: 'Form submission URL',                     snippet: '"\\u0024{1}"' },
        { name: 'method',           detail: 'HTTP method for form submission',        snippet: '"\\u0024{1:POST}"' },
        { name: 'enctype',          detail: 'Form data encoding type',                snippet: '"\\u0024{1:multipart/form-data}"' },
        { name: 'autocomplete',     detail: 'Browser autofill hint (on / off)',       snippet: '"\\u0024{1:off}"' },
        { name: 'autofocus',        detail: 'Automatically focus on page load',       snippet: null },
        { name: 'pattern',          detail: 'Input validation regex pattern',         snippet: '"\\u0024{1}"' },
        { name: 'min',              detail: 'Minimum value for numeric/date input',   snippet: '"\\u0024{1}"' },
        { name: 'max',              detail: 'Maximum value for numeric/date input',   snippet: '"\\u0024{1}"' },
        { name: 'step',             detail: 'Step interval for numeric input',        snippet: '"\\u0024{1:1}"' },
        { name: 'minlength',        detail: 'Minimum character count',                snippet: '"\\u0024{1}"' },
        { name: 'maxlength',        detail: 'Maximum character count',                snippet: '"\\u0024{1}"' },
        { name: 'size',             detail: 'Visible width in characters',            snippet: '"\\u0024{1}"' },
        { name: 'accept',           detail: 'Accepted MIME types or extensions',      snippet: '"\\u0024{1}"' },
        { name: 'capture',          detail: 'Camera/mic capture hint (user / environment)', snippet: '"\\u0024{1:user}"' },
        { name: 'list',             detail: 'ID of <datalist> to use',                snippet: '"\\u0024{1}"' },
        { name: 'novalidate',       detail: 'Skip browser validation on submit',      snippet: null },
        // Table
        { name: 'colspan',          detail: 'Number of columns to span',              snippet: '"\\u0024{1:2}"' },
        { name: 'rowspan',          detail: 'Number of rows to span',                 snippet: '"\\u0024{1:2}"' },
        { name: 'scope',            detail: 'Header cell scope (col / row / colgroup / rowgroup)', snippet: '"\\u0024{1:col}"' },
        { name: 'headers',          detail: 'IDs of associated header cells',         snippet: '"\\u0024{1}"' },
        { name: 'abbr',             detail: 'Abbreviated label for header cell',      snippet: '"\\u0024{1}"' },
        // Script / link metadata
        { name: 'async',            detail: 'Load script asynchronously',             snippet: null },
        { name: 'defer',            detail: 'Defer script until document parsed',     snippet: null },
        { name: 'charset',          detail: 'Character encoding',                     snippet: '"\\u0024{1:UTF-8}"' },
        { name: 'integrity',        detail: 'Subresource integrity hash',             snippet: '"\\u0024{1}"' },
        { name: 'media',            detail: 'Applicable media query',                 snippet: '"\\u0024{1}"' },
    ];

    /* HTML elements that have no closing tag */
    var VOID_ELEMENTS = {
        area: 1, base: 1, br: 1, col: 1, embed: 1, hr: 1, img: 1,
        input: 1, link: 1, meta: 1, param: 1, source: 1, track: 1, wbr: 1
    };

    /* Elements whose inner content must be preserved verbatim by the formatter */
    var PRESERVE_CONTENT = { script: 1, style: 1, pre: 1, textarea: 1 };

    /*
     * Inline (phrasing) elements.  The formatter must NOT insert newlines
     * around these because doing so can introduce visible whitespace that
     * changes rendering.  Text and inline tags are kept on the same line.
     */
    var INLINE_ELEMENTS = {
        a: 1, abbr: 1, acronym: 1, b: 1, bdi: 1, bdo: 1, big: 1,
        button: 1, cite: 1, code: 1, data: 1, del: 1, dfn: 1, em: 1,
        i: 1, ins: 1, kbd: 1, label: 1, mark: 1, map: 1, object: 1,
        output: 1, q: 1, ruby: 1, s: 1, samp: 1, small: 1, span: 1,
        strong: 1, sub: 1, sup: 1, time: 1, tt: 1, u: 1, var: 1
    };

    // -------------------------------------------------------------------------
    // Monarch tokenizer — HTML + Angular extensions
    //
    // Based on Monaco's built-in HTML tokenizer with:
    //   1. {{ }} interpolation highlighted in root state AND inside attribute values
    //   2. ng-* and data-* attribute names highlighted as 'attribute.name.ng'
    //   3. sp-* attribute names highlighted as 'attribute.name.sp'
    //   4. Embedded JavaScript (<script>) and CSS (<style>) preserved
    // -------------------------------------------------------------------------
    var TOKENIZER = {
        defaultToken: '',
        tokenPostfix: '.html',
        ignoreCase: true,

        tokenizer: {

            // Root: text content + tags
            root: [
                // Angular {{ }} interpolation in text
                [/\\{\\{/, { token: 'ng.delimiter', next: '@ngExpr' }],

                // DOCTYPE
                [/<!DOCTYPE/, 'metatag', '@doctype'],

                // HTML comments
                [/<!--/, 'comment', '@comment'],

                // Self-closing void-element shorthand (rare in HTML5 but valid in templates)
                [/(<)((?:[\\w-]+:)?[\\w-]+)(\\s*)(\\/>)/,
                    ['delimiter.html', 'tag.html', '', 'delimiter.html']],

                // <script> with embedded JS
                [/(<)(script)(?=[\\s>])/i,
                    ['delimiter.html', { token: 'tag.html', next: '@script' }]],

                // <style> with embedded CSS
                [/(<)(style)(?=[\\s>])/i,
                    ['delimiter.html', { token: 'tag.html', next: '@style' }]],

                // Opening tags
                [/(<)((?:[\\w-]+:)?[\\w-]+)/,
                    ['delimiter.html', { token: 'tag.html', next: '@otherTag' }]],

                // Closing tags
                [/(<\\/)((?:[\\w-]+:)?[\\w-]+)/,
                    ['delimiter.html', { token: 'tag.html', next: '@otherTag' }]],

                // Lone < delimiter
                [/</, 'delimiter.html'],

                // Text content — stop at < and { so interpolation above can fire
                [/[^<{]+/, ''],
                [/[{]/, '']
            ],

            // ---- Angular expression inside {{ }} ----------------------------
            ngExpr: [
                [/\\}\\}/, { token: 'ng.delimiter', next: '@pop' }],
                // Pipe operator (filter separator) — keep as expression
                [/[^|}]+/, 'ng.expression'],
                [/[|]/, 'ng.expression'],
                [/}(?!\\})/, 'ng.expression']
            ],

            // ---- DOCTYPE ----------------------------------------------------
            doctype: [
                [/[^>]+/, 'metatag.content'],
                [/>/, 'metatag', '@pop']
            ],

            // ---- Comments ---------------------------------------------------
            comment: [
                [/-->/, 'comment', '@pop'],
                [/[^-]+/, 'comment.content'],
                [/./, 'comment.content']
            ],

            // ---- Generic tags (all tags except script/style) ----------------
            otherTag: [
                [/\\/?>/, 'delimiter.html', '@pop'],

                // Double-quoted attribute value
                [/"/, { token: 'attribute.value', next: '@attrValDq' }],
                // Single-quoted attribute value
                [/'/, { token: 'attribute.value', next: '@attrValSq' }],

                // data-* / data-ng-* / ng-* attribute → Angular directive or custom data
                [/(?:data-)?ng-[\\w-]+/, 'attribute.name.ng'],
                [/data-[\\w-]+/, 'attribute.name.ng'],
                // sp-* ServiceNow SP attribute
                [/sp-[\\w-]+/, 'attribute.name.sp'],
                // Regular attribute name
                [/[\\w-:]+/, 'attribute.name'],

                [/=/, 'delimiter'],
                [/[ \\t\\r\\n]+/]
            ],

            // ---- Attribute values with possible {{ }} -----------------------
            attrValDq: [
                [/\\{\\{/, { token: 'ng.delimiter', next: '@ngExpr' }],
                [/[^"{}]+/, 'attribute.value'],
                [/[{}]/, 'attribute.value'],
                [/"/, { token: 'attribute.value', next: '@pop' }]
            ],
            attrValSq: [
                [/\\{\\{/, { token: 'ng.delimiter', next: '@ngExpr' }],
                [/[^'{}]+/, 'attribute.value'],
                [/[{}]/, 'attribute.value'],
                [/'/, { token: 'attribute.value', next: '@pop' }]
            ],

            // ---- <script> state with embedded JavaScript --------------------
            script: [
                [/type/, 'attribute.name', '@scriptAfterType'],
                [/"([^"]*)"/, 'attribute.value'],
                [/'([^']*)'/, 'attribute.value'],
                [/[\\w-]+/, 'attribute.name'],
                [/=/, 'delimiter'],
                [/>/, { token: 'delimiter.html', next: '@scriptEmbedded', nextEmbedded: 'text/javascript' }],
                [/[ \\t\\r\\n]+/],
                [/(<\\/)(script\\s*)(>)/, ['delimiter.html', 'tag.html', { token: 'delimiter.html', next: '@pop' }]]
            ],
            scriptAfterType: [
                [/=/, 'delimiter', '@scriptAfterTypeEquals'],
                [/>/, { token: 'delimiter.html', next: '@scriptEmbedded', nextEmbedded: 'text/javascript' }],
                [/[ \\t\\r\\n]+/],
                [/<\\/script\\s*>/, { token: '@rematch', next: '@pop' }]
            ],
            scriptAfterTypeEquals: [
                [/"([^"]*)"/, { token: 'attribute.value', switchTo: '@scriptWithCustomType.$1' }],
                [/'([^']*)'/, { token: 'attribute.value', switchTo: '@scriptWithCustomType.$1' }],
                [/>/, { token: 'delimiter.html', next: '@scriptEmbedded', nextEmbedded: 'text/javascript' }],
                [/[ \\t\\r\\n]+/],
                [/<\\/script\\s*>/, { token: '@rematch', next: '@pop' }]
            ],
            scriptWithCustomType: [
                [/>/, { token: 'delimiter.html', next: '@scriptEmbedded', nextEmbedded: '$S2' }],
                [/"([^"]*)"/, 'attribute.value'],
                [/'([^']*)'/, 'attribute.value'],
                [/[\\w-]+/, 'attribute.name'],
                [/=/, 'delimiter'],
                [/[ \\t\\r\\n]+/],
                [/<\\/script\\s*>/, { token: '@rematch', next: '@pop' }]
            ],
            scriptEmbedded: [
                [/<\\/script/, { token: '@rematch', next: '@pop', nextEmbedded: '@pop' }],
                [/[^<]+/, '']
            ],

            // ---- <style> state with embedded CSS ----------------------------
            style: [
                [/type/, 'attribute.name', '@styleAfterType'],
                [/"([^"]*)"/, 'attribute.value'],
                [/'([^']*)'/, 'attribute.value'],
                [/[\\w-]+/, 'attribute.name'],
                [/=/, 'delimiter'],
                [/>/, { token: 'delimiter.html', next: '@styleEmbedded', nextEmbedded: 'text/css' }],
                [/[ \\t\\r\\n]+/],
                [/(<\\/)(style\\s*)(>)/, ['delimiter.html', 'tag.html', { token: 'delimiter.html', next: '@pop' }]]
            ],
            styleAfterType: [
                [/=/, 'delimiter', '@styleAfterTypeEquals'],
                [/>/, { token: 'delimiter.html', next: '@styleEmbedded', nextEmbedded: 'text/css' }],
                [/[ \\t\\r\\n]+/],
                [/<\\/style\\s*>/, { token: '@rematch', next: '@pop' }]
            ],
            styleAfterTypeEquals: [
                [/"([^"]*)"/, { token: 'attribute.value', switchTo: '@styleWithCustomType.$1' }],
                [/'([^']*)'/, { token: 'attribute.value', switchTo: '@styleWithCustomType.$1' }],
                [/>/, { token: 'delimiter.html', next: '@styleEmbedded', nextEmbedded: 'text/css' }],
                [/[ \\t\\r\\n]+/],
                [/<\\/style\\s*>/, { token: '@rematch', next: '@pop' }]
            ],
            styleWithCustomType: [
                [/>/, { token: 'delimiter.html', next: '@styleEmbedded', nextEmbedded: '$S2' }],
                [/"([^"]*)"/, 'attribute.value'],
                [/'([^']*)'/, 'attribute.value'],
                [/[\\w-]+/, 'attribute.name'],
                [/=/, 'delimiter'],
                [/[ \\t\\r\\n]+/],
                [/<\\/style\\s*>/, { token: '@rematch', next: '@pop' }]
            ],
            styleEmbedded: [
                [/<\\/style/, { token: '@rematch', next: '@pop', nextEmbedded: '@pop' }],
                [/[^<]+/, '']
            ]
        }
    };

    // -------------------------------------------------------------------------
    // Helpers — completion and hover context detection
    // -------------------------------------------------------------------------

    // Returns true when the cursor is in an HTML tag's attribute zone
    // (i.e., after the tag name but before the closing > or />).
    function _isInTagAttributes(model, position) {
        var text = model.getValueInRange({
            startLineNumber: 1, startColumn: 1,
            endLineNumber: position.lineNumber, endColumn: position.column
        });
        var lastLt = text.lastIndexOf('<');
        var lastGt = text.lastIndexOf('>');
        if (lastLt === -1 || lastGt > lastLt) {
            return false;
        }
        // Check we're inside a comment
        var lastCommentOpen  = text.lastIndexOf('<!--');
        var lastCommentClose = text.lastIndexOf('-->');
        if (lastCommentOpen > lastCommentClose) {
            return false;
        }
        // Check we're past the tag name (there must be whitespace after the name)
        var afterLt = text.substring(lastLt);
        if (!/^<\\/?\\s*[\\w:-]+\\s/.test(afterLt)) {
            return false;
        }
        // Check we're not inside a quoted attribute value
        var insideDq = (afterLt.split('"').length - 1) % 2 !== 0;
        var insideSq = (afterLt.split("'").length - 1) % 2 !== 0;
        return !insideDq && !insideSq;
    }

    // Build a Monaco CompletionItem for a directive
    function _toCompletion(directive, range, monaco) {
        var insertText = directive.snippet
            ? directive.name + '=' + directive.snippet
            : directive.name;
        return {
            label:           directive.name,
            kind:            monaco.languages.CompletionItemKind.Property,
            detail:          directive.detail,
            documentation:   { value: directive.description, isTrusted: true },
            insertText:      insertText,
            insertTextRules: directive.snippet
                ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                : 0,
            range:           range
        };
    }

    // -------------------------------------------------------------------------
    // HTML Validation — mismatched / unclosed tag diagnostics
    //
    // Runs on every HTML model content change (debounced).  Walks a tag stack
    // and reports errors/warnings via monaco.editor.setModelMarkers using the
    // shared 'LINT_MARKER' owner so the Widget Editor status-bar picks them up.
    // -------------------------------------------------------------------------

    var _htmlValidationEnabled = true;
    var _htmlAutoCloseTagsEnabled = true;
    var _htmlValidationTimers = {};
    var _htmlTrackedModels = []; /* { model, monacoRef } — for re-validation on toggle */

    function _scheduleHtmlValidation(model, monacoRef) {
        var id = model.uri.toString();
        clearTimeout(_htmlValidationTimers[id]);

        if (!_htmlValidationEnabled) {
            /* Validation disabled — clear any existing markers */
            if (!model.isDisposed()) {
                monacoRef.editor.setModelMarkers(model, 'LINT_MARKER', []);
            }
            return;
        }

        _htmlValidationTimers[id] = setTimeout(function () {
            if (!model.isDisposed()) {
                _validateHtml(model, monacoRef);
            }
        }, 500);
    }

    function _validateHtml(model, monacoRef) {
        var text = model.getValue();
        var markers = [];
        var stack = [];

        /*
         * Regex alternation order (first match wins):
         *   1. {{ \\u2026 }}  Angular expressions  \\u2192 skip
         *   2. <!-- \\u2026 --> comments             \\u2192 skip
         *   3. </tag>       closing tags           \\u2192 capture group 1
         *   4. <tag \\u2026>    opening tags           \\u2192 capture group 2; self-close = group 4
         *
         * Quoted attribute values ("\\u2026" / '\\u2026') are consumed atomically so
         * that > inside attribute values (e.g. ng-if="x > 0") never breaks the match.
         */
        var re = /\\{\\{[\\s\\S]*?\\}\\}|<!--[\\s\\S]*?(?:-->|$)|<\\/([\\w:-]+)\\s*>|<([\\w:-]+)((?:[^"'>]|"[^"]*"|'[^']*')*?)(\\/?)\\s*>/g;
        var match;

        while ((match = re.exec(text)) !== null) {
            var closingName = match[1];
            var openingName = match[2];

            /* Skip comments and {{ }} expressions (no capture groups set) */
            if (!closingName && !openingName) {
                continue;
            }

            if (openingName) {
                var lower = openingName.toLowerCase();
                var isSelfClose = match[4] === '/';

                if (VOID_ELEMENTS[lower] || isSelfClose) {
                    continue;
                }

                /* Skip past <script>\\u2026</script> and <style>\\u2026</style> content */
                if (lower === 'script' || lower === 'style') {
                    var closePattern = new RegExp('</' + lower + '\\\\s*>', 'i');
                    var rest = text.substring(re.lastIndex);
                    var closeMatch = closePattern.exec(rest);
                    if (closeMatch) {
                        re.lastIndex += closeMatch.index + closeMatch[0].length;
                    }
                    continue;
                }

                var startPos = model.getPositionAt(match.index);
                var nameEnd  = model.getPositionAt(match.index + 1 + openingName.length);

                stack.push({
                    tag: lower,
                    original: openingName,
                    startLine: startPos.lineNumber,
                    startCol:  startPos.column,
                    endLine:   nameEnd.lineNumber,
                    endCol:    nameEnd.column
                });
            } else {
                /* Closing tag */
                var lower = closingName.toLowerCase();
                if (VOID_ELEMENTS[lower]) {
                    continue;
                }

                /* Search the stack (top-down) for a matching opener */
                var found = -1;
                for (var j = stack.length - 1; j >= 0; j--) {
                    if (stack[j].tag === lower) {
                        found = j;
                        break;
                    }
                }

                if (found === -1) {
                    /* No matching opener at all */
                    var sPos = model.getPositionAt(match.index);
                    var ePos = model.getPositionAt(match.index + match[0].length);
                    markers.push({
                        severity: monacoRef.MarkerSeverity.Error,
                        message: 'Closing </' + closingName + '> has no matching opening tag.',
                        startLineNumber: sPos.lineNumber,
                        startColumn:     sPos.column,
                        endLineNumber:   ePos.lineNumber,
                        endColumn:       ePos.column
                    });
                } else if (found === stack.length - 1) {
                    /* Perfect match \\u2014 just pop */
                    stack.pop();
                } else {
                    /* Mismatch \\u2014 tags between found+1..top are unclosed */
                    var closePos = model.getPositionAt(match.index);
                    for (var j = stack.length - 1; j > found; j--) {
                        var u = stack[j];
                        markers.push({
                            severity: monacoRef.MarkerSeverity.Warning,
                            message: 'Unclosed <' + u.original + '> \\u2014 expected closing tag before </' + closingName + '> at line ' + closePos.lineNumber + '.',
                            startLineNumber: u.startLine,
                            startColumn:     u.startCol,
                            endLineNumber:   u.endLine,
                            endColumn:       u.endCol
                        });
                    }
                    stack.splice(found);
                }
            }
        }

        /* Any tags still on the stack are unclosed */
        for (var j = 0; j < stack.length; j++) {
            var e = stack[j];
            markers.push({
                severity: monacoRef.MarkerSeverity.Warning,
                message: 'Unclosed <' + e.original + '> tag \\u2014 no matching closing tag found.',
                startLineNumber: e.startLine,
                startColumn:     e.startCol,
                endLineNumber:   e.endLine,
                endColumn:       e.endCol
            });
        }

        monacoRef.editor.setModelMarkers(model, 'LINT_MARKER', markers);
    }

    /* HTML Formatting — DocumentFormattingEditProvider for 'html'. */

    function _makeIndent(level, tab) {
        var s = '';
        for (var i = 0; i < level; i++) s += tab;
        return s;
    }

    /* Continuation pad is always spaces — tabs only when the indent itself
       is tabs (i.e. user disabled convert-tabs-to-spaces). */
    function _formatTagLine(tok, indent, tab, tabSize) {
        var raw = tok.value;
        var indentStr = _makeIndent(indent, tab);
        if (raw.indexOf('\\n') === -1) {
            return indentStr + raw.replace(/\\s+/g, ' ').trim();
        }
        var rawLines = raw.split(/\\r?\\n/);
        var clean = [];
        for (var p = 0; p < rawLines.length; p++) {
            var piece = rawLines[p].replace(/[ \\t]+/g, ' ').trim();
            if (piece) clean.push(piece);
        }
        if (clean.length <= 1) {
            return indentStr + clean.join(' ');
        }
        var firstLine = clean[0];
        var spaceIdx = firstLine.indexOf(' ');
        if (spaceIdx === -1) {
            /* No attribute on first line — merge the first attr up so the
               tag name always has at least one attribute beside it. */
            spaceIdx = firstLine.length;
            firstLine = firstLine + ' ' + clean[1];
            clean = [firstLine].concat(clean.slice(2));
        }
        if (clean.length <= 1) {
            return indentStr + firstLine;
        }
        var indentWidth = tab === '\\t' ? indent * tabSize : indentStr.length;
        var padLen = indentWidth + spaceIdx + 1;
        var pad = '';
        for (var q = 0; q < padLen; q++) pad += ' ';
        var out = indentStr + firstLine;
        for (var k = 1; k < clean.length; k++) {
            out += '\\n' + pad + clean[k];
        }
        return out;
    }

    function _tokenizeHtmlForFormat(text) {
        var tokens = [];
        var i = 0;
        var len = text.length;

        while (i < len) {
            /* Track whether whitespace preceded this token (needed to
               preserve significant spaces between inline elements),
               whether it contained a newline (content was on a new line),
               and whether it contained a blank line (2+ newlines — the
               user intentionally added vertical spacing). */
            var hadSpace = false;
            var newlineCount = 0;
            while (i < len && /[ \\t\\r\\n]/.test(text[i])) {
                if (text[i] === '\\n') newlineCount++;
                i++;
                hadSpace = true;
            }
            var hadNewline = newlineCount >= 1;
            var hadBlankLine = newlineCount >= 2;
            if (i >= len) break;

            if (text.substr(i, 4) === '<!--') {
                /* HTML comment */
                var cEnd = text.indexOf('-->', i + 4);
                cEnd = cEnd === -1 ? len : cEnd + 3;
                tokens.push({ type: 'comment', value: text.substring(i, cEnd), hadSpace: hadSpace, hadNewline: hadNewline, hadBlankLine: hadBlankLine });
                i = cEnd;

            } else if (text[i] === '<' && i + 1 < len &&
                       (text[i + 1] === '/' || /[a-zA-Z]/.test(text[i + 1]))) {
                /* HTML tag \\u2014 scan to closing > respecting quoted attributes */
                var tagStart = i;
                i++;
                while (i < len && text[i] !== '>') {
                    if (text[i] === '"')      { i++; while (i < len && text[i] !== '"') i++; }
                    else if (text[i] === "'") { i++; while (i < len && text[i] !== "'") i++; }
                    i++;
                }
                if (i < len) i++; /* skip closing > */

                var tagStr = text.substring(tagStart, i);
                var isClosing   = tagStr.length > 1 && tagStr[1] === '/';
                var isSelfClose = !isClosing && tagStr.length > 2 && tagStr.charAt(tagStr.length - 2) === '/';
                var nameMatch   = isClosing
                    ? tagStr.match(/^<\\/([\\w:-]+)/)
                    : tagStr.match(/^<([\\w:-]+)/);
                var tagName = nameMatch ? nameMatch[1].toLowerCase() : '';
                var isVoid  = !!VOID_ELEMENTS[tagName];

                tokens.push({
                    type:          'tag',
                    value:         tagStr,
                    tagName:       tagName,
                    isClosing:     isClosing,
                    isSelfClosing: isSelfClose || (isVoid && !isClosing),
                    hadSpace:      hadSpace,
                    hadNewline:    hadNewline,
                    hadBlankLine:  hadBlankLine
                });

                /* Preserve raw content for script / style / pre / textarea */
                if (!isClosing && !isSelfClose && PRESERVE_CONTENT[tagName]) {
                    var closeTag = '</' + tagName;
                    var closeIdx = text.toLowerCase().indexOf(closeTag, i);
                    if (closeIdx !== -1) {
                        tokens.push({
                            type: 'preserved', value: text.substring(i, closeIdx),
                            tagName: tagName, hadSpace: false
                        });
                        i = closeIdx;
                    }
                }

            } else {
                var textStart = i;
                while (i < len &&
                       !(text[i] === '<' && i + 1 < len &&
                         (text[i + 1] === '/' || text[i + 1] === '!' ||
                          /[a-zA-Z]/.test(text[i + 1])))) {
                    i++;
                }
                /* Back up past trailing whitespace so the outer loop can see
                   any trailing newline and set hadNewline on the next token. */
                var textEnd = i;
                while (textEnd > textStart && /[ \\t\\r\\n]/.test(text[textEnd - 1])) {
                    textEnd--;
                }
                i = textEnd;
                var rawTxt = text.substring(textStart, textEnd);
                if (!rawTxt) { continue; }

                if (rawTxt.indexOf('\\n') === -1) {
                    tokens.push({ type: 'text', value: rawTxt.replace(/[ \\t]+/g, ' '), hadSpace: hadSpace, hadNewline: hadNewline, hadBlankLine: hadBlankLine });
                } else {
                    var lineArr = rawTxt.split(/\\r?\\n/);
                    var firstEmitted = false;
                    var blankAccum = 0;
                    for (var li = 0; li < lineArr.length; li++) {
                        var piece = lineArr[li].replace(/[ \\t]+/g, ' ').trim();
                        if (!piece) {
                            if (firstEmitted) blankAccum++;
                            continue;
                        }
                        tokens.push({
                            type: 'text',
                            value: piece,
                            hadSpace:     firstEmitted ? true : hadSpace,
                            hadNewline:   firstEmitted ? true : hadNewline,
                            hadBlankLine: firstEmitted ? (blankAccum > 0) : hadBlankLine
                        });
                        firstEmitted = true;
                        blankAccum = 0;
                    }
                }
            }
        }

        return tokens;
    }

    function _formatHtml(text, options) {
        if (!text || !text.trim()) {
            return text;
        }

        var tabSize = (options && options.tabSize) || 4;
        var useTabs = options && options.insertSpaces === false;
        var tab      = useTabs ? '\\t' : new Array(tabSize + 1).join(' ');
        var expandWs = new Array(tabSize + 1).join(' '); /* for tab-normalisation */
        var tokens   = _tokenizeHtmlForFormat(text);
        var lines    = [];
        var indent   = 0;

        var inlineStack  = [];
        var blockFrames  = [];

        var inlineBuf = '';

        function flushInline() {
            if (inlineBuf) {
                lines.push(_makeIndent(indent, tab) + inlineBuf);
                inlineBuf = '';
            }
        }

        function appendInline(value, hadSpace, hadNewline, hadBlankLine) {
            if (hadNewline && inlineBuf) {
                lines.push(_makeIndent(indent, tab) + inlineBuf);
                inlineBuf = '';
                if (hadBlankLine) { lines.push(''); }
            }
            if (inlineBuf && hadSpace) {
                inlineBuf += ' ';
            }
            inlineBuf += value;
        }

        function tryBlockCollapse(startIdx) {
            var openTok = tokens[startIdx];
            if (openTok.value.indexOf('\\n') !== -1) { return null; }
            var content = openTok.value.replace(/\\s+/g, ' ').trim();
            var idx = startIdx + 1;
            var hasText = false;

            while (idx < tokens.length) {
                var tk = tokens[idx];

                if (tk.hadNewline) { return null; }

                if (tk.type === 'tag' && tk.isClosing && tk.tagName === openTok.tagName) {
                    if (!hasText && idx !== startIdx + 1) { return null; }
                    content += tk.value.replace(/\\s+/g, ' ').trim();
                    if (content.length <= 100) {
                        return { line: _makeIndent(indent, tab) + content, endIndex: idx };
                    }
                    return null;
                }
                if (tk.type === 'tag' && !tk.isSelfClosing &&
                    !INLINE_ELEMENTS[tk.tagName] && !VOID_ELEMENTS[tk.tagName]) {
                    return null;
                }
                if (tk.type === 'tag' && tk.value.indexOf('\\n') !== -1) {
                    return null;
                }
                if (tk.type === 'preserved') {
                    return null;
                }
                if (tk.type === 'text') { hasText = true; }

                if (tk.hadSpace && content) { content += ' '; }
                content += (tk.type === 'tag')
                    ? tk.value.replace(/\\s+/g, ' ').trim()
                    : tk.value;
                idx++;
            }
            return null;
        }

        for (var t = 0; t < tokens.length; t++) {
            var tok = tokens[t];

            if (tok.type === 'tag') {
                var isInline = !!INLINE_ELEMENTS[tok.tagName];

                if (isInline && !tok.isSelfClosing && !tok.isClosing) {
                    var next = tokens[t + 1];
                    var multilineAttrs = tok.value.indexOf('\\n') !== -1;
                    var blockLike = (next && next.hadNewline) || multilineAttrs;
                    if (blockLike) {
                        if (inlineBuf) { flushInline(); }
                        if (tok.hadBlankLine && lines.length) { lines.push(''); }
                        lines.push(_formatTagLine(tok, indent, tab, tabSize));
                        inlineStack.push({ name: tok.tagName, indented: true });
                        indent++;
                    } else {
                        inlineStack.push({ name: tok.tagName, indented: false });
                        appendInline(tok.value.replace(/\\s+/g, ' ').trim(), tok.hadSpace, tok.hadNewline, tok.hadBlankLine);
                    }

                } else if (isInline && tok.isClosing &&
                           inlineStack.length > 0 &&
                           inlineStack[inlineStack.length - 1].name === tok.tagName) {
                    var frame = inlineStack.pop();
                    if (frame.indented) {
                        flushInline();
                        if (tok.hadBlankLine && lines.length) { lines.push(''); }
                        indent = Math.max(0, indent - 1);
                        lines.push(_formatTagLine(tok, indent, tab, tabSize));
                    } else {
                        appendInline(tok.value.replace(/\\s+/g, ' ').trim(), tok.hadSpace, tok.hadNewline, tok.hadBlankLine);
                    }

                } else if (isInline || tok.isSelfClosing) {
                    if (tok.value.indexOf('\\n') !== -1) {
                        flushInline();
                        if (tok.hadBlankLine && lines.length) { lines.push(''); }
                        lines.push(_formatTagLine(tok, indent, tab, tabSize));
                    } else {
                        appendInline(tok.value.replace(/\\s+/g, ' ').trim(), tok.hadSpace, tok.hadNewline, tok.hadBlankLine);
                    }

                } else if (tok.isClosing) {
                    flushInline();
                    if (tok.hadBlankLine && lines.length) { lines.push(''); }
                    var indentedCount = 0;
                    for (var si = 0; si < inlineStack.length; si++) {
                        if (inlineStack[si].indented) indentedCount++;
                    }
                    indent = Math.max(0, indent - indentedCount);
                    inlineStack = blockFrames.pop() || [];
                    indent = Math.max(0, indent - 1);
                    lines.push(_formatTagLine(tok, indent, tab, tabSize));

                } else {
                    /* Block opening tag — try to collapse short content */
                    flushInline();
                    if (tok.hadBlankLine && lines.length) { lines.push(''); }
                    var collapsed = tryBlockCollapse(t);
                    if (collapsed) {
                        lines.push(collapsed.line);
                        t = collapsed.endIndex;
                        continue;
                    }
                    lines.push(_formatTagLine(tok, indent, tab, tabSize));
                    blockFrames.push(inlineStack);
                    inlineStack = [];
                    indent++;
                }

            } else if (tok.type === 'text') {
                appendInline(tok.value, tok.hadSpace, tok.hadNewline, tok.hadBlankLine);

            } else if (tok.type === 'comment') {
                flushInline();
                if (tok.hadBlankLine && lines.length) { lines.push(''); }
                var commentLines = tok.value.split('\\n');
                for (var cl = 0; cl < commentLines.length; cl++) {
                    var ctrim = commentLines[cl].trim();
                    if (ctrim) {
                        lines.push(_makeIndent(indent, tab) + ctrim);
                    }
                }

            } else if (tok.type === 'preserved') {
                var raw = tok.value;
                /* Trim the newline that immediately follows the opening tag */
                if (raw.charAt(0) === '\\n') { raw = raw.substring(1); }
                /* Trim the newline that immediately precedes the closing tag */
                if (raw.length && raw.charAt(raw.length - 1) === '\\n') {
                    raw = raw.substring(0, raw.length - 1);
                }

                if (tok.tagName === 'pre' || tok.tagName === 'textarea') {
                    lines.push(raw);
                } else {
                    /* Script / style — re-indent to match nesting */
                    var pLines = raw.split('\\n');
                    var minWs  = Infinity;
                    for (var pl = 0; pl < pLines.length; pl++) {
                        if (!pLines[pl].trim()) { continue; }
                        var expanded = pLines[pl].replace(/\\t/g, expandWs);
                        var lc = 0;
                        while (lc < expanded.length && expanded[lc] === ' ') { lc++; }
                        if (lc < minWs) { minWs = lc; }
                    }
                    if (minWs === Infinity) { minWs = 0; }
                    for (var pl2 = 0; pl2 < pLines.length; pl2++) {
                        if (!pLines[pl2].trim()) {
                            lines.push('');
                            continue;
                        }
                        var expanded2 = pLines[pl2].replace(/\\t/g, expandWs);
                        lines.push(_makeIndent(indent, tab) + expanded2.substring(minWs));
                    }
                }
            }
        }

        flushInline();

        var result = lines.join('\\n');
        /* Ensure single trailing newline */
        if (result && result.charAt(result.length - 1) !== '\\n') {
            result += '\\n';
        }
        return result;
    }

    // -------------------------------------------------------------------------
    // Linked Editing — rename matching open/close tag pair in real time
    //
    // Registered as a LinkedEditingRangeProvider for 'html'.  Monaco calls this
    // whenever the cursor enters a tag name and the editor's \`linkedEditing\`
    // option is enabled; the returned ranges are kept in sync as the user types.
    //
    // Strategy: parse tags with a stack.  When a closing tag matches an opener,
    // remember which one (if either) contains the cursor — that pair is the
    // target.  Self-closing / void tags have no pair and return null.
    // -------------------------------------------------------------------------
    function _provideHtmlLinkedEditingRanges(model, position, monaco) {
        var text = model.getValue();
        var cursorOffset = model.getOffsetAt(position);

        /* Match (in priority order): {{ expr }}, <!-- comment -->, any tag.
           Attribute values are consumed atomically so > inside them is safe. */
        var re = /\\{\\{[\\s\\S]*?\\}\\}|<!--[\\s\\S]*?(?:-->|$)|<(\\/?)([\\w:-]+)((?:[^"'>]|"[^"]*"|'[^']*')*?)(\\/?)\\s*>/g;
        var stack = [];
        var target = null;
        var pair = null;
        var m;

        while ((m = re.exec(text)) !== null) {
            var first = m[0].charAt(0);
            var second = m[0].charAt(1);
            if (first === '{' || (first === '<' && second === '!')) {
                continue;
            }

            var isClosing = !!m[1];
            var name = m[2];
            var lower = name.toLowerCase();
            var isSelfClose = !isClosing && (m[4] === '/' || !!VOID_ELEMENTS[lower]);
            var nameStart = m.index + 1 + (isClosing ? 1 : 0);
            var nameEnd = nameStart + name.length;
            var cursorInName = cursorOffset >= nameStart && cursorOffset <= nameEnd;

            /* Skip <script>…</script> / <style>…</style> content — tags inside
               embedded code are not HTML tags. */
            if (!isClosing && !isSelfClose && (lower === 'script' || lower === 'style')) {
                stack.push({ nameStart: nameStart, nameEnd: nameEnd, tagName: lower, cursorInName: cursorInName });
                var closePattern = new RegExp('</' + lower + '\\\\s*>', 'i');
                var closeMatch = closePattern.exec(text.substring(re.lastIndex));
                if (closeMatch) {
                    re.lastIndex += closeMatch.index;
                }
                continue;
            }

            if (isSelfClose) {
                if (cursorInName) { return null; }
                continue;
            }

            if (!isClosing) {
                stack.push({ nameStart: nameStart, nameEnd: nameEnd, tagName: lower, cursorInName: cursorInName });
                continue;
            }

            /* Closing tag — find nearest matching opener on the stack. */
            var found = -1;
            for (var i = stack.length - 1; i >= 0; i--) {
                if (stack[i].tagName === lower) { found = i; break; }
            }
            if (found === -1) { continue; }
            var opener = stack[found];
            stack.splice(found);

            if (opener.cursorInName) {
                target = { nameStart: opener.nameStart, nameEnd: opener.nameEnd };
                pair   = { nameStart: nameStart,        nameEnd: nameEnd };
                break;
            }
            if (cursorInName) {
                target = { nameStart: nameStart,        nameEnd: nameEnd };
                pair   = { nameStart: opener.nameStart, nameEnd: opener.nameEnd };
                break;
            }
        }

        if (!target || !pair) { return null; }

        var tStart = model.getPositionAt(target.nameStart);
        var tEnd   = model.getPositionAt(target.nameEnd);
        var pStart = model.getPositionAt(pair.nameStart);
        var pEnd   = model.getPositionAt(pair.nameEnd);

        return {
            ranges: [
                new monaco.Range(tStart.lineNumber, tStart.column, tEnd.lineNumber, tEnd.column),
                new monaco.Range(pStart.lineNumber, pStart.column, pEnd.lineNumber, pEnd.column)
            ],
            wordPattern: /[\\w:-]+/
        };
    }

    // -------------------------------------------------------------------------
    // register(monaco) — installs tokenizer + completion + hover + lint + format
    // -------------------------------------------------------------------------
    var _registered = false;

    function register(monaco) {
        if (_registered) {
            return;
        }
        _registered = true;

        // 1. Replace the HTML Monarch tokenizer with our Angular-aware version
        monaco.languages.setMonarchTokensProvider('html', TOKENIZER);

        /*
         * 1b. Language configuration — brackets, auto-close, and Enter indentation.
         *
         * Monaco's built-in HTML language has a lazy loader that calls
         * setLanguageConfiguration with its own conf when the language is first
         * used.  If we call setLanguageConfiguration now, the built-in loader
         * may run later and silently overwrite our rules.
         *
         * Fix: trigger the built-in loader, then use setTimeout(0) to push our
         * setLanguageConfiguration into the next macrotask — after all pending
         * microtasks (including the loader's internal .then() handlers that
         * apply the built-in conf) have completed.
         *
         * Also disable the built-in HTML language service's formatting provider
         * (documentFormattingEdits / documentRangeFormattingEdits) so our custom
         * DocumentFormattingEditProvider is the sole formatter.  The built-in
         * formatter treats inline elements (span, a, etc.) as "unformatted" and
         * produces incorrect indentation for them.
         */
        if (monaco.languages.html && monaco.languages.html.htmlDefaults) {
            var cfg = monaco.languages.html.htmlDefaults.modeConfiguration;
            monaco.languages.html.htmlDefaults.setModeConfiguration({
                completionItems:             cfg.completionItems,
                hovers:                      cfg.hovers,
                documentSymbols:             cfg.documentSymbols,
                links:                       cfg.links,
                documentHighlights:          cfg.documentHighlights,
                rename:                      cfg.rename,
                colors:                      cfg.colors,
                foldingRanges:               cfg.foldingRanges,
                selectionRanges:             cfg.selectionRanges,
                diagnostics:                 cfg.diagnostics,
                documentFormattingEdits:      false,
                documentRangeFormattingEdits: false
            });
        }
        var htmlLangInfo = monaco.languages.getLanguages().filter(function (l) {
            return l.id === 'html';
        })[0];
        var loaderDone = (htmlLangInfo && typeof htmlLangInfo.loader === 'function')
            ? htmlLangInfo.loader()
            : Promise.resolve();
        loaderDone.then(function () {
            setTimeout(function () {
                _applyHtmlLanguageConfiguration(monaco);
                _registerFormattingProvider(monaco);
                _registerLinkedEditingProvider(monaco);
            }, 0);
        });

        function _applyHtmlLanguageConfiguration(monaco) {
        monaco.languages.setLanguageConfiguration('html', {
            comments: { blockComment: ['<!--', '-->'] },
            brackets: [
                ['<!--', '-->'],
                ['<', '>'],
                ['(', ')']
            ],
            autoClosingPairs: [
                { open: '{',  close: '}' },
                { open: '[',  close: ']' },
                { open: '(',  close: ')' },
                { open: '"',  close: '"' },
                { open: "'",  close: "'" },
                { open: '\`',  close: '\`' },
                { open: '<!--', close: ' -->', notIn: ['comment', 'string'] }
            ],
            surroundingPairs: [
                { open: '"',  close: '"' },
                { open: "'",  close: "'" },
                { open: '{',  close: '}' },
                { open: '[',  close: ']' },
                { open: '(',  close: ')' },
                { open: '<',  close: '>' }
            ],
            onEnterRules: [
                {
                    /* Between opening and closing tag on the same line:
                     *   <div>|</div>  →  <div>\\n    |\\n</div>
                     */
                    beforeText: /(<(?!(?:area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)\\b)[\\w:-]+(?:[^"'>]|"[^"]*"|'[^']*')*>)\\s*$/i,
                    afterText:  /^\\s*<\\/[\\w:-]+\\s*>/i,
                    action: {
                        indentAction: monaco.languages.IndentAction.IndentOutdent
                    }
                },
                {
                    /* After an opening tag (cursor at end of line):
                     *   <div>|  →  <div>\\n    |
                     */
                    beforeText: /(<(?!(?:area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)\\b)[\\w:-]+(?:[^"'>]|"[^"]*"|'[^']*')*>)\\s*$/i,
                    action: {
                        indentAction: monaco.languages.IndentAction.Indent
                    }
                }
            ]
        });
        } /* end _applyHtmlLanguageConfiguration */

        // 2. Completion provider — ng-* and sp-* attribute suggestions
        monaco.languages.registerCompletionItemProvider('html', {
            triggerCharacters: [' ', '\\n', '-', '<'],
            provideCompletionItems: function (model, position) {
                if (!_isInTagAttributes(model, position)) {
                    return { suggestions: [] };
                }
                var word  = model.getWordUntilPosition(position);
                var range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber:   position.lineNumber,
                    startColumn:     word.startColumn,
                    endColumn:       word.endColumn
                };
                // Filter: only show matching directives based on what's already typed
                var typed = word.word.toLowerCase();
                var suggestions = DIRECTIVES
                    .filter(function (d) {
                        return !typed || d.name.indexOf(typed) !== -1;
                    })
                    .map(function (d) { return _toCompletion(d, range, monaco); });
                var htmlSuggestions = HTML_ATTRS
                    .filter(function (a) {
                        return !typed || a.name.indexOf(typed) !== -1;
                    })
                    .map(function (a) {
                        var item = _toCompletion(a, range, monaco);
                        item.sortText = '~' + a.name;
                        return item;
                    });
                return { suggestions: suggestions.concat(htmlSuggestions) };
            }
        });

        // 3. Hover provider — documentation for ng-* and sp-* attribute names
        monaco.languages.registerHoverProvider('html', {
            provideHover: function (model, position) {
                var word = model.getWordAtPosition(position);
                if (!word) {
                    return null;
                }

                // Extend word left to capture the full ng-... or sp-... name
                var line      = model.getLineContent(position.lineNumber);
                var col       = position.column - 1; // 0-based
                var start     = col;
                var end       = col;

                // Walk left to the start of the attribute name
                while (start > 0 && /[\\w-]/.test(line[start - 1])) {
                    start--;
                }
                // Walk right to the end
                while (end < line.length && /[\\w-]/.test(line[end])) {
                    end++;
                }

                var attrName = line.substring(start, end).replace(/^data-/, '');
                var directive = DIRECTIVE_MAP[attrName];
                if (!directive) {
                    return null;
                }

                return {
                    range: new monaco.Range(
                        position.lineNumber, start + 1,
                        position.lineNumber, end + 1
                    ),
                    contents: [
                        { value: '**\`' + directive.name + '\`** — ' + directive.detail },
                        { value: directive.description }
                    ]
                };
            }
        });

        // 4. HTML tag validation — mismatched / unclosed tag diagnostics
        function _watchHtmlModel(model) {
            if (model.getLanguageId() !== 'html') {
                return;
            }
            _htmlTrackedModels.push({ model: model, monacoRef: monaco });
            _scheduleHtmlValidation(model, monaco);
            model.onDidChangeContent(function () {
                _scheduleHtmlValidation(model, monaco);
            });
            model.onWillDispose(function () {
                var id = model.uri.toString();
                clearTimeout(_htmlValidationTimers[id]);
                delete _htmlValidationTimers[id];
                _htmlTrackedModels = _htmlTrackedModels.filter(function (e) {
                    return e.model !== model;
                });
            });
        }
        monaco.editor.getModels().forEach(_watchHtmlModel);
        monaco.editor.onDidCreateModel(_watchHtmlModel);

        // 5. Auto-close HTML tags — insert </tagName> when the user types >
        monaco.editor.onDidCreateEditor(function (editor) {
            editor.onDidChangeModelContent(function (e) {
                if (!_htmlAutoCloseTagsEnabled) {
                    return;
                }
                var model = editor.getModel();
                if (!model || model.getLanguageId() !== 'html') {
                    return;
                }
                if (e.isUndoing || e.isRedoing) {
                    return;
                }
                var changes = e.changes;
                if (changes.length !== 1) {
                    return;
                }
                var change = changes[0];
                var inserted = change.text;
                if (inserted !== '>' && inserted !== '/>' ) {
                    return;
                }
                /* Self-closing /> — nothing to close */
                if (inserted === '/>') {
                    return;
                }
                /* Find the tag name that was just closed by > */
                var pos = editor.getPosition();
                var textBefore = model.getValueInRange({
                    startLineNumber: 1,
                    startColumn: 1,
                    endLineNumber: pos.lineNumber,
                    endColumn: pos.column
                });
                /*
                 * Walk backwards from the > to find the opening <tagName.
                 * Skip if we're inside a closing tag (</...) or comment.
                 */
                var tagMatch = textBefore.match(/<([\\w:-]+)(?:[^"'>]|"[^"]*"|'[^']*')*>$/);
                if (!tagMatch) {
                    return;
                }
                var tagName = tagMatch[1];
                var lower = tagName.toLowerCase();
                if (VOID_ELEMENTS[lower]) {
                    return;
                }
                /* Don't insert if the closing tag already follows the cursor */
                var afterPos = model.getValueInRange({
                    startLineNumber: pos.lineNumber,
                    startColumn: pos.column,
                    endLineNumber: pos.lineNumber,
                    endColumn: pos.column + tagName.length + 3
                });
                if (afterPos === '</' + tagName + '>') {
                    return;
                }
                var closeTag = '</' + tagName + '>';
                editor.executeEdits('autoCloseTag', [{
                    range: {
                        startLineNumber: pos.lineNumber,
                        startColumn: pos.column,
                        endLineNumber: pos.lineNumber,
                        endColumn: pos.column
                    },
                    text: closeTag,
                    forceMoveMarkers: false
                }]);
                /* Keep cursor between the opening and closing tags */
                editor.setPosition(pos);
            });

            /* Enter inside an opening tag aligns the new line with the first
               attribute (column right after the tag name). */
            editor.onKeyDown(function (e) {
                if (e.keyCode !== monaco.KeyCode.Enter) return;
                if (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return;
                var model = editor.getModel();
                if (!model || model.getLanguageId() !== 'html') return;
                var domNode = editor.getDomNode();
                if (domNode && domNode.querySelector('.suggest-widget.visible')) return;
                var pos = editor.getPosition();
                if (!pos || !_isInTagAttributes(model, pos)) return;

                var textBefore = model.getValueInRange({
                    startLineNumber: 1, startColumn: 1,
                    endLineNumber: pos.lineNumber, endColumn: pos.column
                });
                var ltIdx = textBefore.lastIndexOf('<');
                if (ltIdx === -1) return;
                var tagMatch = textBefore.substring(ltIdx).match(/^<\\/?\\s*([\\w:-]+)/);
                if (!tagMatch) return;
                var ltPos = model.getPositionAt(ltIdx);
                var alignCol = ltPos.column + 1 + tagMatch[1].length + 1;
                var pad = '';
                for (var k = 1; k < alignCol; k++) pad += ' ';

                e.preventDefault();
                e.stopPropagation();
                editor.executeEdits('htmlAttrNewline', [{
                    range: {
                        startLineNumber: pos.lineNumber, startColumn: pos.column,
                        endLineNumber: pos.lineNumber, endColumn: pos.column
                    },
                    text: '\\n' + pad,
                    forceMoveMarkers: true
                }]);
                editor.setPosition({ lineNumber: pos.lineNumber + 1, column: alignCol });
            });
        });

        /*
         * 6. HTML document formatting (Shift+Alt+F / right-click > Format Document)
         *
         * Registered inside the deferred setTimeout(0) block (see 1b) so it
         * runs AFTER the built-in HTML language service has registered its
         * own formatter.  Monaco uses the most recently registered provider,
         * so registering last ensures our custom formatter takes precedence.
         */
        function _registerFormattingProvider(monaco) {
        monaco.languages.registerDocumentFormattingEditProvider('html', {
            provideDocumentFormattingEdits: function (model, options) {
                var formatted = _formatHtml(model.getValue(), options);
                if (formatted == null) {
                    return [];
                }
                return [{
                    range: model.getFullModelRange(),
                    text: formatted
                }];
            }
        });
        } /* end _registerFormattingProvider */

        /*
         * 7. Linked editing — when the cursor is inside an HTML tag name and
         * the editor option \`linkedEditing\` is on, Monaco queries any registered
         * LinkedEditingRangeProvider for the ranges to keep synchronised.  We
         * register our own provider because the built-in HTML language service's
         * provider is either absent from or gated off in ServiceNow's bundle.
         */
        function _registerLinkedEditingProvider(monaco) {
            if (!monaco.languages.registerLinkedEditingRangeProvider) { return; }
            monaco.languages.registerLinkedEditingRangeProvider('html', {
                provideLinkedEditingRanges: function (model, position) {
                    return _provideHtmlLinkedEditingRanges(model, position, monaco);
                }
            });
        } /* end _registerLinkedEditingProvider */
    }

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------
    window.MONACO_LANGUAGE_HTML = {
        directives: DIRECTIVES,
        tokenizer:  TOKENIZER,
        register:   register,

        /**
         * Enable or disable HTML tag validation (mismatched/unclosed tag diagnostics).
         * When disabled, existing markers are cleared immediately.
         * @param {boolean} enabled
         */
        setValidationEnabled: function (enabled) {
            _htmlValidationEnabled = !!enabled;
            _htmlTrackedModels.forEach(function (entry) {
                if (!entry.model.isDisposed()) {
                    _scheduleHtmlValidation(entry.model, entry.monacoRef);
                }
            });
        },

        /** @returns {boolean} Whether HTML tag validation is currently enabled. */
        isValidationEnabled: function () {
            return _htmlValidationEnabled;
        },

        /**
         * Enable or disable automatic closing of HTML tags.
         * @param {boolean} enabled
         */
        setAutoCloseTagsEnabled: function (enabled) {
            _htmlAutoCloseTagsEnabled = !!enabled;
        },

        /** @returns {boolean} Whether HTML auto-close tags is currently enabled. */
        isAutoCloseTagsEnabled: function () {
            return _htmlAutoCloseTagsEnabled;
        }
    };

})();
`,
        ui_type: '0',
        use_scoped_format: 'false',
    },
})
