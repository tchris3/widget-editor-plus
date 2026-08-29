import { Property } from '@servicenow/sdk/core'

export const tableConfigSysSecurityAclProperty = Property({
    $id: Now.ID['widget-editor-table-config-sys-security-acl'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.assistant.table_config.sys_security_acl',
    value: `{
  "rules": [],
  "pickerFields": ["name", "type", "operation"]
}`,
    description:
        'Widget Editor+ Assistant table_config rules for sys_security_acl: currently only the record picker field order.',
    ignoreCache: true,
    roles: {
        read: ['sp_admin'],
    },
})
