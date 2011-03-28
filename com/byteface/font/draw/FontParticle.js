FontParticle = Class.extend({
		
	LINE_WIDTH:100,
	STROKE_STYLE:"#000000",
	FILL_STYLE:"#000000",
	GLOBAL_ALPHA:1,
	
	SCALE:.5,
    width:0,
    height:0,



    points:[],

	physicalPoints:[],

    i:null,
    canvas:null,
    context:null,

    bounce:-1,




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
	
	canvas = document.getElementById('canvas');
	//context = canvas.getContext('2d');
  //      width = canvas.width;
    //    height = canvas.height;
	
	
	
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

, drawGlyph: function (  char, canvas, distance )
{
        var SCALE = this.SCALE;//Math.random()*.5;
        var g = this.fontdata.getGlyph(char);
		var _distance = distance;
        var drawingCanvas = document.getElementById(canvas);			

		// set up the glyph
		var context = drawingCanvas.getContext('2d');	
    	drawingCanvas.width = drawingCanvas.width;
		
		width = drawingCanvas.width;
        height = drawingCanvas.height;
		
		
		
		
		context.lineWidth = this.LINE_WIDTH;
		context.strokeStyle = this.STROKE_STYLE;
        context.fillStyle = this.FILL_STYLE;
        context.beginPath();

        var firstindex=0;
        var counter=0;
        
		for(var i=0;i<g.getPointCount();i++)
		{
            counter++;			
            if( g.getPoint(i).endOfContour )
            {
                this.addContourToShape( context, g, firstindex, counter, SCALE );
                firstindex=i+1;
                counter=0;
            }
            else
            {
                //window.console.log("normal point");
            }   
        }
        context.closePath();
        context.stroke();
        context.fill();

        context.translate(_distance, 5);


        var self = this;  
        this.interval = setInterval( function(){ self.animate(); }, 1000/24 );

			
		// also pass it out so we can play with it further
		return context;
    }   
    
    
,addContourToShape: function ( shape, glyph, startIndex, count, scale )
{
    
        if (glyph.getPoint(startIndex).endOfContour)
        {
            return;
        }
 
        offset = 0;
        
        while(offset < count)
        {
            var p0 = glyph.getPoint(startIndex + offset%count);
            var p1 = glyph.getPoint(startIndex + (offset+1)%count);

			this.addParticle(p0,scale,shape);
			this.addParticle(p1,scale,shape);

            if (offset == 0)
            {
                shape.moveTo(p0.x*scale, p0.y*scale);
            }

            if (p0.onCurve)
            {
                if (p1.onCurve)
                {
                    shape.lineTo(p1.x*scale, p1.y*scale);
                    offset++;
                }
                else
                {
                    var p2 = glyph.getPoint(startIndex + (offset+2)%count);
                    
					this.addParticle(p2,scale,shape);

                    if(p2.onCurve)
                    {
                        shape.quadraticCurveTo(p1.x*scale, p1.y*scale, p2.x*scale, p2.y*scale);
                    }
                    else
                    {
                        shape.quadraticCurveTo(p1.x*scale, p1.y*scale, this.midValue(p1.x*scale, p2.x*scale), this.midValue(p1.y*scale, p2.y*scale));
                    }
                    
                    offset+=2;
                } 
            }
            else
            {
            
            if(!p1.onCurve)
            {
                shape.quadraticCurveTo(p0.x*scale, p0.y*scale, this.midValue(p0.x*scale, p1.x*scale), this.midValue(p0.y*scale, p1.y*scale));
            }
            else
            {
                shape.quadraticCurveTo(p0.x*scale, p0.y*scale, p1.x*scale, p1.y*scale);
            }
            
            offset++;
            
            }
        }
    }




, addParticle: function( point,scale,canvas )
{
	var p = new Particle();
		p.bounce = -1;
		p.grav = -1;
		// p.maxSpeed = 20;
	//	p.addGravPoint( 100, 500, 2000 );
	//	p.addRepelPoint( 300, 300, 900 );
				p.wander = 1;
		p.setEdgeBehavior("bounce");
		// 		p.turnToPath( true );
			//	p.setGravToMouse(canvas, true, 30000 );
		
		
		p.x = point.x*scale;
        p.y = point.y*scale;

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
    
    , draw: function() {

       // context.clearRect(0, 0, width, height);

        var i, point;
        for(i = 0; i < this.physicalPoints.length; i++ ) {
            
			// set the points on the class
			point = this.physicalPoints[i];
			point.width = point.height = 2;// tell it size dims
			
			context.save();
			context.translate(point.x,point.y);
			context.rotate( point.rotation );
			
			
			context.beginPath();
			context.strokeStyle = this.rndColor();
            context.arc(0, 0, .1, 0, Math.PI*2, false);

			context.stroke();

			context.restore();
        }
    }

	, rndColor: function() {
	    return '#' + ('00000' + (Math.random() * 16777216 << 0).toString(16)).substr(-6);
	}











});