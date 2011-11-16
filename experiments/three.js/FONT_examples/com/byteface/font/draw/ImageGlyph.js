ImageGlyph = Class.extend({
		
	LINE_WIDTH:1,
	STROKE_STYLE:"#000000",
	FILL_STYLE:"#000000",
	GLOBAL_ALPHA:1,
	
	SCALE:.5,

	fontdata: null,
	
	// fun props
	wobble: 0,

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

//, setShadow: function( lineWidth, strokeStyle, fillStyle, globalAlpha )
//{
	// context.shadowColor = "#f0f0f0";
	// context.shadowBlur= 50;
	// context.shadowOffsetX= 20;
	// context.shadowOffsetY= 20;
	
	 // context.shadowColor = "#f0f0f0";
	 // context.shadowBlur= 50;
	 // context.shadowOffsetX= 20;
	 // context.shadowOffsetY= 20;

//}

// when a character draws how badly they wobble
, setWobble: function( offset )
{
	this.wobble - offset;
}

, drawGlyph: function (  char, canvas )
{
        var SCALE = this.SCALE;//Math.random()*.5;
        var g = this.fontdata.getGlyph(char);

//		window.console.log( g );

        var drawingCanvas = document.getElementById(canvas);			

		// set up the glyph
		var context = drawingCanvas.getContext('2d');
		context.lineWidth = this.LINE_WIDTH;//2;//.5 + Math.random()*2;
		context.strokeStyle = this.STROKE_STYLE;//"#000000";//Math.floor(Math.random()*16777215).toString(16);//"#ff0000";
        context.fillStyle = this.FILL_STYLE;//"#ffffff";//Math.floor(Math.random()*16777215).toString(16);
        context.globalAlpha = this.GLOBAL_ALPHA;//1;//.5;
        context.beginPath();

//			window.console.log(char);
//			context.translate( 2,5);
//          	context.translate(Math.random()*(i*10,Math.random()*(i*10));
// /            context.rotate(20 * Math.PI / 180);
//context.rotate(1)
     //   context.scale(1,-1);

        var firstindex=0;
        var counter=0;
        
		for(var i=0;i<g.getPointCount();i++)
		{
            counter++;			
            if( g.getPoint(i).endOfContour )
            {
               this.addContourToShape( context, g, firstindex, counter, SCALE );
				this.addGraphicsToPoints( context, g, firstindex, counter, SCALE );
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
			
		// also pass it out so we can play with it further
		return context;
    }





	,addGraphicsToPoints: function ( shape, glyph, startIndex, count, scale )
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

	            if (offset == 0)
	            {
	                //window.console.log("move");
	                shape.moveTo(p0.x*scale, p0.y*scale);
	            }

	            if (p0.onCurve)
	            {
	                if (p1.onCurve)
	                {
	                    shape.lineTo(p1.x*scale, p1.y*scale);
	                    offset++;
	
					this.addImage( shape, p1.x*scale, p1.y*scale );
	
	                }
	                else
	                {
	                    var p2 = glyph.getPoint(startIndex + (offset+2)%count);

	                    if(p2.onCurve)
	                    {
	                        shape.quadraticCurveTo(p1.x*scale, p1.y*scale, p2.x*scale, p2.y*scale);
	
					this.addImage( shape, p1.x*scale, p1.y*scale );
	
	                    }
	                    else
	                    {
	                        shape.quadraticCurveTo(p1.x*scale, p1.y*scale, this.midValue(p1.x*scale, p2.x*scale), this.midValue(p1.y*scale, p2.y*scale));
	
	
					this.addImage( shape, p1.x*scale, p1.y*scale );
	
	                    }

	                    offset+=2;
	                } 
	            }
	            else
	            {

	            if(!p1.onCurve)
	            {
	                shape.quadraticCurveTo(p0.x*scale, p0.y*scale, this.midValue(p0.x*scale, p1.x*scale), this.midValue(p0.y*scale, p1.y*scale));

				//	window.console.log("point?");
				//	shape.fillRect( p0.x*scale, p0.y*scale, 10, 10 );
					
					
				this.addImage( shape, p1.x*scale, p1.y*scale );
					
					
	            }
	            else
	            {		
	                shape.quadraticCurveTo(p0.x*scale, p0.y*scale, p1.x*scale, p1.y*scale);
	
				//	window.console.log("point?");
				//	shape.fillRect( p0.x*scale, p0.y*scale, 10, 10 );
				
								this.addImage( shape, p1.x*scale, p1.y*scale );
				
	            }

	            offset++;

	            }
	        }
	    }






, addImage: function( shape, x, y )
{
	var myImage = new Image();
	myImage.onload = function() {
		shape.drawImage(myImage, x, y, 15, 15 );
	}
	myImage.src = "leaf.png";	
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
            
            if (offset == 0)
            {
                //window.console.log("move");
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



});