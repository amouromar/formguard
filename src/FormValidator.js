import DOMPurify from 'dompurify';

class FormValidator {
  constructor(options = {}) {
    this.options = {
      errorClass: 'error',
      successClass: 'success',
      errorMessageClass: 'error-message',
      honeypotField: 'website', // Common honeypot field name
      maxAttempts: 5,           // Max submission attempts
      submissionDelay: 500,     // Min time between form load and submission (ms)
      ...options
    };
    this.validators = {
      required: this.validateRequired.bind(this),
      email: this.validateEmail.bind(this),
      phone: this.validatePhone.bind(this),
      minLength: this.validateMinLength.bind(this),
      maxLength: this.validateMaxLength.bind(this),
      pattern: this.validatePattern.bind(this)
    };
    
    // Security features
    this.formLoadTime = Date.now();
    this.submissionAttempts = 0;
    this.suspiciousPatterns = [
      /<script>/i,                      // Basic script injection
      /javascript:/i,                   // JavaScript protocol
      /on\w+=/i,                        // Inline event handlers
      /data:/i,                         // Data URI scheme
      /alert\s*\(/i,                    // Alert functions
      /document\.cookie/i,              // Cookie stealing
      /\(\s*select\s*.+\s*from/i,       // SQL injection patterns
      /union\s+select/i,                // SQL injection patterns
      /insert\s+into/i,                 // SQL injection patterns
      /eval\s*\(/i,                     // Eval execution
      /base64/i,                        // Base64 encoding
      /1=1/i,                           // SQL tautology
      /\.\.\/\.\.\//i                   // Directory traversal
    ];
  }

  // Validation methods
  validateRequired(value) {
    return value !== null && value !== undefined && value.toString().trim() !== '';
  }

  validateEmail(value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  validatePhone(value) {
    const phoneRegex = /^\+?[\d\s-()]{10,}$/;
    return phoneRegex.test(value);
  }

  validateMinLength(value, min) {
    return value.length >= min;
  }

  validateMaxLength(value, max) {
    return value.length <= max;
  }

  validatePattern(value, pattern) {
    return pattern.test(value);
  }

  // Enhanced sanitization method with attack detection
  sanitizeInput(value, type = 'text') {
    if (typeof value !== 'string') return value;
    
    // Check for suspicious patterns before sanitization
    const hasSuspiciousPattern = this.detectSuspiciousPatterns(value);
    
    // If suspicious pattern detected, sanitize but flag it
    let sanitized = DOMPurify.sanitize(value, {
      FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'object', 'embed', 'link'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'eval']
    });
    
    switch (type) {
      case 'email':
        sanitized = sanitized.toLowerCase().trim();
        break;
      case 'phone':
        sanitized = sanitized.replace(/[^\d+]/g, '');
        break;
      case 'text':
      default:
        sanitized = sanitized.trim();
        break;
    }
    
    return {
      value: sanitized,
      suspicious: hasSuspiciousPattern
    };
  }

  // Detect suspicious patterns that might indicate attacks
  detectSuspiciousPatterns(value) {
    return this.suspiciousPatterns.some(pattern => pattern.test(value));
  }

  // Detect bot submissions
  isBotSubmission(form) {
    // Check if submission is too quick (bot-like behavior)
    const submissionTime = Date.now() - this.formLoadTime;
    if (submissionTime < this.options.submissionDelay) {
      return true;
    }
    
    // Check honeypot field (should be empty if human)
    const honeypotField = form.elements[this.options.honeypotField];
    if (honeypotField && honeypotField.value) {
      return true;
    }
    
    // Check for multiple rapid submissions
    this.submissionAttempts++;
    if (this.submissionAttempts > this.options.maxAttempts) {
      return true;
    }
    
    // Tab/focus events pattern (bots often don't trigger focus events)
    if (!this.hadFocusEvents) {
      return true;
    }
    
    return false;
  }

  // Track field interactions to detect real user behavior
  trackFieldInteraction() {
    this.hadFocusEvents = true;
  }

  // Main validation method
  validateField(field, rules) {
    const sanitizationResult = this.sanitizeInput(field.value, field.type);
    const value = sanitizationResult.value;
    const isSuspicious = sanitizationResult.suspicious;
    const errors = [];

    // If suspicious content is detected, add error
    if (isSuspicious) {
      errors.push('Potentially harmful content detected');
    }

    for (const [rule, ruleValue] of Object.entries(rules)) {
      if (this.validators[rule]) {
        const isValid = this.validators[rule](value, ruleValue);
        if (!isValid) {
          errors.push(this.getErrorMessage(rule, ruleValue));
        }
      }
    }

    return {
      isValid: errors.length === 0,
      value,
      errors,
      suspicious: isSuspicious
    };
  }

  // Error message generator
  getErrorMessage(rule, ruleValue) {
    const messages = {
      required: 'This field is required',
      email: 'Please enter a valid email address',
      phone: 'Please enter a valid phone number',
      minLength: `Minimum length is ${ruleValue} characters`,
      maxLength: `Maximum length is ${ruleValue} characters`,
      pattern: 'Please match the requested format'
    };
    return messages[rule] || 'Invalid input';
  }

  // Form validation method with security checks
  validateForm(form, rules) {
    const formData = {};
    const errors = {};
    let isValid = true;
    let hasSuspiciousContent = false;

    // Check for bot submission
    if (this.isBotSubmission(form)) {
      return {
        isValid: false,
        data: {},
        errors: { form: ['Suspicious activity detected. Please try again.'] },
        isBotAttempt: true
      };
    }

    for (const [fieldName, fieldRules] of Object.entries(rules)) {
      const field = form.elements[fieldName];
      if (!field) continue;

      const validationResult = this.validateField(field, fieldRules);
      formData[fieldName] = validationResult.value;
      
      if (validationResult.suspicious) {
        hasSuspiciousContent = true;
      }
      
      if (!validationResult.isValid) {
        errors[fieldName] = validationResult.errors;
        isValid = false;
        this.showError(field, validationResult.errors[0]);
      } else {
        this.showSuccess(field);
      }
    }

    // Log suspicious submissions for later review
    if (hasSuspiciousContent) {
      console.warn('Suspicious form submission detected:', formData);
      // In a real app, you might want to log this server-side
    }

    return {
      isValid,
      data: formData,
      errors,
      hasSuspiciousContent
    };
  }

  // UI feedback methods
  showError(field, message) {
    field.classList.remove(this.options.successClass);
    field.classList.add(this.options.errorClass);
    
    let errorElement = field.nextElementSibling;
    if (!errorElement || !errorElement.classList.contains(this.options.errorMessageClass)) {
      errorElement = document.createElement('div');
      errorElement.classList.add(this.options.errorMessageClass);
      field.parentNode.insertBefore(errorElement, field.nextSibling);
    }
    
    errorElement.textContent = message;
    errorElement.setAttribute('role', 'alert');
  }

  showSuccess(field) {
    field.classList.remove(this.options.errorClass);
    field.classList.add(this.options.successClass);
    
    const errorElement = field.nextElementSibling;
    if (errorElement && errorElement.classList.contains(this.options.errorMessageClass)) {
      errorElement.remove();
    }
  }

  // Setup field interaction tracking
  setupInteractionTracking(form) {
    Array.from(form.elements).forEach(element => {
      element.addEventListener('focus', () => this.trackFieldInteraction());
    });
  }
}

export default FormValidator; 