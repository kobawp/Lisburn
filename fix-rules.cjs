const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');
rules = rules.replace(
  "    match /settings/{docId} {\n      allow read, write: if true;\n    }",
  "    match /settings/{docId} {\n      allow read, write: if true;\n    }\n    \n    match /pushSubscriptions/{docId} {\n      allow read, write: if true;\n    }"
);
fs.writeFileSync('firestore.rules', rules);
