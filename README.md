# Brainstorming Mockup Generator

Brainstorming is a responsive, browser-based wireframe and mockup editor for website, mobile application, desktop system, and process-flow planning. It is designed as a static project that can run directly from a folder or be published through GitHub Pages.

## Main features

- Drag-and-drop component library
- Click a component to add it to the center of the canvas
- Move and resize canvas objects
- Editable position, size, rotation, opacity, colors, borders, radius, shadows, text, and typography
- Layer panel with selection, locking, visibility, and stacking controls
- Multiple project pages
- Desktop, laptop, tablet, mobile, A4 portrait, A4 landscape, and custom canvas sizes
- Grid and snap-to-grid controls
- Zoom, fit-to-screen, select, and pan tools
- Undo and redo history
- Copy, paste, duplicate, delete, arrow-key movement, and keyboard shortcuts
- Local browser autosave
- Save and reopen complete project files in JSON format
- High-resolution PNG export
- PDF export
- Print-ready output
- Full-screen mockup preview
- Responsive mobile side panels for the component library and properties

## Component library

### Text and basic objects

Text, heading, paragraph, button, link, box, card, divider, image, icon, avatar, badge, and sticky note.

### Form controls

Text input, textarea, select field, search bar, date input, checkbox, radio button, switch, and file-upload area.

### Navigation

Navigation bar, sidebar, tabs, breadcrumbs, pagination, and bottom navigation.

### Data and feedback

Table, list, statistic card, progress bar, bar chart, notification toast, and accordion.

### Frames and overlays

Browser window, mobile-device frame, and modal dialog.

### Flowchart objects

Start/end, process, decision, database, and connector arrow.

## Included templates

- Blank canvas
- Mobile login application
- Admin dashboard
- Application store listing
- System process flow

## Running the project

Open `index.html` in a modern browser. For the most reliable browser behavior, run it using a local web server.

Example using Python:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Publishing on GitHub Pages

1. Create a new GitHub repository.
2. Upload every file from this project to the repository root.
3. Open the repository **Settings**.
4. Select **Pages**.
5. Under **Build and deployment**, select **Deploy from a branch**.
6. Select the `main` branch and the `/ (root)` folder.
7. Save the settings.

The site will be published using the GitHub Pages address shown in the repository settings.

## Export requirements

The editor itself runs without a framework or server. PNG and PDF exporting loads the required browser export libraries only when an export is requested. An internet connection is therefore required the first time the export libraries are loaded. Printing also uses the generated high-resolution canvas image.

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `V` | Select tool |
| `H` | Pan tool |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |
| `Ctrl/Cmd + Y` | Redo |
| `Ctrl/Cmd + C` | Copy selected object |
| `Ctrl/Cmd + V` | Paste object |
| `Ctrl/Cmd + D` | Duplicate selected object |
| `Ctrl/Cmd + S` | Download project file |
| `Delete` or `Backspace` | Delete selected object |
| Arrow keys | Move selected object by 1 pixel |
| `Shift + Arrow keys` | Move selected object by 10 pixels |
| `Escape` | Deselect or close a dialog |

## Project files

The **Save** button downloads a `.brainstorming.json` project file. Use **Open** to restore it later. Project files contain all pages, elements, positions, styles, and embedded uploaded images.

## Notes

- Uploaded images are stored inside the project as data URLs. Very large images can make project files large.
- The application stores the latest project in the browser's local storage.
- Clearing browser storage removes the local autosave, but downloaded project files remain safe.
