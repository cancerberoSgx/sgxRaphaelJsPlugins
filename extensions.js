/** 
 * visual extensions for raphael. blur works in all browsers but all the others need SVG.
 * @author:sgurin
 */


//blur plugin: use like shape1.blur(2);
(function () {
  if (Raphael.vml) {
      var reg = / progid:\S+Blur\([^\)]+\)/g;
      Raphael.el.blur = function (size) {
          var s = this.node.style,
              f = s.filter;
          f = f.replace(reg, "");
          if (size != "none") {
              s.filter = f + " progid:DXImageTransform.Microsoft.Blur(pixelradius=" + (+size || 1.5) + ")";
              s.margin = Raphael.format("-{0}px 0 0 -{0}px", Math.round(+size || 1.5));
          } else {
              s.filter = f;
              s.margin = 0;
          }
      };
  } else {
      var $ = function (el, attr) {
          if (attr) {
              for (var key in attr) if (attr.hasOwnProperty(key)) {
                  el.setAttribute(key, attr[key]);
              }
          } else {
              return document.createElementNS("http://www.w3.org/2000/svg", el);
          }
      };
      Raphael.el.blur = function (size) {
          // Experimental. No WebKit support.
          if (size != "none") {
              var fltr = $("filter"),
                  blur = $("feGaussianBlur");
              fltr.id = "r" + (Raphael.idGenerator++).toString(36);
              $(blur, {stdDeviation: +size || 1.5});
              fltr.appendChild(blur);
              this.paper.defs.appendChild(fltr);
              this._blur = fltr;
              $(this.node, {filter: "url(#" + fltr.id + ")"});
          } else {
              if (this._blur) {
                  this._blur.parentNode.removeChild(this._blur);
                  delete this._blur;
              }
              this.node.removeAttribute("filter");
          }
      };
  }
})();
//emboss plugin, use like shape1.emboss(1.0)
(function () {
  if (Raphael.vml) {
      var reg = / progid:\S+Emboss\([^\)]+\)/g;
      Raphael.el.emboss = function (bias) {
          var s = this.node.style,
              f = s.filter;
          f = f.replace(reg, "");
          if (bias != "none") {
              s.filter = f + " progid:DXImageTransform.Microsoft.Emboss(bias=" + (bias || 0.0) + ")";
              //s.margin = Raphael.format("-{0}px 0 0 -{0}px", Math.round(+size || 1.5));
          } else {
              s.filter = f;
              //s.margin = 0;
          }
      };
  } else {        
      Raphael.el.emboss = function (bias) {
          // Experimental. No WebKit support.
      	if(bias==null) {
      		return this.convolveClear(Raphael.el.emboss.EMBOSS_TRANS_NAME);
      	}
      	else {
      		var factor = 1.0;        				
      		var embossKernel =[
      				factor*-1,	0, 		0, 
      				0,			1, 		0,
      				0,			0, 		factor]; 
      			
//      			[-1.0, -1.0, 0.0, 
//  			    -1.0, 0.0, 1.0,
//  			    0.0, 1.0, 1.0];
      		
//      		Raphael.el.convolve = function (convolutionName, kernelXSize, kernel, 
//              		divisor, bias,  preserveAlpha) 
      		return this.convolve(Raphael.el.emboss.EMBOSS_TRANS_NAME, 
      			3, embossKernel, 1.0, bias, null);
      	}
      };
      Raphael.el.emboss.EMBOSS_TRANS_NAME="embossTransformation";
  }
})();



/*
 * pixel convolution tranformation (only svg). only squeare kernels allowed.
 * you can add many convolutions. Their name must be a valid html id. For example:
 * image.convolve("emboss1", 3, 3, [0.4,0,0,0,1,0,0,0,0.5])
 * image.convolve("conv2", 2,2,[1,2,2,3])
 * image.convolveClear("emboss1")
 * @author: SebastiÃ¡n Gurin <sgurin @ montevideo  DOT com  DOT uy>
 */
(function () {
    if (Raphael.vml) {    	
    	//TODO
    	Raphael.el.convolve = function (convolutionName, kernelXSize, kernel, 
        		divisor, bias,  preserveAlpha) {
    		return this;
    	};
    	 Raphael.el.convolveClear = function (convolutionName) {
    		 return this;
    	 };
    } 
    else {
        var $ = function (el, attr) {
            if (attr) {
                for (var key in attr) if (attr.hasOwnProperty(key)) {
                    el.setAttribute(key, attr[key]);
                }
            } else {
                return document.createElementNS("http://www.w3.org/2000/svg", el);
            }
        };
        Raphael.el.convolve = function (convolutionName, kernelXSize, kernel, 
        		divisor, bias,  preserveAlpha) {
        	
        	//convolution configuration
            var convolveConfig = {
            	order: kernelXSize+"",
            	kernelMatrix: kernel.join(" ")
            };
            if(divisor) convolveConfig["divisor"]=divisor;
            if(bias) convolveConfig["bias"]=bias;
            if( preserveAlpha) convolveConfig["preserveAlpha"]= preserveAlpha;            
            else convolveConfig["preserveAlpha"]="true";
            
        	//if not exists create a main filter element
        	if(this.mainFilter==null) {
        		this.mainFilter = $("filter");
        		this.mainFilter.id = "convolutionMainFilter"
                this.paper.defs.appendChild(this.mainFilter);
        		$(this.node, {filter: "url(#convolutionMainFilter)"});
        	}
        	
            //create or gets the filter primitive element feConvolveMatrix:
            var convolveFilter = this._convolutions==null?null:this._convolutions[convolutionName];
            if(convolveFilter==null){
            	convolveFilter = $("feConvolveMatrix");
            }
            this.mainFilter.appendChild(convolveFilter);
            
            //apply configuration and register
            $(convolveFilter, convolveConfig);  
            if(! this._convolutions)
            	 this._convolutions={}
            this._convolutions[convolutionName] = convolveFilter;
            
	        return this;
        };
        
        Raphael.el.convolveClear = function (convolutionName) {
        	if (this._convolutions!=null && this._convolutions[convolutionName]!=null &&
        			this.mainFilter!=null) {   
        		try {
        			this.mainFilter.removeChild(this._convolutions[convolutionName]);
        			this._convolutions[convolutionName]=null;
        		}catch(ex){alert("error removing filter for conv named : "+convolutionName);}
        		
            }  
            return this;
        };
        Raphael.el.convolveClearAll=function() {
        	if(this.mainFilter!=null) {
	        	this.paper.defs.removeChild(this.mainFilter);
	        	this.mainFilter=null;
	        	this._convolutions=null;
	        	this.node.removeAttribute("filter");
        	}
        };
    }
    
})();
    
    
/*
 * colorMatrix support  for raphael. Only available on svg
 * @author: SebastiÃ¡n Gurin <sgurin @ montevideo  DOT com  DOT uy>
 */
(function () {
    if (Raphael.vml) {    	
    	//TODO
    } 
    else {
        var $ = function (el, attr) {
            if (attr) {
                for (var key in attr) if (attr.hasOwnProperty(key)) {
                    el.setAttribute(key, attr[key]);
                }
            } else {
                return document.createElementNS("http://www.w3.org/2000/svg", el);
            }
        };
        Raphael.el.colorMatrix = function (tname, matrix) {        	
            var filterConfig = {
            	type: "matrix", 
            	values : matrix.join(" ")
            };
        	//if not exists create a main filter element
        	if(this.colorMainFilter==null) {
        		this.colorMainFilter = $("filter");
        		this.colorMainFilter.id = "colorMainFilter"
                this.paper.defs.appendChild(this.colorMainFilter);
        		$(this.node, {filter: "url(#colorMainFilter)"});
        	}
        	
            //create or gets the filter primitive element feColorMatrix:
            var colorFilter = this._colorFilters==null?null:this._colorFilters[tname];
            if(colorFilter==null){
            	colorFilter = $("feColorMatrix");
            }
            this.colorMainFilter.appendChild(colorFilter);
            
            //apply configuration and register
            $(colorFilter, filterConfig);  
            if(! this._colorFilters)
            	 this._colorFilters={}
            this._colorFilters[tname] = colorFilter;
            
	        return this;
        };
        
        Raphael.el.colorMatrixClear = function (tName) {
        	if (this._colorFilters!=null && this._colorFilters[tName]!=null &&
        			this.colorMainFilter!=null) {   
        		try {
        			this.colorMainFilter.removeChild(this._colorFilters[tName]);
        			this._colorFilters[tName]=null;
        		}catch(ex){alert("error removing filter for color matrix named : "+tName);}
        		
            }  
            return this;
        };
        Raphael.el.colorMatrixClearAll=function() {
        	if(this.colorMainFilter!=null) {
	        	this.paper.defs.removeChild(this.colorMainFilter);
	        	this.colorMainFilter=null;
	        	this._colorFilters=null;
	        	this.node.removeAttribute("filter");
        	}
        };
    }
})();     
    
/* raphael support for http://www.w3.org/TR/SVG/filters.html#feComponentTransfer (SVG ONLY!)
 * in this first version, only type="linear" supported
 * @author: SebastiÃ¡n Gurin <sgurin @ montevideo  DOT com  DOT uy>
 */
(function () {
    if (Raphael.vml) { 
		//TODO
    } 
    else {
        var $ = function (el, attr) {
            if (attr) {
                for (var key in attr) if (attr.hasOwnProperty(key)) {
                    el.setAttribute(key, attr[key]);
                }
            } else {
                return document.createElementNS("http://www.w3.org/2000/svg", el);
            }
        };
			/**use like this:
				el.componentTransferLinear("myTransf1", {funcR: {slope: 4, intercept: -1}, funcG: {slope: 4, intercept: -1}, funcB: {slope: 4, intercept: -1}})
			*/
        Raphael.el.componentTransferLinear = function (tName, funcs) {       	
//        	alert("componentTransferLinear");
	     	//if not exists create a main filter element
	     	if(this.componentTransfersMainFilter==null) {
	     		alert("***componentTransfersMainFilter created");
	     		this.componentTransfersMainFilter = $("filter");
	     		this.componentTransfersMainFilter.id = "componentTransfersMainFilter"
	             this.paper.defs.appendChild(this.componentTransfersMainFilter);
	     		$(this.node, {filter: "url(#componentTransfersMainFilter)"});
	     	}
        	
            //create or gets the filter primitive element feComponentTransfer with its feFuncX childs:
            var componentTransferFilter = this._componentTransfers==null?null:this._componentTransfers[tName], 
					funcR=null, funcG=null, funcB=null ;
            if(componentTransferFilter==null){
//            	debugger;
//            	alert("*componentTransfersMainFilter created");
            	componentTransferFilter = $("feComponentTransfer");
				funcR = $("feFuncR");
				funcG = $("feFuncG");
				funcB = $("feFuncB");
				componentTransferFilter.appendChild(funcR);
				componentTransferFilter.appendChild(funcG);
				componentTransferFilter.appendChild(funcB);
            }
            else {
            	funcR = componentTransferFilter.childNodes[0];
            	funcG = componentTransferFilter.childNodes[1];
            	funcB = componentTransferFilter.childNodes[2];
            }
            //debugger;
            $(funcR, funcs["funcR"]); funcR.setAttribute("type", "linear");
            $(funcG, funcs["funcG"]); funcG.setAttribute("type", "linear");
            $(funcB, funcs["funcB"]); funcB.setAttribute("type", "linear");            
            this.componentTransfersMainFilter.appendChild(componentTransferFilter);
            
            //register          
            if(! this._componentTransfers)
            	 this._componentTransfers={}
            this._componentTransfers[tName] = componentTransferFilter;
            
	        return this;
        };
        
        Raphael.el.componentTransferClear = function (tName) {
        	if (this._componentTransfers!=null && this._componentTransfers[tName]!=null &&
        			this.componentTransfersMainFilter!=null) {   
        		try {
        			this.componentTransfersMainFilter.removeChild(this._componentTransfers[tName]);
        			this._componentTransfers[tName]=null;
        		}catch(ex){alert("error removing filter for conv named : "+tName);}
        		
            }  
            return this;
        };
        Raphael.el.componentTransferClearAll=function() {
        	if(this.componentTransfersMainFilter!=null) {
	        	this.paper.defs.removeChild(this.componentTransfersMainFilter);
	        	this.componentTransfersMainFilter=null;
	        	this._componentTransfers=null;
	        	this.node.removeAttribute("filter");
        	}
        };
    }
    
})();
/*
 *  'feMorphology' support  for raphael. Only available on svg
 *  use shape1.morphology(morphname, operator, radius)
 *  where operator cah be "erode" or "dilate" and radius an int. morphname is 
 *  the name of your transformation and can be used later for unregistering the 
 *  transf using shape1.morphologyClear(morphname).
 * @author: SebastiÃ¡n Gurin <sgurin @ montevideo  DOT com  DOT uy>
 */
(function () {
    if (Raphael.vml) {    	
    	//TODO
    } 
    else {
        var $ = function (el, attr) {
            if (attr) {
                for (var key in attr) if (attr.hasOwnProperty(key)) {
                    el.setAttribute(key, attr[key]);
                }
            } else {
                return document.createElementNS("http://www.w3.org/2000/svg", el);
            }
        };
        Raphael.el.morphology = function (tname, operator, radius) {        	
            var filterConfig = {
            	"operator": operator, 
            	"radius" : radius
            };
        	//if not exists create a main filter element
        	if(this.morphologyMainFilter==null) {
        		this.morphologyMainFilter = $("filter");
        		this.morphologyMainFilter.id = "morphologyMainFilter"
            this.paper.defs.appendChild(this.morphologyMainFilter);
        		$(this.node, {filter: "url(#morphologyMainFilter)"});
        	}
        	
            //create or gets the filter primitive element feColorMatrix:
            var morphologyFilter = this._morphologyFilters==null?null:this._morphologyFilters[tname];
            if(morphologyFilter==null){
            	morphologyFilter = $("feMorphology");
            }
            this.morphologyMainFilter.appendChild(morphologyFilter);
            
            //apply configuration and register
            $(morphologyFilter, filterConfig);  
            if(! this._morphologyFilters)
            	 this._morphologyFilters={}
            this._morphologyFilters[tname] = morphologyFilter;
            
	        return this;
        };
        
        Raphael.el.morphologyClear = function (tName) {
        	if (this._morphologyFilters!=null && this._morphologyFilters[tName]!=null &&
        			this.morphologyMainFilter!=null) {   
        		try {
        			this.morphologyMainFilter.removeChild(this._morphologyFilters[tName]);
        			this._morphologyFilters[tName]=null;
        		}catch(ex){alert("error removing filter for morphology named : "+tName);}
        		
            }  
            return this;
        };
        Raphael.el.morphologyClearAll=function() {
        	if(this.morphologyMainFilter!=null) {
	        	this.paper.defs.removeChild(this.morphologyMainFilter);
	        	this.morphologyMainFilter=null;
	        	this._morphologyFilters=null;
	        	this.node.removeAttribute("filter");
        	}
        };
    }
})();     
    

