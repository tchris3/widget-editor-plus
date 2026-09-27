import { UiAction } from '@servicenow/sdk/core'

UiAction({
    $id: Now.ID['widget-editor-assistant-configure-markdown-groups'],
    table: 'sys_update_xml',
    name: 'Widget Editor+ Properties',
    actionName: 'configure_widget_editor_plus_properties',
    list: { showLink: true },
    client: { isClient: true, isUi11Compatible: true, onClick: 'openWidgetEditorPlusProperties()' },
    comments: 'Opens Widget Editor+ properties, including shared Markdown grouping rules.',
    order: 121,
    showUpdate: true,
    showInsert: false,
    isolateScript: false,
    roles: ['admin'],
    script: `function openWidgetEditorPlusProperties() {
    g_navigation.open('widget_editor_plus_properties.do', '_blank');
}`,
})
