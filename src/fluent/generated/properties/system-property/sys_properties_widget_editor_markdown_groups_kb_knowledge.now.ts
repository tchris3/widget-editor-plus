import { Property } from '@servicenow/sdk/core'

export const markdownGroupsKbKnowledgeProperty = Property({
    $id: Now.ID['widget-editor-markdown-groups-kb_knowledge'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.update_sets.markdown_groups.kb_knowledge',
    type: 'string',
    value: `[
    "kb_version",
    "kb_knowledge_summary"
]`,
    description: 'Child tables grouped under kb_knowledge in update set Markdown export.',
    ignoreCache: true,
    roles: { read: ['sp_admin'], write: ['admin'] },
})
