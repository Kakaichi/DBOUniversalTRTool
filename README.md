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
- 📄 RDF/XML/EDF Parser for Dragon Ball Online Translation Files
- 🔁 Convert RDF ↔️ XML ↔️ EDF for Quest and Text tables
- ✏️  Edit translations with search and pagination
- 💾 Save RDF or EDF directly as XML
- 🔐 XML-based XOR key configuration system
- 🔒 Encrypt/Decrypt files with custom XOR keys

## Requirements

- [Node.js](https://nodejs.org/) (v14+)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Python 3.x](https://www.python.org/downloads/) (for launcher)

## Installation

Inside your project folder, after installing all requirements, use the following commands:

```bash
npm install
```

## Configuration

### XOR Key Setup (Required for EDF Encryption/Decryption)


1. **Edit `config.xml`** and paste your client XOR key in hex format:
   ```xml
   <config>
     <description>XOR Key Configuration</description>
     <note>Paste your Client XOR Key here</note>
     <xorkey>
     0x77, 0x9b, 0xd0, 0x74, 0xfb, 0x00, 0x49, 0xb4, ...
     </xorkey>
   </config>
   ```

2. **Save the file** in the same folder as the executable

## Usage

You can run the application in 3 ways. Third option is a proof of concept that application supports to be hosted in a website.


### Option 1: Using Python Launcher, it will install all dependences and run Electron application
```bash
python launcher.py
```

### Option 2: Direct Launch
```bash
npm start
```

### Option 3: Webserver mode (Browser mode)
```bash
npm run webserver
```

### Building Windows Executable (.exe)
```bash
npm run build
```

This creates two files in the `release/` folder:
- **DBO Universal Translation Tool Portable.exe** - Portable version (no installation needed)
- **DBO Universal Translation Tool Setup.exe** - Windows installer

## Project Structure

```
DBOUniversalTRTool/
├── dist/                  # Webpack build output
├── public/                # Static files (HTML template)
│   └── index.html         # Contains relaxed CSP for dev web mode
├── release/               # Compiled executables (.gitignored)
├── scripts/               # Build scripts
│   └── increment-version.js  # Auto-increment version on build
├── src/                   # Source code
│   ├── components/        # React components
│   │   ├── App.tsx            # Main app component
│   │   ├── ConverterTab.tsx   # File converter UI
│   │   ├── EditorTab.tsx      # Text editor UI
│   │   └── ToastContainer.tsx # Toast notification UI
│   ├── hooks/             # Custom React hooks
│   │   ├── useFileConversion.ts  # File conversion logic
│   │   ├── useFileHandling.ts    # File selection & type detection
│   │   ├── useLogging.ts         # Log management
│   │   └── useTextEditor.ts      # Text editor state management
│   ├── types/             # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/             # Utility functions
│   │   ├── configLoader.ts  # Config.xml loader
│   │   ├── rdfParser.ts     # RDF/XML/EDF parser & XOR encryption
│   │   └── toast.ts         # Toast notification system
│   ├── App.css            # Global styles
│   └── index.tsx          # React entry point
├── config.xml             # User's actual XOR key
├── main.js                # Electron main process
├── launcher.py            # Python launcher script, use it to auto install dependencies and launcher the program
├── package.json           # Dependencies and build scripts
├── tsconfig.json          # TypeScript configuration
└── webpack.config.js      # Webpack bundler config
```

Notes for Browser (web) mode:
- Use `npm run webserver` to start the dev server.
- The app requests `/config.xml`. In web mode, webpack copies `config.xml` from the project root into the served bundle and watches it. Editing the root `config.xml` is picked up automatically; refresh the page (Ctrl+F5) to reload, recommended restart the Webserver.
- CSP in `public/index.html` allows localhost connections during nom run webserver mode.

## Technologies

- Electron, React, TypeScript, Node.js, Webpack, Babel

## License

MIT
