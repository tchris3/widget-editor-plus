import { Property } from '@servicenow/sdk/core'

export const tableConfigSysUiActionProperty = Property({
    $id: Now.ID['widget-editor-table-config-sys-ui-action'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.assistant.table_config.sys_ui_action',
    value: `{
  "rules": [],
  "pickerFields": ["name", "table"]
}`,
    description:
        'Widget Editor+ Assistant table_config rules for sys_ui_action: currently only the record picker field order.',
    ignoreCache: true,
    roles: {
        read: ['sp_admin'],
    },
})
