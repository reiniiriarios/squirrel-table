# SquirrelTable

SquirrelTable is a desktop application that can run MySQL queries over SSH and generate CSV and XLSX files. Useful for QA where queries need to be run repeatedly and files handed off. Typical usage within a team might be to have a directory of SQL files syncing over cloud storage that one person can update and other people can simply open SquirrelTable and run as they need.

![](https://raw.githubusercontent.com/reiniiriarios/squirrel-table/master/screenshots/Screenshot%202021-03-31%20174214.png)

## Latest Release

* [Windows x64 Installer](https://github.com/reiniiriarios/squirrel-table/releases/download/v0.6.0/SquirrelTableSetup.exe)
* [Windows x64 Portable](https://github.com/reiniiriarios/squirrel-table/releases/download/v0.6.0/SquirrelTable-win32-x64-0.6.0.zip)

## Getting Started

After installing, select a directory of SQL files and configure your database connection and SSH settings if connecting through a tunnel.

Any commented lines in SQL files will appear at the bottom of the screen under Comments rather than in-line.

After running a query, results will be displayed. You can then save the results as a CSV or XLSX.

![](https://raw.githubusercontent.com/reiniiriarios/squirrel-table/master/screenshots/Screenshot%202021-03-27%20225608.png)

### Importing and Exporting Settings

If you want to copy your settings to another device or want to quickly set up other users, you can export your settings as a `.json` file. Your login information and SSH key will be encrypted. Upon importing, the SSH key is decrypted and stored alongside the imported preferences file. If you change the key file after importing, the imported key will be deleted.

![](https://raw.githubusercontent.com/reiniiriarios/squirrel-table/master/screenshots/Screenshot%202021-03-27%20221930.png)

## To Do

* Auto-refresh when files in directory change
* Ctrl+F Find in results

## Running & Making from Source

SquirrelTable is built on [Node.js](https://nodejs.org/) with [Electron](https://www.electronjs.org/) using [Electron Forge](https://www.electronforge.io/).

After installing Node.js, if not already installed:

`git clone https://github.com/reiniiriarios/squirrel-table.git`

`cd squirrel-table`

`npm install`

`npm run scss`

See `forge.config.js` for settings. You'll need to edit as needed.

### To Run

`npm start`

### To Make

`npm run make`

## Why "SquirrelTable?"
SQL...SQuirreL :3
