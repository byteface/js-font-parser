PrintStream = Class.extend({

    data:"",

    init: function(){}	
            
    , println: function()
    {
        alert("test");	
    }
            
    , print: function()
    {
        alert( this.data );
    }
    
    // add to the print stream
    , write: function( v )
    {
        this.data+=v;
    }
    
		
});