import { Property } from '@servicenow/sdk/core'

export const markdownGroupsItemOptionNewProperty = Property({
    $id: Now.ID['widget-editor-markdown-groups-item_option_new'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.update_sets.markdown_groups.item_option_new',
    type: 'string',
    value: `[
    "question_choice"
]`,
    description: 'Child tables grouped under Variable in update set Markdown export.',
    ignoreCache: true,
    roles: { read: ['sp_admin'], write: ['admin'] },
})
