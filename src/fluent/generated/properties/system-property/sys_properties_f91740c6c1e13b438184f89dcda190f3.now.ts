import { Property } from '@servicenow/sdk/core'

export const tableConfigSpPageProperty = Property({
    $id: Now.ID['f91740c6c1e13b438184f89dcda190f3'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.assistant.table_config.sp_page',
    value: `{
  "rules": [
    {
      "type": "child_reference",
      "relatedTable": "sp_container",
      "relatedField": "sp_page",
      "category": "Container (on page)",
      "then": [
        {
          "type": "child_reference",
          "relatedTable": "sp_row",
          "relatedField": "sp_container",
          "category": "Row (on page)",
          "then": [
            {
              "type": "child_reference",
              "relatedTable": "sp_column",
              "relatedField": "sp_row",
              "category": "Column (on page)",
              "then": [
                {
                  "type": "child_reference",
                  "relatedTable": "sp_instance",
                  "relatedField": "sp_column",
                  "category": "Widget Instance (on page)",
                  "then": [
                    {
                      "type": "reference_field",
                      "sourceField": "sp_widget",
                      "relatedTable": "sp_widget",
                      "relatedMatchField": "sys_id",
                      "category": "Widget (used on page)"
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  "pickerFields": ["id", "title"]
}`,
    description:
        'Widget Editor+ Assistant table_config rules for sp_page: layout hierarchy down to the widgets used on the page, and record picker field order.',
    ignoreCache: true,
    roles: {
        read: ['sp_admin'],
    },
})
