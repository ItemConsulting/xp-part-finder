[#-- @ftlvariable name="displayName" type="String" --]
[#-- @ftlvariable name="locale" type="String" --]
[#-- @ftlvariable name="currentAppKey" type="String" --]
[#-- @ftlvariable name="filters" type="java.util.ArrayList" --]

[#import "../utils.ftl" as utils]

<header class="header">
  <h1 data-turbo-permanent="true">
    [@localize key="part-finder.displayName" locale=locale /]
  </h1>

  [#if filters?size > 1]
    <div
      box-="square"
      shear-="top"
      class="dimmed-unless-active"
      data-keyboard-focus-on="${utils.firstCharOfLocalized("part-finder.applications", locale)}"
      tabindex="-1">

      <div is-="badge" variant-="background0" id="header-nav-label">
        <div class="underline-first-letter">
          [@localize key="part-finder.applications" locale=locale /]
        </div>
      </div>

      <nav class="header--filters" aria-labelledby="header-nav-label">
        [#list filters as filter]
          <a
            is-="button"
            size-="small"
            variant-="background1"
            href="${filter.url}"
            [#if filter.text == currentAppKey]aria-current="true"[/#if]>

            ${filter.text}
          </a>
        [/#list]
      </nav>
    </div>
  [/#if]
</header>
