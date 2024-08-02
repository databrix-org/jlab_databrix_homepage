import {
  showDialog,
  Dialog,
} from '@jupyterlab/apputils';
import { InfoWidget } from './infowidget'
import { PageConfig } from '@jupyterlab/coreutils';

export async function showgroupinfo(username: string, hubmainUrl: string) {

  try {
    const url = new URL(window.location.href);
    const pathParts = url.pathname.split('/user/');
    if (pathParts.length > 1) {
      const subpath = pathParts[1].split('/')[0];
      console.log('Subpath after /user/:', subpath);
      alert(`Subpath after /user/: ${subpath}`);
    } else {
      console.log('No subpath after /user/ found');
      alert('No subpath after /user/ found');
    }
    const group_name = pathParts.find(part => part.includes("_"))?.split("_")[1] || "";
    const hubapiEndpointUrl = `${hubmainUrl}/hub/api/groups/${group_name}`;


    const token = PageConfig.getToken();
    if (!token) {
       throw new Error('API token is not available from PageConfig.');
       }

       let responseData: any;
       let groupmem: any;

       try {
           const response = await fetch(hubapiEndpointUrl, {
               method: 'GET',
               headers: {
                   'Content-Type': 'application/json',
                   'Authorization': `token ${token}`,
               }
           });

           if (!response.ok) {
               throw new Error(`Network response was not ok: ${response.statusText}`);
           }

           responseData = await response.json();
           console.log('Response Data:', responseData);
           groupmem = {"Ihre Gruppe" : [group_name], "Ihre Teammates": responseData["users"]}



       } catch (error) {
           console.error('Error fetching data:', error);
           groupmem = {"users": [error]}
       }


    const dialogwidget = new InfoWidget(groupmem);

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
