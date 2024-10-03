let timer;
let isClassActive = false;

function startSession() {
    if (isClassActive) return; // Prevent multiple clicks
    isClassActive = true;
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('stopBtn').style.display = 'inline-block';
    document.getElementById('presenceTable').style.display = 'block';

    let timeLeft = 300; // 5 minutes
    timer = setInterval(function() {
        if (timeLeft <= 0) {
            clearInterval(timer);
            stopSession();
        }
        let minutes = Math.floor(timeLeft / 60);
        let seconds = timeLeft % 60;
        document.getElementById('timer').innerHTML = `Time Left: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        timeLeft--;
    }, 1000);
}

function stopSession() {
    clearInterval(timer);
    isClassActive = false;
    document.getElementById('startBtn').style.display = 'inline-block';
    document.getElementById('stopBtn').style.display = 'none';
    document.getElementById('presenceTable').style.display = 'none';
    document.getElementById('timer').innerHTML = '';
}

function markPresence(studentId, button) {
    alert('Student ' + studentId + ' marked as present.');
    
    // Change button color after clicking
    button.style.backgroundColor = '#28a745'; // Green
    button.style.color = 'white'; // Change text color to white
    button.disabled = true; // Disable the button after clicking
}
