[#-- @ftlvariable name="locale" type="String" --]
[#-- @ftlvariable name="title" type="String" --]
[#-- @ftlvariable name="storybook" type="Boolean" --]
[#-- @ftlvariable name="baseAssetUrl" type="String" --]
[#-- @ftlvariable name="filters" type="java.util.ArrayList" --]
[#-- @ftlvariable name="itemLists" type="java.util.ArrayList" --]
[#-- @ftlvariable name="currentItemKey" type="String" --]
[#-- @ftlvariable name="currentItem" type="Object" --]
[#import "../../views/navigation/navigation.ftlh" as Navigation]

<!DOCTYPE html>
<html lang="${locale}" data-color-scheme="auto">
	<head>
		<meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="view-transition" content="same-origin" />
    [#-- Do not show cached previews when visiting a page again, so quick clicks only render the last page --]
    <meta name="turbo-cache-control" content="no-preview" />

    [#-- Storybook loads the styles itself (.storybook/preview.ts), and does not serve the built assets --]
    [#if !(storybook!false)]
      <link rel="icon" href="${baseAssetUrl}/images/icon.svg">
      <link rel="mask-icon" href="${baseAssetUrl}/images/icon.svg" color="#000000">
      <link rel="stylesheet" href="${baseAssetUrl}/styles/main.min.css" />
      <script type="module" src="${baseAssetUrl}/hotwired__turbo/8.0.23/dist/turbo.es2017-esm.js"></script>
      <script type="module" src="${baseAssetUrl}/scripts/move-aria-current-on-visit.mjs"></script>
    [/#if]

		<title>${title}</title>
	</head>
	<body>
    <div class="part-finder">
      <div class="layout--header" data-color="brand1">
        [#include "../../views/header/header.ftlh"]
      </div>

      <div class="layout--nav">
        [@Navigation.render itemLists=itemLists currentItemKey=currentItemKey /]
      </div>

      <div class="layout--content">
        [#if currentItem?has_content]
          [#include "../../views/component-view/component-view.ftlh"]
        [/#if]
      </div>
    </div>
	</body>
</html>
