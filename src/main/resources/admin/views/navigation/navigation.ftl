[#-- @ftlvariable name="locale" type="String" --]
[#-- @ftlvariable name="itemLists" type="java.util.ArrayList" --]
[#-- @ftlvariable name="itemList.title" type="String" --]
[#-- @ftlvariable name="itemList.items" type="String" --]
[#-- @ftlvariable name="item.url" type="String" --]
[#-- @ftlvariable name="item.docCount" type="Integer" --]
[#-- @ftlvariable name="item.key" type="String" --]
[#-- @ftlvariable name="item.warningKey" type="String" --]

[#import "../utils.ftl" as utils]

[#macro render itemLists currentItemKey=""]
  <move-aria-current-on-visit
    box-="square"
    shear-="top"
    class="navigation"
    data-keyboard-focus-on="${utils.firstCharOfLocalized("part-finder.components", locale)}"
    tabindex="-1">

    <span is-="badge" variant-="background0">
      <div class="underline-first-letter">
        [@localize key="part-finder.components" locale=locale /]
      </div>
    </span>

    [#list itemLists as itemList]
      [#local labelId=itemList.title?lower_case]
      <details open>
        <summary id="${labelId}">${itemList.title}</summary>
        <nav aria-labelledby="${labelId}">
          <ul marker-="open tree">
          [#list itemList.items as item]
            <li>
              <a
                data-turbo-frame="content-view"
                data-turbo-action="advance"
                [#if item.docCount > 0]href="${item.url}"[/#if]
                [#if item.key == currentItemKey]aria-current="page"[/#if]>

                <span [#if item.warningKey?has_content]class="warning"[/#if]>
                  ${item.key?keep_after(":")}
                </span>
                <span class="docCount">&nbsp;(${item.docCount})</span>

                [#if item.warningKey?has_content]
                  <span title="[@localize key=item.warningKey locale=locale!'en' /]">⚠️</span>
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
