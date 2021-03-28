# SquirrelTable

SquirrelTable is a desktop application that can run MySQL queries over SSH and generate CSV files. Useful for QA where queries need to be run repeatedly and CSV files handed off. Typical usage within a team might be to have a directory of SQL files syncing over cloud storage that one person can update and other people can simply open SquirrelTable and run as they need.

![](readme/Screenshot 2021-03-27 225340.png)

## Releases

### Latest Release

* [Windows x64 Installer](https://github.com/reiniiriarios/squirrel-table/releases/download/v0.4.0/SquirrelTableSetup.exe)
* [Windows x64 Portable](https://github.com/reiniiriarios/squirrel-table/releases/download/v0.4.0/SquirrelTable-win32-x64-0.4.0.zip)

## Getting Started

After installing, you'll need to set things up.

![](readme/Screenshot 2021-03-27 222017.png)

Enter your database connection information and, if connecting over SSH, that connection information as well.

![](readme/Screenshot 2021-03-27 221903.png)

Any commented lines will appear at the bottom of the screen rather than in-line.

![](readme/Screenshot 2021-03-27 230710.png)

![](readme/Screenshot 2021-03-27 225340.png)

After running a query, results will be displayed. You can then save the results as a CSV.

![](readme/Screenshot 2021-03-27 225608.png)

### Importing and Exporting Settings

If you want to copy your settings to another device or just want to set up other users, ready-to-go, you can export your settings as a `.json` file. Your login information and SSH key will be encrypted. Upon importing, the SSH key is decrypted and stored alongside the imported preferences file. If you change the key file after importing, the imported key will be deleted.

![](readme/Screenshot 2021-03-27 221930.png)

## To Do

* Auto-refresh when files in directory change
* SQL editor
* UI Themes!

## Running & Making from Source

SquirrelTable is built on [Node.js](https://nodejs.org/) with [Electron](https://www.electronjs.org/) using [Electron Forge](https://www.electronforge.io/).

After installing Node.js, if not already installed:

`git clone https://github.com/reiniiriarios/squirrel-table.git`

`cd squirrel-table`

`npm install`

See `forge.config.js` for settings. You'll need to edit as needed.

### To Run

`npm start`

### To Make

`npm run make`

## Why "SquirrelTable?"
SQL...SQuirreL :3
