import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { requestAPI } from './handler';

/**
 * Initialization data for the jlab_homepage extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jlab_homepage:plugin',
  description: 'A JupyterLab extension for homepage with frontend and backend',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension jlab_homepage is activated!');

    requestAPI<any>('get-example')
      .then(data => {
        console.log(data);
      })
      .catch(reason => {
        console.error(
          `The jlab_homepage server extension appears to be missing.\n${reason}`
        );
      });
  }
};

export default plugin;
