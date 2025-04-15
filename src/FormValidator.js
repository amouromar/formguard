import DOMPurify from 'dompurify';

class FormValidator {
  constructor(options = {}) {
    this.options = {
      errorClass: 'error',
      successClass: 'success',
      errorMessageClass: 'error-message',
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

  // Sanitization method
  sanitizeInput(value, type = 'text') {
    if (typeof value !== 'string') return value;
    
    let sanitized = DOMPurify.sanitize(value);
    
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
    
    return sanitized;
  }

  // Main validation method
  validateField(field, rules) {
    const value = this.sanitizeInput(field.value, field.type);
    const errors = [];

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
      errors
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

  // Form validation method
  validateForm(form, rules) {
    const formData = {};
    const errors = {};
    let isValid = true;

    for (const [fieldName, fieldRules] of Object.entries(rules)) {
      const field = form.elements[fieldName];
      if (!field) continue;

      const validationResult = this.validateField(field, fieldRules);
      formData[fieldName] = validationResult.value;
      
      if (!validationResult.isValid) {
        errors[fieldName] = validationResult.errors;
        isValid = false;
        this.showError(field, validationResult.errors[0]);
      } else {
        this.showSuccess(field);
      }
    }

    return {
      isValid,
      data: formData,
      errors
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
}

export default FormValidator; 