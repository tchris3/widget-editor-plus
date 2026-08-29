import { Property } from '@servicenow/sdk/core'

export const tableConfigSpAngularProviderProperty = Property({
    $id: Now.ID['widget-editor-table-config-sp-angular-provider'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.assistant.table_config.sp_angular_provider',
    value: `{
  "rules": [],
  "pickerFields": ["name", "type"]
}`,
    description:
        'Widget Editor+ Assistant table_config rules for sp_angular_provider: currently only the record picker field order.',
    ignoreCache: true,
    roles: {
        read: ['sp_admin'],
    },
})
