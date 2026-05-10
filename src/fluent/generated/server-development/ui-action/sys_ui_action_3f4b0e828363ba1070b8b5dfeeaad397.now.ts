import { UiAction } from '@servicenow/sdk/core'

UiAction({
    $id: Now.ID['3f4b0e828363ba1070b8b5dfeeaad397'],
    table: 'sp_widget',
    name: 'Open in Widget Editor+',
    actionName: 'open_widget_editor_plus',
    form: {
        showButton: true,
        showLink: true,
    },
    list: {
        showContextMenu: true,
    },
    client: {
        isClient: true,
        isUi11Compatible: true,
        onClick: 'openWidgetEditorPlus()',
    },
    workspace: {
        clientScriptV2: `function onClick(g_form) {

}`,
    },
    comments: 'Opens the widget in Widget Editor+',
    messages: [],
    script: `function openWidgetEditorPlus() {
    var widgetEditorURL = 'ui_page.do?sys_id=8b2e70458373fe1070b8b5dfeeaad35e&widget_id=';
    if (typeof g_form !== 'undefined' && typeof g_form.getUniqueValue === 'function') {
        // Form button context — check for unsaved changes before navigating
        if (g_form.modified) {
            if (confirm("You have unsaved changes.\\n\\nClick OK to save, or Cancel to discard changes.")) {
                g_form.save();
                return;
            }
            g_form.modified = false;
        }
        var sysId = g_form.getUniqueValue();
        if (!sysId) return;
        g_navigation.open(widgetEditorURL + sysId, '_self');
        return;
    }

    // List context — check for checked rows first, otherwise use right-clicked row
    var checked = typeof g_list !== 'undefined' && g_list.getChecked();
    var ids = checked ? checked.split(',').filter(Boolean) : [];

    if (ids.length > 1) {
        // Multiple rows checked — open each in a new window
        ids.forEach(function(id) {
            g_navigation.open(widgetEditorURL + id, '_blank');
        });
    } else if (ids.length === 1) {
        g_navigation.open(widgetEditorURL + ids[0], '_self');
    } else {
        // Right-click context menu with no checkboxes selected
        if (!rowSysId) return;
        g_navigation.open(widgetEditorURL + rowSysId, '_self');
    }
}`,
    showUpdate: true,
    showInsert: false,
    isolateScript: true,
    roles: ['sp_admin'],
})
