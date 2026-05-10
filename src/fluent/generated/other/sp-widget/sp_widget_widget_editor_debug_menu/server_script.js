/**
 * Server-side script for the Widget Editor Debug Menu widget.
 *
 * Handles two responsibilities:
 *   1. Saves the user's debug menu preferences to sys_user_preference when
 *      the client sends a savePreferences action.
 *   2. Returns the stored preferences JSON string on every server call so the
 *      client can restore them across devices.
 */
(function () {
    // Check if user has sp_admin role
    var realUser;
    var impersonatedUser = gs.getImpersonatingUserName();

    if (!impersonatedUser && !gs.hasRole('sp_admin')) {
        data.hasAccess = false;
    } else if (impersonatedUser) {
        realUser = gs.getUser().getUserByID(impersonatedUser);
        data.hasAccess = realUser.hasRole('sp_admin');
    } else {
        realUser = gs.getUser();
        data.hasAccess = true;
    }

    if (data.hasAccess === false) {
        return;
    }

    var PREF_KEY = 'we_debug_menu_prefs';

    if (input && input.action === 'savePreferences' && realUser) {
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

        var grSave = new GlideRecordSecure('sys_user_preference');
        grSave.addQuery('user', realUser.getID());
        grSave.addQuery('name', PREF_KEY);
        grSave.query();
        if (grSave.next()) {
            grSave.setValue('value', toStore);
            grSave.update();
        } else {
            grSave.initialize();
            grSave.setValue('user', realUser.getID());
            grSave.setValue('name', PREF_KEY);
            grSave.setValue('value', toStore);
            grSave.setValue('type', 'string');
            grSave.insert();
        }
    }

    if (realUser) {
        // Return stored preferences string; client parses it and backfills defaults.
        var grLoad = new GlideRecordSecure('sys_user_preference');
        grLoad.addQuery('user', realUser.getID());
        grLoad.addQuery('name', PREF_KEY);
        grLoad.query();
        data.preferences = grLoad.next() ? grLoad.getValue('value') : null;
    }
})();
