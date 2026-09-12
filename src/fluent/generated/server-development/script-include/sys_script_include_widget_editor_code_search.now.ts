import { ScriptInclude } from '@servicenow/sdk/core'

ScriptInclude({
    $id: Now.ID['widget-editor-code-search-script-include'],
    name: 'WidgetEditorCodeSearchAjax',
    script: Now.include('./sys_script_include_widget_editor_code_search.server.js'),
    description: 'Secure search and configuration API for the Widget Editor+ Code Search page.',
    apiName: 'global.WidgetEditorCodeSearchAjax',
    clientCallable: true,
    mobileCallable: false,
    sandboxCallable: false,
    active: true,
})
