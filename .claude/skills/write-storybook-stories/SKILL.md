---
name: write-storybook-stories
description: Write and update Storybook stories for this project's Freemarker views (.ftlh) using @storybook/server. Use when creating or changing a view or admin tool template, or when editing *.stories.ts files.
---

# Writing Storybook stories for Freemarker views

The UI in this project is server-rendered Freemarker (`.ftlh`). Stories render templates through
`@itemconsulting/storybook-framework-enonic-xp`, with `@storybook/server` providing the story types. Each story's `args`
become the template's data model.

Whenever you add or change a view (`src/main/resources/admin/views/*`) or the admin tool template
(`src/main/resources/admin/tools/part-finder/part-finder.ftlh`), add or update its stories in the same change.

## File layout

Each view has a folder holding these files next to each other:

- `<name>.ftlh`: the template
- `<name>.freemarker.ts`: TypeScript types for the template's model, also used by the controller
- `<name>.stories.ts`: the stories
- `<name>.css` / `<name>.ts`: styles and client-side scripts, if the view has any

Storybook picks up `src/**/*.stories.ts` (see `.storybook/main.ts`).

## Story structure

```ts
import type { Meta, StoryObj } from "@storybook/server";
import type { ComponentViewParams } from "./component-view.freemarker";
import id from "./component-view.ftlh";

export default {
  title: "Components/Component View",
  parameters: {
    server: { id },
  },
} satisfies Meta<ComponentViewParams>;

export const componentView: StoryObj<ComponentViewParams> = {
  args: {
    currentItem: { /* realistic data */ },
  },
};
```

- Import `Meta`/`StoryObj` from `@storybook/server`.
- Import the template as a module (`import id from "./x.ftlh"`) and pass it as `parameters.server.id`.
- Type `Meta` and `StoryObj` with the model type from `<name>.freemarker.ts`, so the args stay in sync with what the
  controller passes in. Use `satisfies Meta<...>` on the default export.
- Titles: `Components/<View name>` for views, `Admin/<Tool name>` for full admin tool pages.

### Templates that are macros, or that need a wrapper

If the `.ftlh` file defines a macro instead of rendering directly, or the view needs surrounding markup (for example a
`data-color` context), give an inline Freemarker template in `parameters.server.params.template`:

```ts
parameters: {
  server: {
    id,
    params: {
      template: `
        [#import "/admin/views/navigation/navigation.ftlh" as Navigation]
        [@Navigation.render itemLists=itemLists /]
      `,
    },
  },
},
```

Use `[#include "${id}" /]` to render the template inside a wrapper (see `header.stories.ts`).

### Full pages

Full-page stories (see `part-finder.stories.ts`) use `layout: "fullscreen"`. Build their args from the view stories'
args (`header.args?.filters`, `navigation.args?.itemLists`, ...) instead of copying the data. Pass `storybook: true`
so the template leaves out the `<link>` and `<script>` elements for built assets, which Storybook does not serve.
Styles come from `.storybook/preview.ts`.

## What to cover

Add one story for each state that renders differently. Don't add stories that look the same as an existing one.

- Default state with realistic data (real-looking app keys such as `no.item.starter:article-header`, display names,
  paths)
- Empty lists and zero counts (for example `docCount: 0`, which removes the link in the navigation)
- Optional fields present and missing (for example `warningKey`, `sortDirection`)
- Current or selected item (`currentItemKey`, `aria-current`)
- Long text and many items, if they can affect the layout

Use `url: "#"` for links. Text from `portal.localize` comes from `src/main/resources/i18n/phrases*.properties`. Use real
phrase keys, and check both locales with the toolbar's locale switcher (`no`/`en`).

## Accessibility and Designsystemet

- `@storybook/addon-a11y` is enabled. Check its panel for each new or changed story and fix violations in the template.
- The markup should use Designsystemet classes, data attributes and tokens (see AGENTS.md), so that stories show the
  real styling.
- Interactive behavior (custom elements, Turbo) can be tested with `play` functions using `storybook/test`
  (`expect`, `userEvent`). Use role- and label-based queries such as `canvas.getByRole("link", { name: ... })`.

## Verifying

Run `npm run storybook` (port 6006). The story URL is `http://localhost:6006/?path=/story/<story-id>`. The story id is
the kebab-cased title plus the export name, for example `components-navigation--navigation`. Give the user links to the
stories you added or changed.
