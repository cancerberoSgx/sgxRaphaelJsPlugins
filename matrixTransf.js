/** 
 * Matrix transformation raphaeljs plugin. Support both svg and vml. Skewx, skewy, rotate, and reflect based operations also available will give you a glue on how to use the matrix() function. 
 * Note that when used with other operations like 
 * 	aFigure.scale(...).rotate(...).matrix(...)
 * this plugin can have some unespected behaviour in IE. This is why thi s cannot be proposed as an integral part of raphaeljs library, yet.
 * Use it with caution. ;)
 * 
 * author: Sebastián Gurin - sgurin at montevideo com uy
 */

(function () {
	Raphael.Matrix=function(m11, m12, m21, m22, dx, dy) {
	    this.m = [
	        [m11, m12, 0],
	        [m21, m22, 0],
	        [dx , dy , 1]
	    ];
	};
	Raphael.MatrixMult=function(a00, a01, a10, a11, adx, ady, b00, b01, b10, b11, bdx, bdy) {
		return new Raphael.Matrix(				
			a00*b00+a01*b10, a00*b01+a01*b11, a10*b00+a11*b10, a10*b01+a11*b11, 
				adx+bdx, ady+bdy
				);
	};
	Raphael.MatrixMult2=function(A, B) {
		var r =  Raphael.MatrixMult(A.m[0][0], A.m[0][1], A.m[1][0], A.m[1][1], A.m[2][0], A.m[2][1], 
				B.m[0][0], B.m[0][1], B.m[1][0], B.m[1][1], B.m[2][0], B.m[2][1]); 
		return r;
	};
	/**
	public matrix method 
	*/
	Raphael.el.matrix=function(m11, m12, m21, m2) {
		this.matrix_(m11, m12, m21, m2, 0, 0);
		return this;
	};
	
    if (Raphael.vml) {
    	Raphael.Matrix.prototype.toString = function () {
            return "progid:DXImageTransform.Microsoft.Matrix(M11=" + this.m[0][0] +
	            ", M12=" + this.m[0][1] + ", M21=" + this.m[1][0] + ", M22=" + this.m[1][1] +
	            ", Dx=" + this.m[2][0] + ", Dy=" + this.m[2][1] + ", sizingmethod='auto expand', filtertype='bilinear')";            
        };
        Raphael.el.matrix_ = function (m11, m12, m21, m22, dx, dy) {
        	if(m11==null) {
        		this.Group.style.filter = "";
        	}
        	else {
        		var tMatrix = new Raphael.Matrix(m11, m12, m21, m22, dx, dy);
        		 if(!this.node.currentMatrix) 
                  	this.node.currentMatrix = tMatrix;                    
                  else 
                  	this.node.currentMatrix=Raphael.MatrixMult2(this.node.currentMatrix, tMatrix);         		
                this.Group.style.filter = this.node.currentMatrix.toString();
        	}            
            return this;
        };
    } else {    	
        /* *** SVG *** */
    	Raphael.Matrix.prototype.toString = function () {
        	var m = "matrix(" + this.m[0][0] +
                ", " + this.m[1][0] + ", " + this.m[0][1] + ", " + this.m[1][1] +
                ", " + this.m[2][0] + ", " + this.m[2][1] + ")";
            //alert(m);
            return m;
        };
        Raphael.el.matrix_ = function (m11, m12, m21, m22, dx, dy) {
        	if(m11==null) {
        		this.transformations[Raphael.el.matrix._TransfIdx]="";
        	} 
        	else {
            	/* fix. svg matrix and vml matrix behaves different. passing the same matrix, 
            	for example, 1,1,0,1 (with dx and dy = 0), in svg this translates the figure while in 
            	vml matrix with dx and dy=0 wont change figure position. We change svg behaviour and redefine dx,dy
            	so the final position of the transformed figure remains the same.*/
            	
				var box = this.getBBox(), x=box.x, y=box.y,
					old_dx = this.node.currentMatrix ? this.node.currentMatrix.m[2][0] : 0, 
					old_dy = this.node.currentMatrix ? this.node.currentMatrix.m[2][1] : 0;

					dx=(1-m11)*x - m12*y + old_dx;
					dy=(1-m22)*y - m21*x + old_dy;
					
        		var tMatrix = new Raphael.Matrix(m11, m12, m21, m22, dx, dy);
        		 if(!this.node.currentMatrix) 
                  	this.node.currentMatrix = tMatrix;                    
                  else 
                  	this.node.currentMatrix=Raphael.MatrixMult2(this.node.currentMatrix, tMatrix);    

                	
	        	this.transformations[Raphael.el.matrix._TransfIdx] = this.node.currentMatrix;	            
        	}
        	this.node.setAttribute("transform", this.transformations.join(" ")); 
	        return this;	        
        };
        Raphael.el.matrix._TransfIdx=8;
    };

    /* ** matrix transformation based operations ** */
    Raphael.el.skewX=function(f) {
    	this.matrix(	1.0, 	f,
						0.0, 	1.0);
    };
    Raphael.el.skewY=function(f) {
    	this.matrix(	1.0, 	0.0,
						f, 		1.0);
    };

    /**
     * reflects the element about a line that goes through the center of the image
     * and has an angle slope 
     *  
     * for reflecting, first we translate the element so its center equals the origin,
     * then apply reflection (so its position doesn't change) and then 
     * 
     * @param angle must be in angle (pi) not radians, valid values are PI/2, PI/3, etc
     * 
     * http://planetmath.org/encyclopedia/DerivationOf2DReflectionMatrix.html
     * */
    Raphael.el.reflect=function(angle) {
    	var m = Math.tan(angle), A = 1/(m*m+1); 
    	return this.matrix(
			(1-m*m)*A, 		2*m*A,
			2*m*A, 			(m*m-1)*A);
    };  
    /**
     * rotates the element theta degrees over the point (x,y)
     */
    Raphael.el.rotateOver=function(theta, x, y) {
    	var r00=Math.cos(theta), r01=Math.sin(theta), 
			r10=Math.sin(theta)*(-1), r11=Math.cos(theta);
    	return this.matrix(
			r00, 			r01,
			r10, 			r11,
			x - r00*x - r01*y, y - r10*x - r11*y);	
    }
})();