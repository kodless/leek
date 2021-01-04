## Leek Documentation

This website was created with [Docusaurus](https://v2.docusaurus.io/).

# Get Started in 5 Minutes

1. Make sure all the dependencies for the website are installed:

```sh
$ yarn
```

2. Run your dev server:

```sh
# Start the site
$ yarn start
```

## Directory Structure

Your project file structure should look something like this

```
my-docusaurus/
  docs/
    devops
      doc-1.md
      doc-2.md
    devops
      doc-1.md
      doc-2.md
```

# Editing Content

## Editing an existing docs page

Edit docs by navigating to `docs/` and editing the corresponding document:

`docs/devops/doc-1.md`

```markdown
---
id: page-needs-edit
title: This Doc Needs To Be Edited
---

Edit me...
```

For more information about docs, click [here](https://v2.docusaurus.io/docs/docs-introduction)

# Adding Content

## Adding a new docs page to an existing sidebar

1. Create the doc as a new markdown file in `/docs/tribe-name`, example `docs/tribe-name/new-doc.md`:

```md
---
id: newly-created-doc
title: This Doc Needs To Be Edited
---

My new content here..
```

1. Refer to that doc's ID in an existing sidebar in `website/sidebar.json`:

```javascript
// Add newly-created-doc to the Getting Started category of docs
{
  "docs": {
    "devops/doc1": [
      "devops/doc1",
      "devops/doc1",
      "devops/new-doc" // new doc here
    ],
    ...
  },
  ...
}
```

For more information about adding new docs, click [here](https://v2.docusaurus.io/docs/docs-introduction)

# Full Documentation

Full documentation can be found on the [website](https://v2.docusaurus.io/).
