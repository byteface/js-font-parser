export class Panose {
    bFamilyType: number = 0;
    bSerifStyle: number = 0;
    bWeight: number = 0;
    bProportion: number = 0;
    bContrast: number = 0;
    bStrokeVariation: number = 0;
    bArmStyle: number = 0;
    bLetterform: number = 0;
    bMidline: number = 0;
    bXHeight: number = 0;

    constructor(panose: number[]) {
        this.bFamilyType = panose[0];
        this.bSerifStyle = panose[1];
        this.bWeight = panose[2];
        this.bProportion = panose[3];
        this.bContrast = panose[4];
        this.bStrokeVariation = panose[5];
        this.bArmStyle = panose[6];
        this.bLetterform = panose[7];
        this.bMidline = panose[8];
        this.bXHeight = panose[9];

        // Optional: Uncomment to log values
        // console.log("Panose::", this.toString());
    }

    toString(): string {
        return `${this.bFamilyType} ${this.bSerifStyle} ${this.bWeight} ${this.bProportion} ${this.bContrast} ${this.bStrokeVariation} ${this.bArmStyle} ${this.bLetterform} ${this.bMidline} ${this.bXHeight}`;
    }
}


/*


Panose = Class.extend({
    
    bFamilyType:0
	, bSerifStyle:0
	, bWeight:0
	, bProportion:0
	, bContrast:0
	, bStrokeVariation:0
	, bArmStyle:0
	, bLetterform:0
	, bMidline:0
	, bXHeight:0

, init: function Panose(panose)
{
    this.bFamilyType = panose[0];
    this.bSerifStyle = panose[1];
    this.bWeight = panose[2];
    this.bProportion = panose[3];
    this.bContrast = panose[4];
    this.bStrokeVariation = panose[5];
    this.bArmStyle = panose[6];
    this.bLetterform = panose[7];
    this.bMidline = panose[8];
    this.bXHeight = panose[9];
   
    //alert( this.bFamilyType +"||"+ this.bSerifStyle +"||"+ this.bWeight +"||"+ this.bProportion +"||"+ this.bContrast +"||"+ this.bStrokeVariation +"||"+ this.bArmStyle +"||"+ this.bLetterform +"||"+ this.bMidline +"||"+ this.bXHeight );
}

// toString this one
, toString: function(){
    var sb = "";
    sb += this.bFamilyType + " ";
    sb += this.bSerifStyle + " ";
    sb += this.bWeight + " ";
    sb += this.bProportion + " ";
    sb += this.bContrast + " ";
    sb += this.bStrokeVariation + " ";
    sb += this.bArmStyle + " ";
    sb += this.bLetterform + " ";
    sb += this.bMidline + " ";
    sb += this.bXHeight + " ";
    return sb;
}

});
*/