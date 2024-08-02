import {Widget } from '@lumino/widgets';
import {showgroupinfo} from './showgroupinfo'
import { PageConfig } from '@jupyterlab/coreutils';

export class databrixWidget extends Widget {
    /**
    * Construct a new databrix widget.
    */

    constructor(username: string, rolle: boolean) {
      super();
      const baseUrl = PageConfig.getBaseUrl()
      const urlObj = new URL(baseUrl);
      const path = urlObj.pathname;
      const fullUrl = window.location.origin;   // e.g., https://example.org
      let jupyterhubBaseUrl: string;
      // Check if the baseUrl contains '/user/'
      if (path.includes('/user/')) {
        // Extract everything before '/user/'
        jupyterhubBaseUrl = `${fullUrl}${path.split('/user/')[0]}`;
      } else {
        // If '/user/' is not present, use the baseUrl directly
        jupyterhubBaseUrl = `${fullUrl}`;
      }
      const hubmainUrl = `${jupyterhubBaseUrl}`
      const admingroupUrl = `${jupyterhubBaseUrl}/hub/admin#/groups`

      const buttonContainer = document.createElement('div');
      buttonContainer.classList.add("button-container");
      this.addClass('my-apodWidget');

      // Get a reference to the button container
      this.node.innerHTML = `
        <div class="home-container">
          <h1>Databrix Lab</h1>
          <p class="subtitle">Lernen Sie Data Science und Machine Learning in der Praxis!</p>
        </div>
      `;
      this.node.appendChild(buttonContainer);

      if (rolle) {
        buttonContainer.innerHTML = `
          <button data-commandLinker-command="nbgrader:open-formgrader" class="button">
            <div class="icon"></div>
            <span>Projekte verwalten</span>
          </button>
          <button class="button secondary" onclick="window.location.href = ${admingroupUrl};">
            <div class="icon admin-icon"></div>
            <span>Gruppen verwalten</span>
          </button>
          <button data-commandLinker-command="forum:open" class="button">
            <div class="icon"></div>
            <span>Q&A Forum</span>
          </button>
        `;
      } else {
        buttonContainer.innerHTML = `
          <button data-commandLinker-command="nbgrader:open-assignment-list" class="button">
            <div class="icon"></div>
            <span>Projekte starten</span>
          </button>
          <button id="GroupInfoButton" class="button secondary">
            <div class="icon"></div>
            <span>Mein Workspace</span>
          </button>
          <button data-commandLinker-command="forum:open" class="button">
            <div class="icon"></div>
            <span>Q&A Forum</span>
          </button>
        `;
        const switchGroupButton = this.node.querySelector('#GroupInfoButton') as HTMLButtonElement;
        switchGroupButton.addEventListener('click', () => {
          showgroupinfo(username, hubmainUrl);
        });
      }

    }

}
