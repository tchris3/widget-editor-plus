api.controller = function ($scope, spUtil) {
    const c = this;

    if (c.data.hasAccess === false) {
        return;
    }

    const LOCAL_PREFS_KEY = 'we_debug_menu_prefs';

    const DEFAULT_PREFS = {
        // Open with
        openWithEditorPlus: true,
        openWithEditorSP: false,
        openWithFormModal: false,
        openWithPlatform: true,
        // Page
        instanceOptions: true,
        instanceInPageEditor: true,
        pageInDesigner: true,
        openPageInPortal: true,
        // Records
        openRecordInBackend: true,
        // Widget
        showWidgetLoadTimes: true,
        showWidgetCustomizations: true,
        editContainerBackground: true,
        widgetOptionsSchema: true,
        showScopeButtons: true,
        // Embedded widgets
        openEmbeddedWidget: true,
        logEmbeddedScope: true,
        embeddedWidgetEditor: 'openWithEditorPlus',
        // Console logging
        logScopeData: true,
        logScope: true,
        logRootScope: true,
        assignConsoleVars: true
    };

    // Preference modal items, in dropdown order; type:'section' renders a group header.
    c.menuItemDefs = [
        { type: 'section', label: 'Open with' },
        { id: 'openWithEditorPlus', label: 'Widget Editor+' },
        { id: 'openWithEditorSP', label: 'Widget Editor (Service Portal)' },
        { id: 'openWithFormModal', label: 'Form Modal' },
        { id: 'openWithPlatform', label: 'Platform' },

        { type: 'section', label: 'Page' },
        { id: 'instanceOptions', label: 'Instance Options' },
        { id: 'instanceInPageEditor', label: 'Instance in Page Editor' },
        { id: 'pageInDesigner', label: 'Page in Designer' },
        {
            id: 'openPageInPortal',
            label: 'Open page',
            description: 'Only shown when the widget is placed via Page Designer (sp_instance). Prompts for an active portal to open the current page in.'
        },

        { type: 'section', label: 'Record' },
        {
            id: 'openRecordInBackend',
            label: 'Open record',
            description: 'Only shown when the page URL or widget includes <code>table</code> and <code>sys_id</code> parameters.'
        },

        { type: 'section', label: 'Widget' },
        { id: 'showWidgetCustomizations', label: 'Show Widget Customizations' },
        { id: 'widgetOptionsSchema', label: 'Widget Options Schema' },
        { id: 'editContainerBackground', label: 'Edit Container Background' },
        { id: 'showScopeButtons', label: 'Show / hide scope buttons' },
        { id: 'showWidgetLoadTimes', label: 'Show / hide widget load times' },

        { type: 'section', label: 'Embedded widgets' },
        {
            id: 'openEmbeddedWidget',
            label: 'Open embedded widget',
            description: 'Only shown when right-clicking inside a nested (embedded) widget.'
        },
        {
            id: 'embeddedWidgetEditor',
            type: 'select',
            label: 'Default editor',
            options: [
                { value: 'openWithEditorPlus', label: 'Widget Editor+' },
                { value: 'openWithEditorSP', label: 'Widget Editor (Service Portal)' },
                { value: 'openWithFormModal', label: 'Form Modal' },
                { value: 'openWithPlatform', label: 'Platform' }
            ]
        },
        {
            id: 'logEmbeddedScope',
            label: 'Log to console: Embedded $scope',
            description: 'Only shown when right-clicking inside a nested (embedded) widget.'
        },

        { type: 'section', label: 'Console logging' },
        { id: 'logScopeData', label: 'Log to console: $scope.data' },
        { id: 'logScope', label: 'Log to console: $scope' },
        { id: 'logRootScope', label: 'Log to console: $rootScope' },
        {
            id: 'assignConsoleVars',
            label: 'Expose $scope / $rootScope on window',
            description: 'Assigns <code>$scope</code> and <code>$rootScope</code> directly on <code>window</code> to allow access in the browser console.'
        },

    ];

    // Preference source order: localStorage, then sys_user_preference, then defaults.
    // Keyed by realUserId so impersonation doesn't shadow the real user's preferences.
    const userPrefsKey = c.data.realUserId ? (LOCAL_PREFS_KEY + '_' + c.data.realUserId) : LOCAL_PREFS_KEY;

    try {
        const rawPrefs = localStorage.getItem(userPrefsKey) || $scope.data.preferences || localStorage.getItem(LOCAL_PREFS_KEY);
        c.preferences = rawPrefs ? JSON.parse(rawPrefs) : angular.copy(DEFAULT_PREFS);
    } catch (e) {
        c.preferences = angular.copy(DEFAULT_PREFS);
    }

    // Backfill any keys added after the user's preferences were first saved.
    angular.forEach(DEFAULT_PREFS, (val, key) => {
        if (c.preferences[key] === undefined) {
            c.preferences[key] = val;
        }
    });

    c.showPreferencesModal = false;
    c.editPreferences = {};
    c.saving = false;

    /**
     * Opens the preferences modal, populating the edit copy from the current preferences.
     */
    c.openPreferences = function () {
        c.editPreferences = angular.copy(c.preferences);
        c.showPreferencesModal = true;
    };


    /**
     * Closes the preferences modal without saving changes.
     */
    c.closePreferences = function () {
        c.showPreferencesModal = false;
    };


    /**
     * Persists the edited preferences to localStorage and syncs them to the
     * server (sys_user_preference) for cross-device availability.
     */
    c.savePreferences = function () {
        c.saving = true;

        const json = JSON.stringify(c.editPreferences);

        // Persist to user-scoped localStorage key immediately
        if (c.data.realUserId) {
            localStorage.setItem(LOCAL_PREFS_KEY + '_' + c.data.realUserId, json);
        }
        localStorage.setItem(LOCAL_PREFS_KEY, json);

        c.preferences = angular.copy(c.editPreferences);
        c.showPreferencesModal = false;
        c.saving = false;

        // Pass the object directly; SP serializes it to JSON itself, so pre-stringifying double-encodes it.
        $scope.server.get({
            action: 'savePreferences',
            preferences: c.preferences
        });
    };
};
