import { Property } from '@servicenow/sdk/core'

export const markdownFormattingProperty = Property({
    $id: Now.ID['widget-editor-markdown-indicators-property'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.update_sets.markdown_formatting',
    type: 'string',
    value: `{
    "display_field_separator": ",",
    "context_indicator": "\\u2209",
    "display_field_wrapper": "()",
    "new": "\\ud83c\\udd95",
    "deleted": "\\ud83d\\udeae",
    "update_set": {
        "1": "1\\ufe0f\\u20e3",
        "2": "2\\ufe0f\\u20e3",
        "3": "3\\ufe0f\\u20e3",
        "4": "4\\ufe0f\\u20e3",
        "5": "5\\ufe0f\\u20e3",
        "6": "6\\ufe0f\\u20e3",
        "7": "7\\ufe0f\\u20e3",
        "8": "8\\ufe0f\\u20e3",
        "9": "9\\ufe0f\\u20e3",
        "10": "\\ud83d\\udd1f"
    }
}`,
    description: 'Markdown markers, additional-field separator and two-character wrapper. Empty strings hide markers or wrappers; update_set maps each number to its marker.',
    ignoreCache: true,
    roles: { read: ['sp_admin'], write: ['admin'] },
})
