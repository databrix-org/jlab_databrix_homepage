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
  showDialog,
  Dialog,
} from '@jupyterlab/apputils';

import {DockPanel, TabBar, Widget } from '@lumino/widgets';
import { toArray } from '@lumino/algorithm';

import { requestAPI } from './handler';


class databrixWidget extends Widget {
    /**
    * Construct a new databrix widget.
    */

    constructor(username: string) {
      super();

      this.addClass('my-apodWidget');
      
      this.node.innerHTML = `

        <div class="container">
            <h1>Databrix Lab</h1>
            <p class="subtitle">Lernen Sie Data Science und Machine Learning in der Praxis!</p>
        </div>

        <div class="button-container">        
            <button data-commandLinker-command="nbgrader:open-assignment-list" class="button">
                <div class="icon"></div>
                <span>Praxisprojekte starten</span>
            </button>
      
            <button id = "switchGroupButton" class="button secondary">
                <div class="icon"></div>
                <span>Mein Workspace</span>
            </button>
        </div>
          `;
    
      const switchGroupButton = this.node.querySelector('#switchGroupButton') as HTMLButtonElement;
      switchGroupButton.addEventListener('click', () => {
        this.showgroupinfo(username);
      });
    }

    async showgroupinfo(username: string) {
      try {
        const dataToSend = {"username":username}
        const data = await requestAPI<any>('gruppeninfo',{
                                            body: JSON.stringify(dataToSend),
                                            method: 'POST'});
        
        showDialog({
          title: 'Workspace Information',
          body: `
              Sie sind in der Gruppe: ${data.workspace}
              Ihre Teammates sind: ${data.members.join(';')}
          `,
          buttons: [Dialog.okButton()]          
        });

        showDialog({
          title: 'Workspace Information',
          body: `
              Bei Fragen oder Gruppenänderungen kontaktieren Sie uns bitte an admin@databrix.org!
          `,
          buttons: [Dialog.okButton()]
        });

      } catch (error: any) {
        let errorMessage = 'Could not retrieve group information.';
        if (error.response && error.response.status === 404) {
          errorMessage = 'Server endpoint not found.';
        } else if (error.message) {
          errorMessage = error.message;
        }

        
        showDialog({
          title: 'Error',
          body: errorMessage,
          buttons: [Dialog.okButton()]
        });
      }
    }

}

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


  const user = app.serviceManager.user;
  const username = app.serviceManager.user?.identity?.username;
  user.ready.then(() => {
     console.debug("Identity:", user.identity);
     console.debug("Permissions:", user.permissions);
  });

  // Declare a widget variable
  let widget: MainAreaWidget<databrixWidget>;

  // Add an application command
  const command: string = 'launcher:create';
  app.commands.addCommand(command, {
    label: 'Databrix Lab Homepage',
  
    execute: () => {
   
      const content = new databrixWidget(username ?? "unknown");
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

