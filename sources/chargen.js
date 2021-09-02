_.mixin(_.str.exports());

$.expr[':'].icontains = function(a, i, m) {
  return jQuery(a).text().toUpperCase()
      .indexOf(m[3].toUpperCase()) >= 0;
};

$(document).ready(function() {

  var params = jHash.val();
  var sheetCredits = [];
  const creditColumns = "filename,notes,authors,licenses,url1,url2,url3,url4,url5,status";
  const parsedCredits = loadFile("CREDITS.csv").split("\n");

  var canvas = $("#spritesheet").get(0);
  var ctx = canvas.getContext("2d");
  var images = {};

  // Preview Animation
  var oversize = false;
  var anim = $("#previewAnimations").get(0);
  var animCtx = anim.getContext("2d");
  var $selectedAnim = $("#whichAnim>:selected");
  var animRowStart = parseInt($selectedAnim.data("row"));
  var animRowNum = parseInt($selectedAnim.data("num"));
  var animRowFrames = parseInt($selectedAnim.data("cycle"));
  var currentAnimationItemIndex = 0;
  var animationItems = [1, 2, 3, 4, 5, 6, 7, 8]; // default for walk

  // on hash (url) change event, interpret and redraw
  jHash.change(function() {
    params = jHash.val();
    interpretParams();
    redraw();
    showOrHideElements();
  });

  replaceDivs();

  interpretParams();
  if (Object.keys(params).length == 0) {
    $("input[type=reset]").click();
    setParams();
  }
  selectPossibleBodyType();
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
      console.warn("name missing: ", name);
      return "No credits found for this graphic";
    }
    return creditEntry;
  });

  // set params and redraw when any radio button is clicked on
  $("input[type=radio]").each(function() {
    $(this).click(function() {
      const id = $(this).attr('id');
      if (id.startsWith("sex-")) {
        selectPossibleBodyType();
      }
      setParams();
      redraw();
      showOrHideElements();
    });
  });

  // // Do not multiple toggle when clicking on children
  // $("#chooser>ul>li>ul>li>ul>li").click(function(event) {
  //   event.stopPropagation();
  // });

  // // Toggle display of a list elements children when clicked
  // // Do not do so twice, once on label then on input
  // // Again, do not multiple toggle when clicking on children
  // $("#chooser>ul>li>ul>li").click(function(event) {
  //   if (!($(event.target).get(0).tagName == "LABEL")) {
  //     $(this).children("span").toggleClass("condensed").toggleClass("expanded");
  //     var $ul = $(this).children("ul");
  //     $ul.toggle('slow').promise().done(drawPreviews);
  //   }
  //   event.stopPropagation();
  // });

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
      document.getElementById("customFrames").value = "";
      params = {};
      jHash.val(params);
      selectPossibleBodyType();
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

  $(".generateSheetCredits").click(function() {
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
    $selectedAnim = $("#whichAnim>:selected");
    animRowStart = parseInt($selectedAnim.data("row"));
    animRowNum = parseInt($selectedAnim.data("num"));
    animRowFrames = parseInt($selectedAnim.data("cycle"));
    currentAnimationItemIndex = 0;
    const customFrames = document.getElementById("customFrames").value || "";
    if (customFrames !== "") {
      animationItems = customFrames.split(',').map(Number);
      if (animationItems.length > 0) {
        return;
      }
    }
    if ($selectedAnim.val() == "smash")  {
      animationItems = [5, 4, 1, 0];
    } else {
      for (var i = 1; i < animRowFrames; ++i) {
        animationItems.push(i);
      }
    }
  });

  $("#spritesheet,#previewAnimations").on('click',function(e) {
    $(this).toggleClass('zoomed')
  })

  function selectPossibleBodyType() {
    // if a body variant is selected which does not exist for the currently-selected 
    // getBodyTypeName, choose a default body variant for that bodyTypeName

    var bodyTypeName = getBodyTypeName();
    var bodyVariantNeedsReset = false;

    $("input[id^=body-]:checked").each(function() {
      var parent = $(this).closest("li[data-required]");
      if (parent.data("required")) {
        var requiredTypes = parent.data("required").split(",");
        if (!requiredTypes.includes(bodyTypeName)) {
          $(this).prop("checked", false);  
          bodyVariantNeedsReset = true;
        }
      }
    })

    if(bodyVariantNeedsReset) {
      let idToSelect = "";
      if (bodyTypeName == "male") {
        idToSelect = "body-Humanlike_white";
      } else if (bodyTypeName == "female") {
        idToSelect = "body-Humanlike_white";
      } else if (bodyTypeName == "child") {
        idToSelect = "body-Child_peach";
      } else if (bodyTypeName == "pregnant") {
        idToSelect = "body-Pregnant_coffee";
      } else if (bodyTypeName == "muscular") {
        idToSelect = "body-Muscular_muscular_white_v2";
      }
      $(`#${idToSelect}`).prop("checked", true);
    }
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

  function displayCredits() {
    let csv = parseCSV(sheetCredits.join('\n'))
    let out = csv.slice(1).map(function(row) {
      let urls = row.slice(4,9)
        .filter(function (x) { return !!x })
        .map(function (x) { return "    - " + x})
      return [`- ${row[0]}: by ${row[2]}. License(s): ${row[3]}. ${row[1]}`].concat(urls).join("\n")
    })
    $("textarea#creditsText").val(out.join("\n\n"));
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
          const oversize = $(this).data(`layer_${jdx}_oversize`);
          const fileName = $(this).data(`layer_${jdx}_${bodyTypeName}`);
          if (fileName !== "") {
            const itemToDraw = {};
            itemToDraw.fileName = fileName;
            itemToDraw.zPos = zPos;
            itemToDraw.oversize = oversize;
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

    oversize = false;
    var oversizeIdx = 0;
    for (item in itemsToDraw) {
      if (itemsToDraw[oversizeIdx].oversize !== undefined) {
        oversize = true;
        break;
      }
      oversizeIdx+=1;
    }

    if (oversize) {
      canvas.width = 1536;
      canvas.height = 1344 + 768;
      $(anim).addClass('oversize')
    } else {
      canvas.width = 832;
      canvas.height = 1344;
      $(anim).removeClass('oversize')
    }
    $("#chooser>ul").css("height", canvas.height);

    var itemIdx = 0;
    itemsToDraw.sort(function(lhs, rhs) {
      return parseInt(lhs.zPos) - parseInt(rhs.zPos);
    });

    for (item in itemsToDraw) {
      const fileName = itemsToDraw[itemIdx].fileName;
      const img = getImage(fileName);
      const oversize = itemsToDraw[itemIdx].oversize;
      if (oversize !== undefined) {
        if (oversize == "thrust") {
          for (var i = 0; i < 8; ++i)
          for (var j = 0; j < 4; ++j) {
            var imgData = ctx.getImageData(64 * i, 256 + 64 * j, 64, 64);
            ctx.putImageData(imgData, 64 + 192 * i, 1408 + 192 * j);
          }
        } else if (oversize == "slash") {
          for (var i = 0; i < 6; ++i)
          for (var j = 0; j < 4; ++j) {
            var imgData = ctx.getImageData(64 * i, 768 + 64 * j, 64, 64);
            ctx.putImageData(imgData, 64 + 192 * i, 1408 + 192 * j);
          }
        }
        ctx.drawImage(img, 0, 1344);
      } else {
        drawImage(ctx, img);
      }
      itemIdx+=1;
    }
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
    var result = null;
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
        var oversize = $(this).data("layer_1_oversize");
        prev.setAttribute("width", 64);
        prev.setAttribute("height", 64);
        var prevctx = prev.getContext("2d");
        var img = null;
        const previewRow = parseInt($(this).data("preview_row"));
        var callback = function(img) {
          try {
            if (oversize)
            prevctx.drawImage(img, 0, 2 * 192, 192, 192, 0, 0, 64, 64);
            else
            prevctx.drawImage(img, 0, previewRow * 64, 64, 64, 0, 0, 64, 64);
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
    currentAnimationItemIndex = (currentAnimationItemIndex + 1) % animationItems.length;
    animCtx.clearRect(0, 0, anim.width, anim.height);
    const currentFrame = animationItems[currentAnimationItemIndex];
    for (var i = 0; i < animRowNum; ++i) {
      if (oversize && (animRowStart === 4 || animRowStart === 12)) {
        animCtx.drawImage(canvas, currentFrame * 192, 1344 + (i*192), 192, 192, i * 192, 0, 192, 192);
      } else {
        animCtx.drawImage(canvas, currentFrame * 64, (animRowStart + i) * 64, 64, 64, i * 64, 0, 64, 64);
      }

    }
    setTimeout(nextFrame, 1000 / 8);
  }
});
