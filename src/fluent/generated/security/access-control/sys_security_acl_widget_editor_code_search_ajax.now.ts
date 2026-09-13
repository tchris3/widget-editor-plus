import { Acl } from '@servicenow/sdk/core'

Acl({
    $id: Now.ID['widget-editor-code-search-script-include-acl'],
    localOrExisting: 'Existing',
    type: 'client_callable_script_include',
    operation: 'execute',
    // Intentionally scoped to sp_admin; the script include scans tables via plain GlideRecord by design.
    roles: ['sp_admin'],
    name: 'WidgetEditorCodeSearchAjax',
})
