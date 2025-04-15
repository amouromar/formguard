# FormGuard - Robust Form Validation

FormGuard is a powerful JavaScript form validation library that ensures clean, formatted, and sanitized data. It provides comprehensive validation, sanitization, and accessibility features out of the box.

## Features

- **Input Validation**
  - Email format validation
  - Phone number format validation
  - Required field validation
  - Minimum/maximum length validation
  - Custom pattern validation

- **Data Sanitization**
  - XSS prevention using DOMPurify
  - Input trimming and formatting
  - Type-specific sanitization (email, phone, text)

- **Accessibility (a11y)**
  - ARIA attributes support
  - Screen reader friendly error messages
  - Keyboard navigation support
  - High contrast mode support
  - Reduced motion support

- **User Feedback**
  - Real-time validation
  - Clear error messages
  - Visual feedback for valid/invalid states
  - Customizable styling

## Installation

```bash
npm install formguard
```

## Usage

1. Import the FormValidator class:

```javascript
import FormValidator from 'formguard';
```

2. Create a new validator instance:

```javascript
const validator = new FormValidator();
```

3. Define validation rules:

```javascript
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
  }
};
```

4. Validate a form:

```javascript
const form = document.getElementById('my-form');
const result = validator.validateForm(form, validationRules);

if (result.isValid) {
  console.log('Form data:', result.data);
} else {
  console.log('Validation errors:', result.errors);
}
```

## Development

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT License - feel free to use this project for your own purposes.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 