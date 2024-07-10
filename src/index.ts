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


interface GroupInfo { 
  [key: string]: string[];
}


class InfoWidget extends Widget {
    /**
    * Construct a new databrix widget.
    */

    constructor(group_info: GroupInfo) {
      super();

      const jsonData = group_info as GroupInfo
      
      this.addClass('my-apodWidget');

      // Create container and add it to the widget
      const groupContainer = document.createElement('div');
      groupContainer.id = 'groupContainer';

      this.node.innerHTML = `

        <h2>Workspace</h2>
        <h4>Bei Fragen oder Gruppenwechsel kontaktieren Sie uns bitte über admin@databrix.org</h4>
      `;

      this.node.appendChild(groupContainer);

      for (const group in jsonData) {
        // Create card element
        const card = document.createElement("div");
        card.classList.add("card");

        // Create group name
        const groupName = document.createElement("div");
        groupName.classList.add("group-name");
        groupName.textContent = group;

        // Create items container
        const groupItems = document.createElement("div");
        groupItems.classList.add("group-items");

        // Add items to container
        jsonData[group].forEach(item => {
          const listItem = document.createElement("div");
          listItem.textContent = `- ${item}`;
          groupItems.appendChild(listItem);
        });

        // Append to card
        card.appendChild(groupName);
        card.appendChild(groupItems);

        // Append card to main container
        groupContainer.appendChild(card);
      }
    }
}

class databrixWidget extends Widget {
    /**
    * Construct a new databrix widget.
    */

    constructor(username: string, rolle: boolean) {
      super();

      const buttonContainer = document.createElement('div');
      buttonContainer.classList.add("button-container");      
      this.addClass('my-apodWidget');
      
      // Get a reference to the button container
      this.node.innerHTML = `
        <div class="container">
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
          <button id="switchGroupButton" class="button secondary">
            <div class="icon"></div>
            <span>Workspace Infos</span>
          </button>
        `;
      } else {
        buttonContainer.innerHTML = `
          <button data-commandLinker-command="nbgrader:open-assignment-list" class="button">
            <div class="icon"></div>
            <span>Projekte starten</span>
          </button>
          <button id="switchGroupButton" class="button secondary">
            <div class="icon"></div>
            <span>Mein Workspace</span>
          </button>
        `;
      }
    
      const switchGroupButton = this.node.querySelector('#switchGroupButton') as HTMLButtonElement;
      switchGroupButton.addEventListener('click', () => {
        this.showgroupinfo(username,rolle);
      });
    }

    async showgroupinfo(username: string, rolle: boolean) {
      try {
        const dataToSend = {"username":username, "Rolle":rolle}
        const data = await requestAPI<any>('gruppeninfo',{
                                            body: JSON.stringify(dataToSend),
                                            method: 'POST'});

        const dialogwidget = new InfoWidget(data);
  
        showDialog({
          title: 'Workspace Information',
          body: dialogwidget,
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

