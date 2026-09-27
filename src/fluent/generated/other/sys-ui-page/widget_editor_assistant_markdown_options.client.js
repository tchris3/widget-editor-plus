function weMarkdownChoose(mode) {
    var dialog = GlideModal.prototype.get('widget_editor_assistant_markdown_options');
    if (!dialog) return;
    var callback = dialog.getPreference('onChoice');
    dialog.destroy();
    if (mode !== 'cancel' && typeof callback === 'function') callback(mode);
}
