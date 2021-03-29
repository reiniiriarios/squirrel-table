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
      setTimeout(() => {
        updateProgress = false;
        updateButton.attr('disabled',false).removeClass('disabled').text('Check for Updates');
        updateStatusMsg.text(' ');
      }, 5000);
      break;
    default:
      updateButton.attr('disabled',true).addClass('disabled').text('Checking');
      ipcRenderer.send('check-for-updates');
  }
});

ipcRenderer.on('update-available',(event, downloadUrl) => {
  updateDownloadLink = downloadUrl;
  updateProgress = 'update-available';
  updateButton.attr('disabled',false).removeClass('disabled').text('Download Update');
  updateStatusMsg.text('Update Available');
});
ipcRenderer.on('update-not-available',(event) => {
  updateProgress = false;
  updateButton.attr('disabled',false).removeClass('disabled').text('Check for Updates');
  updateStatusMsg.text('No Updates Available');
});

ipcRenderer.on('update-error',(event, error) => {
  updateProgress = false;
  updateButton.attr('disabled',false).removeClass('disabled').text('Check for Updates');
  updateStatusMsg.html('<span class="error">Error updating, see log for details</span>');
  console.log(error);
});