import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['widget-editor-properties-module'],
    table: 'sys_app_module',
    data: {
        active: true,
        application: '1c00c11047322100ba13a5554ee490f2',
        filter: 'sys_scope=d65bb60783e7321070b8b5dfeeaad3b2',
        hint: 'All monaco.plus.* system properties',
        link_type: 'LIST',
        mobile_title: 'System Properties',
        mobile_view_name: 'Mobile',
        name: 'sys_properties',
        order: 1478,
        override_menu_roles: true,
        require_confirmation: true,
        roles: ['sp_admin'],
        sys_domain: 'global',
        sys_domain_path: '/',
        title: 'System Properties',
        uncancelable: false,
    },
})
