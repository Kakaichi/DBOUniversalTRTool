# DBO Universal Translation Tool

A modern desktop application built with Electron, React, and TypeScript for the Dragon Ball Online community.

## 🐉 Welcome to the DBO Community!

This project is dedicated to the amazing Dragon Ball Online community and all the passionate translators, developers, and players who keep this incredible game alive. Your dedication to bringing DBO to players worldwide is truly inspiring!

### 🙏 Special Thanks

This project builds upon the incredible work of the DBO community:

- **GrenderG** and the [OpenDBO-Localization](https://github.com/OpenDBO/OpenDBO-Localization) team for their comprehensive translation work and tools that make DBO accessible to players globally
- **SengokuNadeko** and **SANGAWKU** for their original [DBOTWCrypt](https://github.com/keykk/DBOTWCrypt) tool that inspired this modern implementation
- All the translators, contributors, and community members who have worked tirelessly on DBO localization projects

Your contributions have made this project possible, and we're grateful for the foundation you've built for the DBO community! 🚀

## Features

- ⚛️  React 18 with TypeScript
- 🖥️  Electron 27
- 🛠️  Webpack + Babel bundling
- 📄 RDF/XML Parser for Dragon Ball Online Translation Files
- 🔁 Convert RDF ↔️ XML for Quest and Text tables
- ✏️  Edit translations
- 💾 Save RDF or EDF directly as XML

## Requirements

- [Node.js](https://nodejs.org/) (v14+)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Python 3.x](https://www.python.org/downloads/) (for launcher)

## Installation

Inside your project folder, after installing all requirements, use the follwing commands

```bash
npm install
```

## Usage

### Option 1: Using Python Launcher
```bash
python launcher.py
```

### Option 2: Direct Launch
```bash
npm start
```

### Building Windows Executable (.exe)
```bash
npm run build-exe
```

This creates two files in the `release/` folder:
- **DBO Universal Translation Tool Portable.exe** - Portable version (no installation needed)
- **DBO Universal Translation Tool Setup.exe** - Windows installer

The executable has the difference of:
- ✅ No dev bar (clean interface)
- ✅ Auto build versioning

## Project Structure

```
DBOTWCrypt-Python/
├── dist/             # Build output
├── EDF/              # Sample EDF files
├── RDF/              # Sample RDF files
├── XML/              # Sample XML files
├── public/           # Static files (HTML template)
├── release/          # Compiled executables (gitignored)
├── scripts/          # Build scripts
│   └── increment-version.js  # Auto-increment version on build
├── src/              # Source code
│   ├── components/   # React components
│   │   ├── App.tsx          # Main app component
│   │   ├── ConverterTab.tsx # File converter UI
│   │   └── EditorTab.tsx    # Text editor UI
│   ├── hooks/        # Custom React hooks
│   │   ├── useFileConversion.ts  # File conversion logic
│   │   ├── useFileHandling.ts    # File selection & type detection
│   │   ├── useLogging.ts         # Log management
│   │   └── useTextEditor.ts      # Text editor state
│   ├── types/        # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/        # Utility functions
│   │   └── rdfParser.ts  # RDF/XML/EDF parser
│   ├── App.css       # Global styles
│   └── index.tsx     # React entry point
├── main.js          # Electron main process
├── launcher.py      # Python launcher script
├── package.json     # Dependencies and scripts
├── tsconfig.json    # TypeScript configuration
└── webpack.config.js # Webpack bundler config
```

## Technologies

- Electron, React, TypeScript, NodeJs, Webpack, Babel

## License

MIT
