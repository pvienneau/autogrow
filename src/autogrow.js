//constructor
Autogrow = function(element, options){
  var _this = this;
  
  //private variablesun
  var defaultOptions = {
    'minRows': 1,
    'maxRows': false
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
    if(typeof options.minRows !== 'undefined') options.minRows = Math.max(1, options.minRows);
    
    return options;
  }
  
  if(typeof element === 'undefined' || element.tagName.toLowerCase() !== 'textarea') console.warn('You must define a textarea to deploy the autogrow onto.')
  
  _this.elements = {
    'textarea': element
  }
  _this.options = extend(defaultOptions, cleanOptions(options));
  
  _this.update(true);
  
  return _this;
}

Autogrow.prototype.update = function(hardUpdate){
  var _this = this;
  
  if(typeof hardUpdate === 'undefined') hardUpdate = false;
  
  if(hardUpdate){
    _this.createMirror();
    _this.registerEventListeners();
  }
  
  return true;
}

Autogrow.prototype.createMirror = function(){
  var _this = this;
  var textareaStyles = window.getComputedStyle(_this.elements.textarea, null);
  var copyStyles = ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'letterSpacing', 'lineHeight', 'textTransform', 'wordSpacing', 'textIndent', 'width'];
  
  _this.destroyMirror();
  
  _this.elements.mirror = document.createElement("div");
  
  _this.elements.mirror.style.display = 'block',
  _this.elements.mirror.style.visibility = 'hidden';
  _this.elements.mirror.style.position = 'absolute';
  _this.elements.mirror.style.zIndex = -1;
  
  copyStyles.forEach(function(item){
     _this.elements.mirror.style[item] = textareaStyles[item];
  });
  
  _this.elements.textarea.style.overflow = 'hidden';
  _this.elements.textarea.style.height = 'auto';
  _this.elements.textarea.rows = _this.options.minRows;
  
  _this.options.rowHeight = parseInt(_this.elements.mirror.style.lineHeight, 10);

  _this.elements.mirror.style.minHeight = (_this.options.minHeight || parseInt(textareaStyles.minHeight, 10) || parseInt(textareaStyles.height, 10) || parseInt(_this.elements.mirror.style.lineHeight, 10))+'px';

  document.body.appendChild(_this.elements.mirror);
  
  return true;
}

Autogrow.prototype.destroyMirror = function(){
  var _this = this;

  if(!_this.elements.mirror) return false;
  
  _this.elements.mirror.parentNode.removeChild(_this.elements.mirror);
  delete _this.elements.mirror;

  return true;
}

Autogrow.prototype.registerEventListeners = function(){
  var _this = this;

  _this.unregisterEventListeners();

  _this.elements.textarea.addEventListener('input', function(event){_this.keyDownHandler(event);});
  
  return true;
}

Autogrow.prototype.unregisterEventListeners = function(){
  var _this = this;
  
  _this.elements.textarea.removeEventListener('input', function(event){_this.keyDownHandler(event);});
  
  return true;
}

Autogrow.prototype.keyDownHandler = function(){
   var _this = this;

   _this.calculateTextareaHeight();
}

Autogrow.prototype.calculateTextareaHeight = function(){
  var _this = this;
  var calculatedHeight = parseInt(_this.elements.mirror.style.minHeight, 10), calculatedRows;

  _this.copyTextToMirror();

  calculatedHeight = Math.max(parseInt(_this.elements.mirror.clientHeight, 10), parseInt(calculatedHeight, 10));
  
  calculatedRows = Math.max(_this.options.minRows, calculatedHeight/_this.options.rowHeight);
  if(_this.options.maxRows) calculatedRows = math.min(_this.options.maxRows, calculatedHeight);

  _this.elements.textarea.rows = calculatedRows;

  return true;
}

Autogrow.prototype.copyTextToMirror = function(){
  var _this = this;
  var textareaValue = _this.elements.textarea.value;
  
  if(typeof extraKey === 'undefined') extraKey = '';
  
  _this.elements.mirror.innerHTML = textareaValue;
  
  return true;
}