import { Property } from '@servicenow/sdk/core'

Property({
    $id: Now.ID['widget-editor-record-limit'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.record_limit',
    value: '500',
    description:
        'Page size for Widget Editor+ record pickers (widget list, versions, providers, dependencies). The widget list loads more automatically as you scroll.',
    ignoreCache: true,
})
