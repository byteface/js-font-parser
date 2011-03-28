Renderer = Class.extend({

    points:[],
    numPoints:100,
    i:null,
    canvas:null,
    context:null,
    width:null,
    height:null,
    bounce:-1,
    
    init: function()
    {
        canvas = document.getElementById('canvas');
        context = canvas.getContext('2d');
        width = canvas.width;
        height = canvas.height;
        
        for(i = 0; i < this.numPoints; i += 1) {
			
			var p = new Particle();
			p.bounce = -1;
		//	p.grav = 1;
			p.maxSpeed = 20;
		//	p.addGravPoint( 100, 500, 2000 );
			p.addRepelPoint( 300, 300, 900 );
			p.wander = 10;
			p.setEdgeBehavior("bounce");
			p.turnToPath( true );
			
			p.x = Math.random() * width;
	        p.y = height/2;//Math.random() * height;
          //  p.vx = Math.random() * 10 - 5;
           // p.vy = Math.random() * 10 - 5;
	
            this.points.push( p );
        }
        
        var self = this;  
        this.interval = setInterval( function(){ self.animate(); }, 1000/24 );  
    }
 
    , animate: function() {
        this.update();
        this.draw();
    }
    
    , update: function() {
        var i, point;
        for(i = 0; i < this.numPoints; i += 1) {
            point = this.points[i];
			point.update();
        }
    }
    
    , draw: function() {

        context.clearRect(0, 0, width, height);

        var i, point;
        for(i = 0; i < this.numPoints; i += 1) {
            
			// set the points on the class
			point = this.points[i];
			point.width = point.height = 20;// tell it size dims
			
			context.save();
			context.translate(point.x,point.y);
			context.rotate( point.rotation );
			
			context.beginPath();
//			context.strokeStyle = //rndColor();
			context.lineTo( 10, 0);
            context.arc(0, 0, 4, 0, Math.PI*2, false);

			context.stroke();

			context.restore();
        }

		function rndColor() {
		    return '#' + ('00000' + (Math.random() * 16777216 << 0).toString(16)).substr(-6);
		}


    }

});