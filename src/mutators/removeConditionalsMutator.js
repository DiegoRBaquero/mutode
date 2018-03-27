const walk = require('babylon-walk')
const debug = require('debug')('mutode:removeConditionalsMutator')

const mutantRunner = require('../mutantRunner')
const lineDiff = require('../util/lineDiff')

const operators = [
  '==',
  '!=',
  '===',
  '!=='
]

/**
 * Hola
 * @method
 * @name removeConditionalsMutator
 * @memberOf module:Mutators
 * @param mutodeInstance
 * @param filePath
 * @param lines
 * @param queue
 * @returns {Promise}
 */
module.exports = async function removeConditionalsMutator ({mutodeInstance, filePath, lines, queue, ast}) {
  debug('Running conditionals boundary mutator on %s', filePath)

  walk.simple(ast, {
    BinaryExpression (node) {
      for (const operator of operators) {
        if (node.operator !== operator) {
          continue
        }
        const line = node.loc.start.line
        const lineContent = lines[line - 1]

        for (const replacement of ['true', 'false']) {
          const mutantLineContent = lineContent.substr(0, node.loc.start.column) +
            replacement +
            lineContent.substr(node.loc.end.column)

          const mutantId = ++mutodeInstance.mutants
          const diff = lineDiff(lineContent, mutantLineContent)
          const log = `MUTANT ${mutantId}:\tRCM Line ${line}:\t${diff}\t`
          debug(log)
          mutodeInstance.mutantLog(`MUTANT ${mutantId}:\tRCM ${filePath} Line ${line}:\t\`${lineContent.trim()}\` > \`${mutantLineContent.trim()}'\``)
          const linesCopy = lines.slice()
          linesCopy[line - 1] = mutantLineContent
          const contentToWrite = linesCopy.join('\n')
          queue.push(mutantRunner({mutodeInstance, filePath, contentToWrite, log}))
        }
      }
    }
  })
}
