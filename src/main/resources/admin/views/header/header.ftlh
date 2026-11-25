[#-- @ftlvariable name="displayName" type="String" --]
[#-- @ftlvariable name="locale" type="String" --]
[#-- @ftlvariable name="currentAppKey" type="String" --]
[#-- @ftlvariable name="filters" type="java.util.ArrayList" --]

<header class="header">
  <h1 data-turbo-permanent="true">
    ${portal.localize("part-finder.displayName", locale, [])}
  </h1>

  [#if filters?size > 1]
    <div class="header--toolbar">
      <div class="header--nav-label" id="header-nav-label">
        ${portal.localize("part-finder.applications", locale, [])}
      </div>
      <nav class="header--filters" aria-labelledby="header-nav-label">
        [#list filters as filter]
          <a
            class="ds-chip"
            data-variant="outline"
            href="${filter.url}"
            [#if filter.text == currentAppKey]aria-current="true"[/#if]>

            ${filter.text}
          </a>
        [/#list]
      </nav>
    </div>
  [/#if]
</header>
