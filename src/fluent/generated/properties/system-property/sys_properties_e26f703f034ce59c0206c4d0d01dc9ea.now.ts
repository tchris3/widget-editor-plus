import { Property } from '@servicenow/sdk/core'

export const exportBlocklistPrefixesProperty = Property({
    $id: Now.ID['e26f703f034ce59c0206c4d0d01dc9ea'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.assistant.export_blocklist_prefixes',
    value: 'pwd,sys_activity,sys_amb,sys_attachment,sys_audit,sys_df_query,sys_history,sys_scheduler_job_history,sys_user_grmember,sys_user_password,syslog,ts_',
    description:
        'Comma-separated table name prefixes withheld from Widget Editor+ Assistant search/browse/export.',
    ignoreCache: true,
    roles: {
        read: ['sp_admin'],
    },
})
