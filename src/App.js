import React, { useState } from 'react';
import { createFFmpeg } from '@ffmpeg/ffmpeg';
import './App.css';

function App() {
  const [fileToUpload, setFileToUpload] = useState(null);
  const [message, setMessage] = useState('Click Start to transcode');
  const ffmpeg = createFFmpeg({
    log: true,
    progress: (info) => {
      setMessage(`Encoding progress ${info.ratio * 100}%`);
    },
  });
  
  const onFileChange = async (event) => {
    const buffer = await event.target.files[0].arrayBuffer();
    setFileToUpload(new Uint8Array(buffer));
  };

  const doTranscode = async () => {
    if (!fileToUpload) {
      console.log('Please upload a file');
      return;
    }

    const outputPath = './output';

    setMessage('Loading ffmpeg-core.js');
    await ffmpeg.load();
    setMessage('Start transcoding');
    ffmpeg.FS('writeFile', 'test.mp4', fileToUpload);
    ffmpeg.FS('mkdir', outputPath);

    await ffmpeg.run(
      '-i', 
      'test.mp4',    
      '-vf', 'scale=1280x720:force_original_aspect_ratio=decrease,pad=1280:720:-1:-1:color=black',  
      '-c:a', 'aac',
      '-b:a', '160k',
      '-ar', '48000',
      '-ac', '2',
      '-c:v', 'libx264',
      '-preset:v', 'ultrafast',
      '-pix_fmt', 'yuv420p',
      '-crf', '20',
      '-maxrate', '2808k',
      '-bufsize', '5616k',
      '-max_muxing_queue_size', '4096',
      '-g', '25',
      '-keyint_min', '25',
      '-force_key_frames', 'expr:gte(t,n_forced*1)',
      `${outputPath}/master.m3u8`,      
    );
    // delay 1s to wait for ffmpeg to finish writing files
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const files = ffmpeg.FS('readdir', outputPath);
    for (let i = 0; i < files.length; i++) {
      const fileName = files[i];
      if (fileName[0] === '.') continue;
      const data = ffmpeg.FS('readFile', `/output/${fileName}`);
      const a = document.createElement('a');
      const dataUrl = window.URL.createObjectURL(new Blob([data.buffer]));
      a.href = dataUrl;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(dataUrl);
      a.remove();
      console.log(files[i]);
    }
    setMessage('Complete transcoding');
  };
  return (
    <div className="App">
      <p/>
      <input type="file" onChange={onFileChange} />
      <button onClick={doTranscode}>Start</button>
      <p>{message}</p>
    </div>
  );
}

export default App;
