// Require the module
var FitParser = require('fit-file-parser').default;

// Read a .FIT file
var fs = require('fs');
fs.readFile('./LDN_1353_Light_Light_001.fits', function (err, content) {

  // Create a FitParser instance (options argument is optional)
  var fitParser = new FitParser({
    force: true,
    speedUnit: 'km/h',
    lengthUnit: 'km',
    temperatureUnit: 'celsius',
    elapsedRecordField: true,
    mode: 'cascade',
  });
  
  // Parse your file
  fitParser.parse(content, function (error, data) {
  
    // Handle result of parse method
    if (error) {
      console.log(error);
    } else {
      console.log(JSON.stringify(data));
    }
    
  });
  
});