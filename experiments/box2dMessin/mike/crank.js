demos.crank = {};



demos.crank.initWorld = function(world) {

	// init canvas
	var drawingCanvas = document.getElementById('canvas');
	context = drawingCanvas.getContext('2d');
	
	// init font
	var font = new FontBox2d( "../../truetypefonts/DiscoMo.ttf" );
	font.setStyle( 1, "#000000", "#ffffff", .2 );

	font.showPoints = true;
	//font.redrawfills = true;


	setTimeout( function(){
	
	
	
	
	var pp = font.physicalPoints;

//	console.log(pp.length);
	
	var sd = new b2BoxDef();
	sd.extents.Set(10, 10);
	sd.density = 1.0;

	var bd = new b2BodyDef();
	bd.AddShape(sd);


		var prevBody

		for( var i=0; i<pp.length; i++ )
	{
		var point = pp[i];


		bd.position.Set(point.x, point.y);
		var body = world.CreateBody(bd);



if(i>1)
{
		var rjd = new b2RevoluteJointDef();
		rjd.anchorPoint.Set(pp[i-1].x, pp[i-1].y);
		rjd.body1 = prevBody;
		rjd.body2 = body;
	    world.CreateJoint(rjd);



/*
    var jointTest = new b2JointDef();
    jointTest.body1 = prevBody;
    jointTest.body2 = body;
    world.createJoint(jointTest);
*/



	
}

		prevBody = body;
	}
	
	
}, 2000 )

//console.log(font.physicalPoints)

// for( var i in font.physicalPoints)
// {
// 	console.log(font.physicalPoints)
// }
//	console.log(font.getPhysicalPoints())
	




	font.drawGlyph( Math.round(Math.random()*50), 'canvas' );
	
	
}
demos.InitWorlds.push(demos.crank.initWorld);
