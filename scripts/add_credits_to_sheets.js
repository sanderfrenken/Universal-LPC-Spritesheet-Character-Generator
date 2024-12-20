const fs = require('fs');
var csv = fs.readFileSync('CREDITS.csv').toString();
eval(fs.readFileSync('sources/parse-csv.js')+'');
csv = parseCSV(csv);
function search(spriteSheet, csv) {
  for (var csvIndex = 0; csvIndex < csv.length; csvIndex++) {
    const creditsEntry = csv[csvIndex];
    const fileInCredit = creditsEntry[0].trim();
    if (fileInCredit === spriteSheet) {
      return creditsEntry;
    }
  }
  
  const index = spriteSheet.lastIndexOf("\/");
  if (index > -1) {
    return search(spriteSheet.substring(0, index), csv);
  } else {
    return undefined;
  }
}

fs.readdirSync('sheet_definitions').forEach(file => {
  if (!file.includes('.json')) {
    return
  }
  const definition = JSON.parse(fs.readFileSync(`sheet_definitions/${file}`));
  var spriteSheets = [];
  for (jdx =1; jdx < 10; jdx++) {
    const layerDefinition = definition[`layer_${jdx}`];
    if (layerDefinition !== undefined) {
      if (layerDefinition.male !== undefined) {
        spriteSheets.push(layerDefinition.male);
      }
      if (layerDefinition.female !== undefined) {
        spriteSheets.push(layerDefinition.female);
      }
      if (layerDefinition.muscular !== undefined) {
        spriteSheets.push(layerDefinition.muscular);
      }
      if (layerDefinition.teen !== undefined) {
        spriteSheets.push(layerDefinition.teen);
      }
      if (layerDefinition.pregnant !== undefined) {
        spriteSheets.push(layerDefinition.pregnant);
      }
      if (layerDefinition.child !== undefined) {
        spriteSheets.push(layerDefinition.child);
      }
    } else {
      break
    }
  }
  spriteSheets = [...new Set(spriteSheets)];
  var spriteSheetsWithVariants = [];
  const variants = definition.variants;
  for (var variantsIndex = 0; variantsIndex < variants.length; variantsIndex++) { 
    for (var spriteSheetIndex = 0; spriteSheetIndex < spriteSheets.length; spriteSheetIndex++) {
      const variantString = `${spriteSheets[spriteSheetIndex]}${variants[variantsIndex]}.png`
      spriteSheetsWithVariants.push(variantString)
    }
  }
  spriteSheets = spriteSheets.concat(spriteSheetsWithVariants);
  var creditEntries = [];
  for (var spriteSheetIndex = 0; spriteSheetIndex < spriteSheets.length; spriteSheetIndex++) {
    const spriteSheet = spriteSheets[spriteSheetIndex].trim().replace(/\/$/, ''); // Remove trailing slash
    const searchResult = search(spriteSheet, csv);
    if (searchResult === undefined) {
      console.log('miss for', spriteSheet);
    } else {
      const authors = searchResult[2]
      const licenses = searchResult[3]
      if (authors !== "" && licenses !== "") {
        if (creditEntries.length <= 0) {
          creditEntries.push(searchResult);
        }
        var alreadyAdded = false;
        for (var creditEntriesIndex = 0; creditEntriesIndex < creditEntries.length; creditEntriesIndex++) {
          if (creditEntries[creditEntriesIndex][0] === searchResult[0]) {
            alreadyAdded = true;
            break;
          }
          if (searchResult[0].includes(".png") && searchResult[0].includes(creditEntries[creditEntriesIndex][0])) {
            
            if (authors === creditEntries[creditEntriesIndex][2] && licenses === creditEntries[creditEntriesIndex][3]) {
              alreadyAdded = true;
              break;
            }
          }
        }
        if (!alreadyAdded) {
          creditEntries.push(searchResult);
        }
      }
    }
  }
  var credits = [];
  for (var creditEntriesIndex = 0; creditEntriesIndex < creditEntries.length; creditEntriesIndex++) {
    const links = [];
    
    const creditsEntry = creditEntries[creditEntriesIndex];
    var credit = {};
    credit.file = creditsEntry[0];
    credit.notes = creditsEntry[1].trim();
    credit.authors = creditsEntry[2].split(",").map(function(item) {
      return item.trim();
    });;
    credit.licenses = creditsEntry[3].split(",").map(function(item) {
      return item.trim();
    });;
    var urls = [];
    for (var urlIdx = 0; urlIdx < 10; urlIdx++) {
      const url = creditsEntry[4+urlIdx].trim();
      if (url !== "") {
        urls.push(url);
      }
    }
    credit.urls = urls;
    credits.push(credit);
  }
  definition.credits = credits;
  fs.writeFileSync(`sheet_definitions/${file}`, JSON.stringify(definition, null, 2), function(err) { });
});