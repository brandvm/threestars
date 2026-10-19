# Email signature editor

`signature-editor.html` is a single-file editor for Mauro Savoia's email
signature, built from Design BV's three layouts (A logo left, B header row,
C name first). Open it in Chrome or Safari, edit the details, pick a layout,
and follow the install tab for the mail app.

- Hosted copy: `https://assets.brandvm.com/threestars/email-signature.html`
- Images come from Webflow's CDN, uploaded to the Webflow page
  `/design/email-signature-assets`. Don't delete those assets.
- Layouts stack below 480px with a media query, which Apple Mail and iPhone
  Mail apply. Gmail and Outlook strip it, so columns only wrap there. Classic
  Outlook for Windows gets hidden table code so it stays side by side.
- Install methods: Apple Mail and classic Outlook for Windows take the HTML
  in the signature file (Copy HTML / Copy for Outlook). Gmail web, Outlook for
  Mac, new Outlook and Outlook on the web take a rich paste (Copy signature).
  The Gmail phone app is plain text only.
- Edits are saved in the viewer's browser (localStorage) only.

The host (Static.app) injects its form script before every literal
`</body>`, including ones inside JS strings. The script writes tag text as
`\x3C…` / `<\/…` to avoid this — see GOTCHAS.
