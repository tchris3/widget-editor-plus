import { Property } from '@servicenow/sdk/core'

Property({
    $id: Now.ID['abbb004383d4831070b8b5dfeeaad365'],
    name: 'monaco.plus.widget.related_list_exclusions',
    value: '',
    description:
        'Excludes sp_widget related lists using a comma-separated lists of sys_ui_related_list_entry.related_list values.',
    ignoreCache: true,
    roles: {
        read: ['sp_admin'],
    },
})
