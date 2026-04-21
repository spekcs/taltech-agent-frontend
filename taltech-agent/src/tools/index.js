import { createApp, reactive } from 'vue';
import ChatToolComponent from './ChatTool.vue';

export default class ChatTool {
  static get toolbox() {
    return {
      title: 'Chat',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>`,
    };
  }

  static get isReadOnlySupported() {
    return true;
  }

  constructor({ data, config, api, readOnly }) {
    this.api = api;
    this.readOnly = readOnly;
    this.config = config || {};

    this.data = {
      messages: data?.messages || [],
      systemPrompt: data?.systemPrompt || config?.systemPrompt || 'You are a helpful assistant.',
      model: data?.model || config?.model || 'gpt-4o',
    };

    this._container = null;
    this._app = null;
  }

  render() {
    this._container = document.createElement('div');
    this._container.classList.add('chat-tool-wrapper');

    this._app = createApp(ChatToolComponent, {
      initialData: reactive({ ...this.data }),
      readOnly: this.readOnly,
      endpoint: this.config.endpoint,
      getContext: this.config.getContext || null,
      onSave: (updated) => Object.assign(this.data, updated),
    });

    this._app.mount(this._container);
    return this._container;
  }

  save() {
    return { ...this.data };
  }

  destroy() {
    this._app?.unmount();
  }
}
