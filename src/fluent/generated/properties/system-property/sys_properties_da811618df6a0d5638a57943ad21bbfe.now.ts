import { Property } from '@servicenow/sdk/core'

Property({
    $id: Now.ID['da811618df6a0d5638a57943ad21bbfe'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.assistant.table_config.sc_cat_item_producer',
    value: `{
  "rules": [
    {
      "type": "reference_field",
      "sourceField": "table_name",
      "relatedTable": "sys_db_object",
      "relatedMatchField": "name",
      "category": "Table (referenced)"
    },
    {
      "type": "child_reference",
      "relatedTable": "item_option_new",
      "relatedField": "cat_item",
      "category": "Variable (on producer)"
    },
    {
      "type": "child_reference",
      "relatedTable": "catalog_ui_policy",
      "relatedField": "catalog_item",
      "category": "UI Policy (on producer)",
      "then": [
        {
          "type": "child_reference",
          "relatedTable": "catalog_ui_policy_action",
          "relatedField": "ui_policy",
          "category": "UI Policy Action (on producer)"
        }
      ]
    },
    {
      "type": "child_reference",
      "relatedTable": "catalog_script_client",
      "relatedField": "cat_item",
      "category": "Catalog Client Script (on producer)"
    }
  ]
}`,
    description:
        'Widget Editor+ Assistant table_config rules for sc_cat_item_producer: target table, variables, UI policies, client scripts.',
    ignoreCache: true,
    roles: {
        read: ['sp_admin'],
    },
})
