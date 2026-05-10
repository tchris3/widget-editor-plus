import { Property } from '@servicenow/sdk/core'

Property({
    $id: Now.ID['ad059fa1832fb61070b8b5dfeeaad32d'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.css.variables',
    value: `{
    "example-variable": "#a4c5ea"
}`,
    description:
        'CSS variables available as suggestions for Monaco Editor+. Must be JSON string with name-value pairs containing the variable name and a valid CSS value.',
    ignoreCache: true,
})
