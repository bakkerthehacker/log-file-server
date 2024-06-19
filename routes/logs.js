var express = require('express');
var router = express.Router();
const stream = require('stream/promises')
const fs = require('fs/promises')
const util = require('util')

const MAX_CHUNK_SIZE = 16 * 1024;
// const MAX_CHUNK_SIZE = 1000;


const getReverseFileChunks = async function* (fileHandle) {
  const { size } = await fileHandle.stat();
  console.dir({ size })

  let chunkSize = size % MAX_CHUNK_SIZE;
  if (chunkSize === 0) {
    chunkSize = MAX_CHUNK_SIZE;
  }

  let start = size - chunkSize;

  while (true) {
    // console.log('file chunk')
    const chunk = Buffer.alloc(chunkSize);
    await fileHandle.read(chunk, { position: start });

    yield chunk.toString('utf8');

    if (start <= 0) {
      break;
    }

    start -= MAX_CHUNK_SIZE;
    chunkSize = MAX_CHUNK_SIZE;
  }
}

splitAndReverseChunk = async function* (chunks) {
  let previousFragment = '';

  for await (const chunk of chunks) {
    // console.log('split chunk')
    const lines = (chunk + previousFragment).split('\n');

    if (lines.length === 0 || !chunk) {
      continue;
    }

    [previousFragment, ...completedLines] = lines;

    completedLines.reverse();

    // console.dir({ completedLines })

    yield* completedLines;
  }
  if (previousFragment) {
    yield previousFragment
  }
}



debugPrintLines = async function* (lines) {
  for await (const line of lines) {
    console.dir({ line })
  }
}


writeLinesToResponse = (res) => {
  const writeAsync = util.promisify(res.write).bind(res)
  return async function* (lines) {
    for await (const line of lines) {
      await writeAsync(line)
      await writeAsync('\n')
    }
  }
}


router.get('/', async function (req, res, next) {
  const logFile = await fs.open('/var/log/dmesg')

  const fullProcess = await stream.pipeline(
    getReverseFileChunks(logFile),
    splitAndReverseChunk,
    // debugPrintLines
    writeLinesToResponse(res)
  )


  res.end();
});

module.exports = router;
