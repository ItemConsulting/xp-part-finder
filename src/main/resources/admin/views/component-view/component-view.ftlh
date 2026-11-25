[#-- @ftlvariable name="locale" type="String" --]
[#-- @ftlvariable name="currentItem" type="Object" --]
[#-- @ftlvariable name="currentItem.key" type="String" --]
[#-- @ftlvariable name="currentItem.headings" type="java.util.ArrayList" --]
[#-- @ftlvariable name="currentItem.contents" type="java.util.ArrayList" --]
<turbo-frame id="content-view">
  <h2>
    [#if currentItem.displayName?has_content]
      ${currentItem.displayName} (${currentItem.key})
    [#else]
      ${currentItem.key}
    [/#if]
  </h2>

  [#list currentItem.projects![] as project]
    [@contentTable contents=project.contents project=project /]
  [/#list]
</turbo-frame>

[#macro contentTable contents project]
  <table class="ds-table" data-border data-color="neutral">
    <caption class="label-big">${project.displayName} (${project.id})</caption>
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
        <td class="type">
          <span title="${content.type}">
            [#-- Use non-breaking hyphen to prevent splitting to multiple lines --]
            ${content.type?keep_after(":")?esc?markup_string?replace("-", "&#8209;")?no_esc}
          </span>
        </td>
        <td class="name"><span>${content.displayName}</span></td>
        <td class="path"><a href="${content.url}" target="_blank">${content._path?esc?markup_string?replace("-", "&#8209;")?replace("/", "<wbr>/")?no_esc}</a></td>
      </tr>
    [/#list]
    </tbody>
  </table>
[/#macro]
