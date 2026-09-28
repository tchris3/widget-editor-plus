import { Property } from '@servicenow/sdk/core'

export const markdownIndicatorsProperty = Property({
    $id: Now.ID['widget-editor-markdown-indicators-property'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.update_sets.markdown_indicators',
    type: 'string',
    value: `{
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
    description: 'Export Markdown+ indicators: new, deleted and update_set. Set update_set to an object with individually configured number keys. Use empty strings to hide, plain text, emoji or Jira codes such as :new:. Unspecified set numbers have no indicator.',
    ignoreCache: true,
    roles: { read: ['sp_admin'], write: ['admin'] },
})
