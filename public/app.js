let mediaRecorder;
let recordedBlobs;
let recordButton = document.querySelector('button');
let transcriptDisplay = document.createElement('p');
document.body.appendChild(transcriptDisplay);
let cleanupButton = document.createElement('button');
cleanupButton.textContent = 'Clean up and summarize';
document.body.appendChild(cleanupButton);
cleanupButton.style.display = 'none';
let transcript;

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
        recordButton.textContent = 'Start Recording';
    };

    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start(10);
    console.log('MediaRecorder started', mediaRecorder);
    recordButton.textContent = 'Stop Recording';
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
    let formData = new FormData();
    formData.append('file', audioBlob);

    fetch('/api/whisper', { method: 'POST', body: formData })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Whisper API request failed');
            }
        })
        .then(data => {
            transcript = data.transcription;
            transcriptDisplay.textContent = 'Transcript: ' + transcript;
            cleanupButton.style.display = 'block';
        })
        .catch(error => {
            console.error('Error:', error);
            console.error('Whisper API error:', error.message);
            transcriptDisplay.textContent = 'Transcript: Error retrieving transcription';
            cleanupButton.style.display = 'none';
        });
}

function sendToGptAPI() {
    fetch('/api/gpt', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            'prompt': 'Please clean up and summarize the following transcription:\n' + transcript,
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


recordButton.addEventListener('click', () => {
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

cleanupButton.addEventListener('click', () => {
    cleanupButton.style.display = 'none';
    sendToGptAPI();
});
