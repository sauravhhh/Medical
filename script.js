// Initialize reminders from localStorage
let reminders = JSON.parse(localStorage.getItem('medicineReminders')) || [];
let editingId = null;
let timerInterval = null;
let countdownInterval = null;

// DOM elements
const medicineForm = document.getElementById('medicine-form');
const remindersList = document.getElementById('reminders-list');
const noReminders = document.getElementById('no-reminders');
const timeSelection = document.getElementById('time-selection');
const formContainer = document.getElementById('form-container');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const editIdInput = document.getElementById('edit-id');
const pillAlertModal = document.getElementById('pill-alert-modal');
const alertMedicineName = document.getElementById('alert-medicine-name');
const alertMedicineDetails = document.getElementById('alert-medicine-details');
const nextReminderContainer = document.getElementById('next-reminder-container');
const nextReminderText = document.getElementById('next-reminder-text');
const nextReminderTime = document.getElementById('next-reminder-time');
const nextReminderCountdown = document.getElementById('next-reminder-countdown');
const frequencySelect = document.getElementById('frequency');

// Set today's date as default for start date
document.getElementById('start-date').valueAsDate = new Date();

// Initialize time selection based on default frequency
handleFrequencyChange();

// Start the timer system
startTimerSystem();

// Event Listeners
medicineForm.addEventListener('submit', handleFormSubmit);
frequencySelect.addEventListener('change', handleFrequencyChange);
cancelBtn.addEventListener('click', cancelEdit);

function handleFrequencyChange() {
    const frequency = frequencySelect.value;
    timeSelection.innerHTML = '';
    
    if (frequency === 'once-daily') {
        addTimeInput(1);
    } else if (frequency === 'twice-daily') {
        addTimeInput(1);
        addTimeInput(2);
    } else if (frequency === 'thrice-daily') {
        addTimeInput(1);
        addTimeInput(2);
        addTimeInput(3);
    }
}

function addTimeInput(number, timeValue = '', mealValue = '', specificTime = '') {
    const timeInputGroup = document.createElement('div');
    timeInputGroup.className = 'time-input-group bg-gray-50 p-3 rounded-lg';
    timeInputGroup.innerHTML = `
        <div class="grid grid-cols-3 gap-3">
            <div>
                <label class="block text-gray-700 font-medium mb-1">Time ${number}</label>
                <select id="time-${number}" class="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                    <option value="">Select time</option>
                    <option value="morning" ${timeValue === 'morning' ? 'selected' : ''}>Morning</option>
                    <option value="afternoon" ${timeValue === 'afternoon' ? 'selected' : ''}>Afternoon</option>
                    <option value="night" ${timeValue === 'night' ? 'selected' : ''}>Night</option>
                </select>
            </div>
            <div>
                <label class="block text-gray-700 font-medium mb-1">Specific Time</label>
                <input type="time" id="specific-time-${number}" class="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value="${specificTime}">
            </div>
            <div>
                <label class="block text-gray-700 font-medium mb-1">Meal Timing</label>
                <select id="meal-${number}" class="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                    <option value="">Select</option>
                    <option value="before" ${mealValue === 'before' ? 'selected' : ''}>Before Meal</option>
                    <option value="after" ${mealValue === 'after' ? 'selected' : ''}>After Meal</option>
                    <option value="anytime" ${mealValue === 'anytime' ? 'selected' : ''}>Anytime</option>
                </select>
            </div>
        </div>
    `;
    timeSelection.appendChild(timeInputGroup);
}

function startTimerSystem() {
    // Check immediately on load
    checkReminders();
    updateNextReminder();
    
    // Check every 10 seconds for more precision
    timerInterval = setInterval(() => {
        checkReminders();
        updateNextReminder();
    }, 10000);
    
    // Update countdown every second
    countdownInterval = setInterval(updateNextReminder, 1000);
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    // Get form values
    const medicineName = document.getElementById('medicine-name').value;
    const dosage = document.getElementById('dosage').value;
    const frequency = frequencySelect.value;
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const notes = document.getElementById('notes').value;
    
    // Get time and meal timing data
    const schedule = [];
    if (frequency === 'once-daily' || frequency === 'twice-daily' || frequency === 'thrice-daily') {
        const count = frequency === 'once-daily' ? 1 : frequency === 'twice-daily' ? 2 : 3;
        for (let i = 1; i <= count; i++) {
            const time = document.getElementById(`time-${i}`).value;
            const specificTime = document.getElementById(`specific-time-${i}`).value;
            const meal = document.getElementById(`meal-${i}`).value;
            if (time && meal) {
                schedule.push({ 
                    time, 
                    meal, 
                    specificTime,
                    lastTriggered: null 
                });
            }
        }
    }
    
    // Check if we're editing or adding
    if (editingId) {
        // Update existing reminder
        const reminderIndex = reminders.findIndex(r => r.id === editingId);
        if (reminderIndex !== -1) {
            reminders[reminderIndex] = {
                id: editingId,
                medicineName,
                dosage,
                frequency,
                schedule,
                startDate,
                endDate,
                notes,
                isActive: reminders[reminderIndex].isActive
            };
            showNotification('Reminder updated successfully!');
        }
    } else {
        // Create new reminder object
        const newReminder = {
            id: Date.now(),
            medicineName,
            dosage,
            frequency,
            schedule,
            startDate,
            endDate,
            notes,
            isActive: true
        };
        
        // Add to reminders array
        reminders.push(newReminder);
        showNotification('Reminder added successfully!');
    }
    
    // Save to localStorage
    saveReminders();
    
    // Reset form
    resetForm();
    
    // Update UI
    renderReminders();
    updateNextReminder();
}

function resetForm() {
    medicineForm.reset();
    document.getElementById('start-date').valueAsDate = new Date();
    handleFrequencyChange();
    editingId = null;
    editIdInput.value = '';
    formTitle.textContent = 'Add New Reminder';
    submitBtn.textContent = 'Add Reminder';
    cancelBtn.classList.add('hidden');
    formContainer.classList.remove('edit-mode');
}

function cancelEdit() {
    resetForm();
}

function saveReminders() {
    localStorage.setItem('medicineReminders', JSON.stringify(reminders));
}

function renderReminders() {
    // Clear current list
    remindersList.innerHTML = '';
    
    // Check if there are any reminders
    if (reminders.length === 0) {
        noReminders.classList.remove('hidden');
        return;
    }
    
    noReminders.classList.add('hidden');
    
    // Sort reminders by start date
    const sortedReminders = [...reminders].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    
    // Render each reminder
    sortedReminders.forEach(reminder => {
        const reminderCard = createReminderCard(reminder);
        remindersList.appendChild(reminderCard);
    });
}

function createReminderCard(reminder) {
    const card = document.createElement('div');
    card.className = `reminder-card bg-white border border-gray-200 rounded-lg p-4 ${reminder.isActive ? '' : 'opacity-60'}`;
    
    // Format dates
    const startDate = new Date(reminder.startDate).toLocaleDateString();
    const endDate = reminder.endDate ? new Date(reminder.endDate).toLocaleDateString() : 'Ongoing';
    
    // Format frequency for display
    const frequencyDisplay = {
        'once-daily': 'Once Daily',
        'twice-daily': 'Twice Daily',
        'thrice-daily': 'Thrice Daily',
        'as-needed': 'As Needed',
        'weekly': 'Weekly'
    };
    
    // Format schedule for display
    let scheduleDisplay = '';
    if (reminder.schedule && reminder.schedule.length > 0) {
        scheduleDisplay = reminder.schedule.map(s => {
            const timeDisplay = s.time.charAt(0).toUpperCase() + s.time.slice(1);
            const mealDisplay = s.meal === 'before' ? 'Before Meal' : s.meal === 'after' ? 'After Meal' : 'Anytime';
            const timeStr = s.specificTime ? ` at ${formatTime(s.specificTime)}` : '';
            return `${timeDisplay}${timeStr} (${mealDisplay})`;
        }).join(', ');
    }
    
    card.innerHTML = `
        <div class="flex justify-between items-start">
            <div>
                <h3 class="text-lg font-semibold text-gray-800">${reminder.medicineName}</h3>
                <div class="flex flex-wrap gap-2 mt-2">
                    <span class="dosage-badge text-xs font-medium px-2.5 py-0.5 rounded-full">${reminder.dosage}</span>
                    <span class="frequency-badge text-xs font-medium px-2.5 py-0.5 rounded-full">${frequencyDisplay[reminder.frequency]}</span>
                    <span class="time-badge text-xs font-medium px-2.5 py-0.5 rounded-full">Start: ${startDate}</span>
                    ${reminder.endDate ? `<span class="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800">End: ${endDate}</span>` : ''}
                    ${scheduleDisplay ? `<span class="schedule-badge text-xs font-medium px-2.5 py-0.5 rounded-full">${scheduleDisplay}</span>` : ''}
                </div>
                ${reminder.notes ? `<p class="mt-2 text-sm text-gray-600">${reminder.notes}</p>` : ''}
            </div>
            <div class="flex space-x-2">
                <button onclick="toggleReminderStatus(${reminder.id})" class="text-gray-500 hover:text-blue-600 transition-colors duration-200">
                    <i class="fas ${reminder.isActive ? 'fa-pause' : 'fa-play'}"></i>
                </button>
                <button onclick="editReminder(${reminder.id})" class="text-gray-500 hover:text-yellow-600 transition-colors duration-200">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteReminder(${reminder.id})" class="text-gray-500 hover:text-red-600 transition-colors duration-200">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    return card;
}

function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

function editReminder(id) {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;
    
    // Set editing mode
    editingId = id;
    editIdInput.value = id;
    formTitle.textContent = 'Edit Reminder';
    submitBtn.textContent = 'Update Reminder';
    cancelBtn.classList.remove('hidden');
    formContainer.classList.add('edit-mode');
    
    // Populate form with reminder data
    document.getElementById('medicine-name').value = reminder.medicineName;
    document.getElementById('dosage').value = reminder.dosage;
    frequencySelect.value = reminder.frequency;
    document.getElementById('start-date').value = reminder.startDate;
    document.getElementById('end-date').value = reminder.endDate || '';
    document.getElementById('notes').value = reminder.notes || '';
    
    // Handle frequency change to show appropriate time inputs
    handleFrequencyChange();
    
    // Populate time and meal data
    if (reminder.schedule && reminder.schedule.length > 0) {
        reminder.schedule.forEach((item, index) => {
            const timeSelect = document.getElementById(`time-${index + 1}`);
            const specificTimeInput = document.getElementById(`specific-time-${index + 1}`);
            const mealSelect = document.getElementById(`meal-${index + 1}`);
            if (timeSelect) timeSelect.value = item.time;
            if (specificTimeInput) specificTimeInput.value = item.specificTime || '';
            if (mealSelect) mealSelect.value = item.meal;
        });
    }
    
    // Scroll to form
    formContainer.scrollIntoView({ behavior: 'smooth' });
}

function toggleReminderStatus(id) {
    const reminderIndex = reminders.findIndex(r => r.id === id);
    if (reminderIndex !== -1) {
        reminders[reminderIndex].isActive = !reminders[reminderIndex].isActive;
        saveReminders();
        renderReminders();
        updateNextReminder();
        showNotification(reminders[reminderIndex].isActive ? 'Reminder activated!' : 'Reminder paused!');
    }
}

function deleteReminder(id) {
    if (confirm('Are you sure you want to delete this reminder?')) {
        reminders = reminders.filter(r => r.id !== id);
        saveReminders();
        renderReminders();
        updateNextReminder();
        showNotification('Reminder deleted!');
    }
}

function checkReminders() {
    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 5); // HH:MM format
    const today = now.toDateString();
    
    reminders.forEach(reminder => {
        if (!reminder.isActive) return;
        
        if (reminder.schedule && reminder.schedule.length > 0) {
            reminder.schedule.forEach(scheduleItem => {
                // Check if specific time is set and matches current time
                if (scheduleItem.specificTime && scheduleItem.specificTime === currentTime) {
                    // Check if already triggered today
                    const lastTriggered = scheduleItem.lastTriggered;
                    if (!lastTriggered || new Date(lastTriggered).toDateString() !== today) {
                        // Trigger the alert
                        showPillAlert(reminder, scheduleItem);
                        playSound();
                        
                        // Update last triggered time
                        scheduleItem.lastTriggered = new Date().toISOString();
                        saveReminders();
                    }
                }
            });
        }
    });
}

function updateNextReminder() {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes
    
    let nextReminder = null;
    let nextReminderTime = null;
    let minTimeDiff = Infinity;
    
    reminders.forEach(reminder => {
        if (!reminder.isActive || !reminder.schedule) return;
        
        reminder.schedule.forEach(scheduleItem => {
            if (!scheduleItem.specificTime) return;
            
            const [hours, minutes] = scheduleItem.specificTime.split(':').map(Number);
            const reminderTime = hours * 60 + minutes;
            
            // Calculate time difference (considering next day if time has passed)
            let timeDiff = reminderTime - currentTime;
            if (timeDiff < 0) {
                timeDiff += 24 * 60; // Add 24 hours for next day
            }
            
            if (timeDiff < minTimeDiff) {
                minTimeDiff = timeDiff;
                nextReminder = reminder;
                nextReminderTime = scheduleItem;
            }
        });
    });
    
    if (nextReminder && nextReminderTime) {
        // Show next reminder card
        nextReminderContainer.classList.remove('hidden');
        
        const timeDisplay = nextReminderTime.time.charAt(0).toUpperCase() + nextReminderTime.time.slice(1);
        const mealDisplay = nextReminderTime.meal === 'before' ? 'Before Meal' : nextReminderTime.meal === 'after' ? 'After Meal' : 'Anytime';
        
        nextReminderText.textContent = `${nextReminder.medicineName} - ${nextReminder.dosage}`;
        nextReminderTime.textContent = formatTime(nextReminderTime.specificTime);
        
        // Update countdown
        const hours = Math.floor(minTimeDiff / 60);
        const minutes = minTimeDiff % 60;
        nextReminderCountdown.textContent = `in ${hours}h ${minutes}m`;
    } else {
        // Hide next reminder card
        nextReminderContainer.classList.add('hidden');
    }
}

function showPillAlert(reminder, scheduleItem) {
    const timeDisplay = scheduleItem.time.charAt(0).toUpperCase() + scheduleItem.time.slice(1);
    const mealDisplay = scheduleItem.meal === 'before' ? 'Before Meal' : scheduleItem.meal === 'after' ? 'After Meal' : 'Anytime';
    const timeStr = scheduleItem.specificTime ? ` at ${formatTime(scheduleItem.specificTime)}` : '';
    
    alertMedicineName.textContent = `${reminder.medicineName} - ${reminder.dosage}`;
    alertMedicineDetails.textContent = `${timeDisplay}${timeStr} (${mealDisplay})`;
    pillAlertModal.classList.remove('hidden');
}

function closePillAlert() {
    pillAlertModal.classList.add('hidden');
}

function playSound() {
    // Create audio context
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create oscillator
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Configure sound
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    // Play sound
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg transform transition-transform duration-300 translate-y-20';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-y-20');
    }, 10);
    
    // Animate out and remove
    setTimeout(() => {
        notification.classList.add('translate-y-20');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Initial render
renderReminders();
