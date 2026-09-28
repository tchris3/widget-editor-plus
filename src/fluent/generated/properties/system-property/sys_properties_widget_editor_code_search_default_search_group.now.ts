import { Property } from '@servicenow/sdk/core'

export const codeSearchDefaultSearchGroupProperty = Property({
    $id: Now.ID['widget-editor-code-search-default-search-group'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.code_search.default_search_group',
    type: 'string',
    value: '',
    description: 'Default Code Search+ search group sys_id, used when the user has no available saved group. Leave empty to use the first available group. Saved user choices and shared-link selections take priority.',
    ignoreCache: true,
    roles: { read: ['sp_admin'], write: ['admin'] },
})
