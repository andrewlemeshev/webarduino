$( document ).ready(function() {
  var sourcePin = null, sourceElement = null, sourcePinFromPanel = null, currentLine = null;
  var arduinoElement = [];
  var arduinoElementActive = [];
  var wires = [];
  var sidePanel = false;
  var history = [];
  var info = "";
  var idElement = 0;
  var elementList = [];
  var current = 0;
  var voltage = 0;


  function Pins(pinName, pinType, pinX, pinY) {
    this.pinName = pinName;
    this.pinType = pinType;
    this.pinX = pinX;
    this.pinY = pinY;
    this.pinOut = [];
    this.pinIn = [];
    this.lineOut = [];
    this.lineIn = [];
    this.choosen = false;
    this.parentObject = null;

    this.setParentObject = function(object) {
      this.parentObject = object;
    }

    this.getParentObject = function() {
      return this.parentObject;
    }
  }

  function ArduinoElement(name, type, pinCount, pins, statement, statementXs, statementYs, maxV, minV, maxI, ohm) {
    this.name = name;
    this.type = type;
    this.pinCount = pinCount;
    this.pins = pins;
    this.statement = statement;
    this.statementXs = statementXs;
    this.statementYs = statementYs;
    this.that = this;
    this.id = null;
    this.maxV = maxV;
    this.minV = minV;
    this.maxI = maxI;
    this.ohm = ohm;

    this.isArduino = function() {
      return this.name == 'Arduino';
    }
  }

  function getColorInt() {
    return Math.floor(Math.random() * 256);
  }

  $('[data-slidepanel]').slidepanel({
      orientation: 'right',
      mode: 'push',
      static: true
  });

  var responceJson;
  //console.log("ready");
  $.ajax({
    url: 'http://localhost:3000/getjson',
    method: 'POST',
    data: 'done',
    dataType: 'html'
  }).done(function (msg) {
    //console.log('success');
    responceJson = JSON.parse(msg);//, function(k, v) {
      //console.log("k: "+k+" v: "+v);
    //});
    console.log(responceJson);
    $("#btn-delete").removeClass("disabled");
    var firstMeet = false;
    var deleteMode = false;
    var appendArduino = '<a href="#" class="list-group-item disabled">Arduino</a>';
    var appendComponent = '<a href="#" class="list-group-item disabled">Components</a>'
    var arr = Object.keys(responceJson).map(function(k, v) {  return responceJson[k] });//console.log(k);console.log(v);

    for (var i = 0; i < arr.length; i++) {
      // = new Pins[arr[i].pinCount];
      var pins = [];
      var j=0;
      var prev;
      Object.keys(arr[i].pinNamesAndTypes).map(function(current, v) {
        if (arr[i].name == 'Arduino' && arr[i].type == 'Uno' && prev == '5V') {
          var pin = new Pins('GND', 'ground', arr[i].pinXs[j], arr[i].pinYs[j]);
          pins.push(pin);
          j++;
          var pin = new Pins('GND', 'ground', arr[i].pinXs[j], arr[i].pinYs[j]);
          pins.push(pin);
          j++;
        } //else {
          var pin = new Pins(current, arr[i].pinNamesAndTypes[current], arr[i].pinXs[j], arr[i].pinYs[j]);
          //console.log(current+": "+arr[i].pinNamesAndTypes[current]);
          pins.push(pin);
          j++;
        //}
        prev = current;
      });
      //for (var j = 0; j < arr[i].pinCount; j++) {
      //console.log("Pins: ");
      //console.log(pins);
      //}
      arduinoElement.push(new ArduinoElement(arr[i].name, arr[i].type, arr[i].pinCount, pins, arr[i].statement, arr[i].statementXs, arr[i].statementYs, arr[i].maxV, arr[i].minV, arr[i].maxI, arr[i].ohm));
      var currentElement = arduinoElement.pop()
      for (var j = 0; j < currentElement.pins.length; j++) {
        currentElement.pins[j].setParentObject(currentElement);
      }
      arduinoElement.push(currentElement);
      //console.log("Element: ");
      //console.log(arduinoElement);
      var menuName = arr[i].name==arr[i].type?(arr[i].name):(arr[i].name+' '+arr[i].type);
      if (arr[i].name == 'Arduino') appendArduino = appendArduino + '<a href="#" class="list-group-item" data="'+i+'">'
            + arr[i].name + ' ' + arr[i].type + '<img src="images/' + arr[i].statement.default + '"></a>';
      else appendComponent = appendComponent + '<a href="#" class="list-group-item" data="'+i+'">'
            + menuName + '<p><img src="images/' + arr[i].statement.default + '"></p></a>';
    }

    $("#menu").html(appendArduino+appendComponent);
    //var height = window.screen.availHeight * 0.9;
    //var width = window.screen.availWidth * 0.9;
    var style = {
      width: window.screen.availWidth * 0.88,
      height: window.screen.availHeight * 0.80
    }

    var oppasity = window.screen.availWidth * 0.13;

    $("#sidePanelButton").on('click', function() {
      if (!sidePanel) {
        style.width = style.width - oppasity;
        $(".panel").css(style);
      }
      sidePanel = true;
    });

    $("a.close").on('click', function() {
      if (sidePanel) {
        style.width = style.width + oppasity;
        $(".panel").css(style);
      }
      sidePanel = false;
    });

    $("#historyClose").on('click', function() {
      $("#history").offcanvas('hide');
    });

    $(".panel").css(style);
    myPanel = new jsgl.Panel(document.getElementById("panel"));
    myPanel.addClickListener(panelInteraction);
    myPanel.addMouseMoveListener(panelInteraction);
    myPanel.addMouseDownListener(panelInteraction);
    myPanel.addMouseOverListener(panelInteraction);
    myPanel.addMouseOutListener(panelInteraction);

    $("#historyMenu").on('click', '#backToTheFuture', function() {
      //console.log(this);
      var index = $(this).attr("data");
      for (var i = history.length-1; i >= index; i--) {
        var elementsToDeleteArray = history.pop();
        for (var j = 0; j < elementsToDeleteArray.length; j++) {
          myPanel.removeElement(elementsToDeleteArray[j]);
        }
      }
      historyUpdate(history);
    });

    $("#startButton").on('click', function() {
      var warning = false;
      if (arduinoElementActive.length < 2) $("#infoLabel").html("Create more elements");
      else {
        for (var i = 0; i < arduinoElementActive.length; i++) {
          var hasOut = false;
          var hasIn = false;
          for (var j = 0; j < arduinoElementActive[i].pins.length; j++) {
            if (arduinoElementActive[i].pins[j].pinOut.length > 0) {
              hasOut = true;
              if (arduinoElementActive[i].name == "Arduino") {
                current = arduinoElementActive[i].maxI;
                voltage = arduinoElementActive[i].maxV;
                info = "";
                //console.log(arduinoElement[i].pins[j].pinName);
                var elemVoltage = recursiveCheck(arduinoElementActive[i], 0);
              }
            }
            if (arduinoElementActive[i].pins[j].pinIn) {
              hasIn = true;
            }
          }
          warning = hasOut & hasIn;
        }
        //console.log(info);
        console.log("ElemVoltage = " + elemVoltage);
        if (voltage > elemVoltage && info == "") {
          $("#infoLabel").attr("class", "label label-success infoLabel");
          $("#infoLabel").html("Everything is OK! Current voltage: " + elemVoltage + "V.");
        } else if (voltage < elemVoltage) {
          $("#infoLabel").attr("class", "label label-danger infoLabel");
          $("#infoLabel").html("Output voltage < network voltage! " + info);
        } else if (info) {
          $("#infoLabel").attr("class", "label label-danger infoLabel");
          $("#infoLabel").html(info);
        }
        if (!warning) {
          $("#infoLabel2").attr("class", "label label-warning infoLabel");
          $("#infoLabel2").html("One of the elements is not wired");
        } else {
          $("#infoLabel2").attr("class", "infoLabel");
          $("#infoLabel2").html("");
        }
      }
    })

    var z=2;
    $("a.list-group-item").filter(function(index) {
      return $(this).attr("class") != "list-group-item disabled";
    }).on("click", function() {
      //console.log(this);
      var myImage = myPanel.createImage();
      var index = $(this).attr("data");
      myImage.setUrl("images/" + arduinoElement[index].statement.default);
      myImage.setLocationXY(style.width/2-arduinoElement[index].statementXs[0]/2, style.height/2-arduinoElement[index].statementYs[0]/2);
      myImage.setSizeWH(arduinoElement[index].statementXs[0], arduinoElement[index].statementYs[0]);
      if (arduinoElement[index].name == 'Arduino') {
        $("#infoLabel").attr("class", "label label-info infoLabel");
        $("#infoLabel").html("Create an element for Arduino");
        myImage.setZIndex(0);
      }
      else myImage.setZIndex(z);
      z++;
      var clonePins = [];
      for (var i = 0; i < arduinoElement[index].pins.length; i++) {
        clonePins[i] = jQuery.extend(true, {}, arduinoElement[index].pins[i]);
      }

      var cloneArduinoElement = jQuery.extend(true, {}, arduinoElement[index]);
      cloneArduinoElement.pins = clonePins;
      arduinoElementActive.push(cloneArduinoElement);
      arduinoElementActive[arduinoElementActive.length-1].id = idElement;
      idElement++;
      arduinoElementActive[arduinoElementActive.length-1].imageOnPanel = myImage;
      arduinoElementActive[arduinoElementActive.length-1].imageOnPanel.parent = arduinoElementActive[arduinoElementActive.length-1];
      myPanel.addElement(arduinoElementActive[arduinoElementActive.length-1].imageOnPanel);
      var array = [];
      array.push(arduinoElementActive[arduinoElementActive.length-1].imageOnPanel);
      console.log(arduinoElementActive.length);
      console.log(arduinoElementActive);
      for (var i = 0; i < arduinoElementActive[arduinoElementActive.length-1].pinCount; i++) {
        var pinRect = myPanel.createRectangle();
        pinRect.setLocationXY(arduinoElementActive[arduinoElementActive.length-1].imageOnPanel.getX()+arduinoElementActive[arduinoElementActive.length-1].pins[i].pinX,
                              arduinoElementActive[arduinoElementActive.length-1].imageOnPanel.getY()+arduinoElementActive[arduinoElementActive.length-1].pins[i].pinY);
        pinRect.setSizeWH(10, 10);
        if (arduinoElementActive[arduinoElementActive.length-1].name == 'Arduino') pinRect.setZIndex(1);
        else pinRect.setZIndex(z);
        pinRect.getFill().setColor("rgb(255,0,0)");
        pinRect.getFill().setOpacity(0.0);
        pinRect.getStroke().setOpacity(0.0);
        arduinoElementActive[arduinoElementActive.length-1].pins[i].setParentObject(arduinoElementActive[arduinoElementActive.length-1]);
        arduinoElementActive[arduinoElementActive.length-1].pins[i].rect = pinRect;
        arduinoElementActive[arduinoElementActive.length-1].pins[i].rect.parentPin = arduinoElementActive[arduinoElementActive.length-1].pins[i];
        myPanel.addElement(arduinoElementActive[arduinoElementActive.length-1].pins[i].rect);
        array.push(arduinoElementActive[arduinoElementActive.length-1].pins[i].rect);
      }
      history.push(array);
      historyUpdate(history);
      z++;
    });
    $("#btn-delete").on('click', function() {
      deleteMode = !deleteMode;
      if (deleteMode) {
        //console.log(this);
        $("#btn-delete").addClass("active");
        myPanel.removeClickListener(panelInteraction);
        myPanel.removeMouseMoveListener(panelInteraction);
        myPanel.removeMouseDownListener(panelInteraction);
        myPanel.removeMouseOverListener(panelInteraction);
        myPanel.removeMouseOutListener(panelInteraction);
        /* --------------------------------------------- */
        myPanel.addClickListener(deleteElement);
        myPanel.addMouseOverListener(deleteElement);
        myPanel.addMouseOutListener(deleteElement);
        myPanel.addMouseMoveListener(deleteElement);
        myPanel.addMouseDownListener(deleteElement);
        myPanel.setCursor(jsgl.Cursor.CROSSHAIR);
      } else {
        $("#btn-delete").removeClass("active");
        myPanel.removeClickListener(deleteElement);
        myPanel.removeMouseOverListener(deleteElement);
        myPanel.removeMouseOutListener(deleteElement);
        myPanel.removeMouseMoveListener(deleteElement);
        myPanel.removeMouseDownListener(deleteElement);
        /* --------------------------------------------- */
        myPanel.addClickListener(panelInteraction);
        myPanel.addMouseMoveListener(panelInteraction);
        myPanel.addMouseDownListener(panelInteraction);
        myPanel.addMouseOverListener(panelInteraction);
        myPanel.addMouseOutListener(panelInteraction);
        myPanel.setCursor(jsgl.Cursor.DEFAULT);
      }
    });

    function pinInteraction(eventArgs) {
      //var choosen = false;
      switch(eventArgs.getEventType()) {
        case jsgl.MouseEvent.CLICK:
          //sourcePin = eventArgs.getSourceElement();
          //sourcePin.getFill().setOpacity(1.0);
          //choosen = true;
          break;
        case jsgl.MouseEvent.DOWN:
          //sourcePin = eventArgs.getSourceElement();
          //sourcePin.getFill().setOpacity(1.0);
          //choosen = true;
          break;
        case jsgl.MouseEvent.UP:
          //text = "mouse up";
          break;
        case jsgl.MouseEvent.MOVE:
          //text = "mouse move";
          eventArgs.getSourceElement().getFill().setOpacity(1.0);
          break;
        case jsgl.MouseEvent.OVER:
          eventArgs.getSourceElement().getFill().setOpacity(1.0);
          break;
        case jsgl.MouseEvent.OUT:
          if (!eventArgs.getSourceElement().parentPin.choosen) eventArgs.getSourceElement().getFill().setOpacity(0.0);
          break;
      }
    }

    function elementInteraction(eventArgs) {
      switch(eventArgs.getEventType()) {
        case jsgl.MouseEvent.CLICK:
          sourceElement = null;
          break;
        case jsgl.MouseEvent.DOWN:
          sourceElement = eventArgs.getSourceElement();
          //for (var i = 0; i < arduinoElement.length; i++) {
            //if (sourceElement == arduinoElement[i].imageOnPanel) sourceElement.parent = arduinoElement[i];
          //}
          choosen = true;
          break;
        case jsgl.MouseEvent.UP:
          //text = "mouse up";
          break;
        case jsgl.MouseEvent.MOVE:
          //text = "mouse move";
          if (!currentLine) {
            if (sourceElement != null) {
              sourceElement.setLocationXY(eventArgs.getX()-sourceElement.getWidth()/2, eventArgs.getY()-sourceElement.getHeight()/2);
              for (var i = 0; i < sourceElement.parent.pinCount; i++) {
                sourceElement.parent.pins[i].rect.setLocationXY(sourceElement.getX()+sourceElement.parent.pins[i].pinX,
                                                                sourceElement.getY()+sourceElement.parent.pins[i].pinY);
                //if (sourceElement.parent.isArduino()) console.log("Arduino lagggggggggggggggggggggg");
                if (sourceElement.parent.pins[i].lineOut.length > 0) {
                  var lineArray = sourceElement.parent.pins[i].lineOut;
                  console.log("line out: " + sourceElement.parent.pins[i].lineOut.length);
                  for (var i = 0; i < lineArray.length; i++) {
                    lineArray[i].setStartPointXY(sourceElement.parent.pins[i].rect.getX()+5, sourceElement.parent.pins[i].rect.getY()+5);
                  }
                }
                if (sourceElement.parent.pins[i].lineIn.length > 0) {
                  var lineArray = sourceElement.parent.pins[i].lineIn;
                  console.log("line in");
                  for (var i = 0; i < lineArray.length; i++) {
                    lineArray[i].setEndPointXY(sourceElement.parent.pins[i].rect.getX()+5, sourceElement.parent.pins[i].rect.getY()+5);
                  }
                }
                //if (sourceElement.parent.pins[i].lineIn)
                //  sourceElement.parent.pins[i].lineIn.setEndPointXY(sourceElement.parent.pins[i].rect.getX()+5, sourceElement.parent.pins[i].rect.getY()+5);
              }
            }
          }
          break;
        case jsgl.MouseEvent.OVER:
          break;
        case jsgl.MouseEvent.OUT:
          break;
      }
    }

    function panelInteraction(eventArgs) {
      switch(eventArgs.getEventType()) {
        case jsgl.MouseEvent.CLICK:
          sourceElement = null;
          if (sourcePinFromPanel){
            var nextSourcePinFromPanel = eventArgs.getSourceElement();
            if (nextSourcePinFromPanel instanceof jsgl.elements.RectangleElement) {
              if (sourcePinFromPanel == nextSourcePinFromPanel) {
                sourcePinFromPanel.getFill().setOpacity(0.0);
                myPanel.removeElement(sourcePinFromPanel.parentPin.lineOut.pop());
                //sourcePinFromPanel.parentPin.lineOut = null;
                sourcePinFromPanel.parentPin.choosen = false;
                console.log("Rectange = Rectangle");
                sourcePinFromPanel = null;
                currentLine = null;
              } else {
                //console.log(sourcePinFromPanel);
                //console.log(sourcePinFromPanel.parent);
                console.log(sourcePinFromPanel.parentPin.parentObject);
                console.log(nextSourcePinFromPanel.parentPin.parentObject);
                if (sourcePinFromPanel.parentPin.parentObject.id == nextSourcePinFromPanel.parentPin.parentObject.id) {
                  // shall i destroy the line (Pins.lineOut) or not?
                  // this time nothing happens
                  console.log("Rectange.parent = Rectangle.parent");
                } else {
                  console.log("Rectange.parent != Rectangle.parent");
                  sourcePinFromPanel.parentPin.pinOut.push(nextSourcePinFromPanel.parentPin);
                  nextSourcePinFromPanel.parentPin.pinIn.push(sourcePinFromPanel.parentPin);
                  console.log(sourcePinFromPanel.parentPin.pinOut);
                  console.log(nextSourcePinFromPanel.parentPin.pinIn);
                  currentLine = sourcePinFromPanel.parentPin.lineOut.pop();
                  if (sourcePinFromPanel.parentPin.parentObject.isArduino())
                    currentLine.getStroke().setColor("rgb(0,127,0)");//sourcePinFromPanel.parentPin.lineOut.getStroke().setColor("rgb(0,127,0)");
                  else if (!sourcePinFromPanel.parentPin.parentObject.isArduino() && nextSourcePinFromPanel.parentPin.pinType == 'ground')
                    currentLine.getStroke().setColor("rgb(0,0,127)");//sourcePinFromPanel.parentPin.lineOut.getStroke().setColor("rgb(0,0,127)");
                  else currentLine.getStroke().setColor("rgb(" + getColorInt() + "," + getColorInt() + "," + getColorInt() + ")");//sourcePinFromPanel.parentPin.lineOut.getStroke().setColor("rgb(" + getColorInt() + "," + getColorInt() + "," + getColorInt() + ")");
                  currentLine.setEndPointXY(nextSourcePinFromPanel.getX()+5, nextSourcePinFromPanel.getY()+5);//sourcePinFromPanel.parentPin.lineOut.setEndPointXY(nextSourcePinFromPanel.getX()+5, nextSourcePinFromPanel.getY()+5);
                  sourcePinFromPanel.getFill().setOpacity(0.0);
                  sourcePinFromPanel.parentPin.lineOut.push(currentLine);
                  nextSourcePinFromPanel.parentPin.lineIn.push(currentLine); //= sourcePinFromPanel.parentPin.lineOut;

                  history.push(currentLine);
                  historyUpdate(history);
                  sourcePinFromPanel = null;
                  currentLine = null;
                }
              }
            }
          } else {
            sourcePinFromPanel = eventArgs.getSourceElement();
            if (sourcePinFromPanel instanceof jsgl.elements.RectangleElement) {
              console.log("Rectangle");
              sourcePinFromPanel.getFill().setOpacity(1.0);
              sourcePinFromPanel.parentPin.choosen = true;
              var myLine = myPanel.createLine();
              myLine.setStartPointXY(sourcePinFromPanel.getX()+5, sourcePinFromPanel.getY()+5);
              myLine.setEndPointXY(eventArgs.getX(), eventArgs.getY());
              myLine.getStroke().setWeight(5);
              myLine.getStroke().setColor("rgb(0,0,0)");
              sourcePinFromPanel.parentPin.lineOut.push(myLine);
              myPanel.addElement(sourcePinFromPanel.parentPin.lineOut[sourcePinFromPanel.parentPin.lineOut.length-1]);
              currentLine = sourcePinFromPanel.parentPin.lineOut[sourcePinFromPanel.parentPin.lineOut.length-1];
              console.log(sourcePinFromPanel.parentPin.lineOut.length);
              //sourcePinFromPanel.parentPin.lineOut;
              //currentLine = sourcePinFromPanel.parent.lineOut;
            } else sourcePinFromPanel = null;
          }
          break;
        case jsgl.MouseEvent.DOWN:
          if (!sourcePinFromPanel) {
            if (eventArgs.getSourceElement() instanceof jsgl.elements.ImageElement) sourceElement = eventArgs.getSourceElement();
          }
          break;
        case jsgl.MouseEvent.UP:
          //text = "mouse up";
          break;
        case jsgl.MouseEvent.MOVE:
          //text = "mouse move";
          if (currentLine) {
            currentLine.setEndPointXY(eventArgs.getX(), eventArgs.getY());
          } else {
            if (sourceElement != null) {
              sourceElement.setLocationXY(eventArgs.getX()-sourceElement.getWidth()/2, eventArgs.getY()-sourceElement.getHeight()/2);
              for (var i = 0; i < sourceElement.parent.pins.length; i++) {
                var pin = sourceElement.parent.pins[i];
                pin.rect.setLocationXY(sourceElement.getX()+pin.pinX,
                                       sourceElement.getY()+pin.pinY);
                if (pin.lineOut.length > 0) {
                  for (var j = 0; j < pin.lineOut.length; j++) {
                    pin.lineOut[j].setStartPointXY(pin.rect.getX()+5, pin.rect.getY()+5);
                  }
                }
                if (pin.lineIn.length > 0) {
                  for (var j = 0; j < pin.lineIn.length; j++) {
                    pin.lineIn[j].setEndPointXY(pin.rect.getX()+5, pin.rect.getY()+5);
                  }
                }
              }
            }
          }
          break;
        case jsgl.MouseEvent.OVER:
          if (eventArgs.getSourceElement() instanceof jsgl.elements.RectangleElement) eventArgs.getSourceElement().getFill().setOpacity(1.0);
          break;
        case jsgl.MouseEvent.OUT:
          if (eventArgs.getSourceElement() instanceof jsgl.elements.RectangleElement
          && !eventArgs.getSourceElement().parentPin.choosen) eventArgs.getSourceElement().getFill().setOpacity(0.0);
          break;
      }
    }

    function deleteElement(eventArgs) {
      var strokeColor;
      var strokeWeight;
      var elementThatAboutToDelete;
      switch(eventArgs.getEventType()) {
        case jsgl.MouseEvent.CLICK:
          console.log("Clicked on: ");
          console.log(eventArgs.getSourceElement());
          myPanel.removeElement(eventArgs.getSourceElement());
          //if (elementThatAboutToDelete) myPanel.removeElement(eventArgs.getSourceElement());
          break;
        case jsgl.MouseEvent.DOWN:

          break;
        case jsgl.MouseEvent.UP:

          break;
        case jsgl.MouseEvent.MOVE:

          break;
        case jsgl.MouseEvent.OVER:
          elementThatAboutToDelete = eventArgs.getSourceElement();
          console.log(elementThatAboutToDelete);
          if (elementThatAboutToDelete) {
            elementThatAboutToDelete.getStroke().setEnabled(true);
            strokeWeight = elementThatAboutToDelete.getStroke().getWeight();
            elementThatAboutToDelete.getStroke().setWeight(10);
            strokeColor = elementThatAboutToDelete.getStroke().getColor();
            elementThatAboutToDelete.getStroke().setColor("rgb(0,0,0)");

            console.log("123");
          }
          break;
        case jsgl.MouseEvent.OUT:
          if (elementThatAboutToDelete) {
            elementThatAboutToDelete.getStroke().setWeight(strokeWeight);
            elementThatAboutToDelete.getStroke().setColor(strokeColor);
            //elementThatAboutToDelete.getStroke().setEnabled(false);
          }
          elementThatAboutToDelete = null;
          break;
      }
    }

    function historyUpdate(history) {
      var s = '';
      console.log(history.length);
      for (var i = history.length-1; i >=0 ; i--) {
        if (history[i][0] instanceof jsgl.elements.ImageElement) s = s + '<a href="#" id="backToTheFuture" class="list-group-item" data="' + i + '">Created ' + history[i][0].parent.name + '</a>';
        else if (history[i] instanceof jsgl.elements.LineElement) s = s + '<a href="#" id="backToTheFuture" class="list-group-item" data="' + i + '">Created wire</a>';
      }
      $("#historyMenu").html(s);
    }

    function recursiveCheck(lastItem, elemVoltage) {
      for (var i = 0; i < lastItem.pins.length; i++) {
        var pinOut1 = lastItem.pins[i].pinOut;
        if (pinOut1.length > 0) {
          //for (var i = 0; i < pinOut1.length; i++) {
            if (pinOut1[0].parentObject.name == "Arduino") {
              //console.log(pinOut1[0].type);
              if (pinOut1[0].pinType != "ground") {
                info = "Electrical network should finish with Ground pin!";
              }
              return elemVoltage;
            } else {
              if (pinOut1[0].parentObject.maxV == undefined) elemVoltage += pinOut1[0].parentObject.ohm * current;
              else elemVoltage += pinOut1[0].parentObject.maxV;
              return recursiveCheck(pinOut1[0].parentObject, elemVoltage);
            }
          //}
        }
      }
    }
  });
});
