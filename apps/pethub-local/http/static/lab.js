/* PetHub Local — QA Test Lab client behaviours.
 * All interactions are wired via data-test hooks using event delegation so the
 * markup stays free of inline handlers (better for CSP and accessibility).
 */
(function () {
  function byTest(name, root) {
    return (root || document).querySelector('[data-test="' + name + '"]');
  }

  /* ---- Forms: client-side validation -------------------------------- */
  var form = byTest('lab-form');
  if (form) {
    var rangeInput = byTest('form-range');
    var rangeValue = byTest('form-range-value');
    if (rangeInput && rangeValue) {
      rangeInput.addEventListener('input', function () {
        rangeValue.textContent = rangeInput.value;
      });
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var result = byTest('form-result');
      var errors = [];
      var name = byTest('form-name');
      var email = byTest('form-email');
      var password = byTest('form-password');
      var terms = byTest('form-terms');

      if (!name.value.trim()) {
        errors.push('Name is required');
      }
      if (!email.value.trim() || email.value.indexOf('@') === -1) {
        errors.push('A valid email is required');
      }
      if (password.value.length < 6) {
        errors.push('Password must be at least 6 characters');
      }
      if (!terms.checked) {
        errors.push('You must accept the terms');
      }

      result.hidden = false;
      if (errors.length === 0) {
        result.className = 'lab-result success';
        result.setAttribute('data-test', 'form-result');
        result.innerHTML =
          '<strong data-test="form-success">Form submitted successfully</strong>' +
          '<div class="muted" data-test="form-echo">Welcome, ' +
          escapeHtml(name.value.trim()) +
          '</div>';
      } else {
        result.className = 'lab-result error';
        result.innerHTML =
          '<strong data-test="form-error">Please fix the following</strong><ul>' +
          errors
            .map(function (message) {
              return '<li>' + escapeHtml(message) + '</li>';
            })
            .join('') +
          '</ul>';
      }
    });

    form.addEventListener('reset', function () {
      var result = byTest('form-result');
      if (result) {
        result.hidden = true;
        result.innerHTML = '';
      }
    });
  }

  /* ---- Dynamic content ---------------------------------------------- */
  var dynamicStart = byTest('dynamic-start');
  if (dynamicStart) {
    dynamicStart.addEventListener('click', function () {
      var loading = byTest('dynamic-loading');
      var content = byTest('dynamic-content');
      content.hidden = true;
      loading.hidden = false;
      setTimeout(function () {
        loading.hidden = true;
        content.hidden = false;
      }, 700);
    });
  }

  var addElement = byTest('add-element');
  if (addElement) {
    var container = byTest('elements-container');
    var counter = 0;
    addElement.addEventListener('click', function () {
      counter += 1;
      var item = document.createElement('button');
      item.type = 'button';
      item.className = 'button secondary';
      item.setAttribute('data-test', 'added-element');
      item.textContent = 'Delete row ' + counter;
      item.addEventListener('click', function () {
        item.remove();
      });
      container.appendChild(item);
    });
  }

  var toggleEnable = byTest('toggle-enable');
  if (toggleEnable) {
    toggleEnable.addEventListener('click', function () {
      var input = byTest('dynamic-input');
      var state = byTest('enable-state');
      input.disabled = !input.disabled;
      state.textContent = input.disabled ? 'disabled' : 'enabled';
      toggleEnable.textContent = input.disabled ? 'Enable input' : 'Disable input';
    });
  }

  /* ---- Dialogs ------------------------------------------------------- */
  var dialogResult = byTest('dialog-result');
  if (dialogResult) {
    var alertBtn = byTest('dialog-alert');
    var confirmBtn = byTest('dialog-confirm');
    var promptBtn = byTest('dialog-prompt');
    if (alertBtn) {
      alertBtn.addEventListener('click', function () {
        window.alert('This is an alert dialog');
        dialogResult.textContent = 'You clicked an alert';
      });
    }
    if (confirmBtn) {
      confirmBtn.addEventListener('click', function () {
        var ok = window.confirm('Do you confirm?');
        dialogResult.textContent = ok ? 'You chose OK' : 'You chose Cancel';
      });
    }
    if (promptBtn) {
      promptBtn.addEventListener('click', function () {
        var value = window.prompt('Enter a value', '');
        dialogResult.textContent = value === null ? 'You dismissed the prompt' : 'You entered: ' + value;
      });
    }
  }

  /* ---- Tables: search + sort ---------------------------------------- */
  var table = byTest('data-table');
  if (table) {
    var search = byTest('table-search');
    var body = byTest('table-body');
    var empty = byTest('table-empty');
    var sortState = {};

    function rows() {
      return Array.prototype.slice.call(body.querySelectorAll('[data-test="table-row"]'));
    }

    function applyFilter() {
      var term = (search.value || '').toLowerCase();
      var visible = 0;
      rows().forEach(function (row) {
        var match = row.textContent.toLowerCase().indexOf(term) !== -1;
        row.hidden = !match;
        if (match) {
          visible += 1;
        }
      });
      empty.hidden = visible !== 0;
    }

    if (search) {
      search.addEventListener('input', applyFilter);
    }

    table.querySelectorAll('.lab-sort').forEach(function (button) {
      button.addEventListener('click', function () {
        var key = button.getAttribute('data-key');
        var ascending = !sortState[key];
        sortState = {};
        sortState[key] = ascending;
        var sorted = rows().sort(function (a, b) {
          var av = a.querySelector('[data-test="cell-' + key + '"]').textContent.trim();
          var bv = b.querySelector('[data-test="cell-' + key + '"]').textContent.trim();
          if (key === 'amount') {
            return ascending ? Number(av) - Number(bv) : Number(bv) - Number(av);
          }
          return ascending ? av.localeCompare(bv) : bv.localeCompare(av);
        });
        sorted.forEach(function (row) {
          body.appendChild(row);
        });
        table.querySelectorAll('.lab-sort').forEach(function (other) {
          other.removeAttribute('aria-sort');
        });
        button.closest('th').setAttribute('aria-sort', ascending ? 'ascending' : 'descending');
      });
    });
  }

  /* ---- Tabs ---------------------------------------------------------- */
  document.querySelectorAll('[role="tablist"]').forEach(function (list) {
    var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (other) {
          other.setAttribute('aria-selected', 'false');
          var panel = document.getElementById(other.getAttribute('aria-controls'));
          if (panel) {
            panel.hidden = true;
          }
        });
        tab.setAttribute('aria-selected', 'true');
        var active = document.getElementById(tab.getAttribute('aria-controls'));
        if (active) {
          active.hidden = false;
        }
      });
    });
  });

  /* ---- Accordion ----------------------------------------------------- */
  document.querySelectorAll('.lab-accordion').forEach(function (trigger) {
    trigger.addEventListener('click', function () {
      var expanded = trigger.getAttribute('aria-expanded') === 'true';
      trigger.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      var panel = document.getElementById(trigger.getAttribute('aria-controls'));
      if (panel) {
        panel.hidden = expanded;
      }
    });
  });

  /* ---- Modal --------------------------------------------------------- */
  var openModal = byTest('open-modal');
  if (openModal) {
    var modal = byTest('modal');
    var backdrop = byTest('modal-backdrop');
    var closeModal = byTest('close-modal');
    function setModal(open) {
      modal.hidden = !open;
      backdrop.hidden = !open;
      if (open) {
        modal.focus();
      } else {
        openModal.focus();
      }
    }
    openModal.addEventListener('click', function () {
      setModal(true);
    });
    closeModal.addEventListener('click', function () {
      setModal(false);
    });
    backdrop.addEventListener('click', function () {
      setModal(false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !modal.hidden) {
        setModal(false);
      }
    });
  }

  /* ---- Tooltip ------------------------------------------------------- */
  var hoverTarget = byTest('hover-target');
  if (hoverTarget) {
    var tooltip = byTest('tooltip');
    function showTip() {
      tooltip.hidden = false;
    }
    function hideTip() {
      tooltip.hidden = true;
    }
    hoverTarget.addEventListener('mouseenter', showTip);
    hoverTarget.addEventListener('mouseleave', hideTip);
    hoverTarget.addEventListener('focus', showTip);
    hoverTarget.addEventListener('blur', hideTip);
  }

  /* ---- Progress bar -------------------------------------------------- */
  var progressStart = byTest('progress-start');
  if (progressStart) {
    var bar = byTest('progress-bar');
    var fill = byTest('progress-fill');
    var value = byTest('progress-value');
    progressStart.addEventListener('click', function () {
      var pct = 0;
      progressStart.disabled = true;
      var timer = setInterval(function () {
        pct += 10;
        fill.style.width = pct + '%';
        bar.setAttribute('aria-valuenow', String(pct));
        value.textContent = String(pct);
        if (pct >= 100) {
          clearInterval(timer);
          progressStart.disabled = false;
        }
      }, 80);
    });
  }

  /* ---- Toast --------------------------------------------------------- */
  var showToast = byTest('show-toast');
  if (showToast) {
    showToast.addEventListener('click', function () {
      var existing = byTest('toast');
      if (existing) {
        existing.remove();
      }
      var toast = document.createElement('div');
      toast.className = 'toast success';
      toast.setAttribute('role', 'status');
      toast.setAttribute('data-test', 'toast');
      toast.textContent = 'Action completed';
      document.body.appendChild(toast);
      setTimeout(function () {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 3000);
    });
  }

  /* ---- Copy to clipboard -------------------------------------------- */
  var copyButton = byTest('copy-button');
  if (copyButton) {
    copyButton.addEventListener('click', function () {
      var source = byTest('copy-source');
      var status = byTest('copy-status');
      function done() {
        status.textContent = 'Copied: ' + source.value;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(source.value).then(done, done);
      } else {
        source.select();
        done();
      }
    });
  }

  /* ---- Key press ----------------------------------------------------- */
  var keyInput = byTest('key-input');
  if (keyInput) {
    var keyDisplay = byTest('key-display');
    keyInput.addEventListener('keyup', function (event) {
      keyDisplay.textContent = event.key;
    });
  }

  /* ---- Inner frame --------------------------------------------------- */
  var innerButton = byTest('inner-button');
  if (innerButton) {
    innerButton.addEventListener('click', function () {
      byTest('inner-message').textContent = 'Updated from inside the frame';
    });
  }

  /* ---- Shadow DOM custom element ------------------------------------ */
  if ('customElements' in window && !customElements.get('qa-shadow-card')) {
    var ShadowCard = function () {
      return Reflect.construct(HTMLElement, [], ShadowCard);
    };
    ShadowCard.prototype = Object.create(HTMLElement.prototype);
    ShadowCard.prototype.constructor = ShadowCard;
    ShadowCard.prototype.connectedCallback = function () {
      if (this.shadowRoot) {
        return;
      }
      var root = this.attachShadow({ mode: 'open' });
      root.innerHTML =
        '<style>.card{padding:16px;border:1px solid #888;border-radius:12px;font-family:inherit}button{margin-top:8px}</style>' +
        '<div class="card">' +
        '<h2 data-test="shadow-heading">Inside shadow DOM</h2>' +
        '<button type="button" data-test="shadow-button">Reveal message</button>' +
        '<p data-test="shadow-message">Hidden until clicked</p>' +
        '</div>';
      root.querySelector('[data-test="shadow-button"]').addEventListener('click', function () {
        root.querySelector('[data-test="shadow-message"]').textContent = 'Shadow message revealed';
      });
    };
    Object.setPrototypeOf(ShadowCard, HTMLElement);
    customElements.define('qa-shadow-card', ShadowCard);
  }

  /* ---- Menus & dropdowns -------------------------------------------- */
  var nativeSelect = byTest('native-select');
  if (nativeSelect) {
    var nativeResult = byTest('native-select-result');
    nativeSelect.addEventListener('change', function () {
      nativeResult.textContent = nativeSelect.value || 'none';
    });
  }

  var multiSelect = byTest('multi-select');
  if (multiSelect) {
    var multiResult = byTest('multi-select-result');
    multiSelect.addEventListener('change', function () {
      var chosen = Array.prototype.filter
        .call(multiSelect.options, function (option) {
          return option.selected;
        })
        .map(function (option) {
          return option.value;
        });
      multiResult.textContent = chosen.length ? chosen.join(', ') : 'none';
    });
  }

  var countrySelect = byTest('country-select');
  if (countrySelect) {
    var citySelect = byTest('city-select');
    var cascadeResult = byTest('cascade-result');
    var cityMap = {
      uk: ['London', 'Manchester', 'Bristol'],
      us: ['New York', 'Austin', 'Seattle'],
      de: ['Berlin', 'Munich', 'Hamburg'],
    };
    var repopulateCities = function () {
      var cities = cityMap[countrySelect.value] || [];
      citySelect.innerHTML = '';
      cities.forEach(function (city) {
        var option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        citySelect.appendChild(option);
      });
    };
    var reflectLocation = function () {
      cascadeResult.textContent = citySelect.value + ', ' + countrySelect.value.toUpperCase();
    };
    countrySelect.addEventListener('change', function () {
      repopulateCities();
      reflectLocation();
    });
    citySelect.addEventListener('change', reflectLocation);
  }

  var closeMenu = function (trigger, popup) {
    popup.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
  };
  var openMenu = function (trigger, popup) {
    popup.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
  };
  var wireMenu = function (trigger, popup, onSelect) {
    if (!trigger || !popup) {
      return;
    }
    trigger.addEventListener('click', function (event) {
      event.stopPropagation();
      if (popup.hidden) {
        openMenu(trigger, popup);
      } else {
        closeMenu(trigger, popup);
      }
    });
    var items = popup.querySelectorAll('[role="option"], [role="menuitem"]');
    Array.prototype.forEach.call(items, function (item) {
      item.addEventListener('click', function () {
        if (onSelect) {
          onSelect(item);
        }
        closeMenu(trigger, popup);
        if (typeof trigger.focus === 'function') {
          trigger.focus();
        }
      });
    });
    document.addEventListener('click', function (event) {
      if (!popup.hidden && !popup.contains(event.target) && !trigger.contains(event.target)) {
        closeMenu(trigger, popup);
      }
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !popup.hidden) {
        closeMenu(trigger, popup);
        if (typeof trigger.focus === 'function') {
          trigger.focus();
        }
      }
    });
  };

  var customDropdown = byTest('custom-dropdown');
  if (customDropdown) {
    var customListbox = byTest('custom-listbox');
    var customLabel = byTest('custom-dropdown-label');
    var customResult = byTest('custom-dropdown-result');
    wireMenu(customDropdown, customListbox, function (item) {
      var value = item.getAttribute('data-value');
      customLabel.textContent = value;
      customResult.textContent = value;
      Array.prototype.forEach.call(customListbox.querySelectorAll('[role="option"]'), function (option) {
        option.setAttribute('aria-selected', option === item ? 'true' : 'false');
      });
    });
  }

  var actionMenuButton = byTest('action-menu-button');
  if (actionMenuButton) {
    var actionResult = byTest('action-menu-result');
    wireMenu(actionMenuButton, byTest('action-menu'), function (item) {
      actionResult.textContent = item.getAttribute('data-action');
    });
  }

  var flyoutResult = byTest('flyout-result');
  ['products', 'services'].forEach(function (id) {
    wireMenu(byTest('menu-top-' + id), byTest('submenu-' + id), function (item) {
      if (flyoutResult) {
        flyoutResult.textContent = item.getAttribute('data-action');
      }
    });
  });

  var splitPrimary = byTest('split-primary');
  if (splitPrimary) {
    var splitResult = byTest('split-result');
    splitPrimary.addEventListener('click', function () {
      splitResult.textContent = 'Save';
    });
    wireMenu(byTest('split-toggle'), byTest('split-menu'), function (item) {
      splitResult.textContent = item.getAttribute('data-action');
    });
  }

  var hamburgerToggle = byTest('hamburger-toggle');
  if (hamburgerToggle) {
    var hamburgerMenu = byTest('hamburger-menu');
    hamburgerToggle.addEventListener('click', function () {
      var willOpen = hamburgerMenu.hidden;
      hamburgerMenu.hidden = !willOpen;
      hamburgerToggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });
  }

  var contextTarget = byTest('context-target');
  if (contextTarget) {
    var contextMenu = byTest('context-menu');
    var contextResult = byTest('context-menu-result');
    contextTarget.addEventListener('contextmenu', function (event) {
      event.preventDefault();
      contextMenu.style.position = 'fixed';
      contextMenu.style.top = event.clientY + 'px';
      contextMenu.style.left = event.clientX + 'px';
      contextMenu.hidden = false;
    });
    Array.prototype.forEach.call(contextMenu.querySelectorAll('[role="menuitem"]'), function (item) {
      item.addEventListener('click', function () {
        contextResult.textContent = item.getAttribute('data-action');
        contextMenu.hidden = true;
      });
    });
    document.addEventListener('click', function (event) {
      if (!contextMenu.hidden && !contextMenu.contains(event.target)) {
        contextMenu.hidden = true;
      }
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !contextMenu.hidden) {
        contextMenu.hidden = true;
      }
    });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }
})();
