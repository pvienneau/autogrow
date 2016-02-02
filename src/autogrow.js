/*
  Autogrow 2.0.1
  license: MIT
  https://github.com/pvienneau/autogrow
*/
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
			'allowLineBreak': false,
			'scrollOnOverflow': false,
			'callbacks': {},
			'debug': true
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
		
		if(!_this.options.allowLineBreak){
			_this.elements.textarea.addEventListener('keydown', function(e){
				return _lineBreakHandler.call(_this, e);
			});
		}
		
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
		
		_this.elements.textarea.removeEventListener('keydown', function(e){
			return _lineBreakHandler.call(_this, e);
		});
		
		return true;
	}
	
	
	var _keyPressHandler = function(){
		var _this = this;
		
		_this.update();
	}
	
	var _keyDownHandler = function(e){
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
		
		if(((!_this.options.scrollOnOverflow && (_this.elements.textarea.rows == _this.options.maxRows) && ((!(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) && /^U\+\d{3}\w$/.test(e.keyIdentifier)))) || e.which == 13) && (e.which != 8 && e.which != 46)){
		
			_copyTextareaToMirror.call(_this, 'W'); // push generically widest letter as we can't garantee to convert the keycode to the correct character without doing some mad calculations (see http://stackoverflow.com/a/13127566/751564)
			if(
				!_this.options.scrollOnOverflow &&
				(_this.getRowCount() > _this.elements.textarea.rows ||
				(_this.getRowCount() >= _this.options.maxRows && e.which == 13))
			){
				e.preventDefault();
			}
		}
		
		return false;
	}
	
	var _lineBreakHandler = function(e){
		var _this = this;
		
		if(!e.shiftKey && e.which == 13) e.preventDefault();
	
		return true;
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
	
	//copyTextareaToMirror: Write text to mirror's innerHTML, from textarea's value, optionally concatenated with an extra string
	//extraString: [String]: String to concatenate at end of textarea element's value
	var _copyTextareaToMirror = function(extraString){
		var _this = this;
		var textareaValue = _this.elements.textarea.value;
		extraString = extraString || '';
		
		if(textareaValue.match(/\n$/)) textareaValue += '.';
		
		return _writeToMirror.call(_this, textareaValue+extraString);
	}
	
	//_writeToMirror: Write string to mirror's innerHTML.
	//str: [String] String to add to mirror element
	var _writeToMirror = function(str){
		var _this = this;
		
		str = str || '';
		
		_this.elements.mirror.innerHTML = str;
		
		return true;
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
	
	//trimTextarea: Trim textarea's innerHTML, limited to the number of rows specified
	//maxAllowedRows: [Integer] Maximum allowed rows for trim to complete
	var _trimTextarea = function(maxAllowedRows){
		var _this = this;
		
		if(!maxAllowedRows) return false;
		
		var value = _this.elements.textarea.value;
		
		//remove multiple spaces at end of textarea value
		value = value.replace(/\s\s+$/g, ' ');
		_this.elements.textarea.value = value;
		_copyTextareaToMirror.call(_this);
		
		var kk = value.length;
		while(_getMirrorRowCount.call(_this) > maxAllowedRows && kk--){
			value = value.substring(0, value.length-1);
			_writeToMirror.call(_this, value);
		}
		
		_this.elements.textarea.value = value;
		_copyTextareaToMirror.call(_this);
		
		return true;
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
		this.update(true);
		
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
		
		if(_this.options.maxRows) _trimTextarea.call(_this, _this.options.maxRows);
		
		_copyTextareaToMirror.call(_this);
		newRowCount = _getMirrorRowCount.call(_this);
		
		if(_this.options.maxRows && newRowCount >= _this.options.maxRows && _this.options.scrollOnOverflow){
			_this.elements.textarea.style.overflowY = 'auto';
		}else{
			_this.elements.textarea.style.overflowY = 'hidden';
		}
		
		if(_this.options.minRows) newRowCount = Math.max(_this.options.minRows, newRowCount);
		if(_this.options.maxRows) newRowCount = Math.min(_this.options.maxRows, newRowCount);
		
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
		
		for(var jj = 0; jj < _value.length; jj++){
			_clone.innerHTML = _str+_value[jj];
			
			_cloneStyles = window.getComputedStyle(_clone, null);
			
			if(parseInt(_cloneStyles.height, 10) > _prevHeight){
				jj = _value.substr(0, jj).lastIndexOf(' ')+1;
				
				_str = '';
			}
			
			_str += _value[jj];
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
    	new Autogrow(textarea, {
	'maxRows': 5
});
  	}
}());
/*Auto-call*/