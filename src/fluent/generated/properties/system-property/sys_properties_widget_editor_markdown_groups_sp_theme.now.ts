import { Property } from '@servicenow/sdk/core'

export const markdownGroupsSpThemeProperty = Property({
    $id: Now.ID['widget-editor-markdown-groups-sp_theme'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.update_sets.markdown_groups.sp_theme',
    type: 'string',
    value: `[
    "sp_header_footer",
    "m2m_sp_theme_css_include",
    "m2m_sp_theme_js_include",
    "m2m_sp_theme_sp_theme_variant"
]`,
    description: 'Child tables grouped under Theme in update set Markdown export.',
    ignoreCache: true,
    roles: { read: ['sp_admin'], write: ['admin'] },
})
