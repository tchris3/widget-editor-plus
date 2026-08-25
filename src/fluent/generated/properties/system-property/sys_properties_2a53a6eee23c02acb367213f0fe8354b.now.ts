import { Property } from '@servicenow/sdk/core'

Property({
    $id: Now.ID['2a53a6eee23c02acb367213f0fe8354b'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.assistant.export_blocklist_tables',
    value: 'cmn_notif_device,discovery_credentials,hr_employee,hr_profile,oauth_credential,sp_log,sys_credential,sys_user',
    description:
        'Comma-separated exact table names withheld from Widget Editor+ Assistant search/browse/export.',
    ignoreCache: true,
    roles: {
        read: ['sp_admin'],
    },
})
