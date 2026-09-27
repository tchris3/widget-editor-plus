import { Property } from '@servicenow/sdk/core'

export const markdownGroupsCatalogUiPolicyProperty = Property({
    $id: Now.ID['widget-editor-markdown-groups-catalog_ui_policy'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.update_sets.markdown_groups.catalog_ui_policy',
    type: 'string',
    value: `[
    "catalog_ui_policy_action"
]`,
    description: 'Child tables grouped under Catalog UI Policy in update set Markdown export.',
    ignoreCache: true,
    roles: { read: ['sp_admin'], write: ['admin'] },
})
