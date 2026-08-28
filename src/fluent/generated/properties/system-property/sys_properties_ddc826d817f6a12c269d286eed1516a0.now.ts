import { Property } from '@servicenow/sdk/core'

export const tableConfigSpWidgetProperty = Property({
    $id: Now.ID['ddc826d817f6a12c269d286eed1516a0'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.assistant.table_config.sp_widget',
    value: `{
  "rules": [
    {
      "type": "child_reference",
      "relatedTable": "sp_ng_template",
      "relatedField": "sp_widget",
      "category": "Angular Template"
    },
    {
      "type": "child_reference",
      "relatedTable": "m2m_sp_ng_pro_sp_widget",
      "relatedField": "sp_widget",
      "category": "Angular Provider (link)",
      "then": [
        {
          "type": "reference_field",
          "sourceField": "sp_angular_provider",
          "relatedTable": "sp_angular_provider",
          "relatedMatchField": "sys_id",
          "category": "Angular Provider"
        }
      ]
    },
    {
      "type": "token",
      "sourceField": [
        "script",
        "client_script",
        "link",
        "css",
        "template",
        "option_schema",
        "demo_data"
      ],
      "pattern": "\\\\$sp\\\\.getWidget\\\\(\\\\s*['\\"]([^'\\"]+)['\\"]\\\\s*\\\\)",
      "relatedTable": "sp_widget",
      "relatedMatchField": "id",
      "category": "Embedded Widget"
    }
  ],
  "pickerFields": ["name", "id"]
}`,
    description:
        'Widget Editor+ Assistant table_config rules for sp_widget: linked templates/providers, embedded widget references, and record picker field order.',
    ignoreCache: true,
    roles: {
        read: ['sp_admin'],
    },
})
