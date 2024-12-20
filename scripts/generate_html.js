const fs = require('fs');
const readline = require('readline');

function searchCredit(fileName, credits, origFileName) {
  if (credits.count <= 0) {
    console.error("no credits for filename:", fileName);
    return undefined;
  }
  if (credits.count === 1) {
    if (!credits[0].file.includes(fileName)) {
      console.error("Wrong credit at filename:", fileName);
    }
    return undefined;
  }

  for (var creditsIndex = 0; creditsIndex < credits.length; creditsIndex++) {
    const credit = credits[creditsIndex];
    if (credit.file === fileName || credit.file === fileName + ".png" || credit.file + "/" === fileName) {
      return credit;
    }
  }
  
  const index = fileName.lastIndexOf("\/");
  if (index > -1) {
    return searchCredit(fileName.substring(0, index), credits, origFileName);
  } else {
    console.error("missing credit after searching recursively filename:", origFileName);
    return undefined;
  }
}

function generateListHTML(json) {
  const definition = JSON.parse(fs.readFileSync(`sheet_definitions/${json}`));
  const variants = definition.variants
  const name = definition.name
  const typeName = definition.type_name
  const credits = definition.credits
  const defaultAnimations = ['spellcast', 'thrust', 'walk', 'slash', 'shoot', 'hurt', 'watering'];

  var requiredSexes = [];
  var animations = [];
  var previewRow = 10;
  var previewColumn = 0;
  var previewXOffset = 0;
  var previewYOffset = 0;

  if (definition.preview_row !== undefined) {
    previewRow = definition.preview_row
  }
  if (definition.preview_column !== undefined){
    previewColumn = definition.preview_column;
  }
  if (definition.preview_x_offset !== undefined){
    previewXOffset = definition.preview_x_offset;
  }
  if (definition.preview_y_offset !== undefined){
    previewYOffset = definition.preview_y_offset;
  }

  if (definition.animations !== undefined) {
    animations = definition.animations
  } else {
    animations = defaultAnimations
  }

  if (definition.layer_1.male !== undefined) {
    requiredSexes.push("male");
  }
  if (definition.layer_1.female !== undefined) {
    requiredSexes.push("female");
  }
  if (definition.layer_1.teen !== undefined) {
    requiredSexes.push("teen");
  }
  if (definition.layer_1.child !== undefined) {
    requiredSexes.push("child");
  }
  if (definition.layer_1.muscular !== undefined) {
    requiredSexes.push("muscular");
  }
  if (definition.layer_1.pregnant !== undefined) {
    requiredSexes.push("pregnant");
  }

  const requiredSex = requiredSexes.join(",");
  const supportedAnimations = animations.join(",");

  const startHTML = `<li data-required="[REQUIRED_SEX]" data-animations="[SUPPORTED_ANIMATIONS]"><span class="condensed">${name}</span><ul>`.replace("[REQUIRED_SEX]", requiredSex).replace("[SUPPORTED_ANIMATIONS]", supportedAnimations);
  const templateHTML = fs.readFileSync("scripts/template-general.html", 'utf8');

  const endHTML = '</ul></li>';

  var idx = 0;
  var listItemsHTML = `<li><input type="radio" id="${typeName}-none" name="${typeName}"> <label for="${typeName}-none">No ${typeName}</label></li>`;
  for (variant in variants) {
    const itemName = variants[idx];
    const itemIdFor = typeName + "-" + name.replaceAll(" ", "_") +  "_" + itemName.replaceAll(" ", "_");
    var matchBodyColor = false;
    if (definition[`match_body_color`] !== undefined) {
      matchBodyColor = true;
    }
    var dataFiles = "";
    var sexIdx = 0;
    for (sex in requiredSexes) {
      for (jdx =1; jdx < 10; jdx++) {
        const layerDefinition = definition[`layer_${jdx}`];
        if (layerDefinition !== undefined) {
          if (sexIdx === 0) {
            const zPos = definition[`layer_${jdx}`].zPos;
            dataFiles += "data-preview_row=" + previewRow + " data-preview_column=" + previewColumn + " data-preview_x_offset=" + previewXOffset + " data-preview_y_offset=" + previewYOffset +  " data-layer_" + jdx + "_zpos=" + zPos + " ";
            const custom_animation = layerDefinition.custom_animation;
            if (custom_animation !== undefined) {
              dataFiles += `data-layer_${jdx}_custom_animation=` + custom_animation + " "
            }
          }
          const file = layerDefinition[requiredSexes[sexIdx]]
          if (file !== null && file !== "") {
            const imageFileName = "\"" + file + itemName.replaceAll(" ", "_") + ".png\" ";
            const fileNameForCreditSearch = file + itemName.replaceAll(" ", "_");
            dataFiles += "data-layer_" + jdx + "_" + requiredSexes[sexIdx] + "=" + imageFileName;
            const creditToUse = searchCredit(fileNameForCreditSearch, credits, fileNameForCreditSearch);
            if (creditToUse !== undefined) {
              const licenses = "\"" + creditToUse.licenses.join(',') + "\"";
              dataFiles += "data-layer_" + jdx + "_" + requiredSexes[sexIdx] + "_licenses=" + licenses;
              const authors = "\"" + creditToUse.authors.join(',') + "\"";
              dataFiles += "data-layer_" + jdx + "_" + requiredSexes[sexIdx] + "_authors=" + authors;
              const urls = "\"" + creditToUse.urls.join(',') + "\"";
              dataFiles += "data-layer_" + jdx + "_" + requiredSexes[sexIdx] + "_urls=" + urls;
              const notes = "\"" + creditToUse.notes + "\"";
              dataFiles += "data-layer_" + jdx + "_" + requiredSexes[sexIdx] + "_notes=" + notes;
            } else {
              console.warn("missing credit inside", json);
            }
          }
        } else {
          break;
        }
      }
      sexIdx += 1;
    }
    listItemsHTML += templateHTML
      .replaceAll("[ID_FOR]", itemIdFor)
      .replaceAll("[TYPE_NAME]", typeName)
      .replaceAll("[NAME]", itemName)
      .replaceAll("[PARENT_NAME]", name)
      .replaceAll("[MATCH_BODY_COLOR]", matchBodyColor)
      .replaceAll("[VARIANT]", itemName)
      .replaceAll("[DATA_FILE]", dataFiles);
    idx += 1;
  }
  return startHTML + listItemsHTML + endHTML;
}

var lineReader = require('readline').createInterface({
  input: fs.createReadStream('source_index.html')
});
var htmlGenerated = '<!-- THIS FILE IS AUTO-GENERATED. PLEASE DONT ALTER IT MANUALLY -->\n';

lineReader.on('line', function (line) {
  if (line.includes('div_sheet_')) {
    const definition = line.replace("div_sheet_","");
    const newLine = generateListHTML(`${definition}.json`.replaceAll("\t", ""))
    htmlGenerated+=newLine+"\n";
  } else {
    htmlGenerated+=line+"\n";
  }
});

lineReader.on('close', function (line) {
  fs.writeFile('index.html', htmlGenerated, function(err) {
            if (err) {
                return console.log(err);
            } else {
                console.log('Updated!');
            }
    });
});
