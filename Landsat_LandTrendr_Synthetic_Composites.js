// An imported geometry
var aoi = CO_aoi2;
// A name to append to export (mod_reg for model region)
var mod_reg = "colorado_forest2";

// load the LandTrendr.js module
var ltgee = require('users/emaprlab/public:Modules/LandTrendr.js');

// define parameters
var startYear = 1986;
var endYear = 2024;
var startDay = '07-01';
var endDay = '09-30';
var index = 'TCW';  // Primary index for LandTrendr
var ftvList = ['B1', 'B2', 'B3', 'B4', 'B5',
'B7', 'NDVI', 'NBR', 'NDMI', 'TCB', 'TCG', 'TCW', 'TCA'];
var maskThese = ['cloud', 'shadow', 'snow', 'water'];

Map.addLayer(aoi, {}, "polygon");
Map.centerObject(aoi, 8);

// These params seem reasonable from 
//https://www.sciencedirect.com/science/article/pii/S0034425710002245
var run_params = { 
  maxSegments: 4,
  spikeThreshold: 0.75,
  vertexCountOvershoot: 3,
  preventOneYearRecovery: true,
  recoveryThreshold: 0.25,
  pvalThreshold: 0.05,
  bestModelProportion: 0.75,
  minObservationsNeeded: 6
};

// Function to get year band names
var getYearBandNames = function(startYear, endYear){
  var years = [];
  for (var i = startYear; i <= endYear; ++i) years.push("yr_" + i.toString());
  return years;
};

// Function to get fitted data
var getFittedData = function(lt, startYear, endYear, index){
  var bandNames = getYearBandNames(startYear, endYear);
  var search = 'ftv_' + index.toLowerCase() + '_fit';
  
  return lt.select(search)
           .arrayFlatten([bandNames]);
};

// Run LandTrendr once
var lt = ltgee.runLT(startYear, endYear, startDay, endDay, aoi, index, ftvList, run_params, maskThese);
print(lt, "LandTrendr output");

// Iterate over each index in ftvList to extract and export fitted values
ftvList.forEach(function(currentIndex) {
  // Get fitted data for current index
  var fitImg = getFittedData(lt, startYear, endYear, currentIndex);
  

  // Create export task
  Export.image.toDrive({
    image: fitImg.clip(aoi),
    description: 'LT_Fitted_' + currentIndex + '_' + startYear + '_' + endYear + '_' + mod_reg,
    folder: 'LandTrendr_Outputs',
    scale: 30,  // Landsat resolution
    region: aoi,
    crs: 'EPSG:5070',
    crsTransform: [30.0, 0.0, 4.004536, 0.0, -30.0, -13.497535],
    maxPixels: 1e13,
    fileFormat: 'GeoTiff'
  });
  
  // Add the most recent year to the map for visualization
  var vizParams = {
    min: currentIndex === 'B4' ? 250 : 0,  // Adjust visualization based on index
    max: currentIndex === 'B4' ? 550 : 1,
    palette: ['red', 'yellow', 'green']
  };
  
  Map.addLayer(fitImg.select('yr_' + endYear), vizParams, currentIndex + ' ' + endYear);
});

