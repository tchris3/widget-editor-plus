# ServiceNow UI page links

Modules that open UI pages must use `ui_page.do?sys_id=<ui_page.sys_id>` with the page's verified sys_id. Do not link modules directly to a UI page by its name (for example, `widget_editor_plus_properties.do`).
