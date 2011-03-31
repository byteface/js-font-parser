FontParticle = Class.extend({
		
	LINE_WIDTH:100,
	STROKE_STYLE:"#000000",
	FILL_STYLE:"#000000",
	GLOBAL_ALPHA:1,
	SCALE:1,
	
	_currentGlyph:null,
	
    width:0,
    height:0,

    points:[],
	physicalPoints:[],
	physicalPointsIndex:0,

    i:null,
    canvas:null,
    context:null,
	fontdata: null,
	
	
// TODO - create a class for global functions like this one
inc: function(filename){
    var body = document.getElementsByTagName('body').item(0);
    script = document.createElement('script');
    script.src = filename;
    script.type = 'text/javascript';
    body.appendChild(script);
}

, init: function(path)
{
	var file = this.load_binary_resource(path);
	var bytedata = new a3d.ByteArray( file, a3d.Endian.BIG );
	this.fontdata = new RawFont( bytedata );
	
	// set a default particle
	this._particle = new Particle();
	this._particle.bounce = -1;
	this._particle.maxSpeed = 20;
	this._particle.damp = .6;
	this._particle.wander = 3;
	this._particle.setEdgeBehavior("bounce");
}

// setup styling for the char
, setProps: function( scale )
{
	this.SCALE = scale;
}

// setup styling for the char
, setStyle: function( lineWidth, strokeStyle, fillStyle, globalAlpha )
{
	this.LINE_WIDTH = lineWidth;
	this.STROKE_STYLE = strokeStyle
	this.FILL_STYLE = fillStyle;
	this.GLOBAL_ALPHA = globalAlpha;
}

, drawGlyph: function (  char, pcanvas, distance ) // TODO - why distance?.. maybe remove
{
        var g = this.fontdata.getGlyph(char);
		var _distance = distance;
        
		_currentGlyph = g;


		this.canvas = document.getElementById(pcanvas);
		this.context = this.canvas.getContext('2d');
		this.width = this.canvas.width;
        this.height = this.canvas.height;
				
//		this.canvas.width = this.canvas.width; // reset

		this.context.lineWidth = this.LINE_WIDTH;
		this.context.strokeStyle = this.STROKE_STYLE;
        this.context.fillStyle = this.FILL_STYLE;
        this.context.beginPath();
        
//					this.rotation = Math.atan2(this.vy, this.vx);// * 180 / Math.PI;
//		this.context.rotate( (2)* 180/Math.PI);

        var firstindex=0;
        var counter=0;
        
		for(var i=0;i<g.getPointCount();i++)
		{
            counter++;			
            if( g.getPoint(i).endOfContour )
            {
                this.addContourToShape( g, firstindex, counter, true );
                firstindex=i+1;
                counter=0;
            }
            else
            {
                //window.console.log("normal point");
            }   
        }
        this.context.closePath();
        this.context.stroke();
        this.context.fill();
        // this.context.rotate(180);
        this.context.translate(_distance, 5);

        var self = this;  
        this.interval = setInterval( function(){ self.animate(); }, 1000/24 );
		
//		this.stopInterval();
		
		// also pass it out so we can play with it further
		return context;
    }   
    



,stopInterval: function()
{
	clearInterval( this.interval );
	
}


	
,addContourToShape: function ( glyph, startIndex, count, firstRun )
{

        if (glyph.getPoint(startIndex).endOfContour)
        {
            return;
        }
 
        offset = 0;
		physicalPointsIndex = 0;

        while(offset < count)
        {
            var p0 = glyph.getPoint(startIndex + offset%count);
            var p1 = glyph.getPoint(startIndex + (offset+1)%count);



			
			if(firstRun)
			{
				this.addParticle(p0,this.context);
				this.addParticle(p1,this.context);				
			}
			else
			{
				var particle0 = this.getParticle();
				var				particle1 = this.getParticle();
				
				p0.x = particle0.x;// *2; // used to scale up again after
				p0.y = particle0.y;// *2;				
				
				p1.x = particle1.x;// *2;
				p1.y = particle1.y;// *2;				
			}
			
			
			

            if (offset == 0)
            {
                this.context.moveTo(p0.x, p0.y);
            }

            if (p0.onCurve)
            {					
                if (p1.onCurve)
                {
                    this.context.lineTo(p1.x, p1.y);
                    offset++;
                }
                else
                {
                    		var p2 = glyph.getPoint(startIndex + (offset+2)%count);
                    
							if(firstRun)
							{
								this.addParticle(p2,this.context);
							}
							else
							{
								var	particle2 = this.getParticle();
								p2.x = particle2.x;// *2;
								p2.y = particle2.y;// *2;
							}
								
				

                    if(p2.onCurve)
                    {
                        this.context.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y);
                    }
                    else
                    {
                        this.context.quadraticCurveTo(p1.x, p1.y, this.midValue(p1.x, p2.x), this.midValue(p1.y, p2.y));
                    }
                    
                    offset+=2;
                } 
            }
            else
            {
            
            if(!p1.onCurve)
            {
                this.context.quadraticCurveTo(p0.x, p0.y, this.midValue(p0.x, p1.x), this.midValue(p0.y, p1.y));
            }
            else
            {
                this.context.quadraticCurveTo(p0.x, p0.y, p1.x, p1.y);
            }
            
            offset++;
            
            }
        }


		physicalPointsIndex=0;
    }



	,redrawLines: function ()
	{
		this.context.lineWidth = this.LINE_WIDTH;
		this.context.strokeStyle = this.STROKE_STYLE;
        this.context.fillStyle = this.FILL_STYLE;
        this.context.beginPath();

        var firstindex=0;
        var counter=0;
        
		for(var i=0;i<_currentGlyph.getPointCount();i++)
		{
            counter++;			
            if( _currentGlyph.getPoint(i).endOfContour )
            {
                this.addContourToShape( _currentGlyph, firstindex, counter, false );
                firstindex=i+1;
                counter=0;
            }
            else
            {
                //window.console.log("normal point");
            }   
        }
        this.context.closePath();
        this.context.stroke();
        this.context.fill();
	    }




// used by above to get sotred physical points.. TODO - change name of this
, getParticle: function()
{
	physicalPointsIndex++;
	return this.physicalPoints[physicalPointsIndex-1];
}

// used by above to get sotred physical points.. TODO - change name of this
// , setParticlePhysicalProperties: function()
// {
// 
// }






// set the types of particle you are going to create from outside the class by creating particles and setting up their properties
    ,_particle:{}
, setParticles: function( particle )
{
	this._particle = particle;
}

, addParticle: function( point )
{	
	var p = this.clone(this._particle);	
	p.x = point.x;
	p.y = point.y;
	this.physicalPoints.push( p );
}

, midValue: function(a,b)
{
    return (a+b)/2
}

// load the binary data of the font
, load_binary_resource: function(url)
{
    var req = new XMLHttpRequest();
    req.open( 'GET', url, false );
    req.overrideMimeType( 'text/plain; charset=x-user-defined' );
    req.send(null);

   // alert( "text status:" + req.status);
   // if(req.status != 200) return '';            
   // alert( "text response:" + req.responseText);
    
    return req.responseText;
}

, clearCanvas: function (context, canvas)
{
	context.clearRect(0, 0, canvas.width, canvas.height);
}












    , animate: function() {
        this.update();
        this.draw();
    }
    
    , update: function() {
        var i, point;
        for(i = 0; i < this.physicalPoints.length; i++ ) {
            point = this.physicalPoints[i];
			point.update();
        }
    }





    ,showPoints:false
    ,redrawfills:true


    
    , draw: function() {

    if(this.redrawfills)
	{
       context.clearRect(0, 0, this.width, this.height);
	}

        var i, point;


			this.redrawLines();

        for(i = 0; i < this.physicalPoints.length; i++ ) {
            
			// set the points on the class
			point = this.physicalPoints[i];
			point.width = point.height = 8;// tell it size dims
			
			context.save();
			context.translate(point.x,point.y);
			context.rotate( point.rotation );
			
			context.beginPath();
//			context.strokeStyle = this.rndColor();
//			context.fillStyle = this.rndColor();			
	
			if(	this.showPoints)
			{
            	context.arc(0, 0, 8, 0, Math.PI*2, false);
			}

			context.stroke();

			context.restore();
			
        }

    }

	, rndColor: function() {
	    return '#' + ('00000' + (Math.random() * 16777216 << 0).toString(16)).substr(-6);
	}

	,clone:	function (obj)
	 { var clone = {};
	   clone.prototype = obj.prototype;
	   for (property in obj) clone[property] = obj[property];
	   return clone;
	 }



});