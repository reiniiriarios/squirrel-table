let updateButton = $('#update-button');
let updateStatusMsg = $('#update-status');

let updateProgress = false;

updateButton.on('click',() => {
  if (updateButton.attr('disabled')) return false;

  switch (updateProgress) {
    case 'update-available':
      updateButton.attr('disabled',true).addClass('disabled').text('Downloading');
      ipcRenderer.send('download-update');
      break;
    case 'update-downloaded':
      updateButton.attr('disabled',true).addClass('disabled').text('Installing');
      ipcRenderer.send('update-app');
      break;
    default:
      updateButton.attr('disabled',true).addClass('disabled').text('Checking');
      ipcRenderer.send('check-for-updates');
  }
});

ipcRenderer.on('update-available',(event) => {
  updateProgress = 'update-available';
  updateButton.attr('disabled',false).removeClass('disabled').text('Download Update');
  updateStatusMsg.text('Update Available');
});
ipcRenderer.on('update-not-available',(event) => {
  updateProgress = false;
  updateButton.attr('disabled',true).addClass('disabled').text('Check for Updates');
  updateStatusMsg.text('No Updates Available');
});
ipcRenderer.on('download-progress',(event, progressObj) => {
  updateStatusMsg.text(progressObj.percent + '% (' + progressObj.transferred + '/' + progressObj.total + ')');
})
ipcRenderer.on('update-downloaded',(event) => {
  updateProgress = 'update-downloaded';
  updateButton.attr('disabled',false).removeClass('disabled').text('Update & Quit');
  updateStatusMsg.text('Update downloaded');
});
ipcRenderer.on('update-error',(event, error) => {
  updateProgress = false;
  updateButton.attr('disabled',false).removeClass('disabled').text('Check for Updates');
  updateStatusMsg.html('<span class="error">Error updating, see log for details</span>');
});