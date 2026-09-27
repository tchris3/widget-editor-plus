import { UiPage } from '@servicenow/sdk/core'

UiPage({
    $id: Now.ID['widget-editor-assistant-markdown-options-page'],
    category: 'general',
    endpoint: 'widget_editor_assistant_markdown_options.do',
    description: 'Choose combined or separate headings when copying several update sets as Markdown.',
    html: `<?xml version="1.0" encoding="utf-8" ?>
<j:jelly trim="false" xmlns:j="jelly:core" xmlns:g="glide">
  <div style="padding:20px;font-family:Arial,sans-serif">
    <p>How should the selected update sets appear in Markdown?</p>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:24px">
      <button type="button" class="btn btn-default" onclick="weMarkdownChoose('cancel')">Cancel</button>
      <button type="button" class="btn btn-default" onclick="weMarkdownChoose('combined')">Combine</button>
      <button type="button" class="btn btn-primary" onclick="weMarkdownChoose('separate')">Separate by update set</button>
    </div>
  </div>
</j:jelly>`,
    clientScript: Now.include('./widget_editor_assistant_markdown_options.client.js'),
})
