let timer;
let isClassActive = false;
let timeLeft = 3600; // Make timeLeft a global variable

function startSession() {
    if (isClassActive) return; // Prevent multiple clicks
    isClassActive = true;
    
    // Hide Start button and show Stop button
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('stopBtn').style.display = 'inline-block';
    
    // Show the presence table
    document.getElementById('presenceTable').style.display = 'block';

    // Start the countdown
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
    clearInterval(timer); // Stop the timer
    isClassActive = false; // Reset class activity flag
    
    // Calculate total time used
    totalTimeUsed = 3600 - timeLeft;

    // Convert total time used into minutes and seconds
    let usedMinutes = Math.floor(totalTimeUsed / 60);
    let usedSeconds = totalTimeUsed % 60;

    // Reset UI: hide Stop button, show Start button, and hide table
    document.getElementById('startBtn').style.display = 'inline-block';
    document.getElementById('stopBtn').style.display = 'none';
    document.getElementById('presenceTable').style.display = 'none';
    document.getElementById('timer').innerHTML = '';

    // display the total time used (you can uncomment this if needed)
    document.getElementById('totalTimeUsed').innerHTML = `Total Time Used: ${usedMinutes}:${usedSeconds < 10 ? '0' : ''}${usedSeconds}`;
}

function markPresence(studentId, button) {
    alert('Student ' + studentId + ' marked as present.');

    // Change button text to "Hadir"
    button.innerHTML = 'Hadir';

    // Change button color after clicking
    button.style.backgroundColor = '#28a745'; // Green color for "present"
    button.style.color = 'white'; // Change text color to white
    button.disabled = true; // Disable the button after clicking
}
