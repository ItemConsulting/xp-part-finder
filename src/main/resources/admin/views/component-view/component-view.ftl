[#-- @ftlvariable name="currentItem" type="Object" --]
[#-- @ftlvariable name="currentItem.key" type="String" --]
[#-- @ftlvariable name="currentItem.headings" type="java.util.ArrayList" --]
[#-- @ftlvariable name="currentItem.contents" type="java.util.ArrayList" --]
<turbo-frame id="content-view">
  <table class="table">
    <caption class="label-big">${currentItem.key}</caption>
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
      [#list currentItem.contents as content]
        <tr>
          <td>
            [#if content.projectId == "default"]
              default
            [#else]
              <img src="${content.projectIconUrl}" alt="${content.projectId}" title="${content.projectId}">
            [/#if]
          </td>
          <td>
            <img
              src="/admin/rest-v2/cs/schema/content/icon/${content.type}"
              alt="${content.type}"
              title="${content.type}">
          </td>
          <td class="name">${content.displayName}</td>
          <td><a href="${content.url}" target="_top">${content.path}</a></td>
        </tr>
      [/#list]
    </tbody>
  </table>
</turbo-frame>
