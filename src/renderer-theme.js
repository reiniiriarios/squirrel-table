let themeSheet = $('#theme');

const themes = [
  'default',
  'merbitch',
  'github'
];

const setTheme = (theme) => {
  if (themes.indexOf(theme) == -1) {
    console.log('Undefined theme: ' + theme);
  }
  else {
    let newSheet = document.createElement('link');
    newSheet.setAttribute('id', 'theme-'+theme);
    newSheet.setAttribute('rel', 'stylesheet');
    newSheet.setAttribute('type', 'text/css');
    newSheet.setAttribute('href', 'style-'+theme+'.css');
    $('head').append(newSheet);
    $('.theme-choice').removeClass('selected');
    $('#theme-choice-'+theme).addClass('selected');
    // a timeout prevents odd flashing behavior when the previous css is removed too soon
    setTimeout(() => {
      themeSheet.remove();
      themeSheet = $('#theme-'+theme);
    },1000);
    ipcRenderer.send('update-preferences','theme',theme);
  }
}

$('.theme-choice').on('click', event => {
  let choice = $(event.target).parents('.theme-choice').attr('data-theme');
  setTheme(choice);
});