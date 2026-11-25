[#-- @ftlvariable name="locale" type="String" --]
[#-- @ftlvariable name="itemLists" type="java.util.ArrayList" --]
[#-- @ftlvariable name="itemList.title" type="String" --]
[#-- @ftlvariable name="itemList.items" type="String" --]
[#-- @ftlvariable name="item.url" type="String" --]
[#-- @ftlvariable name="item.docCount" type="Integer" --]
[#-- @ftlvariable name="item.key" type="String" --]
[#-- @ftlvariable name="item.warningKey" type="String" --]

[#macro render itemLists currentItemKey=""]
  <move-aria-current-on-visit class="navigation">
    [#list itemLists as itemList]
      [#local labelId=itemList.title?lower_case]
      <details class="ds-details" data-variant="outline" data-color="neutral" open>
        <summary id="${labelId}">${itemList.title}</summary>
        <nav aria-labelledby="${labelId}">
          <ul class="ds-list--unstyled">
            [#list itemList.items as item]
              <li>
                <a
                  class="component-link ds-focus--inset"
                  data-turbo-frame="content-view"
                  data-turbo-action="advance"
                  [#if item.docCount > 0]href="${item.url}"[/#if]
                  [#if item.key == currentItemKey]aria-current="page"[/#if]>

                  <span class="key">${item.key?keep_after(":")}</span><span>&nbsp;(${item.docCount})</span>

                  [#if item.warningKey?has_content]
                    [#local warning=portal.localize(item.warningKey, locale, [])]
                    <span class="ds-tag" data-color="warning" data-size="sm" title="${warning}">
                      ${portal.localize(item.warningKey + ".label", locale, [])}
                      <span class="ds-sr-only">: ${warning}</span>
                    </span>
                  [/#if]
                </a>
              </li>
            [/#list]
          </ul>
        </nav>
      </details>
    [/#list]
  </move-aria-current-on-visit>
[/#macro]
