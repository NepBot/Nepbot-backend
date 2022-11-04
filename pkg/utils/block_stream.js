const { S3Client, ListObjectsV2Command, GetObjectCommand } = require("@aws-sdk/client-s3");
const { Readable } = require("stream");

const sleep = (pause) =>
  new Promise((resolve) => setTimeout(resolve, pause));

// In the S3 bucket we store blocks height with prepended zeroes
// because these are string there and to avoid getting earlier
// blocks after later ones because of sorting strings issues
// we decided to prepend zeroes.
// This function normalizes the block height number into the string
function normalizeBlockHeight(number) {
  return number.toString().padStart(12, "0");
}

async function parseBody(stream) {
  const contents = await streamToString(stream);
  const parsed = JSON.parse(contents);
  return parsed;
}

// the function got from
// https://github.com/aws/aws-sdk-js-v3/issues/1877#issuecomment-755387549
function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}

// Queries the list of the objects in the bucket, grouped by "/" delimiter.
// Returns the list of blocks that can be fetched
// See more about data structure https://github.com/near/near-lake#data-structure
async function listBlocks(
    client,
    bucketName,
    startAfter,
    limit = 200
) {
    const data = await client.send(
        new ListObjectsV2Command({
            Bucket: bucketName,
            MaxKeys: limit,
            Delimiter: "/",
            StartAfter: normalizeBlockHeight(startAfter),
            RequestPayer: "requester",
        })
    );
    return (data.CommonPrefixes || []).map((p) => parseInt(p.Prefix.split("/")[0]));
}

// By the given block height gets the objects:
// - block.json
// - shard_N.json
// Returns the result as `StreamerMessage`
async function fetchStreamerMessage(
    client,
    bucketName,
    blockHeight
) {
    const block = await fetchBlock(client, bucketName, blockHeight);
    const shards = await fetchShards(
        client,
        bucketName,
        blockHeight,
        block.chunks.length
    );
    return { block, shards };
}

// By the given block height gets the block.json
// Reads the content of the objects and parses as a JSON.
async function fetchBlock(
    client,
    bucketName,
    blockHeight
) {
    while (true) {
        try {
            const data = await client.send(
                new GetObjectCommand({
                    Bucket: bucketName,
                    Key: `${normalizeBlockHeight(blockHeight)}/block.json`,
                    RequestPayer: "requester",
                })
            );
            const block = await parseBody(Readable.from(data.Body));
            return block;
        } catch (err) {
            console.error(
                `Failed to fetch ${blockHeight}/block.json. Retrying immediately`,
                err
            );
        }
    }
}

// By the given block height gets the shard_N.json files
// Reads the content of the objects and parses as a JSON.
async function fetchShards(
    client,
    bucketName,
    blockHeight,
    numberOfShards
) {
    if (numberOfShards === 0) return [];

    return await Promise.all(
        [...Array(numberOfShards).keys()].map(async (index) =>
            fetchSingleShard(client, bucketName, blockHeight, index)
        )
    );
}

async function fetchSingleShard(
    client,
    bucketName,
    blockHeight,
    shardId
) {
    try {
    const data = await client.send(
        new GetObjectCommand({
        Bucket: bucketName,
        Key: `${normalizeBlockHeight(blockHeight)}/shard_${shardId}.json`,
        RequestPayer: "requester",
        })
    );
    const shard = await parseBody(Readable.from(data.Body));
    return shard;
    } catch (err) {
    console.error(
        `Failed to fetch ${blockHeight}/shard_${shardId}.json. Retrying immediately`,
        err
    );
    return await fetchSingleShard(client, bucketName, blockHeight, shardId);
    }
}

async function* batchStream(config) {
    const s3Client = new S3Client({ region: config.s3RegionName, endpoint: config.s3Endpoint, forcePathStyle: config.s3ForcePathStyle });

    let startBlockHeight = config.startBlockHeight;
    let endBlockHeight = config.endBlockHeight

    while (startBlockHeight <= endBlockHeight || endBlockHeight == 0) {
        const results = [];
        let blockHeights;
        try {
            blockHeights = await listBlocks(
                s3Client,
                config.s3BucketName,
                startBlockHeight,
            );
        } catch (err) {
            console.error("Failed to list blocks. Retrying.", err);
            continue;
        }

        if (blockHeights.length === 0) {
            // Throttling when there are no new blocks
            const NO_NEW_BLOCKS_THROTTLE_MS = 700;
            await sleep(NO_NEW_BLOCKS_THROTTLE_MS);
            continue;
        }

        yield blockHeights.map(blockHeight => fetchStreamerMessage(s3Client, config.s3BucketName, blockHeight));
        startBlockHeight = Math.max.apply(Math, blockHeights) + 1;
    }
}

async function* fetchAhead(seq, stepsAhead = 10) {
    let queue = [];
    while (true) {
        while (queue.length < stepsAhead) {
            queue.push(seq[Symbol.asyncIterator]().next());
        }

        const { value, done } = await queue.shift();
        if (done) {return};
        yield value;
    }
}

async function* stream(config) {

    let lastProcessedBlockHash;
    let startBlockHeight = config.startBlockHeight;
    let endBlockHeight = config.endBlockHeight

    while (startBlockHeight <= endBlockHeight || endBlockHeight == 0) {
        try {
            for await (let promises of fetchAhead(batchStream({ ...config, startBlockHeight }))) {
                for (let promise of promises) {
                    const streamerMessage = await promise;
                    // check if we have `lastProcessedBlockHash` (might be not set only on start)
                    // compare lastProcessedBlockHash` with `streamerMessage.block.header.prevHash` of the current
                    // block (ensure we never skip blocks even if there is some incident on Lake Indexer side)
                    // retrieve the data from S3 if hashes don't match and repeat the main loop step
                    // if (
                    //     lastProcessedBlockHash &&
                    //     lastProcessedBlockHash !== streamerMessage.block.header.prevHash
                    // ) {
                    //     throw new Error(
                    //     `The hash of the last processed block ${lastProcessedBlockHash} doesn't match the prevHash ${streamerMessage.block.header.prevHash} of the new one ${streamerMessage.block.header.hash}.`);
                    // }

                    yield streamerMessage;

                    lastProcessedBlockHash = streamerMessage.block.header.hash;
                    startBlockHeight = streamerMessage.block.header.height + 1;
                }
            }
        } catch (e) {
            // TODO: Should there be limit for retries?
            console.log('Retrying on error when fetching blocks', e, 'Refetching the data from S3 in 200ms');
            await sleep(200);
        }
    }
}

async function startStream(
    config,
    onStreamerMessageReceived
) {
    let queue = [];
    for await (let streamerMessage of stream(config)) {
        // `queue` here is used to achieve throttling as streamer would run ahead without a stop
        // and if we start from genesis it will spawn millions of `onStreamerMessageReceived` callbacks.
        // This implementation has a pipeline that fetches the data from S3 while `onStreamerMessageReceived`
        // is being processed, so even with a queue size of 1 there is already a benefit.
        // TODO: Reliable error propagation for onStreamerMessageReceived?
        queue.push(onStreamerMessageReceived(streamerMessage));
        if (queue.length > 10) {
            await queue.shift();
        }
    }
}

module.exports = {
    startStream
}