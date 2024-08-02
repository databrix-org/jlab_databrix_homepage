import {
  ILabShell,
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import {IDefaultFileBrowser } from '@jupyterlab/filebrowser';

import {
  ICommandPalette,
  MainAreaWidget,
} from '@jupyterlab/apputils';

import {DockPanel, TabBar, Widget } from '@lumino/widgets';
import { toArray } from '@lumino/algorithm';

import { requestAPI } from './handler';
import { databrixWidget } from './databrixwidget'

/**
 * Initialization data for the jlab_homepage extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jlab_homepage:plugin',
  description: 'A JupyterLab extension for databrix homepage with frontend and backend',
  autoStart: true,
  requires: [ICommandPalette,ILabShell],
  optional: [ILayoutRestorer],
  activate: activate
};


function activate(app: JupyterFrontEnd,
                palette: ICommandPalette,
                labShell: ILabShell,
                restorer: ILayoutRestorer | null,
                defaultBrowser: IDefaultFileBrowser | null) {
  console.log('JupyterLab extension databrix homepage is activated!');



  let rolle: boolean | null = null;

  requestAPI<any>('gruppeninfo')
    .then(UserData => {
       rolle = UserData.dozent;
    })

    .catch(reason => {
      console.error(
        `The jlab_homepage server extension appears to be missing.\n${reason}`
      );
  });


  const username = app.serviceManager.user?.identity?.username;

  // Declare a widget variable
  let widget: MainAreaWidget<databrixWidget>;

  // Add an application command
  const command: string = 'launcher:create';
  app.commands.addCommand(command, {
    label: 'Databrix Lab Homepage',

    execute: () => {

      const content = new databrixWidget(username ?? "unknown", rolle ?? false);
      widget = new MainAreaWidget({content});
      const id = `home-${Private.id++}`;
      widget.id = id
      widget.title.label = 'Databrix Lab Homepage';
      widget.title.closable = true;

      app.shell.add(widget, 'main');

      app.shell.activateById(widget.id);

      labShell.layoutModified.connect(() => {
        // If there is only a launcher open, remove the close icon.
        widget.title.closable = toArray(app.shell.widgets('main')).length > 1;
      }, widget);
    }
  });

  if (labShell) {
    void Promise.all([app.restored, defaultBrowser?.model.restored]).then(
      () => {
        function maybeCreate() {
          // Create a launcher if there are no open items.
          if (labShell!.isEmpty('main')) {
            void app.commands.execute(command);
          }
        }
        // When layout is modified, create a launcher if there are no open items.
        labShell.layoutModified.connect(() => {
          maybeCreate();
        });
      }
    );
  }

  palette.addItem({
    command: command,
    category: ('Databrix')
  });

  if (labShell) {
    labShell.addButtonEnabled = true;
    labShell.addRequested.connect((sender: DockPanel, arg: TabBar<Widget>) => {
      // Get the ref for the current tab of the tabbar which the add button was clicked
      const ref =
        arg.currentTitle?.owner.id ||
        arg.titles[arg.titles.length - 1].owner.id;

      return app.commands.execute(command, { ref });
    });
  }


};

export default plugin;

/**
* The namespace for module private data.
*/
namespace Private {

export let id = 0;
}
