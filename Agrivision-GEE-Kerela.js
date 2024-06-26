// This script works - one at a time 

// Define the area of interest with the provided polygon coordinates.
var aoi = ee.Geometry.Polygon([
  [[76.32, 9.62],
   [76.68, 9.62],
   [76.68, 9.28],
   [76.32, 9.28]]
]);

// Define the date range.
var startDate = '2017-05-01';
var endDate = '2017-05-31';

// Load the Sentinel-2 ImageCollection for the given date range and area of interest.
// Filter for less than 10% cloud cover.
// Sentinel-2's NIR and Red bands are B8 and B4, respectively.
var imageCollection = ee.ImageCollection('COPERNICUS/S2')
    .filterDate(startDate, endDate)
    .filterBounds(aoi)
    .filter(ee.Filter.lte('CLOUDY_PIXEL_PERCENTAGE', 25)) // Cloud cover filter
    .select(['B8', 'B4']); // Select the NIR and Red bands.

// Compute NDVI for each image in the collection.
var ndviCollection = imageCollection.map(function(image) {
  var ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI');
  return image.addBands(ndvi);
});

// Composite the NDVI images by taking the median value for each pixel.
var ndviComposite = ndviCollection.median().select('NDVI');

// Export the NDVI composite image to Google Drive.
Export.image.toDrive({
  image: ndviComposite.clip(aoi),
  description: 'SWI_Sentinel2_NDVI_Composite_May_2017',
  scale: 10, // Sentinel-2's resolution for these bands is 10m
  region: aoi,
  folder: 'MSLA-Agri',
  maxPixels: 1e9
});


