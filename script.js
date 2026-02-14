document.addEventListener("DOMContentLoaded", function () {

    /* =========================
       1. DATA CONFIGURATION
    ========================= */
    
    // Faculty Database (Static Info)
    const facultyDB = {
        1: { name: "Dr. Arjun Sharma", course: "Web Development" },
        2: { name: "Prof. Sarah Lee", course: "Database Systems" },
        3: { name: "Dr. K. Venkat", course: "Computer Networks" },
        4: { name: "Prof. Anita Roy", course: "Embedded Systems" },
        5: { name: "Dr. James Wilson", course: "Discrete Math" }
    };

    // State Variables
    let currentUser = "";
    let currentFacultyId = null;
    let sessionVotes = []; // Tracks IDs voted in THIS session [1, 3]
    let chartInstance = null;
    let dashboardSelectedFaculty = 1; // Default for dashboard

    // Initialize LocalStorage for Global Data (Simulating Backend)
    if (!localStorage.getItem("globalVotes")) {
        // Pre-fill with some dummy data for a good demo experience
        const initialData = {};
        for (let i = 1; i <= 5; i++) {
            initialData[i] = {
                teaching: 30 + Math.random() * 20,
                communication: 30 + Math.random() * 20,
                content: 30 + Math.random() * 20,
                punctuality: 30 + Math.random() * 20,
                count: 10
            };
        }
        localStorage.setItem("globalVotes", JSON.stringify(initialData));
        localStorage.setItem("registeredUsers", JSON.stringify([]));
    }

    /* =========================
       2. NAVIGATION LOGIC
    ========================= */

    function switchScreen(hideId, showId, stepIndex) {
        const hideEl = document.getElementById(hideId);
        const showEl = document.getElementById(showId);

        hideEl.classList.remove('active-section');
        hideEl.classList.add('hidden-section');

        setTimeout(() => {
            showEl.classList.remove('hidden-section');
            showEl.classList.add('active-section');
        }, 300);

        updateProgress(stepIndex);
    }

    function updateProgress(stepIndex) {
        const steps = ['step1-indicator', 'step2-indicator', 'step3-indicator', 'step4-indicator'];
        steps.forEach((id, index) => {
            const el = document.getElementById(id);
            if (index < stepIndex) {
                el.classList.add('active');
                el.querySelector('.circle').innerHTML = '<i class="fas fa-check"></i>';
            } else if (index === stepIndex) {
                el.classList.add('active');
                el.querySelector('.circle').innerHTML = getIconForStep(index);
            } else {
                el.classList.remove('active');
                el.querySelector('.circle').innerHTML = getIconForStep(index);
            }
        });
    }

    function getIconForStep(index) {
        const icons = ['<i class="fas fa-id-card"></i>', '<i class="fas fa-users"></i>', '<i class="fas fa-poll"></i>', '<i class="fas fa-chart-pie"></i>'];
        return icons[index];
    }

    /* =========================
       3. LOGIN LOGIC (Validation)
    ========================= */

    document.getElementById("loginBtn").addEventListener("click", function () {
        const input = document.getElementById("regInput");
        const regNo = input.value.trim().toUpperCase();
        const errorMsg = document.getElementById("loginError");

        // 1. Check Empty
        if (regNo === "") {
            errorMsg.textContent = "⚠ Please enter your Register Number.";
            return;
        }

        // 2. Check Database (LocalStorage)
        const usedUsers = JSON.parse(localStorage.getItem("registeredUsers"));
        
        if (usedUsers.includes(regNo)) {
            errorMsg.textContent = "⛔ Access Denied: You have already voted.";
            input.style.borderColor = "#ef4444";
            return;
        }

        // 3. Success
        currentUser = regNo;
        document.getElementById("displayRegNo").textContent = `User: ${currentUser}`;
        switchScreen("screen1", "screen2", 1);
        
        // Reset Inputs
        errorMsg.textContent = "";
        input.style.borderColor = "rgba(255,255,255,0.1)";
    });

    /* =========================
       4. LOBBY LOGIC (Faculty Selection)
    ========================= */

    window.selectFaculty = function(id) {
        // Prevent clicking if already voted
        if (sessionVotes.includes(id)) return;

        currentFacultyId = id;
        
        // Update Screen 3 Headers
        document.getElementById("votingTitle").textContent = `Evaluating: ${facultyDB[id].name}`;
        document.getElementById("votingSubtitle").textContent = facultyDB[id].course;

        // Reset Sliders
        resetSliders();

        switchScreen("screen2", "screen3", 2);
    };

    function updateLobbyUI() {
        // Update Badges
        sessionVotes.forEach(id => {
            const card = document.querySelector(`.faculty-card[data-id="${id}"]`);
            if (card) {
                card.classList.add("disabled-card");
                const badge = card.querySelector(".status-badge");
                badge.textContent = "Completed";
                badge.classList.remove("pending");
                badge.classList.add("completed");
            }
        });

        // Check for Completion (All 5 done)
        if (sessionVotes.length === 5) {
            const finishBtn = document.getElementById("finishBtn");
            finishBtn.classList.remove("disabled-btn");
            finishBtn.innerHTML = `View Final Dashboard <i class="fas fa-chart-line"></i>`;
            
            // Add Listener only once
            finishBtn.onclick = function() {
                completeSession();
            };
        }
    }

    window.goBackToLobby = function() {
        switchScreen("screen3", "screen2", 1);
    };

    /* =========================
       5. VOTING LOGIC
    ========================= */

    // Slider Listeners
    document.querySelectorAll(".slider").forEach(slider => {
        slider.addEventListener("input", function () {
            const bubble = document.getElementById("val-" + this.id);
            bubble.textContent = this.value;
            
            // Color Logic
            const val = parseInt(this.value);
            if(val < 5) bubble.style.backgroundColor = "#ef4444";
            else if(val < 8) bubble.style.backgroundColor = "#f59e0b";
            else bubble.style.backgroundColor = "#10b981";
        });
    });

    function resetSliders() {
        document.querySelectorAll(".slider").forEach(s => s.value = 5);
        document.querySelectorAll(".value-bubble").forEach(b => {
            b.textContent = "5";
            b.style.backgroundColor = "#f59e0b";
        });
        document.getElementById("suggestion").value = "";
    }

    document.getElementById("submitVote").addEventListener("click", function() {
        const btn = this;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        setTimeout(() => {
            // 1. Capture Data
            const t = parseInt(document.getElementById("teaching").value);
            const c = parseInt(document.getElementById("communication").value);
            const ct = parseInt(document.getElementById("content").value);
            const p = parseInt(document.getElementById("punctuality").value);

            // 2. Update Global Store (LocalStorage)
            const globalData = JSON.parse(localStorage.getItem("globalVotes"));
            
            // Add new scores to existing totals
            globalData[currentFacultyId].teaching += t;
            globalData[currentFacultyId].communication += c;
            globalData[currentFacultyId].content += ct;
            globalData[currentFacultyId].punctuality += p;
            globalData[currentFacultyId].count += 1; // Increment voter count

            localStorage.setItem("globalVotes", JSON.stringify(globalData));

            // 3. Update Session State
            sessionVotes.push(currentFacultyId);

            // 4. Return to Lobby
            btn.innerHTML = 'Submit & Return to Lobby <i class="fas fa-check-circle"></i>';
            updateLobbyUI();
            switchScreen("screen3", "screen2", 1);
            launchConfetti(20); // Mini confetti

        }, 800);
    });

    /* =========================
       6. SESSION COMPLETION
    ========================= */

    function completeSession() {
        // Mark User as "Voted" in database
        const usedUsers = JSON.parse(localStorage.getItem("registeredUsers"));
        usedUsers.push(currentUser);
        localStorage.setItem("registeredUsers", JSON.stringify(usedUsers));

        // Generate Selector Chips for Dashboard
        const chipContainer = document.getElementById("resultSelectors");
        chipContainer.innerHTML = ""; // Clear existing
        
        Object.keys(facultyDB).forEach(id => {
            const chip = document.createElement("div");
            chip.className = `chip ${id == 1 ? 'active-chip' : ''}`;
            chip.textContent = facultyDB[id].name;
            chip.onclick = () => loadDashboardData(id);
            chipContainer.appendChild(chip);
        });

        switchScreen("screen2", "screen4", 3);
        launchConfetti(100); // Big celebration
        loadDashboardData(1); // Load first faculty by default
    }

    /* =========================
       7. DASHBOARD LOGIC (Chart.js)
    ========================= */

    window.loadDashboardData = function(facultyId) {
        dashboardSelectedFaculty = facultyId;
        
        // Highlight active chip
        document.querySelectorAll(".chip").forEach(c => c.classList.remove("active-chip"));
        // Find the chip with matching text (simple way) or re-render. 
        // For simplicity, we just re-highlight based on click context usually, 
        // but here we just accept the visual click.
        // (In a real app, we'd bind IDs to chips better).

        const globalData = JSON.parse(localStorage.getItem("globalVotes"));
        const data = globalData[facultyId];
        const count = data.count;

        // Calculate Averages
        const avgT = (data.teaching / count).toFixed(1);
        const avgC = (data.communication / count).toFixed(1);
        const avgCt = (data.content / count).toFixed(1);
        const avgP = (data.punctuality / count).toFixed(1);

        // Update Text Info
        document.getElementById("res-name").textContent = facultyDB[facultyId].name;

        // Find Strongest/Weakest
        const scores = { 
            "Teaching": parseFloat(avgT), 
            "Communication": parseFloat(avgC), 
            "Content": parseFloat(avgCt), 
            "Punctuality": parseFloat(avgP) 
        };

        const sortedKeys = Object.keys(scores).sort((a,b) => scores[b] - scores[a]);
        document.getElementById("res-strong").textContent = sortedKeys[0]; // Highest
        document.getElementById("res-weak").textContent = sortedKeys[3];   // Lowest

        // Update Overall Score
        const overallAvg = ((parseFloat(avgT)+parseFloat(avgC)+parseFloat(avgCt)+parseFloat(avgP))/40) * 100;
        document.getElementById("performanceBar").style.width = overallAvg + "%";
        document.getElementById("performance-score").textContent = Math.round(overallAvg) + "%";

        renderChart([avgT, avgC, avgCt, avgP]);
    };

    function renderChart(dataArray) {
        const ctx = document.getElementById('resultsChart').getContext('2d');
        
        if (chartInstance) chartInstance.destroy();

        chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Teaching', 'Comm.', 'Content', 'Punctuality'],
                datasets: [{
                    label: 'Score (out of 10)',
                    data: dataArray,
                    backgroundColor: ['#6366f1', '#ec4899', '#06b6d4', '#f59e0b'],
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, max: 10, grid: { color: 'rgba(255,255,255,0.1)' } },
                    x: { grid: { display: false }, ticks: { color: 'white' } }
                }
            }
        });
    }

    // SIMULATION BUTTON
    document.getElementById("improveBtn").addEventListener("click", function() {
        const globalData = JSON.parse(localStorage.getItem("globalVotes"));
        
        // Boost everyone's score
        for (let i = 1; i <= 5; i++) {
            globalData[i].teaching += (globalData[i].count * 1.5);
            globalData[i].communication += (globalData[i].count * 1.5);
            globalData[i].content += (globalData[i].count * 1.5);
            globalData[i].punctuality += (globalData[i].count * 1.5);
        }
        
        localStorage.setItem("globalVotes", JSON.stringify(globalData));
        alert("📈 Simulation: Performance Improvement Program Initiated!");
        
        // Reload current view
        loadDashboardData(dashboardSelectedFaculty);
    });

    /* =========================
       8. UTILS
    ========================= */
    function launchConfetti(amount) {
        const colors = ['#6366f1', '#ec4899', '#06b6d4', '#f59e0b'];
        for (let i = 0; i < amount; i++) {
            const confetti = document.createElement('div');
            confetti.classList.add('confetti');
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 4000);
        }
    }
});