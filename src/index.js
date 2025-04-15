import FormValidator from './FormValidator';
import './styles.css';

// Example usage
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('example-form');
  if (!form) return;

  const validator = new FormValidator();
  
  // Set up interaction tracking to detect real users vs bots
  validator.setupInteractionTracking(form);

  // Store initial form state timestamp to detect automated submissions
  const formLoadTime = Date.now();
  
  // Generate a unique CSRF token for this session
  const csrfToken = generateCSRFToken();
  
  // Add the CSRF token to the form
  const csrfField = document.createElement('input');
  csrfField.type = 'hidden';
  csrfField.name = 'csrf_token';
  csrfField.value = csrfToken;
  form.appendChild(csrfField);

  const validationRules = {
    name: {
      required: true,
      minLength: 2,
      maxLength: 50
    },
    email: {
      required: true,
      email: true
    },
    phone: {
      required: true,
      phone: true
    },
    message: {
      required: true,
      minLength: 10,
      maxLength: 500
    },
    captcha: {
      required: true
    }
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Check if the submission seems too quick (likely bot)
    const submissionTime = Date.now() - formLoadTime;
    if (submissionTime < 1000) { // Less than 1 second is suspicious
      console.warn('Suspicious submission detected: Too quick');
      showFormError('Suspicious activity detected. Please try again.');
      return;
    }
    
    // Validate the CAPTCHA (simple check for the value "5")
    const captchaField = form.elements['captcha'];
    if (!captchaField || captchaField.value !== '5') {
      showFormError('Please answer the CAPTCHA question correctly.');
      captchaField.classList.add('error');
      return;
    } else {
      captchaField.classList.remove('error');
      captchaField.classList.add('success');
    }
    
    const result = validator.validateForm(form, validationRules);
    
    if (result.isBotAttempt) {
      // Handle bot attempt
      showFormError('Our system detected unusual activity. Please try again later.');
      logSecurityEvent('Bot submission attempt detected', form);
      return;
    }
    
    if (result.hasSuspiciousContent) {
      // Handle suspicious content
      showFormError('Your submission contains potentially harmful content.');
      logSecurityEvent('Suspicious content detected', result.data);
      return;
    }
    
    if (result.isValid) {
      console.log('Form data:', result.data);
      
      // Here you would typically send the data to your server
      // Include the CSRF token in the request
      sendFormData(result.data, csrfToken)
        .then(response => {
          alert('Form submitted successfully!');
          form.reset();
          // Hide any error messages
          hideFormError();
        })
        .catch(error => {
          showFormError('Error submitting form. Please try again.');
        });
    } else {
      console.log('Validation errors:', result.errors);
      if (result.errors.form) {
        showFormError(result.errors.form[0]);
      }
    }
  });

  // Real-time validation on input
  form.querySelectorAll('input, textarea').forEach(field => {
    // Skip the honeypot field from the UI validation feedback
    if (field.name === 'website') return;
    
    field.addEventListener('blur', () => {
      const fieldRules = validationRules[field.name];
      if (fieldRules) {
        validator.validateField(field, fieldRules);
      }
      
      // Special handling for CAPTCHA field
      if (field.name === 'captcha') {
        if (field.value !== '5' && field.value !== '') {
          validator.showError(field, 'Please enter the correct value');
        }
      }
    });
  });
  
  // Track mouse movement to detect real users
  let mouseMoved = false;
  document.addEventListener('mousemove', () => {
    mouseMoved = true;
  });
  
  // Track user interactions for bot detection
  let keyboardInteraction = 0;
  document.addEventListener('keydown', () => {
    keyboardInteraction++;
  });
});

// Helper functions
function generateCSRFToken() {
  // Simple token generation for example purposes
  // In production, use a more secure method
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

function showFormError(message) {
  let errorContainer = document.getElementById('form-error');
  if (!errorContainer) {
    errorContainer = document.createElement('div');
    errorContainer.id = 'form-error';
    errorContainer.className = 'form-error';
    errorContainer.setAttribute('role', 'alert');
    
    const form = document.getElementById('example-form');
    form.parentNode.insertBefore(errorContainer, form);
  }
  
  errorContainer.textContent = message;
  errorContainer.style.display = 'block';
}

function hideFormError() {
  const errorContainer = document.getElementById('form-error');
  if (errorContainer) {
    errorContainer.style.display = 'none';
  }
}

function logSecurityEvent(type, data) {
  // In a real application, this would send the event to your server for logging
  console.warn(`Security event: ${type}`, data);
  
  // You could also report severe security events to a security monitoring service
  if (type.includes('attack') || data.suspicious === true) {
    // reportSecurityIncident(type, data);
  }
}

function sendFormData(data, csrfToken) {
  // Simulate sending data to server
  return new Promise((resolve, reject) => {
    // In a real application, this would be an actual API call
    console.log('Sending form data with CSRF token:', csrfToken);
    console.log('Form data:', data);
    
    // Filter out the honeypot and CAPTCHA fields before sending
    const cleanData = { ...data };
    delete cleanData.website; // Remove honeypot
    delete cleanData.captcha; // Remove CAPTCHA answer
    
    // Simulating a server response
    setTimeout(() => {
      // 95% success rate for simulation
      if (Math.random() > 0.05) {
        resolve({ success: true });
      } else {
        reject(new Error('Server error'));
      }
    }, 1000);
  });
} 