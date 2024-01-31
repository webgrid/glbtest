// babylonWorker.js
self.importScripts('https://cdn.jsdelivr.net/npm/babylonjs@6.40.0/babylon.min.js');

self.addEventListener('message', async (event) => {
    if (event.data === 'createEngine') {
        try {
            const ofc = new OffscreenCanvas(256, 256);
            const engine = new BABYLON.WebGPUEngine(ofc);
            await engine.initAsync();
            self.postMessage('Engine created successfully');
        } catch (error) {
            self.postMessage(`Error creating engine: ${error}`);
        }
    }
});
