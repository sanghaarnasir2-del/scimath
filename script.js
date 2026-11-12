/**
 * SciMth — Advanced Scientific Calculator Engine
 * Handles full scientific math evaluation, memory, angle modes, history,
 * day/night theme switching, and responsive keyboard controls.
 */

class SciMthCalculator {
  constructor() {
    // Calculator State
    this.expression = '';
    this.currentValue = '0';
    this.memoryValue = 0;
    this.angleMode = 'DEG'; // 'DEG' or 'RAD'
    this.isSecondActive = false;
    this.isHypActive = false;
    this.justCalculated = false;
    this.history = JSON.parse(localStorage.getItem('scimth_history') || '[]');
    this.theme = localStorage.getItem('scimth_theme') || 'day';

    // DOM Elements
    this.mainDisplay = document.getElementById('mainDisplay');
    this.expressionDisplay = document.getElementById('expressionDisplay');
    this.angleUnitBadge = document.getElementById('angleUnitBadge');
    this.hypBadge = document.getElementById('hypBadge');
    this.secondBadge = document.getElementById('secondBadge');
    this.memoryBadge = document.getElementById('memoryBadge');
    this.degRadBtn = document.getElementById('degRadBtn');
    this.secondBtn = document.getElementById('secondBtn');
    this.hypBtn = document.getElementById('hypBtn');
    this.themeToggle = document.getElementById('themeToggle');
    this.historyToggle = document.getElementById('historyToggle');
    this.historyPanel = document.getElementById('historyPanel');
    this.closeHistory = document.getElementById('closeHistory');
    this.historyList = document.getElementById('historyList');
    this.clearHistoryBtn = document.getElementById('clearHistoryBtn');

    this.init();
  }

  init() {
    this.bindEvents();
    this.applyTheme(this.theme);
    this.updateBadges();
    this.renderHistory();
    this.updateDisplay();
  }

  bindEvents() {
    // Theme toggle
    this.themeToggle.addEventListener('click', () => {
      this.toggleTheme();
    });

    // History panel toggles
    this.historyToggle.addEventListener('click', () => {
      this.historyPanel.classList.toggle('open');
    });

    this.closeHistory.addEventListener('click', () => {
      this.historyPanel.classList.remove('open');
    });

    this.clearHistoryBtn.addEventListener('click', () => {
      this.clearHistory();
    });

    // Keypad Clicks
    const keypad = document.querySelector('.keypad');
    keypad.addEventListener('click', (e) => {
      const button = e.target.closest('.key');
      if (!button) return;

      const action = button.dataset.action;
      const val = button.dataset.val;

      this.handleAction(action, val, button);
    });

    // Utility bar Clicks
    const utilityBar = document.querySelector('.utility-bar');
    utilityBar.addEventListener('click', (e) => {
      const button = e.target.closest('.util-btn');
      if (!button) return;

      const action = button.dataset.action;
      this.handleUtilityAction(action);
    });

    // Keyboard support
    window.addEventListener('keydown', (e) => {
      this.handleKeyboard(e);
    });
  }

  // Handle Day/Night Theme Switching
  toggleTheme() {
    this.theme = this.theme === 'day' ? 'night' : 'day';
    this.applyTheme(this.theme);
  }

  applyTheme(theme) {
    if (theme === 'night') {
      document.body.classList.remove('theme-day');
      document.body.classList.add('theme-night');
    } else {
      document.body.classList.remove('theme-night');
      document.body.classList.add('theme-day');
    }
    localStorage.setItem('scimth_theme', theme);
  }

  // Handle Keypad Actions
  handleAction(action, val, button) {
    switch (action) {
      case 'insert':
        this.insertToken(val);
        break;

      case 'func':
        this.applyFunction(val, button);
        break;

      case 'clear':
        this.allClear();
        break;

      case 'delete':
        this.deleteLast();
        break;

      case 'calculate':
        this.calculate();
        break;
    }
    this.updateDisplay();
  }

  // Utility Actions (Memory & Modes)
  handleUtilityAction(action) {
    switch (action) {
      case 'toggle-angle':
        this.angleMode = this.angleMode === 'DEG' ? 'RAD' : 'DEG';
        this.degRadBtn.textContent = this.angleMode === 'DEG' ? 'RAD' : 'DEG';
        this.updateBadges();
        break;

      case 'toggle-second':
        this.isSecondActive = !this.isSecondActive;
        this.secondBtn.classList.toggle('active-mode', this.isSecondActive);
        this.updateSecondKeyLabels();
        this.updateBadges();
        break;

      case 'toggle-hyp':
        this.isHypActive = !this.isHypActive;
        this.hypBtn.classList.toggle('active-mode', this.isHypActive);
        this.updateBadges();
        break;

      case 'mem-clear':
        this.memoryValue = 0;
        this.updateBadges();
        break;

      case 'mem-recall':
        this.insertNumber(this.memoryValue.toString());
        break;

      case 'mem-plus':
        try {
          const current = this.evaluateCurrentNumber();
          this.memoryValue += current;
          this.updateBadges();
        } catch (e) {
          this.showError('Mem Error');
        }
        break;

      case 'mem-minus':
        try {
          const current = this.evaluateCurrentNumber();
          this.memoryValue -= current;
          this.updateBadges();
        } catch (e) {
          this.showError('Mem Error');
        }
        break;
    }
    this.updateDisplay();
  }

  updateSecondKeyLabels() {
    const funcKeys = document.querySelectorAll('.func-key[data-second]');
    funcKeys.forEach(key => {
      const primary = key.querySelector('.primary-label');
      const secondary = key.querySelector('.secondary-label');
      if (this.isSecondActive) {
        key.classList.add('second-mode');
        if (primary && secondary) {
          primary.style.opacity = '0.4';
          secondary.style.fontSize = '0.9rem';
          secondary.style.opacity = '1';
          secondary.style.position = 'static';
        }
      } else {
        key.classList.remove('second-mode');
        if (primary && secondary) {
          primary.style.opacity = '1';
          secondary.style.fontSize = '0.58rem';
          secondary.style.opacity = '0.8';
          secondary.style.position = 'absolute';
        }
      }
    });
  }

  updateBadges() {
    this.angleUnitBadge.textContent = this.angleMode;
    this.angleUnitBadge.classList.add('active');

    this.hypBadge.classList.toggle('active', this.isHypActive);
    this.secondBadge.classList.toggle('active', this.isSecondActive);
    this.memoryBadge.classList.toggle('active', this.memoryValue !== 0);
  }

  insertToken(token) {
    if (this.justCalculated) {
      // If user starts typing an operator right after result, keep result
      if (['+', '−', '×', '÷', '%', '^'].includes(token)) {
        this.expression = this.currentValue;
      } else {
        this.expression = '';
        this.currentValue = '0';
      }
      this.justCalculated = false;
    }

    if (this.currentValue === '0' && !['.', '+', '−', '×', '÷', '%'].includes(token)) {
      this.currentValue = token;
    } else {
      // Avoid duplicate consecutive dots
      if (token === '.') {
        const lastPart = this.currentValue.split(/[\+\−\×\÷\(\)]/).pop();
        if (lastPart.includes('.')) return;
      }
      this.currentValue += token;
    }
  }

  insertNumber(numStr) {
    if (this.justCalculated || this.currentValue === '0') {
      this.currentValue = numStr;
      this.justCalculated = false;
    } else {
      this.currentValue += numStr;
    }
  }

  applyFunction(funcType, button) {
    if (this.justCalculated) {
      this.justCalculated = false;
    }

    let actualFunc = funcType;
    if (this.isSecondActive && button && button.dataset.second) {
      actualFunc = button.dataset.second;
    }

    switch (actualFunc) {
      // Trigonometric
      case 'sin':
        this.wrapWithPrefix(this.isHypActive ? 'sinh(' : 'sin(');
        break;
      case 'asin':
        this.wrapWithPrefix(this.isHypActive ? 'asinh(' : 'sin⁻¹(');
        break;
      case 'cos':
        this.wrapWithPrefix(this.isHypActive ? 'cosh(' : 'cos(');
        break;
      case 'acos':
        this.wrapWithPrefix(this.isHypActive ? 'acosh(' : 'cos⁻¹(');
        break;
      case 'tan':
        this.wrapWithPrefix(this.isHypActive ? 'tanh(' : 'tan(');
        break;
      case 'atan':
        this.wrapWithPrefix(this.isHypActive ? 'atanh(' : 'tan⁻¹(');
        break;

      // Logs & Exponents
      case 'ln':
        this.wrapWithPrefix('ln(');
        break;
      case 'log':
        this.wrapWithPrefix('log(');
        break;
      case 'exp':
        this.insertToken('e^(');
        break;
      case 'pow10':
        this.insertToken('10^(');
        break;

      // Powers & Roots
      case 'sqrt':
        this.wrapWithPrefix('√(');
        break;
      case 'cbrt':
        this.wrapWithPrefix('∛(');
        break;
      case 'sq':
        this.insertToken('^2');
        break;
      case 'cube':
        this.insertToken('^3');
        break;
      case 'pow':
        this.insertToken('^(');
        break;
      case 'rootY':
        this.insertToken(' root ');
        break;
      case 'inv':
        this.wrapWithPrefix('1/(');
        break;

      // Misc
      case 'fact':
        this.insertToken('!');
        break;
      case 'abs':
        this.wrapWithPrefix('abs(');
        break;
      case 'neg':
        this.toggleSign();
        break;
    }

    // Auto turn off 2nd after use if preferred
    if (this.isSecondActive) {
      this.handleUtilityAction('toggle-second');
    }
  }

  wrapWithPrefix(prefix) {
    if (this.currentValue === '0' || this.currentValue === '') {
      this.currentValue = prefix;
    } else {
      this.currentValue += prefix;
    }
  }

  toggleSign() {
    if (this.currentValue === '0') return;

    // Try to toggle sign of the last number in expression
    const match = this.currentValue.match(/(\(?-?\d+\.?\d*\)?)$/);
    if (match) {
      let num = match[0];
      let toggled;
      if (num.startsWith('(-') && num.endsWith(')')) {
        toggled = num.slice(2, -1);
      } else if (num.startsWith('-')) {
        toggled = num.slice(1);
      } else {
        toggled = `(-${num})`;
      }
      this.currentValue = this.currentValue.slice(0, match.index) + toggled;
    } else {
      this.currentValue = `(-${this.currentValue})`;
    }
  }

  allClear() {
    this.currentValue = '0';
    this.expression = '';
    this.justCalculated = false;
  }

  deleteLast() {
    if (this.justCalculated) {
      this.currentValue = '0';
      this.justCalculated = false;
      return;
    }

    // Check for multi-character tokens like "sin(", "cos⁻¹(", etc.
    const multiTokens = [
      'sin⁻¹(', 'cos⁻¹(', 'tan⁻¹(', 'sinh(', 'cosh(', 'tanh(',
      'asinh(', 'acosh(', 'atanh(', 'sin(', 'cos(', 'tan(',
      'log(', 'ln(', 'abs(', '√(', '∛(', '10^(', 'e^('
    ];

    for (const tok of multiTokens) {
      if (this.currentValue.endsWith(tok)) {
        this.currentValue = this.currentValue.slice(0, -tok.length);
        if (this.currentValue === '') this.currentValue = '0';
        return;
      }
    }

    if (this.currentValue.length > 1) {
      this.currentValue = this.currentValue.slice(0, -1);
    } else {
      this.currentValue = '0';
    }
  }

  evaluateCurrentNumber() {
    const res = this.evaluateExpression(this.currentValue);
    if (typeof res === 'number' && !isNaN(res)) return res;
    return 0;
  }

  calculate() {
    if (this.currentValue === '') return;

    const rawExpr = this.currentValue;
    try {
      const result = this.evaluateExpression(rawExpr);
      
      if (result === undefined || isNaN(result)) {
        this.showError('Invalid Format');
        return;
      }

      if (!isFinite(result)) {
        this.showError('Cannot divide by zero');
        return;
      }

      // Format result nicely
      const formattedResult = this.formatResult(result);
      this.expression = rawExpr + ' =';
      this.addToHistory(rawExpr, formattedResult);
      this.currentValue = formattedResult.toString();
      this.justCalculated = true;
    } catch (err) {
      console.error(err);
      this.showError('Syntax Error');
    }
  }

  // Safe Math Evaluator Parser
  evaluateExpression(expr) {
    let sanitized = expr;

    // Balance unclosed parentheses automatically
    let openCount = (sanitized.match(/\(/g) || []).length;
    let closeCount = (sanitized.match(/\)/g) || []).length;
    while (openCount > closeCount) {
      sanitized += ')';
      closeCount++;
    }

    // Replace display symbols with math engine symbols
    sanitized = sanitized.replace(/×/g, '*')
                         .replace(/÷/g, '/')
                         .replace(/−/g, '-')
                         .replace(/π/g, `(${Math.PI})`)
                         .replace(/\be\b/g, `(${Math.E})`);

    // Implicit multiplications:
    // e.g. 5(2) -> 5*(2), (2)(3) -> (2)*(3), (2)5 -> (2)*5
    sanitized = sanitized.replace(/(\d)(\()/g, '$1*$2');
    sanitized = sanitized.replace(/(\))(\d)/g, '$1*$2');
    sanitized = sanitized.replace(/(\))(\()/g, '$1*$2');
    // Number before word/func: 5sin(...) -> 5*sin(...), 5√( -> 5*√(
    sanitized = sanitized.replace(/(\d)(sin|cos|tan|ln|log|abs|√|∛|asin|acos|atan)/g, '$1*$2');
    sanitized = sanitized.replace(/(\))(sin|cos|tan|ln|log|abs|√|∛)/g, '$1*$2');

    // Replace Factorials (e.g. 5! or (2+3)!)
    sanitized = this.processFactorials(sanitized);

    // Percentage replacement: e.g. 50% -> (50/100), 200+10% -> 200+(10/100)
    sanitized = sanitized.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');

    // Parse roots like "27 root 3" => (27 ** (1/3))
    sanitized = sanitized.replace(/([\d\.]+)\s+root\s+([\d\.]+)/g, '($1 ** (1/$2))');

    // Replace power operator ^ with standard JS exponentiation **
    sanitized = sanitized.replace(/\^/g, '**');

    // Angles: Handles DEG / RAD conversion for trig
    const isDeg = this.angleMode === 'DEG';
    const toRad = isDeg ? `*(Math.PI/180)` : '';
    const fromRad = isDeg ? `*(180/Math.PI)` : '';

    // Advanced Trig & Inverses
    sanitized = sanitized.replace(/sin⁻¹\(([^)]+)\)/g, `(Math.asin($1)${fromRad})`);
    sanitized = sanitized.replace(/cos⁻¹\(([^)]+)\)/g, `(Math.acos($1)${fromRad})`);
    sanitized = sanitized.replace(/tan⁻¹\(([^)]+)\)/g, `(Math.atan($1)${fromRad})`);

    sanitized = sanitized.replace(/asinh\(([^)]+)\)/g, `Math.asinh($1)`);
    sanitized = sanitized.replace(/acosh\(([^)]+)\)/g, `Math.acosh($1)`);
    sanitized = sanitized.replace(/atanh\(([^)]+)\)/g, `Math.atanh($1)`);

    sanitized = sanitized.replace(/sinh\(([^)]+)\)/g, `Math.sinh($1)`);
    sanitized = sanitized.replace(/cosh\(([^)]+)\)/g, `Math.cosh($1)`);
    sanitized = sanitized.replace(/tanh\(([^)]+)\)/g, `Math.tanh($1)`);

    sanitized = sanitized.replace(/sin\(([^)]+)\)/g, `Math.sin(($1)${toRad})`);
    sanitized = sanitized.replace(/cos\(([^)]+)\)/g, `Math.cos(($1)${toRad})`);
    sanitized = sanitized.replace(/tan\(([^)]+)\)/g, `Math.tan(($1)${toRad})`);

    // Logarithms
    sanitized = sanitized.replace(/ln\(([^)]+)\)/g, `Math.log($1)`);
    sanitized = sanitized.replace(/log\(([^)]+)\)/g, `Math.log10($1)`);

    // Roots
    sanitized = sanitized.replace(/√\(([^)]+)\)/g, `Math.sqrt($1)`);
    sanitized = sanitized.replace(/∛\(([^)]+)\)/g, `Math.cbrt($1)`);

    // Abs
    sanitized = sanitized.replace(/abs\(([^)]+)\)/g, `Math.abs($1)`);

    // Secure evaluation using Function constructor with Math scope
    const safeEvaluator = new Function(`"use strict"; return (${sanitized});`);
    return safeEvaluator();
  }

  processPowers(expr) {
    // Repeatedly replace deepest base^exp with Math.pow(base, exp)
    const powerRegex = /([a-zA-Z0-9_\.]+|\([^\(\)]+\))\^([a-zA-Z0-9_\.]+|\([^\(\)]+\))/;
    while (powerRegex.test(expr)) {
      expr = expr.replace(powerRegex, 'Math.pow($1, $2)');
    }
    return expr;
  }

  processFactorials(expr) {
    const factRegex = /(\d+(?:\.\d+)?|\([^\(\)]+\))!/;
    while (factRegex.test(expr)) {
      expr = expr.replace(factRegex, (match, n) => {
        return `SciMthCalculator.factorial(${n})`;
      });
    }
    return expr;
  }

  static factorial(n) {
    n = Number(n);
    if (n < 0 || !Number.isInteger(n)) return NaN;
    if (n === 0 || n === 1) return 1;
    if (n > 170) return Infinity; // JS Number overflow threshold
    let res = 1;
    for (let i = 2; i <= n; i++) {
      res *= i;
    }
    return res;
  }

  formatResult(num) {
    if (typeof num !== 'number') return num;
    if (isNaN(num)) return 'Error';

    // Round small floating inaccuracies, e.g. sin(180 deg) = ~0
    if (Math.abs(num) < 1e-12) return 0;

    // Use exponential notation for very large or tiny numbers
    if (Math.abs(num) >= 1e12 || (Math.abs(num) > 0 && Math.abs(num) < 1e-7)) {
      return num.toExponential(8).replace(/\.?0+e/, 'e');
    }

    // Otherwise round nicely to max 10 decimal digits
    const str = parseFloat(num.toFixed(10)).toString();
    return str;
  }

  showError(msg) {
    this.expression = this.currentValue;
    this.currentValue = msg;
    this.justCalculated = true;
    this.updateDisplay();
  }

  updateDisplay() {
    this.mainDisplay.textContent = this.currentValue || '0';
    this.expressionDisplay.textContent = this.expression || '';
    
    // Auto scroll right for long inputs
    this.mainDisplay.parentElement.scrollLeft = this.mainDisplay.parentElement.scrollWidth;
    this.expressionDisplay.scrollLeft = this.expressionDisplay.scrollWidth;
  }

  // History Management
  addToHistory(expr, res) {
    this.history.unshift({ expression: expr, result: res, timestamp: Date.now() });
    if (this.history.length > 50) this.history.pop();
    localStorage.setItem('scimth_history', JSON.stringify(this.history));
    this.renderHistory();
  }

  renderHistory() {
    if (!this.historyList) return;
    
    if (this.history.length === 0) {
      this.historyList.innerHTML = '<p class="history-empty">No calculations yet</p>';
      return;
    }

    this.historyList.innerHTML = this.history.map((item, idx) => `
      <div class="history-item" data-index="${idx}">
        <div class="history-expr">${item.expression}</div>
        <div class="history-res">= ${item.result}</div>
      </div>
    `).join('');

    // Restore clicked calculation
    this.historyList.querySelectorAll('.history-item').forEach(el => {
      el.addEventListener('click', () => {
        const idx = el.dataset.index;
        const selected = this.history[idx];
        if (selected) {
          this.currentValue = selected.result.toString();
          this.expression = selected.expression + ' =';
          this.justCalculated = true;
          this.updateDisplay();
          this.historyPanel.classList.remove('open');
        }
      });
    });
  }

  clearHistory() {
    this.history = [];
    localStorage.removeItem('scimth_history');
    this.renderHistory();
  }

  // Keyboard Mapping
  handleKeyboard(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const key = e.key;

    if (/^[0-9]$/.test(key)) {
      this.insertToken(key);
      this.updateDisplay();
      return;
    }

    switch (key) {
      case '+':
        this.insertToken('+');
        break;
      case '-':
        this.insertToken('−');
        break;
      case '*':
        this.insertToken('×');
        break;
      case '/':
        e.preventDefault();
        this.insertToken('÷');
        break;
      case '.':
        this.insertToken('.');
        break;
      case '%':
        this.insertToken('%');
        break;
      case '^':
        this.insertToken('^');
        break;
      case '(':
      case ')':
        this.insertToken(key);
        break;
      case 'Enter':
      case '=':
        e.preventDefault();
        this.calculate();
        break;
      case 'Backspace':
        this.deleteLast();
        break;
      case 'Escape':
        this.allClear();
        break;
      default:
        return;
    }

    this.updateDisplay();
  }
}

// Bootstrap calculator on load
document.addEventListener('DOMContentLoaded', () => {
  window.scimth = new SciMthCalculator();
});
