/*
* PottisJS 0.0.2 - JavaScript SVG Interaction Library
* by Samuli Kaipiainen and Matti Paksula
*    Kuje Research Group
*
* Licensed under the Poetic License (http://genaud.net/2005/10/poetic-license/)
*  (c) 2005 Alexander E Genaud
* 
*  This work 'as-is' we provide.
*  No warranty express or implied.
*  We've done our best,
*  to debug and test.
*  Liability for damages denied.
* 
*  Permission is granted hereby,
*  to copy, share, and modify.
*  Use as is fit,
*  free or for profit.
*  These rights, on this notice, rely.
*
*/

var Pottis = function(targetSVG, startCallback)
{
	this.svgNS = "http://www.w3.org/2000/svg";
	this.xlinkNS = "http://www.w3.org/1999/xlink";
	this.targetSVG = targetSVG;
	this.targetDocument = targetSVG.ownerDocument;

	this.dragTarget = null;
	this.mouse = null;
	this.downMouse = null;
	this.prevMouse = null;
	this.mouseText = null;

	// TODO: everything is now crappy :/
	this.mousemove = null;
	this.mouseup = null;

	var _pottis = this;

	// INIT global mouse handlers
	
	this.targetDocument.onmousedown = function(e) {
		_pottis.downMouse = _pottis.prevMouse = _pottis.getMouseCoords(e, targetSVG);

		// call the start callback on first click
		if (startCallback) {
			startCallback(e);
			startCallback = null;
		}

		// route to the addDrag event handler
		if (e.target.pottis && e.target.pottis.mousedown)
			e.target.pottis.mousedown(e);
	
		e.preventDefault();
	};

	this.targetDocument.onmousemove = function(e) {
		_pottis.mouse = _pottis.getMouseCoords(e, targetSVG);
		// _pottis._mouseCoordsHelper(_pottis.mouse);

		if (_pottis.mousemove) _pottis.mousemove(e);

		_pottis.prevMouse = _pottis.mouse;
		
		e.preventDefault();
	};

	// well this certainly needs to be cleaned out :(
	this.targetDocument.onmouseup = function(e) {
		if (e.target.pottis && e.target.pottis.mouseup)
			e.target.pottis.mouseup(e);
		
		var target = _pottis.dragTarget;

		if (target && target.pottis) {
			if (target.pottis.mouseup) target.pottis.mouseup(e);
			if (target.onclick &&
				Math.abs(_pottis.mouse.x - _pottis.downMouse.x) < 2 &&
				Math.abs(_pottis.mouse.y - _pottis.downMouse.y) < 2)
					target.onclick(e);
		}

		if (_pottis.mouseup) _pottis.mouseup(e);
		
		e.preventDefault();
	};


	// TODO: maybe elem or element, instead of shape?
	this.shape = function(elem, attr) {
		var shape = this.targetDocument.createElementNS(this.svgNS, elem);

		for (var a in attr) {
			if (attr[a]) shape.setAttribute(a, attr[a]);
		}

		this._initTransforms(shape);
		this.targetSVG.appendChild(shape);
		
		return shape;
	}

	this.group = function(groupID, elems) {
		var g = this.shape("g", { id: groupID } );

		for (var i = 0; i < elems.length; i++) {
			g.appendChild(elems[i]);
		}

		return g;
	}

	this.use = function(defsID, useID, x, y) {
		var use = this.shape("use", { id: useID } );

		use.setAttributeNS(this.xlinkNS, 'xlink:href', '#' + defsID);

		// NOTE: any x or y attributes would mess up with our transformations,
		// and any previous transformations will be cleared here
		this.translate(use, x, y);
		
		return use;
	}
	
	this.hide = function(elem) {
		elem.style.display = "none";
	}
	
	this.show = function(elem) {
		elem.style.display = "";
	}
	
	this.remove = function(elem) {
		elem.parentNode.removeChild(elem);
	}
	
	this.moveToFront = function(elem) {
		this.targetSVG.appendChild(elem);
	}

	this.moveToBack = function(elem) {
		this.targetSVG.insertBefore(elem, this.targetSVG.firstChild);
	}

	this.moveAbove = function(elem, peer) {
		this.targetSVG.insertBefore(elem, peer.nextSibling);
	}

	this.moveBelow = function(elem, peer) {
		this.targetSVG.insertBefore(elem, peer);
	}

	this.addMouseOver = function(element, callback) {
		element.onmouseover = function(e) {
			callback(e);
		}
	}

	this.addMouseOut = function(element, callback) {
		element.onmouseout = function(e) {
			callback(e);
		}
	}
		
	this.addClick = function(elem, callback) {
		elem.onclick = callback;
	}

	this.addRightClick = function(elem, callback) {
		elem.onmouseup = function(e) {
			if (e.button == 2) {
				callback(e);
			}
		}
	}
	
	// addDoubleClick(elemenent, callback)
	this.addDoubleClick = function(elem, callback) {
		elem.ondblclick = callback;
	}
	
	// TODO: mikÃ¤s callback tÃ¤ssÃ¤ on?
	// addDrag(handle, [target], [callback])
	// TODO: should it support [targets] array?
	this.addDrag = function(handle, target, callback) {
		handle.onmousedown = function(e) {
			_pottis.dragTarget = target ? target : handle;
			
			// thx for tip svgwhiz
			// TODO: should it be target or handle?
			_pottis.dragTarget.setAttribute('pointer-events', 'none');

			_pottis.mousemove = function(e) {
				bb = handle.getBBox();
				bc = handle.getBoundingClientRect();
				//console.log("left " + bc.x + " top " + bc.y);
				// _pottis.shape("line", { stroke: "blue", x1: _pottis.mouse.x, y1: _pottis.mouse.y,
				// 	x2: (bc.left + bc.right) / 2, y2: (bc.top + bc.bottom) / 2 });
					
				//_pottis.shape("rect", { x: bc.left, y: bc.top, 
				//	width: bc.right-bc.left, height: bc.bottom-bc.top });
				
				_pottis.translateAdd(_pottis.dragTarget,
					_pottis.mouse.x - _pottis.prevMouse.x,
					_pottis.mouse.y - _pottis.prevMouse.y)

				if (callback) callback(e);
			}

			_pottis.mouseup = function(e) {
				_pottis.dragTarget.setAttribute('pointer-events', 'all');
				_pottis.dragTarget = null;
				_pottis.mousemove = null;
				_pottis.mouseup = null;
			}
		}
	}

	// removeDrag(element)
	this.removeDrag = function(elem) {
		elem.onmousedown = null;
	}

	// addScale(handle, [target], [callback])
	this.addScale = function(handle, target, callback) {
		handle.onmousedown = function(e) {
			_pottis.dragTarget = target ? target : handle;

			_pottis.mousemove = function(e) {
				_pottis.scaleAdd(_pottis.dragTarget, (_pottis.mouse.x - _pottis.prevMouse.x) / 10);
				
				if (callback) callback(e);
			}

			_pottis.mouseup = function(e) {
				_pottis.dragTarget = null;
				_pottis.mousemove = null;
				_pottis.mouseup = null;
			}
		}
		
	}

	// addRotate(handle, [target], [callback])
	this.addRotate = function(handle, target, callback) {
		handle.onmousedown = function(e) {
			_pottis.dragTarget = target ? target : handle;

			_pottis.mousemove = function(e) {
				_pottis.rotateAdd(_pottis.dragTarget, _pottis.mouse.x - _pottis.prevMouse.x);
				
				if (callback) callback(e);
			}

			_pottis.mouseup = function(e) {
				_pottis.dragTarget = null;
				_pottis.mousemove = null;
				_pottis.mouseup = null;
			}
		}
		
	}
	
	this.addDrop = function(receiver, callback) {
		receiver.onmouseup = function(e) {
			if (_pottis.dragTarget) callback(receiver, _pottis.dragTarget);
		}
	}
	
	
	this._initTransforms = function(elem) {		
		if (elem.pottis) return;
		
		// all the pottis transformations here
		elem.pottis = {
			// translate
			tx: 0,
			ty: 0,			
			// scale
			sx: 1,
			sy: 1,
			stx: 0,
			sty: 0,
			
			//rotate
			a: 0,
			cx: 0,
			cy: 0,
		}
	}
	
	// translate(<tx>  [<ty>])
	this.translate = function(elem, tx, ty) {
		this._initTransforms(elem);

		elem.pottis.tx = tx ? tx : 0;
		elem.pottis.ty = ty ? ty : 0;
		
		this._applyTransforms(elem);
	}
	
	this.translateAdd = function(elem, dx, dy) {
		this._initTransforms(elem);

		var newTx = elem.pottis.tx + dx;
		var newTy = elem.pottis.ty + dy;
		
		elem.pottis.tx = newTx;
		elem.pottis.ty = newTy;
		
		this._applyTransforms(elem);
		
		return ( { x: newTx, y: newTy });
	}
	
	// scale(<sx>  [<sy>]  [<cx> <cy>]), by default relative to elem center
	this.scale = function(elem, sx, sy, cx, cy) {
		this._initTransforms(elem);

		// we need a separate resetting translate for scale
		var bb = elem.getBBox();
		if (bb) {
			elem.pottis.stx = bb.x + (cx!=undefined ? cx : (bb.width / 2));
			elem.pottis.sty = bb.y + (cy!=undefined ? cy : (bb.height / 2));
		}
		
		elem.pottis.sx = sx;
		elem.pottis.sy = sy ? sy : sx;

		this._applyTransforms(elem);
	}
	
	this.scaleAdd = function(elem, sx, sy) {
		this._initTransforms(elem);
		
		var newSx = elem.pottis.sx + sx;
		var newSy = sy ? elem.pottis.sy + sy : undefined;
		this.scale(elem, newSx, newSy);
		
		return ({sx: newSy, sy: newSy});
	}
	
	// rotate(<rotate-angle>  [<cx> <cy>]), by default relative to elem center
	this.rotate = function(elem, a, cx, cy) {
		this._initTransforms(elem);
		
		var bb = elem.getBBox();
		if (bb) {
			elem.pottis.cx = bb.x + (cx!=undefined ? cx : (bb.width / 2));
			elem.pottis.cy = bb.y + (cy!=undefined ? cy : (bb.height / 2));
		}

		elem.pottis.a = a;

		this._applyTransforms(elem);
	}
	
	this.rotateAdd = function(elem, a, cx, cy) {
		this._initTransforms(elem);
		
		var newAngle = elem.pottis.a + a;
		this.rotate(elem, newAngle, cx, cy);
		return (newAngle);
	}
	
	this._applyTransforms = function(elem) {
		elem.setAttribute('transform',
			'translate(' + elem.pottis.tx + ',' + elem.pottis.ty + ')' +
			'translate(' + elem.pottis.stx + ',' + elem.pottis.sty + ')' +
			'scale(' + elem.pottis.sx + ',' + elem.pottis.sy + ')' +
			'translate(' + -elem.pottis.stx + ',' + -elem.pottis.sty + ')' +
			'rotate(' + elem.pottis.a + ',' + elem.pottis.cx + ',' + elem.pottis.cy + ')'
		);
	}
	
	
	this.text = function(textContent, textId, x, y) {
		var text = pottis.shape("text", { x: x, y: y });
		text.textContent = textContent;
	}

	// pottis.image(url, imageId, [x], [y])
	this.image = function(url, imageId, x, y) {
		var htmlimg = new Image();
		htmlimg.src = url;
      
		// var svgimg = document.createElementNS(this.svgNS, "image");
		var svgimg = this.shape("image", { id: imageId });
		svgimg.setAttributeNS(this.xlinkNS, 'xlink:href', url);
		svgimg.setAttribute('x', x ? x : 0);
		svgimg.setAttribute('y', y ? y : 0);

		// width and height are only available after the image is loaded :/
		htmlimg.onload = function() {
			svgimg.setAttribute('width', htmlimg.width);
			svgimg.setAttribute('height', htmlimg.height);
		}

		return svgimg;
	}



	this.cuntface = null;


	this.readFontSVG = function(svgfile, groupid)
	{	
//    	var doc = this.StringtoXML(svgfile);
  //      for(i=0; i < doc.documentElement.childNodes.length; i++){
    //        var node = doc.documentElement.childNodes[i].cloneNode(true);
      //      _pottis.targetSVG.appendChild(node);
        //}
        this.cuntface = svgfile;
	}
	
	
	
	
	
    this.testRead2 = function(svgfile, groupid, other) {
		//<object id="longcatbasket" type="image/svg+xml" data="longcatbasket_defs.svg" width="900" height="600">

		var obj = document.createElement("object");
		obj.setAttribute("id", svgfile);
		obj.setAttribute("type", "image/svg+xml");
		obj.setAttribute("data", svgfile);
		
		// TODO: can we do this even more discreetly?
		// TODO: actually, we can't set display to none, as the deep clone copies that, too (in Safari)
		//obj.style.display = "none";
		document.body.appendChild(obj);
		
		// make sure we have a defs element in the svg
		var defs = _pottis.targetSVG.getElementsByTagName("defs");
		if (defs.length == 0) {
			defs = this.targetDocument.createElementNS(_pottis.svgNS, "defs");
			this.targetSVG.insertBefore(defs, this.targetSVG.firstChild);
		} else defs = defs[0];
		
		// TODO: maybe an option to add straigh to svg body instead of defs?
		var group = this.group(groupid, [ ]);
		defs.appendChild(group);
		    	var doc = this.StringtoXML(other);
		obj.onload = function() {
		

        for(i=0; i < doc.documentElement.childNodes.length; i++){
            var node = doc.documentElement.childNodes[i].cloneNode(true);
            _pottis.targetSVG.appendChild(node);
        }
		
		
		


			// the object is not needed anymore ^____^
			// TODO: how to make the page load finish? it does finish, if we don't remove the obj element
			//obj.contentDocument.removeChild(obj.contentDocument.documentElement);
			obj.parentNode.removeChild(obj);
		}
		
		return group;
	}
	
	
	
	
	
	
	
	
    this.StringtoXML = function(text)
    {
        if (window.ActiveXObject){
          var doc=new ActiveXObject('Microsoft.XMLDOM');
          doc.async='false';
          doc.loadXML(text);
        } else {
          var parser=new DOMParser();
          var doc=parser.parseFromString(text,'text/xml');
        }
        return doc;
    }


	this.importSVG = function(svgfile, groupid) {
		//<object id="longcatbasket" type="image/svg+xml" data="longcatbasket_defs.svg" width="900" height="600">

		var obj = document.createElement("object");
		obj.setAttribute("id", svgfile);
		obj.setAttribute("type", "image/svg+xml");
		obj.setAttribute("data", svgfile);
		
		// TODO: can we do this even more discreetly?
		// TODO: actually, we can't set display to none, as the deep clone copies that, too (in Safari)
		//obj.style.display = "none";
		document.body.appendChild(obj);
		
		// make sure we have a defs element in the svg
		var defs = _pottis.targetSVG.getElementsByTagName("defs");
		if (defs.length == 0) {
			defs = this.targetDocument.createElementNS(_pottis.svgNS, "defs");
			this.targetSVG.insertBefore(defs, this.targetSVG.firstChild);
		} else defs = defs[0];
		
		// TODO: maybe an option to add straigh to svg body instead of defs?
		var group = this.group(groupid, [ ]);
		defs.appendChild(group);

		obj.onload = function() {
			var svgobj = obj.contentDocument.documentElement;
//alert(svgobj.childNodes);
			for (i = 0; i < svgobj.childNodes.length; i++) {
				var node = svgobj.childNodes[i].cloneNode(true);
				group.appendChild(node);
			}

			// the object is not needed anymore ^____^
			// TODO: how to make the page load finish? it does finish, if we don't remove the obj element
			//obj.contentDocument.removeChild(obj.contentDocument.documentElement);
			obj.parentNode.removeChild(obj);
		}
		
		return group;
	}

	// hopefully return the mouse coordinates inside parent element
	this.getMouseCoords = function(e, parent) {
		var x, y;

		if (document.getBoxObjectFor) {
			// sorry for the deprecated use here, but see below
			var boxy = document.getBoxObjectFor(parent);
			x = e.pageX - boxy.x;
			y = e.pageY - boxy.y;
		} else if (parent.getBoundingClientRect) {
			// NOTE: buggy for FF 3.5: https://bugzilla.mozilla.org/show_bug.cgi?id=479058
			/* I have also noticed that the returned coordinates may change unpredictably
			after the DOM is modified by adding some children to the SVG element */
			var lefttop = parent.getBoundingClientRect();
			//console.log(parent.id + " " + lefttop.left + " " + lefttop.top);
			x = e.clientX - Math.floor(lefttop.left);
			y = e.clientY - Math.floor(lefttop.top);
		} else {
			x = e.pageX - (parent.offsetLeft || 0);
			y = e.pageY - (parent.offsetTop || 0);
		}
		
		return { x: x, y: y };
	}
	
	// with this you can debug the above mouse coordinates :)
	this._mouseCoordsHelper = function(mouse) {
		if (!this.mouseText) {
			this.mouseText = _pottis.shape("text");
			this.mouseText.setAttribute('pointer-events', 'none');
		} else this.moveToFront(this.mouseText);

		this.mouseText.setAttribute("x", mouse.x);
		this.mouseText.setAttribute("y", mouse.y);
		this.mouseText.textContent = "(" + mouse.x + "," + mouse.y + ")";
	}
	
	this.randomInt = function(max) {
		return Math.floor(Math.random() * max);
	}
	
/*
	// TODO: huh huh!
	addGeneratorBehaviour: function(elem, defsid, callback) {
		elem.onclick = function(e) {
			var use = document.createElementNS(svgNS, "use");

			// use.setAttribute('id', 'cat_' + idCounter++);
			use.setAttributeNS(xlinkNS, 'xlink:href', '#' + defsid);

			use.setAttribute('x', elem.translateX ? elem.translateX : 0);
			use.setAttribute('y', elem.translateY ? elem.translateY : 0);

			document.documentElement.appendChild(use);
	
			callback(use);
		}
	},
*/			

}