import { createApp, reactive } from 'vue';
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import QuizToolComponent from './QuizTool.vue';

export default class QuizTool {
  static get toolbox() {
    return {
      title: 'Quiz',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>`,
    };
  }

  constructor({ data, config, api, readOnly }) {
    this.api = api;
    this.readOnly = readOnly;
    this.config = config || {};
    this.data = data || {};
    this._container = null;
    this._app = null;
  }

  render() {
    this._container = document.createElement('div');
    this._container.classList.add('quiz-tool-wrapper');

    this._app = createApp(QuizToolComponent, {
      initialData: reactive({ ...this.data }),
      config: this.config,
      readOnly: this.readOnly,
      onSave: (updated) => Object.assign(this.data, updated),
    });

    this._app.use(PrimeVue, {
      theme: {
        preset: Aura,
        options: { darkModeSelector: false },
      },
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
