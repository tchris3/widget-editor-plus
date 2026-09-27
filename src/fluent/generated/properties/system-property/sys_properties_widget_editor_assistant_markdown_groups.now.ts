import { Property } from '@servicenow/sdk/core'

// Retained for upgrade migration; the combined editor reads the per-table properties.
Property({
    $id: Now.ID['widget-editor-assistant-markdown-groups-property'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.update_sets.markdown_groups',
    type: 'string',
    value: '',
    description: 'Legacy Markdown hierarchy. Migrated to monaco.plus.update_sets.markdown_groups.<table>.',
    ignoreCache: true,
    roles: { read: ['sp_admin'], write: ['admin'] },
})
