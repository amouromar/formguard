import FormValidator from './FormValidator';
import './styles.css';

// Example usage
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('example-form');
  if (!form) return;

  const validator = new FormValidator();

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
    }
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const result = validator.validateForm(form, validationRules);
    
    if (result.isValid) {
      console.log('Form data:', result.data);
      // Here you would typically send the data to your server
      alert('Form submitted successfully!');
    } else {
      console.log('Validation errors:', result.errors);
    }
  });

  // Real-time validation on input
  form.querySelectorAll('input, textarea').forEach(field => {
    field.addEventListener('blur', () => {
      const fieldRules = validationRules[field.name];
      if (fieldRules) {
        validator.validateField(field, fieldRules);
      }
    });
  });
}); 