// NDVI - AgriVision 

// Define the area of interest with the provided polygon coordinates.
var aoi = ee.Geometry.Polygon([
  [[76.32, 9.62],
   [76.68, 9.62],
   [76.68, 9.28],
   [76.32, 9.28]]
]);

// Function to export NDVI for a given month and year
var exportNDVI = function(year, month) {
  var startDate = ee.Date.fromYMD(year, month, 1);
  var endDate = startDate.advance(1, 'month');
  
  // Load the Sentinel-2 ImageCollection for the given date range and area of interest.
  // Filter for less than 10% cloud cover.
  // Sentinel-2's NIR and Red bands are B8 and B4, respectively.
  var imageCollection = ee.ImageCollection('COPERNICUS/S2')
      .filterDate(startDate, endDate)
      .filterBounds(aoi)
      .filter(ee.Filter.lte('CLOUDY_PIXEL_PERCENTAGE', 100)) // Cloud cover filter
      .select(['B8', 'B4']); // Select the NIR and Red bands.

  // Compute NDVI for each image in the collection.
  var ndviCollection = imageCollection.map(function(image) {
    var ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI');
    return image.addBands(ndvi);
  });

  // Composite the NDVI images by taking the median value for each pixel.
  var ndviComposite = ndviCollection.median().select('NDVI');

  // Check if the collection is empty
  var count = ndviCollection.size().getInfo();
  if (count === 0) {
    print('No images found for', year, month);
    return;
  }

  // Define the export task for NDVI composite image
  var imageId = 'Sentinel2_NDVI_100P_' + year + '_' + month;

  // Export the NDVI composite image to Google Drive.
  Export.image.toDrive({
    image: ndviComposite.clip(aoi),
    description: imageId,
    scale: 10, // Sentinel-2's resolution for these bands is 10m
    region: aoi,
    folder: 'MSLA-Agri',
    maxPixels: 1e9
  });
};

// Loop through the years and months to export NDVI
var years = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];
var months = [5, 6, 7, 8, 9]; // May to September

years.forEach(function(year) {
  months.forEach(function(month) {
    exportNDVI(year, month);
  });
});

