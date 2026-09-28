import { Property } from '@servicenow/sdk/core'

export const markdownDisplaySpInstanceProperty = Property({
    $id: Now.ID['widget-editor-markdown-display-sp_instance'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.update_sets.markdown_display.sp_instance',
    type: 'string',
    value: `{
    "display_value": "name,sp_widget",
    "additional_fields": "sp_widget"
}`,
    description: 'Use the instance name or widget as the primary display, and show the widget separately only when not used as the primary display.',
    ignoreCache: true,
    roles: { read: ['sp_admin'], write: ['admin'] },
})
