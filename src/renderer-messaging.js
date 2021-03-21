const showError = (message) => {
  errorStatus(message);
  ipcRenderer.send('log-error', message);
}
function updateStatus(status) {
  statusText.text(status);
}
function errorStatus(status) {
  statusText.html('<span class="err">' + status + '</span>');
}
function clearStatus(timeout=2000) {
  setTimeout(() => {
    statusText.text(' ');
  }, timeout);
}
ipcRenderer.on('update-status', (event, status) => {
  updateStatus(status);
});
ipcRenderer.on('error-status', (event, status) => {
  errorStatus(status);
});