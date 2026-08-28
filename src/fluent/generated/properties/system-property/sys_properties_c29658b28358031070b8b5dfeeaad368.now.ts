import { Property } from '@servicenow/sdk/core'

export const widgetDeprecatedProperty = Property({
    $id: Now.ID['c29658b28358031070b8b5dfeeaad368'],
    $meta: { installMethod: 'first install' },
    name: 'monaco.plus.widget.deprecated',
    value: 'descriptionLIKEdeprecated',
    description:
        'An encoded query string which if evaluates to true for the sp_widget record, sets the widget as deprecated.',
    ignoreCache: true,
})
