demos.crank = {};
demos.crank.initWorld = function(world) {

	var ground = world.m_groundBody;

	// Define crank.
	var sd = new b2BoxDef();
	sd.extents.Set(10, 10);
	sd.density = 1.0;

	var bd = new b2BodyDef();
	bd.AddShape(sd);
	
	var rjd = new b2RevoluteJointDef();

	var prevBody = ground;

	bd.position.Set(500/2, 210);
	var body = world.CreateBody(bd);

	prevBody = body;

	// Define follower.
	sd.extents.Set(10, 10);
	bd.position.Set(500/2, 140);
	body = world.CreateBody(bd);

	rjd.anchorPoint.Set(500/2, 185);
	rjd.body1 = prevBody;
	rjd.body2 = body;
    world.CreateJoint(rjd);

	prevBody = body;
}
demos.InitWorlds.push(demos.crank.initWorld);
