import { Property } from '@servicenow/sdk/core'

Property({
    $id: Now.ID['8a5c13b3b97552475d762496f01876c2'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.assistant.table_config.sysevent_email_action',
    value: `{
  "rules": [
    {
      "type": "token",
      "sourceField": [
        "subject",
        "message_html"
      ],
      "pattern": "\\\\$\\\\{mail_script:([^}]+)\\\\}",
      "relatedTable": "sys_script_email",
      "relatedMatchField": "name",
      "category": "Mail Script (referenced)"
    }
  ]
}`,
    description:
        'Widget Editor+ Assistant table_config rules for sysevent_email_action: resolves ${mail_script:Name} tokens.',
    ignoreCache: true,
    roles: {
        read: ['sp_admin'],
    },
})
