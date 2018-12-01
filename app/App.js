import React, { Component } from 'react';
import styles from './App.css';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isPlaying: false,
      isLoading: true,
      soundClips: [],
    };
    this.play = this.play.bind(this);
    this.renderPlayList = this.renderPlayList.bind(this);
    this.source;
    this.drawVisual;
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext);
    this.analyser = this.audioCtx.createAnalyser();
  }

  componentDidMount() {
    fetch('http://localhost:5000/files', {
      method: 'GET',
    })
      .then(res => res.json())
      .then(res => {
        this.setState({
          soundClips: res,
        });
      });
  }

  play(e) {
    const {isPlaying, isLoading} = this.state;
    const soundClip = e.target.innerText;
    const width = window.innerWidth;
    const height = 200;
    const canvas = document.querySelector('.visualizer');
    canvas.width = width;
    canvas.height = height;
    fetch(`http://localhost:5000/files/${soundClip}`)
      .then(res => res.arrayBuffer())
      .then(audioBuffer => {
        const audioCtx = this.audioCtx;
        const analyser = this.analyser;
        audioCtx.decodeAudioData(audioBuffer)
          .then(decodeData => {
            this.source = audioCtx.createBufferSource();
            this.source.buffer = decodeData;
            this.source.connect(analyser);
            analyser.connect(audioCtx.destination);
            this.source.start(audioCtx.currentTime);
            this.setState({
              isPlaying: true,
              isLoading: false,
            });
            analyser.fftSize = 2048;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            const canvasCtx = canvas.getContext('2d');
            canvasCtx.clearRect(0, 0, width, 100);

            const draw = () => {
              this.drawVisual = requestAnimationFrame(draw);
              analyser.getByteFrequencyData(dataArray);

              canvasCtx.fillStyle = 'rgb(0, 0, 0)';
              canvasCtx.fillRect(0, 0, width, height);

              const barWidth = (width / bufferLength) * 2.5;
              let barHeight;
              let x = 0;

              for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i];

                canvasCtx.fillStyle = 'rgb(' + (96 + i * 3) + ',' + (163 + barWidth) + ',' + (0 + i) + ')';
                canvasCtx.fillRect(x, height - barHeight / 2, barWidth, barHeight / 2);

                x += barWidth + 1;
              }
            };

            draw();
          });
      });

    if (isPlaying) {
      this.source.stop(this.audioCtx.currentTime);
      window.cancelAnimationFrame(this.drawVisual);
      this.setState({
        isPlaying: false,
      });
    }
  }

  renderPlayList() {
    const {soundClips} = this.state;
    if (soundClips.length > 0) {
      return soundClips.map(soundClip =>
        (
          <button onClick={this.play}>{soundClip}</button>
        )
      );
    }
  }

  render() {
    return (
      <div className={styles.app}>
        <canvas className="visualizer" height="200"></canvas>
        <div className="sound-clips">{this.renderPlayList()}</div>
      </div>
    );
  }
}
