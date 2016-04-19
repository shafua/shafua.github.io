var CONFIG = {
	standarttime: 1500,
	startPont: [.5, .5]
};

var BALL = {
	element: ball_element,
	currentPoint: CONFIG.startPont,
	nextPoint: getRandomDestinationPoint(),
	destinationPoint: [],
	destinationIntersected: false,
	move: function (to) {
		to = to || BALL.nextPoint;

		BALL.FLAGS.movingtop = BALL.currentPoint[1] != to[1];
		BALL.FLAGS.movingleft = BALL.currentPoint[0] != to[0];

		var distance = Math.sqrt( Math.pow( to[0] - BALL.currentPoint[0] , 2 ) + Math.pow( to[1] - BALL.currentPoint[1] , 2 ) );
		var travelTime = CONFIG.standarttime * distance;

		this.element.setAttribute("style","left:"+(to[0]*100)+"%;top:"+(to[1]*100)+"%;transition-duration:"+travelTime+"ms;")
	},
	FLAGS: {
		movingtop: false,
		movingleft: false
	}
}; 

BALL.element.addEventListener('transitionend', function(e) {
	if (BALL.FLAGS.movingtop && BALL.FLAGS.movingleft) {
		BALL.FLAGS["moving"+e.propertyName] = false;
		return;
	};
	BALL.currentPoint = [BALL.nextPoint[0], BALL.nextPoint[1] ]
	BALL.nextPoint =  [BALL.destinationPoint[0], BALL.destinationPoint[1] ]

	BALL.destinationPoint = getDestinationPoint(BALL.currentPoint, BALL.nextPoint, [barrier], BALL.destinationIntersected);
	BALL.destinationIntersected = false;

	BALL.move(BALL.nextPoint);
	intercept(BALL);
});

barrier = new Barrier(button);
button.onclick = function () {
	start();
	return false
};

window.onresize = function () {
	var styles = window.getComputedStyle(BALL.element),
		parentWidth = BALL.element.offsetParent.offsetWidth,
		parentHeight = BALL.element.offsetParent.offsetHeight;
	BALL.currentPoint = [styles.getPropertyValue("left")/parentWidth, styles.getPropertyValue("top")/parentHeight ];
	BALL.FLAGS.movingtop = BALL.FLAGS.movingleft = false;
	BALL.element.setAttribute("style","left:"+(BALL.currentPoint[0]*100)+"%;top:"+(BALL.currentPoint[1]*100)+"%;")
}

function intercept(ball, s, e) {
	s = s || "nextPoint";
	e = e || "destinationPoint";
	var intersection = barrier.check(ball[s], ball[e]);
	if (!intersection) return;

	ball[e] = [intersection[0], intersection[1]];

	if (s==="nextPoint") ball.destinationIntersected = intersection[2];
}

function start() {
	intercept(BALL, "currentPoint", "nextPoint");
	BALL.destinationPoint = getDestinationPoint(BALL.currentPoint, BALL.nextPoint, [barrier]);
	intercept(BALL);
	BALL.move(BALL.nextPoint);
}



function getRandomDestinationPoint () {
		var projection = Math.random() * 4;
		// integer part of projection: id of screen side; fractional part: position on that side
		return projection < 2 ? ( projection  < 1 ? [0, projection] : [projection - 1, 0] ) : ( projection < 3 ? [0, projection - 2] : [projection - 3, 1] )
}

function getIntersectionOf2Straights (y, k, f1, x1) {
		return (y - f1) * k + x1
}

function isEnteringIntoaSegment (segment, coordinate) {
		return (coordinate > segment[0]) && (coordinate < segment[1])
}


function getDestinationPoint(currentPoint, nextPoint, barriers, intersectionSide) {
	var vector = [nextPoint[0] - currentPoint[0], nextPoint[1] - currentPoint[1]], coordinate;
	//+(vector[0] > 0) // +(vector[1] > 0)
	if (vector[0]===0) return [nextPoint[0], +!(nextPoint[1])];
	if (vector[1]===0) return [+!(nextPoint[0]) , nextPoint[1]];
	var rect = intersectionSide ? 
		(intersectionSide[0] === "x" ? 
									(intersectionSide[1] ?  [ [0,1], [nextPoint[1], 1]] : [ [0,1], [0, nextPoint[1] ]] ) : 
									(intersectionSide[1] ?  [ [nextPoint[0], 1], [0,1]] : [ [0, nextPoint[0] ], [0,1]] )
		) : 
		[ [0,1], [0,1] ];

	return checkRect(rect, currentPoint, nextPoint)
	function checkRect(rect, currentPoint, nextPoint) {
		if (nextPoint[0]!==rect[0][0]){
			coordinate = getIntersectionOf2Straights(0, -vector[1]/vector[0], nextPoint[0],  nextPoint[1]);
			if (isEnteringIntoaSegment(rect[1], coordinate) ) return [rect[0][0], coordinate];
		};

		if (nextPoint[0]!==rect[0][1]){
			coordinate = getIntersectionOf2Straights(1, -vector[1]/vector[0], nextPoint[0],  nextPoint[1]);
			if (isEnteringIntoaSegment(rect[1], coordinate) ) return [rect[0][1], coordinate];
		};

		if (nextPoint[1]!==rect[1][0]){
			coordinate = getIntersectionOf2Straights(0, -vector[0]/vector[1], nextPoint[1],  nextPoint[0]);
			if (isEnteringIntoaSegment(rect[0], coordinate) ) return [coordinate, rect[1][0]];
		};

		if (nextPoint[1]!==rect[1][1]){
			coordinate = getIntersectionOf2Straights(1, -vector[0]/vector[1], nextPoint[1],  nextPoint[0]);
			if (isEnteringIntoaSegment(rect[0], coordinate) ) return [coordinate, rect[1][1]];
		};
	}
}

function Barrier(element) {
	this.element = element;
	var radius = BALL.element.offsetWidth/2;

	var __xSegmentCache, __ySegmentCache, __parentWidthCache, __parentHeightCache;

	this.xSegment = function () {
		var parentWidth = element.offsetParent.offsetWidth;
		if (parentWidth === __parentWidthCache) return __xSegmentCache;
		__parentWidthCache = parentWidth;
		return __xSegmentCache = [(element.offsetLeft - radius) / parentWidth, (element.offsetLeft + element.offsetWidth + radius) / parentWidth]
	}
	this.ySegment = function () {
		var parentHeight = element.offsetParent.offsetHeight;
		if (parentHeight === __parentHeightCache) return __ySegmentCache;
		__parentHeightCache = parentHeight;
		return __ySegmentCache = [(element.offsetTop - radius) / parentHeight, (element.offsetTop + element.offsetHeight + radius) / parentHeight]
	}

	this.check = function (p1,p2) {
		var k = (p2[1] - p1[1])/(p2[0] - p1[0]), // k for y=; for x= use 1/k
			coordinate, intersectionDirection;

		aboveMap = this.__pointAboveWhat(p1);

		for (var i = 0; i < 4; i++) {
			if (!aboveMap[i]) continue;
			intersectionDirection = i%2 ? [this.ySegment()[ +(i - 2 >= 0) ], 1/k, p1[1], p1[0], "x"] : [this.xSegment()[ +(i - 2 >= 0) ], k, p1[0], p1[1], "y"] ;
			coordinate = getIntersectionOf2Straights(intersectionDirection[0], intersectionDirection[1], intersectionDirection[2], intersectionDirection[3]);
			if ( isEnteringIntoaSegment(this[ intersectionDirection[4]+"Segment" ](), coordinate) ) {
				return intersectionDirection[4] === "x" ? 
												[ coordinate, intersectionDirection[0], ["x",+(i - 2 >= 0)]] : 
												[ intersectionDirection[0], coordinate, ["y",+(i - 2 >= 0)]] ;
				}
		}
	}

	this.__pointAboveWhat = function (p) {
		return [
			 p[0] < this.xSegment()[0],
			 p[1] < this.ySegment()[0],
			 p[0] > this.xSegment()[1],
			 p[1] > this.ySegment()[1]
		 ]
	}

}