[#-- @ftlvariable name="locale" type="String" --]
[#-- @ftlvariable name="currentItem" type="Object" --]
[#-- @ftlvariable name="currentItem.key" type="String" --]
[#-- @ftlvariable name="currentItem.headings" type="java.util.ArrayList" --]
[#-- @ftlvariable name="currentItem.contents" type="java.util.ArrayList" --]

[#import "../utils.ftl" as utils]

<turbo-frame
  id="content-view"
  box-="square"
  shear-="top"
  class="component-view"
  data-keyboard-focus-on="${utils.firstCharOfLocalized("part-finder.content", locale)}"
  tabindex="-1">

  <div class="space-between">
    <span is-="badge" variant-="background0">
      <div class="underline-first-letter">
        [@localize key="part-finder.content" locale=locale /]
      </div>
    </span>
    <span is-="badge" variant-="green" cap-="round">${currentItem.key}</span>
  </div>

  [#list currentItem.projects![] as project]
    [@contentTable contents=project.contents project=project /]
  [/#list]
</turbo-frame>

[#macro contentTable contents project]
  <div is-="typography-block">
  <h2>${project.displayName} <i>(${project.id})</i></h2>

  </div>
  <table class="table" is-="typography-block">
    <caption class="label-big"></caption>
    <thead>
      <tr>
        [#list currentItem.headings as heading]
          <th
            scope="col"
            [#if heading.sortDirection?has_content]aria-sort="${heading.sortDirection}"[/#if]>

            <a
              class="sort-link"
              href="${heading.url}">

              ${heading.text}
            </a>

            <span aria-hidden="true"></span>
          </th>
        [/#list]
      </tr>
    </thead>
    <tbody>
    [#list contents as content]
      <tr>
        <td>
          <span title="${content.type}">
            [#-- Use non-breaking hyphen to prevent splitting to multiple lines --]
            ${content.type?keep_after(":")?replace("-", "&#8209;")}
          </span>
        </td>
        <td class="name">${content.displayName}</td>
        <td>
          <a href="${content.url}" target="_blank">
            ${content._path?replace("-", "&#8209;")?replace("/", "<wbr>/")}
          </a>
        </td>
      </tr>
    [/#list]
    </tbody>
  </table>
[/#macro]
