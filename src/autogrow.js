//constructor
Autogrow = function(element){
  var _this = this;

  if(typeof element === 'undefined' || element.tagName.toLowerCase() !== 'textarea') console.warn('You must define a textarea to deploy the autogrow onto.')
  
  _this.elements = {
    'textarea': element
  }
  
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

  _this.elements.mirror.style.minHeight = (parseInt(textareaStyles.minHeight, 10) || parseInt(textareaStyles.height, 10) || parseInt(_this.elements.mirror.style.lineHeight, 10))+'px';
  
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
  
  _this.elements.textarea.addEventListener('keyup', function(){_this.calculateTextareaHeight()});
  
  return true;
}

Autogrow.prototype.unregisterEventListeners = function(){
  var _this = this;
  
  _this.elements.textarea.removeEventListener('keyup', function(){_this.calculateTextareaHeight()});
  
  return true;
}

Autogrow.prototype.calculateTextareaHeight = function(e){
  var _this = this;
  var calculatedHeight = parseInt(_this.elements.mirror.style.minHeight, 10);
  
  _this.copyTextToMirror();

  calculatedHeight = Math.max(parseInt(_this.elements.mirror.clientHeight, 10), parseInt(calculatedHeight, 10));

  _this.elements.textarea.style.height = calculatedHeight+'px';
  
  return true;
}

Autogrow.prototype.copyTextToMirror = function(){
  var _this = this;
  var textareaValue = _this.elements.textarea.value;
  
  _this.elements.mirror.innerHTML = textareaValue;

  return true;
}