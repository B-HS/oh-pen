import { readModelLine, writeModelLine } from "../src/models.ts"

const path = process.argv[2]
if (!path) throw new Error("usage: test-model-switch.ts <agent.md> [model]")
const model = process.argv[3]

const original = await Bun.file(path).text()
console.log("원래 model:", readModelLine(original))
if (model) {
  const changed = writeModelLine(original, model)
  console.log("변경 후 model:", readModelLine(changed))
  await Bun.write(path, changed)
}
