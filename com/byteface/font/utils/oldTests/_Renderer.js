Renderer = Class.extend({

    points:[],
    numPoints:2000,
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
			p.grav = 2;
			p.maxSpeed = 8;
		//	p.addGravPoint( 100, 500, 2000 );
			p.addRepelPoint( 300, 600, 100 );
			p.wander = 20;
//						p.setEdgeBehavior("wrap");
			
			
			p.x = width/2;//Math.random() * width;
	        p.y = height/2;//Math.random() * height;
           // p.vx = Math.random() * 1000 - (Math.random() * 1000);
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
            point = this.points[i];

			point.width = point.height = 5;

            context.beginPath();
            context.arc(point.x, point.y, 4, 0, Math.PI * 2, false);
            context.stroke();
        }
    }

});