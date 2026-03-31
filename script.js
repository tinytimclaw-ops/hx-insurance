// Form state
let currentStep = 1;
const formData = {
  coverType: null,
  region: null,
  destId: null,
  startDate: null,
  endDate: null,
  travellers: [],
  holidayValue: null,
  certificateID: null,
  hash: null,
  policySubtype: 'non-medical'
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initializeForm();
  setupEventListeners();
});

function initializeForm() {
  // Set minimum start date to today
  const today = new Date().toISOString().split('T')[0];
  const startDateInput = document.getElementById('startDate');
  if (startDateInput) {
    startDateInput.setAttribute('min', today);
    startDateInput.value = datePlus(1); // Default to tomorrow
  }
}

function setupEventListeners() {
  // Cover type selection
  const coverTypeInputs = document.querySelectorAll('input[name="coverType"]');
  coverTypeInputs.forEach(input => {
    input.addEventListener('change', (e) => {
      formData.coverType = e.target.value;
    });
  });

  // Region selection
  const regionSelect = document.getElementById('region');
  if (regionSelect) {
    regionSelect.addEventListener('change', handleRegionChange);
  }

  // Start date changes
  const startDateInput = document.getElementById('startDate');
  if (startDateInput) {
    startDateInput.addEventListener('change', handleStartDateChange);
  }

  // Traveller count changes
  const travellerCountSelect = document.getElementById('travellerCount');
  if (travellerCountSelect) {
    travellerCountSelect.addEventListener('change', handleTravellerCountChange);
    // Initialize with default count
    handleTravellerCountChange();
  }

  // Medical conditions
  const medicalConditionsInputs = document.querySelectorAll('input[name="medicalConditions"]');
  medicalConditionsInputs.forEach(input => {
    input.addEventListener('change', handleMedicalConditionsChange);
  });

  // Undiagnosed symptoms
  const symptomInputs = document.querySelectorAll('input[name="undiagnosedSymptoms"]');
  symptomInputs.forEach(input => {
    input.addEventListener('change', handleSymptomChange);
  });

  // Form submission
  const form = document.getElementById('quoteForm');
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }
}

// Step navigation
function nextStep() {
  if (!validateCurrentStep()) {
    return;
  }

  // Mark current step as completed
  document.querySelector(`.step[data-step="${currentStep}"]`)?.classList.add('completed');

  currentStep++;
  updateStepDisplay();
}

function prevStep() {
  if (currentStep > 1) {
    currentStep--;
    updateStepDisplay();
  }
}

function updateStepDisplay() {
  // Hide all steps
  document.querySelectorAll('.form-step').forEach(step => {
    step.classList.remove('active');
  });

  // Show current step
  const activeStep = document.querySelector(`.form-step[data-step="${currentStep}"]`);
  if (activeStep) {
    activeStep.classList.add('active');
  }

  // Update step indicator
  document.querySelectorAll('.step').forEach((step, index) => {
    const stepNum = index + 1;
    if (stepNum < currentStep) {
      step.classList.add('completed');
      step.classList.remove('active');
    } else if (stepNum === currentStep) {
      step.classList.add('active');
      step.classList.remove('completed');
    } else {
      step.classList.remove('active', 'completed');
    }
  });

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function validateCurrentStep() {
  const activeStep = document.querySelector(`.form-step[data-step="${currentStep}"]`);
  if (!activeStep) return false;

  // Get all required inputs in current step
  const requiredInputs = activeStep.querySelectorAll('[required]');
  let isValid = true;

  requiredInputs.forEach(input => {
    if (input.type === 'radio') {
      const radioGroup = activeStep.querySelectorAll(`[name="${input.name}"]`);
      const checked = Array.from(radioGroup).some(radio => radio.checked);
      if (!checked) {
        isValid = false;
        input.parentElement.style.borderColor = '#FF5F68';
      }
    } else if (!input.value) {
      isValid = false;
      input.style.borderColor = '#FF5F68';
    } else {
      input.style.borderColor = '#E0E0E0';
    }
  });

  if (!isValid) {
    alert('Please fill in all required fields');
  }

  return isValid;
}

// Region and destination handling
function handleRegionChange(e) {
  const region = e.target.value;
  formData.region = region;

  const europeQuestion = document.getElementById('europeQuestion');
  const worldwideQuestion = document.getElementById('worldwideQuestion');

  europeQuestion.style.display = region === 'Europe' ? 'block' : 'none';
  worldwideQuestion.style.display = region === 'Worldwide' ? 'block' : 'none';

  // Calculate initial dest_id
  calculateDestinationId();
}

function calculateDestinationId() {
  const { coverType, region } = formData;

  if (!coverType || !region) return;

  const europeHighRisk = document.getElementById('europeHighRisk')?.checked || false;
  const worldwideUSA = document.getElementById('worldwideUSA')?.checked || false;

  // Destination ID mapping from insurance_search.md
  const destMap = {
    'single-UK': 1,
    'single-Europe-no': 6,
    'single-Europe-yes': 7,
    'single-ANZ': 4,
    'single-Worldwide-no': 5,
    'single-Worldwide-yes': 3,
    'annual-UK': 1,
    'annual-Europe': 7, // annual Europe is always 7
    'annual-ANZ': 5,
    'annual-Worldwide-no': 5,
    'annual-Worldwide-yes': 3
  };

  let key = `${coverType}-${region}`;

  if (region === 'Europe' && coverType === 'single') {
    key += europeHighRisk ? '-yes' : '-no';
  } else if (region === 'Worldwide') {
    key += worldwideUSA ? '-yes' : '-no';
  }

  formData.destId = destMap[key] || 1;
}

// Date handling
function handleStartDateChange(e) {
  formData.startDate = e.target.value;

  const endDateInput = document.getElementById('endDate');
  const dateHint = document.getElementById('dateHint');
  const endDateGroup = document.getElementById('endDateGroup');

  if (formData.coverType === 'annual') {
    // Annual: hide end date, calculate automatically
    endDateGroup.style.display = 'none';
    const start = new Date(formData.startDate);
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + 1);
    end.setDate(end.getDate() - 1); // 1 year minus 1 day
    formData.endDate = end.toISOString().split('T')[0];
    dateHint.textContent = `Your annual policy will cover trips up to ${end.toLocaleDateString('en-GB')}`;
  } else {
    // Single: show end date, set default
    endDateGroup.style.display = 'block';
    const defaultEnd = new Date(formData.startDate);
    defaultEnd.setDate(defaultEnd.getDate() + 7);
    endDateInput.value = defaultEnd.toISOString().split('T')[0];
    endDateInput.setAttribute('min', formData.startDate);
    formData.endDate = endDateInput.value;
    dateHint.textContent = '';
  }
}

// Traveller handling
function handleTravellerCountChange() {
  const count = parseInt(document.getElementById('travellerCount').value);
  const container = document.getElementById('travellerDetails');

  container.innerHTML = '';

  for (let i = 0; i < count; i++) {
    const card = document.createElement('div');
    card.className = 'traveller-card';
    card.innerHTML = `
      <div class="traveller-header">Traveller ${i + 1}</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Title</label>
          <select class="form-control traveller-title" data-index="${i}" required>
            <option value="">Select</option>
            <option value="Mr">Mr</option>
            <option value="Mrs">Mrs</option>
            <option value="Ms">Ms</option>
            <option value="Miss">Miss</option>
            <option value="Dr">Dr</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">First name</label>
          <input type="text" class="form-control traveller-firstname" data-index="${i}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Last name</label>
          <input type="text" class="form-control traveller-lastname" data-index="${i}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Date of birth</label>
          <input type="date" class="form-control traveller-dob" data-index="${i}" max="${getMaxDob()}" required>
        </div>
      </div>
    `;
    container.appendChild(card);
  }
}

function getMaxDob() {
  const today = new Date();
  today.setFullYear(today.getFullYear() - 18); // Minimum age 18
  return today.toISOString().split('T')[0];
}

function collectTravellerData() {
  const count = parseInt(document.getElementById('travellerCount').value);
  const travellers = [];

  for (let i = 0; i < count; i++) {
    const title = document.querySelector(`.traveller-title[data-index="${i}"]`).value;
    const firstName = document.querySelector(`.traveller-firstname[data-index="${i}"]`).value;
    const lastName = document.querySelector(`.traveller-lastname[data-index="${i}"]`).value;
    const dobInput = document.querySelector(`.traveller-dob[data-index="${i}"]`).value;

    // Convert DD/MM/YYYY to YYYY-MM-DD if needed (input already gives YYYY-MM-DD)
    const dobParts = dobInput.split('-');
    const dob = `${dobParts[0]}-${dobParts[1]}-${dobParts[2]}`;

    travellers.push({
      title,
      first_name: firstName,
      last_name: lastName,
      dob
    });
  }

  formData.travellers = travellers;
}

// Medical screening
function handleMedicalConditionsChange(e) {
  const symptomQuestion = document.getElementById('symptomQuestion');

  if (e.target.value === 'no') {
    symptomQuestion.style.display = 'block';
    formData.policySubtype = 'non-medical';
  } else {
    symptomQuestion.style.display = 'none';
    formData.policySubtype = 'medical';
  }
}

function handleSymptomChange(e) {
  const symptomWarning = document.getElementById('symptomWarning');

  if (e.target.value === 'yes') {
    symptomWarning.style.display = 'block';
  } else {
    symptomWarning.style.display = 'none';
  }
}

// Form submission and redirect
async function handleFormSubmit(e) {
  e.preventDefault();

  if (!validateCurrentStep()) {
    return;
  }

  // Show loading
  document.getElementById('loadingOverlay').style.display = 'flex';

  // Collect all form data
  calculateDestinationId();
  collectTravellerData();
  formData.holidayValue = parseInt(document.getElementById('holidayValue').value);

  // Get medical answer
  const medicalConditions = document.querySelector('input[name="medicalConditions"]:checked')?.value;

  try {
    // Call HAPI certificate API
    const certResponse = await callHapiCertificate();

    if (certResponse) {
      formData.certificateID = certResponse.certificateID;
      formData.hash = certResponse.insHash;
    }

    // Build redirect URL
    const redirectUrl = buildRedirectUrl(medicalConditions === 'yes');

    // Redirect
    window.location.href = redirectUrl;

  } catch (error) {
    console.error('Error getting quote:', error);
    // Continue without cert
    const redirectUrl = buildRedirectUrl(medicalConditions === 'yes');
    window.location.href = redirectUrl;
  }
}

async function callHapiCertificate() {
  const sid = generateRandomHex(32);

  const requestBody = {
    from: formData.startDate,
    to: formData.endDate,
    destination_id: formData.destId,
    agent: 'WEB1',
    policySubtype: formData.policySubtype,
    holidayValue: formData.holidayValue,
    family_group_id: 1,
    country: 'GBR',
    cruise: false,
    email: null,
    unrecSend: 1,
    renewal: 0,
    people: formData.travellers
  };

  const response = await fetch(
    `https://hapi.holidayextras.co.uk/insurance/certificates/new?token=4ad4966f-0b6a-49a9-8601-2a456aeb5c03&sid=${sid}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    }
  );

  if (!response.ok) {
    throw new Error('Certificate API call failed');
  }

  return await response.json();
}

function buildRedirectUrl(isMedical) {
  const baseUrl = 'https://www.holidayextras.com/static/?selectProduct=ins&#/insurance';
  const path = isMedical ? '/medicalScreening' : '';

  const params = new URLSearchParams({
    agent: 'WEB1',
    ppts: '',
    customer_ref: '',
    annual_only: formData.coverType === 'annual' ? '1' : '0',
    out: formData.startDate,
    in: formData.endDate,
    destination: '',
    destination_id: formData.destId.toString(),
    travellers: formData.travellers.length.toString(),
    renewal: '0',
    cruise: '0',
    winterSports: '0',
    carHireExcess: '0',
    unrecSend: '0',
    holidayValue: formData.holidayValue.toString(),
    familyGroupID: '1',
    policySubtype: formData.policySubtype
  });

  if (formData.certificateID) {
    params.set('certificateID', formData.certificateID.toString());
    params.set('hash', formData.hash);
  }

  return `${baseUrl}${path}?${params.toString()}`;
}

// Utilities
function datePlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function generateRandomHex(length) {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}
