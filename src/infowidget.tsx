import {Widget } from '@lumino/widgets';

export class InfoWidget extends Widget {


    constructor(group_info: { [key: string]: string[] }) {
      super();

      const jsonData = group_info as { [key: string]: string[] }

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
