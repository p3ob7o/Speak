let mediaRecorder;
let recordedBlobs;

function startRecording() {
    recordedBlobs = [];
    let options = {mimeType: 'audio/webm'};

    try {
        mediaRecorder = new MediaRecorder(window.stream, options);
    } catch (e) {
        console.error('Exception while creating MediaRecorder:', e);
        return;
    }

    console.log('Created MediaRecorder', mediaRecorder, 'with options', options);

    mediaRecorder.onstop = (event) => {
        console.log('Recorder stopped: ', event);
        console.log('Recorded Blobs: ', recordedBlobs);
        sendToWhisperAPI(new Blob(recordedBlobs, {type: 'audio/webm'}));
    };

    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start(10);  // collect 10ms of data
    console.log('MediaRecorder started', mediaRecorder);
}

function stopRecording() {
    mediaRecorder.stop();
}

function handleDataAvailable(event) {
    if (event.data && event.data.size > 0) {
        recordedBlobs.push(event.data);
    }
}

function sendToWhisperAPI(audioBlob) {
    const reader = new FileReader();

    reader.onloadend = function() {
        const base64Audio = reader.result.split(',')[1];

        fetch('/api/whisper', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'audio_data': base64Audio
            })
        })
        .then(response => response.json())
        .then(data => {
            sendToGptAPI(data.transcription);
        })
        .catch(error => {
            console.error('Error:', error);
        });
    };

    reader.readAsDataURL(audioBlob);
}

function sendToGptAPI(transcription) {
    fetch('https://api.openai.com/v1/engines/davinci-codex/completions', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer YOUR_OPENAI_API_KEY',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            'prompt': 'Please clean up and summarize the following transcription:\n' + transcription,
            'max_tokens': 60
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log(data.choices[0].text);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

document.querySelector('button').addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        stopRecording();
    } else {
        navigator.mediaDevices.getUserMedia({audio: true, video: false})
        .then((stream) => {
            window.stream = stream;
            startRecording();
        });
    }
});
