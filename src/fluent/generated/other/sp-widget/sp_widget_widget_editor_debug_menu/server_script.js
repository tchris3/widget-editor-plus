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
