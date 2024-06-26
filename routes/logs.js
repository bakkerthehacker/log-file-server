var express = require('express');
var router = express.Router();
const stream = require('stream/promises')
const fs = require('fs/promises')
const util = require('util')
const path = require('path')

const MAX_CHUNK_SIZE = 16 * 1024 * 1024;
// const MAX_CHUNK_SIZE = 1000;
const LOG_LOCATION = '/var/log'


// starting at the end of the file, grab chunks of the file
// all chunks except the first chunk will be the max size
const getReverseFileChunks = (fileHandle) => async function* ({ signal }) {
  const { size } = await fileHandle.stat();
  // console.dir({ size })

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

// Take a chunk of a log file and split it by newlines
// then reverse the order
// if a line crossess between multiple chunks
// its merged together once both pieces are processed
const splitAndReverseChunk = async function* (chunks) {
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



const debugPrintLines = async function* (lines) {
  for await (const line of lines) {
    console.dir({ line })
  }
}


// Send log lines to express response
// Have to wait on write promises to avoid buffering too much data
const writeLinesToResponse = (res) => {
  const writeAsync = util.promisify(res.write).bind(res)
  return async function* (lines) {
    for await (const line of lines) {
      const promises = []
      promises.push(writeAsync(line))
      promises.push(writeAsync('\n'))
      await Promise.all(promises)
    }
  }
}

// Only process log lines that include the filter
const filterLines = (filter) => {
  return async function* (lines) {
    for await (const line of lines) {
      if (line.includes(filter)) {
        yield line;
      }
    }
  }
}

// Only process a certain number of log lines up to the limit
const limitLineCount = (limit) => {
  let count = 0;
  return async function* (lines) {
    for await (const line of lines) {
      count++;
      yield line;
      if (count >= limit) {
        break;
      }
    }
  }
}


router.get('/', async function (req, res, next) {
  // console.dir(req.params)
  // console.dir(req.query)

  const { filename, filter, count } = req.query;

  if (!filename) {
    next(new Error('must provide log filename'))
    return;
  }
  const logPath = path.join(LOG_LOCATION, filename)

  // check for trying to escape log folder using ..
  if (!logPath.startsWith(LOG_LOCATION)) {
    next(new Error('log filename must be in log folder'))
    return;
  }


  try {
    await fs.access(logPath, fs.constants.R_OK);
  } catch {
    next(new Error(`cannot access log file ${logPath}`))
    return;
  }

  const logFile = await fs.open(logPath)

  const transforms = [splitAndReverseChunk];

  if (filter) {
    transforms.push(filterLines(filter))
  }
  if (count) {
    const limitNumber = Number(count)
    if (Number.isNaN(limitNumber)) {
      next(new Error(`line count ${count} is not a number`))
      return;
    }
    transforms.push(limitLineCount(limitNumber))
  }

  const fullProcess = await stream.pipeline(
    getReverseFileChunks(logFile),
    ...transforms,
    // debugPrintLines
    writeLinesToResponse(res)
  )

  await logFile.close();

  res.end();
});

module.exports = router;
