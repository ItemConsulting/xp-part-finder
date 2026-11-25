# @itemconsulting/xp-part-finder

## 2.0.0

### Major Changes

- 3caeb48: Migrate to Enonic XP 8. The app now requires XP 8.1 or newer, and no longer installs on XP 7

### Minor Changes

- abe5dc8: List the blocks from the blocks library (lib-xp-blocks)

## 1.3.0

### Minor Changes

- e6b3122: Make the component groups (parts, layouts, pages) in the navigation menu collapsible
- bbbd956: Sort the applications by number of components (most first), and open the first component that is used in content when selecting an application

### Patch Changes

- a8ec76c: Fix components with capital letters in their name being listed twice, once with a "missing schema" warning and once as unused (#31)
- e6b3122: Fix event listeners piling up in the navigation menu when switching between applications
- e6b3122: Set the `lang` attribute on the page to the current locale
- e9c7015: Only render the last page when switching quickly between applications, mark the clicked component at once, and fade the content while it is loading (#6)
- e6b3122: Rename the "Select application" label to "Applications", and improve the Norwegian text for components missing a schema
- 4a17c6d: Use more of the screen width, so tables with long paths no longer need horizontal scrolling

## 1.2.0

### Minor Changes

- 642e56a: Add i18n support
- 80aa00f: Do not list archived content
- 9b75a82: Only show user hits on applications they have access too on their sites
- 9b75a82: Create a separate table for each layer/project in content view
- f3d3302: Use icons in content list instead of projectName and contentTypeName
- d103661: Add role "no.item.partfinder.viewer" that lets users use the application (in addition to admins)

### Patch Changes

- f3d3302: Fix paths to edit content so that the correct project name is used
- 806b7a9: Include unused components in navigation menu
- 806b7a9: Sort components in navigation menu alphabetically
- 48a27c1: Fix so that changing sort direction works on first click

## 1.1.0

### Minor Changes

- 85b3ec7: Improve performance on initial render
- 5186c4b: Add type column and sorting

## 1.0.0

### Major Changes

- 59165cf: Prepare for first release

### Minor Changes

- b2401cc: Fix postcss for CI
