class SoundManager {
  constructor() {
    this.audioContext = null;
    this.buffers = {};
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

  async resume() {
    const audioContext = this.getAudioContext();

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }
  }

	async load(name, url) {
    const audioContext = this.getAudioContext();

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `音声ファイルの読み込みに失敗しました: ${url}`
      );
    }

    const arrayBuffer = await response.arrayBuffer();

    const audioBuffer =
      await audioContext.decodeAudioData(arrayBuffer);

    this.buffers[name] = audioBuffer;
  }

	play(name) {
  const audioContext = this.getAudioContext();
  const audioBuffer = this.buffers[name];

  if (!audioBuffer) {
    console.warn(`音声が読み込まれていません: ${name}`);
    return;
  }

  const source = audioContext.createBufferSource();

  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  source.start();
	}
}

export default SoundManager;