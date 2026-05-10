import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['5121643a8398031070b8b5dfeeaad368'],
    table: 'sys_ui_script',
    data: {
        active: 'true',
        description: `Extends the Widget Editor+ Monaco code actions system with custom per-language actions. 

Register custom lightbulb menu actions using the standard Monaco CodeActionProvider API via MONACO_CUSTOM_CODE_ACTIONS.register(language, provider). 

Errors in custom providers are isolated and logged to the console without affecting built-in editor functionality.`,
        global: 'false',
        ignore_in_now_experience: 'false',
        name: 'monaco_custom_code_actions',
        script: `/**
 * Monaco Custom Code Actions
 *
 * How to add a custom code action:
 * 1. Define your code action provider object with a provideCodeActions(model, range) method.
 * 2. Call window.MONACO_CUSTOM_CODE_ACTIONS.register('language', provider, { id: 'unique-id' })
 *    - 'language' is the Monaco language id (e.g. 'html', 'javascript').
 *    - 'provider' is your code action provider object.
 *    - 'id' is a unique string for your action (prevents duplicates).
 * 3. Your provider should return { actions: [ ... ], dispose: function() {} }.
 * 4. See the example below for a complete pattern.
 *
 * This file is loaded automatically by the Monaco Editor+.
 */
(function () {
    'use strict';
    if (
        !window.MONACO_CUSTOM_CODE_ACTIONS ||
        typeof window.MONACO_CUSTOM_CODE_ACTIONS.register !== 'function'
    )
        return;

    // -------------------------------------------------------------------------
    // Custom actions below here
    // -------------------------------------------------------------------------

})();
`,
        ui_type: '0',
        use_scoped_format: 'false',
    },
})
