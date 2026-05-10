import { SPWidget } from '@servicenow/sdk/core'

SPWidget({
    $id: Now.ID['d7ad6f7083f7be1070b8b5dfeeaad39d'],
    name: 'Widget Editor Debug Menu',
    clientScript: Now.include('./sp_widget_widget_editor_debug_menu/client_script.js'),
    serverScript: Now.include('./sp_widget_widget_editor_debug_menu/server_script.js'),
    htmlTemplate: Now.include('./sp_widget_widget_editor_debug_menu/template.html'),
    customCss: Now.include('./sp_widget_widget_editor_debug_menu/style.scss'),
    description: `Displays customisable options in the Service Portal debug menu for users with the 'sp_admin' role.

This widget should be embedded in the Service Portal's header or footer widget.`,
    id: 'widget_editor_debug_menu',
    linkScript: Now.include('./sp_widget_widget_editor_debug_menu/link-script.js'),
})
