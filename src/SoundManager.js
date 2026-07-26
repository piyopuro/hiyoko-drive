class SoundManager {
  constructor() {
    this.audioContext = null;
    this.buffers = {};
		this.arrayBuffers = {};
		this.loadingPromises = {};
  }

  getAudioContext() {
    if (!this.audioContext) {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;
        
    	if (!AudioContextClass) {
      	throw new Error("Web Audio APIが利用できません");
      }

      this.audioContext = new AudioContextClass();
    }

    return this.audioContext;
  }

	async load(name, url) {
   　const loadingPromise = async () => {

			const response = await fetch(url);

			if (!response.ok) {
				throw new Error(
					`音声ファイルの読み込みに失敗しました: ${url}`
				);
			}

			this.arrayBuffers[name] = await response.arrayBuffer();

      // AudioContextがすでに作られている場合は、その場でデコード
      if (this.audioContext) {
        await this.decode(name);
      }
    };	

		this.loadingPromises[name] = loadingPromise();

    try {
      await this.loadingPromises[name];
    } finally {
      delete this.loadingPromises[name];
    }
  }

	async decode(name) {
    if (this.buffers[name]) {
      return;
    }

    const arrayBuffer = this.arrayBuffers[name];

    if (!arrayBuffer) {
      return;
    }

    const audioContext = this.getAudioContext();

    this.buffers[name] = await audioContext.decodeAudioData(
      arrayBuffer.slice(0)
    );

    delete this.arrayBuffers[name];
  }

  async resume() {
    const audioContext = this.getAudioContext();

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

		// fetch待ち
    await Promise.all(Object.values(this.loadingPromises));

    // 取得済みの音をまとめてデコード
    const names = Object.keys(this.arrayBuffers);

    await Promise.all(
      names.map((name) => this.decode(name))
    );

  }


	play(name) {
  const audioBuffer = this.buffers[name];

  if (!audioBuffer) {
    console.warn(`音声が読み込まれていません: ${name}`);
    return;
  }

  const audioContext = this.getAudioContext();
  const source = audioContext.createBufferSource();

  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  source.start();
	}
}

export default SoundManager;