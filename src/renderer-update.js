let updateButton = $('#update-button');
let updateStatusMsg = $('#update-status');

let updateProgress = false;

let updateDownloadLink;

updateButton.on('click',(event) => {
  if (updateButton.attr('disabled')) return false;

  switch (updateProgress) {
    case 'update-available':
      event.preventDefault();
      shell.openExternal(updateDownloadLink);
      updateButton.attr('disabled',true).addClass('disabled').text('Downloading');
      break;
    /*
    STOP: Cannot continue with autoupdater without digitally signing updates

    case 'update-available':
      updateButton.attr('disabled',true).addClass('disabled').text('Downloading');
      ipcRenderer.send('download-update');
      break;
    case 'update-downloaded':
      updateButton.attr('disabled',true).addClass('disabled').text('Installing');
      ipcRenderer.send('update-app');
      break;
    */
    default:
      updateButton.attr('disabled',true).addClass('disabled').text('Checking');
      ipcRenderer.send('check-for-updates');
  }
});

ipcRenderer.on('update-available',(event, info) => {
  info.files.forEach(file => {
    // separate by platform here
    if (file.url.substr(file.url.length - 4) == '.exe') {
      updateDownloadLink = file.url;
      updateProgress = 'update-available';
      updateButton.attr('disabled',false).removeClass('disabled').text('Download Update');
      updateStatusMsg.text('Update Available');
    }
  });
  setTimeout(() => {
    if (updateDownloadLink.length == 0) {
      updateProgress = false;
      updateButton.attr('disabled',false).removeClass('disabled').text('Check for Updates');
      updateStatusMsg.html('<span class="error">Error updating, see log for details</span>');
      console.log('No appropriate download found.');
      console.log(info);
    }
  }, 500);
});
ipcRenderer.on('update-not-available',(event) => {
  updateProgress = false;
  updateButton.attr('disabled',false).removeClass('disabled').text('Check for Updates');
  updateStatusMsg.text('No Updates Available');
});

/*
STOP: Cannot continue with autoupdater without digitally signing updates

ipcRenderer.on('download-progress',(event, progressObj) => {
  updateStatusMsg.text(progressObj.percent + '% (' + progressObj.transferred + '/' + progressObj.total + ')');
})
ipcRenderer.on('update-downloaded',(event) => {
  updateProgress = 'update-downloaded';
  updateButton.attr('disabled',false).removeClass('disabled').text('Update & Quit');
  updateStatusMsg.text('Update downloaded');
});
*/

ipcRenderer.on('update-error',(event, error) => {
  updateProgress = false;
  updateButton.attr('disabled',false).removeClass('disabled').text('Check for Updates');
  updateStatusMsg.html('<span class="error">Error updating, see log for details</span>');
  console.log(error);
});