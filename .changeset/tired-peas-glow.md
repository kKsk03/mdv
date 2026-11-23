---
'@mdv-ui/mdv': patch
---

Remove built-in text and accessible names from component controls. Applications can supply their own validation messages, action labels, loading and empty-state text, and accessible names through optional props, slots, and ARIA attributes.

To preserve the previous text and names when upgrading, supply the corresponding values, such as `labels`, `errorText`, `clearLabel`, `loadingText`, or `noOptionsText`. Form validation still applies when custom copy is omitted. Browsers provide native validation messages, and the date and time pickers' `locale` prop controls regional formatting.
