import fs from 'node:fs'

const document = fs.readFileSync('.agents/requirements.md', 'utf8')
const ids = [...document.matchAll(/\b([A-Z]+-\d{3})\b/g)].map((match) => match[1])
const unique = new Set(ids)
if (unique.size < 150) throw new Error(`requirements document has only ${unique.size} unique IDs`)
for (const section of ['Employee Portal', 'Reporting Manager Portal', 'HR Manager Portal', 'completion checklist']) if (!document.toLowerCase().includes(section.toLowerCase())) throw new Error(`missing section: ${section}`)
console.log(JSON.stringify({ requirementIds: ids.length, uniqueIds: unique.size, status: 'pass' }))
