var Autogrow = (function(){
	/*constructor*/
	function Autogrow(element, options){
		var _this = this;
		
		//jQuery workaround: as it's likely that a jQuery textarea object be passed
		if(window.jQuery && element instanceof jQuery) element = element.get(0);
		
		if(!element || !_isTagName(element, 'textarea')){
			console.warn('Autogrow: You must define a textarea in order to deploy.');
		}
		
		//options default value
		options = options || {};
		
		//elements listing
		_this.elements = {
			'textarea': element,
			'mirror': null
		};
		
		//default options
		var defaultOptions = {
			'minRows': 1,
			'maxRows': false,
			'debug': true,
			'callbacks': {}
		};
		
		//instantiated options
		_this.options = _extend(defaultOptions, options);
		
		//clean options
		_this.options.minRows = Math.max(1, _this.options.minRows);
		if(_this.options.maxRows < 0) _this.options.maxRows = false;
		
		//original attributes stored for possible element state reset in destroy
		_this.attributes = {
			'rows': ''
		};
		
		for(var i = 0; i < _this.elements.textarea.attributes.length; i++){
			_this.attributes[_this.elements.textarea.attributes[i].name] = _this.elements.textarea.attributes[i].value;
		}
		
		//build Autogrow
		_this.reInit();
		
		_callback.call(_this, 'create');
		
		//store on element
		if(!_this.elements.textarea.data) _this.elements.textarea.data = {};
		_this.elements.textarea.data.autogrow = _this;
		
		return _this;		
	}
	/*constructor*/
	
	/*private methods*/
	
	//isTagName: Check wether the element is of the specified tag name
	//element: [Element Object] Element to check tag name
	//tagName: [String] Tag name to compare element's tag name value against
	var _isTagName = function(element, tagName){
		return (element && element.tagName.toLowerCase() == tagName.toLowerCase());
	}
	
	//extend: Merge objects, by order they are defined in parameter
	//object: [Object] * Object(s) to merge
	var _extend = function(){
		for(var i=1; i<arguments.length; i++){
			for(var key in arguments[i]){
				if(arguments[i].hasOwnProperty(key))  arguments[0][key] = arguments[i][key];
			}
		}
		
		return arguments[0];
	}
	
	//callback: Execute a defined callback event within the widget; subsequently throws event in DOM, unless the widget callback returns false
	//eventName: [String] name of event to throw
	var _callback = function(eventName){
		var _this = this;
		
		if(!eventName) return false;
		
		var _event = document.createEvent('customEvent'),
			_result = true;

		_event.initEvent(eventName.toLowerCase(), true, false, {});
		
		if(_this.options.callbacks[eventName]){
			_result = _this.options.callbacks[eventName].call(_this);
		}

		if(_result) _this.elements.textarea.dispatchEvent(_event);

		return _result;
	}
	
	//registerEventListeners: Register events handlers within widget 
	var _registerEventListeners = function(){
		var _this = this;
		
		_unregisterEventListeners.call(_this);
		
		_this.elements.textarea.addEventListener('keydown', function(e){
			return _keyDownHandler.call(_this, e);
		});
		_this.elements.textarea.addEventListener('input', function(e){
			return _keyPressHandler.call(_this, e);
		});
		
		return true;
	}
	
	//unregisterEventListeners: Unregister events handlers within widget 
	var _unregisterEventListeners = function(){
		var _this = this;
		
		_this.elements.textarea.removeEventListener('keydown', function(e){
			return _keyDownHandler.call(_this, e);
		});
		
		_this.elements.textarea.removeEventListener('input', function(e){
			return _keyPressHandler.call(_this, e);
		});
		
		return true;
	}
	
	
	var _keyPressHandler = function(){
		var _this = this;
		
		_this.update();
	}
	
	var _keyDownHandler = function(e){
		var _this = this;
		
		return false;
	}

	//createMirror: Build mirror element, which is used to calculate the number of rows for the textarea
	var _createMirror = function(){
		var _this = this;
		
		_destroyMirror.call(_this);
	
		_this.elements.mirror = document.createElement('div');
		_this.elements.mirror.rows = _this.options.minRows;
		
		document.body.appendChild(_this.elements.mirror);
		
		return true;
	}
	
	//destroyMirror: Destroy mirror element
	var _destroyMirror = function(){
		var _this = this;
		
		if(!_this.elements.mirror) return false;
		
		_this.elements.mirror.parentNode.removeChild(_this.elements.mirror);
		delete _this.elements.mirror;
		
		return true;
	}
	
	//refreshStyles: Build inline styles for both textarea and mirror elements
	var _refreshStyles = function(){
		var _this = this;
		
		if(!_this.elements.mirror) return false;
		
		//textarea computed styles, which will be used to style the mirror
		var textareaStyles = window.getComputedStyle(_this.elements.textarea, null);
		//browser-specific styling offsets
		var userAgent = _getUserAgent();
		var userAgentOffsetOverrides = {
			'iOS': {
				'paddingLeft': 3,
				'paddingRight': 3
			},
			'IE': {
				'paddingRight': 2
			}
		};
		
		//remove old inline styles on mirror
		_this.elements.mirror.removeAttribute('style');
		
		//define new styles for mirror
		var textareaWidth = (
			parseInt(_this.elements.textarea.offsetWidth, 10) 
			- parseInt(textareaStyles.paddingLeft, 10) 
			- parseInt(textareaStyles.paddingRight, 10) 
			- parseInt(textareaStyles.borderLeftWidth, 10) 
			- parseInt(textareaStyles.borderRightWidth, 10) 
			- ((userAgentOffsetOverrides[userAgent] && userAgentOffsetOverrides[userAgent].paddingLeft)?userAgentOffsetOverrides[userAgent].paddingLeft:0) 
			- ((userAgentOffsetOverrides[userAgent] && userAgentOffsetOverrides[userAgent].paddingRight)?userAgentOffsetOverrides[userAgent].paddingRight:0) 
		) + 'px';
		var forceStylesBoth = {
			'overflowY': 'hidden',
			'overflowX': 'hidden',
			'height': 'auto',
			'textRendering': 'optimizeSpeed'
		};
		var forceStylesTextarea = {
			'resize': 'none'
		}
		var forceStylesMirror = {
			'visibility': 'hidden',
			'position': 'absolute',
			'zIndex': -1,
			'width': textareaWidth,
			'left': '-9999px',
			'top': '-9999px'
		};
		var copyStyles = ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'fontVariant', 'fontStretch', 'letterSpacing', 'lineHeight', 'textTransform', 'wordSpacing', 'wordBreak', 'letterSpacing', 'textIndent', 'whiteSpace', 'wordWrap', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'borderRightWidth', 'borderRightStyle', 'borderLeftWidth', 'borderLeftStyle'];
		
		//force line-heigth in px units
		if(!textareaStyles.lineHeight.match(/^\d+px$/)){
			_this.elements.textarea.style.lineHeight = (parseInt(textareaStyles.fontSize, 10)*1.2) + 'px';
			textareaStyles = window.getComputedStyle(_this.elements.textarea, null)
		}
		
		//force default styles to both textarea and mirror
		for(property in forceStylesBoth){
		 	_this.elements.textarea.style[property] = forceStylesBoth[property];
	    	_this.elements.mirror.style[property] = forceStylesBoth[property];
	  	}

		//force default styles to textarea
	  	for(property in forceStylesTextarea){
	    	_this.elements.textarea.style[property] = forceStylesTextarea[property];
	  	}

		//force default styles to mirror
	  	for(property in forceStylesMirror){
	    	_this.elements.mirror.style[property] = forceStylesMirror[property];
	  	}

		//copy styles from textarea to mirror (also set styles as inline for textarea so we're sure they won't change between refreshes)
	  	copyStyles.forEach(function(item){	
	     	_this.elements.mirror.style[item] = textareaStyles[item];
	     	_this.elements.textarea.style[item] = textareaStyles[item];
	  	});
		
		for(property in userAgentOffsetOverrides[userAgent]){
			_this.elements.mirror.style[property] = (parseInt(_this.elements.mirror.style[property], 10) + parseInt(userAgentOffsetOverrides[userAgent][property], 10)) + (_this.elements.mirror.style[property].indexOf('px')?'px':'');
		}
		
		_this.data.rowHeight = parseInt(_this.elements.mirror.style.lineHeight, 10);
		_this.elements.mirror.style.minHeight = _this.options.minRows*_this.data.rowHeight+'px';
	
		if(_this.options.debug) _setDebugStyles.call(_this);
	
		return true;
	}
	
	//calculateOffset: Calculate offset from element to body boundaries, for the provided direction
	//element: [Element Object] Element to calculate offset from, relative to body
	//direction: [String] Direction of offset to calculate. Accepted values are [Top, Right, Bottom, Left] 
	var _calculateOffset = function(element, direction){
		direction = direction || 'top';
		var offset = 0;
		
		direction = direction.charAt(0).toUpperCase() + direction.slice(1).toLowerCase();
		
		do {
	    	if (!isNaN(element['offset'+direction])){
	    		offset += element['offset'+direction];
	      	}
	    }while(element = element.offsetParent);
		
		return offset;
	}
	
	//setDebugStyles: Set special styles on mirror when in debug mode for a better debugging experience
	var _setDebugStyles = function(){
		var _this = this;
		
		var mirrorDebugStyles = {
			'visibility': 'visible',
			'position': 'absolute',
			'zIndex': 1,
			'left': (_calculateOffset(_this.elements.textarea, 'left')+_this.elements.textarea.offsetWidth+10)+'px',
			'top': _calculateOffset(_this.elements.textarea, 'top')+'px',
			'border': '1px solid #7396FF',
			'color': '#7396FF',
			'opacity': 0.5
		};
		
		for(style in mirrorDebugStyles){
			_this.elements.mirror.style[style] = mirrorDebugStyles[style];
		}
	}
	
	//getUserAgent: Returns browser's user agent, if applicable
	var _getUserAgent = function(){
		if(/iPad|iPhone|iPod/.test(navigator.userAgent)) return 'ios';
		if(/Edge\/|Trident\/|MSIE /.test(navigator.userAgent)) return 'ie';
		
		//default
		return false;
	}
	
	//copyTextToMirror: Write text to mirror's innerHTML, from textarea's value, optionally concatenated with an extra string
	//extraString: [String]
	var _copyTextToMirror = function(extraString){
		var _this = this;
		var textareaValue = _this.elements.textarea.value;
		extraString = extraString || '';
		
		if(textareaValue.match(/\n$/)) textareaValue += '.';
		
		_this.elements.mirror.innerHTML = (textareaValue+extraString);
	}
	
	//getMirrorRowCount: Get number of rows currently found in mirror element's innerHTML
	var _getMirrorRowCount = function(){
		var _this = this;
		
		var calculatedRows, 
			calculatedHeight = parseInt(_this.elements.mirror.style.minHeight, 10);
			
		calculatedHeight = Math.max(parseInt(_this.elements.mirror.clientHeight, 10), parseInt(calculatedHeight, 10));
		calculatedRows = calculatedHeight/_this.data.rowHeight;
		
		return Math.round(calculatedRows);
	}
	/*private methods*/
	
	//reInit: Deploy widget
	Autogrow.prototype.reInit = function(){
		var _this = this;
		
		_this.destroy();
		
		_this.data = {};
		
		_createMirror.call(_this);
		
		_registerEventListeners.call(_this);
		
		_this.refresh();
		_this.update(true);
		
		return true;
	}

	//Destroy: Destroy widget
	Autogrow.prototype.destroy = function(){
	  	var _this = this;
	  	
		_unregisterEventListeners.call(_this);
		
		delete _this.data;
		
		_destroyMirror.call(_this);
		
		_this.elements.textarea.removeAttribute('style');
		
		for(attribute in _this.attributes){
			_this.elements.textarea[attribute] = _this.attributes[attribute];
		}
		
		return true;
	};
	
	//Refresh: Update widget's stylings
	Autogrow.prototype.refresh = function(){
		var _this = this;
		
		_refreshStyles.call(_this);
		
		_callback.call(_this, 'refresh');
		
		return true;
	}
	
	
	//Update: Update widget's state and sizings
	//silent: [Boolean] If set to false, do not throw callback on row change
	Autogrow.prototype.update = function(silent){
		var _this = this,
			oldRowCount = _this.getRowCount(),
			newRowCount = 0;
			
		silent = silent || false;
		
		_copyTextToMirror.call(_this);
		newRowCount = _getMirrorRowCount.call(_this);
		
		if(oldRowCount != newRowCount){
			_this.setRowCount(newRowCount);
			if(!silent) _callback.call(_this, 'rowChange');
		}
		
		return true;
	}
	
	//getRowCount: Get current row value of textarea element
	Autogrow.prototype.getRowCount = function(){
		var _this = this;

		return _this.elements.textarea.rows;
	}
	
	//setRowCount: Set textarea element's row attribute value
	Autogrow.prototype.setRowCount = function(rowCount){
		var _this = this,
		rowCount = rowCount || _this.elements.textarea.rows;
		
		_this.elements.textarea.rows = rowCount;
		
		return true;
	}
	
	//getLastLine: Get the last line of the textarea element's innerHTML
	Autogrow.prototype.getLastLine = function(){
		var _this = this,
			_value = _this.elements.textarea.value,
			_clone = _this.elements.mirror.cloneNode(true);

		
		_clone.innerHTML = 'W';
		
		document.body.appendChild(_clone);
		
		var _cloneStyles = window.getComputedStyle(_clone, null);
		
		var _prevHeight = parseInt(_cloneStyles.height, 10);
		var _str = '';
		
		for(var i = 0; i < _value.length; i++){
			_clone.innerHTML = _str+_value[i];
			
			_cloneStyles = window.getComputedStyle(_clone, null);
			
			if(parseInt(_cloneStyles.height, 10) > _prevHeight){
				i = _value.substr(0, i).lastIndexOf(' ')+1;
				
				_str = '';
			}
			
			_str += _value[i];
		}
		
		_clone.parentNode.removeChild(_clone);
		delete _clone;
		
		return _str.replace(/^(\s)*/g, '');
	}
	
	//getLastLineWidth: Get width of last line of text form textarea
	Autogrow.prototype.getLastLineWidth = function(){
		var _this = this,
			_value = _this.elements.textarea.value,
			_clone = _this.elements.mirror.cloneNode(true);
			
		document.body.appendChild(_clone);
		
		_clone.innerHTML = _this.getLastLine();
		
		_clone.style.width = 'auto';
		
		var _cloneComputedStyle = window.getComputedStyle(_clone, null);
		var _cloneWidth = parseInt(_cloneComputedStyle.width);
		var _clonePaddingLeft = parseInt(_cloneComputedStyle.paddingLeft);
		
		_clone.parentNode.removeChild(_clone);
		delete _cloneWidth;

		return parseInt(_cloneWidth + _clonePaddingLeft, 10);
	}
	
	return Autogrow;
})();


/*Auto-call*/
(function(){
  	var textareas = document.querySelectorAll('textarea[data-autogrow="true"]');
	
  	for(var ii = 0; ii < textareas.length; ii++){
    	var textarea = textareas[ii];
    	new Autogrow(textarea);
  	}
}());
/*Auto-call*/