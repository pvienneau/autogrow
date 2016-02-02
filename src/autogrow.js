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
		
		_this.elements = {
			'textarea': element
		};
		
		var defaultOptions = {
			'minRows': 1,
			'maxRows': false,
			'debug': true,
			'callbacks': {}
		};
		
		_this.options = extend(defaultOptions, options);
		
		//clean options
		_this.options.minRows = Math.max(1, _this.options.minRows);
		if(_this.options.maxRows < 0) _this.options.maxRows = false;
		
		_this.reInit();
		
		_callback.call(_this, 'create');
		
		return _this;		
	}
	/*constructor*/
	
	/*private methods*/	
	var _isTagName = function(element, tagName){
		return (element && element.tagName.toLowerCase() == tagName.toLowerCase());
	}
	
	var extend = function(){
		for(var i=1; i<arguments.length; i++){
			for(var key in arguments[i]){
				if(arguments[i].hasOwnProperty(key))  arguments[0][key] = arguments[i][key];
			}
		}
		
		return arguments[0];
	}
	
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
	
	var _registerEventListeners = function(){
		var _this = this;
		
		_unregisterEventListeners.call(_this);
		
		_this.elements.textarea.addEventListener('keydown', function(e){
			return _keyDownHandler.call(_this);
		});
		_this.elements.textarea.addEventListener('input', function(e){
			return _keyPressHandler.call(_this);
		});
		
		return true;
	}
	
	var _unregisterEventListeners = function(){
		var _this = this;
		
		_this.elements.textarea.removeEventListener('keydown', function(e){
			return _keyDownHandler.call(_this);
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
		
		console.log(e);
	}

	var _createMirror = function(){
		var _this = this;
		
		_destroyMirror.call(_this);
	
		_this.elements.mirror = document.createElement('div');
		_this.elements.mirror.rows = _this.options.minRows;
		
		document.body.appendChild(_this.elements.mirror);
		
		return true;
	}
	
	var _destroyMirror = function(){
		var _this = this;
		
		if(!_this.elements.mirror) return false;
		
		_this.elements.mirror.parentNode.removeChild(_this.elements.mirror);
		delete _this.elements.mirror;
		
		return true;
	}
	
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
	
	var _getUserAgent = function(){
		if(/iPad|iPhone|iPod/.test(navigator.userAgent)) return 'ios';
		if(/Edge\/|Trident\/|MSIE /.test(navigator.userAgent)) return 'ie';
		
		//default
		return false;
	}
	
	var _copyTextToMirror = function(extraString){
		var _this = this;
		var textareaValue = _this.elements.textarea.value;
		extraString = extraString || '';
		
		if(textareaValue.match(/\n$/)) textareaValue += '.';
		
		_this.elements.mirror.innerHTML = (textareaValue+extraString);
	}
	
	var _getMirrorRowCount = function(){
		var _this = this;
		
		var calculatedRows, 
			calculatedHeight = parseInt(_this.elements.mirror.style.minHeight, 10);
			
		calculatedHeight = Math.max(parseInt(_this.elements.mirror.clientHeight, 10), parseInt(calculatedHeight, 10));
		calculatedRows = calculatedHeight/_this.data.rowHeight;
		
		return Math.round(calculatedRows);
	}
	/*private methods*/
	
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

	Autogrow.prototype.destroy = function(){
	  	var _this = this;
	  	
		_unregisterEventListeners.call(_this);
	
		delete _this.data;
	
		_destroyMirror.call(_this);

		return true;
	};
	
	Autogrow.prototype.refresh = function(){
		var _this = this;
		
		_refreshStyles.call(_this);
		
		_callback.call(_this, 'refresh');
		
		return true;
	}
	
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
	
	Autogrow.prototype.getRowCount = function(){
		var _this = this;

		return _this.elements.textarea.rows;
	}
	
	Autogrow.prototype.setRowCount = function(rowCount){
		var _this = this,
		rowCount = rowCount || _this.elements.textarea.rows;
		
		_this.elements.textarea.rows = rowCount;
		
		return true;
	}
	
	return Autogrow;
})();








//call constructor
(function(){
  	var textareas = document.querySelectorAll('textarea[data-autogrow="true"]');
	
  	for(var ii = 0; ii < textareas.length; ii++){
    	var textarea = textareas[ii];
    	new Autogrow(textarea);
  	}
}());