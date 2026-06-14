/* PetHub Clinic — booking-wizard client behaviour.
 * Progressive enhancement: without JS every step is visible and the form still
 * submits. With JS the four fieldsets become a stepped wizard with review.
 * All hooks use data-test and there are no inline handlers.
 */
(function () {
  function byTest(name, root) {
    return (root || document).querySelector('[data-test="' + name + '"]');
  }

  var form = byTest('clinic-booking-form');
  if (!form) {
    return;
  }

  var steps = [byTest('clinic-step-1'), byTest('clinic-step-2'), byTest('clinic-step-3'), byTest('clinic-step-4')];
  var indicator = byTest('clinic-step-indicator');
  var wizardError = byTest('clinic-wizard-error');
  var backButton = byTest('clinic-back');
  var nextButton = byTest('clinic-next');
  var confirmButton = byTest('clinic-confirm');
  var emailField = byTest('clinic-email');
  var emailError = byTest('clinic-email-error');
  var totalSteps = steps.length;
  var current = 1;

  function fieldValue(name) {
    var field = byTest(name);
    return field ? field.value.trim() : '';
  }

  function selectedRadioValue(radioName) {
    var checked = form.querySelector('input[name="' + radioName + '"]:checked');
    return checked ? checked.value : '';
  }

  function selectedText(selectName) {
    var select = byTest(selectName);
    if (!select || select.selectedIndex < 0) {
      return '';
    }
    return select.options[select.selectedIndex].text;
  }

  function serviceLabel() {
    var checked = form.querySelector('input[name="serviceId"]:checked');
    if (!checked) {
      return '';
    }
    var option = checked.closest('.clinic-option');
    return option ? option.textContent.replace(/\s+/g, ' ').trim() : checked.value;
  }

  function setWizardError(message) {
    if (!wizardError) {
      return;
    }
    if (message) {
      wizardError.textContent = message;
      wizardError.hidden = false;
    } else {
      wizardError.textContent = '';
      wizardError.hidden = true;
    }
  }

  // Mirrors the server-side check in clinic.ts so the message matches exactly.
  function isValidEmail(value) {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
  }

  function setEmailError(message) {
    if (emailError) {
      if (message) {
        emailError.textContent = message;
        emailError.hidden = false;
      } else {
        emailError.textContent = '';
        emailError.hidden = true;
      }
    }
    if (emailField) {
      if (message) {
        emailField.setAttribute('aria-invalid', 'true');
      } else {
        emailField.removeAttribute('aria-invalid');
      }
    }
  }

  function validateEmailField() {
    if (!emailField) {
      return true;
    }
    if (!isValidEmail(emailField.value.trim())) {
      setEmailError('A valid email is required');
      return false;
    }
    setEmailError('');
    return true;
  }

  function validateStep(step) {
    if (step === 1) {
      if (!selectedRadioValue('serviceId')) {
        return 'Choose a service to continue';
      }
      if (!fieldValue('clinic-vet-select')) {
        return 'Choose a veterinarian to continue';
      }
    }
    if (step === 2) {
      if (!fieldValue('clinic-date')) {
        return 'Choose a date to continue';
      }
      if (!selectedRadioValue('time')) {
        return 'Choose an available time slot to continue';
      }
    }
    if (step === 3) {
      if (!fieldValue('clinic-owner')) {
        return 'Owner name is required';
      }
      if (!fieldValue('clinic-pet')) {
        return 'Pet name is required';
      }
    }
    return '';
  }

  function populateReview() {
    var setText = function (name, value) {
      var node = byTest(name);
      if (node) {
        node.textContent = value || '—';
      }
    };
    setText('clinic-review-service', serviceLabel());
    setText('clinic-review-vet', selectedText('clinic-vet-select'));
    setText('clinic-review-datetime', fieldValue('clinic-date') + ' at ' + selectedRadioValue('time'));
    setText('clinic-review-owner', fieldValue('clinic-owner'));
    setText('clinic-review-pet', fieldValue('clinic-pet'));
    setText('clinic-review-email', fieldValue('clinic-email'));
  }

  function showStep(step) {
    current = step;
    steps.forEach(function (section, index) {
      if (section) {
        section.hidden = index + 1 !== step;
      }
    });
    if (indicator) {
      indicator.textContent = 'Step ' + step + ' of ' + totalSteps;
    }
    if (backButton) {
      backButton.hidden = step === 1;
    }
    if (nextButton) {
      nextButton.hidden = step === totalSteps;
    }
    if (confirmButton) {
      confirmButton.hidden = step !== totalSteps;
    }
    if (step === totalSteps) {
      populateReview();
    }
  }

  if (nextButton) {
    nextButton.addEventListener('click', function () {
      var message = validateStep(current);
      if (message) {
        setWizardError(message);
        return;
      }
      // Email is validated inline on the field itself, not in the wizard banner.
      if (current === 3 && !validateEmailField()) {
        setWizardError('');
        if (emailField) {
          emailField.focus();
        }
        return;
      }
      setWizardError('');
      if (current < totalSteps) {
        showStep(current + 1);
      }
    });
  }

  if (backButton) {
    backButton.addEventListener('click', function () {
      setWizardError('');
      if (current > 1) {
        showStep(current - 1);
      }
    });
  }

  if (emailField) {
    // Surface a malformed email as soon as the user leaves the field, and clear
    // it live once the value becomes valid again.
    emailField.addEventListener('blur', function () {
      if (emailField.value.trim()) {
        validateEmailField();
      }
    });
    emailField.addEventListener('input', function () {
      if (emailError && !emailError.hidden && isValidEmail(emailField.value.trim())) {
        setEmailError('');
      }
    });
  }

  showStep(1);
})();
