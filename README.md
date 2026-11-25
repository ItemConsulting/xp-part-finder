# Part Finder

When you are working on an XP-part – you might want to know all the content where it's being used. This app provides an
admin tool that lists usage of your components (parts, layouts, pages) to help you with testing and configuration.

![Build badge](https://github.com/ItemConsulting/xp-part-finder/actions/workflows/main.yml/badge.svg)
[![](https://repo.itemtest.no/api/badge/latest/releases/no/item/xp-part-finder)](https://repo.itemtest.no/#/releases/no/item/xp-part-finder)
![Enonic XP8 badge](https://market.enonic.com/badges/xp8.svg)

![Part finder icon](./src/main/resources/enonic.svg)

## Roles

Users will be able to interact with the application – and see it on their home screen if they have one of the following
roles:

1. `"system.admin"`
2. `"no.item.partfinder.viewer"` _(given in the Users app)_

## Setup

Install npm-dependencies

```bash
npm install
```

## Running storybook

To make development easier and quicker, pages, layouts, parts and Freemarker-macros have Storybook-stories that let us
get immediate feedback when developing.

Storybook uses [storybook-framework-enonic-xp](https://github.com/ItemConsulting/storybook-framework-enonic-xp), which
renders the templates in the running XP sandbox. To run it locally:

1. Install [xp-storybook](https://github.com/ItemConsulting/xp-storybook) in your local sandbox.
2. Deploy this app in dev mode, so that edited templates are served without a rebuild:

   ```bash
   enonic project dev
   ```

3. Start Storybook:

   ```bash
   npm run storybook
   ```

## Building

To build the project, run the following command

```bash
enonic project build
```

You will find the jar-file at _./build/libs/item.jar_

## Deploying locally

To deploy to a local sandbox, run the following command

```bash
enonic project deploy
```

## Deploy to Maven

```bash
./gradlew publish
```
