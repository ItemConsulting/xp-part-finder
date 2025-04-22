[#function inlineLocalize key locale]
  [#local str][@localize key=key locale=locale /][/#local]
  [#return str]
[/#function]

[#function firstCharOfLocalized key locale]
  [#return inlineLocalize(key, locale)?substring(0, 1)?lower_case]
[/#function]
