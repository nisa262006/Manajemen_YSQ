let timer;
let isClassActive = false;
let timeLeft = 3600; // 60 minutes

function startSession() {
    if (isClassActive) return; // Prevent multiple clicks
    isClassActive = true;
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('stopBtn').style.display = 'inline-block';
    document.getElementById('presenceTable').style.display = 'block';

    // Set the statuses for each student
    const studentStatuses = [
        { name: 'Andi', status: 'Belum Memulai', color: '#dc3545' }, // Red
        { name: 'Budi', status: 'Berlangsung', color: '#ffc107' }, // Yellow
        { name: 'Citra', status: 'Telah Selesai', color: '#28a745' } // Green
    ];

    studentStatuses.forEach((student, index) => {
        const statusCell = document.querySelector(`#studentTableBody tr:nth-child(${index + 1}) .status`);
        statusCell.innerHTML = student.status;
        statusCell.style.backgroundColor = student.color;
    });

    
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
