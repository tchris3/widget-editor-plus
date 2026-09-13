import { Record } from '@servicenow/sdk/core'

// Blank separator closing the Widget Editor+ group so later modules (e.g. CSS) aren't swept into it.
Record({
    $id: Now.ID['widget-editor-group-end-module'],
    table: 'sys_app_module',
    data: {
        active: true,
        application: '1c00c11047322100ba13a5554ee490f2',
        link_type: 'SEPARATOR',
        order: 1490,
        override_menu_roles: false,
        require_confirmation: false,
        sys_domain: 'global',
        sys_domain_path: '/',
        uncancelable: false,
    },
})
