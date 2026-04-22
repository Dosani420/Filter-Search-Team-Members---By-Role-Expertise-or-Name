# Dynamic Team Filtering & Search System

A responsive team directory built with **HTML, CSS, and JavaScript** that supports real-time search and multi-role filtering.

## Objective

This project implements a dynamic team page where users can find members by:

- Name
- Role
- Skills/Expertise

It demonstrates practical frontend filtering patterns used in real-world directory and search interfaces.

## Features

- Real-time search with **debounce** for better performance
- Role-based **multi-select filters**
- Combined filtering (search + role filters together)
- Highlighted matching text in results
- Responsive team card grid layout
- "No team members found" state
- Reset filters button
- Persisted search/filter state using `localStorage`
- Accessible markup improvements (`fieldset`, `aria-live`, status updates)

## Project Structure

- `index.html` - Page layout and filter controls
- `styles.css` - Styling, responsiveness, and UI states
- `script.js` - Data loading, filtering logic, rendering, persistence
- `team.json` - Team member data source

## Data Model

Each member includes:

- `id`
- `name`
- `role`
- `skills` (array of expertise tags)
- `image_url`
- `bio`
- `social_links`

## How to Run

### Option 1: Open directly

1. Open `index.html` in your browser.
2. Use search and role filters from the top controls.

### Option 2: Live Server (recommended)

If you use VS Code / Cursor Live Server:

1. Right-click `index.html`
2. Click **Open with Live Server**

This avoids local fetch issues in some browser security settings.

## Usage

- Type in search input to filter by member name, role, or skill.
- Select one or more role chips to narrow results.
- Use **Reset Filters** to clear everything quickly.
- Last used search and role selections are restored automatically on reload.

## Notes

- Built with plain JavaScript (no framework).
- Easy to extend with sorting, pagination, and URL-based filter state.

## Author

Internship Task 8 - Filter & Search Team Members (By Role, Expertise, or Name)
