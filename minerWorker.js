importScripts('https://cdnjs.cloudflare.com/ajax/libs/js-sha256/0.9.0/sha256.min.js');

let mining = false;
let paused = false;

onmessage = function (e) {
  const { difficulty, action } = e.data;

  if (action === 'pause') {
    paused = true;
    return;
  }

  if (action === 'resume') {
    paused = false;
    mine();
    return;
  }

  if (difficulty) {
    startMining(difficulty);
  }
};

function startMining(difficulty) {
  const data = "灯确吉L"; // 固定的数据
  const maxTarget = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"); // 2^256 - 1
  const target = maxTarget / BigInt(difficulty);
  let nonce = 0;
  const startTime = Date.now();
  let lastUpdateTime = startTime;
  let lastUpdateNonce = 0;

  mining = true;

  function updateETA() {
    const currentTime = Date.now();
    const elapsedTime = (currentTime - lastUpdateTime) / 1000; // 秒
    const totalElapsedTime = (currentTime - startTime) / 1000; // 总秒数
    const hashesSinceLastUpdate = nonce - lastUpdateNonce;
    const hashRate = hashesSinceLastUpdate / elapsedTime;
    const averageHashRate = nonce / totalElapsedTime;
    const estimatedTimeRemaining = (difficulty - nonce) / hashRate;

    const etaDate = new Date(currentTime + estimatedTimeRemaining * 1000);
    postMessage({
      type: 'progress',
      nonce,
      eta: etaDate.toLocaleTimeString(),
      hashRate,
      averageHashRate
    });

    lastUpdateTime = currentTime;
    lastUpdateNonce = nonce;
  }

  function mine() {
    if (!mining || paused) return;

    const batchSize = 100000;
    for (let i = 0; i < batchSize; i++) {
      const hash = sha256(data + nonce);
      const hashValue = BigInt('0x' + hash);
      if (hashValue <= target) {
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000; // 转换为秒
        postMessage({
          type: 'result',
          nonce,
          hash,
          duration
        });
        mining = false;
        return;
      } else {
        nonce++;
      }
    }

    updateETA();
    setTimeout(mine, 0);
  }

  mine();
}
