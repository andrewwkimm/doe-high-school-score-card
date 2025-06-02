## DOE High School Scorecard

The GitHub repository to version the code used in the DOE High School Scorecard Google Apps Script project, tentatively deployed on [render](https://doe-high-school-scorecard.onrender.com/).

# Instructions

Run theses following commands after setting up your environment and get the latest changes in the Apps Script project itself.

```bash
npm install -g @google/clasp
clasp login
clasp clone <project-id>
```

Pushing to this repository automatically pushes changes to the Apps Script project, but to also do it locally:

```bash
clasp push
clasp deploy --description "Insert comment here"
```
