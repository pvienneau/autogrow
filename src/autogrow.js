//constructor
Autogrow = function(element, options){
  var _this = this;
  options = options || {};
  
  //private variablesun
  var defaultOptions = {
    'minRows': 1,
    'maxRows': false,
    'scrollOnOverflow': true
  };
  
  //private methods
  var extend = function(){
    for(var i=1; i<arguments.length; i++){
      for(var key in arguments[i]){
        if(arguments[i].hasOwnProperty(key))  arguments[0][key] = arguments[i][key];
      }
    }
        
    return arguments[0];
  }
  
  var cleanOptions = function(options){
    if(!options) return {};
    
    if(typeof options.minRows !== 'undefined') options.minRows = Math.max(1, options.minRows);
    
    return options;
  }
  
  if(typeof element === 'undefined' || element.tagName.toLowerCase() !== 'textarea') return console.warn('You must define a textarea to deploy the autogrow onto.')

  _this.elements = {
    'textarea': element
  }
  _this.options = extend(defaultOptions, cleanOptions(options));
  
  _this.update(true);
  
  return _this;
};

Autogrow.prototype.update = function(hardUpdate){
  var _this = this;
  
  if(typeof hardUpdate === 'undefined') hardUpdate = false;
  
  _this.createMirror();
  
  if(hardUpdate){
    _this.registerEventListeners();
  }
  
  _this.updateTextareaRowCount();
  
  return true;
};

Autogrow.prototype.createMirror = function(){
  var _this = this;
  var textareaStyles = window.getComputedStyle(_this.elements.textarea, null);

  var textareaWidth = (parseInt(_this.elements.textarea.offsetWidth, 10) - parseInt(textareaStyles.paddingLeft, 10) - parseInt(textareaStyles.paddingRight, 10) - parseInt(textareaStyles.borderLeftWidth, 10) - parseInt(textareaStyles.borderRightWidth, 10)) + 'px';
  var forceStylesBoth = {
    'overflowY': 'hidden',
    'overflowX': 'hidden',
    'height': 'auto',
    'textRendering': 'optimizeSpeed',
    'display': textareaStyles['display']
  };
  var forceStylesMirror = {
    'visibility': 'hidden',
    'position': 'absolute',
    'zIndex': -1,
    'width': textareaWidth,
    'left': '-9999px',
    'top': '-9999px'
  };
  var copyStyles = ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'fontVariant', 'fontStretch', 'letterSpacing', 'lineHeight', 'textTransform', 'wordSpacing', 'wordBreak', 'letterSpacing', 'textIndent', 'whiteSpace', 'wordWrap', 'paddingRight', 'paddingLeft', 'borderRightWidth', 'borderRightStyle', 'borderLeftWidth', 'borderLeftStyle'];
  
  _this.destroyMirror();
  
  _this.elements.mirror = document.createElement("div");
  
  for(property in forceStylesBoth){
    _this.elements.textarea.style[property] = forceStylesBoth[property];
    _this.elements.mirror.style[property] = forceStylesBoth[property];
  }
  
  for(property in forceStylesMirror){
    _this.elements.mirror.style[property] = forceStylesMirror[property];
  }
  
  copyStyles.forEach(function(item){
     _this.elements.mirror.style[item] = textareaStyles[item];
     _this.elements.textarea.style[item] = textareaStyles[item];
  });

  _this.elements.textarea.rows = _this.options.minRows;
  
  _this.options.rowHeight = parseInt(_this.elements.mirror.style.lineHeight, 10);

  _this.elements.mirror.style.minHeight = (_this.options.minHeight || parseInt(textareaStyles.minHeight, 10) || parseInt(textareaStyles.height, 10) || parseInt(_this.elements.mirror.style.lineHeight, 10))+'px';

  document.body.appendChild(_this.elements.mirror);
  
  return true;
};

Autogrow.prototype.destroyMirror = function(){
  var _this = this;

  if(!_this.elements.mirror) return false;
  
  _this.elements.mirror.parentNode.removeChild(_this.elements.mirror);
  delete _this.elements.mirror;

  return true;
};

Autogrow.prototype.registerEventListeners = function(){
  var _this = this;

  _this.unregisterEventListeners();

  _this.elements.textarea.addEventListener('keydown', function(event){_this.keyDownHandler(event);});
  _this.elements.textarea.addEventListener('input', function(event){_this.keyPressHandler(event);});
  
  return true;
};

Autogrow.prototype.unregisterEventListeners = function(event){
  var _this = this;
  
  _this.elements.textarea.removeEventListener('keydown', function(event){_this.keyDownHandler(event);});
  _this.elements.textarea.removeEventListener('input', function(event){_this.keyPressHandler(event);});
  
  return true;
};

Autogrow.prototype.keyDownHandler = function(event){
  var _this = this;

  /*
    To verify that we can perform the calculation to block the user from surpassing the allocated rows on a textarea, we must validate the following conditions:
    1. The option 'scrollOnOverflow' is indeed set to false, disallowing a scroll to happen on overflow;
    2. The textarea has reached its maximum number of rows, and that this maximum value is indeed defined;
    3. The key is not one of the following (Meta, Control, Shift, Alt), which would otherwise not append a value to the textarea
    4. The key value is indeed a character, as opposed to keys such as the arrows, backspace, etc.
    
    Exceptions include:
    a. Force check if 'Enter' is pressed (new line keys)
    b. Abort if 'Backspace' or 'Delete' is pressed (content deletion keys)
  */
  if(((!_this.options.scrollOnOverflow && (_this.elements.textarea.rows == _this.options.maxRows) && ((!(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) && /^U\+\d{3}\w$/.test(event.keyIdentifier)))) || event.which == 13) && (event.which != 8 && event.which != 46)){

    _this.copyTextToMirror('W'); // push generically widest letter as we can't garantee to convert the keycode to the correct character without doing some mad calculations (see http://stackoverflow.com/a/13127566/751564)
    if(
      _this.getTextareaCalculatedRows(false) > _this.elements.textarea.rows ||
      (_this.getTextareaCalculatedRows(false) >= _this.options.maxRows && event.which == 13)
    ) event.preventDefault();
  }
}

Autogrow.prototype.keyPressHandler = function(event){
   var _this = this;

   _this.updateTextareaRowCount();
};

Autogrow.prototype.updateTextareaRowCount = function(extraCharacter){
  var _this = this;
  var oldRowValue = _this.elements.textarea.rows;

  _this.copyTextToMirror(extraCharacter);

  var calculatedRows = _this.getTextareaCalculatedRows();

  if(_this.options.maxRows && calculatedRows >= _this.options.maxRows && _this.options.scrollOnOverflow){
    _this.elements.textarea.style.overflowY = 'auto';
  }else{
    _this.elements.textarea.style.overflowY = 'hidden';
  }

  if(oldRowValue != calculatedRows){
    _this.elements.textarea.rows = calculatedRows;
    _this.throwEvent('rowChange', _this.elements.textarea);
  }

  return true;
};

Autogrow.prototype.copyTextToMirror = function(extraCharacter){
  var _this = this;
  var textareaValue = _this.elements.textarea.value;
  extraCharacter = extraCharacter || '';
  
  if(textareaValue.match(/\n$/)) textareaValue += '.';
  
  _this.writeToMirror(textareaValue+extraCharacter);

  return true;
};

Autogrow.prototype.writeToMirror = function(str){
  var _this = this;
  str = str || '';
  
  _this.elements.mirror.innerHTML = str;
  
  return str;
}

Autogrow.prototype.getTextareaCalculatedRows = function(enforceBoundaries){
  var _this = this;
  if(typeof enforceBoundaries === 'undefined') enforceBoundaries = true;
  
  var calculatedRows, calculatedHeight = parseInt(_this.elements.mirror.style.minHeight, 10), calculatedRows;
  calculatedHeight = Math.max(parseInt(_this.elements.mirror.clientHeight, 10), parseInt(calculatedHeight, 10));
  
  calculatedRows = calculatedHeight/_this.options.rowHeight;

  if(enforceBoundaries){
    calculatedRows = Math.max(_this.options.minRows, calculatedRows);
    if(_this.options.maxRows){
      if(calculatedRows > _this.options.maxRows && !_this.options.scrollOnOverflow) _this.trimTextareaValue(_this.options.maxRows);
      
      calculatedRows = Math.min(_this.options.maxRows, calculatedRows);
    }
  }

  return calculatedRows;
}

Autogrow.prototype.trimTextareaValue = function(maximumRows){
  var _this = this;
  maximumRows = maximumRows || _this.options.maxRows || _this.options.minRows || false;

  if(!maximumRows) return false;
  
  var value = _this.elements.textarea.value;

  while(_this.getTextareaCalculatedRows(false) > maximumRows){
    value = value.substring(0, value.length-1);
    _this.writeToMirror(value);
  }
  
  _this.elements.textarea.value = value;
}

Autogrow.prototype.throwEvent = function(eventName, element){
  var _this = this;
  if(typeof eventName === 'undefined' || typeof element === 'undefined') return false;

  element.dispatchEvent(new Event(eventName));
};

//call constructor
(function(){
  var textareas = document.getElementsByTagName('textarea');

  for(var ii = 0; ii < textareas.length; ii++){
    var textarea = textareas[ii];
    if(textarea.dataset.autogrow){
      new Autogrow(textarea);
    }
  }
}());