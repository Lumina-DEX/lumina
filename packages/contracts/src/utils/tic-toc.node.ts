/**
 * Helper for printing timings, in the spirit of Python's `tic` and `toc`.
 *
 * This is a slightly nicer version of './tic-toc.ts' which only works in Node.
 */

export { tic, toc }

const timingStack: [string | undefined, number][] = []

function tic(label?: string) {
  if (label) process.stdout.write(`${label}... `)
  timingStack.push([label, performance.now()])
}

function toc() {
  const [label, start] = timingStack.pop()!
  const time = (performance.now() - start) / 1000
  if (label) process.stdout.write(`\r${label}... ${time.toFixed(3)} sec\n`)
  return time
}
