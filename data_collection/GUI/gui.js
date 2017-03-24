//constants
var LINEWIDTH = 1;
var X = 0;
var Y = 1;

//Global variables
var canvasPerm, contextPerm, canvas, context; //permanent and temorary canvases
var backgroundCanvas, backgroundContext; //unsure why these are herenon

// The active tool instance.
var tool, toollist;
var toolDefault = 'add';

// This object holds the implementation of each drawing tool.
var tools = {};

var nodes = []; //array of nodes
var edges = []; //array of the id's of the nodes
var undo = [];
var redo = [];

var new_id = 0;
var radius = 3;
var scale = 1; //the scale value
var ppm = null; //save pixels per meter value for uploaded graphs

//Initialization~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  
function init () {
  // Find the canvas elements.
  canvasPerm = document.getElementById('canvasPerm');
  canvas = document.getElementById('canvas');
  backgroundCanvas = document.getElementById('backgroundCanvas');

  // Get the 2D canvas contexts.
  contextPerm = canvasPerm.getContext('2d');
  context = canvas.getContext('2d');
  backgroundContext = backgroundCanvas.getContext('2d');

  //add all event listeners    
  toollist = document.getElementsByName("tool"); 
  for(var i = 0; i < toollist.length; i++) {  
    toollist[i].addEventListener('change', ev_tool_change, false);
  }

  //radius event listener goes here

  // Attach the mousedown, mousemove and mouseup event listeners.
  canvas.addEventListener('mousedown', ev_canvas, false);
  canvas.addEventListener('mousemove', ev_canvas, false);
  canvas.addEventListener('mouseup',   ev_canvas, false);

  //event listeners for all other elements:
  //node type selection tool
  document.getElementById('nodeType').addEventListener('change', function(){showHide('add')}, false); 
  //if entryway is connected to other building
  document.getElementById('inside').addEventListener('change', showEntryConnection, false);
  document.getElementById('outside').addEventListener('change', showEntryConnection, false);
  document.getElementById('otherBuilding').addEventListener('change', showEntryConnection, false);
  //for upload function
  document.getElementById('upload').addEventListener('click', function(){upload(false)}, false);
  //for load function
  document.getElementById('load').addEventListener('click', load, false);
  //for updating of text boxes:
  //document.getElementById('buildingName').addEventListener('keypress', updateBuildingName, false);
  //document.getElementById('floorNumber').addEventListener('keypress', updateFloorNumber, false);
  //for save button
  document.getElementById('save').addEventListener('click', save, false);
  //for clear button
  document.getElementById('clear').addEventListener('click', clear, false);
  //for zooming
  document.getElementById('zoom').addEventListener('change', function(){upload(true)}, false);

  // Activate the default tool.
  if (tools[toolDefault]) {
    tool = new tools[toolDefault]();
    toollist.value = toolDefault;
  }

}; // END INITIALIZATION

// CANVAS SET-UP and BASIC EVENT HANDLER~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
/*The general-purpose event handler. This function just determines the mouse 
position relative to the canvas element.*/
function ev_canvas (ev) {
  if (ev.layerX || ev.layerX == 0) { // Firefox
    ev._x = ev.layerX;
    ev._y = ev.layerY;
  } else if (ev.offsetX || ev.offsetX == 0) { // Opera
    ev._x = ev.offsetX;
    ev._y = ev.offsetY;
  }

  // Call the event handler of the tool.
  var func = tool[ev.type];
    if (func)
      func(ev);
};

//adds the temporary canvas to the permanent canvas, clears temporary canvas
function img_update () {
  contextPerm.drawImage(canvas, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
};

// The event handler for any changes made to the tool selector. 
function ev_tool_change (ev) {
  for(var i = 0; i < toollist.length; i++) {  
      if(toollist[i].checked == true)  {
          var selectedT = toollist[i].value;
          tool = new tools[selectedT]; //QUESTION: IS THE NEW NECESSARY HERE?
          
          //hide/show relevant things
          showHide(toollist[i].value);

          //clear temporary canvas
          context.clearRect(0, 0, canvas.width, canvas.height);
          break;
      }
  }
};


//EDITING/DRAWING HELPER FUNCITONS~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//function that removes edges on canvas - - - - - - - - - -- - - - - - - - - - - - - - - -- - - 
function remove_edges(startX, startY, endX, endY, startID, endID) {
 //remove edge drawing
 contextPerm.globalCompositeOperation = "xor";
 contextPerm.beginPath();
 contextPerm.moveTo(startX, startY);
 contextPerm.lineTo(endX, endY);
 contextPerm.lineWidth = 4;
 contextPerm.strokeStyle = 'white';
 contextPerm.stroke();
 contextPerm.closePath();
 contextPerm.globalCompositeOperation = "source-over";

 //draw nodes over where line was erased
 contextPerm.beginPath();
 contextPerm.arc(startX, startY, radius, 0, 2 * Math.PI);
 contextPerm.fillStyle = colorFind(startID, false);
 contextPerm.fill();
 contextPerm.lineWidth = 1;
 contextPerm.strokeStyle = colorFind(startID, false);
 contextPerm.stroke();
 contextPerm.closePath();

 contextPerm.beginPath();
 contextPerm.arc(endX, endY, radius, 0, 2 * Math.PI);
 contextPerm.fillStyle = colorFind(endID, false);
 contextPerm.fill();
 contextPerm.strokeStyle = colorFind(endID, false);
 contextPerm.stroke();
 contextPerm.closePath();
};
 
//function that removes nodes on canvas
function remove_nodes(x, y) {
  contextPerm.globalCompositeOperation = "xor";
  contextPerm.beginPath();
  contextPerm.arc(x, y, radius + 1, 0, 2 * Math.PI);
  contextPerm.fillStyle = 'white';
  contextPerm.fill();
  contextPerm.strokeStyle = 'white';
  contextPerm.stroke();
  contextPerm.closePath();
  contextPerm.globalCompositeOperation = "source-over";
};
 
//remove nodes from node list AND removes it from an image, given the ID of the node (NOT the node itself)
function removeNode(removeID) {
  var remove;
  var removeLocation;
  for (var i = 0; i < nodes.length; i++) { //find node location
    if (nodes[i].id == removeID) {
      remove = nodes[i];
      removeLocation = i;
    } 
  }

  var connectID = [];
  var removedEdges = [];
  var removedEdgesID = [];
  for (var i = 0; i < edges.length; i++) { //for every edge
    if (edges[i].x == removeID) {
      connectID.push(edges[i].y); //push id of the other node
      removedEdges.push(edges[i]);
      removedEdgesID.push(i);
    }
    else if (edges[i].y == removeID){
      connectID.push(edges[i].x); //push id of the other node
      removedEdges.push(edges[i]);
      removedEdgesID.push(i);
    }
  }
  //remove edges from array
  for (var i = removedEdgesID.length - 1; i >= 0; i--) {
    edges.splice(removedEdgesID[i], 1);
  }
  for (var i = 0; i < connectID.length; i++) {
    var startRemove = getNode(connectID[i]);
    remove_edges(startRemove.x, startRemove.y, remove.x, remove.y, connectID[i], remove.id);
  }
  remove = nodes.splice(removeLocation, 1)[0]; //remove and return node
  remove_nodes(remove.x, remove.y); //remove node from screen
  
  img_update();
  //ADD TO UNDO
  //return ['dn', remove, removed_edges];
  return;
 
}

//removes edge from edge list and from the image, given the entire edge
function removeEdge(edge) { //takes in the edge
  var removeID, remove, start, end;
  //find the edge
  for (var i = 0; i < edges.length; i++) {
    if ((edges[i].x == edge.x) && (edges[i].y == edge.y)) {
      removeID = i;
    }
  } 

  remove = edges.splice(removeID, 1)[0]; //remove and return edge (remove was not previously declared, so unsure)
  start = getNode(remove.x);
  end = getNode(remove.y);
  remove_edges(start.x, start.y, end.x, end.y, remove.x, remove.y); //remove from screen
         
  //ADD TO UNDO
  return ['de', remove]; //this will be needed to be changed as part of undo/redo
  img_update();
}


//draws nodes on temporary canvases
function draw_node(x, y, radius, color) {
  context.beginPath();
  context.arc(x, y, radius, 0, 2 * Math.PI);
  context.fillStyle = color;
  context.fill();
  context.lineWidth = LINEWIDTH;
  context.strokeStyle = color;
  context.stroke();
  context.closePath();
};

//draws edges on temporary canvases
function draw_edge(startX, startY, endX, endY, color) {
  context.beginPath();
  context.moveTo(startX, startY);
  context.lineTo(endX, endY);
  context.lineWidth = LINEWIDTH + 1;
  context.strokeStyle = color;
  context.stroke();
  context.closePath();
};   


//set radius to what is in the radius box (currently not an element that exists)
function setRadius() {
    //set radius size
    if (document.getElementsByName('radius')[0].value == '') {
      alert('radius is undefined!');
    }
    radius = parseFloat(document.getElementsByName('radius')[0].value);
}

//given the nodeID of the function, return the node
function getNode(nodeID) {
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].id == nodeID)
      return nodes[i]; 
  }
    throw "Node ID does not exist."
}

// Function to add extra attributes to nodes of variable type.
// Only to be called by add after a new node is added, adding the attributes
// of the node at the end of the list.
function addNodeAttributes() {
  editNode = nodes[nodes.length - 1];
  if (editNode.type == "room") 
    editNode.room = document.getElementById("roomNumber").value;
  else if (editNode.type == "bathroom") {
    editNode.room = document.getElementById("roomNumber").value;
    if (document.getElementById("F").checked)
      editNode.gender = "F";
    else if (document.getElementById("M").checked)
      editNode.gender = "M";
    else if (document.getElementById("U").checked)
      editNode.gender = "U";
    else 
      alert ("No gender selected.")
  } else if (editNode.type == "stairs") {
    editNode.set = document.getElementById("stairset").value;
    editNode.up = document.getElementById("stairsup").value;
    editNode.down = document.getElementById("stairsdown").value;
  } else if (editNode.type == "elevator") 
    editNode.set = document.getElementById("stairset").value;
  else if (editNode.type == "entry") {
    if (document.getElementById('outside').checked) {
      editNode.entry = "O";
      editNode.entryway = document.getElementById("entrywayNo").value;
      editNode.lat = parseFloat(document.getElementById("lat").value);
      editNode.long = parseFloat(document.getElementById("long").value);
    } else if (document.getElementById('otherBuilding').checked) {
      editNode.entry = "B";
      editNode.connected = {"building":document.getElementById("connBuilding").value, 
                            "floor":document.getElementById("connFloor").value,
                            "id":document.getElementById("connId").value};
    } else if (document.getElementById("inside").checked) 
      editNode.entry = "I";
    else {
      editNode.entry = "I";
      alert('No entry type selected.');
    }
  }
}

 //Find node closest to given coordinates x, y. Returns the Node.
function closestNode(x, y) {
  var closest;
  var distance = Infinity;

  if (nodes.length == 0)
    throw "No nodes!";

  for (var i = 0; i < nodes.length; i++) {
    var cx =  nodes[i].x; //parsing through the coords of every node
    var cy = nodes[i].y;
    var d = (x - cx)*(x - cx) + (y - cy)*(y - cy);
    if (d < distance) {
      distance = d;
      closest = nodes[i];
    }
  }
  //return array of closest node center coordinates
  return closest;
};

/* A color dictionary - given the node id (or if it is a new node),
 * return the color of the type of node needed. */
function colorFind(nodeID, newNode) {
   var nodeType;
   var gender;
   if (newNode) 
     nodeType = findNT();
   else 
     nodeType = getNode(nodeID).type;
   if (nodeType =='walk')
     return 'black';
   else if (nodeType =='room')
     return 'red';
   else if (nodeType =='bathroom') {
    if (newNode) { 
      if (document.getElementsByName("gender")[0].checked) gender = 'F';
      else if (document.getElementsByName("gender")[1].checked) gender = 'M';
      else gender = 'X';
    } 
    else {
      gender = getNode(nodeID).gender;
    }
    if (gender == 'M') return '#2ECCFA';
    else if (gender == 'F') return '#F781BE';
    else return '#FF9900';
   } else if (nodeType =='stairs')
    return '#5858FA';
   else if (nodeType =='elevator')
    return '#FFBF00';
   else if (nodeType =='entry')
    return '#3ADF00';
   else if (nodeType == 'accessibility')
    return '#0C49B3';
 };

// Return the node type indicated in the interface.
function findNT() {
  yep = document.getElementById("nodeType").value;
  return yep;
 };

// Given the ID of a node, return an 
function connectedEdges(nodeID) {
  var connectID = [];
  for (var i = 0; i < edges.length; i++) { //for every edge
    if (edges[i].x == nodeID) {
      connectID.push(edges[i].y); //push id of the other node
    } else if (edges[i].y == nodeID){
      connectID.push(edges[i].x); //push id of the other node
    }
  }
  return connectID;
};

/* Given coordinates(x,y) and nodes nodeA and nodeB that form the endpoints of an edge, snap the coordinates onto the line,
 * returning the adjusted coordinates in a dictionary {x, y}. */
function bestFit(x, y, nodeA, nodeB) {
  var u = (x - nodeA.x)*(nodeB.x - nodeA.x) + (y - nodeA.y)*(nodeB.y - nodeA.y);
  var udenom = (nodeB.x - nodeA.x)*(nodeB.x - nodeA.x) + (nodeB.y - nodeA.y)*(nodeB.y - nodeA.y);
  u /= udenom;
  return {x:Math.round(nodeA.x + u * (nodeB.x - nodeA.x)), y:Math.round(nodeA.y + u * (nodeB.y - nodeA.y))}
}

/* given the mouse coordinates determines if in range of node or edge - if so returns
 * whichever object it is closest to in a dictionary with {closest ('e' or 'n'), object} */
//NOTE: location (the second variable returned) does not exist anymore. being left temporarily.
// should be cleared out later. Anything that calls on region Detection will need to be adjusted
//(from 2 to 1) -------> I am phasing out, keeping this comment to remind myself to fix on all regionDetection calls
function regionDetection(x, y) { 
  var type; // type of closest object ('e' or 'n')
  var distance = Infinity; //distance of closest object
  var object; //the object itself
  var range = 5; //the range of the object, can be adjusted for optimum performance

  //check nodes
  for (var i = 0; i < nodes.length; i++) {
    var nodeX = nodes[i].x; //parsing through the coords of every node
    var nodeY = nodes[i].y;
    var dist = (x - nodeX)*(x - nodeX) + (y - nodeY)*(y - nodeY);
    if (Math.sqrt(dist) <= (range + radius)) {
      if (dist < distance) {
        type = 'n';
        distance = dist;
        object = nodes[i];
      }
    }
  }
  if (distance != Infinity) return {type: type, object: object};

  //check edges
  for (var i = 0; i < edges.length; i++) {
    var endNodeX = edges[i].x;
    var endNodeY = edges[i].y;
    var coordsAx = getNode(endNodeX).x;
    var coordsAy = getNode(endNodeX).y;
    var coordsBx = getNode(endNodeY).x;
    var coordsBy = getNode(endNodeY).y;
    var range = 5;

    //check range
    if ((Math.min(coordsAx, coordsBx) - range) <= x && x <= (Math.max(coordsAx, coordsBx) + range) && //x coords within range
        (Math.min(coordsAy, coordsBy) - range) <= y && y <= (Math.max(coordsAy, coordsBy) + range)) { //y coords within range
      //find distance to line
      var dist;
      if (coordsAx == coordsBx) { //equal x coordinates
        dist = Math.abs(coordsBx - x);
      } else if (coordsBy == coordsAy) { //equal y coordinates
        dist  = Math.abs(coordsBy - y);
      } else {
        var m = (coordsAy - coordsBy) / (coordsAx - coordsBx); //slope
        dist = Math.abs(y - coordsAy - m * x + m * coordsAx) / Math.sqrt(1 + m * m); //distance to a line formula
      }
      if (dist < range && dist + radius + range + 3 < distance) { //if within range and significantly closer than the node distance
        type = 'e';
        distance = dist;
        object = edges[i];
      }
    }
  }

  if (distance == Infinity) return {type: 'none', object: ''};
  return {type: type, object: object};
};

function showHide(change) {
  //hide all elements
  var hide = document.getElementsByClassName("nodisplay");
  for (i = 0; i < hide.length; i++) {
    hide[i].style.display = 'none';
  }

  //show relevant element
  //if add: show node type selector
  if (change == 'add') {
    var nodeType = document.getElementById('nodeType');
    nodeType.style.display = 'inline-block';
    if (nodeType.value == 'room') 
      showClassElements('addRoom');
    else if (nodeType.value == 'bathroom') 
      showClassElements('addBathroom');
    else if (nodeType.value == 'stairs') 
      showClassElements('addStairs');
    else if (nodeType.value == 'elevator')
      showClassElements('addElevator');
    else if (nodeType.value == 'entry')
      showClassElements('addEntry');
  }
  else if (change == 'scale') 
    showClassElements('scale');
  else if (change == 'info') {
    document.getElementById("infobox").style.display = 'inline-block';
  } else if (change == 'rightangle') {
    document.getElementById('rightangleBaseLine').style.display = 'inline-block'
  }
};

//display all elements with className
function showClassElements(className) {
  var elements = document.getElementsByClassName(className);
  for (i = 0; i < elements.length; i++) 
    elements[i].style.display = 'inline-block'
};


//show entry connection (specific case)
function showEntryConnection() {
  if (document.getElementById('otherBuilding').checked) {
    document.getElementById('insideEntryway').style.display = 'inline-block';
    document.getElementById('entryway').style.display = 'none';
  } else if (document.getElementById('outside').checked) {
    document.getElementById('insideEntryway').style.display = 'none';
    document.getElementById('entryway').style.display = 'inline-block';
  } else {
    document.getElementById('insideEntryway').style.display = 'none';
    document.getElementById('entryway').style.display = 'none';
  }
};

//unscale and return coords by the scale
function unscale(coord){
    coord /= scale;
  return coord;
};

//scale and return coords by the scale value
function rescale(coord){
  coord *= scale;
  return coord;
};

//use pixels and scale distance to convert to pixels per meter
function getScale() {
  if (ppm != null)
    return ppm;
  pixels = parseFloat(document.getElementById('pixels').value);
  distance = parseFloat(document.getElementById('scaleDist').value);
  if (distance == NaN || pixels == NaN) 
    return '';

  units = document.getElementById('units').value;
  //convert if distance not in meters
  if (units == "centimeters") //change cm to m
    distance = 0.01 * distance
  else if (units == "yards") //change yds to m
    distance = 0.9144 * distance
  else if (units == "feet") //change ft to m
    distance = 0.3048 * distance
  return pixels / distance //pixels per meter
};

//return the current graph as JSON text
function saveGraph() {
  var image = document.getElementById('file').value;
  image = image.substr(12);
  var nodesScaled = [];
  for (var i = 0; i < nodes.length; i++){
    nodesScaled.push(JSON.parse(JSON.stringify(nodes[i])));
    nodesScaled[i].x = unscale(nodesScaled[i].x);
    nodesScaled[i].y = unscale(nodesScaled[i].y);
  }

  function Graph() {
    this.image = image;
    this.building = document.getElementById('buildingName').value;
    this.floor = document.getElementById('floorNumber').value;
    this.scale = getScale();
    this.nodes = nodesScaled;
    this.edges = edges;
  }

  var graph = new Graph();
  if (graph.scale == '' || graph.scale == null) {
    alert('Please enter a scale distance.');
  }
  if (graph.building == '' || graph.floor == '') {
    alert('Please enter the building name and floor.');
  }

  var JSONstring = JSON.stringify(graph);
  return JSONstring;
};

var hello;

// Load the given graphJSON text onto the canvas as nodes and edges.
function loadGraph(graphJSON, old) {
  graphJSON = JSON.parse(graphJSON);
  if (graphJSON == '') return;

  //clear nodes and edges
  nodes = [];
  edges = [];

  //STUFF TO DELETE STARTS HERE

  var oldNodes = graphJSON.nodes;
  var oldEdges = graphJSON.edges;
  var newNodes = [];
  var newEdges = [];
  if (old == true) {
    for (var i = 0; i < oldNodes.length; i++) {
      newNodes.push(new Node(oldNodes[i].id, oldNodes[i].coords[0], oldNodes[i].coords[1], oldNodes[i].type));
    }
    
    for (var i = 0; i < oldEdges.length; i++) {
      newEdges.push(new Edge(oldEdges[i].coords[0], oldEdges[i].coords[1]));
    }
  } else {
    newNodes = oldNodes;
    newEdges = oldEdges;
  }
  //UNCOMMENT THIS STUFF
  //add new edges and nodes
  //var newNodes = graphJSON.nodes;
  //var newEdges = graphJSON.edges;
  var highestID = 0;

  //rescale nodes and determine highest node ID
  for (var i = 0; i < newNodes.length; i++) {
    newNodes[i].x = rescale(newNodes[i].x);
    newNodes[i].y = rescale(newNodes[i].y);
    highestID = Math.max(newNodes[i].id, highestID);
    nodes.push(newNodes[i]);
  }
  for (var i = 0; i < newEdges.length; i++) {
    edges.push(newEdges[i]);
  }
  //clear temp canvas
  context.clearRect(0, 0, canvas.width, canvas.height);
  //draw on temp canvas
  for (var i = 0; i < edges.length; i++) {
    var nodeA = getNode(edges[i].x);
    var nodeB = getNode(edges[i].y);
    draw_edge(nodeA.x, nodeA.y, nodeB.x, nodeB.y, 'black');
  }
  for (var i = 0; i < nodes.length; i++) {
    draw_node(nodes[i].x, nodes[i].y, radius, colorFind(nodes[i].id, false));
  }
  img_update();

  //fill in the building and floor info 
  document.getElementById('buildingName').value = String(graphJSON.building);
  document.getElementById('floorNumber').value = String(graphJSON.floor);

  new_id = highestID + 1;
  //set background IF no current background
};

//EDITING TOOLS ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// add ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//Node and edge data types
//Node function out of the Node tool
function Node(id, x, y, type) {
   this.id = id;
   this.x = x;
   this.y = y;
   this.type = type;
 };

 //Edge function to create edge data type - x and y indicated start and end nodeIDs
 function Edge(x, y) {
  this.x = x;
  this.y = y;
 }

//add tool~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
/* The add tool functions as both the add edge and add node tool and can do 4 different things:
 * Add nodes, add an edge between 2 existing nodes, add an edge from an existing node to a new node (adding both
 * an edge and a node), and add a node onto an existing edge (splitting the edge into 2 edges). */
 tools.add = function () {
   var tool = this;
   this.started = false;
   var fittedCoords; //if snapping node onto edge, new coordinates snapped to the edge
   var nearE; //dictionary with {type, object}, contains closest node or edge to moving mouse
   var nearS; //dictionary with {type, object}, contains closest node or edge to initial position
   var auto_node = false; //sets node on existing edge
   var auto_edge = false; //draws edge from existing node

   this.mousedown = function (ev) {
     tool.started = true;
     tool.x0 = ev._x;
     tool.y0 = ev._y;
     //setRadius(); //sets the radius from what is in the radius toolbox
        
    nearS = regionDetection(ev._x, ev._y); //determine if node or edge is within range
      if (nearS.type == 'n') {
        auto_node = false;
        auto_edge = true;
      } else if (nearS.type == 'e') {
        auto_node = true;
        auto_edge = false;
      } else { //default is drawing a new node
        auto_edge = false;
        auto_node = false;
      }  
   }; 

   this.mousemove = function (ev) {
     if (!tool.started) {
       return;
     }
     context.clearRect(0, 0, canvas.width, canvas.height);
      if (auto_node) { //snap the cursor to the closest edge determined above, using line formula
        fittedCoords = bestFit(ev._x, ev._y, getNode(nearS.object.x), getNode(nearS.object.y));
        draw_node(fittedCoords.x, fittedCoords.y, radius, findNT());
      } else if (auto_edge) {
        nearE = regionDetection(ev._x, ev._y);
        if (nearE.type == 'n') {
          //draw edge to node
          draw_edge(nearS.object.x, nearS.object.y, nearE.object.x, nearE.object.y, 'black');
          draw_node(nearS.object.x, nearS.object.y, radius, colorFind(nearS.object.id, false));
          draw_node(nearE.object.x, nearE.object.y, radius, colorFind(nearE.object.id, false));
        } else {
          //draw edge and node on the end
          draw_edge(nearS.object.x, nearS.object.y, ev._x, ev._y, 'black');
          draw_node(nearS.object.x, nearS.object.y, radius, colorFind(nearS.object.id, false));
          draw_node(ev._x, ev._y, radius, 'black'); //just draw a black one, final node will be correct color
        }
      } else { 
        draw_node(tool.x0, tool.y0, radius, colorFind(nodes.length, true));
      }
   };

   this.mouseup = function (ev) {
     if (tool.started) {
      tool.mousemove(ev);
      tool.started = false;

      if (auto_edge && nearE.type == 'n') { //added edge between 2 nodes
          //set edge
          edges.push(new Edge(nearS.object.id, nearE.object.id));
          //undoPush(["e", edges[edges.length - 1]]); //add new to end
      } else {
        if (auto_edge) { //added edge and new node
          //set edge
          edges.push(new Edge(new_id, nearS.object.id));
          nodes.push(new Node(new_id, ev._x, ev._y, findNT()));
          addNodeAttributes();
          if (findNT() == "room") {
            if (document.getElementById("roomNumber").value != '') 

              document.getElementById("roomNumber").value = incRoomNumber(document.getElementById("roomNumber").value);
            }
          new_id++;

          //undoPush(["n", new_id - 1]); //add new to end
        }
        else if (auto_node) { //added node on existing edge
          nodes.push(new Node(new_id, fittedCoords.x, fittedCoords.y, findNT()));
          addNodeAttributes();
          if (findNT() == "room") {
            if (document.getElementById("roomNumber").value != '') 
              document.getElementById("roomNumber").value = incRoomNumber(document.getElementById("roomNumber").value);
            }
            /*if (yep == "room") {
    if (document.getElementById("roomNumber").value != '') 
      document.getElementById("roomNumber").value = String(parseInt(document.getElementById("roomNumber").value) + 1);
  }*/
          //remove edge, add two new edges
          var coords = nearS.object;
          removeEdge(nearS.object);
          edges.push(new Edge(new_id, nearS.object.x));
          edges.push(new Edge(new_id, nearS.object.y));
          new_id++;

          //draw
          nodeA = getNode(nearS.object.x)
          nodeB = getNode(nearS.object.y)
          draw_edge(fittedCoords.x, fittedCoords.y, nodeA.x, nodeA.y, 'black');
          draw_edge(fittedCoords.x, fittedCoords.y, nodeB.x, nodeB.y, 'black');
          draw_node(fittedCoords.x, fittedCoords.y, radius, colorFind(new_id - 1), 1);
          draw_node(nodeA.x, nodeA.y, radius, colorFind(nearS.object.x));
          draw_node(nodeB.x, nodeB.y, radius, colorFind(nearS.object.y));
          //undoPush(['an', new_id - 1, coords[0], coords[1]]);

        } else { //added node
          nodes.push(new Node(new_id, tool.x0, tool.y0, findNT()));
          addNodeAttributes();

          if (findNT() == "room") {
            if (document.getElementById("roomNumber").value != '') 
              document.getElementById("roomNumber").value = incRoomNumber(document.getElementById("roomNumber").value);
            }
          new_id++;

           //update undo
           //undoPush(["n", new_id - 1]); //add new to end
        }

        //redraw added node
        var last_node = nodes[nodes.length - 1];
        draw_node(last_node.x, last_node.y, radius, colorFind(last_node.id, false));
     }

     img_update();
    }
   };
 }; //end tools.add

//move ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
/* The move tool allows the user to move around existing nodes, redrawing those nodes and all relevant edges.
 * It also gives the user the ability to 'snap' the nodes to an x, y coordinate grid, depending on whether the
 * snapping tool is activated (currently no snapping check box available). */
tools.move = function(){
  var tool = this;
  this.started = false;

  var moveNode; //closest node to mousedown position
  var endX, endY;
  var currentX, currentY; //saved x and y cordinates of mousemove position
  var snappingX, snappingY; //booleans to determine if snapping to X or Y plane
  var firstRun = false; //boolean to determine if first run
  var connectID = []; //ids of the nodes on the other end of edges
  var snapping = false; //boolean to determine whether to snap to x and y coordinate plane

  this.mousedown = function (ev) {
    tool.started = true;

    //determine the closest node
    moveNode = closestNode(ev._x, ev._y);
    //parse through edge array to find connected edges
    connectID = connectedEdges(moveNode.id);
    //prepare firstRun
    firstRun = true;

    //snapping = document.getElementsByName('snapping')[0].checked;  //CURRENTLY EDITED OUT
    //prepare snapping
    if (snapping) { //if snapping true, begin snapping to both X and Y planes
      snappingX = true;
      snappingY = true;
    }
  };

  this.mousemove = function (ev) {
    if (!tool.started) {
      return;
    }
    if (firstRun) {
      //removal of original edges to the moved node on permanent canvas
      for (var i = 0; i < connectID.length; i++) {
        var remove = getNode(connectID[i]);
        remove_edges(remove.x, remove.y, moveNode.x, moveNode.y, connectID[i], moveNode.id);
      }
      //remove original node on permanent canvas
      remove_nodes(moveNode.x, moveNode.y);
      firstRun = false;
    }

    if (!snapping) { //save the current mouse position
      currentX = ev._x;
      currentY = ev._y;
    } else {
      if (snappingX) {currentX = ev._x;}
      if (snappingY) {currentY = ev._y;}
    }

    var tolerance = 2;
    context.clearRect(0, 0, canvas.width, canvas.height);
    //mouseCoords(ev._x, ev._y);

    if (snapping) { //if snapping is on
      //snap to the closest neighbor if within tolerance; once snapped turn off that coordinate's snapping
      for (var i = 0; i < connectID.length; i++) { //for all neighbors of the node
        var neighbor = getNode(connectID[i]);
        if (snappingX) { 
          if (Math.abs(neighbor.x - currentX) <= tolerance) {
            currentX = neighbor.x;
            snappingX = false;
          }
        }
        if (snappingY) {
          if (Math.abs(neighbor.y - currentY) <= tolerance) {
            currentY = neighbor.y;
            snappingY = false;
          }
        }
      }
    } 

    //draw new edges
    for (var i = 0; i < connectID.length; i++) {
      var neighbor = getNode(connectID[i]);
      draw_edge(neighbor.x, neighbor.y, currentX, currentY, 'black');
    }

    //draw new nodes on top of edges
    for (var i = 0; i < connectID.length; i++) {
      var neighbor = getNode(connectID[i]);
      draw_node(neighbor.x, neighbor.y, radius, colorFind(connectID[i], false));
    }

    draw_node(currentX, currentY, radius, colorFind(moveNode.id, false)); //draw new node
  };

  this.mouseup = function (ev) {
    if (tool.started) {
      tool.mousemove(ev);
      tool.started = false;
      img_update();

      //update coordinates of changed node
      moveNode.x = currentX;
      moveNode.y = currentY;

      //connected_edges = connectID; --must somehow copy over the connectID to send to undo
      //add to undo list
      //undoPush([nodeID, [oldX, oldY], connected_edges]); //node id, old coordinates, connectID[]

      //clear connectID -- not sure if this is necessary, need to try
      connectID = [];
    }
  };
}; //end tools.move


//delete ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
/* The delete tool allows the user to select the closest node and edge (which will be highlighted yellow) and delete it
 * both from the canvas (as an image) and from the actual saved node or edge list. */

tools.delete = function() {
  var tool = this;
  this.started = false;

  var closest; //a dictionary with type: 'e', 'n', 'none'; object: closest node or edge

  this.mousedown = function (ev) {
    tool.started = true; 
  }

  this.mousemove = function (ev) {
    if (!tool.started) 
      return;
    
    context.clearRect(0, 0, canvas.width, canvas.height);
     
    //detect the closest node or edge and color it yellow
    closest = regionDetection(ev._x, ev._y);
    if (closest.type == 'e') {
      var nodeA = getNode(closest.object.x);
      var nodeB = getNode(closest.object.y);
      draw_edge(nodeA.x, nodeA.y, nodeB.x, nodeB.y, 'yellow');
    }
    else if (closest.type == 'n') {
      draw_node(closest.object.x, closest.object.y, radius, 'yellow');
    }
  };

  this.mouseup = function (ev) {
    if (tool.started) {
      tool.mousemove(ev);
      tool.started = false;
      context.clearRect(0, 0, canvas.width, canvas.height);
      if (closest.type == 'e') {
        removeEdge(closest.object);
        //undoPush(removeEdge(closest.object));
      }
      else if (closest.type == 'n') {
        removeNode(closest.object.id);
        //undoPush(removeNode(closest.object.id));
      }
    }
  };
};

//straighten ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
/* The straighten tool allows the user to select contiguous nodes and edges (a selection must end with 2 nodes and continuously
 * elements connecting the same 2 nodes), which will be highlighted yellow, and straighten them, so that all nodes are straightened
 * onto a line of best fit between the two endpoints (and all edges are redrawn accordingly). */
tools.straighten = function() {
  var tool = this;
  this.started = false;

  var closest; //a dictionary with type: 'e', 'n', 'none/object: closest node or edge
  var selectedNode; // array of the selected nodes
  var selectedEdge; // array of the selected edges

  this.mousedown = function (ev) {
    tool.started = true;
    selectedNode = [];
    selectedEdge = [];
  };

  this.mousemove = function (ev) {
    if (!tool.started) {
      return;
    }
    //region detection
    closest = regionDetection(ev._x, ev._y);
    
    //detect the closest node or edge and color it yellow, adding it to its respective selected array
    if (closest.type == 'e') {
      var contains = false;
      for (var i = 0; i < selectedEdge.length; i++) { //checks for duplicates
        if (selectedEdge[i] == closest.object) //not sure if can compare 2 edges this way, although testing seems to indicate I can
          contains = true;
      }
      if (!contains) { 
        selectedEdge.push(closest.object);
        var nodeA = getNode(closest.object.x);
        var nodeB = getNode(closest.object.y);
        draw_edge(nodeA.x, nodeA.y, nodeB.x, nodeB.y, 'yellow');
      }
    } else if (closest.type == 'n') {
      var contains = false;
      for (var i = 0; i < selectedNode.length; i++) { // checks for duplicates
        if (selectedNode[i].id == closest.object.id)
          contains = true;
      }
      if (!contains) {
        selectedNode.push(closest.object);
        draw_node(closest.object.x, closest.object.y, radius, 'yellow');
      }
    }
  };

  this.mouseup = function (ev) {
    if (tool.started) {
      tool.mousemove(ev);
      tool.started = false;
      context.clearRect(0, 0, canvas.width, canvas.height);
      //straighten if valid selection
      if ((selectedNode.length == (selectedEdge.length + 1)) && (selectedEdge.length > 0)) { //may want to improve this check
        //find all edges of interest (any edges connected to selected nodes)
        var relatedEdges = [];
        for (var i = 0; i < edges.length; i++) {
          for (var j = 0; j < selectedNode.length; j++) {
            if ((edges[i].x == selectedNode[j].id) || (edges[i].y == selectedNode[j].id))
              relatedEdges.push(edges[i]);
          }
        }

        //remove all edges and nodes
        for (var i = 0; i < relatedEdges.length; i++) {
          var nodeA = getNode(relatedEdges[i].x);
          var nodeB = getNode(relatedEdges[i].y);
          remove_edges(nodeA.x, nodeA.y, nodeB.x, nodeB.y, nodeA.id, nodeB.id); //remove from screen
        }
        for (var i = 0; i < selectedNode.length; i++) {
          remove_nodes(selectedNode[i].x, selectedNode[i].y);
        }

        //find node endpoints by determining which node ids only occur once in selectedEdge
        var result = {};
        var endpoints = [];
        for (var i = 0; i < selectedEdge.length; i++) {
            if (!(selectedEdge[i].x in result))
                result[selectedEdge[i].x] = 1;
            else {
              result[selectedEdge[i].x]++;
            }
            if (!(selectedEdge[i].y in result))
                result[selectedEdge[i].y] = 1;
            else {
              result[selectedEdge[i].y]++;
            }
        }
        for (var id in result) {
          if (result[id] == 1)
            endpoints.push(id);
        }

        //find line of best fit
        //convert each selected node's coords to new coords on line
        for (var i = 0; i < selectedNode.length; i++) {
          var fittedCoords = bestFit(selectedNode[i].x, selectedNode[i].y, getNode(endpoints[0]), getNode(endpoints[1])); //hardcoding here inevitable??
          selectedNode[i].x = fittedCoords.x;
          selectedNode[i].y = fittedCoords.y;
        }

        //draw new nodes and edges
        for (var i = 0; i < relatedEdges.length; i++) {//edges and nodes of interest
          var nodeA = getNode(relatedEdges[i].x);
          var nodeB = getNode(relatedEdges[i].y);
          draw_edge(nodeA.x, nodeA.y, nodeB.x, nodeB.y, 'black');
          draw_node(nodeA.x, nodeA.y, radius, colorFind(nodeA.id, false));
          draw_node(nodeB.x, nodeB.y, radius, colorFind(nodeB.id, false));
        }
        img_update();
      }
    }
  };
};

//right angle ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
/* The right angle tool allows the user to select contiguous nodes and edges (a selection must end with 2 nodes and continuously
 * elements connecting the same 2 nodes), which will be highlighted yellow. First select the base line and next select the correction line.
 * Both must be valid. This will straighten all nodes of the correction line onto a line perpendicular to the line created between the two 
 * endpoints of the base line (which may or may not be straight). The line will go through the point that lies at the intersection of the 
 * base and correction line. All nodes and edges are redrawn accordingly. */

tools.rightangle = function() {
  var tool = this;
  this.started = false;

  var closest; //a dictionary with type: 'e', 'n', 'none/object: closest node or edge
  var selectedBNode; // array of the base selected nodes
  var selectedBEdge; // array of the base selected edges
  var selectedCNode; // array of the corr selected nodes
  var selectedCEdge; // array of the corr selected edges
  var firstClick = true; // Whether to select base or corrected

  this.mousedown = function (ev) {
    tool.started = true;    
    if (firstClick) {
      selectedBNode = [];
      selectedBEdge = [];
    } else {
      selectedCNode = [];
      selectedCEdge = [];
    }
  };

  this.mousemove = function (ev) {
    if (!tool.started) {
      return;
    }
    //region detection
    closest = regionDetection(ev._x, ev._y);
    
    if (firstClick) {
      //detect the closest node or edge and color it yellow, adding it to its respective selected array
      if (closest.type == 'e') {
        var contains = false;
        for (var i = 0; i < selectedBEdge.length; i++) { //checks for duplicates
          if (selectedBEdge[i] == closest.object) //not sure if can compare 2 edges this way, although testing seems to indicate I can
            contains = true;
        }
        if (!contains) { 
          selectedBEdge.push(closest.object);
          var nodeA = getNode(closest.object.x);
          var nodeB = getNode(closest.object.y);
          draw_edge(nodeA.x, nodeA.y, nodeB.x, nodeB.y, 'yellow');
        }
      } else if (closest.type == 'n') {
        var contains = false;
        for (var i = 0; i < selectedBNode.length; i++) { // checks for duplicates
          if (selectedBNode[i].id == closest.object.id)
            contains = true;
        }
        if (!contains) {
          selectedBNode.push(closest.object);
          draw_node(closest.object.x, closest.object.y, radius, 'yellow');
        }
      }
    } else {
      //detect the closest node or edge and color it yellow, adding it to its respective selected array
      if (closest.type == 'e') {
        var contains = false;
        for (var i = 0; i < selectedCEdge.length; i++) { //checks for duplicates
          if (selectedCEdge[i] == closest.object) //not sure if can compare 2 edges this way, although testing seems to indicate I can
            contains = true;
        }
        if (!contains) { 
          selectedCEdge.push(closest.object);
          var nodeA = getNode(closest.object.x);
          var nodeB = getNode(closest.object.y);
          draw_edge(nodeA.x, nodeA.y, nodeB.x, nodeB.y, 'yellow');
        }
      } else if (closest.type == 'n') {
        var contains = false;
        for (var i = 0; i < selectedCNode.length; i++) { // checks for duplicates
          if (selectedCNode[i].id == closest.object.id)
            contains = true;
        }
        if (!contains) {
          selectedCNode.push(closest.object);
          draw_node(closest.object.x, closest.object.y, radius, 'yellow');
        }
      }
    }
  };

  this.mouseup = function (ev) {
    if (tool.started) {
      tool.mousemove(ev);
      tool.started = false;
      context.clearRect(0, 0, canvas.width, canvas.height);
      if (firstClick) {
        // if valid selection, save it and make it no longer first click
        if ((selectedBNode.length == (selectedBEdge.length + 1)) && (selectedBEdge.length > 0)) { //may want to improve this check
          document.getElementById('rightangleBaseLine').style.display = 'none';
          document.getElementById('rightangleSnapLine').style.display = 'inline-block';
          firstClick = false;
        }
      } else {
          // find point that occurs in both the correction and base lines. 
          // If this doesn't exist, choose the first node in selectedCEdge
          var overlapNode = null;
          var numOverlap = 0;
          for (var i = 0; i < selectedCNode.length; i++) {
            for (var j = 0; j < selectedBNode.length; j++) {
              if (selectedBNode[j].x == selectedCNode[i].x && selectedBNode[j].y == selectedCNode[i].y) {
                overlapNode = selectedCNode[i];
                numOverlap++;
              }
            }
          }
          if (overlapNode == null) 
            overlapNode = selectedCNode[0];
 
        // add right angle if correction line is valid selection
        // valid selection includes only one or zero nodes overlapping between selections
        if ((numOverlap < 2) && (selectedCNode.length == (selectedCEdge.length + 1)) && (selectedCEdge.length > 0)) { //may want to improve this check
          //find all edges of interest (any edges connected to selected nodes in correction array)
          var relatedCEdges = [];
          for (var i = 0; i < edges.length; i++) {
            for (var j = 0; j < selectedCNode.length; j++) {
              if ((edges[i].x == selectedCNode[j].id) || (edges[i].y == selectedCNode[j].id))
                relatedCEdges.push(edges[i]);
            }
          }

          //remove all related correction edges and nodes
          for (var i = 0; i < relatedCEdges.length; i++) {
            var nodeA = getNode(relatedCEdges[i].x);
            var nodeB = getNode(relatedCEdges[i].y);
            remove_edges(nodeA.x, nodeA.y, nodeB.x, nodeB.y, nodeA.id, nodeB.id); //remove from screen
          }
          for (var i = 0; i < selectedCNode.length; i++) {
            remove_nodes(selectedCNode[i].x, selectedCNode[i].y);
          }

          //find node endpoints for correction and base by determining which node ids only occur once in selectedEdge arrays
          var result = {};
          var endpointsC = [];
          for (var i = 0; i < selectedCEdge.length; i++) {
              if (!(selectedCEdge[i].x in result))
                  result[selectedCEdge[i].x] = 1;
              else {
                result[selectedCEdge[i].x]++;
              }
              if (!(selectedCEdge[i].y in result))
                  result[selectedCEdge[i].y] = 1;
              else {
                result[selectedCEdge[i].y]++;
              }
          }
          for (var id in result) {
            if (result[id] == 1)
              endpointsC.push(id);
          }
          result = {};
          var endpointsB = [];
          for (var i = 0; i < selectedBEdge.length; i++) {
              if (!(selectedBEdge[i].x in result))
                  result[selectedBEdge[i].x] = 1;
              else {
                result[selectedBEdge[i].x]++;
              }
              if (!(selectedBEdge[i].y in result))
                  result[selectedBEdge[i].y] = 1;
              else {
                result[selectedBEdge[i].y]++;
              }
          }
          for (var id in result) {
            if (result[id] == 1)
              endpointsB.push(id);
          }

          var ep0 = getNode(endpointsB[0]);
          var ep1 = getNode(endpointsB[1]);
          var slope = (ep1.y - ep0.y) / (ep1.x - ep0.x);
          var invSlope = -1 * 1/slope;
          // Create a fake node that is also on the perpendicular line
          var otherEndnode = {};
          if (slope == 0) { 
            otherEndnode.x = overlapNode.x;
            otherEndnode.y = overlapNode.y + 1;
          } else if (slope == Infinity) { 
            otherEndnode.x = overlapNode.x + 1;
            otherEndnode.y = overlapNode.y;
          } else {
            otherEndnode.x = overlapNode.x + 1;
            otherEndnode.y = overlapNode.y + invSlope;
          }

          //find line of best fit
          //convert each selected node's coords to new coords on line
          for (var i = 0; i < selectedCNode.length; i++) {
            if (selectedCNode[i].id != overlapNode.id) {
              var fittedCoords = bestFit(selectedCNode[i].x, selectedCNode[i].y, overlapNode, otherEndnode); //hardcoding here inevitable??
              selectedCNode[i].x = fittedCoords.x;
              selectedCNode[i].y = fittedCoords.y;
            }
          }

          //draw new nodes and edges
          for (var i = 0; i < relatedCEdges.length; i++) {//edges and nodes of interest
            var nodeA = getNode(relatedCEdges[i].x);
            var nodeB = getNode(relatedCEdges[i].y);
            draw_edge(nodeA.x, nodeA.y, nodeB.x, nodeB.y, 'black');
            draw_node(nodeA.x, nodeA.y, radius, colorFind(nodeA.id, false));
            draw_node(nodeB.x, nodeB.y, radius, colorFind(nodeB.id, false));
          }
          img_update();

          // make it the first click after successful right-angling
          document.getElementById('rightangleBaseLine').style.display = 'inline-block';
          document.getElementById('rightangleSnapLine').style.display = 'none';
          firstClick = true;
        }
      }
    }
  };
};


//scale ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
/* The scale tool allows the user to set the scale from the image (ideally using the scale provided in the floorplan uploaded),
 * saving the length of the line drawn, and taking account of the user specified units. */
tools.scale = function() {
  var tool = this;
  this.started = false;

  var startX, startY; //saved mousedown coordinates
  var pixelDist;

  this.mousedown = function (ev) {
    tool.started = true;
    startX = ev._x;
    startY = ev._y;
  };

  this.mousemove = function (ev) {
    if (!tool.started) {
      return;
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
    draw_edge(startX, startY, ev._x, ev._y, 'red')
  };

  this.mouseup = function (ev) {
    if (tool.started) {
      tool.mousemove(ev);
      tool.started = false;
     
      //determine number of pixels selected
      pixelDist = Math.round(Math.sqrt(((startX - ev._x) * (startX - ev._x))+ ((startY - ev._y)*(startY - ev._y))));

      // set textfield value to pixelDist
      document.getElementById('pixels').value = pixelDist;

      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
};

//info ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
tools.info = function() {
   var tool = this;
   this.started = false;
   var closest; //node

   this.mousedown = function (ev) {
     tool.started = true;
     closest = closestNode(ev._x, ev._y); //returns[coords, id]
     hello = closest;
     //erase other highlighting by clearing temp canvas
     context.clearRect(0, 0, canvas.width, canvas.height);
     //highlight node
     draw_node(closest.x, closest.y, radius, '#FFFF00');
   };

   this.mouseup = function (ev) {
     if (tool.started) {
      tool.started = false;


      uploadNodeInfo(closest);
      //send node_id to gender box
      updateText(closest);
     }
   };
 };

function uploadNodeInfo(node) {
  document.getElementById("infoid").value = node.id;
  document.getElementById("infox").value = parseInt(node.x);
  document.getElementById("infoy").value = parseInt(node.y);
  document.getElementById("infotype").value = node.type;
  document.getElementById("infoall").value = JSON.stringify(node);
}



//save ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Saves current implementation of the graph to the downloads folder.
function save (ev) {
  if (nodes.length < 1) {
    alert('Nothing to download!')
    return;
  }

  // Save the graph
  graphJSON = saveGraph();

  //if incomplete info, do not save
  if (document.getElementById('buildingName').value == '' ||
      document.getElementById('floorNumber').value == '' ||
      ((document.getElementById('pixels').value == '' ||
      document.getElementById('scaleDist').value == '') && 
      ppm == null)) { 
    alert("Incomplete information to save.");
    return;
  }

  // Download it to text file
  var textToWrite = graphJSON;
  var textFileAsBlob = new Blob([textToWrite], {type:'text/plain'});
  var fileNameToSaveAs = "floor" + document.getElementById('floorNumber').value;
  var downloadLink = document.createElement("a");
  downloadLink.download = fileNameToSaveAs;
  downloadLink.innerHTML = "Download File";

  var is_chrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
  if (is_chrome)
  {
    // Chrome allows the link to be clicked without actually adding it to the DOM.
    downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
  }
  else 
  {
    // Firefox requires the link to be added to the DOM before it can be clicked.
    downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
    downloadLink.onclick = destroyClickedElement;
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
  }

  downloadLink.click();
};


//upload text ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function load(ev) {
  nodes = [];
  edges = [];
  var file, reader, graphJSON;

  //read in graph
  file = document.getElementById('jsonText').files[0];
  if (file == undefined) return;
  reader = new FileReader();

  reader.onload = function (ev) {
    graphJSON = ev.target.result;
  }
  
  reader.onloadend = function() {
    scale = document.getElementById('zoom').value;
    loadGraph(graphJSON, true);
  };

  reader.readAsText(file);
};

//upload image ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//get file and change canvas background when upload
function upload(zoom){
  var file = document.getElementById('file').files[0];
  if (file == undefined) return;
  var fileread = new FileReader();
  var image = new Image();
  var width, height, newheight;
  var graphJSON;
   
  //fileread.readAsDataURL(file);
  fileread.onload = function(ev) { //once file has uplaoded
    //make sure the image has loaded
    image.onload = function(){
      width = this.width;
      height = this.height;

      if (!zoom) {
        //get building and floor names
        document.getElementById('buildingName').value = 
          prompt("Please enter the building name.", "cs");
        document.getElementById('floorNumber').value = 
          prompt("Please enter the floor number.", "1");
      }

      graphJSON = saveGraph();
      scale = document.getElementById('zoom').value;

      //resizing the uploaded image
      height = height * 1000 / width * scale;
      width = 1000 * scale;
      newheight = height;

      //change canvas
      canvasPerm.width = width; //edit sizes
      canvasPerm.height = height;
      canvas.width = width;
      canvas.height = height;
      backgroundCanvas.width = width;
      backgroundCanvas.height = height;
      backgroundContext.drawImage(image, 0, 0, width, height);
      
      //redraw all edges and nodes
      loadGraph(graphJSON, false);
    }
    image.src = ev.target.result;
  } 
  fileread.readAsDataURL(file);
  document.getElementById('canvasDiv').height = newheight;
  img_update();
}; 


//clear ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function clear() {
  //ADD A PROMPT HERE TO ENSURE SANITY
  if (!confirm('Are you sure you want to clear the canvas, all nodes, and all edges?')) {
    return;
  }
  //clear image
  context.clearRect(0, 0, canvas.width, canvas.height);
  contextPerm.clearRect(0, 0, canvasPerm.width, canvasPerm.height);

  //except for background image

  //clear nodes and edges
  nodes = [];
  edges = [];
};



//update text boxes area -- floor number and building name not needed
//function updateFloorNumber() {
//};
//function updateBuildingName() {
//};

// Helper function to increment the numbers in the Room Number textbox if the room number also contains letters
function incRoomNumber(number) {
  if (!isNaN(number)) 
    return String(parseInt(number) + 1);

  var splitter = /([A-Za-z]+(?=\d)|\d+(?=[A-Za-z]))/;
  var splitnums = number.split(splitter);
  for (var i = 0; i < splitnums.length; i++) {
    if (!isNaN(splitnums[i]) && splitnums[i] != "") {
       splitnums[i] = String(parseInt(splitnums[i]) + 1);
       break;
     }
  }

  var newNumber = "";
  for (var i = 0; i < splitnums.length; i++) {
    newNumber = newNumber + splitnums[i];
  }

  return newNumber;
}

function updateText() {
};

    // EVENT LISTENERS~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 if (window.addEventListener) {
     window.addEventListener('load', init(), false);

 }


