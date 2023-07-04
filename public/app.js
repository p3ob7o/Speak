let mediaRecorder;
let recordedBlobs;
let recordButton = document.querySelector('button');  // Get a reference to the button
let transcriptDisplay = document.createElement('p');  // Create a paragraph to display the transcript
document.body.appendChild(transcriptDisplay);  // Add the paragraph to the body of the document
let cleanupButton = document.createElement('button');  // Create the 'Clean up and summarize' button
cleanupButton.textContent = 'Clean up and summarize';
document.body.appendChild(cleanupButton);  // Add the button to the body of the document
cleanupButton.style.display = 'none';  // Hide the button until we have a transcript
let transcript;  // This will hold the transcript from Whisper

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
        recordButton.textContent = 'Start Recording';  // Change button text to 'Start Recording'
    };

    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start(10);  // collect 10ms of data
    console.log('MediaRecorder started', mediaRecorder);
    recordButton.textContent = 'Stop Recording';  // Change button text to 'Stop Recording'
}

function stopRecording() {
    mediaRecorder.stop();
}

function handleDataAvailable(event) {
    if (event.data && event.data.size > 0) {
        recordedBlobs.push(event.data);
    }
}

ffunction sendToWhisperAPI(audioBlob) {
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
        .then(response => {
            if (!response.ok) {
                throw new Error('Whisper API request failed');
            }
            return response.json();
        })
        .then(data => {
            transcript = data.transcription;
            transcriptDisplay.textContent = 'Transcript: ' + transcript;  // Display the transcript
            cleanupButton.style.display = 'block';  // Show the 'Clean up and summarize' button
        })
        .catch(error => {
            console.error('Error:', error);
            if (error instanceof SyntaxError) {
                response.text().then(errorText => {
                    console.error('Error response:', errorText);
                });
            }
        });
    };

    reader.readAsDataURL(audioBlob);
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
    cleanupButton.style.display = 'none';  // Hide the button while processing
    sendToGptAPI();
});
