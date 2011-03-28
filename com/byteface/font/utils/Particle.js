Particle = Class.extend({		// needed		x:0,		y:0,		width:0,		height:0,		rotation:0, // radians				vx:0,        vy:0,		damp:.9,		bounce:-.5,		grav:0,		maxSpeed:null,		wander:0,						__k:.2,				__bounds:null,		__draggable:false,		__edgeBehavior:"bounce",		__drag:false,		__oldx:null,		__oldy:null,		__turnToPath:false,		__springToMouse:false,				__mouseK:.2,		gravToMouse:true,		gravMouseForce:5000,		__repelMouse:false,		__repelMouseMinDist:100,		__repelMouseK:.2,		__springPoints:[],		gravPoints:[],		__repelPoints:[],		__springClips:[],		gravClips:[],		__repelClips:[],		        init: function(  )		{			this.__bounds = {};						this.setBounds( {xMin:0, yMin:0, yMax: 600, xMax: 600} );						this.maxSpeed = Number.MAX_VALUE;			this.__springPoints = [];			this.gravPoints = [];			this.__repelPoints = [];			this.__springClips = [];			this.gravClips = [];			this.__repelClips = [];		}		, setBounds: function( oBounds )		{			this.__bounds.top = oBounds.yMin;			this.__bounds.bottom = oBounds.yMax;			this.__bounds.left = oBounds.xMin;			this.__bounds.right = oBounds.xMax;		}						// bounce, wrap or remove		, setEdgeBehavior: function(sEdgeBehavior)		{			this.__edgeBehavior = sEdgeBehavior;		}				, getEdgeBehavior: function()		{			return this.__edgeBehavior;		}						/*				, draggable: function(  bDrag )		{			this.__draggable = true;			if ( bDrag )			{				this.addEventListener( MouseEvent.MOUSE_DOWN, pressHandler );				this.addEventListener( MouseEvent.MOUSE_UP, releaseHandler );				stage.addEventListener( MouseEvent.MOUSE_UP, outsideHandler) ; // releaseOutside handler hack							} else			{				this.removeEventListener( MouseEvent.MOUSE_DOWN, pressHandler );				this.removeEventListener( MouseEvent.MOUSE_UP, releaseHandler );				stage.removeEventListener( MouseEvent.MOUSE_UP, outsideHandler );				this.__drag = false;			}		}		        , pressHandler: function( )		{			this.startDrag();			this.__drag = true;		}				, releaseHandler: function( )		{			this.stopDrag();			this.__drag = false;		}				, outsideHandler: function( )		{			this.stopDrag();			this.__drag = false;		}				*/				, draggable: function( )		{			return this.__draggable;		}				, turnToPath: function( bTurn )		{			this.__turn = bTurn;		}		, update: function( )		{					var dx;			var dy;			var distSQ;			var dist;			var force;			var tx;			var ty;			var point;			var clip;			var k;			var minDist;						if ( this.__drag ) // TODO - this should be on			{							//	window.console.log("HEY-----!")				this.vx = this.x - this.__oldx;				this.vy = this.y - this.__oldy;				this.__oldx = this.x;				this.__oldy = this.y;							} else			{				if ( this.__springToMouse )				{					this.vx += ( stage.mouseX - this.x ) * this.__mouseK;					this.vy += ( stage.mouseY - this.y ) * this.__mouseK; 				}				//				window.console.log( this.gravToMouse )				/*				if ( this.gravToMouse )				{									window.console.log( "hey" )										dx = stage.mouseX - this.x;					dy = stage.mouseY - this.y;										distSQ = dx * dx + dy * dy;					dist = Math.sqrt( distSQ );					force = this.gravMouseForce / distSQ;					this.vx += force * dx / dist;					this.vy += force * dy / dist;				}				*/				if ( this.__repelMouse )				{					dx = stage.mouseX - this.x;					dy = stage.mouseY - this.y;										dist = Math.sqrt(dx * dx + dy * dy);					if (dist < this.__repelMouseMinDist)					{							tx = stage.mouseX - this.__repelMouseMinDist * dx / dist;						ty = stage.mouseY - this.__repelMouseMinDist * dy / dist;						this.vx += (tx - this.x) * this.__repelMouseK;						this.vy += (ty - this.y) * this.__repelMouseK;					}				}								for ( var sp=0; sp < this.__springPoints.length; sp++ )				{					point = this.__springPoints[sp];					this.vx += (point.x - this.x) * point.k;					this.vy += (point.y - this.y) * point.k;				}								for ( var gp = 0; gp < this.gravPoints.length; gp++ )				{					point = this.gravPoints[gp];								dx = point.x - this.x;					dy = point.y - this.y;										distSQ = dx * dx + dy * dy;					dist = Math.sqrt( distSQ );										force = point.force / distSQ;					this.vx += force * dx / dist;					this.vy += force * dy / dist;				}								for ( var rp = 0; rp < this.__repelPoints.length; rp++ )				{					point = this.__repelPoints[rp];					dx = point.x - this.x;					dy = point.y - this.y;										dist = Math.sqrt( dx * dx + dy * dy );					if (dist < point.minDist)					{						tx = point.x - point.minDist * dx / dist;						ty = point.y - point.minDist * dy / dist;												this.vx += (tx - this.x) * point.k;						this.vy += (ty - this.y) * point.k;					}				}								for ( var sc = 0; sc < this.__springClips.length; sc++ )				{					clip = this.__springClips[sc].clip;					k = this.__springClips[sc].k;					this.vx += (clip.x - this.x) * k;					this.vy += (clip.y - this.y) * k;									}								for ( var gc = 0; gc < this.gravClips.length; gc++ )				{					clip = this.gravClips[gc].clip;					dx = clip.x - this.x;					dy = clip.y - this.y;										distSQ = dx * dx + dy * dy;					dist = Math.sqrt( distSQ );					force = this.gravClips[gc].force / distSQ;					this.vx += force * dx / dist;					this.vy += force * dy / dist;				}								for ( var rc= 0; rc < this.__repelClips.length; rc++ )				{					clip = this.__repelClips[rc].clip;										minDist = this.__repelClips[rc].minDist;					k = this.__repelClips[rc].k;					dx = clip.x - this.x;					dy = clip.y - this.y;										dist = Math.sqrt(dx * dx + dy * dy);					if (dist < minDist)					{						tx = clip.x - minDist * dx / dist;						ty = clip.y - minDist * dy / dist;						this.vx += (tx - this.x) * k;						this.vy += (ty - this.y) * k;											}				}								this.vx += Math.random() * this.wander - this.wander / 2;				this.vy += Math.random() * this.wander - this.wander / 2;				this.vy += this.grav;				this.vx *= this.damp;				this.vy *= this.damp;								var speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);				if (speed > this.maxSpeed) {					this.vx = this.maxSpeed * this.vx / speed;					this.vy = this.maxSpeed * this.vy / speed;				}							if(this.__turn)				{					this.rotation = Math.atan2(this.vy, this.vx);// * 180 / Math.PI;				}								this.x += this.vx;				this.y += this.vy;								if(this.__edgeBehavior == "wrap")				{					if ( this.x > this.__bounds.right + this.width/2 )					{						this.x = this.__bounds.left - this.width/2;					} else if ( this.x < this.__bounds.left - this.width/2)					{						this.x = this.__bounds.right + this.width/2;					}					if( this.y > this.__bounds.bottom + this.height/2)					{						this.y = this.__bounds.top - this.height/2;					} else if (this.y < this.__bounds.top - this.height/2)					{						this.y = this.__bounds.bottom + this.height/2;					}									} else if(this.__edgeBehavior == "bounce")				{										if ( this.x > this.__bounds.right - this.width/2)					{											this.x = this.__bounds.right - this.width/2;						this.vx *= this.bounce;					} else if (this.x < this.__bounds.left + this.width/2){						this.x = this.__bounds.left + this.width/2;						this.vx *= this.bounce					}									if( this.y > this.__bounds.bottom - this.height/2){															this.y = this.__bounds.bottom - this.height/2;						this.vy *= this.bounce					} else if ( this.y < this.__bounds.top + this.height/2){						this.y = this.__bounds.top + this.height/2;						this.vy *= this.bounce;					}									} else if(this.__edgeBehavior == "remove")				{					// TODO - remove the particle															if( this.x > this.__bounds.right + this.width/2 || this.x < this.__bounds.left - this.width/2 ||					   this.y > this.__bounds.bottom + this.height/2 || this.y < this.__bounds.top - this.height/2){						removeChild( this );					}				}			}		}				, gravToMouse: function( bGrav, force  )		{			if (bGrav) {				if (!force) {					var force = 1000;				}				this.gravMouseForce = force;				this.gravToMouse = true;			}			else {				this.gravToMouse = false;			}		}				, springToMouse: function( bSpring, force  )		{			if (bSpring)			{				if (!force) {					var force = .1;				}				this.__mouseK = force;				this.__springToMouse = true;							} else			{				this.__springToMouse = false;			}		}		        , repelMouse: function( bRepel, force , minDist  )		{			if (bRepel)			{				if (!force)				{					var force = .1;				}				if (!minDist)				{					var minDist = 100;				}				this.__repelMouseK = force;				this.__repelMouseMinDist = minDist;				this.__repelMouse = true;							} else			{				this.__repelMouse = false;			}		}				, addSpringPoint: function( x , y , force ) 		{			if (!force)			{				var force = .1;			}			this.__springPoints.push( {x:x, y:y, k:force} );			return this.__springPoints.length - 1;		}				, addGravPoint: function( x , y , force ) 		{			if (!force)			{				var force = 1000;			}			this.gravPoints.push( {x:x, y:y, force:force} );			return this.gravPoints.length - 1;		}				, addRepelPoint: function(  x , y , force , minDist  ) 		{			if (!force) {				var force = .1;			}			if (!minDist) {				var minDist = 100;			}			this.__repelPoints.push({x:x, y:y, k:force, minDist:minDist});			return this.__repelPoints.length - 1;		}				, addSpringClip: function( clip, force )		{			if (!force)			{				var force = .1;			}			this.__springClips.push( {clip:clip, k:force} );			return this.__springClips.length - 1;		}				, addGravClip: function( clip, force ) 		{			if (!force)			{				var force = 1000;			}			this.gravClips.push({clip:clip, force:force});			return this.gravClips.length - 1;		}				, addRepelClip: function( clip, force , minDist  ) 		{			if ( !force )			{				var force = .1;			}			if ( !minDist )			{				var minDist = 100;			}			this.__repelClips.push( {clip:clip, k:force, minDist:minDist} );			return this.__repelClips.length - 1;		}				, removeSpringPoint: function( index  )		{			this.__springPoints.splice(index, 1);		}				, removeGravPoint: function( index  )		{			this.gravPoints.splice(index, 1);		}				, removeRepelPoint: function( index  ) {			this.__repelPoints.splice(index, 1);		}				, removeSpringClip: function( index )		{			this.__springClips.splice(index, 1);		}				, removeGravClip: function( index )		{			this.gravClips.splice(index, 1);		}		        , removeRepelClip: function( index )		{			this.__repelClips.splice(index, 1);		}				, clearSpringPoints: function( )		{			this.__springPoints = [];		}				, clearGravPoints: function( )		{			this.gravPoints = [];		}				, clearRepelPoints: function( )		{			this.__repelPoints = [];		}				, clearSpringClips: function( )		{			this.__springClips = [];		}				, clearGravClips: function( )		{			this.gravClips = [];		}				, clearRepelClips: function( )		{			this.__repelClips = [];		}		});