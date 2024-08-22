[#-- @ftlvariable name="filters" type="java.util.ArrayList" --]
[#-- @ftlvariable name="itemLists" type="java.util.ArrayList" --]
[#-- @ftlvariable name="currentItemKey" type="String" --]
[#-- @ftlvariable name="currentItem" type="Object" --]
[#import "../../components/navigation/navigation.ftl" as Navigation]

<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="view-transition" content="same-origin" />

    <link rel="stylesheet" href="[@assetUrl path='styles/bundle.css'/]" />

    <script type="module" src="[@assetUrl path='hotwired__turbo/8.0.4/dist/turbo.es2017-esm.js'/]"></script>

		<title>Part Finder</title>
	</head>
	<body>
    <div class="part-finder">
      <div class="layout--header">
        <h1>Part Finder</h1>
        <nav class="part-finder--filters">
          [#list filters as filter]
            <a
              class="button-filter"
              href="${filter.url}"
              [#if filter.current!false]aria-current="true"[/#if]>

              ${filter.text}
            </a>
          [/#list]
        </nav>
      </div>


      <div class="layout--nav">
        [@Navigation.render itemLists=itemLists currentItemKey=currentItemKey /]
      </div>

      <div class="layout--content">
        [#if currentItem?has_content]
          [#include "../../components/component-view/component-view.ftl"]
        [/#if]
      </div>
    </div>
	</body>
</html>
