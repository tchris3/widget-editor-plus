import { Property } from '@servicenow/sdk/core'

Property({
    $id: Now.ID['76c6cf9d8373b25070b8b5dfeeaad332'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.scss.variables',
    value: `{
  "$breakpoint-xs": "480px",
  "$breakpoint-sm": "768px",
  "$breakpoint-md": "992px",
  "$breakpoint-lg": "1200px"
}`,
    description:
        'SCSS variables available as suggestions for Monaco Editor+. Must be JSON string with name-value pairs containing the variable name and a valid SCSS value.',
    ignoreCache: true,
})
