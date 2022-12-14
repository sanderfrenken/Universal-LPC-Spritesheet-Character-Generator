_.mixin(_.str.exports());

$.expr[':'].icontains = function(a, i, m) {
  return jQuery(a).text().toUpperCase()
      .indexOf(m[3].toUpperCase()) >= 0;
};

$(document).ready(function() {

  var matchBodyColor = true;
  var params = jHash.val();
  var sheetCredits = [];
  const parsedCredits = loadFile("CREDITS.csv").split("\n");
  var creditColumns = parsedCredits[0];

  var canvas = $("#spritesheet").get(0);
  var ctx = canvas.getContext("2d", { willReadFrequently: true });
  var images = {};
  const universalFrameSize = 64;
  const universalSheetWidth = 832;
  const universalSheetHeight = 1344;

  // Preview Animation
  var anim = $("#previewAnimations").get(0);
  var animCtx = anim.getContext("2d");
  var animationItems = [1, 2, 3, 4, 5, 6, 7, 8]; // default for walk
  var animRowStart = 8; // default for walk
  var animRowNum = 4; // default for walk
  var currentAnimationItemIndex = 0;
  var activeCustomAnimation = "";
  var addedCustomAnimations = [];

  // on hash (url) change event, interpret and redraw
  jHash.change(function() {
    params = jHash.val();
    interpretParams();
    redraw();
    showOrHideElements();
  });

  interpretParams();
  if (Object.keys(params).length == 0) {
    $("input[type=reset]").click();
    setParams();
    selectDefaults();
  }
  redraw();
  showOrHideElements();
  nextFrame();

  $("input[type=radio]").attr('title', function() {
    var name = "";
    if ($(this).data(`layer_1_${getBodyTypeName()}`)) {
      name = $(this).data(`layer_1_${getBodyTypeName()}`);
    }
    if (name === "") {
      return "";
    }
    const creditEntry = getCreditFor(name);
    if (creditEntry) {
      let parts = splitCsv(creditEntry);
      if (parts.length == 10) {
        return "Created by: " + parts[2];
      }
    } else {
      console.warn("No credit entry for: ", name);
      return "No credits found for this graphic";
    }
    return creditEntry;
  });

  // set params and redraw when any radio button is clicked on
  $("input[type=radio]").each(function() {
    $(this).click(function() {
      if (matchBodyColor) {
        matchBodyColorForThisAsset = $(this).attr('matchBodyColor')
        if (matchBodyColorForThisAsset && matchBodyColorForThisAsset != 'false') {
          selectColorsToMatch($(this).attr('variant'));
        }
      }
      setParams();
      redraw();
      showOrHideElements();
    });
  });

  // Toggle display of a list elements children when clicked
  // Again, do not multiple toggle when clicking on children
  $("#chooser ul>li").click(function(event) {
    $(this).children("span").toggleClass("condensed").toggleClass("expanded");
    var $ul = $(this).children("ul");
    $ul.toggle('slow').promise().done(drawPreviews);
    event.stopPropagation();
  });

  $("#collapse").click(function() {
    $("#chooser>ul ul").hide('slow');
    $("#chooser>ul span.expanded").removeClass("expanded").addClass("condensed");
  });
  $("#expand").click(function() {
    let parents = $('input[type="radio"]:checked').parents("ul")
    parents.prev('span').addClass("expanded")
    parents.show().promise().done(drawPreviews)
  })

  function search(e) {
    $('.search-result').removeClass('search-result')
    let query = $('#searchbox').val()
    if (query != '' && query.length > 1) {
      let results = $('#chooser span:icontains('+query+')').addClass("search-result")
      let parents = results.parents("ul")
      parents.prev('span').addClass("expanded").removeClass('condensed')
      parents.show().promise().done(drawPreviews)
    }
  }
  $("#searchbox").on('search',search)
  $("#search").click(search)
  $("#customizeChar").on('submit',function(e) {
    search()
    e.preventDefault()
  })

  $('#displayMode-compact').click(function() {
    $('#chooser').toggleClass('compact')
  })

  $('#match_body-color').click(function() {
    matchBodyColor = $(this).is(":checked");
  })

  $('#scroll-to-credits').click(function(e) {
    $('#credits')[0].scrollIntoView()
    e.preventDefault();
  })

  $("#previewFile").change(function() {
    previewFile();
  });

  $("#ZPOS").change(function() {
    previewFile();
  });

  $("#saveAsPNG").click(function() {
    renameImageDownload(this, canvas, 'Download' + Math.floor(Math.random() * 100000) + '.png');
    return true
  });

  $("#resetAll").click(function() {
    window.setTimeout(function() {
      document.getElementById("previewFile").value = "";
      images["uploaded"] = null;
      document.getElementById("ZPOS").value = 0;
      params = {};
      jHash.val(params);
      interpretParams();
      selectDefaults();
      redraw();
      showOrHideElements();
    }, 0, false);
  });

  $(".replacePinkMask").click(function() {
    var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height),
    pix = imgData.data;

    for (var i = 0, n = pix.length; i <n; i += 4) {
      const a = pix[i+3];
      if (a > 0) {
        const r = pix[i];
        const g = pix[i+1];
        const b = pix[i+2];
        if (r === 255 && g === 44 && b === 230) {
          pix[i + 3] = 0;
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  });

  $(".generateSheetCreditsCsv").click(function() {
    let bl = new Blob([sheetCredits.join('\n')], {
      type: "text/html"
    });
    let a = document.createElement("a");
    a.href = URL.createObjectURL(bl);
    a.download = "sheet-credits.csv";
    a.hidden = true;
    document.body.appendChild(a);
    a.innerHTML = "dummyhtml";
    a.click();
    document.removeChild(a);
  });

  $(".generateSheetCreditsTxt").click(function() {
    let bl = new Blob([sheetCreditsToTxt()], {
      type: "text/html"
    });
    let a = document.createElement("a");
    a.href = URL.createObjectURL(bl);
    a.download = "sheet-credits.txt";
    a.hidden = true;
    document.body.appendChild(a);
    a.innerHTML = "dummyhtml";
    a.click();
    document.removeChild(a);
  });

  $(".generateAllCredits").click(function() {
    let bl = new Blob([parsedCredits.join('\n')], {
      type: "text/html"
    });
    let a = document.createElement("a");
    a.href = URL.createObjectURL(bl);
    a.download = "all-credits.csv";
    a.hidden = true;
    document.body.appendChild(a);
    a.innerHTML = "dummyhtml";
    a.click();
    document.removeChild(a);
  });

  $("#whichAnim").change(function() {
    animationItems = [];
    const selectedAnim = $("#whichAnim>:selected");
    const selectedAnimationValue = $("#whichAnim>:selected").text()
    const animRowFrames = parseInt(selectedAnim.data("cycle"));
    animRowStart = parseInt(selectedAnim.data("row"));
    animRowNum = parseInt(selectedAnim.data("num"));

    currentAnimationItemIndex = 0;
    if (addedCustomAnimations.includes(selectedAnimationValue)) {
      activeCustomAnimation = selectedAnimationValue;
    }
    if (activeCustomAnimation !== "") {
      const selectedCustomAnimation = customAnimations[activeCustomAnimation];
      animRowNum = selectedCustomAnimation.frames.length;
      animRowStart = 0;
      for (var i = 0; i < selectedCustomAnimation.frames[0].length; ++i) {
        animationItems.push(i);
      }
      return
    }
    const animRowFramesCustom = selectedAnim.data("cycle-custom");
    if (animRowFramesCustom !== undefined) {
      animationItems = animRowFramesCustom.split('-').map(Number);
      if (animationItems.length > 0) {
        return;
      }
    }
    for (var i = 1; i < animRowFrames; ++i) {
      animationItems.push(i);
    }
  });

  function clearCustomAnimationPreviews() {
    for (var i = 0; i < addedCustomAnimations.length; ++i) {
      $('#whichAnim').children(`option[value=${addedCustomAnimations[i]}]`).remove();
    }
  }

  function addCustomAnimationPreviews() {
    clearCustomAnimationPreviews();
    for (var i = 0; i < addedCustomAnimations.length; ++i) {
      $('#whichAnim').append(new Option(`${addedCustomAnimations[i]}`, `${addedCustomAnimations[i]}`))
    }
  }

  $("#spritesheet,#previewAnimations").on('click',function(e) {
    $(this).toggleClass('zoomed')
  })

  function selectDefaults() {
    $(`#${"body-Body_color_light"}`).prop("checked", true);
    $(`#${"head-Human_male_light"}`).prop("checked", true);
    setParams();
  }

  function selectColorsToMatch(variant) {
    const colorToMatch = variant;
    $("input[matchBodyColor^=true]:checked").each(function() {
      // 1. Determine the type of asset that is selected (eg. human male)
      const assetType = $(this).attr('parentName').replaceAll(" ", "_");
      // 2. Determine the color of asset that needs to selected (eg. head-human_male_light)
      const assetToSelect =  $(this).attr('name') + "-" + assetType + "_" + colorToMatch;
      $(`#${assetToSelect}`).prop("checked", true);
    })
    setParams();
  }

  function getCreditFor(fileName) {
    if (fileName !== "") {
      for (let creditEntry of parsedCredits) {
        if (creditEntry.startsWith(fileName)) {
          return creditEntry;
        }
      };
    }
  }

  function addCreditFor(fileName) {
    if (fileName !== "") {
      let creditEntry = getCreditFor(fileName);
      if (!creditEntry) {
        sheetCredits.push(fileName+",!MISSING LICENSE INFORMATION! PLEASE CORRECT MANUALY AND REPORT BACK VIA A GITHUB ISSUE,,,,,,,,BAD");
      } else {
        sheetCredits.push(creditEntry);
      }
    }
    displayCredits();
  }

  function sheetCreditsToTxt() {
    let csv = parseCSV(sheetCredits.join('\n'))
    let authors = csv.slice(1).map((row) => row[2].split(",").map((au) => au.trim())).flat()
    authors = [...new Set(authors)]

    let out = csv.slice(1).map(function(row) {
      let urls = row.slice(4,9)
        .filter(function (x) { return !!x })
        .map(function (x) { return "    - " + x})
      return [`- ${row[0]}: by ${row[2]}. License(s): ${row[3]}. ${row[1]}`].concat(urls).join("\n")
    })
    return "Authors: " + authors.join(", ")+"\n\n"+out.join("\n\n")
  }

  function displayCredits() {
    $("textarea#creditsText").val(sheetCreditsToTxt());
  }

  function previewFile(){
    var preview = document.querySelector('img'); //selects the query named img
    var file    = document.querySelector('input[type=file]').files[0]; //sames as here

    var img = new Image;
    img.onload = function() {
      images["uploaded"] = img;
      redraw();
      showOrHideElements();
    }
    img.src = URL.createObjectURL(file);
  }

  function renameImageDownload(link, canvasItem, filename) {
    link.href = canvasItem.toDataURL();
    link.download = filename;
  };

  function getBodyTypeName() {
    if ($("#sex-male").prop("checked")) {
      return "male";
    } else if ($("#sex-female").prop("checked")) {
      return "female";
    } else if ($("#sex-teen").prop("checked")) {
      return "teen";
    } else if ($("#sex-child").prop("checked")) {
      return "child";
    } else if ($("#sex-muscular").prop("checked")) {
      return "muscular";
    } else if ($("#sex-pregnant").prop("checked")) {
      return "pregnant";
    }
    return "ERROR";
  }

  function redraw() {
    let itemsToDraw = [];
    const bodyTypeName = getBodyTypeName();

    sheetCredits = [creditColumns];
    zPosition = 0;
    $("input[type=radio]:checked").each(function(index) {
      for (jdx =1; jdx < 10; jdx++) {
        if ($(this).data(`layer_${jdx}_${bodyTypeName}`)) {
          const zPos = $(this).data(`layer_${jdx}_zpos`);
          const custom_animation = $(this).data(`layer_${jdx}_custom_animation`);
          const fileName = $(this).data(`layer_${jdx}_${bodyTypeName}`);
          if (fileName !== "") {
            const itemToDraw = {};
            itemToDraw.fileName = fileName;
            itemToDraw.zPos = zPos;
            itemToDraw.custom_animation = custom_animation;
            addCreditFor(fileName);
            itemsToDraw.push(itemToDraw);
          }
        } else {
          break;
        }
      }
    });
    if (images["uploaded"] != null) {
      const itemToDraw = {};
      itemToDraw.fileName = "uploaded";
      itemToDraw.zPos = parseInt(document.getElementById("ZPOS").value) || 0;;
      itemsToDraw.push(itemToDraw);
    }
    drawItems(itemsToDraw);
  }

  function drawItems(itemsToDraw) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var requiredCanvasHeight = universalSheetHeight;
    var requiredCanvasWidth = universalSheetWidth;
    clearCustomAnimationPreviews();
    addedCustomAnimations = [];
    for (var i = 0; i < itemsToDraw.length; ++i) {
      const customAnimationString = itemsToDraw[i].custom_animation;
      if (customAnimationString !== undefined) {
        if (addedCustomAnimations.includes(customAnimationString)) {
          continue;
        }
        addedCustomAnimations.push(customAnimationString);
        const customAnimation = customAnimations[customAnimationString];
        const customAnimationWidth = customAnimation.frameSize * customAnimation.frames[0].length;
        const customAnimationHeight = customAnimation.frameSize * customAnimation.frames.length;
        requiredCanvasWidth = Math.max(requiredCanvasWidth, customAnimationWidth);
        requiredCanvasHeight = requiredCanvasHeight + customAnimationHeight;
      }
    }
    canvas.width = requiredCanvasWidth;
    canvas.height = requiredCanvasHeight;

    $("#chooser").css("height", canvas.height);

    var itemIdx = 0;
    itemsToDraw.sort(function(lhs, rhs) {
      return parseInt(lhs.zPos) - parseInt(rhs.zPos);
    });

    for (item in itemsToDraw) {
      const fileName = itemsToDraw[itemIdx].fileName;
      const img = getImage(fileName);
      const custom_animation = itemsToDraw[itemIdx].custom_animation;

      if (custom_animation !== undefined) {
        const customAnimationDefinition = customAnimations[custom_animation];
        const frameSize = customAnimationDefinition.frameSize;

        const customAnimationCanvas=document.createElement("canvas");
        customAnimationCanvas.width=requiredCanvasWidth;
        customAnimationCanvas.height=requiredCanvasHeight-universalSheetHeight;
        const customAnimationContext=customAnimationCanvas.getContext("2d");

        const indexInArray = addedCustomAnimations.indexOf(custom_animation);
        var offSetInAdditionToOtherCustomActions = 0;
        for (var i = 0; i <indexInArray; ++i) {
          const otherCustomAction = customAnimations[addedCustomAnimations[i]];
          offSetInAdditionToOtherCustomActions+=otherCustomAction.frameSize * otherCustomAction.frames.length
        }

        for (var i = 0; i < customAnimationDefinition.frames.length; ++i) {
          const frames = customAnimationDefinition.frames[i];
          for (var j = 0; j < frames.length; ++j) {
            const frameCoordinateX = parseInt(frames[j].split(",")[1]);
            const frameCoordinateRowName = frames[j].split(",")[0];
            var mirrored = false;
            if (frames[j].split(",").length > 2 && frames[j].split(",")[2] == "mirrored") {
              mirrored = true;
            }
            const frameCoordinateY = animationRowsLayout[frameCoordinateRowName]+1;
            const offSet = (frameSize-universalFrameSize)/2;

            var imgDataSingleFrame = ctx.getImageData(universalFrameSize * frameCoordinateX, universalFrameSize * frameCoordinateY, universalFrameSize, universalFrameSize);
            if (mirrored) {
              imgDataSingleFrame = flipImageData(imgDataSingleFrame, universalFrameSize);
            }
            customAnimationContext.putImageData(imgDataSingleFrame, frameSize * j + offSet, frameSize * i + offSet + offSetInAdditionToOtherCustomActions);
          }
        }
        ctx.drawImage(customAnimationCanvas, 0, universalSheetHeight);
        ctx.drawImage(img, 0, universalSheetHeight+offSetInAdditionToOtherCustomActions);
      } else {
        drawImage(ctx, img);
      }
      itemIdx+=1;
    }
    addCustomAnimationPreviews();
  }

  function showOrHideElements() {
    $("li").each(function(index) {
      if ($(this).data("required")) {
        var requiredTypes = $(this).data("required").split(",");
        if (!requiredTypes.includes(getBodyTypeName())) {
          $(this).prop("style", "display:none");
        } else {
          $(this).prop("style", "");
        }
      }
    });
  }

  function loadFile(filePath) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", filePath, false);
    xmlhttp.send();
    return xmlhttp.responseText;
  }

  function parseCSV(str) {
      // https://stackoverflow.com/a/14991797/4091874
      // Author: Trevor Dixon https://stackoverflow.com/users/711902/trevor-dixon
      // CC-BY-SA 4.0 -> sublicensable to GPL v3

      var arr = [];
      var quote = false;  // 'true' means we're inside a quoted field

      // Iterate over each character, keep track of current row and column (of the returned array)
      for (var row = 0, col = 0, c = 0; c < str.length; c++) {
          var cc = str[c], nc = str[c+1];        // Current character, next character
          arr[row] = arr[row] || [];             // Create a new row if necessary
          arr[row][col] = arr[row][col] || '';   // Create a new column (start with empty string) if necessary

          // If the current character is a quotation mark, and we're inside a
          // quoted field, and the next character is also a quotation mark,
          // add a quotation mark to the current column and skip the next character
          if (cc == '"' && quote && nc == '"') { arr[row][col] += cc; ++c; continue; }

          // If it's just one quotation mark, begin/end quoted field
          if (cc == '"') { quote = !quote; continue; }

          // If it's a comma and we're not in a quoted field, move on to the next column
          if (cc == ',' && !quote) { ++col; continue; }

          // If it's a newline (CRLF) and we're not in a quoted field, skip the next character
          // and move on to the next row and move to column 0 of that new row
          if (cc == '\r' && nc == '\n' && !quote) { ++row; col = 0; ++c; continue; }

          // If it's a newline (LF or CR) and we're not in a quoted field,
          // move on to the next row and move to column 0 of that new row
          if (cc == '\n' && !quote) { ++row; col = 0; continue; }
          if (cc == '\r' && !quote) { ++row; col = 0; continue; }

          // Otherwise, append the current character to the current column
          arr[row][col] += cc;
      }
      return arr;
  }

  function interpretParams() {
    $("input[type=radio]").each(function() {
      var words = _.words($(this).attr('id'), '-');
      var initial = _.initial(words).join('-');
      $(this).prop("checked", $(this).attr("checked") || params[initial] == _.last(words));
    });
  }

  function setParams() {
    $("input[type=radio]:checked").each(function() {
      var words = _.words($(this).attr('id'), '-');
      var initial = _.initial(words).join('-');
      if (!$(this).attr("checked") || params[initial]) {
        params[initial] = _.last(words);
      }
    });
    jHash.val(params);
  }

  function getImage(imgRef) {
    if (images[imgRef])
    return images[imgRef];
    else {
      var img = new Image();
      img.src = "spritesheets/" + imgRef;
      img.onload = redraw;
      images[imgRef] = img;
      return img;
    }
  }

  function getImage2(imgRef, callback) {
    if (images[imgRef]) {
      callback(images[imgRef]);
      return images[imgRef];
    } else {

      var img = new Image();
      img.src = "spritesheets/" + imgRef;
      img.onload = function() { callback(img) };
      images[imgRef] = img;
      return img;
    }
  }

  function drawImage(ctx, img) {
    try {
      ctx.drawImage(img, 0, 0);
      zPosition++;
    } catch(err) {
      console.error("Error: could not find " + img.src);
    }
  }

  function drawPreviews() {
    this.find("input[type=radio]").filter(function() {
      return $(this).is(":visible");
    }).each(function() {
      $this = $(this)
      if (!$this.parent().hasClass("hasPreview") && !$this.parent().hasClass("noPreview")) {
        var prev = document.createElement("canvas");
        prev.setAttribute("width", universalFrameSize);
        prev.setAttribute("height", universalFrameSize);
        var prevctx = prev.getContext("2d");
        var img = null;
        const previewRow = parseInt($(this).data("preview_row"));
        var callback = function(img) {
          try {
            prevctx.drawImage(img, 0, previewRow * universalFrameSize, universalFrameSize, universalFrameSize, 0, 0, universalFrameSize, universalFrameSize);
          } catch (err) {
            console.log(err);
          }
        };
        img = getImage2($(this).data(`layer_1_${getBodyTypeName()}`), callback);
        if (img != null) {
          this.parentNode.insertBefore(prev, this);
          $(this).parent().addClass("hasPreview").parent().addClass("hasPreview");
        }
      }
    });
  };

  function nextFrame() {
    const animationType = $("#whichAnim>:selected").text();
    animCtx.clearRect(0, 0, anim.width, anim.height);
    currentAnimationItemIndex = (currentAnimationItemIndex + 1) % animationItems.length;
    const currentFrame = animationItems[currentAnimationItemIndex];
    var frameSize = universalFrameSize;
    var offSet = 0;
    if (activeCustomAnimation !== "") {
      const customAnimation = customAnimations[activeCustomAnimation];
      frameSize = customAnimation.frameSize;
      const indexInArray = addedCustomAnimations.indexOf(activeCustomAnimation);
      offSet = universalSheetHeight;
      for (var i = 0; i <indexInArray; ++i) {
        const otherCustomAction = customAnimations[addedCustomAnimations[i]];
        offSet+=otherCustomAction.frameSize * otherCustomAction.frames.length
      }
    }
    for (var i = 0; i < animRowNum; ++i) {
      animCtx.drawImage(canvas, currentFrame * frameSize, offSet + ((animRowStart + i) * frameSize), frameSize, frameSize, i * frameSize, 0, frameSize, frameSize);
    }
    setTimeout(nextFrame, 1000 / 8);
  }
});

function loadFile(filePath) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", filePath, false);
  xmlhttp.send();
  return xmlhttp.responseText;
}

function splitCsv(str) {
  return str.split(',').reduce((accum,curr)=>{
    if(accum.isConcatting) {
      accum.soFar[accum.soFar.length-1] += ','+curr
    } else {
      accum.soFar.push(curr)
    }
    if(curr.split('"').length % 2 == 0) {
      accum.isConcatting= !accum.isConcatting
    }
    return accum;
  },{soFar:[],isConcatting:false}).soFar
}
