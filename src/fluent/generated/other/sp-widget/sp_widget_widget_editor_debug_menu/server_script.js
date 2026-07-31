/**
 * Server-side script for the Widget Editor Debug Menu widget.
 *
 * Handles two responsibilities:
 *   1. Saves the user's debug menu preferences to sys_user_preference when
 *      the client sends a savePreferences action.
 *   2. Returns the stored preferences JSON string on every server call so the
 *      client can restore them across devices.
 *
 * Note: When impersonating a user, preferences are always loaded and saved for
 * the real user (impersonator), never the impersonated user.
 */
(function () {
    var PREF_KEY = 'we_debug_menu_prefs';
    var impersonatedUser = gs.getImpersonatingUserName();
    var realUserId = null;
    var hasAccess = false;

    if (impersonatedUser) {
        // When impersonating, gs.getImpersonatingUserName() returns the username of the real user
        var grUser = new GlideRecord('sys_user');
        grUser.addQuery('user_name', impersonatedUser);
        grUser.query();
        if (grUser.next()) {
            realUserId = grUser.getValue('sys_id');
        }

        if (realUserId) {
            var grRole = new GlideRecord('sys_user_has_role');
            grRole.addQuery('user', realUserId);
            grRole.addQuery('role.name', 'IN', 'sp_admin,admin');
            grRole.query();
            hasAccess = grRole.hasNext();
        }
    } else {
        // Not impersonating — real user is current session user
        realUserId = gs.getUserID();
        hasAccess = gs.hasRole('sp_admin');
    }

    data.hasAccess = hasAccess;
    data.isImpersonating = !!impersonatedUser;
    data.realUserId = realUserId;

    if (data.hasAccess === false || !realUserId) {
        return;
    }

    // Resolves the sp_page (id/title) that an sp_instance record is placed on by
    // walking sp_instance -> sp_column -> sp_row -> sp_container -> sp_page.
    var resolvePageForInstance = function (grInstance) {
        var grColumn = new GlideRecordSecure('sp_column');
        if (!grColumn.get(grInstance.getValue('sp_column'))) {
            return null;
        }
        var grRow = new GlideRecordSecure('sp_row');
        if (!grRow.get(grColumn.getValue('sp_row'))) {
            return null;
        }
        var grContainer = new GlideRecordSecure('sp_container');
        if (!grContainer.get(grRow.getValue('sp_container'))) {
            return null;
        }
        var grPage = new GlideRecordSecure('sp_page');
        if (!grPage.get(grContainer.getValue('sp_page'))) {
            return null;
        }
        return { id: grPage.getValue('id'), title: grPage.getValue('title') };
    };

    if (input && input.action === 'getOpenPageOptions') {
        var result = { instances: [], portals: [] };

        // A widget can be placed via more than one sp_instance (e.g. on several
        // pages), so every active instance is resolved and offered separately —
        // the client shows an instance picker (labeled by page) when there's more than one.
        if (input.widgetSysId) {
            var grInstances = new GlideRecordSecure('sp_instance');
            grInstances.addQuery('sp_widget', input.widgetSysId);
            grInstances.addQuery('active', true);
            grInstances.setLimit(200);
            grInstances.query();
            while (grInstances.next()) {
                var page = resolvePageForInstance(grInstances);
                if (page) {
                    result.instances.push({
                        instanceSysId: grInstances.getValue('sys_id'),
                        pageId: page.id,
                        pageTitle: page.title
                    });
                }
            }
            result.instances.sort(function (a, b) {
                return (a.pageTitle || '').localeCompare(b.pageTitle || '');
            });
        }

        var grPortal = new GlideRecordSecure('sp_portal');
        // "inactive" is blank/unset on most portals (that also means active), not
        // explicitly "false" — an exact-match query on false alone misses those.
        grPortal.addEncodedQuery('inactive=false^ORinactiveISEMPTY');
        grPortal.orderBy('title');
        grPortal.query();
        while (grPortal.next()) {
            result.portals.push({
                sys_id: grPortal.getValue('sys_id'),
                title: grPortal.getValue('title'),
                url_suffix: grPortal.getValue('url_suffix')
            });
        }

        data.openPageOptions = result;
    }

    if (input && input.action === 'savePreferences') {
        /*
         * input.preferences is a Java-backed object in Rhino — serialise it to a
         * JSON string before storing.  Passing it as an object from the client
         * (rather than a pre-stringified string) avoids SP's double-encoding bug.
         */
        var toStore = '';
        try {
            toStore = JSON.stringify(input.preferences) || '{}';
        } catch (e) {
            toStore = '{}';
        }

        // Use GlideRecord (not GlideRecordSecure) so the real user's preference record can be updated even when impersonating
        var grSave = new GlideRecord('sys_user_preference');
        grSave.addQuery('user', realUserId);
        grSave.addQuery('name', PREF_KEY);
        grSave.query();
        if (grSave.next()) {
            grSave.setValue('value', toStore);
            grSave.update();
        } else {
            grSave.initialize();
            grSave.setValue('user', realUserId);
            grSave.setValue('name', PREF_KEY);
            grSave.setValue('value', toStore);
            grSave.setValue('type', 'string');
            grSave.insert();
        }
    }

    // Return stored preferences string of the real user; client parses it and backfills defaults.
    // Use GlideRecord (not GlideRecordSecure) so the real user's preference record can be loaded even when impersonating.
    var grLoad = new GlideRecord('sys_user_preference');
    grLoad.addQuery('user', realUserId);
    grLoad.addQuery('name', PREF_KEY);
    grLoad.query();
    data.preferences = grLoad.next() ? grLoad.getValue('value') : null;
})();
