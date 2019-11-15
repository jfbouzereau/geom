
var GREEN = "rgb(128,255,128)";
var BLUE = "rgb(138,205,249)";
var BLUE = "rgb(187,226,251)";

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
	self.hilited = false;
	self.selected = false;
	self.constrained = false;

	self.getId = function() {
		return ++GObject.gid;
	}

	self.isPicked = function() { return false; }

	self.builder = null;

	self.shift = function() {}
}

GObject.gid = 0;

//****************************************************************************

function GMeasurer() {

	self = this;

	GObject.call(this);

	self.getMessage = function() { return ""}

}

GMeasurer.prototype = Object.create(GObject.prototype);
GMeasurer.prototype.constructor = GMeasurer;

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
		if(self.selected || self.hilited) {
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
				ctx.strokeCircle(self.x,self.y,3);
			else if(self.constrained) 
				ctx.strokeRect(self.x-3,self.y-3,7,7);
			else
				ctx.fillCircle(self.x,self.y,3);
		}
	}

	self.isPicked = function(x,y) {
		self.xpick = self.ypick = null;
		if(x<self.x-4) return false;
		if(x>self.x+4) return false;
		if(y<self.y-4) return false;
		if(y>self.y+4) return false;
		return true;
	}

	self.shift = function(dx,dy) {
		if((self.builder instanceof PointBuilder)||self.constrained) {
			self.x += dx;
			self.y += dy;
		}
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
		ctx.lineWidth = (self.selected||self.hilited) ? 4 :1 ;
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

	GObject.call(self);

	self.name = "S"+self.getId();

	self.x1 = 0;
	self.y1 = 0;
	self.x2 = 0;
	self.y2 = 0;

	self.draw = function(ctx,width,height) {

		ctx.strokeStyle = self.color;
		ctx.lineWidth = (self.selected||self.hilited) ? 4 : 1;
		ctx.beginPath();
		ctx.moveTo(self.x1,self.y1);
		ctx.lineTo(self.x2,self.y2);
		ctx.stroke();
	}

	self.isPicked = function(x,y) {
		var xp1 = self.x1-x;
		var yp1 = self.y1-y;
		var xp2 = x-self.x2;
		var yp2 = y-self.y2;
		var x12 = self.x1-self.x2;
		var y12 = self.y1-self.y2;
		
		var cos1 = ((xp1*x12)+(yp1*y12))/
				(Math.sqrt(xp1*xp1+yp1*yp1)*Math.sqrt(x12*x12+y12*y12));
		var cos2 = ((xp2*x12)+(yp2*y12))/
				(Math.sqrt(xp2*xp2+yp2*yp2)*Math.sqrt(x12*x12+y12*y12));
		var angle1 = Math.acos(cos1);
		var angle2 = Math.acos(cos2);
		
		if(Math.abs(angle1)>0.02) return false;
		if(Math.abs(angle2)>0.02) return false;
		return true;	
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
		ctx.lineWidth = (self.selected||self.hilited) ? 4 : 1;
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

function GEllipse() {
	
	var self = this;

	GObject.call(self);

	self.name = "E"+self.getId();

	self.po = {x:0,y:0};			// center
	self.cx = 0;
	self.cy = 0;
	self.sx = 0;
	self.sy = 0;

	self.draw = function(ctx,width,height) {
		ctx.strokeStyle = self.color;		
		ctx.lineWidth = self.selected ? 4 : 1;
	
		ctx.beginPath();
		for(var i=0;i<=100;i++) {
			var angle = i*Math.PI*2/100;
			var cos = Math.cos(angle);
			var sin = Math.sin(angle);
			var x = self.po.x + self.cx*cos + self.sx*sin;
			var y = self.po.y + self.cy*cos + self.sy*sin;
			if(i==0)
				ctx.moveTo(x,y);
			else
				ctx.lineTo(x,y);
		}
		ctx.stroke();
	}

	self.isPicked = function(x,y) {
		return false;
	}

}

GEllipse.prototype = Object.create(GObject.prototype);
GEllipse.prototype.constructor = GEllipse;

//****************************************************************************

function GAngle() {

	var self = this;
		
	GMeasurer.call(self);

	self.name = "A"+self.getId();

	self.value = 0;

	self.draw = function(ctx,width,height) {
		var pb = self.builder.parents[0];
		var pa = self.builder.parents[1];
		var pc = self.builder.parents[2];
		var po = {x:pa.x+100,y:pa.y};	// point on x axis

		var angle1 = computeAngle(po,pa,pb);
		var angle2 = computeAngle(pb,pa,pc);

		var radius = self.selected ? 20 : 10;

		ctx.fillStyle = self.color;
		ctx.beginPath();
		ctx.moveTo(pa.x,pa.y);
		if((Math.abs(self.value-Math.PI/2)<0.001)||(Math.abs(self.value+Math.PI/2)<0.001)) {
			var ac = Math.sqrt((pc.x-pa.x)*(pc.x-pa.x)+(pc.y-pa.y)*(pc.y-pa.y));
			var ab = Math.sqrt((pb.x-pa.x)*(pb.x-pa.x)+(pb.y-pa.y)*(pb.y-pa.y));
			var cx = radius/ac*(pc.x-pa.x);
			var cy = radius/ac*(pc.y-pa.y);
			var bx = radius/ab*(pb.x-pa.x);
			var by = radius/ab*(pb.y-pa.y);
			ctx.lineTo(pa.x+cx,pa.y+cy);
			ctx.lineTo(pa.x+cx+bx,pa.y+cy+by);
			ctx.lineTo(pa.x+bx,pa.y+by);
		}
		else if(angle2>0)
			ctx.arc(pa.x,pa.y,radius,-angle1,-angle1-angle2,true);
		else
			ctx.arc(pa.x,pa.y,radius,-angle1-angle2,-angle1,true);
		ctx.lineTo(pa.x,pa.y);
		ctx.fill();
	}

	self.getMessage = function() {
		var rvalue = (Math.round(self.value*1000)|0)/1000;
		var degrees = (Math.round(self.value*180/Math.PI*1000)|0)/1000;
		return rvalue+" radians   =   "+degrees+" degrees";	
	}

	function computeAngle(pb,pa,pc) {	
		var xab = pb.x-pa.x;

		var yab = pb.y-pa.y;
		var xac = pc.x-pa.x;
		var yac = pc.y-pa.y;

		var num = (xab*xac)+(yab*yac);
		var den1 = (xab*xab)+(yab*yab);
		var den2 = (xac*xac)+(yac*yac);

		var cos = num/(Math.sqrt(den1)*Math.sqrt(den2))
		var cross = xab*yac-xac*yab;
		
		return cross <0 ? Math.acos(cos) : -Math.acos(cos);
	}

}

GAngle.prototype = Object.create(GMeasurer.prototype);
GAngle.prototype.constructor = GAngle;

//****************************************************************************

function GPath() {

	var self = this;

	GMeasurer.call(self);

	self.value = 0;

	self.name = "M"+self.getId();

	self.draw = function() {
		if(!self.selected) return;
		ctx.strokeStyle = self.color;
		ctx.setLineDash([4,4]);
	
		var p = self.builder.parents;
		ctx.beginPath();
		for(var i=1;i<p.length;i++) {		
			if(i==0)
				ctx.moveTo(p[i].x,p[i].y);
			else
				ctx.lineTo(p[i].x,p[i].y);
		}
		ctx.stroke();
	}

	self.getMessage = function() {
		var ratio = (Math.round(self.value*10000)|0)/10000;
		return "Length = "+ratio;
	}
	
}

GPath.prototype = Object.create(GMeasurer.prototype);
GPath.prototype.constructor = GPath;

//****************************************************************************

function GArea() {

	var self = this;

	GMeasurer.call(self);

	self.value = 0;

	self.name = "R"+self.getId();

	self.draw = function(ctx,width,height) {
		ctx.globalAlpha = self.selected ? 1 : 0.1;

		ctx.fillStyle = self.color;
		ctx.beginPath();
		ctx.moveTo(self.builder.parents[1].x,self.builder.parents[1].y);
		for(var i=2;i<self.builder.parents.length;i++)  
			ctx.lineTo(self.builder.parents[i].x,self.builder.parents[i].y);
		ctx.closePath();
		ctx.fill();
	}


	self.getMessage = function() {
		var area = (Math.round(self.value*10000)|0)/10000;	
		return "Area = "+area;
	}
	
}

GArea.prototype = Object.create(GMeasurer.prototype);
GArea.prototype.constructor = GArea;

//****************************************************************************

function GTrace() {

	var self = this;

	GObject.call(self);

	var list = [];

	self.name = "T"+self.getId();

	self.draw = function(ctx,width,height) {	
		ctx.strokeStyle = self.color;
		ctx.lineWidth = self.selected ? 4 :1;
		ctx.beginPath();
		for(var i=0;i<list.length;i++)
			if(i==0) ctx.moveTo(list[i].x,list[i].y);
		else
			ctx.lineTo(list[i].x,list[i].y);
		ctx.stroke();
	}

	self.add = function(x,y) {
		var l = list.length;
		if(l==0)
			list.push({x,y});
		else if((list[l-1].x!=x)||(list[l-1].y!=y))
			list.push({x,y});
	}

	self.shift = function(dx,dy) {
		for(var i=0;i<list.length;i++) {
			list[i].x += dx;
			list[i].y += dy;
		}	
	}

	self.clear = function() {
		list = [];
	}
}

GTrace.prototype = Object.create(GObject.prototype);
GTrace.prototype.constructor = GTrace;

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
		ctx.fillCircle(x1,y1,3);
		ctx.fillCircle(x2,y2,3);

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

	Builder.call(self,
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
		ctx.fillCircle(x1,y1,3);
		ctx.fillCircle(x2,y2,3);

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
		ctx.fillCircle(w/2-9,h/2-8,3);
		ctx.fillCircle(w/2-7,h/2+12,3);
		ctx.fillCircle(w/2+10,h/2+3,3);
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

function EllipseBuilder() {

	var self = this;

	Builder.call(self,
		[GPoint,GPoint,GPoint],
		["Select the 1st focus","Select the 2nd focus",
			"Select a point on the ellipse"]
	);

	self.build = function() {
		var target = new GEllipse();
		target.builder = self;
		self.update(target);
		return target;
	}

	self.update = function(target) {
		var ellipse = target;
		var pa = self.parents[0];	// first focus
		var pb = self.parents[1];	// second focus
		var pc = self.parents[2];	// point on ellipse

		// distance from pc to pa and pb
		var a = Math.sqrt((pa.x-pc.x)*(pa.x-pc.x)+(pa.y-pc.y)*(pa.y-pc.y));
		var b = Math.sqrt((pb.x-pc.x)*(pb.x-pc.x)+(pb.y-pc.y)*(pb.y-pc.y));
		
		// distance between the two foci
		var d = Math.sqrt((pa.x-pb.x)*(pa.x-pb.x)+(pa.y-pb.y)*(pa.y-pb.y));

		// center		
		var po = {x:(pa.x+pb.x)/2,y:(pa.y+pb.y)/2};

		// vectors on the two axes
		var u = {x:pb.x-po.x,y:pb.y-po.y};
		var v = {x:po.y-pb.y,y:pb.x-po.x};

		// norm	
		var norm = Math.sqrt(u.x*u.x+u.y*u.y);

		// point of ellipse is   P = C*cos(theta)*u + S*sin(theta)*v;
	
		var C = (a+b)/2;
		var S = Math.sqrt((a+b)*(a+b)-d*d)/2;

		ellipse.cx = C*u.x/norm;
		ellipse.sx = S*v.x/norm;
		ellipse.cy = C*u.y/norm;
		ellipse.sy = S*v.y/norm;
		ellipse.po = po;	

		return true;
	}

	self.drawIcon = function(ctx,w,h) {	
		ctx.fillStyle = "white";
		ctx.fillCircle(w/2-8,h/2,3);
		ctx.fillCircle(w/2+8,h/2,3);
		ctx.fillCircle(w/2+4,h/2-8,3);

		ctx.strokeStyle = GREEN;
		ctx.beginPath();
		for(var i=0;i<=10;i++) {
			var angle = i*Math.PI*2/10;
			var cos = Math.cos(angle);
			var sin = Math.sin(angle);
			if(i==0)
				ctx.moveTo(w/2+16*cos,h/2+9*sin);
			else
				ctx.lineTo(w/2+16*cos,h/2+9*sin);
			ctx.stroke();
		}		
	}

	self.getHelp = function() {
		return "Build an ellipse from its two foci";
	}

		
}

EllipseBuilder.prototype = Object.create(Builder.prototype);
EllipseBuilder.prototype.constructor = EllipseBuilder;

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
		ctx.strokeLine(w/2-6,h/2-14,w/2+6,h/2+14);
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

	Builder.call(self,
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
		ctx.fillCircle(w/2-10,h/2+10,3);
		ctx.fillCircle(w/2+10,h/2-10,3);
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
		ctx.fillCircle(w/2,h/2,3);
		ctx.fillCircle(w/2+10,h/2+10,3);
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
		ctx.fillCircle(w/2+8,h/2+8,3);

		ctx.strokeStyle = GREEN;
		ctx.strokeLine(w/2+13,h/2+13,w/2-13,h/2-13);
	}

	self.getHelp = function() {
		return "Build a perpendicular line through a point";
	}

}

PerpendicularBuilder.prototype = Object.create(Builder.prototype);
PerpendicularBuilder.prototype.constructor = PerpendicularBuilder;

//****************************************************************************

function ParallelBuilder() {

	var self = this;

	Builder.call(self,
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
		ctx.fillCircle(w/2+6,h/2+6,3);
		ctx.strokeStyle = GREEN;		
		ctx.strokeLine(w/2-3,h/2+16,w/2+16,h/2-3);
	}

	self.getHelp = function() {
		return "Build a parallel line through a point";
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
			var x1 = w/2-11;
			var y1 = h/2-12;
			var x2 = w/2+11;
			var y2 = h/2-12;
			var x3 = w/2;
			var y3 = h/2+9;
			ctx.fillStyle = "white";
			ctx.fillCircle(x1,y1,3);
			ctx.fillCircle(x2,y2,3);
			ctx.fillCircle(x3,y3,3);
		
			ctx.strokeStyle = "white";	
			ctx.lineWidth = 2.5;
			ctx.setLineDash([3,3]);
			ctx.strokeLine(x1,y1,x3,y3);
			ctx.strokeLine(x2,y2,x3,y3);

			ctx.strokeStyle = GREEN;
			ctx.setLineDash([]);
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

	Builder.call(self,
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
		var p1 = self.parents[0];
		var line2 = self.parents[1];
		var d = line2.a*line2.a+line2.b*line2.b;
		point.y = line2.a*(line2.a*p1.y-line2.b*point1.x)-line2.b*line2.c;
		point.y = point.y/d;
		point.x = line2.b*(line2.b*p1.x-line2.a*point1.y)-line2.a*line2.c;
		point.x = point.x/d;
	
		point.valid = (!isNaN(point.x))&&(!isNaN(point.y));	
		return point.valid;
	}

	self.drawIcon = function(ctx,w,h) {
		ctx.fillStyle = "white";
		ctx.fillCircle(w/2+6,h/2+6,3);

		ctx.strokeStyle = "white";
		ctx.lineWidth =2;		
		ctx.strokeLine(w/2-18,h/2+6,w/2+6,h/2-18);

		ctx.setLineDash([3,3]);
		ctx.strokeLine(w/2+6,h/2+6,h/2-6,h/2-6);

		ctx.fillStyle = GREEN;		
		ctx.fillCircle(w/2-6,h/2-6,3);
	}

	self.getHelp = function() {
		return "Project a point to a line";
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
		ctx.strokeLine(w/2-10,h/2+17,w/2+17,h/2-10);	
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

function  PointOnSegmentBuilder() {

	var self = this;

	Builder.call(self,
		[GSegment],
		["Select the segment"]
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

		var segment = self.parents[0];
		if(!segment.valid) return point.valid = false;

		var pa = segment.builder.parents[0];
		var pb = segment.builder.parents[1];

		if(point.data) {
			// keep the same ratio
			point.x = pa.x + point.data*(pb.x-pa.x);
			point.y = pa.y + point.data*(pb.y-pa.y);
		}
		else {
			var a = (pb.x-pa.x);
			var b = (pb.y-pa.y);
			var c = -point.x*a-point.y*b;
			var d = -pa.x*b+pa.y*a;
			
			var x = (-d*b-c*a)/(a*a+b*b);
			var y = (d*a-c*b)/(a*a+b*b);

			var da = (x-pa.x)*(x-pa.x)+(y-pa.y)*(y-pa.y);
			var db = (x-pb.x)*(x-pb.x)+(y-pb.y)*(y-pb.y);
			var prod = (x-pa.x)*(y-pb.y)+(x-pb.x)*(y-pa.y);
			if(prod>0) {
				// point within the segment
				point.x = x;
				point.y = y;
			} 
			else {
				if(da<db) {
					// force point to be pa
					point.x = pa.x;
					point.y = pa.y;
				}
				else {
					// force point to be pb
					point.x = pb.x;
					point.y = pb.y;
				}
			}

			// save ratio
			var ab = (pa.x-pb.x)*(pa.x-pb.x)+(pa.y-pb.y)*(pa.y-pb.y);
			point.data = Math.sqrt(da/ab);
		}


		return true;
	}

	self.drawIcon = function(ctx,w,h) {
		var x1 = w/2-9;
		var y1 = h/2+9;
		var x2 = w/2+9;
		var y2 = h/2-9;

		ctx.fillStyle = "white";
		ctx.fillCircle(x1,y1,3);
		ctx.fillCircle(x2,y2,3);
			
		ctx.strokeStyle = "white";
		ctx.lineWidth =2;
		ctx.beginPath();
		ctx.moveTo(x1,y1);
		ctx.lineTo(x2,y2);
		ctx.stroke();

		ctx.fillStyle = "red";
		ctx.fillCircle(w/2+3,h/2-3,3);
	}

	self.getHelp = function() {
		return "Constrain a point on a segment";
	}
}

PointOnSegmentBuilder.prototype = Object.create(Builder.prototype);
PointOnSegmentBuilder.prototype.constructor = PointOnSegmentBuilder;

//****************************************************************************

function  PointOnLineBuilder() {

	var self = this;

	Builder.call(self,
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

		if(self.parents[0] instanceof GLine) {
			var line = self.parents[0];

			if(!line.valid) return point.valid = false;

			var d = line.a*line.a+line.b*line.b;
			var y = line.a*(line.a*point.y-line.b*point.x)-line.b*line.c;
			y = y/d;
			var x = line.b*(line.b*point.x-line.a*point.y)-line.a*line.c;
			x = x/d;
			point.x = x;		
			point.y = y;
			}

		if(self.parents[0] instanceof GSegment) {
			var segment = self.parents[0];
			var pa = segment.builder.parents[0];
			var pb = segment.builder.parents[1];

			var a = (pb.x-pa.x);
			var b = (pb.y-pa.y);
			var c = -point.x*a-point.y*b;
			var d = -pa.x*b+pa.y*a;
			
			point.x = (-d*b-c*a)/(a*a+b*b);
			point.y = (d*a-c*b)/(a*a+b*b);
		}

		return true;
	}

	self.drawIcon = function(ctx,w,h) {
        ctx.strokeStyle = "white";
		ctx.lineWidth = 2;
		ctx.strokeLine(w/2-14,h/2+14,w/2+14,h/2-14);
		ctx.fillStyle = "red";
		ctx.fillCircle(w/2+7,h/2-7,3);
	}

	self.getHelp = function() {
		return "Constrain a point on a line";
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
		ctx.fillCircle(w/2+10,h/2+10,3);
	}

	self.getHelp = function() {
		return "Constrain a point on a circle";
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
		ctx.fillCircle(w/2-6,h/2-6,3);
		ctx.fillCircle(w/2+6,h/2+6,3);
	}

	self.getHelp = function() {
		return "Build the intersections of two circles";
	}

}

CircleIntersectionBuilder.prototype = Object.create(Builder.prototype);
CircleIntersectionBuilder.prototype.constructor = CircleIntersectionBuilder;

//****************************************************************************

function TangentBuilder() {

	var self = this;

	Builder.call(self,
		[GCircle,GPoint],
		["Select the circle","Select the point"]
	);

	self.build = function() {
		var targets = [new GLine(),new GLine()];

		targets[0].builder = self;
		targets[0].data = 1;

		targets[1].builder = self;
		targets[1].data = -1;

		self.update(targets[0]);
		self.update(targets[1]);
		return targets;
	}

	self.update = function(target) {	
		var line = target;
		var circle = self.parents[0];
		var point = self.parents[1];
	
		if(!circle.valid) return point.valid = false;	

		// mid distance point, center of virtual circle
		var po = {x:(circle.x+point.x)/2,y:(circle.y+point.y)/2};
	
		// distance between the centers of the circles = radius of virtual circle
		var radius = (point.x-po.x)*(point.x-po.x)+(point.y-po.y)*(point.y-po.y);
		radius = Math.sqrt(radius);		
		if(radius<circle.r/2) return point.valid = false;	

		var a = circle.r*circle.r/(2.0*radius);
		var h = Math.sqrt(circle.r*circle.r-a*a);

		// tangent point
		var tp = {};
		tp.x = circle.x + a*(po.x-circle.x)/radius + line.data*h*(po.y-circle.y)/radius;
		tp.y = circle.y + a*(po.y-circle.y)/radius - line.data*h*(po.x-circle.x)/radius;

		// line through initial point and tangent point
		var dx = point.x - tp.x;
		var dy = point.y - tp.y;

        if(Math.abs(dx)<1.e-5) {
            line.a = 0;
            line.b = 1;
            line.c = -point.x;
        }
        else if(Math.abs(dy)<1.e-5) {
            line.a = 0;
            line.b = 1;
            line.c = -point.y;
        }
        else if(Math.abs(dx)<Math.abs(dy)) {
            line.a = 1;
            line.b = -dx/dy;
            line.c = -line.a*point.x -line.b*point.y;
        }
        else {
            line.a = -dy/dx;
            line.b = 1;
            line.c = -line.a*point.x-line.b*point.y;
        }
		return true;
	}

	self.drawIcon = function(ctx,w,h) {
		ctx.strokeStyle = "white";
		ctx.strokeCircle(w/2-8,h/2-1,10);
		ctx.fillStyle = "white";
		ctx.fillCircle(w/2+13,h/2-0,3);
		ctx.strokeStyle = GREEN;
		ctx.strokeLine(w/2-15,h/2-18,w/2+15,h/2);
		ctx.strokeLine(w/w-12,h/2+19,w/2+15,h/2);
	}

	self.getHelp = function() {		
		return "Build tangent lines to a circle"
	}	
}

TangentBuilder.prototype = Object.create(Builder.prototype);
TangentBuilder.prototype.constructor = TangentBuilder;

//****************************************************************************

function TranslationBuilder() {

	var self = this;

	Builder.call(self,
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
		ctx.fillCircle(w/2-10,h/2-9,3);
		ctx.fillCircle(w/2+11,h/2-9,3);
		ctx.strokeLine(w/2-10,h/2-9,w/2+11,h/2-9);		
		ctx.fillCircle(w/2-10,h/2+8,3);

		ctx.setLineDash([3,3]);
		ctx.strokeLine(w/2-10,h/2+8,w/2+12,h/2+8);

		ctx.fillStyle = GREEN;
		ctx.fillCircle(w/2+11,h/2+8,3);
	}

	self.getHelp = function() {
		return "Build a translated point";
	}

}

TranslationBuilder.prototype = Object.create(Builder.prototype);
TranslationBuilder.prototype.constructor = TranslationBuilder;

//****************************************************************************

function ProjectionOnSegmentBuilder() {

	var self = this;

	Builder.call(self,
		[GPoint,GSegment],
		["Select the point to project","Select the segment to project to"]
	);

	self.build = function() {
		var target = new GPoint();
		target.builder = self;
		self.update(target);
		return target;
	}

	self.update = function(target) {
		var point = target;
		var segment = self.parents[1];			

		var pa = segment.builder.parents[0];
		var pb = segment.builder.parents[1];
		var pc = self.parents[0];

		var a = (pb.x-pa.x);
		var b = (pb.y-pa.y);
		var c = -pc.x*a-pc.y*b;
		var d = -pa.x*b+pa.y*a;

		point.x = (-d*b-c*a)/(a*a+b*b);
		point.y = (d*a-c*b)/(a*a+b*b);
	
		point.valid = (!isNaN(point.x))&&(!isNaN(point.y));	
		return point.valid;
	}

	self.drawIcon = function(ctx,w,h) {
		ctx.fillStyle = "white";
		ctx.fillCircle(w/2+6,h/2+6,3);

		ctx.strokeStyle = "white";
		ctx.lineWidth =2;		
		ctx.strokeLine(w/2-15,h/2+5,w/2+5,h/2-15);

		ctx.fillCircle(w/2-15,h/2+5,3);
		ctx.fillCircle(w/2+5,h/2-15,3);

		ctx.setLineDash([3,3]);
		ctx.strokeLine(w/2+6,h/2+6,h/2-7,h/2-7);

		ctx.fillStyle = GREEN;		
		ctx.fillCircle(w/2-5,h/2-5,3);
	}

	self.getHelp = function() {
		return "Project a point to a segment";
	}
}

ProjectionOnSegmentBuilder.prototype = Object.create(Builder.prototype);
ProjectionOnSegmentBuilder.prototype.constructor = ProjectionOnSegmentBuilder;

//****************************************************************************

function EquilateralBuilder() {

	var self = this;

	Builder.call(self,	
		[GSegment],
		["Select the base segment"]
	);

	
	self.build = function() {
		var target = new GPoint();
		target.builder = self;
		self.update(target);
		return target;
	}

	self.update = function(target) {
		var point = target;
		var segment = self.parents[0];

		var pa = segment.builder.parents[0];
		var pb = segment.builder.parents[1];

		var vx = pb.x-pa.x;
		var vy = pb.y-pa.y;

		var newx = vx/2+vy*Math.sqrt(3)/2;
		var newy = vy/2-vx*Math.sqrt(3)/2;
	
		point.x = newx + pa.x;
		point.y = newy + pa.y;
	
		point.valid = (!isNaN(point.x))&&(!isNaN(point.y));	
		return point.valid;
	}

	self.drawIcon = function(ctx,w,h) {
		ctx.fillStyle = "white";
		ctx.strokeStyle = "white";
		ctx.fillCircle(w/2-11,h/2+7,3);
		ctx.fillCircle(w/2+11,h/2+7,3);
		ctx.lineWidth = 2;
		ctx.strokeLine(w/2-11,h/2+7,w/2+11,h/2+7);

		ctx.setLineDash([3,3]);
		ctx.strokeLine(w/2-11,h/2+7,w/2,h/2-9);
		ctx.strokeLine(w/2+11,h/2+7,w/2,h/2-9);

		ctx.fillStyle = GREEN;
		ctx.fillCircle(w/2,h/2-9,3);
	}

	self.getHelp = function() {
		return "Build an equilateral triangle from a segment";
	}
}

EquilateralBuilder.prototype = Object.create(Builder.prototype);
EquilateralBuilder.prototype.constructor = EquilateralBuilder;

//****************************************************************************

function CircleCenterBuilder() {

	var self = this;

	Builder.call(self,
		[GCircle],
		["Select the circle"]
	);

	self.build = function() {
		var target = new GPoint();
		target.builder = self;
		self.update(target);
		return target;
	}

	self.update = function(target) {
		var point = target;
		var circle = self.parents[0];

		if(!circle.valid) return point.valid = false;

		point.x = circle.x;
		point.y = circle.y;
	
		return true;
	}


	self.drawIcon = function(ctx,w,h) {
		ctx.strokeStyle = "white";
		ctx.strokeCircle(w/2,h/2,14);
		ctx.fillStyle = GREEN;
		ctx.fillCircle(w/2,h/2,3);
	}

	self.getHelp = function() {
		return "Build the center of a circle";
	}

}

CircleCenterBuilder.prototype = Object.create(Builder.prototype);
CircleCenterBuilder.prototype.constructor = CircleCenterBuilder;

//****************************************************************************

function AngleBuilder() {

	var self = this;

	Builder.call(self,
		[GPoint,GPoint,GPoint],		
		["Select the 1st point","Select the 2n point","Select the 3rd point"]
	);

	
	self.build = function() {
		var target = new GAngle();
		target.builder = self;
		self.update(target);
		return target;
	}

	self.update = function(target) {
		var angle = target;
		var pb = self.parents[0];
		var pa = self.parents[1];
		var pc = self.parents[2];
		var xab = pb.x-pa.x;

		var yab = pb.y-pa.y;
		var xac = pc.x-pa.x;
		var yac = pc.y-pa.y;

		var num = (xab*xac)+(yab*yac);
		var den1 = (xab*xab)+(yab*yab);
		var den2 = (xac*xac)+(yac*yac);

		var cos = num/(Math.sqrt(den1)*Math.sqrt(den2))
		
		var cross = xab*yac-xac*yab;
		
		angle.value = cross <0 ? Math.acos(cos) : -Math.acos(cos);
		return true;
	}

	self.drawIcon = function(ctx,w,h) {
		var x1 = w/2-11;
		var y1 = h/2-12;
		var x2 = w/2+11;
		var y2 = h/2-12;
		var x3 = w/2;
		var y3 = h/2+9;
		ctx.fillStyle = "white";
		ctx.fillCircle(x1,y1,3);
		ctx.fillCircle(x2,y2,3);
		ctx.fillCircle(x3,y3,3);

		ctx.fillStyle = BLUE;
		ctx.beginPath();
		ctx.moveTo(x3,y3);
		ctx.arc(x3,y3,18,-Math.PI*0.32,-0.67*Math.PI,true);
		ctx.lineTo(x3,y3);
		ctx.fill();

		ctx.strokeStyle = "white";
		ctx.lineWidth = 2.5;
		ctx.setLineDash([3,3]);
		ctx.strokeLine(x1,y1,x3,y3);
		ctx.strokeLine(x2,y2,x3,y3);

	}

	self.getHelp = function() {
		return "Measure an angle";
	}
}

AngleBuilder.prototype = Object.create(Builder.prototype);
AngleBuilder.prototype.constructor = AngleBuilder;

//****************************************************************************

function SquareBuilder() {

	var self = this;
	
	Builder.call(self,
		[GSegment],
		["Select the base segment"]
	);

	self.build = function() {
		var point1= new GPoint();
		point1.builder = self;
		point1.data = 0;
	
		var point2 = new GPoint();
		point2.builder = self;
		point2.data = 1;

		var target = [point1,point2];

		self.update(point1);
		self.update(point2);

		return target;
	}

	self.update = function(target) {
	
		var point = target;
		var segment = self.parents[0];
	
		var pa = segment.builder.parents[0];
		var pb = segment.builder.parents[1];

		var dx = pb.x-pa.x;
		var dy = pb.y-pa.y;

		if(point.data==0) {
			point.x = pb.x + dy;
			point.y = pb.y - dx;
		} else {
			point.x = pb.x + dy -dx;
			point.y = pb.y - dx -dy;
		}
		
		return true;
	}

	self.drawIcon = function(ctx,w,h) {
		var x1 = w/2-10;
		var y1 = h/2-10;
		var x2 = w/2+10;
		var y2 = h/2+10;
		var x3 = w/2-10;
		var y3 = h/2+10;
		var x4 = w/2+10;
		var y4 = h/2-10;
		ctx.fillStyle = "white";
		ctx.fillCircle(x3,y3,3);
		ctx.fillCircle(x2,y2,3);
	
		ctx.strokeStyle = "white";
		ctx.lineWidth = 2;
		ctx.strokeLine(x3,y3,x2,y2);

		ctx.setLineDash([3,3]);
		ctx.strokeLine(x2,y2,x4,y4);
		ctx.strokeLine(x4,y4,x1,y1);
		ctx.strokeLine(x1,y1,x3,y3);
	
		ctx.fillStyle = GREEN;
		ctx.fillCircle(x1,y1,3);
		ctx.fillCircle(x4,y4,3);
	}

	self.getHelp = function() {
		return "Build a square from a segment";
	}
}

SquareBuilder.prototype = Object.create(Builder.prototype);
SquareBuilder.prototype.constructor = SquareBuilder;

//****************************************************************************

function PathBuilder() {

	var self = this;

	Builder.call(self);

	var step = 0;
	var types = [GSegment,GPoint];
	var prompts = ["Select the unit segment","Select a point or close the shape"];
	self.build = function() {
		var target = new GPath();
		target.builder = self;
		self.update(target);
		return target;
	}

	// overwrite default methods
	self.getPrompt = function() {
		var l = self.parents.length;
		if(step==0)
			return prompts[0];
		else if(step<=2)
			return "Select point "+step;
		else if(self.parents[l-1]==self.parents[l-2])
			// last selected point finish the path
			return null;
		else
			return "Select point "+step+" or repeat the point to finish";
	}

	self.getParentType = function() {
		if(step==0)
			return types[0];
		else
			return types[1];
	}
	
	self.setParent = function(obj) {
		self.parents.push(obj);
		step++;
		return true;
	}
	self.update = function(target) {
		var path = target;
		var segment = self.parents[0];
		var pa = segment.builder.parents[0];
		var pb = segment.builder.parents[1];
		var norm = Math.sqrt((pa.x-pb.x)*(pa.x-pb.x)+(pa.y-pb.y)*(pa.y-pb.y));

		var length = 0;
		var n = self.parents.length;
		for(var i=1;i<n-1;i++) {
			pa = self.parents[i];
			pb = self.parents[i+1];
			var d = Math.sqrt((pa.x-pb.x)*(pa.x-pb.x)+(pa.y-pb.y)*(pa.y-pb.y));
			length += d;
		}

		path.value = length/norm;
		return true;
	}

	function norm(pa,pb) {
		return Math.sqrt((pa.x-pb.x)*(pa.x-pb.x)+(pa.y-pb.y)*(pa.y-pb.y));
	}

	self.drawIcon = function(ctx,w,h) {
		var x1 = w/2-14;
		var y1 = h/2-14;
		var x2 = w/2+6;
		var y2 = h/2-10;
		var x3 = w/2+10;
		var y3 = h/2+1;
		var x4 = w/2+4;
		var y4 = h/2+10;
		var x5 = w/2-12;
		var y5 = h/2+1;

		ctx.strokeStyle = BLUE;	
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(x1,y1);
		ctx.lineTo(x2,y2);
		ctx.lineTo(x3,y3);
		ctx.lineTo(x4,y4);
		ctx.lineTo(x5,y5);
		ctx.stroke();
		
		ctx.fillStyle = "white";
		ctx.fillCircle(x1,y1,2);
		ctx.fillCircle(x2,y2,2);
		ctx.fillCircle(x3,y3,2);
		ctx.fillCircle(x4,y4,2);
		ctx.fillCircle(x5,y5,2);
	}

	self.getHelp = function() {
		return "Measure a path";
	}
}

PathBuilder.prototype = Object.create(Builder.prototype);
PathBuilder.prototype.constructor = PathBuilder;

//****************************************************************************

function AreaBuilder() {

	var self = this;

	Builder.call(self);

	var step = 0;
	var types = [GSegment,GPoint];
	var prompts = ["Select the unit segment","Select a point or close the shape"];

	// overwrite default methods
	self.getPrompt = function() {
		if(step==0)
			return prompts[0];
		else if(step<=2)
			return "Select point "+step+" or close the shape";
		else if(self.parents[self.parents.length-1]==self.parents[1])
			// last selected point closes the shape
			return null;
		else
			return "Select point "+step+" or close the shape";
	}

	self.getParentType = function() {
		if(step==0)
			return types[0];
		else
			return types[1];
	}
	
	self.setParent = function(obj) {
		self.parents.push(obj);
		step++;
		return true;
	}

	self.build = function() {
		var target = new GArea();
		target.builder = self;
		self.update(target);
		return target;
	}

	self.update = function(target) {
		var area = target;
		var segment = self.parents[0];
		var pa = segment.builder.parents[0];
		var pb = segment.builder.parents[1];
		var norm = (pa.x-pb.x)*(pa.x-pb.x)+(pa.y-pb.y)*(pa.y-pb.y);

		var sum = 0;
		for(var i=1;i<self.parents.length;i++) {
			var j = (i==self.parents.length-1) ? 1 : i+1;
			sum += self.parents[i].x*self.parents[j].y
				-self.parents[i].y*self.parents[j].x;
		}
		area.value = sum/norm/2;
		return true;
	}

	self.drawIcon = function(ctx,w,h) {
		var x1 = w/2-14;
		var y1 = h/2-14;
		var x2 = w/2+6;
		var y2 = h/2-10;
		var x3 = w/2+10;
		var y3 = h/2+1;
		var x4 = w/2+4;
		var y4 = h/2+10;
		var x5 = w/2-12;
		var y5 = h/2+1;

		ctx.fillStyle = BLUE;	
		ctx.beginPath();
		ctx.moveTo(x1,y1);
		ctx.lineTo(x2,y2);
		ctx.lineTo(x3,y3);
		ctx.lineTo(x4,y4);
		ctx.lineTo(x5,y5);
		ctx.closePath();
		ctx.fill();
		
		ctx.fillStyle = "white";
		ctx.fillCircle(x1,y1,2);
		ctx.fillCircle(x2,y2,2);
		ctx.fillCircle(x3,y3,2);
		ctx.fillCircle(x4,y4,2);
		ctx.fillCircle(x5,y5,2);
	}

	self.getHelp = function() {
		return "Measure an area";
	}
}

AreaBuilder.prototype = Object.create(Builder.prototype);
AreaBuilder.prototype.constructor = AreaBuilder;

//****************************************************************************

function TraceBuilder() {

	var self = this;

	Builder.call(self,
		[GPoint],
		["Select the point to trace"]
	);

	self.build = function() {
		var target = new GTrace();
		target.builder = self;
		self.update(target);
		return target;
	}

	self.update = function(target) {		
		var trace = target;
		var point = self.parents[0];
		trace.add(point.x,point.y);
		return true;
	}

	self.drawIcon = function(ctx,w,h) {
		ctx.lineWidth = 2;
		ctx.strokeStyle = BLUE;
		ctx.beginPath();
		ctx.moveTo(w/2-15,h/2-15);
		ctx.lineTo(w/2+3,h/2-12);
		ctx.lineTo(w/2+10,h/2-7);
		ctx.lineTo(w/2+4,h/2-2);
		ctx.lineTo(w/2-5,h/2+3);
		ctx.lineTo(w/2+7,h/2+6);
		ctx.lineTo(w/2+12,h/2+12);
		ctx.stroke();
		ctx.fillStyle = "white";
		ctx.fillCircle(w/2+12,h/2+12,3);
	}

	self.getHelp = function() {
		return "Trace a point";
	}
}

TraceBuilder.prototype = Object.create(Builder.prototype);
TraceBuilder.prototype.constructor = TraceBuilder;

