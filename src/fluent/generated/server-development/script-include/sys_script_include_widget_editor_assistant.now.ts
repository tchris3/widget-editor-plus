import { ScriptInclude } from '@servicenow/sdk/core'

ScriptInclude({
    $id: Now.ID['widget-editor-assistant-script-include'],
    name: 'WidgetEditorAssistantAjax',
    script: Now.include('./sys_script_include_widget_editor_assistant.server.js'),
    description:
        'Helper functions for the Widget Editor+ Assistant (widget_editor_assistant) UI page: related-component suggestions, table/record search for the picker, record label resolution, and favourite-table user preferences.',
    apiName: 'global.WidgetEditorAssistantAjax',
    clientCallable: true,
    mobileCallable: false,
    sandboxCallable: false,
    active: true,
})
