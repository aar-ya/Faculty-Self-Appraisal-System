 // ===== Global Variables =====
let currentFeature = 1;
let progress = 0;
let formStateData = {};
let modalResolve = null;

// Add this near the top with other global variables
let lastScrollPosition = 0;

// Add this after DOMContentLoaded event
window.addEventListener('scroll', handleScroll);

function handleScroll() {
    const progressBar = document.querySelector('.progress-bar-container');
    const currentScrollPosition = window.pageYOffset;
    
    if (currentScrollPosition <= 0) {
        // At top of page - always show
        progressBar.classList.remove('hide');
    } else if (currentScrollPosition < lastScrollPosition) {
        // Scrolling up - show
        progressBar.classList.remove('hide');
    } else {
        // Scrolling down - hide
        progressBar.classList.add('hide');
    }
    
    lastScrollPosition = currentScrollPosition;
}

// ===== DOM Content Loaded =====
document.addEventListener('DOMContentLoaded', function() {
    // Initialize form
    document.getElementById(`feature-${currentFeature}`).classList.add('active');
    updateProgressBar();
    
    // Setup all event listeners
    setupForm();
    
    // Initialize form data structure
    initializeFormData();
});

// ===== Form Initialization =====
function initializeFormData() {
    // Create form data structure for all sections
    for (let i = 1; i <= 10; i++) {
        formStateData[`feature-${i}`] = {
            completed: false,
            data: {},
            files: []
        };
    }
}

function setupForm() {
    // File input handlers
    setupFileInputs();
    
    // Score calculation
    setupScoreCalculation();
    
    // Add record buttons
    setupAddRecordButtons();
    
    // Form submission
    document.getElementById("final-submit").addEventListener("click", validateBeforeSubmit);
    
    document.getElementById("final-submit").addEventListener("click", showReviewPage);

    // Modal setup
    setupModal();
    
    // Attribute score calculation
    setupAttributeScores();
}

// ===== Progress Tracking =====
function updateProgressBar() {
    const completedSections = Object.values(formStateData).filter(section => section.completed).length;
    const progressPercent = (completedSections / 10) * 100; // 10 total sections
    
    const progressElement = document.querySelector('.progress');
    const progressText = document.getElementById('progress-text');
    
    progressElement.style.width = `${progressPercent}%`;
    progressText.textContent = `${Math.round(progressPercent)}%`;
    
    // Update color based on completion
    progressElement.classList.toggle('complete', progressPercent >= 100);
}

// Modify completeMainFeature():
function completeMainFeature(featureId) {
    if (!validateSection(featureId)) {
        showToast('Please fill all required fields', 'error');
        return;
    }
    
    saveSectionData(featureId);
    formStateData[featureId].completed = true;
    updateProgressBar();
    showToast('Section saved successfully', 'success');
    
    if (currentFeature < 10) {
        setTimeout(() => nextFeature(), 1000);
    }
}

// ===== Form Validation =====
function validateSection(sectionId) {
    const section = document.getElementById(sectionId);
    const requiredInputs = section.querySelectorAll('[required]');
    let isValid = true;

    requiredInputs.forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('error');
            isValid = false;
            
            // Scroll to first error
            if (isValid === false) {
                input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                isValid = false; // Just to ensure we don't override
            }
        } else {
            input.classList.remove('error');
        }
        
        // Special validation for number inputs with max values
        if (input.type === 'number' && input.max) {
            if (parseFloat(input.value) > parseFloat(input.max)) {
                input.classList.add('error');
                isValid = false;
                showToast(`Value cannot exceed ${input.max}`, 'error');
                input.value = input.max;
            }
        }
    });

    return isValid;
}

function validateBeforeSubmit(event) {
    event.preventDefault();
    
    // Check all sections are complete
    const incompleteSections = Object.values(formData).filter(section => !section.completed).length;
    
    if (incompleteSections > 0) {
        showModal(
            'Incomplete Form',
            `You have ${incompleteSections} incomplete sections. Submit anyway?`,
            ['Cancel', 'Submit Anyway']
        ).then(confirmed => {
            if (confirmed) {
                submitSAR();
            }
        });
    } else {
        submitSAR();
    }
}

// ===== Section Navigation =====
function nextFeature() {
    if (currentFeature < 10) {
        navigateToFeature(currentFeature + 1);
    } else {
        showToast("You've reached the end of the form", 'info');
    }
}

function previousFeature() {
    if (currentFeature > 1) {
        navigateToFeature(currentFeature - 1);
    }
}

function navigateToFeature(featureNumber) {
    // Validate current section before leaving
    if (!validateSection(`feature-${currentFeature}`)) {
        showToast('Please fix errors before proceeding', 'error');
        return;
    }
    
    // Save current section data
    saveSectionData(`feature-${currentFeature}`);
    
    // Switch sections
    document.getElementById(`feature-${currentFeature}`).classList.remove('active');
    currentFeature = featureNumber;
    document.getElementById(`feature-${currentFeature}`).classList.add('active');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Update progress if this section wasn't completed yet
    if (!formData[`feature-${currentFeature}`].completed) {
        showToast(`Now editing Section ${currentFeature}`, 'info');
    }
}

// ===== Data Handling =====
function saveSectionData(sectionId) {
    const section = document.getElementById(sectionId);
    const inputs = section.querySelectorAll('input, select, textarea');
    
    formStateData[sectionId].data = {};
    formStateData[sectionId].records = [];
    
    // Save regular inputs
    inputs.forEach(input => {
        if (input.type !== 'file' && input.type !== 'button' && input.type !== 'submit') {
            const key = input.name || input.id;
            formStateData[sectionId].data[key] = input.value;
        }
    });
    
    // Save records from dynamic additions
    section.querySelectorAll('.record').forEach(record => {
        const recordData = {};
        record.querySelectorAll('input:not([type="button"]), select, textarea').forEach(input => {
            recordData[input.name || input.id] = input.value;
        });
        formStateData[sectionId].records.push(recordData);
    });
    
    // Mark as completed if all required fields are filled
    const requiredInputs = section.querySelectorAll('[required]');
    const allRequiredFilled = Array.from(requiredInputs).every(input => input.value.trim() !== '');
    
    if (allRequiredFilled) {
        formStateData[sectionId].completed = true;
    }
}

// ===== File Upload Handling =====
function setupFileInputs() {
    const fileInputs = [
        'event-file-1a', 'event-file-1b-i', 'event-file-1b-ii', 'event-file-2', 
        'event-file-3', 'event-file-4a', 'event-file-4b-1', 'event-file-4b-2', 
        'event-file-4b-3', 'event-file-4b-4', 'event-file-4b-5', 'event-file-4b-6',
        'event-file-5', 'event-file-6a-1', 'event-file-6a-2', 'event-file-6a-3',
        'event-file-6a-4', 'event-file-6a-5', 'event-file-6b', 'event-file-6c',
        'event-file-6d', 'cert-file', 'file-upload-7a', 'file-upload-7b',
        'file-upload-8a', 'file-upload-8b', 'grant-file', 'peer-review-file',
        'ieee-file', 'conference-file', 'book-file', 'reviewer-file',
        'patent-file', 'development-file', 'consultancy-file', 'awards-file'
    ];

    fileInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('change', function() {
                const fileNameDisplay = document.getElementById(`file-name-${inputId}`);
                if (fileNameDisplay) {
                    if (this.files.length > 0) {
                        fileNameDisplay.textContent = `Selected: ${this.files[0].name}`;
                        if (this.files.length > 1) {
                            fileNameDisplay.textContent += ` (+${this.files.length - 1} more)`;
                        }
                        
                        // Save files to formData
                        const sectionId = this.closest('.form-section').id;
                        formData[sectionId].files = Array.from(this.files);
                    } else {
                        fileNameDisplay.textContent = 'No file selected';
                        const sectionId = this.closest('.form-section').id;
                        formData[sectionId].files = [];
                    }
                }
            });
        }
    });
}

// ===== Record Management =====
// Replace the existing setupAddRecordButtons function with this:
function setupAddRecordButtons() {
    // Setup for internship guidance
    document.getElementById('add-internship-btn')?.addEventListener('click', addNewInternship);
    
    // Setup for collaborative research
    document.getElementById('add-collaboration-btn')?.addEventListener('click', addNewCollaboration);
    
    // Setup for sponsored projects
    document.getElementById('add-sponsored-project-btn')?.addEventListener('click', addNewSponsoredProject);
    
    // Setup for all other "Add New" buttons
    document.querySelectorAll('button[onclick*="addNewRecord"]').forEach(button => {
        button.addEventListener('click', function() {
            const containerId = this.getAttribute('onclick').match(/'([^']+)'/)[1];
            addNewRecord(containerId);
        });
    });
    
    // Setup for other add buttons
    document.querySelectorAll('.add-new').forEach(button => {
        if (!button.id) { // Skip buttons with specific handlers
            button.addEventListener('click', function() {
                const sectionId = this.closest('.subpoint')?.id || this.closest('.form-section')?.id;
                if (sectionId) {
                    addNewEntry(sectionId);
                }
            });
        }
    });
}

// Add this new function to handle generic record addition
function addNewRecord(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Clone the container
    const clone = container.cloneNode(true);
    
    // Clear input values in the clone
    clone.querySelectorAll('input:not([type="button"]):not([type="file"]), select, textarea').forEach(input => {
        input.value = '';
    });
    
    // Clear file display
    clone.querySelectorAll('p[id^="file-name-"]').forEach(p => {
        p.textContent = '';
    });
    
    // Add delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'delete-record';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete';
    deleteBtn.onclick = function() {
        clone.remove();
    };
    
    // Insert the clone after the original container
    container.parentNode.insertBefore(clone, container.nextSibling);
    
    // Insert the delete button
    clone.insertBefore(deleteBtn, clone.firstChild);
    
    showToast("New record added", 'success');
}

function addNewInternship() {
    const studentName = document.getElementById('student-name-7a').value;
    const industryName = document.getElementById('industry-name-7a').value;
    const stipend = document.getElementById('stipend-7a').value;
    const duration = document.getElementById('duration-7a').value;
    const progressReport = document.getElementById('progress-report-7a').checked ? "Yes" : "No";

    if (!studentName || !industryName || !duration) {
        showToast("Please fill out all mandatory fields", 'error');
        return;
    }

    const internshipSection = document.getElementById('internship-guidance-records');
    if (!internshipSection) return;

    const newRecord = document.createElement('div');
    newRecord.className = 'record';
    newRecord.innerHTML = `
        <div class="record-header">
            <h4>Internship Record</h4>
            <button class="delete-record" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        <p><strong>Student/Group:</strong> ${studentName}</p>
        <p><strong>Industry:</strong> ${industryName}</p>
        <p><strong>Stipend:</strong> ${stipend || 'N/A'}</p>
        <p><strong>Duration:</strong> ${duration} weeks</p>
        <p><strong>Progress Report:</strong> ${progressReport}</p>
        <input type="hidden" name="internship_records[]" value="${JSON.stringify({
            studentName, industryName, stipend, duration, progressReport
        })}">
    `;

    internshipSection.appendChild(newRecord);
    resetFields(['student-name-7a', 'industry-name-7a', 'stipend-7a', 'duration-7a']);
    document.getElementById('progress-report-7a').checked = false;
    showToast("New internship record added", 'success');
}

function addNewCollaboration() {
    const particulars = document.getElementById('activity-particulars-8a').value;
    const industryName = document.getElementById('industry-name-8a').value;
    const collaborationNature = document.getElementById('collaboration-nature-8a').value;

    if (!particulars || !industryName || !collaborationNature) {
        showToast("Please fill out all mandatory fields", 'error');
        return;
    }

    const researchSection = document.getElementById('collaborative-research-records');
    if (!researchSection) return;

    const newRecord = document.createElement('div');
    newRecord.className = 'record';
    newRecord.innerHTML = `
        <div class="record-header">
            <h4>Collaboration Record</h4>
            <button class="delete-record" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        <p><strong>Particulars:</strong> ${particulars}</p>
        <p><strong>Industry:</strong> ${industryName}</p>
        <p><strong>Nature of Collaboration:</strong> ${collaborationNature}</p>
        <input type="hidden" name="collaboration_records[]" value="${JSON.stringify({
            particulars, industryName, collaborationNature
        })}">
    `;

    researchSection.appendChild(newRecord);
    resetFields(['activity-particulars-8a', 'industry-name-8a', 'collaboration-nature-8a']);
    showToast("New collaboration record added", 'success');
}

function addNewSponsoredProject() {
    const projectTitle = document.getElementById('project-title-8b').value;
    const sponsoredAmount = document.getElementById('sponsored-amount-8b').value;
    const sponsoringIndustry = document.getElementById('sponsoring-industry-8b').value;

    if (!projectTitle || !sponsoredAmount || !sponsoringIndustry) {
        showToast("Please fill out all mandatory fields", 'error');
        return;
    }

    const projectsSection = document.getElementById('sponsored-projects-records');
    if (!projectsSection) return;

    const newRecord = document.createElement('div');
    newRecord.className = 'record';
    newRecord.innerHTML = `
        <div class="record-header">
            <h4>Sponsored Project</h4>
            <button class="delete-record" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        <p><strong>Project Title:</strong> ${projectTitle}</p>
        <p><strong>Amount Sponsored:</strong> ₹${sponsoredAmount}</p>
        <p><strong>Sponsoring Industry:</strong> ${sponsoringIndustry}</p>
        <input type="hidden" name="sponsored_project_records[]" value="${JSON.stringify({
            projectTitle, sponsoredAmount, sponsoringIndustry
        })}">
    `;

    projectsSection.appendChild(newRecord);
    resetFields(['project-title-8b', 'sponsored-amount-8b', 'sponsoring-industry-8b']);
    showToast("New sponsored project record added", 'success');
}

function addNewEntry(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    const inputs = section.querySelectorAll('input:not([type="file"]):not([type="button"]):not([type="submit"]), select, textarea');
    const newEntry = document.createElement('div');
    newEntry.className = 'new-entry';
    newEntry.innerHTML = '<button class="delete-entry" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>';

    inputs.forEach(input => {
        if (input.type !== 'button' && input.type !== 'submit') {
            const label = document.createElement('label');
            label.textContent = input.previousElementSibling?.textContent || input.id.replace(/-/g, ' ');
            newEntry.appendChild(label);

            const clone = input.cloneNode(true);
            clone.value = '';
            newEntry.appendChild(clone);
        }
    });

    section.appendChild(newEntry);
    showToast("New entry added", 'success');
}

function resetFields(fieldIds) {
    fieldIds.forEach(id => {
        const field = document.getElementById(id);
        if (field) field.value = '';
    });
}

// ===== Score Calculation =====
function setupScoreCalculation() {
    // Setup attribute score calculation
    setupAttributeScores();
    
    // Setup other score calculations as needed
    document.querySelectorAll('input[type="number"][max]').forEach(input => {
        input.addEventListener('change', function() {
            if (parseFloat(this.value) > parseFloat(this.max)) {
                this.value = this.max;
                showToast(`Maximum value is ${this.max}`, 'warning');
            }
        });
    });
}

function setupAttributeScores() {
    const scoreInputs = document.querySelectorAll('.attribute-score');
    
    scoreInputs.forEach(input => {
        input.addEventListener('input', calculateAttributeTotal);
    });
}

function calculateAttributeTotal() {
    let total = 0;
    const scoreInputs = document.querySelectorAll('.attribute-score');
    
    scoreInputs.forEach(input => {
        total += parseFloat(input.value) || 0;
    });
    
    const totalElement = document.getElementById('attribute-total');
    if (totalElement) {
        totalElement.textContent = total;
        
        // Visual feedback
        if (total >= 8) {
            totalElement.style.color = 'var(--success-color)';
        } else if (total >= 5) {
            totalElement.style.color = 'var(--primary-color)';
        } else {
            totalElement.style.color = 'var(--danger-color)';
        }
    }
}

// ===== Modal System =====
// In your attribute.js file, update these functions:

function setupModal() {
    const modal = document.getElementById('confirmation-modal');
    const closeBtn = document.querySelector('.close-modal');
    const cancelBtn = document.getElementById('modal-cancel');
    const confirmBtn = document.getElementById('modal-confirm');
    
    // Close modal when clicking X, cancel button, or outside
    [closeBtn, cancelBtn].forEach(btn => {
        btn.addEventListener('click', () => {
            modal.style.display = 'none';
            if (modalResolve) modalResolve(false);
        });
    });
    
    confirmBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        if (modalResolve) modalResolve(true);
    });
    
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
            if (modalResolve) modalResolve(false);
        }
    });
}

function showModal(title, message, buttons = ['Cancel', 'Confirm']) {
    const modal = document.getElementById('confirmation-modal');
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-message').textContent = message;
    
    const cancelBtn = document.getElementById('modal-cancel');
    const confirmBtn = document.getElementById('modal-confirm');
    
    cancelBtn.textContent = buttons[0];
    confirmBtn.textContent = buttons[1];
    
    modal.style.display = 'block';
    
    return new Promise((resolve) => {
        modalResolve = resolve;
    });
}

// ===== Toast Notifications =====
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon;
    switch(type) {
        case 'success':
            icon = '<i class="fas fa-check-circle"></i>';
            break;
        case 'error':
            icon = '<i class="fas fa-exclamation-circle"></i>';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-triangle"></i>';
            break;
        default:
            icon = '<i class="fas fa-info-circle"></i>';
    }
    
    toast.innerHTML = `${icon} ${message}`;
    container.appendChild(toast);
    
    // Remove toast after animation
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// ===== Form Submission =====
async function submitSAR(event) {
    event.preventDefault();
    try {
        // Show loading state
        const submitBtn = document.getElementById("final-submit");
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        
        // Validate all sections
        let allValid = true;
        for (let i = 1; i <= 10; i++) {
            if (!validateSection(`feature-${i}`)) {
                allValid = false;
                navigateToFeature(i);
                showToast(`Please complete Section ${i}`, 'error');
                break;
            }
        }
        
        if (!allValid) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit SAR Form';
            return;
        }
        
        // Create FormData
        const form = document.getElementById("sar-form");
        const formDataObj = new FormData(form);
        
        // Add all form data to FormData
        for (const [section, data] of Object.entries(formStateData)) {
            formDataObj.append(`section_${section}`, JSON.stringify(data.data));
        }
        
        // Send to server
        const response = await fetch("http://127.0.0.1:5000/submit_sar", {
            method: "POST",
            body: formDataObj
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.status === "success") {
            showToast("Form submitted successfully!", 'success');
            // Optionally redirect or reset form
            // window.location.href = "/success.html";
        } else {
            throw new Error(result.message || "Unknown error occurred");
        }
    } catch (error) {
        console.error("Submission error:", error);
        showToast(`Submission failed: ${error.message}`, 'error');
    } finally {
        const submitBtn = document.getElementById("final-submit");
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit SAR Form';
        }
    }
}

// Add these new functions:
function showReviewPage(event) {
    event.preventDefault();
    
    // Save all form data first
    for (let i = 1; i <= 10; i++) {
        saveSectionData(`feature-${i}`);
    }
    
    // Store in sessionStorage
    sessionStorage.setItem('sarFormData', JSON.stringify(formStateData));
    
    // Redirect to review page
    window.location.href = '/sar_review';
}

function closeModal() {
    document.getElementById('confirmation-modal').style.display = 'none';
}
