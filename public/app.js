let recording = false;
let audioRecorder;
let audioBlob;

function toggleRecording() {
    if (!recording) {
        startRecording();
    } else {
        stopRecording();
    }
}

async function startRecording() {
    recording = true;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioRecorder = new MediaRecorder(stream);
    let audioChunks = [];

    audioRecorder.addEventListener('dataavailable', event => {
        audioChunks.push(event.data);
    });

    audioRecorder.addEventListener('stop', () => {
        audioBlob = new Blob(audioChunks);
        audioChunks = [];
        transcribeAudio();
    });

    audioRecorder.start();
    document.getElementById('recordButton').textContent = 'Stop Recording';
}

function stopRecording() {
    audioRecorder.stop();
    document.getElementById('recordButton').textContent = 'Start Recording';
    recording = false;
}

async function transcribeAudio() {
    const formData = new FormData();
    formData.append('audio', audioBlob);

    const whisperResponse = await fetch('/api/whisper', {
        method: 'POST',
        body: formData,
    });

    const whisperData = await whisperResponse.json();
    const transcription = whisperData.transcript;
    sendToGPT(transcription);
}

async function sendToGPT(transcription) {
    const gptResponse = await fetch('/api/gpt', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            'prompt': `Please clean up and summarize the following transcription: ${transcription}`,
            'max_tokens': 200
        }),
    });

    const gptData = await gptResponse.json();
    document.getElementById('transcription').textContent = gptData.choices[0].text;
}
