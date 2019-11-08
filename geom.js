
var GREEN = "rgb(128,255,128)";

CanvasRenderingContext2D.prototype.strokeCircle = function(x,y,r) {
	this.beginPath();
	this.arc(x,y,r,0,Math.PI*2);
	this.stroke();
}

CanvasRenderingContext2D.prototype.fillCircle = function(x,y,r) {
	this.beginPath();
	this.arc(x,y,r,0,Math.PI*2);
	this.fill();
}

CanvasRenderingContext2D.prototype.strokeLine = function(x1,y1,x2,y2) {
	this.beginPath();
	this.moveTo(x1,y1);
	this.lineTo(x2,y2);
	this.stroke();
}

//****************************************************************************

function Point(_x,_y) {

	this.x = _x;
	this.y = _y;
}

//****************************************************************************

function GObject() {

	var self = this;

	self.name = "";
	self.color = "white";
	self.valid = true;
	self.hidden = false;
	self.selected = false;
	self.constrained = false;

	self.getId = function() {
		return ++GObject.gid;
	}

	self.isPicked = function() { return false; }

	self.builder = null;

}

GObject.gid = 0;

//****************************************************************************

function GPoint(){
	
	var self = this;

	GObject.call(self);

	self.name = "P"+self.getId();

	self.x = 0;
	self.y = 0;

	self.draw = function(ctx,width,height) {
		ctx.strokeStyle = self.color;
		ctx.fillStyle = self.color;	
		if(self.selected) {
			ctx.lineWidth = 3;
			if(self.builder instanceof PointBuilder)
				ctx.strokeCircle(self.x,self.y,6);
			else if(self.constrained) 
				ctx.strokeRect(self.x-3,self.y-3,9,9);
			else
				ctx.fillCircle(self.x,self.y,6);
			}
		else { 
			if(self.builder instanceof PointBuilder)
				ctx.strokeCircle(self.x,self.y,4);
			else if(self.constrained) 
				ctx.strokeRect(self.x-3,self.y-3,7,7);
			else
				ctx.fillCircle(self.x,self.y,4);
		}
	}

	self.isPicked = function(x,y) {
		self.xpick = self.ypick = null;
		if(x<self.x-3) return false;
		if(x>self.x+3) return false;
		if(y<self.y-3) return false;
		if(y>self.y+3) return false;
		return true;
	}

}

GPoint.prototype = Object.create(GObject.prototype);
GPoint.prototype.constructor = GPoint;

//****************************************************************************

function GLine() {
	// The equation of the line is  ax+by+c = 0
	
	var self = this;

	GObject.call(self);
	
	self.name = "L"+self.getId();

	self.a = 0;
	self.b = 0;
	self.c = 0;

	self.draw = function(ctx,width,height) {
		ctx.strokeStyle = self.color;
		if(Math.abs(self.a)<Math.abs(self.b)) {
			var x1 = 0;
			var y1 = -(self.a*x1+self.c)/self.b;
			var x2 = width;
			var y2 = -(self.a*x2+self.c)/self.b;
		}
		else {
			var y1 = 0;
			var x1 = -(self.b*y1+self.c)/self.a;
			var y2 = height;
			var x2 = -(self.b*y2+self.c)/self.a;
		}
		ctx.lineWidth = self.selected ? 4 :1 ;
		ctx.beginPath();
		ctx.moveTo(x1,y1);
		ctx.lineTo(x2,y2);
		ctx.stroke();
	}

	self.isPicked = function(x,y) {
		self.xpick = self.ypick = null;
		var d = Math.abs(self.a*x + self.b*y + self.c);
		return d<5;
	}

}

GLine.prototype = Object.create(GObject.prototype);
GLine.prototype.constructor = GLine;

//****************************************************************************

function GSegment() {

	var self = this;

	GObject.call(this);

	self.name = "S"+self.getId();

	self.x1 = 0;
	self.y1 = 0;
	self.x2 = 0;
	self.y2 = 0;

	self.draw = function(ctx,width,height) {

		ctx.strokeStyle = self.color;
		ctx.lineWidth = self.selected ? 4 : 1;
		ctx.beginPath();
		ctx.moveTo(self.x1,self.y1);
		ctx.lineTo(self.x2,self.y2);
		ctx.stroke();
	}

}

GSegment.prototype = Object.create(GObject.prototype);
GSegment.prototype.constructor = GSegment;

//****************************************************************************

function GCircle() {

	var self = this;

	GObject.call(self);

	self.name = "C"+self.getId();

	self.x = 0;
	self.y = 0;
	self.r = 0;

	self.draw = function(ctx,width,height) {
		ctx.strokeStyle = self.color;
		ctx.lineWidth = self.selected ? 4 : 1;
		ctx.strokeCircle(self.x,self.y,self.r);
	}

	self.isPicked = function(x,y) {
		self.xpick = self.ypick = null;
		var d = Math.sqrt((x-self.x)*(x-self.x)+(y-self.y)*(y-self.y));
		return Math.abs(d-self.r)<5;
	}

}

GCircle.prototype = Object.create(GObject.prototype);
GCircle.prototype.constructor = GCircle;

//****************************************************************************
//****************************************************************************

function Builder(_types,_prompts) {

	var self = this;

	var types = _types;
	var prompts = _prompts;
	var step = 0;
	self.parents = [];

	self.getPrompt = function() {
		if(step>=types.length)
			return null;
		else
			return prompts[step];
	}

	self.getParentType = function() {
		return types[step];
	}
	
	self.setParent = function(obj) {
		self.parents.push(obj);
		step++;
		return true;
	}

	self.build = function() {}

	self.update = function() { return true; }

	self.move = null;

	self.drawIcon = function() {}

	self.getHelp = function() { return ""; }

}


//****************************************************************************

function PointBuilder() {

	var self = this;

	Builder.call(self,[Point],["Click to place the point"]);

	self.build = function() {
		var pt = self.parents[0];
		var target = new GPoint();
		target.x = pt.x;
		target.y = pt.y;
		target.builder = this;
		return target;
	}
	
	self.drawIcon = function(ctx,w,h) {
		ctx.fillStyle = GREEN;
		ctx.fillCircle(w/2,h/2,3);
	}

	self.getHelp = function() { 
		return "Create a point";
	}

}

PointBuilder.prototype = Object.create(Builder.prototype);
PointBuilder.prototype.constructor = PointBuilder;

//****************************************************************************

function SegmentBuilder() {

	var self = this;

	Builder.call(self,
		[GPoint,GPoint],
		["Select the first point","Select the second point"]
	);

	self.build = function() {
		var target = new GSegment();
		target.builder = self;
		self.update(target);
		return target;
	}

	self.update = function(target) {
		var segment = target;
		var point1 = self.parents[0];
		var point2 = self.parents[1];

		segment.x1 = point1.x;
		segment.y1 = point1.y;
		segment.x2 = point2.x;
		segment.y2 = point2.y;

		return true;
	}

	self.drawIcon = function(ctx,w,h) {
		var x1 = w/2-8;
		var y1 = h/2+8;
		var x2 = w/2+8;
		var y2 = h/2-8;

		ctx.fillStyle = "white";
		ctx.fillCircle(x1,y1,4);
		ctx.fillCircle(x2,y2,4);

		ctx.strokeStyle = GREEN;
		ctx.lineWidth =2;
		ctx.beginPath();
		ctx.moveTo(x1,y1);
		ctx.lineTo(x2,y2);
		ctx.stroke();
	}

	self.getHelp = function() {
		return "Build a segment between two points";
	}
}

SegmentBuilder.prototype = Object.create(Builder.prototype);
SegmentBuilder.prototype.constructor = SegmentBuilder;

//****************************************************************************

function LineBuilder() {

	var self = this;

	Builder.call(this,
		[GPoint,GPoint],
		["Select the first point","Select the second point"]
	);

	self.build = function() {
		var target = new GLine();
		target.builder = self;
		self.update(target);
		return target;
	}

	self.update = function(target) {
		var line = target;
		var point1 = self.parents[0];
		var point2 = self.parents[1];

		var dx = point1.x - point2.x;
		var dy = point1.y - point2.y;

		if(Math.abs(dx)<1.e-5) {
			line.a = 0;
			line.b = 1;
			line.c = -point1.x;
		} 
		else if(Math.abs(dy)<1.e-5) {
			line.a = 0;
			line.b = 1;
			line.c = -point1.y;
		} 
		else if(Math.abs(dx)<Math.abs(dy)) {
			line.a = 1;
			line.b = -dx/dy;
			line.c = -line.a*point1.x -line.b*point1.y;
		}
		else {
			line.a = -dy/dx;
			line.b = 1;
			line.c = -line.a*point1.x-line.b*point1.y;
		}
		return true;
	}

	self.drawIcon = function(ctx,w,h) {
		var x1 = w/2-8;
		var y1 = h/2+8;
		var x2 = w/2+8;
		var y2 = h/2-8;

		ctx.fillStyle = "white";
		ctx.fillCircle(x1,y1,4);
		ctx.fillCircle(x2,y2,4);

		ctx.strokeStyle = GREEN;
		ctx.lineWidth =2;
		ctx.beginPath();
		ctx.moveTo(x1-7,y1+7);
		ctx.lineTo(x2+7,y2-7);
		ctx.stroke();
	}

	self.getHelp = function() {
		return "Build a line through two points";
	}

}

LineBuilder.prototype = Object.create(Builder.prototype);
LineBuilder.prototype.constructor = LineBuilder;

//****************************************************************************

function ThreePointCircleBuilder() {

	var self = this;

	Builder.call(self,
		[GPoint,GPoint,GPoint],
		["Select the 1st point","Select the 2nd point","Select the 3rd point"]
	);

	self.build = function() {
		var target = new GCircle();
		target.builder = self;
		self.update(target);
		return target;
	}

	self.update = function(target) {
		var circle = target;
		var point1 = self.parents[0];
		var point2 = self.parents[1];
		var point3 = self.parents[2];
		
		var dab = (point1.x-point2.x)*(point1.x-point2.x)+
			(point1.y-point2.y)*(point1.y-point2.y);
		if(dab<1) return;

		var dbc = (point2.x-point3.x)*(point2.x-point3.x)+
			(point2.y-point3.y)*(point2.y-point3.y);
		if(dbc<1) return;

		var a1 = point1.x-point2.x;
		var b1 = point1.y-point2.y;
		var c1 = -(a1*(point1.x+point2.x)/2+b1*(point1.y+point2.y)/2);

		var a2 = point2.x-point3.x;
		var b2 = point2.y-point3.y;
		var c2 = -(a2*(point2.x+point3.x)/2+b2*(point2.y+point3.y)/2);

		if(Math.abs(a1*b2-a2*b1)<1) return;

		var d = a1*b2-a2*b1;
		circle.x = (b1*c2-b2*c1)/d;
		circle.y = (c1*a2-c2*a1)/d;

		d = (point1.x-circle.x)*(point1.x-circle.x)+
			(point1.y-circle.y)*(point1.y-circle.y);

		circle.r = Math.sqrt(d);	
		return true;
	}

	self.drawIcon = function(ctx,w,h) {
		ctx.fillStyle = "white";
		ctx.fillCircle(w/2-9,h/2-9,4);
		ctx.fillCircle(w/2-7,h/2+12,4);
		ctx.fillCircle(w/2+11,h/2+3,4);
		ctx.strokeStyle = GREEN;		
		ctx.strokeCircle(w/2-2,h/2+2,12);
	}	

	self.getHelp = function() {
		return "Build a circle through three points";
	}
}

ThreePointCircleBuilder.prototype = Object.create(Builder.prototype);
ThreePointCircleBuilder.prototype.constructor = ThreePointCircleBuilder;

//****************************************************************************

function LineIntersectionBuilder() {

	var self = this;
	
	Builder.call(self,
		[GLine,GLine],
		["Select the 1st line","Select the 2nd line"]
	);

	self.build = function() {
		var target = new GPoint();
		target.builder = self;
		self.update(target);
		return target;
	}

	self.update = function(target) {
		var point = target;
		var line1 = self.parents[0];
		var line2 = self.parents[1];

		var d = line1.a*line2.b-line2.a*line1.b;
		if(Math.abs(d)<1e-5) return;

		point.x = (line1.b*line2.c-line2.b*line1.c)/d;
		point.y = (line1.c*line2.a-line2.c*line1.a)/d;
	
		return true;
	}

	self.drawIcon = function(ctx,w,h) {
		ctx.strokeStyle = "white";
		ctx.lineWidth = 2;
		ctx.strokeLine(w/2-10,h/2-14,w/2+10,h/2+14);
		ctx.strokeLine(w/2-14,h/2+14,w/2+14,h/2-14);
		ctx.fillStyle = GREEN;
		ctx.fillCircle(w/2,h/2,3);
	}

	self.getHelp = function() {
		return "Build a point at the intersection of two lines";
	}
	
}

LineIntersectionBuilder.prototype = Object.create(Builder.prototype);
LineIntersectionBuilder.prototype.constructor = LineIntersectionBuilder;

//****************************************************************************

function MiddleBuilder() {

	var self = this;

	Builder.call(this,		
		[GPoint,GPoint],
		["Select the 1st point","Select the 2nd point"]
	);

	self.build = function() {
		var target = new GPoint();
		target.builder = self;
		self.update(target);
		return target;
	}

	self.update = function(target) {
		var point = target;
		var point1 = self.parents[0];
		var point2 = self.parents[1];

		point.x = (point1.x+point2.x)/2;
		point.y = (point1.y+point2.y)/2;

		return true;
	}

	self.drawIcon = function(ctx,w,h) {
		ctx.fillStyle = "white";
		ctx.fillCircle(w/2-10,h/2+10,4);
		ctx.fillCircle(w/2+10,h/2-10,4);
		ctx.fillStyle = GREEN;
		ctx.fillCircle(w/2,h/2,3);
	}

	self.getHelp = function() {
		return "Build the middle of two points";
	}	
}

MiddleBuilder.prototype = Object.create(Builder.prototype);
MiddleBuilder.prototype.constructor = MiddleBuilder;

//****************************************************************************

function CenteredCircleBuilder() {

	var self = this;
	
	Builder.call(self,
		[GPoint,GPoint],
		["Select the center of the circle","Select a point on the circle"]
	);

	self.build = function() {
		var target = new GCircle();
		target.builder = self;
		self.update(target);
		return target;
	}

	self.update = function(target) {
		var circle = target;
		var point1 = self.parents[0];
		var point2 = self.parents[1];

		circle.x = point1.x;
		circle.y = point1.y;
		circle.r = Math.sqrt((point1.x-point2.x)*(point1.x-point2.x)
        +(point1.y-point2.y)*(point1.y-point2.y));
		
		return true;
	}

	self.drawIcon = function(ctx,w,h) {
		ctx.fillStyle = "white";
		ctx.fillCircle(w/2,h/2,4);
		ctx.fillCircle(w/2+10,h/2+10,4);
		ctx.strokeStyle = GREEN;
		ctx.strokeCircle(w/2,h/2,14);
	}

	self.getHelp = function() {
		return "Build a circle from its center";
	}

}

CenteredCircleBuilder.prototype = Object.create(Builder.prototype);
CenteredCircleBuilder.prototype.constructor = CenteredCircleBuilder;

//****************************************************************************

function PerpendicularBuilder() {

	var self = this;

	Builder.call(self,
		[GLine,GPoint],
		["Select the line","Select the point"]
	)

	self.build =  function() {
		var target = new GLine();
		target.builder = self;
		self.update(target);
		return target;
	}

	self.update = function(target) {
		var line = target;		
		var point2 = self.parents[1];
			
		if(self.parents[0] instanceof GLine) {	
			var line1 = self.parents[0];
			line.a = -line1.b;
			line.b = line1.a;
			line.c = -(line.a*point2.x +line.b*point2.y);
		}
		else if(self.parents[0] instanceof GSegment) {
			var segment1 = self.parents[0];
			var pa = segment1.builder.parents[0];
			var pb = segment1.builder.parents[1];
			line.b = pa.y-pb.y;
			line.a = -(pb.x-pa.x);
			line.c = -(line.a*point2.x +line.b*point2.y);
		}

		return true;
	}	

	self.drawIcon = function(ctx,w,h) {
		var x1 = w/2-8;
		var y1 = h/2+8;
		var x2 = w/2+8;
		var y2 = h/2-8;

		ctx.strokeStyle = "white";
		ctx.lineWidth =2;
		ctx.strokeLine(x1-7,y1+5,x2+7,y2-9);
		ctx.fillStyle = "white";
		ctx.fillCircle(w/2+12,h/2+12,4);

		ctx.strokeStyle = GREEN;
		ctx.strokeLine(w/2+13,h/2+13,w/2-13,h/2-13);
	}

	self.getHelp = function() {
		return "Build a perpendicular through a point";
	}

}

PerpendicularBuilder.prototype = Object.create(Builder.prototype);
PerpendicularBuilder.prototype.constructor = PerpendicularBuilder;

//****************************************************************************

function ParallelBuilder() {

	var self = this;

	Builder.call(this,
		[GLine,GPoint],
		["Select the line","Select the point"]
	);

	self.build =  function() {
		var target = new GLine();
		target.builder = self;
		self.update(target);
		return target;
	}

	self.update = function(target) {
		var line = target;		
		var line1 = self.parents[0];
		var point2 = self.parents[1];
		
		line.a = line1.a;
		line.b = line1.b;
		line.c = -(line.a*point2.x +line.b*point2.y);

		return true;
	}	

	self.drawIcon = function(ctx,w,h) {
		ctx.strokeStyle = "white";
		ctx.lineWidth =2;		
		ctx.strokeLine(w/2-16,h/2+3,w/2+3,h/2-16);
		ctx.fillStyle = "white";
		ctx.fillCircle(w/2+6,h/2+6,4);
		ctx.strokeStyle = GREEN;		
		ctx.strokeLine(w/2-3,h/2+16,w/2+16,h/2-3);
	}

	self.getHelp = function() {
		return "Build a parallel through a point";
	}
}

ParallelBuilder.prototype = Object.create(Builder.prototype);
ParallelBuilder.prototype.constructor = ParallelBuilder;

//****************************************************************************

function BisectorBuilder() {

	var self = this;

	Builder.call(self,
		[GPoint,GPoint,GPoint],
		["Select the 1st point","Select the 2nd point","Select the 3rd point"]
	);

	self.build = function() {
		var target = new GLine();
		target.builder = self;
		self.update(target);
		return target;
	}

	self.update = function(target) {
		var line = target;
		var p1 = self.parents[0];
		var p2 = self.parents[1];		
		var p3 = self.parents[2];

		var d1 = Math.sqrt((p1.x-p2.x)*(p1.x-p2.x)+(p1.y-p2.y)*(p1.y-p2.y));
		var d3 = Math.sqrt((p3.x-p2.x)*(p3.x-p2.x)+(p3.y-p2.y)*(p3.y-p2.y));
		
		if((d1<1)||(d3<1))
			return;

		var x = p2.x + (p1.x-p2.x) + (p3.x-p2.x)*d1/d3;
		var y = p2.y + (p1.y-p2.y) + (p3.y-p2.y)*d1/d3;

		var dx = x-p2.x;
		var dy = y-p2.y;
		if(Math.abs(dx)+Math.abs(dy)<1)		
			return;

		var a=0,b=0,c=0;

		if(Math.abs(dx)<1) {
			b = 0.0;
			a = 1.0;
			c = -x;
			}
		else if(Math.abs(dy)<1) {
			a = 0.0;
			b = 1.0;
			c = -y;
			}
		else if(Math.abs(dx)<Math.abs(dy)) {
			a = 1.0;
			b = -dx/dy;
			c = -a*x-b*y;
			}
		else {
			a = -dy/dx;
			b = 1.0;
			c = -a*x-b*y;
			}

		line.a = a;
		line.b = b;
		line.c = c;

		return true;
		}

		self.drawIcon = function(ctx,w,h) {
			ctx.fillStyle = "white";
			ctx.fillCircle(w/2-11,h/2-12,4);
			ctx.fillCircle(w/2+11,h/2-12,4);
			ctx.fillCircle(w/2,h/2+9,4);		
			ctx.strokeStyle = GREEN;
			ctx.lineWidth = 2.5;
			ctx.strokeLine(w/2,h/2-16,w/2,h/2+16);
		}

	self.getHelp = function() {
		return "Build the bisector of an angle";
	}
}

BisectorBuilder.prototype = Object.create(Builder.prototype);
BisectorBuilder.prototype.constructor = BisectorBuilder;

//****************************************************************************

function ProjectionBuilder() {

	var self = this;

	Builder.call(this,
		[GPoint,GLine],
		["Select the point to project","Select the line to project to"]
	);

	self.build = function() {
		var target = new GPoint();
		target.builder = self;
		self.update(target);
		return target;
	}

	self.update = function(target) {
		var point = target;
		if(self.parents[1] instanceof GLine) {
			var p1 = self.parents[0];
			var line2 = self.parents[1];
			var d = line2.a*line2.a+line2.b*line2.b;
			point.y = line2.a*(line2.a*p1.y-line2.b*point1.x)-line2.b*line2.c;
			point.y = point.y/d;
			point.x = line2.b*(line2.b*p1.x-line2.a*point1.y)-line2.a*line2.c;
			point.x = point.x/d;
		}

		if(self.parents[1] instanceof GSegment) {
			var segment = self.parents[1];			
			var pa = segment.builder.parents[0];
			var pb = segment.builder.parents[1];
			var pc = self.parents[0];

			var a = pb.y-pa.y;
			var b = pb.x-pa.x;
			var c = pc.x*(pa.y-pb.y)+pc.y*(pa.x-pb.x);
			var d = pa.x*(pa.y-pb.y)+pa.y*(pb.x-pa.x);

			point.x = (-c-d)/(a+a);
			point.y = (d-c)/(b+b);
			
		}
	
		point.valid = (!isNaN(point.x))&&(!isNaN(point.y));	
		return point.valid;
	}

	self.drawIcon = function(ctx,w,h) {
		ctx.strokeStyle = "white";
		ctx.lineWidth =2;		
		ctx.strokeLine(w/2-18,h/2+3,w/2+3,h/2-18);
		ctx.fillStyle = "white";
		ctx.fillCircle(w/2+6,h/2+6,4);
		ctx.fillStyle = GREEN;		
		ctx.fillCircle(w/2-7,h/2-7,3);
	}

	self.getHelp = function() {
		return "Build the projection of a point";
	}
}

ProjectionBuilder.prototype = Object.create(Builder.prototype);
ProjectionBuilder.prototype.constructor = ProjectionBuilder;

//****************************************************************************

function LineCircleIntersectionBuilder() {

	var self = this;

	Builder.call(self,
		[GLine,GCircle],
		["Select the line","Select the circle"]	
	);

	self.build = function() {
		var targets = [new GPoint(),new GPoint()];

		targets[0].builder = self;
		targets[0].data = 1;

		targets[1].builder = self;
		targets[1].data = -1;

		self.update(targets[0]);
		self.update(targets[1]);
		return targets;
	}

	self.update = function(target) {
		var point = target;
		var line = self.parents[0];
		var circle = self.parents[1];	

		var x=0,y=0,d=0;

		if(Math.abs(line.a)<1e-5) {
			y = -line.c/line.b;
			d = y-circle.y;
			if(Math.sqrt(d)>circle.r) return;
			x = circle.x + point.data*Math.sqrt(circle.r*circle.r-d*d);
			}
		else if(Math.abs(line.b)<1e-5) {
			x = -line.c/line.a;
			d = x-circle.x;
			if(Math.abs(d)>circle.r) return;
			y = circle.y + point.data*Math.sqrt(circle.r*circle.r-d*d);
			}
		else {
			var A = line.b*line.b + line.a*line.a;
			var B = 2*(line.b*line.c + line.a*line.b*circle.x -line.a*line.a*circle.y);
			var C = line.c*line.c + 2*line.a*line.c*circle.x
				+ line.a*line.a
					*(circle.x*circle.x+circle.y*circle.y-circle.r*circle.r);
			d = B*B-4.0*A*C;
			if(d<0) return;
			y = (-B + point.data*Math.sqrt(d))/(2.0*A);
			x = -(line.b*y+line.c)/line.a;
		}
		point.x = x;
		point.y = y;

		return true;
	}

	self.drawIcon = function(ctx,w,h) {
		ctx.strokeStyle = "white";
		ctx.strokeCircle(w/2,h/2,14);
		ctx.lineWidth = 2;
		ctx.strokeLine(w/2-10,h/2+18,w/2+18,h/2-10);	
		ctx.fillStyle = GREEN;
		ctx.fillCircle(w/2-6,h/2+12,3);
		ctx.fillCircle(w/2+12,h/2-6,3);
	}

	self.getHelp = function() {
		return "Build the intersections of a line and a circle";
	}

}

LineCircleIntersectionBuilder.prototype = Object.create(Builder.prototype);
LineCircleIntersectionBuilder.prototype.constructor = LineCircleIntersectionBuilder;

//****************************************************************************

function  PointOnLineBuilder() {

	var self = this;

	Builder.call(this,
		[GLine],
		["Select the line"]
	);

	
	self.build = function() {
		var target = new GPoint();
		target.builder = self;
		var line = self.parents[0];
		target.x = line.xpick;
		target.y = line.ypick;
		target.constrained = true;
		self.update(target);
		return target;
	}

	self.update = function(target) {
		var point = target;
		var line = self.parents[0];

		if(!line.valid) return point.valid = false;

		var d = line.a*line.a+line.b*line.b;
		var y = line.a*(line.a*point.y-line.b*point.x)-line.b*line.c;
		y = y/d;
		var x = line.b*(line.b*point.x-line.a*point.y)-line.a*line.c;
		x = x/d;
		point.x = x;		
		point.y = y;
		return true;
	}

	self.drawIcon = function(ctx,w,h) {
        ctx.strokeStyle = "white";
		ctx.lineWidth = 2;
		ctx.strokeLine(w/2-14,h/2+14,w/2+14,h/2-14);
		ctx.fillStyle = "red";
		ctx.fillCircle(w/2+7,h/2-7,4);
	}

	self.getHelp = function() {
		return "Constraint a point on a line";
	}
}

PointOnLineBuilder.prototype = Object.create(Builder.prototype);
PointOnLineBuilder.prototype.constructor = PointOnLineBuilder;

//****************************************************************************

function PointOnCircleBuilder() {

	var self = this;
	
	Builder.call(self,
		[GCircle],
		["Select the circle"]
	);

	self.build = function() {
		var target = new GPoint();
		target.builder = self;
		var circle = self.parents[0];
		target.x = circle.xpick;
		target.y = circle.ypick;
		target.constrained = true;
		self.update(target);
		return target;
	}

	self.update = function(target) {
	
		var point = target;
		var circle = self.parents[0];

		var d = (point.x-circle.x)*(point.x-circle.x)+
				(point.y-circle.y)*(point.y-circle.y);
		d = Math.sqrt(d);
		
		var x = circle.x + circle.r*(point.x-circle.x)/d;
		var y = circle.y + circle.r*(point.y-circle.y)/d;
		point.x = x;
		point.y = y;
		return true;
	}

	self.drawIcon = function(ctx,w,h) {
        ctx.strokeStyle = "white";
        ctx.strokeCircle(w/2,h/2,14);
		ctx.fillStyle = "red";
		ctx.fillCircle(w/2+9,h/2+9,4);
	}

	self.getHelp = function() {
		return "Constraint a point on a circle";
	}

}

PointOnCircleBuilder.prototype = Object.create(Builder.prototype);
PointOnCircleBuilder.prototype.constructor = PointOnCircleBuilder;

//****************************************************************************

function CircleIntersectionBuilder() {

	var self = this;

	Builder.call(self,
		[GCircle,GCircle],
		["Select the 1st circle","Select the 2nd circle"]
	);


	self.build = function() {
		var targets = [new GPoint(),new GPoint()];

		targets[0].builder = self;
		targets[0].data = 1;

		targets[1].builder = self;
		targets[1].data = -1;

		self.update(targets[0]);
		self.update(targets[1]);
		return targets;
	}

	self.update = function(target) {

		var point = target;
		var c1 = self.parents[0];
		var c2 = self.parents[1];
		
		if(!c1.valid) return point.valid = false;
		if(!c2.valid) return point.valid = false;

		// distance between the centers of the circles
		var d = (c1.x-c2.x)*(c1.x-c2.x)+(c1.y-c2.y)*(c1.y-c2.y);
		d = Math.sqrt(d);

		if(d>c1.r+c2.r) return point.valid = false;
    	if(d<Math.abs(c1.r-c2.r)) return point.valid = false;

		var a = (c1.r*c1.r-c2.r*c2.r+d*d)/(2.0*d);
		var h = Math.sqrt(c1.r*c1.r-a*a);

		point.x = c1.x + a*(c2.x-c1.x)/d + point.data*h*(c2.y-c1.y)/d;
		point.y = c1.y + a*(c2.y-c1.y)/d - point.data*h*(c2.x-c1.x)/d;

		return true;
	}

	self.drawIcon = function(ctx,w,h) {
		ctx.strokeStyle = "white";
		ctx.strokeCircle(w/2-6,h/2+6,12);
		ctx.strokeCircle(w/2+6,h/2-6,12);
		ctx.fillStyle = GREEN;
		ctx.fillCircle(w/2-6,h/2-6,4);
		ctx.fillCircle(w/2+6,h/2+6,4);
	}

	self.getHelp = function() {
		return "Build the intersections of two circles";
	}

}

CircleIntersectionBuilder.prototype = Object.create(Builder.prototype);
CircleIntersectionBuilder.prototype.constructor = CircleIntersectionBuilder;

//****************************************************************************

function TranslationBuilder() {

	var self = this;

	Builder.call(this,
		[GSegment,GPoint],
		["Select the translation segment","Select the point to be translated"]
	);


	self.build = function() {
		var target = new GPoint();
		target.builder = self;
		self.update(target);
		return target;
	}

	self.update = function(target) {
		var point = target;
		var segment1 = self.parents[0];
		var pointa = segment1.builder.parents[0];
		var pointb = segment1.builder.parents[1];
		var point2 = self.parents[1];

		if(!segment1.valid) return point.valid = false;
		if(!point2.valid) return point.valid = false;
	
		point.x = point2.x + pointb.x - pointa.x;
		point.y = point2.y + pointb.y - pointa.y;	
		return true;
	}

	self.drawIcon = function(ctx,w,h) {
		ctx.strokeStyle = "white";
		ctx.fillStyle = "white";
		ctx.lineWidth = 2;
		ctx.fillCircle(w/2-10,h/2-9,4,4);
		ctx.fillCircle(w/2+11,h/2-9,4,4);
		ctx.strokeLine(w/2-10,h/2-9,w/2+11,h/2-9);		
		ctx.fillCircle(w/2-10,h/2+8,4,4);
		ctx.fillStyle = GREEN;
		ctx.fillCircle(w/2+11,h/2+8,4,4);
	}

	self.getHelp = function() {
		return "Build a translated point";
	}

}

TranslationBuilder.prototype = Object.create(Builder.prototype);
TranslationBuilder.prototype.constructor = TranslationBuilder;

//****************************************************************************
/*
function CircleTangentBuilder() {

	var self = this;
	
	Builder.call(this,
		[GCircle,GPoint],
		["Select the circle","Select the point"]
	);

		
	self.build = function() {
		var target = new GLine();
		target.builder = self;
		self.update(target);
		return target;
	}

	self.update = function(target) {
		var line = target;
		var circle = self.parents[0];
		var point = self.parents[1];

		if(!circle.valid) return point.valid = false;
		if(!point.valid) return point.valid = false;

		// distance from the point to the circle
		var d = (point.x-circle.xc)*(point.x-circle.xc)+
			(point.y-circle.yc)*(point.y-circle.yc);
		if(Math.sqrt(d)<circle.r)
			return point.valid = false;

	}
}

CircleTangentBuilder.prototype = Object.create(Builder.prototype);
CircleTangentBuilder.prototype.constructor = CircleTangentBuilder;
*/
//****************************************************************************

