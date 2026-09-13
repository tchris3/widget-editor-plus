import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['widget-editor-code-search-module'],
    table: 'sys_app_module',
    data: {
        active: true,
        application: '1c00c11047322100ba13a5554ee490f2',
        link_type: 'DIRECT',
        mobile_title: 'Widget Editor+ Code Search',
        mobile_view_name: 'Mobile',
        order: 1474,
        override_menu_roles: true,
        query: 'ui_page.do?sys_id=e7d81afae74144a89136e51d5cc38c09',
        require_confirmation: true,
        roles: ['sp_admin'],
        sys_domain: 'global',
        sys_domain_path: '/',
        title: 'Widget Editor+ Code Search',
        uncancelable: false,
    },
})
