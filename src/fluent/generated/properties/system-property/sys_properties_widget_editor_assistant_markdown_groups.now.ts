import { Property } from '@servicenow/sdk/core'

export const updateSetMarkdownGroupsProperty = Property({
    $id: Now.ID['widget-editor-assistant-markdown-groups-property'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.update_sets.markdown_groups',
    type: 'string',
    value: JSON.stringify({ version: 1, groups: [] }),
    description: 'Alphabetical table hierarchy for update set Markdown export.',
    ignoreCache: true,
    roles: { read: ['sp_admin'], write: ['admin'] },
})
