# SquirrelTable

SquirrelTable is a desktop application that can run MySQL queries over SSH and generate CSV files. Useful for QA where queries need to be run repeatedly and CSV files handed off. Typical usage within a team might be to have a directory of SQL files syncing over cloud storage that one person can update and other people can simply open SquirrelTable and run as they need.

## Releases

### Latest Release

* [Windows x64 Installer](https://github.com/reiniiriarios/squirrel-table/releases/download/v0.4.0/SquirrelTableSetup.exe)
* [Windows x64 Portable](https://github.com/reiniiriarios/squirrel-table/releases/download/v0.4.0/SquirrelTable-win32-x64-0.4.0.zip)

## Getting Started

to do

## To Do

* Auto-refresh when files in directory change
* SQL editor

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
